import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      // Get user data from auth tables
      const user = await ctx.db.get(userId);
      if (!user) return;

      // Call internal mutation to create/update profile
      await ctx.runMutation(internal.users.mutation.syncProfile, {
        userId,
        name: user.name ?? undefined,
        image: user.image ?? undefined,
      });

      // Sync OAuth account from accounts table (created by @convex-dev/auth)
      // Note: Using filter() as the auth tables don't expose their indexes to TypeScript
      const authAccount = await ctx.db
        .query("accounts")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (authAccount && user.email) {
        await ctx.runMutation(internal.oauth.mutation.syncOAuthAccount, {
          userId,
          provider: "github",
          providerUserId: authAccount.providerAccountId,
          email: user.email,
          displayName: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
        });
      }
    },
  },
});
