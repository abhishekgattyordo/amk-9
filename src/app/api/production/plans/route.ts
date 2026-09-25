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
    const planDate = searchParams.get('planDate') || undefined;
    const shift = searchParams.get('shift') || undefined;
    const line = searchParams.get('line') || undefined;
    const status = searchParams.get('status') || undefined;

    const plans = await ProductionService.getProductionPlans({
      planDate,
      shift,
      line,
      status,
    });

    return successResponse(plans);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch production plans', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.planDate || !body.line || !body.targetQuantity) {
      return errorResponse('Plan date, line, and target quantity are required', 400);
    }

    const plan = await ProductionService.createProductionPlan({
      ...body,
      supervisor: body.supervisor || user?.name || 'Shift Supervisor',
    });

    return successResponse(plan, 'Production Plan scheduled successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to schedule Production Plan', 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return errorResponse('Plan ID is required', 400);

    const plan = await ProductionService.updateProductionPlan(id, data);
    return successResponse(plan, 'Production Plan updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update Production Plan', 400);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return errorResponse('Plan ID is required', 400);

    await ProductionService.deleteProductionPlan(id, user?.name);
    return successResponse(null, 'Production Plan deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete Production Plan', 400);
  }
}
