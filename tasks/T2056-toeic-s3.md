# T2056 — TOEIC Speaking & Writing: thêm 8 bài s3

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T1720

Mục tiêu: có NHIỀU ĐỀ để chế độ thi thử ở `#/toeic` không lặp bài. Thêm vào `js/data/toeic.js`: 8 bài s3. Id nối tiếp id lớn nhất hiện có của từng part (s3).

Cách làm (tiết kiệm, KHÔNG đọc toàn bộ file dữ liệu ~140 KB):
1. Đọc chú thích schema ở ĐẦU `js/data/toeic.js` (chỉ phần comment đầu file) và task mẫu `tasks/T1510-toeic-s3-s4.md`: giữ đúng định dạng, field, độ dài, số từ, thời gian của từng part theo đề thật ETS.
2. `node scripts/qtool.js list js/data/toeic.js` để xem bài đã có (tránh trùng chủ đề), `node scripts/qtool.js show js/data/toeic.js <id>` để xem 1 bài mẫu cùng part.
3. Viết các object mới vào file tạm `logs/tmp-T2056.js`, rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2056.js`.

Chủ đề MỚI, không trùng bài đã có (xem `qtool.js list`): công sở (họp, onboarding, IT helpdesk, làm việc hybrid, chi phí công tác), dịch vụ (ngân hàng, bảo hiểm, bệnh viện, sửa chữa, giao hàng), đời sống (nhà ở, thể dục, ẩm thực, giao thông công cộng, sự kiện cộng đồng), du lịch (khách sạn, sân bay, tour). Tên người, công ty, địa điểm là hư cấu; giờ, ngày, giá trong cùng một bài phải khớp nhau.

Chất lượng: tiếng Anh tự nhiên, đúng ngữ pháp, đúng văn phong đề TOEIC; bài mẫu (sample) đạt mức điểm cao nhất của part; phần hướng dẫn/mẹo cho người Việt (nếu schema có) viết tiếng Việt, cụ thể, có cụm từ dùng được ngay.

## Luật
- Đọc AGENTS.md (mục 2, 5). **Chỉ thêm** vào `js/data/toeic.js`; không sửa bài đã có, không sửa file khác.
- Không backtick, không `${` trong nội dung.
- Nghiệm thu: `node --check js/data/toeic.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi các id đã thêm.

## Notes

Đã thêm 8 object s3 vào `js/data/toeic.js` bằng `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2056.js`:
`toeic-s3-007` (meetings ở công sở), `toeic-s3-008` (onboarding nhân viên mới), `toeic-s3-009` (IT helpdesk),
`toeic-s3-010` (chi phí công tác / expense report), `toeic-s3-011` (mobile banking), `toeic-s3-012` (bảo hiểm xe),
`toeic-s3-013` (giao thông công cộng đi làm), `toeic-s3-014` (khách sạn / hotel stay).
Không trùng chủ đề s3-001…006 (mua sắm, du lịch nghỉ dưỡng, thể thao, công nghệ ở công sở, menu nhà hàng, làm việc từ xa).

Mỗi bài đúng 3 `questions` + 3 `samples` + 3 `tips` (tiếng Việt, có cụm dùng ngay); `tags` 1–2 mục. Tên người/công ty/địa điểm hư cấu, số liệu trong bài tự nhất quán.

Số từ mẫu (kiểm tra bằng script, đúng thời lượng ETS): câu 1–2 = 30–39 từ (15 giây), câu 3 = 66–75 từ (30 giây).

Nghiệm thu:
- `node --check js/data/toeic.js` → OK.
- `node scripts/build-light-index.js` → `Đã ghi js/data/index-light.js (291.3 KB)`.
- `node scripts/validate.js toeic.js` → `OK — không có lỗi.` TOEIC S&W: 114 bài `{s1:14, s2:14, s3:14, s4:6, s5:16, w1:30, w2:14, w3:6}`.
- `git diff --numstat js/data/toeic.js` = **168 thêm / 0 xoá** (không sửa dòng có sẵn).
- KHÔNG commit.

Vướng ngoài phạm vi (không tự sửa theo luật 3): `node scripts/validate.js` (toàn repo) còn đúng 1 lỗi ở file của task khác —
`q-java.js: collections-057.a: inline code {{synchronized (map) { for (...) … }} chứa dấu { } lồng nhau`.
Đây là nội dung **chưa commit** của task khác (q-java.js +743 dòng, mtime 09:10 cùng ngày, không phải file T2056 sở hữu).
Khi file đó được sửa, `node scripts/validate.js` sẽ in `OK — không có lỗi.`

Lưu ý cho integrator: giữa lúc chạy, `js/data/toeic.js` từng bị một tiến trình khác đưa về bản gốc sau khi append (phát hiện qua `git diff --numstat` = 0).
Đã append lại và xác minh 168/0 + `validate toeic.js` OK ngay sau đó. Nếu thấy thiếu 8 id trên, chạy lại:
`node scripts/qtool.js append js/data/toeic.js logs/tmp-T2056.js` (file tạm vẫn còn trong `logs/`).
