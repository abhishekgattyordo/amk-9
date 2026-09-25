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
    const productionOrderId = searchParams.get('productionOrderId') || undefined;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const status = searchParams.get('status') || undefined;
    const rawMaterialId = searchParams.get('rawMaterialId') || undefined;

    const requests = await ProductionService.getMaterialRequests({
      productionOrderId,
      workOrderId,
      status,
      rawMaterialId,
    });

    return successResponse(requests);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch material requests', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'inventory:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.rawMaterialId || !body.requiredQuantity) {
      return errorResponse('Raw material and required quantity are required', 400);
    }

    const request = await ProductionService.createMaterialRequest({
      ...body,
      requestedBy: body.requestedBy || user?.name || 'Production Supervisor',
    });

    return successResponse(request, 'Material Indent created successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create Material Indent', 400);
  }
}
