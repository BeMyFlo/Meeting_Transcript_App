import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/crypto';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.id).select('-password');
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasApiKey: !!user.geminiApiKey,
      },
    });
  } catch (error) {
    console.error('Profile GET Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy thông tin.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    await connectDB();
    const { name, geminiApiKey } = await request.json();

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    if (name) user.name = name;
    if (geminiApiKey !== undefined) {
      user.geminiApiKey = encrypt(geminiApiKey);
    }

    await user.save();

    return NextResponse.json({
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasApiKey: !!user.geminiApiKey,
      },
    });
  } catch (error) {
    console.error('Profile PUT Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi cập nhật thông tin.' }, { status: 500 });
  }
}
