# T633 — 2 bài học JPA mô phỏng cơ chế bằng Java thuần

Status: DONE
Agent: qoder
Owns: `js/data/lessons-jpa.js`

Track **jpa** có 5 bài (đọc hết, không trùng chủ đề). Thêm 2 bài, order tiếp nối, mô phỏng cơ chế Hibernate 6 bằng Java thuần (không dùng JPA thật). Nếu một chủ đề dưới đây đã có thì chọn chủ đề JPA khác chưa có và ghi lý do vào Notes.
1. **Persistence context và dirty checking**: first-level cache (find 2 lần chỉ 1 SELECT), snapshot lúc load, flush so snapshot để sinh UPDATE chỉ khi có thay đổi, vì sao sửa entity trong @Transactional không cần gọi save, cái giá khi load 10.000 entity (bộ nhớ, thời gian flush), read-only query. Bài tập: `MiniEntityManager` với `find(id)`, `persist`, `flush()` trả danh sách câu SQL giả (INSERT/UPDATE chỉ cột đổi), `clear()`; ≥ 6 case.
2. **Owning side, cascade và orphanRemoval** trong quan hệ hai chiều Order–OrderLine: vì sao chỉ set phía inverse thì không lưu FK, helper method addLine/removeLine, orphanRemoval xoá dòng con, cascade REMOVE nguy hiểm khi dùng cho ManyToOne. Bài tập: mô phỏng `flush` sinh SQL theo owning side và cascade; ≥ 5 case.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-jpa.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Đã thêm 2 bài (chỉ sửa `js/data/lessons-jpa.js`):**

- `lesson-jpa-006` — *Owning side, cascade và orphanRemoval trong quan hệ hai chiều* (order 6, senior, 30'). Là **chủ đề 2** trong danh sách của task: vì sao chỉ set phía inverse thì không lưu FK, helper `addLine`/`removeLine`, `orphanRemoval` vs `cascade REMOVE`, `REMOVE` trên `@ManyToOne` là bug mất dữ liệu, chi phí phải tải cả collection. Body có sơ đồ `~~~seq` 3 hệ thống (App | Hibernate | DB) theo mục 5 AGENTS.md. Bài tập `Graph.flush()` sinh SQL theo owning side + cascade: **10 test case** (yêu cầu ≥ 5).
- `lesson-jpa-007` — *Second-level cache và query cache* (order 7, senior, 30'). Bài tập `HibernateLite`: region L2 lưu **state** chứ không lưu object, L1 thắng L2, write-through khi `save`, evict cả region khi bulk DML, LRU theo capacity: **15 test case**.

**Lý do đổi chủ đề 1 (theo hướng dẫn trong task):** `lesson-jpa-001` đã là "Persistence context và dirty checking" và đã phủ đúng toàn bộ ý của chủ đề 1 (identity map find 2 lần 1 SELECT, snapshot lúc load, flush so snapshot, sửa trong `@Transactional` không cần `save`, cái giá khi load nhiều entity + flush/clear theo chunk, `readOnly`). Track jpa lại có 5 bài nên không được trùng. Chủ đề được chọn thay: second-level cache / query cache — chưa có bài nào trong track, liên quan trực tiếp tới bài 001 và đã có câu hỏi trong bank để nối `related`.

**Nghiệm thu (không commit):**
- `node scripts/test-lessons.js lesson-jpa-006` → RESULT 10/10; `lesson-jpa-007` → RESULT 15/15 (reference pass hết, starter biên dịch được và không pass).
- `node scripts/test-lessons.js` (toàn bộ) → `Lesson exercises OK: 127/127`.
- `node scripts/build-light-index.js` → đã ghi `index-light.js` (112.8 KB).
- `node scripts/validate.js` → `OK — không có lỗi.` (thống kê: jpa 7 bài).
- Đếm id `grep -c "id:'lesson" js/data/lessons-jpa.js`: **5 → 7** (+2 đúng số mục thêm). `git diff --numstat`: 462 dòng thêm, **0 dòng xóa** → không đụng 5 bài cũ, không ghi đè.

**Đề xuất cho integrator (không thuộc quyền sửa của task này):**
1. `js/data/path.js`: thêm `'lesson-jpa-006', 'lesson-jpa-007'` vào danh sách lessons của chặng đang list `lesson-jpa-001..005` (khoảng dòng 57) — hết cảnh báo `path.js: có 6 bài học không nằm trong PATH` (cảnh báo này còn gồm `lesson-sql-004/005`, `lesson-banking-005/006` của task khác).
2. Trong lúc chạy gate, `js/data/q-system-design.js` (task khác đang ghi dở) từng bị syntax error — thiếu `}` trước object `architecture-023`, dòng ~4363 — làm `build-light-index.js` chết. Lỗi **không** thuộc T633, đã tự hết ở lần chạy kế tiếp; tôi không sửa file đó. Nếu autopilot gặp lại: để ý tiến trình ghi song song, đừng fix chéo file.
3. Cân nhắc (không làm ở task này): `lesson-jpa-001` và `lesson-jpa-007` nay nối nhau (L1 → L2); có thể thêm `related` chéo nếu muốn dashboard gợi ý thứ tự học.
Reviewed-by: kilo (T633R)
