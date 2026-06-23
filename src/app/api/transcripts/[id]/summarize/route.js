import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transcript from '@/models/Transcript';
import { getSession } from '@/lib/auth';
import { decrypt } from '@/lib/crypto';

export async function POST(request, { params }) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    // 2. Find transcript
    const transcript = await Transcript.findOne({ _id: id, userId: session.id });
    if (!transcript) {
      return NextResponse.json({ error: 'Không tìm thấy cuộc họp hoặc bạn không có quyền truy cập.' }, { status: 404 });
    }

    // 3. Return summary immediately if it's already computed
    if (transcript.status === 'completed' && transcript.summaryText) {
      return NextResponse.json({
        message: 'Tóm tắt đã hoàn thành từ trước.',
        summaryText: transcript.summaryText,
        status: 'completed',
      });
    }

    // 4. Retrieve Gemini API Key
    const user = await User.findById(session.id);
    const decryptedApiKey = user?.geminiApiKey ? decrypt(user.geminiApiKey) : '';
    const apiKey = decryptedApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình Gemini API Key. Vui lòng cài đặt API Key trong phần Cài đặt.' },
        { status: 400 }
      );
    }

    // 5. Parse request body if exists to determine model
    let modelName = 'gemini-2.5-flash';
    try {
      const body = await request.json();
      if (body.model) modelName = body.model;
    } catch (e) {
      // Body might be empty, fallback to default
    }

    // 6. Generate Summarization using Gemini API
    console.log(`Generating summary asynchronously for transcript ID ${id} using model ${modelName}...`);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const summarizationPrompt = `Bạn là thư ký ảo thông minh chuyên tóm tắt các cuộc họp. Hãy đọc bản ghi chép cuộc họp (transcript) dưới đây và viết một bản tóm tắt báo cáo chi tiết bằng tiếng Việt.
Yêu cầu phân chia thành cấu trúc rõ ràng:
1. TIÊU ĐỀ CUỘC HỌP & THÔNG TIN CHUNG (Thời lượng, tổng quan)
2. CÁC NỘI DUNG THẢO LUẬN CHI TIẾT (Lồng ghép thông tin chi tiết từng dự án/tính năng)
3. DANH SÁCH HÀNH ĐỘNG CẦN THỰC HIỆN (Action Items) (Ghi rõ việc gì, ai phụ trách nếu có tên trong hội thoại)

Trình bày theo định dạng Markdown gọn gàng, chuyên nghiệp, sử dụng bảng biểu (nếu có thể) cho danh sách hành động.

Dưới đây là nội dung bản dịch cuộc họp:
---
${transcript.transcriptText}`;

    const sumResponse = await model.generateContent([{ text: summarizationPrompt }]);
    const summaryText = sumResponse.response.text();
    console.log(`Async summary completed for ID ${id}.`);

    // 7. Update MongoDB record
    transcript.summaryText = summaryText;
    transcript.status = 'completed';
    await transcript.save();

    return NextResponse.json({
      message: 'Tóm tắt thành công cuộc họp!',
      summaryText,
      status: 'completed',
    });

  } catch (error) {
    console.error('API Summarize Error:', error);
    return NextResponse.json(
      { error: `Tóm tắt thất bại: ${error.message}` },
      { status: 500 }
    );
  }
}
