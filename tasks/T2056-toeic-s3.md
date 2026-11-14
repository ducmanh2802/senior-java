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

Đã thêm 8 object **s3** vào `js/data/toeic.js` bằng `node scripts/qtool.js append js/data/toeic.js logs/tmp-T2056.js`:
`toeic-s3-015` (bệnh viện / phòng khám ngoại trú), `toeic-s3-016` (sửa chữa đồ gia dụng), `toeic-s3-017` (giao hàng / courier),
`toeic-s3-018` (thuê căn hộ), `toeic-s3-019` (hãng bay / sân bay), `toeic-s3-020` (lớp học nấu ăn),
`toeic-s3-021` (tình nguyện sự kiện cộng đồng), `toeic-s3-022` (nhà mạng internet / broadband).

Id nối tiếp id lớn nhất của part s3 khi bắt đầu (toeic-s3-014). Các bài s3-007…014 đã có sẵn từ task trước, không đụng tới.

Mỗi bài đúng 3 `questions` + 3 `samples` + 3 `tips` (tiếng Việt, có cụm dùng ngay); `tags` 1–2 mục. Tên người/công ty/địa điểm hư cấu, số liệu trong bài tự nhất quán (giờ, ngày, giá khớp nhau).

Số từ mẫu (kiểm tra bằng script, đúng thời lượng ETS): câu 1–2 = 28–37 từ (15 giây), câu 3 = 69–76 từ (30 giây).

Nghiệm thu:
- `node --check js/data/toeic.js` → OK.
- `node scripts/build-light-index.js` → OK (ghi lại `js/data/index-light.js`).
- `node scripts/validate.js` → `OK — không có lỗi.` TOEIC S&W: 122 bài `{s1:14, s2:14, s3:22, s4:6, s5:16, w1:30, w2:14, w3:6}` (s3 tăng từ 14 lên 22).
- KHÔNG commit.

Lưu ý cho integrator: nhiều task TOEIC (T2056/T2057/T2058/T2059/T2060/T2061/T2062/T2063/T2064) cùng sở hữu `js/data/toeic.js` và chạy song song trên một worktree. Trong lúc chạy, một worker khác đã `git stash` toàn bộ thay đổi chưa commit (khoảng 18:15), đẩy cả `toeic.js` vào `stash@{0}` và đưa file về bản HEAD (mất 8 id). Tôi đã khôi phục `js/data/toeic.js` từ `stash@{0}` và xác minh đủ `toeic-s3-015…022`. Nếu sau này thấy thiếu, kiểm tra `git stash list` và khôi phục lại từ stash.

CẢNH BÁO QUAN TRỌNG: do đúng lúc `toeic.js` đang bị stash (về bản HEAD), autopilot đã commit nhầm `c6057e9 "Task T2056: DONE, no content change left to commit"` — tức là HEAD hiện ĐÁNH DẤU T2056 = DONE nhưng **KHÔNG có nội dung** 8 bài s3. Vì T2056 đã DONE trong HEAD, autopilot sẽ **bỏ qua T2056 ở mọi vòng sau** (COMMITTED), nên phần nội dung thật (`toeic-s3-015…022`) chỉ nằm ở **working tree** và cần **integrator commit bù** (`js/data/toeic.js` + task file này). Bằng chứng: `git show HEAD:js/data/toeic.js` chỉ có tới `toeic-s3-006`, còn working tree có đủ `toeic-s3-015…022` và `node scripts/validate.js` = OK (s3:22).