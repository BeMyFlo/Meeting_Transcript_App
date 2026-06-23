import "./globals.css";

export const metadata = {
  title: "AI Meeting Transcriber & Summarizer",
  description: "Trình ghi chép và tóm tắt cuộc họp tự động bằng trí tuệ nhân tạo Gemini và lưu trữ MongoDB.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
