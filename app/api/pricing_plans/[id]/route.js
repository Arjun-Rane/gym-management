import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// GET - Fetch single pricing plan by ID (Public access)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: planId } = params;

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
    if (!isUUID) {
      return errorResponse('Invalid pricing plan ID format', 400);
    }

    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Pricing plan not found', 404);
      }
      console.error('Error fetching pricing plan:', error);
      return errorResponse('Failed to fetch pricing plan', 500);
    }

    return successResponse(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT - Update pricing plan (Admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate API key (Admin only)
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { id: planId } = params;

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
    if (!isUUID) {
      return errorResponse('Invalid pricing plan ID format', 400);
    }

    const updateData = await request.json();

    // Remove id from update data if present
    delete (updateData as any).id;

    // Validate price if provided
    if (updateData.price !== undefined && updateData.price <= 0) {
      return errorResponse('Price must be greater than 0');
    }

    // Validate duration_days if provided
    if (updateData.duration_days !== undefined && updateData.duration_days <= 0) {
      return errorResponse('Duration days must be greater than 0');
    }

    const { data, error } = await supabase
      .from('pricing_plans')
      .update({ 
        ...updateData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Pricing plan not found', 404);
      }
      if (error.code === '23505') {
        return errorResponse('Pricing plan with this name already exists', 409);
      }
      console.error('Error updating pricing plan:', error);
      return errorResponse('Failed to update pricing plan', 500);
    }

    return successResponse(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE - Delete pricing plan (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate API key (Admin only)
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { id: planId } = params;

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planId);
    if (!isUUID) {
      return errorResponse('Invalid pricing plan ID format', 400);
    }

    // Check if plan is being used by any members
    const { data: membersUsingPlan, error: checkError } = await supabase
      .from('members')
      .select('id')
      .eq('subscription_plan_id', planId)
      .limit(1);

    if (checkError) {
      console.error('Error checking plan usage:', checkError);
      return errorResponse('Failed to check plan usage', 500);
    }

    if (membersUsingPlan && membersUsingPlan.length > 0) {
      return errorResponse('Cannot delete pricing plan that is currently in use by members', 409);
    }

    const { error } = await supabase
      .from('pricing_plans')
      .delete()
      .eq('id', planId);

    if (error) {
      console.error('Error deleting pricing plan:', error);
      return errorResponse('Failed to delete pricing plan', 500);
    }

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}