"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch profile details
    fetch('/api/user/profile')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch profile');
      })
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        // Auth error is normally handled by middleware redirects, but as fallback:
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async (e) => {
    e.preventDefault();
    if (confirm('Bạn chắc chắn muốn đăng xuất chứ?')) {
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          router.push('/login');
          router.refresh();
        }
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <Link href="/dashboard" className="sidebar-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Transcriber</span>
        </Link>
        
        <nav className="sidebar-menu">
          <Link href="/dashboard" className={`sidebar-item ${pathname === '/dashboard' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Bảng điều khiển
          </Link>
          <Link href="/history" className={`sidebar-item ${pathname.startsWith('/history') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
            Lịch sử cuộc họp
          </Link>
          <Link href="/settings" className={`sidebar-item ${pathname === '/settings' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Cài đặt tài khoản
          </Link>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div style={{ marginBottom: '15px', padding: '0 8px' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email}</div>
            </div>
          )}
          <a href="#logout" onClick={handleLogout} className="sidebar-item" style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            Đăng xuất
          </a>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
