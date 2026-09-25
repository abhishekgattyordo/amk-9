import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const productionPlanId = searchParams.get('productionPlanId') || undefined;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const salesOrderId = searchParams.get('salesOrderId') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const status = searchParams.get('status') || undefined;
    const date = searchParams.get('date') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await ProductionService.getProductionOrders({
      productionPlanId,
      workOrderId,
      salesOrderId,
      productId,
      status,
      date,
      search,
      page,
      limit,
    });

    return successResponse(result);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch production orders', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.workOrderId || !body.productId || !body.plannedQuantity) {
      return errorResponse('Work order ID, product ID, and planned quantity are required', 400);
    }

    const order = await ProductionService.createProductionOrder({
      ...body,
      supervisor: body.supervisor || user?.name || 'Production Supervisor',
    });

    return successResponse(order, 'Production Order created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create Production Order', 400);
  }
}
