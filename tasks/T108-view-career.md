# T108 — View `#/career`: câu chuyện STAR, góp ý CV, nhật ký phỏng vấn thật

Status: TODO
Agent: opencode
Owns: `js/views/career.js`, `css/views/career.css`, `index.html`

Đọc AGENTS.md mục 7, 9, **15**; xem `js/views/learn.js`/`interview.js` để theo cùng phong cách. API đã có (`App.ai.coach`), không sửa `js/core/*` hay `api/*`.

## Tab 1 — Câu chuyện STAR (`#/career` hoặc `#/career/star`)
- Danh sách câu chuyện (`App.store.data.stories`, bỏ qua `deleted`), mỗi thẻ: title, themes (chips), nút Sửa / Xoá (đặt `deleted: true`, cập nhật `updatedAt`).
- "Thêm câu chuyện": textarea ghi chú thô (bối cảnh, bạn làm gì, kết quả), ô chủ đề tuỳ chọn (gợi ý chips: Sự cố production, Xung đột, Dẫn dắt, Thất bại, Deadline gấp, Thuyết phục, Mentoring), chọn ngôn ngữ VI/EN → "🤖 Viết thành STAR" (`App.ai.coach.star`, khoá nút + ai-loading, lỗi `App.ui.error`). Hiển thị S/T/A/R, bản kể `spoken`, `gaps` (cảnh báo màu warn), `follow_ups`; cho sửa tay các trường rồi "Lưu" → push vào `stories` với `id` (Date.now().toString(36)+random), `updatedAt`, `notes` (ghi chú gốc), `lang`.
- Nút "🎤 Luyện kể": hiển thị `spoken`, ghi âm bằng `App.speech.start` và hiện `App.ui.speechStats` (thời lượng, wpm, từ đệm) so với mục tiêu ~2 phút.
- Gợi ý: hiện bảng "chủ đề behavioral hay gặp" và đánh dấu chủ đề nào đã có ≥ 1 câu chuyện.

## Tab 2 — Góp ý CV (`#/career/cv`)
- Textarea dán CV (nháp `localStorage` key `sjp.career.cv`), ô "Vị trí/JD mục tiêu" tuỳ chọn → "🤖 Review CV" (`App.ai.coach.cv`). Hiển thị score (`App.ui.scoreBadge`), verdict, strengths, bảng issues (where / problem / fix, nút Copy cho fix), missing_keywords (kèm nhắc "chỉ thêm nếu bạn thực sự đã làm"), likely_questions. Lưu kết quả gần nhất vào `localStorage` key `sjp.career.cvResult`.

## Tab 3 — Nhật ký phỏng vấn (`#/career/log`)
- Form: công ty (gợi ý từ `window.COMPANIES`), vị trí, ngày, vòng (HR/Technical/System design/Manager/Final), kết quả (Chờ/Đậu/Trượt), danh sách câu đã bị hỏi (mỗi dòng một câu), ghi chú / bài học. Lưu vào `App.store.data.interviewLog` (id, updatedAt, deleted như trên).
- Danh sách theo ngày mới nhất; thống kê nhỏ: số buổi, tỷ lệ đậu, công ty.
- Với mỗi câu đã bị hỏi: tìm câu gần giống trong `App.questions()` (so khớp từ khoá đơn giản theo `q`) → link "Ôn câu tương tự" `#/bank/<topic>`; không tìm thấy thì đánh dấu "chưa có trong ngân hàng".
- Nút "Xuất câu chưa có" → tải file .txt các câu chưa có (để bổ sung vào ngân hàng sau).

## Chung
- `index.html`: thêm `<link>` css, `<script src="js/views/career.js">` cùng nhóm views, và mục menu `<a href="#/career" data-route="career">🧭 Sự nghiệp</a>` trong nhóm **Luyện tập**. Không sửa phần khác.
- Escape mọi dữ liệu; responsive 360px; chỉ dùng biến CSS; cleanup listener.

## Nghiệm thu
`node --check`, `node scripts/validate.js` → OK.

## Notes
