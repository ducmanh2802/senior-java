# T2218 — Rà soát chất lượng 15 câu id NHỎ nhất trong q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2156

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (`node scripts/qtool.js list js/data/q-scenario.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật/thực tế; không bịa API, số liệu, quy định; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Kết quả review 15 câu id nhỏ nhất (scenario-001 → scenario-015) trong js/data/q-scenario.js:

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| scenario-001 | Không lỗi. Đủ Tóm tắt / ### Trả lời mẫu khi phỏng vấn / > Senior tip / follow (3) / ví dụ đời thực. Kỹ thuật EXPLAIN ANALYZE, composite index, CONCURRENTLY đúng PG. | Giữ nguyên |
| scenario-002 | Không lỗi. Keyset pagination, cursor (created_at, id), chi phí O(log n + pageSize), ví dụ 200M dòng đúng. | Giữ nguyên |
| scenario-003 | Không lỗi. DDL online PG 11+ (ADD COLUMN constant default metadata-only, CONCURRENTLY, lock_timeout), MySQL 8 INSTANT/INPLACE, gh-ost/pt-osc, backfill batch. | Giữ nguyên |
| scenario-004 | Không lỗi. Tách OLTP/report, read replica, materialized view + REFRESH CONCURRENTLY, CDC sang warehouse. | Giữ nguyên |
| scenario-005 | Không lỗi. Đọc deadlock log, thứ tự khóa nhất quán, SELECT FOR UPDATE/SKIP LOCKED, retry 1213/40P01, READ COMMITTED. | Giữ nguyên |
| scenario-006 | Không lỗi. HikariCP het connection, leakDetectionThreshold, pg_stat_activity, transaction gọi HTTP trong tx, pool heuristic. | Giữ nguyên |
| scenario-007 | Không lỗi. Xoá theo batch có checkpoint, archive Parquet/S3, partition theo tháng + DETACH/DROP, pg_repack/VACUUM, retention 5 năm NHNN. | Giữ nguyên |
| scenario-008 | Không lỗi. Lost update, UPDATE nguyên tử + rowsAffected, @Version optimistic lock + retry, SELECT FOR UPDATE. | Giữ nguyên |
| scenario-009 | Không lỗi. Streaming parse CSV/Excel (SAX), batch insert/COPY, validate dòng + báo lỗi, job async S3→SQS→worker, idempotent SHA-256 + ON CONFLICT, IDENTITY tắt JDBC batch. | Giữ nguyên |
| scenario-010 | Không lỗi. Export async, cursor/keyset + fetchSize, temp file → S3 → presigned URL, CSV injection, Excel 1.048.576 dòng. | Giữ nguyên |
| scenario-011 | Không lỗi. Upload 2GB qua S3 multipart presigned URL, part retry/resume, Lambda+ClamAV, bucket raw/quarantine/clean, CORS, magic bytes. | Giữ nguyên |
| scenario-012 | Không lỗi. ShedLock distributed lock, CronJob concurrencyPolicy Forbid, checkpoint job_progress, idempotent UPSERT (account_id, interest_date). | Giữ nguyên |
| scenario-013 | Không lỗi. Gửi 1M email qua queue, chunk 10k, token bucket khớp quota ESP, 429/Retry-After, suppression list bounce/complaint, tách OTP/marketing, idempotent (campaign_id, user_id). | Giữ nguyên |
| scenario-014 | Không lỗi. Rollback trước khi p99/error vi phạm SLO, APM trace so sánh, async-profiler flame graph, canary + SLO gate auto rollback, Pattern.compile ReDoS. | Giữ nguyên |
| scenario-015 | Không lỗi. Phân biệt OOMKilled exit 137 (cgroup) vs OutOfMemoryError (heap), MaxRAMPercentage 60–75%, NativeMemoryTracking, direct buffer/thread stack, heap dump vào volume. | Giữ nguyên |

Không câu nào bị trùng ý với câu khác trong 15 cái reviewed. Số mục trước/sau bằng nhau (15 → 15), không đổi id.

Lưu ý liên quan validate: `node scripts/validate.js` still báo 3 lỗi trong `js/data/quiz-ccap-1.js` (ký tự tiếng Hàn trong explain của qz-ccap-122/128/133) — file đó thuộc task T12/T2180, ngoài quyền sở hữu T2218, không được sửa theo luật #3 AGENTS.md. `js/data/q-scenario.js` sạch: `node --check` qua, không lỗi validate liên quan scenario.
