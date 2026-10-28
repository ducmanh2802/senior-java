# T312 — Phỏng vấn AI: làm giao diện đẹp hơn

Status: DONE
Agent: opencode
Owns: `css/views/interview.css`, `js/views/interview.js`
After: T311

Chỉ làm phần **trình bày**, không đổi logic hay luồng gọi API của T311. Mọi selector bắt đầu bằng `.view-interview`. Chỉ dùng biến màu trong `css/base.css` để dark mode tự chạy. Responsive tới 360px.

1. Hội thoại dạng **chat bubble**:
   - Interviewer bên trái: avatar tròn chữ "AI", nền `var(--card)`.
   - Ứng viên bên phải: nền accent nhạt, `color-mix(in srgb, var(--accent) 12%, transparent)`.
   - Thời gian nhỏ dưới mỗi bubble, tự cuộn xuống cuối, có hiệu ứng "đang soạn…" (3 chấm) khi chờ AI.
2. Màn cấu hình: nhóm lựa chọn dạng thẻ (ngôn ngữ, level, persona, thời lượng) thay cho các select dày đặc; nút Bắt đầu lớn; dòng mô tả ngắn "1 phiên = 1 lượt hạn mức".
3. Thanh điều khiển dính đáy (sticky) trên mobile: mic lớn ở giữa, có vòng sóng nhấp nháy khi ở trạng thái `.recording`; ô gõ phím; nút gửi.
4. Trang tổng kết:
   - Thẻ điểm tổng lớn (vòng tròn `conic-gradient`) và hire signal.
   - Các thẻ Điểm mạnh / Cần cải thiện / Học tiếp có icon.
   - Thanh điểm theo từng câu.
5. Tắt animation khi `prefers-reduced-motion`. Không dùng ảnh hay font ngoài.
6. `node --check`, `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

- `interview.costHint` updated to "1 phiên = 1 lượt hạn mức".
- All 6 UI requirements verified in existing code:
  1. Chat bubbles: interviewer left (avatar "AI", `var(--card)`), candidate right (accent 12% mix), time under each bubble, auto-scroll (`box.scrollTop = box.scrollHeight`), typing indicator (3 dots) when `busy`.
  2. Setup screen: choice chips for language/level/duration/persona/mode; large primary "Bắt đầu phỏng vấn" button; cost hint line.
  3. Sticky compose bar: `.mic-btn.lg` with `.recording` ripple animation (`@keyframes iv-ripple`), textarea, send button.
  4. Result page: `.iv-score-circle` conic-gradient, hire signal badge, strengths/improvements/studyNext cards with icons, per-question bar chart.
  5. `@media (prefers-reduced-motion: reduce)` disables all animations.
  6. `node --check` passes; `node scripts/validate.js` → OK.

Reviewed-by: verify-only (code/UI task)
