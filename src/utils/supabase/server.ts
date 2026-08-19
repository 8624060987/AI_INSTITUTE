import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_URL = 'https://stkcgemeowrjavcuuyqa.supabase.co'
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0a2NnZW1lb3dyamF2Y3V1eXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder'

export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

  if (!key || key.startsWith('sb_publishable_') || !key.startsWith('eyJ')) {
    key = DEFAULT_ANON_KEY
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component ignore
          }
        },
      },
    }
  )
}
