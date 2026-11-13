# T1711R — Fact-check nội dung mới của T1711

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1711 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check nội dung MỚI của T1711 (git diff HEAD -- js/data/lessons-testing.js):
- `lesson-testing-010` — Clock trong test (mục 12).
- `lesson-testing-011` — Test double (stub/mock/fake) + phát hiện N+1 bằng fake repository đếm truy vấn.

**Kết luận: KHÔNG có lỗi kiến thức.** Không sửa nội dung nào (đúng yêu cầu "không có lỗi thì ghi Notes và xong").

Đã kiểm tra và xác nhận đúng:
- API java.time đều có thật: `Clock.systemUTC()/systemDefaultZone()/fixed(Instant, ZoneId)/offset(Clock, Duration)/instant()`, `Instant.now()/parse()/plus(Duration)/isBefore()/isAfter()/equals()`, `Duration.between()/getSeconds()/ofMinutes()/ofSeconds()`, `ZoneOffset.UTC`.
- Logic `isExpired = !now.isBefore(expiresAt)` ≡ `now >= expiresAt` là đúng; phần giải thích "dùng isAfter bỏ sót biên bằng nhau → token dùng được đúng giây hết hạn" chính xác; xử lý `secondsUntilExpiry` kẹp về 0 khi quá hạn đúng.
- Định nghĩa test double (stub/mock/fake) khớp phân loại chuẩn; `Mockito.verify(repo, times(1))`, `@EntityGraph`, join/batch fetch, Testcontainers đều đúng.
- Số liệu N+1 đúng: 5 đơn → naive 6 / batch 2; 100 → 101; 500 → 501; 10.000 → 10.001.
- Markup hợp lệ (bảng, ~~~java, {{code}}, > tip, ### header), không có backtick/`${` lạ, không có chữ nước ngoài lẫn, `related` đều tồn tại (testing-001/002/003/005/009 trong js/data/q-soft.js, topic testing).

Nghiệm thu:
- `node scripts/validate.js` → OK — không có lỗi.
- `node scripts/test-lessons.js lesson-testing-010` → RESULT 10/10; `... lesson-testing-011` → RESULT 14/14 (reference pass hết, starter biên dịch được và không pass hết).
- Chạy full `node scripts/test-lessons.js`: 259/260 pass. Lỗi duy nhất là `lesson-sql-010` trong `js/data/lessons-sql.js` (thuộc task T1710, KHÔNG phải file task này) — không sửa theo luật 3 (chỉ sửa file sở hữu).
