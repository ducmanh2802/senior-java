# T2126 — Báo cáo điểm yếu hằng tuần (trên Dashboard)

Status: DONE
Agent: claude
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`
After: T2124

## Bối cảnh
Người học có 6 tháng ôn phỏng vấn Senior Java, ngân hàng ~2000 câu là quá nhiều; trọng tâm là bộ ~400 câu lõi (tag 'core'). App phải tự dẫn người học ôn đúng thứ cần ôn.

## Việc cần làm
1. Thêm thẻ **"Tuần này"** trên dashboard (có thể thu gọn): trong 7 ngày gần nhất (`App.store.day(key)` cho từng ngày, `App.dayKey`, `App.DAY`) — số câu đã ôn, số câu mới thuộc, số phút học, số buổi quiz/mock.
2. **Top 3 chủ đề yếu**: với mỗi topic, tỉ lệ (unknown + review) / đã học từ `App.stats(topicId)`; kết hợp điểm mock gần đây theo topic nếu `App.store.data.mockHistory` có (đọc cấu trúc thật trong code mock.js trước khi dùng, không đoán field). Mỗi chủ đề có nút "Ôn chủ đề này" → `#/flash/<topic>`.
3. Câu nhận xét ngắn theo số liệu (ví dụ "Tuần này bạn học 4/7 ngày, chủ đề yếu nhất là JPA").
4. Không có dữ liệu → nhắc "Học vài ngày để có báo cáo".

## Luật
- Đọc AGENTS.md mục 2, 3, 7 (và 9, 11 nếu đụng AI/phỏng vấn). Không framework, classic script, escape mọi dữ liệu bằng App.esc(). Chuỗi UI thêm vào cả bảng i18n 'vi' và 'en' ở đầu file view (theo mẫu có sẵn).
- Danh sách id câu lõi: `(window.DATA_INDEX && window.DATA_INDEX.core) || []` (sinh từ tag 'core', các task T2115–T2122 đang gắn). Khi danh sách rỗng, mọi tính năng mới phải tự ẩn hoặc hiện `.empty` thân thiện, không lỗi.
- KHÔNG sửa js/core/*, css/base.css, index.html, scripts/*. Cần thì ghi đề xuất vào Notes. CSS mới bắt đầu bằng `.view-<view>`, chỉ dùng biến màu, responsive 360px.
- Không gọi AI tự động. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check` các file đã sửa; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- 2026-11-15 Claude: làm trực tiếp (user giao). Plan v2 (PLAN_VERSION) thêm item 'core' (perDay 2–8 lưu ở store.data.corePlan), ngày thường xen kẽ algo/lesson; thẻ ⭐ Bộ câu lõi (ẩn khi DATA_INDEX.core rỗng); details 'Báo cáo tuần này' (7 ngày từ store.day, top 3 chủ đề yếu + mock < 3). Test bằng browser-shim.
