import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Types
interface Member {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  phone: string;
  email: string;
  address?: string;
  health_issues?: string;
  subscription_plan_id?: string;
  subscription_start_date?: string;
  subscription_expiry_date?: string;
  last_fee_paid_date?: string;
  created_at: string;
  updated_at: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// JWT validation for member authentication
const validateMemberToken = async (request: NextRequest): Promise<string | null> => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verify(token, process.env.JWT_SECRET!) as { memberId: string };
    return decoded.memberId;
  } catch (error) {
    return null;
  }
};

// Error response helper
const errorResponse = (message: string, status: number = 400) => {
  return NextResponse.json({ error: message }, { status });
};

// Success response helper
const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

// GET - Fetch current member's profile
export async function GET(request: NextRequest) {
  try {
    // Validate member token
    const memberId = await validateMemberToken(request);
    if (!memberId) {
      return errorResponse('Invalid or missing authentication token', 401);
    }

    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Member not found', 404);
      }
      console.error('Error fetching member profile:', error);
      return errorResponse('Failed to fetch member profile', 500);
    }

    return successResponse(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}