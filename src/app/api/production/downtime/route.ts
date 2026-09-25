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
    const machineId = searchParams.get('machineId') || undefined;
    const date = searchParams.get('date') || undefined;

    const logs = await ProductionService.getDowntimeLogs({ machineId, date });
    return successResponse(logs);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch downtime logs', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.machineId || !body.reasonCategory || !body.durationMinutes || !body.startTime) {
      return errorResponse('Machine, reason, duration, and start time are required', 400);
    }

    const log = await ProductionService.createDowntimeLog({
      ...body,
      resolvedBy: body.resolvedBy || user?.name || 'Maintenance Tech',
    });

    return successResponse(log, 'Downtime log recorded successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to record downtime log', 400);
  }
}
