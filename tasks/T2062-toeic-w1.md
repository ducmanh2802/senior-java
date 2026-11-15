# T2062 — TOEIC Speaking & Writing: thêm 12 bài w1

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T2061

Mục tiêu: có NHIỀU ĐỀ để chế độ thi thử ở `#/toeic` không lặp bài. Thêm vào `js/data/toeic.js`: 12 bài w1. Id nối tiếp id lớn nhất hiện có của từng part (w1).

Cách làm (tiết kiệm, KHÔNG đọc toàn bộ file dữ liệu ~140 KB):
1. Đọc chú thích schema ở ĐẦU `js/data/toeic.js` (chỉ phần comment đầu file) và task mẫu `tasks/T1512-toeic-w1.md`: giữ đúng định dạng, field, độ dài, số từ, thời gian của từng part theo đề thật ETS.
2. `node scripts/qtool.js list js/data/toeic.js` để xem bài đã có (tránh trùng chủ đề), `node scripts/qtool.js show js/data/toeic.js <id>` để xem 1 bài mẫu cùng part.
3. Viết các object mới vào file tạm `logs/tmp-T2062.js`, rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2062.js`.

Chủ đề MỚI, không trùng bài đã có (xem `qtool.js list`): công sở (họp, onboarding, IT helpdesk, làm việc hybrid, chi phí công tác), dịch vụ (ngân hàng, bảo hiểm, bệnh viện, sửa chữa, giao hàng), đời sống (nhà ở, thể dục, ẩm thực, giao thông công cộng, sự kiện cộng đồng), du lịch (khách sạn, sân bay, tour). Tên người, công ty, địa điểm là hư cấu; giờ, ngày, giá trong cùng một bài phải khớp nhau.

Chất lượng: tiếng Anh tự nhiên, đúng ngữ pháp, đúng văn phong đề TOEIC; bài mẫu (sample) đạt mức điểm cao nhất của part; phần hướng dẫn/mẹo cho người Việt (nếu schema có) viết tiếng Việt, cụ thể, có cụm từ dùng được ngay.

## Luật
- Đọc AGENTS.md (mục 2, 5). **Chỉ thêm** vào `js/data/toeic.js`; không sửa bài đã có, không sửa file khác.
- Không backtick, không `${` trong nội dung.
- Nghiệm thu: `node --check js/data/toeic.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi các id đã thêm.

## Notes
Đã thêm 12 bài TOEIC Writing part 1 (w1) vào js/data/toeic.js: toeic-w1-031 đến toeic-w1-042. Các chủ đề bao gồm: onboarding nhân viên mới, IT helpdesk, họp hybrid, báo chi phí công tác, ký hợp đồng vay ngân hàng, khám bệnh nhi, sửa lốp xe tại gara, giao hàng tận nơi, dọn dẹp căn hộ, tập thể dục công viên, check-in khách sạn, qua an ninh sân bay. Mỗi bài có scene (tiếng Việt), words (2 từ), sample (1 câu dùng đủ 2 từ) và tips (2–3 mẹo tiếng Việt có dấu). validate.js: OK — không có lỗi.
Reviewed-by: verify-only (code/UI task)
