import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
  try {
    // Clear the Descope session cookies
    const response = NextResponse.json({ success: true });
    
    // Clear all Descope-related cookies
    response.cookies.delete('DS');
    response.cookies.delete('DSR');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
