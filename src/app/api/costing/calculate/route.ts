import { NextRequest, NextResponse } from 'next/server';
import { calculateCostSheet, CalculationInput } from '@/lib/costing-calculator';

export async function POST(req: NextRequest) {
  try {
    const body: CalculationInput = await req.json();
    const result = calculateCostSheet(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in calculation engine:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Calculation failed' },
      { status: 400 }
    );
  }
}
