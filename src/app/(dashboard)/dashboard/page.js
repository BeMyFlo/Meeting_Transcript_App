"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { convertToWav } from '@/lib/audioConverter';

export default function DashboardPage() {
  const router = useRouter();
  
  // States
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ count: 0, totalSize: '0 MB', hasApiKey: false });
  const fileInputRef = useRef(null);

  // Load history data for stats count
  useEffect(() => {
    fetch('/api/transcripts')
      .then((res) => res.json())
      .then((data) => {
        const list = data.transcripts || [];
        const totalBytes = list.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
        
        fetch('/api/user/profile')
          .then((res) => res.json())
          .then((pData) => {
            setStats({
              count: list.length,
              totalSize: formatBytes(totalBytes),
              hasApiKey: pData.user?.hasApiKey || false,
            });
          });
      })
      .catch((err) => console.error('Error fetching dashboard stats:', err));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      alert('Vui lòng chọn tệp âm thanh (mp3, wav...) hoặc video (mp4, mkv...)!');
      return;
    }
    setSelectedFile(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleUploadChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleStartProcess = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setProgress(5);
    setStatusText('Đang chuẩn bị tệp tin...');

    try {
      let fileToUpload = selectedFile;
      
      // Perform client-side audio extraction/compression to bypass 4.5MB Vercel limit
      try {
        fileToUpload = await convertToWav(selectedFile, (msg) => {
          setStatusText(msg);
          // Scale progress during client conversion (0% -> 20%)
          setProgress((prev) => Math.min(20, prev + 3));
        });
      } catch (convErr) {
        console.warn('Client-side audio conversion failed, attempting raw upload:', convErr);
        // Fallback to raw file if conversion fails for some reason
        fileToUpload = selectedFile;
      }

      setProgress(20);
      setStatusText('Đang tải tệp âm thanh đã nén lên máy chủ...');

      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Create an XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/transcripts/process', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          // Scale progress: upload is 20% to 70%
          setProgress(20 + Math.round(percent * 0.50));
          setStatusText(`Đang tải tệp lên máy chủ: ${Math.round(percent)}%`);
        }
      };

      const resultPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error('Failed to parse JSON response.'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Lỗi máy chủ: Code ${xhr.status}`));
            } catch (e) {
              reject(new Error(`Quá trình xử lý thất bại: Code ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải lên.'));
      });

      // Start uploading
      xhr.send(formData);

      // Fake polling visual progression for transcription task (from 70% to 95%)
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          if (prev >= 85) {
            setStatusText('Đang hoàn tất lưu trữ bản dịch...');
            return prev + 1;
          }
          if (prev >= 70) {
            setStatusText('Whisper đang nhận diện giọng nói local...');
            return prev + 2;
          }
          return prev;
        });
      }, 3500);

      const result = await resultPromise;
      clearInterval(interval);
      setProgress(100);
      setStatusText('Hoàn thành xuất sắc!');

      // Redirect to detailed page
      setTimeout(() => {
        router.push(`/history/${result.transcript._id}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      setStatusText(`Lỗi: ${err.message}`);
      alert(`Đã xảy ra lỗi: ${err.message}`);
      setLoading(false);
      setProgress(0);
    }
  };

  // Helper
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Bảng điều khiển</h1>
          <p>Tải lên cuộc họp của bạn để bắt đầu phân tích</p>
        </div>
      </div>

      {/* Stats Widgets */}
      <section className="grid-3" aria-label="Thống kê nhanh">
        <div className="stat-card">
          <span className="stat-label">Tổng số cuộc họp</span>
          <span className="stat-value">{stats.count}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Dung lượng đã lưu</span>
          <span className="stat-value">{stats.totalSize}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gemini API Key</span>
          <span className="stat-value" style={{ color: stats.hasApiKey ? 'var(--success-color)' : 'var(--warning-color)', WebkitTextFillColor: 'initial', fontSize: '1.1rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill={stats.hasApiKey ? 'var(--success-color)' : 'var(--warning-color)'} /></svg>
            {stats.hasApiKey ? 'Đã cấu hình cá nhân' : 'Dùng API Key hệ thống'}
          </span>
        </div>
      </section>

      {/* Main Process Box */}
      <div className="grid-2">
        {/* Upload Column */}
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            Tải lên cuộc họp mới
          </h2>
          
          <div 
            className="upload-zone" 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleUploadChange}
              accept="video/*,audio/*"
              style={{ display: 'none' }} 
            />
            <div style={{ marginBottom: '15px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '8px' }}>Kéo thả tệp MP4, MP3 vào đây</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', opacity: 0.7 }}>Hoặc click để chọn tệp</p>
          </div>

          {selectedFile && (
            <div style={{ marginTop: '15px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{formatBytes(selectedFile.size)}</div>
            </div>
          )}

          {loading && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500, color: 'var(--text-muted)' }}>{statusText}</div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <button 
            onClick={handleStartProcess} 
            className="btn" 
            style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={!selectedFile || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            In Script
          </button>
        </div>

        {/* Info Column */}
        <div className="card">
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            Thông tin dịch thuật
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p>
              Ứng dụng sử dụng mô hình đa phương tiện tiên tiến <strong>Gemini 1.5</strong> của Google, hỗ trợ xử lý trực tiếp các tệp video và âm thanh mà không cần chuyển đổi định dạng thô trước.
            </p>
            <p>
              <strong>Thời gian xử lý:</strong> Phụ thuộc vào độ dài cuộc họp và đường truyền mạng của bạn. Đối với tệp 10-15 phút, thời gian xử lý thông thường khoảng 30-60 giây.
            </p>
            <p>
              <strong>Lưu ý về dung lượng:</strong> Vui lòng không đóng tab trình duyệt khi quá trình tải lên và dịch thuật đang diễn ra. Kết quả sau khi dịch xong sẽ được tự động lưu vĩnh viễn vào hệ thống lịch sử của bạn.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
