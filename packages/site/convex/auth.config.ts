export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL as string,
      applicationID: "convex",
    },
  ],
} as const;
