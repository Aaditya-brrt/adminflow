import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  return Response.redirect(new URL('/', request.url))
} 