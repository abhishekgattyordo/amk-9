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
    const workOrderId = searchParams.get('workOrderId') || undefined;
    const date = searchParams.get('date') || undefined;
    const stage = searchParams.get('stage') || undefined;

    const logs = await ProductionService.getScrapLogs({ workOrderId, date, stage });
    return successResponse(logs);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch scrap logs', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.stage || !body.weightKg || !body.materialType || !body.reason) {
      return errorResponse('Stage, weight, material type, and reason are required', 400);
    }

    const log = await ProductionService.createScrapLog({
      ...body,
      recordedBy: body.recordedBy || user?.name || 'Production Operator',
    });

    return successResponse(log, 'Scrap log recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record scrap log', 400);
  }
}
