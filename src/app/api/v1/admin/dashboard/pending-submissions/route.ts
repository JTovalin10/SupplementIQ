import { NextRequest, NextResponse } from 'next/server';

// Mock pending submissions data
const mockPendingSubmissions = [
  {
    id: '1',
    title: 'New Protein Powder - Whey Isolate',
    user: 'john_doe',
    submittedAt: '2024-01-15T10:30:00Z',
    type: 'product',
    details: 'High-quality whey protein isolate with 25g protein per serving'
  },
  {
    id: '2',
    title: 'Updated Creatine Monohydrate Information',
    user: 'jane_smith',
    submittedAt: '2024-01-15T09:15:00Z',
    type: 'edit',
    details: 'Updated dosage recommendations and added research citations'
  },
  {
    id: '3',
    title: 'New Vitamin D3 Supplement',
    user: 'mike_wilson',
    submittedAt: '2024-01-15T08:45:00Z',
    type: 'product',
    details: '5000 IU Vitamin D3 with K2 for better absorption'
  },
  {
    id: '4',
    title: 'BCAA Product Review Update',
    user: 'sarah_jones',
    submittedAt: '2024-01-14T16:20:00Z',
    type: 'edit',
    details: 'Updated effectiveness rating based on new studies'
  }
];

export async function GET(request: NextRequest) {
    try {

      return NextResponse.json({
        success: true,
        data: mockPendingSubmissions
      });

    } catch (error) {
      console.error('Pending submissions error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending submissions' },
        { status: 500 }
      );
    }
}