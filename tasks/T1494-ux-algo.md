# T1494 — UI/UX: cải thiện màn hình Luyện thuật toán (#/algo)

Status: DONE
Agent: kilo
Owns: `js/views/algo.js`, `css/views/algo.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/algo.js` và `css/views/algo.css` trước khi sửa.

## Trọng tâm
bố cục đề / editor / kết quả hợp lý trên desktop và mobile, gợi ý mở dần, kết quả chạy test dễ đọc.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-algo`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/algo.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes
**Cải tiến đã thực hiện (6 mục chính):**

1. **Touch targets ≥ 40px trên mobile** — CSS: `.btn.sm` padding 10px 14px, min-height 44px; `.chip` min-height 40px; hint/run/review buttons full-width 100% trên mobile.

2. **Focus visible cho accessibility** — Thêm `:focus-visible` cho `.algo-row`, `.algo-editor`, tất cả `button`, `a`, `input`, `textarea`, `.chip` với outline 2px var(--accent).

3. **Phím tắt hiển thị rõ trong UI** — Thêm `.algo-shortcuts` footer trong màn chi tiết hiển thị `<kbd>H</kbd> Gợi ý`, `<kbd>S</kbd> Lời giải`, `<kbd>Ctrl+Enter</kbd> Chạy test` (có i18n vi/en).

4. **Timer & nút hành động nổi bật hơn** — Timer font-size 1.75rem trên mobile, min-width 100px; nút Chạy test/AI review full-width, padding 12px; goal chips min-height 40px.

5. **Kết quả test & AI review dễ đọc hơn** — CSS mới cho `.run-result`, `.run-result-case.ok/fail`, `.run-result-output` (scroll, max-height 200px), `.code-feedback-section` với padding, border-radius, màu sắc phân biệt.

6. **ARIA & UX nhỏ** — `aria-label`, `aria-pressed`, `aria-live` cho hint/timer/panels; hint tự scrollIntoView khi mở; nút loading đổi text thành spinner text; copy/reset feedback rõ ràng; `prefers-reduced-motion`, `prefers-contrast: high`, print styles.

**Validation:** `node --check js/views/algo.js` ✓, `node scripts/validate.js` → `OK — không có lỗi.` ✓, `node scripts/test-algos.js` → `Harness OK: 134` ✓.

**Đề xuất cho core (nếu có):** Không có — thay đổi nằm hoàn toàn trong 2 file owned.Reviewed-by: verify-only (code/UI task)
