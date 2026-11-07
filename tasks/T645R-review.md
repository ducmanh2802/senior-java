# T645R — Fact-check nội dung mới của T645

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T645 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo id):
- autotest-011: `driver.get(https://...)` thiếu dấu ngoặc quanh URL (lỗi cú pháp Java) → thêm `"..."` ở dòng 708, 711.
- autotest-021: sai chính tả "lu kinh doanh" → "luồng kinh doanh" (dòng ~1269).
- autotest-022: từ nước ngoài lẫn vào "exposes" → viết bằng tiếng Việt (dòng ~1286).
- autotest-026: sai chính tả "Kệnh trên" → "Lệnh trên" (dòng ~1513).
- autotest-028: từ nước ngoài lẫn vào "struttura" → "cấu trúc", "vitesse" → "tốc độ" (dòng ~1605, ~1621).

validate.js: q-autotest.js không lỗi. index-light.js đã rebuild (`node scripts/build-light-index.js`). Cảnh báo/LỖI còn lại trong lessons-autotest.js là của task khác (không thuộc quyền sở hữu T645R, không sửa).
