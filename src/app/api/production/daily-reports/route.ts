import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const productionDate = searchParams.get('date') || searchParams.get('productionDate') || undefined;
    const status = searchParams.get('status') || undefined;
    const productionOrderId = searchParams.get('productionOrderId') || undefined;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await ProductionService.getDailyProductionReports({
      productionDate,
      status,
      productionOrderId,
      workOrderId,
      page,
      limit,
    });

    return successResponse(result);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch daily production reports', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.productionDate || !body.productId || body.plannedQuantity === undefined || body.actualProducedQuantity === undefined) {
      return errorResponse('Production date, product, planned quantity, and actual produced quantity are required', 400);
    }

    const report = await ProductionService.createDailyProductionReport({
      ...body,
      supervisor: body.supervisor || user?.name || 'Production Supervisor',
    });

    return successResponse(report, 'Daily Production Report submitted for Manager Approval', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to submit daily report', 400);
  }
}
