import { NextRequest } from 'next/server';
import { SalesService } from '../../../../services/sales.service';
import { updateLeadSchema } from '../../../../validations/sales.schema';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view') && !hasApiPermission(user, 'sales:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const lead = await SalesService.getLeadById(id);
    if (!lead) return errorResponse('Lead not found', 404);

    return successResponse(lead);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit') && !hasApiPermission(user, 'sales:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateLeadSchema.parse(body);

    const updated = await SalesService.updateLead(id, {
      ...validatedData,
      user: user?.name || 'Sales Executive',
    });

    return successResponse(updated, 'Lead updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:delete') && !hasApiPermission(user, 'sales:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    await SalesService.deleteLead(id);

    return successResponse({ id }, 'Lead deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
