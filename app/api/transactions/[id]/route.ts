import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// API Key validation for admin
const validateApiKey = (request: NextRequest): boolean => {
  const apiKey = request.nextUrl.searchParams.get('api_key');
  return apiKey === process.env.ADMIN_API_KEY;
};

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

// GET - Fetch single transaction by ID (Admin or owner only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: transactionId } = params;

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    if (!isUUID) {
      return errorResponse('Invalid transaction ID format', 400);
    }

    // Get transaction with member and plan details
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        members:member_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        pricing_plans:plan_id (
          id,
          name,
          price,
          duration_days
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Transaction not found', 404);
      }
      console.error('Error fetching transaction:', error);
      return errorResponse('Failed to fetch transaction', 500);
    }

    // Check if admin or transaction owner
    const isAdmin = validateApiKey(request);
    const authenticatedMemberId = await validateMemberToken(request);
    
    if (!isAdmin && authenticatedMemberId !== transaction.member_id) {
      return errorResponse('Access denied. Admin access or transaction ownership required', 403);
    }

    return successResponse(transaction);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT - Update transaction (Admin only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validate API key (Admin only)
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { id: transactionId } = params;

    // Validate UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transactionId);
    if (!isUUID) {
      return errorResponse('Invalid transaction ID format', 400);
    }

    const updateData = await request.json();

    // Remove id from update data if present
    delete (updateData as any).id;

    // Validate amount if provided
    if (updateData.amount !== undefined && updateData.amount <= 0) {
      return errorResponse('Amount must be greater than 0');
    }

    // Validate member exists if member_id is being updated
    if (updateData.member_id) {
      const { data: member } = await supabase
        .from('members')
        .select('id')
        .eq('id', updateData.member_id)
        .single();

      if (!member) {
        return errorResponse('Member not found', 404);
      }
    }

    // Validate plan exists if plan_id is being updated
    if (updateData.plan_id) {
      const { data: plan } = await supabase
        .from('pricing_plans')
        .select('id')
        .eq('id', updateData.plan_id)
        .single();

      if (!plan) {
        return errorResponse('Pricing plan not found', 404);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        ...updateData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', transactionId)
      .select(`
        *,
        members:member_id (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        pricing_plans:plan_id (
          id,
          name,
          price,
          duration_days
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errorResponse('Transaction not found', 404);
      }
      console.error('Error updating transaction:', error);
      return errorResponse('Failed to update transaction', 500);
    }

    return successResponse(data);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}