import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const body = await req.json();

    const { action, remarks, userName, userRole } = body;

    const costSheet = await prisma.costSheet.findUnique({
      where: { id },
    });

    if (!costSheet) {
      return NextResponse.json(
        { success: false, error: 'Cost Sheet not found' },
        { status: 404 }
      );
    }

    let newStatus = 'Approved';
    let approvalStatus = 'Approved';

    if (action === 'reject') {
      newStatus = 'Rejected';
      approvalStatus = 'Rejected';
    } else if (action === 'request_revision') {
      newStatus = 'Revision Requested';
      approvalStatus = 'Pending';
    } else if (action === 'submit') {
      newStatus = 'Pending MD Approval';
      approvalStatus = 'Pending';
    }

    // Create approval history entry
    await prisma.costSheetApproval.create({
      data: {
        costSheetId: id,
        action: action === 'approve' ? 'MD Approved' : action === 'reject' ? 'MD Rejected' : action === 'request_revision' ? 'MD Revision Requested' : 'Submitted for Review',
        status: approvalStatus,
        userName: userName || 'Managing Director',
        userRole: userRole || 'Management / MD',
        remarks: remarks || (action === 'approve' ? 'Commercial terms approved for quoting' : 'Action taken by MD'),
        priceAtReview: costSheet.sellingPricePerBox,
        marginAtReview: costSheet.profitMarginPercent,
      },
    });

    // Update cost sheet status & approval fields
    const updated = await prisma.costSheet.update({
      where: { id },
      data: {
        status: newStatus,
        approvedBy: action === 'approve' ? (userName || 'Managing Director') : null,
        approvedAt: action === 'approve' ? new Date() : null,
        mdRemarks: remarks || null,
      },
      include: {
        customer: true,
        product: true,
        layers: true,
        approvals: {
          orderBy: { timestamp: 'desc' },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error handling cost sheet approval:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process approval' },
      { status: 500 }
    );
  }
}
