# T2063 — TOEIC Speaking & Writing: thêm 8 bài s3, 6 bài s4

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T2062

Mục tiêu: có NHIỀU ĐỀ để chế độ thi thử ở `#/toeic` không lặp bài. Thêm vào `js/data/toeic.js`: 8 bài s3, 6 bài s4. Id nối tiếp id lớn nhất hiện có của từng part (s3, s4).

Cách làm (tiết kiệm, KHÔNG đọc toàn bộ file dữ liệu ~140 KB):
1. Đọc chú thích schema ở ĐẦU `js/data/toeic.js` (chỉ phần comment đầu file) và task mẫu `tasks/T1510-toeic-s3-s4.md`: giữ đúng định dạng, field, độ dài, số từ, thời gian của từng part theo đề thật ETS.
2. `node scripts/qtool.js list js/data/toeic.js` để xem bài đã có (tránh trùng chủ đề), `node scripts/qtool.js show js/data/toeic.js <id>` để xem 1 bài mẫu cùng part.
3. Viết các object mới vào file tạm `logs/tmp-T2063.js`, rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2063.js`.

Chủ đề MỚI, không trùng bài đã có (xem `qtool.js list`): công sở (họp, onboarding, IT helpdesk, làm việc hybrid, chi phí công tác), dịch vụ (ngân hàng, bảo hiểm, bệnh viện, sửa chữa, giao hàng), đời sống (nhà ở, thể dục, ẩm thực, giao thông công cộng, sự kiện cộng đồng), du lịch (khách sạn, sân bay, tour). Tên người, công ty, địa điểm là hư cấu; giờ, ngày, giá trong cùng một bài phải khớp nhau.

Chất lượng: tiếng Anh tự nhiên, đúng ngữ pháp, đúng văn phong đề TOEIC; bài mẫu (sample) đạt mức điểm cao nhất của part; phần hướng dẫn/mẹo cho người Việt (nếu schema có) viết tiếng Việt, cụ thể, có cụm từ dùng được ngay.

## Luật
- Đọc AGENTS.md (mục 2, 5). **Chỉ thêm** vào `js/data/toeic.js`; không sửa bài đã có, không sửa file khác.
- Không backtick, không `${` trong nội dung.
- Nghiệm thu: `node --check js/data/toeic.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi các id đã thêm.

## Notes
Đã thêm 14 bài TOEIC mới:
- s3: toeic-s3-015 đến toeic-s3-022 (8 bài) — chủ đề: housing/rental, fitness/gym, food delivery app, community events, home repair/maintenance, courier/delivery, airport experience, car sharing
- s4: toeic-s4-015 đến toeic-s4-020 (6 bài) — chủ đề: apartment lease terms, gym membership options, food delivery monthly pass, airport train schedule, appliance repair service, community centre class schedule
Tất cả validation pass: `node --check`, `build-light-index.js`, `validate.js` → OK.
Reviewed-by: verify-only (code/UI task)
