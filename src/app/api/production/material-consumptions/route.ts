import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'inventory:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const productionOrderId = searchParams.get('productionOrderId');
    if (!productionOrderId) return errorResponse('Production order ID is required', 400);

    const consumptions = await ProductionService.getMaterialConsumptions(productionOrderId);
    return successResponse(consumptions);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch material consumptions', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.productionOrderId || !body.rawMaterialId || body.usedQuantity === undefined) {
      return errorResponse('Production order ID, raw material ID, and used quantity are required', 400);
    }

    const result = await ProductionService.recordMaterialConsumption({
      ...body,
      recordedBy: body.recordedBy || user?.name || 'Floor Operator',
    });

    return successResponse(result, 'Material consumption logged successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record consumption', 400);
  }
}
