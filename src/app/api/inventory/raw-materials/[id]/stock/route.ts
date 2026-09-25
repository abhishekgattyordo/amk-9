import { NextRequest } from 'next/server';
import { RawMaterialStockService } from '@/services/raw-material-stock.service';
import { successResponse, errorResponse, paginatedResponse } from '@/utils/api';
import { getAuthorizedUser, hasApiPermission } from '@/middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:view') && !hasApiPermission(user, 'inventory_stock:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const supplierId = searchParams.get('supplierId') || undefined;
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const binId = searchParams.get('binId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const date = searchParams.get('date') || undefined;

    const { stocks, total } = await RawMaterialStockService.getAll({
      rawMaterialId: id,
      supplierId,
      warehouseId,
      binId,
      status,
      search,
      startDate,
      endDate,
      date,
      page,
      limit,
    });

    return paginatedResponse(stocks, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:create') && !hasApiPermission(user, 'inventory_stock:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Add Stock', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const stock = await RawMaterialStockService.createStock({
      ...body,
      rawMaterialId: id,
      user: user?.name || 'Administrator',
    });

    return successResponse(stock, 'Raw Material Stock added successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}
