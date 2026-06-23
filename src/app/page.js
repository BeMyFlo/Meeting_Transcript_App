import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'space-between' }}>
      
      {/* Navigation Header */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 40px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{
          fontFamily: 'var(--font-family)',
          fontSize: '1.5rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '-0.02em'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          <span style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Transcriber</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            Đăng nhập
          </Link>
          <Link href="/register" className="btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
            Đăng ký
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        gap: '24px',
        animation: 'fadeIn 0.8s ease'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '6px 12px',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--primary-color)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px'
        }}>
          Powered by Gemini 1.5 & MongoDB
        </div>

        <h1 style={{
          fontFamily: 'Outfit',
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(to right, #ffffff, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Biến các bản ghi cuộc họp thành dữ liệu thông minh
        </h1>

        <p style={{
          fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          lineHeight: 1.6,
          fontWeight: 300
        }}>
          Tải lên video MP4 hoặc âm thanh MP3. Trình ghi chép thông minh tự động xuất văn bản có mốc thời gian và tóm tắt hành động cuộc họp tức thì.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <Link href="/register" className="btn" style={{ padding: '14px 32px', fontSize: '1.05rem' }}>
            Bắt đầu trải nghiệm ngay
          </Link>
        </div>

        {/* Feature Highlights */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          width: '100%',
          marginTop: '60px',
        }}>
          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'left',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ marginBottom: '12px', color: 'var(--primary-color)', display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', marginBottom: '8px' }}>Nhận diện mốc thời gian</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Tự động phân đoạn và chèn mốc thời gian <code>[MM:SS -&gt; MM:SS]</code> cho từng câu thoại trong cuộc họp.
            </p>
          </div>

          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'left',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ marginBottom: '12px', color: 'var(--secondary-color)', display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/></svg>
            </div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', marginBottom: '8px' }}>Tóm tắt hành động</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              AI tự động phân tích cuộc họp, tóm tắt các điểm thảo luận chính và các công việc cần thực hiện (Action Items).
            </p>
          </div>

          <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            borderRadius: '16px',
            textAlign: 'left',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ marginBottom: '12px', color: 'var(--primary-color)', display: 'flex' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
            </div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', marginBottom: '8px' }}>Lưu trữ bảo mật</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Lưu trữ vĩnh viễn và tìm kiếm lịch sử các cuộc họp trước đó trực tiếp trên hệ thống cơ sở dữ liệu MongoDB riêng.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 20px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        borderTop: '1px solid var(--border-color)',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        © 2026 AI Transcriber & Summarizer. Phát triển bởi Đội ngũ Công nghệ.
      </footer>
    </div>
  );
}
