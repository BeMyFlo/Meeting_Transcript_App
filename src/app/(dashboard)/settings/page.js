"use client";

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/user/profile')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to load profile');
      })
      .then((data) => {
        setName(data.user.name);
        setEmail(data.user.email);
        setHasApiKey(data.user.hasApiKey);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật hồ sơ.');
      }

      setStatusMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateApiKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi cập nhật API Key.');
      }

      setHasApiKey(!!apiKey);
      setApiKey(''); // clear field
      setStatusMsg({ type: 'success', text: apiKey ? 'Đã lưu và mã hóa Gemini API Key thành công!' : 'Đã xóa API Key thành công!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSavingKey(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-muted)' }}>
        Đang tải thông tin cài đặt...
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Cài đặt tài khoản</h1>
          <p>Quản lý thông tin cá nhân và cấu hình kết nối API của bạn</p>
        </div>
      </div>

      {statusMsg.text && (
        <div className={statusMsg.type === 'success' ? 'alert-success' : 'alert-error'} style={{ maxWidth: '600px' }}>
          {statusMsg.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '600px' }}>
        
        {/* Profile Card */}
        <div className="card" style={{ margin: 0 }}>
          <h2 className="card-title">👤 Thông tin cá nhân</h2>
          
          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="label">Địa chỉ Email (Đăng nhập)</label>
              <input 
                type="email" 
                className="input" 
                value={email} 
                disabled 
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Không thể thay đổi email đăng nhập.</span>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="label" htmlFor="username">Họ và tên</label>
              <input 
                id="username"
                type="text" 
                className="input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn" disabled={savingProfile}>
              {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Gemini API Key Configuration Card */}
        <div className="card" style={{ margin: 0 }}>
          <h2 className="card-title">🔑 Cấu hình Gemini API Key</h2>
          
          <form onSubmit={handleUpdateApiKey}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              Mặc định, ứng dụng sẽ sử dụng API Key hệ thống trong tệp cấu hình <code>.env</code>.
              Nếu bạn muốn sử dụng API Key cá nhân của riêng mình (bảo mật, không lo giới hạn băng thông), vui lòng cấu hình tại đây. API Key sẽ được mã hóa an toàn trước khi lưu vào MongoDB.
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="label" htmlFor="apiKey">Gemini API Key của bạn</label>
              <input 
                id="apiKey"
                type="password" 
                className="input" 
                placeholder={hasApiKey ? '•••••••••••••••••••••••• (Đã cấu hình)' : 'Dán API Key của bạn tại đây...'} 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Để xóa API Key cá nhân và sử dụng lại cấu hình hệ thống, hãy để trống ô này và nhấn "Cập nhật".
              </span>
            </div>

            <button type="submit" className="btn" disabled={savingKey}>
              {savingKey ? 'Đang lưu...' : 'Cập nhật API Key'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
