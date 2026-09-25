import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const status = searchParams.get('status') || undefined;
    const stage = searchParams.get('stage') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { inspections, total } = await ProductionService.getQCInspections({
      workOrderId,
      status,
      stage,
      page,
      limit,
    });

    return paginatedResponse(inspections, total, page, limit);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch QC inspections', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.workOrderId || !body.stage) {
      return errorResponse('Work Order ID and stage are required', 400);
    }

    const inspection = await ProductionService.createQCInspection({
      ...body,
      inspectorName: body.inspectorName || user?.name || 'QC Inspector',
    });

    return successResponse(inspection, 'QC Inspection recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record QC inspection', 400);
  }
}
