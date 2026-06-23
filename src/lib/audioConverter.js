/**
 * Extract audio from a media file and convert it to a low sample-rate (16kHz) mono WAV file.
 * This runs purely on the client side (browser) to compress files before uploading to Vercel.
 * 
 * @param {File} file - The source audio or video file
 * @param {Function} onStatusUpdate - Callback to update progress status messages
 * @returns {Promise<File>} The converted mono WAV file
 */
export async function convertToWav(file, onStatusUpdate) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Trình duyệt không hỗ trợ Web Audio API.');
  }

  if (onStatusUpdate) onStatusUpdate('Đang đọc tệp tin...');
  const arrayBuffer = await file.arrayBuffer();

  if (onStatusUpdate) onStatusUpdate('Đang giải mã âm thanh... (Sẽ mất ít giây với tệp lớn)');
  const audioCtx = new AudioContextClass();

  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    audioCtx.close().catch(() => {});
    throw new Error('Không thể giải mã âm thanh từ tệp này. Tệp có thể không có âm thanh hoặc định dạng không được trình duyệt hỗ trợ.');
  }

  if (onStatusUpdate) onStatusUpdate('Đang tiến hành nén âm thanh về Mono 16kHz...');

  // Whisper model performs best with 16000Hz mono audio.
  const targetSampleRate = 16000;
  const targetChannels = 1;
  const duration = audioBuffer.duration;
  
  // Downsample using OfflineAudioContext
  const offlineCtx = new OfflineAudioContext(
    targetChannels,
    Math.round(duration * targetSampleRate),
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineCtx.destination);
  source.start();

  let renderedBuffer;
  try {
    renderedBuffer = await offlineCtx.startRendering();
  } catch (err) {
    audioCtx.close().catch(() => {});
    throw new Error('Lỗi trong quá trình nén âm thanh.');
  }

  if (onStatusUpdate) onStatusUpdate('Đang đóng gói file âm thanh (WAV)...');

  // Convert the rendered audio buffer to WAV Blob
  const wavBlob = audioBufferToWav(renderedBuffer);
  
  // Clean up original context to release memory
  audioCtx.close().catch(() => {});

  // Generate a clean filename ending with .wav
  const cleanName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.wav';

  return new File([wavBlob], cleanName, { type: 'audio/wav' });
}

/**
 * Encode AudioBuffer to standard 16-bit PCM WAV Blob
 */
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // raw LPCM
  const bitDepth = 16;
  
  const result = new Float32Array(buffer.length * numOfChan);
  let offset = 0;
  
  // Interleave channels (though we downsampled to mono, handle multi-channel just in case)
  const channels = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      result[offset++] = channels[channel][i];
    }
  }
  
  const bufferArr = new ArrayBuffer(44 + result.length * 2);
  const view = new DataView(bufferArr);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + result.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, result.length * 2, true);
  
  // Write 16-bit PCM samples
  floatTo16BitPCM(view, 44, result);
  
  return new Blob([bufferArr], { type: 'audio/wav' });
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
