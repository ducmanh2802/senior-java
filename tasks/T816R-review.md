# T816R — Fact-check nội dung mới của T816

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T816 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã rà soát nội dung MỚI (diff HEAD) trong `js/data/lessons-banking.js`: `lesson-banking-008` (DailyLimit, đồng thời/check-then-act, khoá theo tài khoản, Clock VN) và `lesson-banking-009` (EOD batch, accrual actual/365, checkpoint/chunk, idempotency). Kiểm tra: Java 17 API đúng (`java.time.*`, `Clock`, `LocalDate.now(clock)`, `ConcurrentHashMap.computeIfAbsent`, `CountDownLatch`, `AtomicInteger`, `BigDecimal.divide(scale, RoundingMode)`), không có API/flag bịa, không ngược cơ chế (read-modify-write trong 1 vùng nguyên tử; checkpoint sau commit/chỉ tối ưu; idempotency bằng chìa khoá tự nhiên account/day), số liệu đúng (100.000.000×4%/365 = 10.958,90 HALF_UP; 1.000.000→109,59; 500.000→54,79). Markup hợp lệ, không backtick/`${` trong template literal, sơ đồ `~~~seq` đúng cú pháp.
- `lesson-banking-007` (file đã sẵn, nhưng test gây `test-lessons.js` fail toàn bộ): sửa test `hai_hold_cung_lam_tron_khong_cheo_nhau` — kỳ vọng sai `200000` → `199999`. Lý do: B1=400000.5 HALF_UP→400001, B2=399999.6 HALF_UP→400000, khả dụng = 1.000.000 − 800.001 = 199.999 (khớp logic/reference). Chỉ chỉnh kỳ vọng test, không đổi mục/nội dung bài học.
- `lesson-banking-009` body (Senior tip): sửa chữ nước ngoài lẫn vào `trước when core mở cửa` → `trước khi hệ thống lõi (core banking — phần mềm kế toán trung tâm của ngân hàng) mở cửa` (giữ ý, giải thích thuật ngữ lần đầu).
- Kiểm chứng: `node --check js/data/lessons-banking.js` OK; `node scripts/validate.js` → OK (168 bài, 190 bài tập). `node scripts/test-lessons.js lesson-banking-007` 39/39; `lesson-banking-008` 23/23; `lesson-banking-009` 37/37. Không sửa file ngoài quyền sở hữu, không git commit, không mở trình duyệt, không kill tiến trình.
