import { NextRequest } from 'next/server';
import { RawMaterialStockService } from '@/services/raw-material-stock.service';
import { successResponse, errorResponse } from '@/utils/api';
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
    const stock = await RawMaterialStockService.getById(id);
    if (!stock) return errorResponse('Stock record not found', 404);

    return successResponse(stock);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:delete') && !hasApiPermission(user, 'inventory_stock:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const deleted = await RawMaterialStockService.deleteStock(id, user?.name);
    return successResponse(deleted, 'Stock record deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}
