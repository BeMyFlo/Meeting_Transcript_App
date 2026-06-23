import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Transcript from '@/models/Transcript';
import { getSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const execFileAsync = promisify(execFile);

export async function POST(request) {
  let tempFilePath = null;
  let outputFilePath = null;

  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng.' }, { status: 404 });
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get('file');
    const modelName = formData.get('model') || 'gemini-2.5-flash';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Không tìm thấy tệp được gửi lên.' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type;

    // 4. Save to temporary local file
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = path.join('/tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    tempFilePath = path.join(tempDir, `upload-${Date.now()}-${fileName}`);
    await writeFileAsync(tempFilePath, buffer);

    // 5. Run local Whisper script
    outputFilePath = path.join(tempDir, `output-${Date.now()}.txt`);
    const pythonPath = '/home/nhanlt/.whisper_venv/bin/python3';
    const scriptPath = path.join(process.cwd(), 'src/lib/whisper_transcribe.py');

    console.log(`Running offline Whisper transcription: ${pythonPath} ${scriptPath} ${tempFilePath} ${outputFilePath}`);
    
    // We run execFileAsync with a large maxBuffer (10MB) to handle long transcripts
    await execFileAsync(pythonPath, [scriptPath, tempFilePath, outputFilePath], { maxBuffer: 1024 * 1024 * 10 });

    // Read result transcript file
    let transcriptText = '';
    if (fs.existsSync(outputFilePath)) {
      transcriptText = fs.readFileSync(outputFilePath, 'utf8');
    } else {
      throw new Error('Không tạo được tệp bản ghi chép từ Whisper.');
    }

    console.log(`Transcription completed locally.`);

    // 6. Save to MongoDB Database with status 'processing' (transcribed but not summarized yet)
    const newTranscript = await Transcript.create({
      userId: session.id,
      fileName,
      fileSize,
      fileType,
      transcriptText,
      summaryText: '',
      status: 'processing',
    });

    return NextResponse.json({
      message: 'Gỡ băng thành công cuộc họp!',
      transcript: newTranscript,
    });

  } catch (error) {
    console.error('File Processing API Error:', error);
    return NextResponse.json(
      { error: `Quá trình xử lý thất bại: ${error.message}` },
      { status: 500 }
    );
  } finally {
    // CLEANUP Phase: Delete temporary files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await unlinkAsync(tempFilePath);
        console.log('Removed temporary local file.');
      } catch (err) {
        console.warn('Failed to delete temp local file:', err);
      }
    }

    if (outputFilePath && fs.existsSync(outputFilePath)) {
      try {
        await unlinkAsync(outputFilePath);
        console.log('Removed temporary output file.');
      } catch (err) {
        console.warn('Failed to delete temp output file:', err);
      }
    }
  }
}
