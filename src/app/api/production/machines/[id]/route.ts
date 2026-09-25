import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const machine = await ProductionService.getMachineById(id);
    if (!machine) return errorResponse('Machine not found', 404);

    return successResponse(machine);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch machine', 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const machine = await ProductionService.updateMachineStatus(id, {
      ...body,
      operator: body.operator !== undefined ? body.operator : user?.name,
    });
    return successResponse(machine, 'Machine updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update machine', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    await ProductionService.deleteMachine(id, user?.name);
    return successResponse({ id }, 'Machine deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete machine', 400);
  }
}
