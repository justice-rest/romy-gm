"use client"

import { useUserPreferences } from "@/lib/user-preference-store/provider"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeSelection() {
  const { theme: nextTheme, setTheme: setNextTheme } = useTheme()
  const { preferences, setTheme: setDbTheme } = useUserPreferences()
  const [selectedTheme, setSelectedTheme] = useState(nextTheme || "system")

  // Sync next-themes with database preferences on mount
  useEffect(() => {
    if (preferences.theme && preferences.theme !== nextTheme) {
      setNextTheme(preferences.theme)
      setSelectedTheme(preferences.theme)
    }
  }, [preferences.theme, nextTheme, setNextTheme])

  const themes = [
    { id: "system", name: "System", colors: ["#ffffff", "#1a1a1a"] },
    { id: "light", name: "Light", colors: ["#ffffff"] },
    { id: "dark", name: "Dark", colors: ["#1a1a1a"] },
  ]

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId)
    // Update next-themes for immediate UI change
    setNextTheme(themeId)
    // Update database for persistence (for authenticated users) or localStorage (for guests)
    setDbTheme(themeId as "light" | "dark" | "system")
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">Theme</h4>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleThemeChange(theme.id)}
            className={`rounded-lg border p-3 ${
              selectedTheme === theme.id
                ? "border-primary ring-primary/30 ring-2"
                : "border-border"
            }`}
          >
            <div className="mb-2 flex space-x-1">
              {theme.colors.map((color, i) => (
                <div
                  key={i}
                  className="border-border h-4 w-4 rounded-full border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <p className="text-left text-sm font-medium">{theme.name}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
