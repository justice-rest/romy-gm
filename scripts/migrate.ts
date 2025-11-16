#!/usr/bin/env npx tsx
import * as fs from "fs"
import * as path from "path"

const MIGRATIONS_DIR = path.join(process.cwd(), "migrations")

async function getMigrationFiles(): Promise<string[]> {
  const files = fs.readdirSync(MIGRATIONS_DIR)
  return files
    .filter((file) => file.endsWith(".sql"))
    .sort()
}

async function generateCombinedMigration(): Promise<void> {
  console.log("📦 Preparing database migrations...")
  console.log("")

  const migrationFiles = await getMigrationFiles()
  console.log(`Found ${migrationFiles.length} migration files:`)
  migrationFiles.forEach((m) => console.log(`  - ${m}`))
  console.log("")

  // Combine all migrations into a single SQL file
  const combinedSql: string[] = [
    "-- Combined Database Migrations for Rōmy (Zola)",
    `-- Generated: ${new Date().toISOString()}`,
    "-- Run this SQL in your Supabase SQL Editor",
    "",
    "BEGIN;",
    "",
  ]

  for (const filename of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, filename)
    const sql = fs.readFileSync(filePath, "utf-8")

    combinedSql.push(`-- ========================================`)
    combinedSql.push(`-- Migration: ${filename}`)
    combinedSql.push(`-- ========================================`)
    combinedSql.push("")
    combinedSql.push(sql)
    combinedSql.push("")
  }

  combinedSql.push("COMMIT;")
  combinedSql.push("")

  const outputPath = path.join(process.cwd(), "migrations", "combined_migration.sql")
  fs.writeFileSync(outputPath, combinedSql.join("\n"))

  console.log(`✓ Combined migration file created: migrations/combined_migration.sql`)
  console.log("")
  console.log("Next steps:")
  console.log("1. Go to your Supabase Dashboard")
  console.log("2. Navigate to SQL Editor")
  console.log("3. Copy the contents of migrations/combined_migration.sql")
  console.log("4. Paste and run in the SQL Editor")
  console.log("")
  console.log("Or use Supabase CLI:")
  console.log("  npx supabase db push")
  console.log("")
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0] || "generate"

  switch (command) {
    case "generate":
      await generateCombinedMigration()
      break
    case "list":
      const files = await getMigrationFiles()
      console.log("Available migrations:")
      files.forEach((f) => console.log(`  - ${f}`))
      break
    default:
      console.log("Usage: npm run migrate [command]")
      console.log("")
      console.log("Commands:")
      console.log("  generate  - Generate combined SQL migration file (default)")
      console.log("  list      - List all migration files")
  }
}

main().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
