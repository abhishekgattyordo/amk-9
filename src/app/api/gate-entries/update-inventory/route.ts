import { NextRequest } from 'next/server';
import { GateEntryService } from '../../../../services/gate-entry.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'procurement_inward:edit') && !hasApiPermission(user, 'inventory:write')) {
      return errorResponse('Forbidden: Insufficient Permissions to Update Inventory from Gate Entry', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      // Also check body if id is in json
      const body = await req.json().catch(() => ({}));
      if (body.id) {
        const updated = await GateEntryService.updateInventory(body.id);
        return successResponse(updated, 'Inventory updated successfully from Gate Entry');
      }
      return errorResponse('Gate Entry ID required', 400);
    }

    const updated = await GateEntryService.updateInventory(id);
    return successResponse(updated, 'Inventory updated successfully from Gate Entry');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
