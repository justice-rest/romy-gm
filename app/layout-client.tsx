"use client"

import { API_ROUTE_CSRF } from "@/lib/routes"
import { useEffect } from "react"

export function LayoutClient() {
  useEffect(() => {
    // Prefetch CSRF token in the background (non-blocking)
    // This runs after the initial render, not during it
    const timer = setTimeout(() => {
      fetch(API_ROUTE_CSRF).catch(() => {
        // Silent fail - CSRF will be fetched on first mutation if this fails
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
