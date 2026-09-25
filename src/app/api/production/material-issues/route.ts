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
    const warehouseId = searchParams.get('warehouseId') || undefined;

    const issues = await ProductionService.getMaterialIssues({
      productionOrderId,
      warehouseId,
    });

    return successResponse(issues);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch material issues', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.productionOrderId || !body.rawMaterialId || !body.quantityIssued || !body.warehouseId) {
      return errorResponse('Production order, raw material, quantity, and warehouse are required', 400);
    }

    const result = await ProductionService.issueMaterialToProduction({
      ...body,
      issuedBy: body.issuedBy || user?.name || 'Store Keeper',
    });

    return successResponse(result, 'Material issued to production team successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to issue material', 400);
  }
}
