import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Types
interface Transaction {
  id: string;
  member_id: string;
  plan_id?: string;
  amount: number;
  payment_method: string;
  transaction_date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

// GET - Fetch all transactions (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const { searchParams } = request.nextUrl;

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const member_id = searchParams.get('member_id');
    const plan_id = searchParams.get('plan_id');
    const status = searchParams.get('status');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const payment_method = searchParams.get('payment_method');

    const offset = (page - 1) * limit;

    // Build query with joins to get member and plan details
    let query = supabase
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
      `, { count: 'exact' });

    // Apply filters
    if (member_id) {
      query = query.eq('member_id', member_id);
    }

    if (plan_id) {
      query = query.eq('plan_id', plan_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }

    // Date range filter
    if (date_from) {
      query = query.gte('transaction_date', date_from);
    }

    if (date_to) {
      query = query.lte('transaction_date', date_to);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return errorResponse('Failed to fetch transactions', 500);
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

// POST - Create new transaction (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return errorResponse('Invalid or missing API key', 401);
    }

    const transactionData = await request.json();

    // Validate required fields
    const requiredFields = ['member_id', 'amount', 'payment_method', 'transaction_date'];
    const missingFields = requiredFields.filter(field => !transactionData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        missing: missingFields
      }, { status: 400 });
    }

    // Validate amount is positive
    if (transactionData.amount <= 0) {
      return errorResponse('Amount must be greater than 0');
    }

    // Validate member exists
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', transactionData.member_id)
      .single();

    if (!member) {
      return errorResponse('Member not found', 404);
    }

    // If plan_id provided, validate it exists
    if (transactionData.plan_id) {
      const { data: plan } = await supabase
        .from('pricing_plans')
        .select('id')
        .eq('id', transactionData.plan_id)
        .single();

      if (!plan) {
        return errorResponse('Pricing plan not found', 404);
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        status: transactionData.status || 'pending'
      }])
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
      console.error('Error creating transaction:', error);
      return errorResponse('Failed to create transaction', 500);
    }

    return successResponse(data, 201);

  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
}