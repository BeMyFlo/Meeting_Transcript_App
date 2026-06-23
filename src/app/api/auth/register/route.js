import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin: Tên, Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng. Vui lòng chọn email khác.' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: 'Đăng ký tài khoản thành công!',
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { error: 'Lỗi máy chủ trong quá trình đăng ký tài khoản.' },
      { status: 500 }
    );
  }
}
