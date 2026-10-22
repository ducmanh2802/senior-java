# T34 — Trang Quyền riêng tư, Điều khoản, Giới thiệu

Status: TODO
Agent: opencode
Owns: `js/views/legal.js`, `css/views/legal.css`

> **Ghi theo lô nhỏ.** Đọc `AGENTS.md` mục 7 và 10, thư mục `api/`, `supabase/schema.sql` và `js/core/ai.js` để mô tả **đúng sự thật** những gì hệ thống làm.

Route: `#/legal/privacy`, `#/legal/terms`, `#/legal/about` (`params[0]`; không có thì mặc định `about`). Có tab chuyển giữa 3 trang.
Viết tiếng Việt, rõ ràng, không dùng văn phong pháp lý rườm rà. Đầu mỗi trang ghi "Cập nhật lần cuối: 22/10/2026".

### Quyền riêng tư (chỉ mô tả những gì code thực sự làm)
- Dữ liệu thu thập khi đăng nhập: email, tên, avatar (từ Google), tiến độ học (JSON), số lượt dùng AI theo ngày.
- **Không đăng nhập**: mọi thứ nằm trong `localStorage` của trình duyệt, không gửi đi đâu.
- **AI chấm điểm**: câu trả lời và code được gửi tới Anthropic (Claude API) để chấm; theo chính sách API của Anthropic, dữ liệu không được dùng để huấn luyện mặc định (link https://www.anthropic.com/legal/privacy). Code chạy test được gửi tới Judge0.
- **Giọng nói**: nhận dạng bằng Web Speech API của trình duyệt (Chrome/Edge có thể gửi âm thanh tới máy chủ của Google/Microsoft để nhận dạng). App **không ghi âm và không lưu file âm thanh**, chỉ gửi văn bản khi người dùng bấm chấm điểm.
- Nơi lưu: Supabase (PostgreSQL), host trên Vercel. Quyền của người dùng: tải toàn bộ dữ liệu và xoá tài khoản tại `#/account`.
- Không bán dữ liệu, không quảng cáo, không cookie theo dõi của bên thứ ba (font chữ được tải từ Google Fonts).
### Điều khoản
- Nội dung chỉ để học tập, có thể còn sai sót. Thông tin công ty tổng hợp từ nguồn công khai, có ghi nguồn; chủ sở hữu có thể yêu cầu gỡ.
- Hạn mức AI miễn phí mỗi ngày có thể thay đổi. Cấm lạm dụng hoặc tự động hoá gọi API.
- Không bảo đảm kết quả phỏng vấn.
### Giới thiệu
- App là gì, dành cho ai, các tính năng chính, cách nội dung được tạo (agent AI viết, sau đó được review fact-check). Mã nguồn: https://github.com/ducmanh2802/senior-java
- Liên hệ và yêu cầu gỡ nội dung: tạo issue tại https://github.com/ducmanh2802/senior-java/issues

## Nghiệm thu
`node --check`, `npm run smoke` OK. Integrator sẽ review nội dung trước khi publish.

## Notes
