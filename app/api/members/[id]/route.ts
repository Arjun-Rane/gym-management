import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

interface CreateMemberRequest {
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
}

interface UpdateMemberRequest extends Partial<CreateMemberRequest> {}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Key validation
const validateApiKey = (request: NextRequest): boolean => {
  const apiKey = request.nextUrl.searchParams.get('api_key');
  return apiKey === process.env.ADMIN_API_KEY;
};

// Error response helper
const errorResponse = (message: string, status: number = 400) => {
  return NextResponse.json({ error: message }, { status });
};

// Success response helper
const successResponse = (data: any, status: number = 200) => {
  return NextResponse.json({ data }, { status });
};

// GET - Fetch all members or single member
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { searchParams, pathname } = request.nextUrl;
    
    // Check if requesting single member by ID
    const pathSegments = pathname.split('/');
    const memberId = pathSegments[pathSegments.length - 1];
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);

    if (isUUID && memberId !== 'members') {
      // GET single member
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse('Member not found', 404);
        }
        console.error('Error fetching member:', error);
        return errorResponse('Failed to fetch member', 500);
      }

      return successResponse(data);
    }

    // Check if requesting stats
    if (pathname.includes('/stats')) {
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: totalMembers },
        { count: activeSubscriptions },
        { count: expiredSubscriptions },
        { count: noSubscription }
      ] = await Promise.all([
        supabase.from('members').select('*', { count: 'exact', head: true }),
        supabase.from('members').select('*', { count: 'exact', head: true }).gte('subscription_expiry_date', today),
        supabase.from('members').select('*', { count: 'exact', head: true }).lt('subscription_expiry_date', today).not('subscription_expiry_date', 'is', null),
        supabase.from('members').select('*', { count: 'exact', head: true }).is('subscription_plan_id', null)
      ]);

      return successResponse({
        totalMembers: totalMembers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        expiredSubscriptions: expiredSubscriptions || 0,
        noSubscription: noSubscription || 0
      });
    }

    // GET all members with filtering, sorting, and pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const search = searchParams.get('search');
    const subscription_plan_id = searchParams.get('subscription_plan_id');
    const active_only = searchParams.get('active_only');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Filter by subscription plan
    if (subscription_plan_id) {
      query = query.eq('subscription_plan_id', subscription_plan_id);
    }

    // Filter active subscriptions only
    if (active_only === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('subscription_expiry_date', today);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return errorResponse('Failed to fetch members', 500);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// POST - Create new member
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const memberData: CreateMemberRequest = await request.json();

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !memberData[field as keyof CreateMemberRequest]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberData.email)) {
      return errorResponse('Invalid email format');
    }

    // Validate phone format
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
    if (!phoneRegex.test(memberData.phone)) {
      return errorResponse('Invalid phone format');
    }

    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('Member with this email or phone already exists', 409);
      }
      console.error('Error creating member:', error);
      return errorResponse('Failed to create member', 500);
    }

    return successResponse(data, 201);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT - Update member
export async function PUT(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { pathname } = request.nextUrl;
    const pathSegments = pathname.split('/');
    const memberId = pathSegments[pathSegments.length - 1];

    if (!memberId || memberId === 'members') {
      return errorResponse('Member ID is required');
    }

    const updateData: UpdateMemberRequest = await request.json();

    // Remove id from update data if present
    delete (updateData as any).id;

    // Validate email format if provided
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return errorResponse('Invalid email format');
      }
    }

    // Validate phone format if provided
    if (updateData.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
      if (!phoneRegex.test(updateData.phone)) {
        return errorResponse('Invalid phone format');
      }
    }

    const { data, error } = await supabase
      .from('members')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Member not found', 404);
      }
      if (error.code === '23505') {
        return errorResponse('Email or phone already exists for another member', 409);
      }
      console.error('Error updating member:', error);
      return errorResponse('Failed to update member', 500);
    }

    return successResponse(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE - Delete member
export async function DELETE(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { pathname } = request.nextUrl;
    const pathSegments = pathname.split('/');
    const memberId = pathSegments[pathSegments.length - 1];

    if (!memberId || memberId === 'members') {
      return errorResponse('Member ID is required');
    }

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting member:', error);
      return errorResponse('Failed to delete member', 500);
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}