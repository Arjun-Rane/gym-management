// pages/api/members/me.js
import { supabase } from '@/lib/supabaseClient'

export default async function handler(req, res) {
  // 1. Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // 2. Get Supabase JWT from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Missing auth token' })
  }

  // 3. Get the user info from token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // 4. Fetch user profile from 'members' table (based on their UID)
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('*')
    .eq('id', user.id)
    .single()

  if (memberError) {
    return res.status(500).json({ error: memberError.message })
  }

  // 5. Return their profile
  return res.status(200).json({ member })
}
