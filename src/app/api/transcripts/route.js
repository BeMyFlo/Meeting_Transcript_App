import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Transcript from '@/models/Transcript';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    await connectDB();
    const transcripts = await Transcript.find({ userId: session.id }).sort({ createdAt: -1 });

    return NextResponse.json({ transcripts });
  } catch (error) {
    console.error('Transcripts GET Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lấy danh sách lịch sử.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    await connectDB();
    const { fileName, fileSize, fileType, transcriptText, summaryText, status } = await request.json();

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin tệp cuộc họp.' },
        { status: 400 }
      );
    }

    const newTranscript = await Transcript.create({
      userId: session.id,
      fileName,
      fileSize,
      fileType,
      transcriptText: transcriptText || '',
      summaryText: summaryText || '',
      status: status || 'completed',
    });

    return NextResponse.json({
      message: 'Lưu bản ghi chép cuộc họp thành công!',
      transcript: newTranscript,
    }, { status: 201 });
  } catch (error) {
    console.error('Transcripts POST Error:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi lưu bản ghi.' }, { status: 500 });
  }
}
