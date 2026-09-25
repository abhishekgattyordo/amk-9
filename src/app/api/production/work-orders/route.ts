import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const wo = await ProductionService.getWorkOrderById(id);
      if (!wo) return errorResponse('Work Order not found', 404);
      return successResponse(wo);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const stage = searchParams.get('stage') || undefined;
    const productId = searchParams.get('productId') || undefined;
    const salesOrderId = searchParams.get('salesOrderId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { workOrders, total } = await ProductionService.getWorkOrders({
      search,
      status,
      priority,
      stage,
      productId,
      salesOrderId,
      page,
      limit,
    });

    return paginatedResponse(workOrders, total, page, limit);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch Work Orders', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:create') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.productId || !body.orderedQuantity) {
      return errorResponse('Product and ordered quantity are required', 400);
    }

    const wo = await ProductionService.createWorkOrder({
      ...body,
      supervisor: body.supervisor || user?.name || 'Production Supervisor',
    });

    return successResponse(wo, 'Work Order created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create Work Order', 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:edit') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return errorResponse('Work Order ID is required', 400);

    const wo = await ProductionService.updateWorkOrder(id, { ...data, user: user?.name });
    return successResponse(wo, 'Work Order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update Work Order', 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return errorResponse('Work Order ID is required', 400);

    const deleted = await ProductionService.deleteWorkOrder(id, user?.name || 'User');
    return successResponse(deleted, 'Work Order deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete Work Order', 400);
  }
}

