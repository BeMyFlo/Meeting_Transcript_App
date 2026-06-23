"use client";

import { useEffect, useState } from 'react';
import Link from 'next/navigation';
import LinkItem from 'next/link';

export default function HistoryPage() {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    fetch('/api/transcripts')
      .then((res) => res.json())
      .then((data) => {
        setTranscripts(data.transcripts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load history:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id, fileName, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Bạn chắc chắn muốn xóa bản ghi "${fileName}" khỏi lịch sử?`)) {
      try {
        const res = await fetch(`/api/transcripts/${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Đã xóa thành công!');
          fetchHistory();
        } else {
          const data = await res.json();
          alert(data.error || 'Lỗi khi xóa bản ghi.');
        }
      } catch (err) {
        alert('Lỗi kết nối mạng: ' + err.message);
      }
    }
  };

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Lịch sử cuộc họp</h1>
          <p>Danh sách các cuộc họp đã được xử lý và tóm tắt</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Đang tải dữ liệu lịch sử...
          </div>
        ) : transcripts.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: '15px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            </div>
            <p style={{ fontWeight: 500, fontSize: '1.05rem', color: 'var(--text-main)' }}>Chưa có bản ghi nào</p>
            <p style={{ fontSize: '0.85rem', marginTop: '5px' }}>Các cuộc họp bạn xử lý sẽ xuất hiện tại đây.</p>
            <LinkItem href="/dashboard" className="btn" style={{ display: 'inline-flex', marginTop: '20px' }}>
              Dịch cuộc họp đầu tiên
            </LinkItem>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '15px 10px' }}>Tên cuộc họp / Tệp tin</th>
                  <th style={{ padding: '15px 10px' }}>Ngày dịch</th>
                  <th style={{ padding: '15px 10px' }}>Dung lượng</th>
                  <th style={{ padding: '15px 10px' }}>Trạng thái</th>
                  <th style={{ padding: '15px 10px', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map((item) => (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.95rem', transition: 'background var(--transition-fast)' }} className="table-row-hover">
                    <td style={{ padding: '15px 10px', fontWeight: 500 }}>
                      <LinkItem href={`/history/${item._id}`} style={{ color: 'var(--text-main)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                        {item.fileName}
                      </LinkItem>
                    </td>
                    <td style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>
                      {formatDate(item.createdAt)}
                    </td>
                    <td style={{ padding: '15px 10px', color: 'var(--text-muted)' }}>
                      {formatBytes(item.fileSize)}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: item.status === 'completed' ? 'var(--success-color)' : 'var(--error-color)',
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '15px 10px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <LinkItem href={`/history/${item._id}`} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500 }}>
                          Xem chi tiết
                        </LinkItem>
                        <button onClick={(e) => handleDelete(item._id, item.fileName, e)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 500 }}>
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
}
