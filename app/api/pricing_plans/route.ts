import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Types
interface PricingPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  features?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePricingPlanRequest {
  name: string;
  description?: string;
  price: number;
  duration_days: number;
  features?: string[];
  is_active?: boolean;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Key validation for admin operations
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

// GET - Fetch all pricing plans (Public access)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'price';
    const order = searchParams.get('order') || 'asc';
    const active_only = searchParams.get('active_only');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('pricing_plans')
      .select('*', { count: 'exact' });

    // Filter active plans only
    if (active_only === 'true') {
      query = query.eq('is_active', true);
    }

    // Search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching pricing plans:', error);
      return errorResponse('Failed to fetch pricing plans', 500);
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

// POST - Create new pricing plan (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Validate API key (Admin only)
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const planData: CreatePricingPlanRequest = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'price', 'duration_days'];
    const missingFields = requiredFields.filter(field => !planData[field as keyof CreatePricingPlanRequest]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 });
    }

    // Validate price is positive
    if (planData.price <= 0) {
      return errorResponse('Price must be greater than 0');
    }

    // Validate duration_days is positive
    if (planData.duration_days <= 0) {
      return errorResponse('Duration days must be greater than 0');
    }

    // Set default values
    const planWithDefaults = {
      ...planData,
      is_active: planData.is_active !== undefined ? planData.is_active : true
    };

    const { data, error } = await supabase
      .from('pricing_plans')
      .insert([planWithDefaults])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse('Pricing plan with this name already exists', 409);
      }
      console.error('Error creating pricing plan:', error);
      return errorResponse('Failed to create pricing plan', 500);
    }

    return successResponse(data, 201);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}