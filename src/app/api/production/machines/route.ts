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
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const line = searchParams.get('line') || undefined;

    const machines = await ProductionService.getMachines({ status, type, line });
    return successResponse(machines);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch machines', 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { id, status, operator, notes } = body;
    if (!id || !status) return errorResponse('Machine ID and status are required', 400);

    const machine = await ProductionService.updateMachineStatus(id, {
      status,
      operator: operator !== undefined ? operator : user?.name,
      notes,
    });

    return successResponse(machine, 'Machine status updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update machine status', 400);
  }
}
