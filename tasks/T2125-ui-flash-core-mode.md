# T2125 — Flashcard: chế độ "Chỉ câu lõi"

Status: DONE
Agent: claude
Owns: `js/views/flash.js`, `css/views/flash.css`
After: T2122

## Bối cảnh
Người học có 6 tháng ôn phỏng vấn Senior Java, ngân hàng ~2000 câu là quá nhiều; trọng tâm là bộ ~400 câu lõi (tag 'core'). App phải tự dẫn người học ôn đúng thứ cần ôn.

## Việc cần làm
1. Thêm chip/toggle **"⭐ Chỉ câu lõi"** ở màn hình chọn bộ thẻ của js/views/flash.js; bật → bộ thẻ chỉ gồm câu có `(q.tags||[]).includes('core')` (dữ liệu đầy đủ đã nạp trong view flash), kết hợp với chủ đề đang chọn.
2. Thêm lựa chọn nhanh **"Ôn 15 phút"**: 10 thẻ core, ưu tiên câu đến hạn (`App.store.isDue`) rồi câu "Chưa biết"/"Cần ôn", rồi câu chưa học.
3. Hiện số thẻ core khả dụng; nếu 0 → `.empty` "Chưa có câu lõi".
4. Phím tắt cho toggle (ví dụ <kbd>C</kbd>) kèm gợi ý kbd.

## Luật
- Đọc AGENTS.md mục 2, 3, 7 (và 9, 11 nếu đụng AI/phỏng vấn). Không framework, classic script, escape mọi dữ liệu bằng App.esc(). Chuỗi UI thêm vào cả bảng i18n 'vi' và 'en' ở đầu file view (theo mẫu có sẵn).
- Danh sách id câu lõi: `(window.DATA_INDEX && window.DATA_INDEX.core) || []` (sinh từ tag 'core', các task T2115–T2122 đang gắn). Khi danh sách rỗng, mọi tính năng mới phải tự ẩn hoặc hiện `.empty` thân thiện, không lỗi.
- KHÔNG sửa js/core/*, css/base.css, index.html, scripts/*. Cần thì ghi đề xuất vào Notes. CSS mới bắt đầu bằng `.view-<view>`, chỉ dùng biến màu, responsive 360px.
- Không gọi AI tự động. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check` các file đã sửa; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- 2026-11-15 Claude: chip ⭐ Chỉ câu lõi (phím C, S.core), chế độ 'quick' (10 thẻ lõi; route #/flash/core). File chuẩn hoá CRLF→LF.
