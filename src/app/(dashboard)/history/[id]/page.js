"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TranscriptDetailPage({ params }) {
  const router = useRouter();
  // Next.js 15 requires unwrapping dynamic route params via React.use()
  const { id } = use(params);

  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transcript'); // 'transcript' | 'summary'
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  const triggerSummarization = (transcriptId, modelName = selectedModel) => {
    setSummarizing(true);
    setSummarizeError('');
    
    fetch(`/api/transcripts/${transcriptId}/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return res.json().then((data) => {
          throw new Error(data.error || 'Tóm tắt thất bại hoặc API bị lỗi.');
        });
      })
      .then((data) => {
        setTranscript((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            summaryText: data.summaryText,
            status: 'completed',
          };
        });
        setSummarizing(false);
      })
      .catch((err) => {
        console.error(err);
        setSummarizeError(err.message || 'Không thể tạo tóm tắt bằng AI. Vui lòng kiểm tra cấu hình Gemini API Key.');
        setSummarizing(false);
      });
  };

  useEffect(() => {
    fetch(`/api/transcripts/${id}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to load detail');
      })
      .then((data) => {
        setTranscript(data.transcript);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Không thể tải chi tiết cuộc họp.');
        router.push('/history');
      });
  }, [id, router]);

  const handleCopy = () => {
    if (!transcript) return;
    const text = activeTab === 'transcript' ? transcript.transcriptText : transcript.summaryText;
    navigator.clipboard.writeText(text).then(() => {
      alert('Đã sao chép vào bộ nhớ tạm!');
    });
  };

  const handleDownload = () => {
    if (!transcript) return;
    const text = activeTab === 'transcript' ? transcript.transcriptText : transcript.summaryText;
    const filename = activeTab === 'transcript' ? `${transcript.fileName}_transcript.txt` : `${transcript.fileName}_summary.md`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple client-side Markdown to HTML renderer for the summary
  const renderMarkdown = (md) => {
    if (!md) return '';
    
    // Split lines
    const lines = md.split('\n');
    let html = [];
    let inList = false;
    let inTable = false;
    
    for (let line of lines) {
      let trimmed = line.trim();
      
      // Horizontal Rule
      if (trimmed === '---') {
        if (inList) { html.push('</ul>'); inList = false; }
        if (inTable) { html.push('</table>'); inTable = false; }
        html.push('<hr style="border:0; border-top:1px solid var(--border-color); margin:20px 0;" />');
        continue;
      }
      
      // Table rows
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (inList) { html.push('</ul>'); inList = false; }
        const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
        
        // Skip separator line (e.g. | :--- | :--- |)
        if (cells.every(c => /^:?-+:?$/.test(c))) {
          continue;
        }
        
        if (!inTable) {
          html.push('<table style="width:100%; border-collapse:collapse; margin:15px 0;">');
          html.push('<thead><tr style="background:rgba(255,255,255,0.03);">');
          for (let cell of cells) {
            html.push(`<th style="border:1px solid var(--border-color); padding:10px; text-align:left; font-weight:600;">${parseInline(cell)}</th>`);
          }
          html.push('</tr></thead><tbody>');
          inTable = true;
        } else {
          html.push('<tr style="border-bottom:1px solid var(--border-color);">');
          for (let cell of cells) {
            html.push(`<td style="border:1px solid var(--border-color); padding:10px;">${parseInline(cell)}</td>`);
          }
          html.push('</tr>');
        }
        continue;
      } else if (inTable) {
        html.push('</tbody></table>');
        inTable = false;
      }
      
      // Lists
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
        const isOrdered = !trimmed.startsWith('* ') && !trimmed.startsWith('- ');
        const listTag = isOrdered ? 'ol' : 'ul';
        const content = isOrdered ? trimmed.replace(/^\d+\.\s*/, '') : trimmed.substring(2);
        
        if (!inList) {
          html.push(`<${listTag} style="padding-left:20px; margin:10px 0;">`);
          inList = listTag;
        }
        html.push(`<li style="margin-bottom:6px; color:var(--text-main);">${parseInline(content)}</li>`);
        continue;
      } else if (inList) {
        html.push(`</${inList}>`);
        inList = false;
      }
      
      // Headings
      if (trimmed.startsWith('# ')) {
        html.push(`<h1 style="font-family:var(--font-family); font-size:1.6rem; color:var(--primary-color); margin:20px 0 10px 0;">${parseInline(trimmed.substring(2))}</h1>`);
      } else if (trimmed.startsWith('## ')) {
        html.push(`<h2 style="font-family:var(--font-family); font-size:1.3rem; color:var(--text-main); border-bottom:1px solid var(--border-color); padding-bottom:6px; margin:20px 0 10px 0;">${parseInline(trimmed.substring(3))}</h2>`);
      } else if (trimmed.startsWith('### ')) {
        html.push(`<h3 style="font-family:var(--font-family); font-size:1.1rem; color:var(--text-main); margin:15px 0 8px 0;">${parseInline(trimmed.substring(4))}</h3>`);
      } else if (trimmed === '') {
        html.push('<p style="margin:8px 0; height:8px;"></p>');
      } else {
        html.push(`<p style="margin:10px 0; line-height:1.6; color:var(--text-main);">${parseInline(line)}</p>`);
      }
    }
    
    if (inList) html.push(`</${inList}>`);
    if (inTable) html.push('</table>');
    
    return html.join('\n');
  };

  const parseInline = (text) => {
    // Bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic *text*
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code `code`
    text = text.replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.06); padding:2px 5px; border-radius:4px; font-family:monospace; font-size:85%;">$1</code>');
    return text;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Đang tải thông tin chi tiết cuộc họp...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/history" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Quay lại
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>Chi tiết cuộc họp</span>
      </div>

      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
            {transcript.fileName}
          </h1>
          <p style={{ display: 'flex', gap: '15px', marginTop: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Ngày dịch: {new Date(transcript.createdAt).toLocaleString('vi-VN')}
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Dung lượng: {(transcript.fileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          </p>
        </div>
      </div>

      {/* Main Results View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: '500px', padding: '20px' }}>
        <div className="panel-header" style={{ marginBottom: '15px' }}>
          <div className="panel-tab-group" role="tablist">
            <button 
              className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
              onClick={() => setActiveTab('transcript')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Bản ghi (Transcript)
            </button>
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              Tóm tắt (Summary)
            </button>
          </div>
          
          <div className="panel-actions">
            <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Sao chép
            </button>
            <button onClick={handleDownload} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Tải xuống
            </button>
          </div>
        </div>

        <div className="content-area" style={{ flex: 1, padding: '25px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)' }}>
          {activeTab === 'transcript' ? (
            <div 
              style={{ 
                fontFamily: 'monospace', 
                whiteSpace: 'pre-wrap', 
                lineHeight: 1.7, 
                color: 'hsl(210, 40%, 85%)',
                fontSize: '0.9rem' 
              }}
            >
              {transcript.transcriptText || 'Không có dữ liệu bản dịch.'}
            </div>
          ) : (
            <div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              {summarizing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '250px', color: 'var(--text-muted)' }}>
                  <div className="spinner" style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid rgba(255,255,255,0.08)',
                    borderTopColor: 'var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>AI đang tiến hành tóm tắt cuộc họp...</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tiến trình này sử dụng mô hình {selectedModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}.</p>
                </div>
              ) : summarizeError ? (
                <div style={{ padding: '24px', color: 'var(--error-color)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '450px', margin: '0 auto' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Không thể tạo tóm tắt</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{summarizeError}</p>
                  </div>
                  
                  <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="label" htmlFor="model-select-error" style={{ color: 'var(--text-muted)' }}>Thử mô hình khác</label>
                    <select 
                      id="model-select-error" 
                      className="input" 
                      value={selectedModel} 
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Tiết kiệm)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Chi tiết & Thông minh)</option>
                    </select>
                  </div>

                  <button onClick={() => triggerSummarization(transcript._id)} className="btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Thử lại ngay
                  </button>
                </div>
              ) : !transcript.summaryText && transcript.status === 'processing' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', maxWidth: '450px', margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ color: 'var(--primary-color)' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-family)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>Tóm tắt cuộc họp bằng AI</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Bản dịch script cuộc họp đã sẵn sàng. Hãy chọn mô hình AI dưới đây để tiến hành tóm tắt nội dung thảo luận và các hành động cần thực hiện.
                    </p>
                  </div>

                  <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="label" htmlFor="model-select">Chọn Mô hình AI</label>
                    <select 
                      id="model-select" 
                      className="input" 
                      value={selectedModel} 
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh & Tiết kiệm)</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro (Chi tiết & Thông minh)</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => triggerSummarization(transcript._id)} 
                    className="btn" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    Bắt đầu tóm tắt bằng AI
                  </button>
                </div>
              ) : (
                <div 
                  className="markdown-output"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(transcript.summaryText) }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
