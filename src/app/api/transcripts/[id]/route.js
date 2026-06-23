import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transcript from '@/models/Transcript';
import { getSession } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const transcript = await Transcript.findOne({ _id: id, userId: session.id });
    if (!transcript) {
      return NextResponse.json({ error: 'Không tìm thấy bản dịch hoặc bạn không có quyền truy cập.' }, { status: 404 });
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Transcript Detail GET Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy chi tiết bản dịch.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const deletedTranscript = await Transcript.findOneAndDelete({ _id: id, userId: session.id });
    if (!deletedTranscript) {
      return NextResponse.json({ error: 'Không tìm thấy bản dịch hoặc bạn không có quyền xóa.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Xóa bản dịch lịch sử thành công!' });
  } catch (error) {
    console.error('Transcript DELETE Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi xóa bản dịch.' }, { status: 500 });
  }
}
