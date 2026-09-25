import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../../services/sales.service';
import { leadStageUpdateSchema } from '../../../../../../validations/sales.schema';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = leadStageUpdateSchema.parse(body);

    const updated = await SalesService.updateLeadStage(id, {
      ...validatedData,
      user: user?.name || validatedData.user || 'Sales Executive',
    });

    return successResponse(updated, `Lead stage transitioned to ${validatedData.status}`);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
