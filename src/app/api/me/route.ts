import { withSupabase } from "@supabase/server";

// Example Next.js 16 App Router route handler using the @supabase/server SDK.
//
// `withSupabase` returns a standard `(req: Request) => Promise<Response>`, so in
// the App Router you assign it directly to the HTTP-method export — there is no
// Deno-style `export default { fetch }` here.
//
// `auth: "user"` requires a valid Supabase JWT in `Authorization: Bearer <token>`
// (verified against SUPABASE_JWKS_URL). The handler only runs after auth succeeds.
//
// ctx.supabase      → client scoped to the caller's identity (RLS enforced)
// ctx.supabaseAdmin → client that BYPASSES RLS (use sparingly, server-only)
// ctx.userClaims    → JWT-derived identity
export const GET = withSupabase({ auth: "user" }, async (_req, ctx) => {
  return Response.json({ user: ctx.userClaims });
});
