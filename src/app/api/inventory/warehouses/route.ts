import { NextRequest } from 'next/server';
import { WarehouseService } from '../../../../services/warehouse.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (user && !hasApiPermission(user, 'inventory_warehouses:view') && !hasApiPermission(user, 'procurement:read') && !hasApiPermission(user, 'inventory:read')) {
      return errorResponse('Forbidden: Insufficient Permissions to View Warehouses', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (id) {
      const warehouse = await WarehouseService.getById(id);
      if (!warehouse) return errorResponse('Warehouse not found', 404);
      return successResponse(warehouse);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { warehouses, total } = await WarehouseService.getAll({ search, status, page, limit });
    return paginatedResponse(warehouses, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
