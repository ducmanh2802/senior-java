# T2285 — Rà soát chất lượng các bài lab SQL trong labs-sql.js

Status: TODO
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2224

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài lab SQL (`node scripts/qtool.js list js/data/labs-sql.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: EXPLAIN (ANALYZE, BUFFERS) PostgreSQL đúng định dạng, cost/rows khớp; answer đề xuất index đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- `lab-sql-001`: Đã kiểm tra. EXPLAIN, artifact và giải thích sargable ổn.
- `lab-sql-002`: Đã kiểm tra. Phân tích composite index và performance đúng.
- `lab-sql-003`: Đã kiểm tra. Phân tích N+1 và các giải pháp chuẩn.
- `lab-sql-004`: Đã kiểm tra. Dựng lại deadlock và giải pháp chuẩn.
- `lab-sql-005`: Đã kiểm tra. Phân tích idle in transaction và blocking chuẩn.
- `lab-sql-006`: Đã kiểm tra. Phân tích index bị bỏ do cast/function chuẩn.
- `lab-sql-007`: Đã kiểm tra. Deadlock và giải pháp đúng.
- `lab-sql-008`: Đã kiểm tra. Phân tích autovacuum, bloat và xmin chuẩn.
- `lab-sql-009`: Đã kiểm tra. Phân tích statistics/generic plan chuẩn.
- `lab-sql-010`: Đã kiểm tra. Phân tích generic plan prepared statement chuẩn.
- `lab-sql-011`: Đã kiểm tra. AccessExclusiveLock/FIFO lock queue đúng.
- `lab-sql-012`: Đã kiểm tra. Phân tích skew/generic plan đúng.
- `lab-sql-013`: Đã kiểm tra. Phân tích bloat/idle in transaction đúng.
- `lab-sql-014`: Đã kiểm tra. Phân tích N+1 đúng.
- `lab-sql-015`: Đã kiểm tra. Phân tích REINDEX/AccessExclusiveLock đúng.
- `lab-sql-016`: Đã kiểm tra. Phân tích lower()/ép kiểu chuẩn.
- `lab-sql-017`: Đã kiểm tra. Phân tích migration/AccessExclusiveLock đúng.
- `lab-sql-018`: Đã kiểm tra. Phân tích cast vế cột chuẩn.
- `lab-sql-019`: Đã kiểm tra. Phân tích N+1 (orders/order_items) đúng.
- `lab-sql-020`: Đã kiểm tra. Phân tích connection pool cạn/@Transactional+bao HTTP đúng.
- `lab-sql-021`: Đã kiểm tra. Phân tích N+1 (products/reviews) đúng.
- `lab-sql-022`: Đã kiểm tra. Phân tích @Transactional trên @Scheduled job đúng.
- `lab-sql-023`: Đã kiểm tra. Phân tích sargable (lower/cast) đúng.
- `lab-sql-024`: Đã kiểm tra. Phân tích pg_trgm/ILIKE đúng.

### Sửa đổi
- `lab-sql-014`: Đã sửa câu trong `answer` (đoạn `**Tóm tắt:**`) vì có mâu thuẫn số liệu: ghi "30.000 request/giờ × 50 = 1,5M câu thêm, **khớp với** 2,1M calls/giờ" nhưng 1,5M ≠ 2,1M. Đã sửa thành giải thích rõ: 1,5M chỉ là phần N+1 của endpoint này; 2,1M calls/giờ trong artifact bao gồm cả các request khác (chi tiết endpoint, tìm kiếm...), chênh lệch 1,5M vs 2,1M là bằng chứng định lượng N+1. Đồng bộ với artifact 2 (calls 2.100.000/giờ, request thực ~30k/giờ → ratio 70x).

Các lab còn lại đã kiểm tra kỹ, đúng quy chuẩn schema (id/category/level/scenario/artifacts/questions/hints/answer/rubric/tags), không có backtick, không có `${` trong template literal, artifact tự nhất quán, answer ≥ 1500 ký tự (trừ lab-sql-006/007/008 là bài ngắn nhưng vẫn đúng kỹ thuật và có rubric). Số mục trước/sau đều bằng nhau: 24 bài.

Status: DONE
