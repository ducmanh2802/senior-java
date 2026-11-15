# T2123 — Ngân hàng câu hỏi: bộ lọc "⭐ Câu lõi" (tag core)

Status: DONE
Agent: kilo
Owns: `js/views/bank.js`, `css/views/bank.css`
After: T2122

## Bối cảnh
Ngân hàng có ~2000 câu, người học chỉ có 6 tháng. Các task T2115–T2122 gắn tag `'core'` cho ~400 câu lõi (`q.tags` chứa `'core'`).

## Việc cần làm (chỉ sửa js/views/bank.js và css/views/bank.css)
1. Thêm một chip bật/tắt **"⭐ Câu lõi"** (EN: "⭐ Core set") cạnh nhóm chip trạng thái. Bật → chỉ hiện câu có `(q.tags || []).includes('core')`, kết hợp (AND) với các bộ lọc chủ đề/level/trạng thái/tìm kiếm hiện có. Lọc thêm trên kết quả của `App.filterQuestions(...)` ở dòng ~157, KHÔNG sửa js/core/app.js.
2. Lưu trạng thái bật/tắt vào state S giống các bộ lọc khác (nếu S được lưu lại giữa các lần mở thì lưu luôn).
3. Hiện số đếm: "⭐ Câu lõi (N)" với N = số câu core trong chủ đề đang chọn; khi tất cả chủ đề → tổng.
4. Trong danh sách, câu core có badge nhỏ "⭐ lõi" (dùng class `.badge` có sẵn).
5. Thêm chuỗi i18n vào cả bảng 'vi' và 'en' ở đầu file (theo mẫu `'bank.bookmarked'`).
6. Nếu chưa có câu nào có tag core (các task gắn tag chưa xong) thì chip vẫn hiện, bấm vào hiện `.empty` "Chưa có câu lõi".
7. Nút có `aria-pressed`; CSS mới (nếu cần) bắt đầu bằng `.view-bank`, chỉ dùng biến màu.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không framework, classic script, escape dữ liệu bằng App.esc().
- Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/bank.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- Đã thêm i18n keys: `bank.coreFilter` (vi: "⭐ Câu lõi", en: "⭐ Core set"), `bank.coreBadge` (vi: "⭐ lõi", en: "⭐ core"), `bank.coreEmpty` (vi: "Chưa có câu lõi", en: "No core questions yet").
- State S mới: `S.core = false` (toggle on/off).
- Hàm `isCore(q)` và `coreCount()` để lọc/đếm câu có tag 'core'.
- `filtered()` lọc thêm core khi `S.core = true` (AND với các filter khác).
- `statusChips()` thêm chip `.chip-core` label "⭐ Câu lõi (N)" + class `.active` khi bật; có `aria-pressed`.
- `onRootClick` xử lý click core chip: toggle S.core, cập nhật aria-pressed/class, `renderList()`.
- `headHtml(q)` hiển thị badge `.badge` text từ `bank.coreBadge` cho câu core.
- `listHtml()` empty: `S.core` bật mà `coreCount() === 0` → "Chưa có câu lõi" + nút tắt core filter.
- CSS thêm `.view-bank .chip-core` (accent border/bg; `.active` đổi nền), chỉ dùng biến màu.
- `clearFilters()` reset `S.core = false`.
Reviewed-by: verify-only (code/UI task)
