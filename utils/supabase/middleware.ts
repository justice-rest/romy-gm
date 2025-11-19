import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  if (!isSupabaseEnabled) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  // Note: This validates the session but we optimize by only checking cookies
  // The actual user data is fetched client-side after initial render

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login page
  // Allow access to auth routes, API routes, and static files
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth")
  const isApiRoute = request.nextUrl.pathname.startsWith("/api")
  const isStaticRoute =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".")

  if (!user && !isAuthRoute && !isApiRoute && !isStaticRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    const redirectResponse = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value)
    })
    return redirectResponse
  }

  // Optimized: Check onboarding status from JWT claims instead of database query
  // The onboarding_completed status should be stored in user metadata during onboarding
  if (user && !request.nextUrl.pathname.startsWith("/onboarding")) {
    // Skip onboarding check for auth, API, and static routes
    if (!isAuthRoute && !isApiRoute && !isStaticRoute) {
      // Check user metadata first (no DB query needed)
      const onboardingCompleted = user.user_metadata?.onboarding_completed

      // Only query database if metadata is not set (fallback for existing users)
      if (onboardingCompleted === undefined) {
        const { data: userData } = await supabase
          .from("users")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single()

        if (userData && !userData.onboarding_completed) {
          const url = request.nextUrl.clone()
          url.pathname = "/onboarding"
          const redirectResponse = NextResponse.redirect(url)
          supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value)
          })
          return redirectResponse
        }
      } else if (!onboardingCompleted) {
        // Fast path: use metadata without database query
        const url = request.nextUrl.clone()
        url.pathname = "/onboarding"
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
