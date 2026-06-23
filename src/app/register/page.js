"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đã xảy ra lỗi khi tạo tài khoản.');
      }

      setSuccess('Đăng ký tài khoản thành công! Đang chuyển tới trang đăng nhập...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản mới và dịch thuật cuộc họp ngay</p>
        </div>

        {error && <div className="alert-error">{error}</div>}
        {success && <div className="alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label" htmlFor="name">Họ và tên</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="nhap@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '30px' }}>
            <label className="label" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Tối thiểu 6 ký tự..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <button type="submit" className="btn" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
