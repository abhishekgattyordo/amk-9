import { NextRequest } from 'next/server';
import { RawMaterialStockService } from '../../../../../../services/raw-material-stock.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory_raw:edit') && !hasApiPermission(user, 'inventory_stock:create')) {
      return errorResponse('Forbidden: Insufficient Permissions to Adjust Stock', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const updatedStock = await RawMaterialStockService.adjustStock({
      stockId: id,
      newRemainingQuantity: Number(body.newRemainingQuantity),
      reason: body.reason || 'Audit Adjustment',
      remarks: body.remarks,
      user: user?.name || 'Administrator',
    });

    return successResponse(updatedStock, 'Stock adjusted successfully');
  } catch (err: any) {
    return errorResponse(err.message || err, 400);
  }
}
