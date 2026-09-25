import { NextRequest } from 'next/server';
import { RawMaterialStockService } from '@/services/raw-material-stock.service';
import { successResponse, errorResponse, paginatedResponse } from '@/utils/api';
import { getAuthorizedUser, hasApiPermission } from '@/middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:view') && !hasApiPermission(user, 'inventory_stock:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const rawMaterialId = searchParams.get('rawMaterialId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { stocks, total } = await RawMaterialStockService.getAll({
      rawMaterialId,
      supplierId,
      warehouseId,
      status,
      search,
      page,
      limit,
    });

    return paginatedResponse(stocks, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:create') && !hasApiPermission(user, 'inventory_stock:create')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const stock = await RawMaterialStockService.createStock({
      ...body,
      user: user?.name || 'Administrator',
    });

    return successResponse(stock, 'Raw Material Stock created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}
