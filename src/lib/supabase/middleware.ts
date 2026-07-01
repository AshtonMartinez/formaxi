import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Routes an unauthenticated visitor may reach: the auth pages plus the
// public read-only browsing surface (root landing, standings, discover).
// Everything else redirects to /login.
const PUBLIC_PATHS = ["/login", "/signup", "/", "/standings", "/discover"];

// Auth pages a signed-in user should be bounced away from (into the app).
// A subset of PUBLIC_PATHS — the rest of the public surface stays viewable
// while logged in.
const AUTH_PATHS = ["/login", "/signup"];

const matchesPath = (pathname: string, paths: string[]) =>
  paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// Refreshes the Supabase auth session, forwards the updated cookies on the
// response, and gates access: unauthenticated users are sent to /login, and
// signed-in users on the auth pages are sent into the app. Invoked from the
// Next.js 16 proxy (formerly middleware) at src/proxy.ts on every matched
// request.
export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and getUser(). A
  // simple mistake here can make it very hard to debug random session logouts.
  // getUser() revalidates the token and triggers the cookie refresh above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = matchesPath(pathname, PUBLIC_PATHS);
  const isAuthPage = matchesPath(pathname, AUTH_PATHS);

  // Carry the freshly-refreshed session cookies onto any redirect we return so
  // the browser and server stay in sync.
  const redirectTo = (target: string) => {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  // Unauthenticated and trying to reach a protected route → send to login.
  if (!user && !isPublic) {
    return redirectTo("/login");
  }

  // Already signed in but sitting on login/signup → send into the app.
  if (user && isAuthPage) {
    return redirectTo("/standings");
  }

  return supabaseResponse;
};
