/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as comments_mutation from "../comments/mutation.js";
import type * as comments_query from "../comments/query.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as featureRequests_mutation from "../featureRequests/mutation.js";
import type * as featureRequests_query from "../featureRequests/query.js";
import type * as files_index from "../files/index.js";
import type * as files_mutation from "../files/mutation.js";
import type * as http from "../http.js";
import type * as lemon_squeezy_webhook from "../lemon_squeezy/webhook.js";
import type * as lib_mentions from "../lib/mentions.js";
import type * as notifications_mutation from "../notifications/mutation.js";
import type * as notifications_query from "../notifications/query.js";
import type * as oauth_mutation from "../oauth/mutation.js";
import type * as oauth_query from "../oauth/query.js";
import type * as posts_mutation from "../posts/mutation.js";
import type * as posts_query from "../posts/query.js";
import type * as pro_mutation from "../pro/mutation.js";
import type * as pro_query from "../pro/query.js";
import type * as users_mutation from "../users/mutation.js";
import type * as users_query from "../users/query.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "comments/mutation": typeof comments_mutation;
  "comments/query": typeof comments_query;
  constants: typeof constants;
  crons: typeof crons;
  "featureRequests/mutation": typeof featureRequests_mutation;
  "featureRequests/query": typeof featureRequests_query;
  "files/index": typeof files_index;
  "files/mutation": typeof files_mutation;
  http: typeof http;
  "lemon_squeezy/webhook": typeof lemon_squeezy_webhook;
  "lib/mentions": typeof lib_mentions;
  "notifications/mutation": typeof notifications_mutation;
  "notifications/query": typeof notifications_query;
  "oauth/mutation": typeof oauth_mutation;
  "oauth/query": typeof oauth_query;
  "posts/mutation": typeof posts_mutation;
  "posts/query": typeof posts_query;
  "pro/mutation": typeof pro_mutation;
  "pro/query": typeof pro_query;
  "users/mutation": typeof users_mutation;
  "users/query": typeof users_query;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
