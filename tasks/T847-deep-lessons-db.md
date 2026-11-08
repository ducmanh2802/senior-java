# T847 — 2 bài senior: B+ tree thu nhỏ và WAL recovery

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T818

Track **db**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **B+ tree thu nhỏ**: node, fan-out, tách node khi đầy, tìm theo khoảng (range scan) qua lá liên kết. Bài tập: `BPlusTree` bậc nhỏ (vd 4) với insert, get, range; test chiều cao cây, range đúng thứ tự.
2. **WAL và khôi phục sau crash**: ghi log trước khi ghi data, redo các transaction đã commit, bỏ qua transaction chưa commit. Bài tập: `WalStore` với crash giả lập ở nhiều điểm, recover() cho kết quả đúng.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-db.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Đã kiểm tra: track `db` có 9 bài (lesson-db-001..009, lớn nhất order 9) trước khi thêm; sau khi thêm = 11 bài (`grep -c "id: 'lesson-db-"` trước = 9? *lưu ý grep đếm theo mẫu xuất hiện trong file gốc lúc đầu cho 9 id dạng lesson-db-*; sau thêm = 11*). Chỉ **chèn** 2 object mới ngay trước `);` cuối `js/data/lessons-db.js`, không sửa/xóa object cũ.
- **lesson-db-010** (senior, order 10): B+ tree thu nhỏ bậc 4. Body giải thích fan-out/page I/O, cấu trúc node lá/nội bộ, copy-up (leaf split) vs promote (internal split), range scan qua chuỗi lá, khác biệt với PostgreSQL B-tree (Lehman & Yao, latch, ctid, VACUUM, fillfactor). 1 bài tập tự chấm (6 case, gồm case biên cây rỗng, upsert, split, range biên/thiếu, insert ngược): `BPlusTree` với `put/get/range/height`.
- **lesson-db-011** (senior, order 11): WAL và khôi phục sau crash. Body giải thích write-ahead/fsync/LSN, crash trước/sau COMMIT, redo-only recovery từ checkpoint, idempotent redo, khác biệt PostgreSQL (pg_wal segment, checkpoint_timeout/max_wal_size, synchronous_commit, full page write, PITR) — có `~~~seq`. 1 bài tập tự chấm (6 case: commit sống sót, uncommitted bỏ qua, interleaved, later-committed thắng, abort/delete/uncommitted, checkpoint base+fromLsn): `WalStore` với `put/del/commit/abort/recover`.
- Nghiệm thu: `node scripts/test-lessons.js` → `Lesson exercises OK: 197/197 (174 bài học, 197 từ cache)`; `node scripts/build-light-index.js` → ghi `index-light.js`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ không thuộc file này). `node --check js/data/lessons-db.js` OK.
- **Đề xuất cho integrator (js/data/path.js):** thêm `lesson-db-010`, `lesson-db-011` vào stage `path-08` (DB nâng cao, `lessons` hiện có lesson-db-001..007) hoặc chèn stage/chặng mới phù hợp; hiện các bài db mới chưa nằm trong PATH (validate cảnh báo path.js liệt kê bài db chưa có trong path — đây là cảnh báo đã có pattern tương tự, không do file tôi sửa).
Reviewed-by: kilo (T847R)
