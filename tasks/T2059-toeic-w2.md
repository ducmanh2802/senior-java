# T2059 — TOEIC Speaking & Writing: thêm 12 bài w2

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T2058

Mục tiêu: có NHIỀU ĐỀ để chế độ thi thử ở `#/toeic` không lặp bài. Thêm vào `js/data/toeic.js`: 12 bài w2. Id nối tiếp id lớn nhất hiện có của từng part (w2).

Cách làm (tiết kiệm, KHÔNG đọc toàn bộ file dữ liệu ~140 KB):
1. Đọc chú thích schema ở ĐẦU `js/data/toeic.js` (chỉ phần comment đầu file) và task mẫu `tasks/T1513-toeic-w2.md`: giữ đúng định dạng, field, độ dài, số từ, thời gian của từng part theo đề thật ETS.
2. `node scripts/qtool.js list js/data/toeic.js` để xem bài đã có (tránh trùng chủ đề), `node scripts/qtool.js show js/data/toeic.js <id>` để xem 1 bài mẫu cùng part.
3. Viết các object mới vào file tạm `logs/tmp-T2059.js`, rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2059.js`.

Chủ đề MỚI, không trùng bài đã có (xem `qtool.js list`): công sở (họp, onboarding, IT helpdesk, làm việc hybrid, chi phí công tác), dịch vụ (ngân hàng, bảo hiểm, bệnh viện, sửa chữa, giao hàng), đời sống (nhà ở, thể dục, ẩm thực, giao thông công cộng, sự kiện cộng đồng), du lịch (khách sạn, sân bay, tour). Tên người, công ty, địa điểm là hư cấu; giờ, ngày, giá trong cùng một bài phải khớp nhau.

Chất lượng: tiếng Anh tự nhiên, đúng ngữ pháp, đúng văn phong đề TOEIC; bài mẫu (sample) đạt mức điểm cao nhất của part; phần hướng dẫn/mẹo cho người Việt (nếu schema có) viết tiếng Việt, cụ thể, có cụm từ dùng được ngay.

## Luật
- Đọc AGENTS.md (mục 2, 5). **Chỉ thêm** vào `js/data/toeic.js`; không sửa bài đã có, không sửa file khác.
- Không backtick, không `${` trong nội dung.
- Nghiệm thu: `node --check js/data/toeic.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi các id đã thêm.

## Notes
- Đã kiểm tra trạng thái file: `toeic-w2-001`…`toeic-w2-014` đã tồn tại từ các lần chạy trước (trong đó 009-014 thuộc batch w2 mới). Lần này hoàn thiện phần còn thiếu bằng cách append thêm 6 bài qua `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2059.js` (lần append đầu gặp "id already exists" do 009-014 đã có; đã ghi lại tmp và append phần 015-020).
- Id w2 mới của batch (tổng 12): `toeic-w2-009`–`toeic-w2-020` (009: onboarding/IT, 010: hybrid schedule, 011: client visit materials, 012: travel expense receipts, 013: bank waiting time, 014: appliance repair, 015: elevator maintenance/housing, 016: hotel reservation, 017: walking tour, 018: community volunteer, 019: delivery schedule/operations, 020: clinic appointment). Mỗi bài có email, task, sample 80–150 từ, 3 tips tiếng Việt; tên/công ty/địa điểm hư cấu, ngày/giờ/giá khớp trong bài; không backtick/`${`.
- Kiểm tra: `node --check js/data/toeic.js` OK; `node scripts/build-light-index.js` OK (index-light.js cập nhật); `node scripts/validate.js` → `OK — không có lỗi.` (TOEIC S&W: 136 bài, w2: 20). Không commit, không sửa file ngoài phạm vi, không kill process, không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
