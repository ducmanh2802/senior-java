# T1714R — Fact-check nội dung mới của T1714

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1714 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 4 lab mới của T1714 trong `js/data/labs-sql.js` (HEAD kết thúc ở lab-sql-014; 015–018 là nội dung chưa commit). `git diff --stat` = +614 dòng, 0 xoá → không chạm nội dung HEAD.

Lỗi đã sửa theo id:

**lab-sql-015 (nặng — cơ chế nói ngược):**
- `CREATE INDEX` (không CONCURRENTLY) chỉ lấy **ShareLock**, mà ShareLock **tương thích với AccessShareLock** ⇒ KHÔNG chặn SELECT (tài liệu PG 15 §13.3.1: "Only an ACCESS EXCLUSIVE lock blocks a SELECT"). Lab lại mô tả nó lấy AccessExclusiveLock và chặn cả SELECT ⇒ mâu thuẫn. Đổi DDL sang **`REINDEX TABLE shipments`** (ACCESS EXCLUSIVE, đúng doc) ở title/scenario/artifact/answer/hints/rubric/tags; giữ nguyên luận điểm lock-queue FIFO (đã kiểm chứng: soft block, `pg_blocking_pids` doc + `lock.c waitMask`).
- Bảng lock: bỏ `CREATE INDEX (không CONCURRENTLY)` khỏi hàng AccessExclusiveLock; thêm REINDEX CONCURRENTLY vào ShareUpdateExclusiveLock; sửa ExclusiveLock → "chỉ tương thích AccessShareLock" (RowShareLock xung đột EXCLUSIVE).
- Artifact `pg_locks` nói "618 AccessShareLock granted=t **nhưng đang xếp hàng**" (tự mâu thuẫn: granted=t là đã được cấp) → sửa thành 512 AccessShareLock f + 106 RowExclusiveLock f (618 đang chờ) và 2 AccessShareLock t (2 SELECT xin trước).
- Số liệu vô căn cứ: 618 backend chờ nhưng log chỉ có pool `total=40` → thêm "18 instance × HikariCP 40 connection = 720 connection" vào scenario.
- `spring.flyway.outOfOrder` (sai: đó là thứ tự migration, không liên quan transaction) → mô tả đúng: Flyway bọc mỗi migration trong transaction nên CONCURRENTLY phải chạy thủ công bằng psql/job riêng.
- Sửa tiêu đề mục "Nguyên gốc" → "Nguyên nhân gốc", "**NgắnTERM**" → "**Ngắn hạn**", "đã chạy 3:41" → "đã chờ".

**lab-sql-016 (nhẹ):**
- `\d app_user` in `app_user_pkey` kèm `WHERE ...` (bịa; PK không có predicate) → `CREATE UNIQUE INDEX ... USING btree (id)`.
- Gợi ý `COLLATE "C"` cho tìm không phân biệt hoa là sai (C là case-sensitive) → bỏ, thay bằng chuẩn hoá dữ liệu + lưu ý btree không hỗ trợ collation nondeterministic (PG ≤ 17).
- `lower()` IMMUTABLE "nếu collation là C" → nói đúng: IMMUTABLE vì chỉ phụ thuộc locale của database.
- "Expression index luôn lớn hơn index cột thô" → sửa theo từng biểu thức.
- Ước lượng `rows=42` cho biểu thức không có statistics (đúng phải ~0,5% = 42.063) → sửa cost/rows cho khớp; `Index Scan` sửa rows=1.
- Làm rõ bước "không có index khớp biểu thức" (không phải "thiếu statistics" là nguyên nhân chọn Seq Scan).

**lab-sql-017 (thiếu dấu tiếng Việt toàn bộ + số liệu mâu thuẫn):**
- Viết lại có dấu cho scenario/artifacts/questions/hints/answer/rubric; sửa các token lỗi "Giai thiec", "chant", "ang" → "đang".
- Log Flyway bịa thời điểm (báo fail 10:02:30 trong khi DBA terminate 10:04:30) và message "unable to obtain exclusive lock on table" (không phải lỗi PostgreSQL) → đổi thành `FATAL: terminating connection due to administrator command` (SQLSTATE 57P01) lúc 10:04:30, khớp với `xact_age` 2:30 lúc chụp 10:02:30.
- `pg_locks` cũ: 398+22 = 420 = tổng chờ ⇒ không còn chỗ cho migration và không khớp "5 backend đang chạy" → 401 AccessShare f + 18 RowExclusive f (=419) + 1 migration = 420; 3 AccessShare t + 2 RowExclusive t = 5.
- Mô tả `pg_blocking_pids` sai ("trả về pid đang hoàn tất giao dịch") → "pid các phiên đang giữ lock xung đột (hard block)".
- Bảng lock `~~~text` sai: ShareUpdateExclusiveLock "tương thích ShareLock" (thực tế xung đột) → sửa tập xung đột; RowExclusiveLock "trừ AccessExclusiveLock" → đủ SHARE/SHARE ROW EXCLUSIVE/EXCLUSIVE/ACCESS EXCLUSIVE.
- "40 connection" trong khi 420 backend chờ → thêm "12 instance × 40 = 480 connection"; sửa `ALTER COLUMN SET NOT NULL` "cần lock ngang qua với bảng ít lock" (vô nghĩa); sửa "out-of-order" → chạy CONCURRENTLY ngoài transaction.

**lab-sql-018 (thiếu dấu tiếng Việt toàn bộ):**
- Viết lại có dấu; sửa token lỗi "lam mat the z index", "cham len khoang 6.000 lan", "cung co cung lac", "chi phi".
- EXPLAIN: `Buffers hit=145210 read=118433` (2,06 GB) không khớp heap 2,4 GB → 171000/140000 (~311.000 trang); `rows=42` cho biểu thức không statistics → 41.072.
- Bỏ 2 dòng `Time: 0.871 ms` (sai với Execution Time 4189 ms, sót từ lab khác).
- "Cast ::bigint là IMMUTABLE vì không phụ thuộc cấu hình" → nói rõ varchar toàn chữ số + cảnh báo hàm STABLE; sửa "expression index lớn hơn index cột thô".
- Làm rõ bước planner chọn Seq Scan (không có index khớp, không phải do thiếu statistics).

Không sửa lỗi markup/schema nào khác; không thêm/bớt mục.

## Nghiệm thu
- `node --check js/data/labs-sql.js` → OK.
- `node scripts/validate.js` → chỉ còn **1 lỗi đã có sẵn ở file khác**: `bugs.js: bug-023: tests phải in "RESULT passed/total"` (nội dung của task T2022, chưa commit, không thuộc file task này ⇒ không sửa theo AGENTS.md mục 3). Debug lab sql vẫn = 18 bài.
- Không cần `build-light-index.js` (không thêm/bớt mục).
- Không commit, không mở trình duyệt, không kill tiến trình.
