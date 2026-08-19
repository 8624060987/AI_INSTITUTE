import { createBrowserClient } from '@supabase/ssr'

const DEFAULT_URL = 'https://stkcgemeowrjavcuuyqa.supabase.co'
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0a2NnZW1lb3dyamF2Y3V1eXFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAxNTAwMDAwMH0.placeholder'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

  // If key is not a valid JWT (e.g. starts with sb_publishable_), fallback to DEFAULT_ANON_KEY to avoid Unauthorized MCP / init error
  if (!key || key.startsWith('sb_publishable_') || !key.startsWith('eyJ')) {
    key = DEFAULT_ANON_KEY
  }

  return createBrowserClient(url, key)
}
