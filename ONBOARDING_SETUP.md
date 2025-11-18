# Onboarding System Setup

This document describes the onboarding flow implementation for Rōmy.

## Overview

The onboarding system collects information from new users to personalize their experience with Rōmy. This data is then made available to the LLM to provide more contextual and relevant responses.

## Files Created

### Database Layer

1. **`/migrations/003_onboarding_data.sql`**
   - Creates `onboarding_data` table to store user responses
   - Adds `onboarding_completed` and `onboarding_completed_at` fields to `users` table
   - Sets up RLS (Row Level Security) policies
   - Includes automatic `updated_at` timestamp trigger

2. **`/app/types/database.types.ts`** (modified)
   - Added TypeScript types for `onboarding_data` table
   - Updated `users` table types with onboarding fields

### API Layer

3. **`/app/api/onboarding/route.ts`**
   - `GET /api/onboarding` - Fetches user's onboarding data
   - `POST /api/onboarding` - Saves onboarding responses and marks user as completed

### UI Components

4. **`/app/onboarding/onboarding-form.tsx`**
   - Typeform-like animated form component
   - 9 questions with progress tracking
   - Motion animations using `motion/react`
   - Keyboard navigation support (Enter to continue)
   - Responsive design matching existing Rōmy styles

5. **`/app/onboarding/page.tsx`**
   - Main onboarding page
   - Checks if user has already completed onboarding
   - Redirects to home after completion
   - Handles authentication checks

### Authentication & Routing

6. **`/app/auth/callback/route.ts`** (modified)
   - Redirects new users to onboarding after signup
   - Checks existing users' onboarding status

7. **`/utils/supabase/middleware.ts`** (modified)
   - Middleware check to redirect incomplete users to onboarding
   - Prevents access to app until onboarding is complete
   - Excludes auth, API, and static routes from check

### Helper Functions

8. **`/lib/onboarding/api.ts`**
   - `getOnboardingData()` - Fetches user's onboarding data
   - `formatOnboardingContextForLLM()` - Formats data for LLM context
   - `getOnboardingContextForLLM()` - Combined fetch + format function

## Onboarding Questions

Based on [flow.md](flow.md:1-11), the following questions are asked:

1. **First Name** - Text input
2. **Nonprofit Name** - Text input
3. **Location** - Text input (City/State or Country)
4. **Sector** - Multiple choice selection
5. **Annual Budget** - Range selection
6. **Donor Count** - Range selection
7. **Fundraising Primary** - Yes/No
8. **Prior Tools** - Multi-select checkboxes
9. **Purpose** - Long text area

## Database Schema

### `onboarding_data` Table

```sql
CREATE TABLE onboarding_data (
  user_id UUID PRIMARY KEY,
  first_name TEXT,
  nonprofit_name TEXT,
  nonprofit_location TEXT,
  nonprofit_sector TEXT,
  annual_budget TEXT,
  donor_count TEXT,
  fundraising_primary BOOLEAN,
  prior_tools TEXT[],
  purpose TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### `users` Table Additions

```sql
ALTER TABLE users
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

## Using Onboarding Data in LLM Conversations

To include user context in LLM prompts:

```typescript
import { getOnboardingContextForLLM } from "@/lib/onboarding/api"

// In your chat/completion handler
const userContext = await getOnboardingContextForLLM()

const systemPrompt = `
You are Rōmy, a helpful AI assistant for nonprofit fundraising.

${userContext}

Please use this context to personalize your responses.
`
```

Example formatted context:

```
# User Context
User's name: Sarah
Works with: Animal Rescue Foundation
Organization location: San Francisco, CA
Sector: Animal Welfare
Annual budget: $500K - $1M
Number of individual donors: 1,000 - 5,000
Fundraising is their primary responsibility
Previous experience with: WealthEngine, iWave
Their goal with Rōmy: Identify major donor prospects more efficiently
```

## Flow Diagram

```
New User Login
    ↓
Auth Callback
    ↓
Check: onboarding_completed?
    ↓
   NO → Redirect to /onboarding
    ↓
Onboarding Form (9 steps)
    ↓
Submit via POST /api/onboarding
    ↓
Save to onboarding_data table
    ↓
Mark user.onboarding_completed = true
    ↓
Redirect to /
    ↓
Access App
```

## Middleware Protection

The middleware ensures users cannot access the app without completing onboarding:

- ✅ Allows: `/auth/*`, `/api/*`, static files
- ❌ Blocks: All other routes until `onboarding_completed = true`
- 🔄 Redirects to: `/onboarding`

## Running the Migration

To apply the database migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase Dashboard
# Copy contents of migrations/003_onboarding_data.sql
# Paste into SQL Editor and run
```

## Styling & Components Used

The onboarding form uses:

- **shadcn/ui components**: Input, Textarea, Button, Label, Checkbox, Select
- **Motion primitives**: AnimatePresence, motion from `motion/react`
- **Phosphor Icons**: CaretLeft, Check
- **Tailwind CSS**: Matching existing Rōmy color scheme (oklch colors)
- **Responsive design**: Mobile-first with sm: breakpoints

## Customization

### Adding More Questions

1. Add field to `onboarding_data` table in migration
2. Update TypeScript types in `database.types.ts`
3. Add form state in `onboarding-form.tsx`
4. Create new step in `AnimatePresence` block
5. Update `TOTAL_QUESTIONS` constant
6. Add field to `formatOnboardingContextForLLM()` function

### Changing Question Order

Reorder the step conditions in the `AnimatePresence` block in `onboarding-form.tsx`.

### Styling Modifications

Update classes in `onboarding-form.tsx` to match your design system. The component uses Tailwind utility classes and follows the existing color variables from `globals.css`.

## Testing

1. Create a new user account
2. Should be redirected to `/onboarding` after login
3. Complete all 9 steps
4. Should be redirected to `/`
5. Refresh page - should not see onboarding again
6. Check Supabase: `onboarding_data` table should have your responses

## Troubleshooting

### User stuck in onboarding loop

Check database:
```sql
SELECT onboarding_completed FROM users WHERE id = 'user-uuid';
```

Manually complete:
```sql
UPDATE users SET onboarding_completed = true WHERE id = 'user-uuid';
```

### Onboarding data not saving

- Check browser console for API errors
- Verify Supabase RLS policies are enabled
- Ensure user is authenticated

### Middleware not redirecting

- Check that `isSupabaseEnabled = true`
- Verify middleware matcher config in `middleware.ts`
- Clear browser cookies and try again

## Future Enhancements

- [ ] Add "Skip" option for optional questions
- [ ] Allow users to edit onboarding data from settings
- [ ] Add analytics to track completion rates
- [ ] Implement multi-language support
- [ ] Add onboarding data to user profile page
- [ ] Create admin dashboard to view aggregated onboarding insights
