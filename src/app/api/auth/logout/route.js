import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json(
      { message: 'Đăng xuất thành công!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi đăng xuất.' },
      { status: 500 }
    );
  }
}
