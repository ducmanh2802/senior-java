# T2127 — Phỏng vấn thử: preset từ bộ câu lõi

Status: DONE
Agent: claude
Owns: `js/views/mock.js`, `css/views/mock.css`
After: T2122

## Bối cảnh
Người học có 6 tháng ôn phỏng vấn Senior Java, ngân hàng ~2000 câu là quá nhiều; trọng tâm là bộ ~400 câu lõi (tag 'core'). App phải tự dẫn người học ôn đúng thứ cần ôn.

## Việc cần làm
1. Thêm 2 preset vào màn hình thiết lập của js/views/mock.js (đọc cấu trúc preset có sẵn trước):
   - **"Senior Java – Ngân hàng"**: 6 câu core từ core/concurrency/spring/jpa/sql/microservices + 1 câu topic banking (nếu có) + 1 behavioral, 1 bài coding medium.
   - **"Senior Java – Outsource/Product"**: 6 câu core từ core/collections/jvm/spring/api/design + 1 behavioral, 1 bài coding medium.
2. Thêm checkbox **"Chỉ câu lõi"** cho cấu hình tự chọn: lọc câu ứng viên theo tag 'core'.
3. Với preset, ưu tiên câu chưa thuộc (dùng logic "Ưu tiên câu tôi chưa thuộc" có sẵn).
4. Nếu không đủ câu core → lấp bằng câu thường cùng topic và ghi chú nhỏ.

## Luật
- Đọc AGENTS.md mục 2, 3, 7 (và 9, 11 nếu đụng AI/phỏng vấn). Không framework, classic script, escape mọi dữ liệu bằng App.esc(). Chuỗi UI thêm vào cả bảng i18n 'vi' và 'en' ở đầu file view (theo mẫu có sẵn).
- Danh sách id câu lõi: `(window.DATA_INDEX && window.DATA_INDEX.core) || []` (sinh từ tag 'core', các task T2115–T2122 đang gắn). Khi danh sách rỗng, mọi tính năng mới phải tự ẩn hoặc hiện `.empty` thân thiện, không lỗi.
- KHÔNG sửa js/core/*, css/base.css, index.html, scripts/*. Cần thì ghi đề xuất vào Notes. CSS mới bắt đầu bằng `.view-<view>`, chỉ dùng biến màu, responsive 360px.
- Không gọi AI tự động. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check` các file đã sửa; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- 2026-11-15 Claude: preset bank/product có slots (6 kỹ thuật + banking + behavioral, coding medium), checkbox ⭐ Chỉ câu lõi; pickQuestions ưu tiên core rồi bù câu thường + ghi chú khi thiếu.
Reviewed-by: verify-only (code/UI task)
