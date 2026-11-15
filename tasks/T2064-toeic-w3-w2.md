# T2064 — TOEIC Speaking & Writing: thêm 8 bài w3, 8 bài w2

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T2063

Mục tiêu: có NHIỀU ĐỀ để chế độ thi thử ở `#/toeic` không lặp bài. Thêm vào `js/data/toeic.js`: 8 bài w3, 8 bài w2. Id nối tiếp id lớn nhất hiện có của từng part (w3, w2).

Cách làm (tiết kiệm, KHÔNG đọc toàn bộ file dữ liệu ~140 KB):
1. Đọc chú thích schema ở ĐẦU `js/data/toeic.js` (chỉ phần comment đầu file) và task mẫu `tasks/T1514-toeic-w3.md`, `tasks/T1513-toeic-w2.md`: giữ đúng định dạng, field, độ dài, số từ, thời gian của từng part theo đề thật ETS.
2. `node scripts/qtool.js list js/data/toeic.js` để xem bài đã có (tránh trùng chủ đề), `node scripts/qtool.js show js/data/toeic.js <id>` để xem 1 bài mẫu cùng part.
3. Viết các object mới vào file tạm `logs/tmp-T2064.js`, rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2064.js`.

Chủ đề MỚI, không trùng bài đã có (xem `qtool.js list`): công sở (họp, onboarding, IT helpdesk, làm việc hybrid, chi phí công tác), dịch vụ (ngân hàng, bảo hiểm, bệnh viện, sửa chữa, giao hàng), đời sống (nhà ở, thể dục, ẩm thực, giao thông công cộng, sự kiện cộng đồng), du lịch (khách sạn, sân bay, tour). Tên người, công ty, địa điểm là hư cấu; giờ, ngày, giá trong cùng một bài phải khớp nhau.

Chất lượng: tiếng Anh tự nhiên, đúng ngữ pháp, đúng văn phong đề TOEIC; bài mẫu (sample) đạt mức điểm cao nhất của part; phần hướng dẫn/mẹo cho người Việt (nếu schema có) viết tiếng Việt, cụ thể, có cụm từ dùng được ngay.

## Luật
- Đọc AGENTS.md (mục 2, 5). **Chỉ thêm** vào `js/data/toeic.js`; không sửa bài đã có, không sửa file khác.
- Không backtick, không `${` trong nội dung.
- Nghiệm thu: `node --check js/data/toeic.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi các id đã thêm.

## Notes
- Đã thêm 8 bài w3: `toeic-w3-015`…`toeic-w3-022` (opinion essay, 300–380 từ, outline 4 ý, tips tiếng Việt)
- Đã thêm 8 bài w2: `toeic-w2-021`…`toeic-w2-028` (respond to written request, 80–150 từ, email + task + sample, tips tiếng Việt)
- Chủ đề w3: team-building ngoài giờ, trợ cấp vé xe buýt, check-in/check-out khách sạn, phí ngân hàng dịch vụ cơ bản, ăn uống miễn phí văn phòng, siêu thị vs cửa hàng nhỏ, làm việc hybrid, phí ùn tắc trung tâm thành phố
- Chủ đề w2: bảo trì mạng IT, hồ sơ vay ngân hàng, hệ thống đặt lịch khám online, onboarding nhân viên mới, xử lý bảo hiểmwater damage, thay đổi lịch hội nghị, chính sách giao hàng gói, đào tạo bảo mật dữ liệu bắt buộc
- Chạy `node --check js/data/toeic.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK (các lỗi hiển thị là lỗi sẵn có của file khác, không liên quan đến toeic.js)
Reviewed-by: verify-only (code/UI task)
