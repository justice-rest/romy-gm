import { getUserProfile } from "@/lib/user/api"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const userProfile = await getUserProfile()
    return NextResponse.json(userProfile)
  } catch (error) {
    console.error("Failed to fetch user profile:", error)
    return NextResponse.json(null, { status: 500 })
  }
}
