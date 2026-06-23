import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { comparePassword, generateToken, setSessionCookie } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Check if password matches
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: user._id,
      name: user.name,
      email: user.email,
    });

    // Set cookie on response
    await setSessionCookie(token);

    return NextResponse.json(
      {
        message: 'Đăng nhập thành công!',
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ trong quá trình đăng nhập.' },
      { status: 500 }
    );
  }
}
