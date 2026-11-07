# T635R — Fact-check nội dung mới của T635

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T635 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

**Phạm vi review (nội dung mới T635, `git diff HEAD -- js/data/lessons-db.js`):** chỉ `lesson-db-006` và `lesson-db-007` (448 dòng thêm, 0 dòng xóa/sửa so với HEAD).

**Kiểm tra thực hiện:**
- Soát kỹ thuật theo chuẩn PostgreSQL 15 / HikariCP / Java (connectionTimeout/socketTimeout/statement_timeout/lock_timeout/idle_in_transaction_session_timeout, `cores*2+spindles` chỉ là điểm khởi đầu, leakDetectionThreshold + stack trace tại nơi borrow, maxLifetime < idle timeout LB kèm mốc AWS NLB 350s, deadlock_timeout 1000ms → SQLSTATE 40P01, MySQL 1213/SHOW ENGINE INNODB STATUS, SQL Server 1205, retry cả transaction). Các mặc định/flag/SQLSTATE khớp; không bịa API.
- `node --check js/data/lessons-db.js` → OK (cú pháp). Không backtick/`${` ngoài ý định; markup `~~~seq`/`~~~sql`/`~~~java`/`~~~text` hợp lệ.
- `node scripts/test-lessons.js lesson-db-006` → 10/10 (reference pass; starter biên dịch được, không pass hết).
- `node scripts/test-lessons.js lesson-db-007` → 11/11 (reference pass; starter biên dịch được, không pass hết).
- `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js`.
- `node scripts/validate.js` → **FAIL nhưng không do file sở hữu**: lỗi duy nhất là `sdlc.js: sdlc-009` (stages rỗng/sai thứ tự, thiếu interview) — file này đã có placeholder `//@@STAGES`/`//@@INTERVIEW` trong worktree (`git diff HEAD -- js/data/sdlc.js`), nằm ngoài quyền sở hữu T635R nên **không sửa**. Không có lỗi/cảnh báo nào trỏ vào `js/data/lessons-db.js`.

**Lỗi đã sửa (theo id):**
- `lesson-db-007` (dòng mô tả hành vi Oracle, thân bài): sửa mô tả sai — câu gốc nói "Oracle … không tự hủy mà thường để người dùng hoặc ứng dụng thoát, nên với Oracle phải tự xử lý". Thực tế Oracle báo ORA-00060 và **rollback câu lệnh** phát hiện vòng chờ (statement-level rollback), không để treo chờ người dùng thoát; ứng dụng vẫn phải xử lý lỗi và quyết định rollback transaction hay thử lại. Đã sửa thành: "Oracle báo ORA-00060 và rollback (hoàn tác) câu lệnh vừa phát hiện vòng chờ, nên ứng dụng vẫn phải xử lý lỗi và quyết định rollback transaction hay thử lại". (Reference/test lesson-db-007 vẫn pass 11/11 sau sửa.)

**Đề xuất cho integrator (ngoài quyền sở hữu):** sửa/hoàn thiện `sdlc-009` trong `js/data/sdlc.js` (hoặc tạm bỏ phần placeholder) để `node scripts/validate.js` toàn cục đạt OK; lỗi đó không phát sinh từ T635R.
