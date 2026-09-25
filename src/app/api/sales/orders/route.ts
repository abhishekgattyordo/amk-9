import { NextRequest } from 'next/server';
import { SalesService } from '../../../../services/sales.service';
import { createSalesOrderSchema } from '../../../../validations/sales.schema';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const order = await SalesService.getOrderById(id);
      if (!order) return errorResponse('Sales Order not found', 404);
      return successResponse(order);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const productionStatus = searchParams.get('productionStatus') || undefined;
    const dispatchStatus = searchParams.get('dispatchStatus') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { orders, total } = await SalesService.getOrders({
      search,
      status,
      productionStatus,
      dispatchStatus,
      customerId,
      page,
      limit,
    });

    return paginatedResponse(orders, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:create')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const validatedData = createSalesOrderSchema.parse(body);

    const order = await SalesService.createOrder({
      ...validatedData,
      salesExecutive: validatedData.salesExecutive || user?.name || 'Sales Executive',
    });

    return successResponse(order, 'Sales Order created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
