import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'qc:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();
    if (!body.warehouseId || !body.quantity) {
      return errorResponse('Warehouse ID and quantity are required', 400);
    }

    const result = await ProductionService.approveAndReceiveFinishedGoods({
      productionOrderId: id,
      warehouseId: body.warehouseId,
      quantity: Number(body.quantity),
      user: user?.name || 'Production QC Supervisor',
      remarks: body.remarks,
    });

    return successResponse(result, result.message);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to receive finished goods', 400);
  }
}
