# T1496 — UI/UX: cải thiện màn hình Debug lab (#/labs)

Status: DONE
Agent: kilo
Owns: `js/views/labs.js`, `css/views/labs.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/labs.js` và `css/views/labs.css` trước khi sửa.

## Trọng tâm
đọc artifact dài (log, jstack) dễ chịu: khung cuộn riêng, nút sao chép, đánh số dòng nếu làm được; câu hỏi và gợi ý dễ tìm.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-labs`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/labs.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes
### Cải tiến đã thực hiện:

**Artifact viewer (js/views/labs.js + css/views/labs.css):**
1. **Nút điều hướng kết quả tìm kiếm** — Nút ↑/↓ (Prev/Next match) để nhảy giữa các dòng khớp, kèm phím tắt `N`/`P` và gợi ý `<kbd>`.
2. **Copy từng dòng** — Nút 📋 hiện ra khi hover dòng, copy đúng dòng đó (kèm phím tắt tooltip). Trên mobile luôn hiển thị mờ.
3. **Bật/tắt xuống dòng (wrap)** — Nút ⏎ toggle `white-space: pre` ↔ `pre-wrap`, phím tắt `W`, trạng thái lưu trong session.
4. **Highlight dòng kết quả hiện tại** — Dòng đang chọn khi nhảy tìm kiếm được outline accent.
5. **Loading indicator** — Hiển thị "Đang tải artifact…" cho file >50KB khi chuyển tab.
6. **Sticky tabs** — Thanh tab artifact cố định khi cuộn (desktop ≥641px).
7. **Phím tắt mở rộng** — `1-9` chuyển artifact, `/` focus ô tìm, `W` toggle wrap, `N/P` next/prev match, `H` gợi ý, `S` xem đáp án. Cập nhật `kbdTip` hiển thị đầy đủ.

**Responsive / Mobile (css/views/labs.css):**
8. **Touch targets ≥40px** — Tất cả nút trong `.lab-art-tools`, `.lab-answer-actions`, `.lab-nav`, `.lab-self` có `min-height: 44px` (mobile) / `40px` (desktop).
9. **Tabs cuộn ngang** — Trên mobile tab artifact cuộn ngang (`overflow-x: auto`, `-webkit-overflow-scrolling: touch`).
10. **Search input 16px** — Ngăn zoom trên iOS khi focus.
11. **Layout nút đáp ứng** — `.lab-answer-actions` chuyển cột dọc trên mobile, nút full-width.
12. **Copy line luôn nhìn thấy** — Trên mobile nút copy dòng hiển thị mờ 0.5 opacity.

**Accessibility / UX:**
13. **ARIA labels/pressed** — Tất cả nút mới có `aria-label`, `aria-pressed` (wrap), `role="region"` cho viewer.
14. **Focus-visible** — Viewer, copy-line, wrap button có outline rõ ràng.
15. **Live region** — Search match count cập nhật qua `aria-live="polite"`.

**Không thay đổi:** Dữ liệu (`window.LABS`), API `App.*`, cấu trúc route, tính năng hiện có (hints, grading, speech, self-assess, related questions).

### Đề xuất cho file core (nếu có):
- Không có. Toàn bộ cải tiến nằm trong 2 file sở hữu.
Reviewed-by: verify-only (code/UI task)
