# T854 — 2 bài senior: thuật toán join và keyset pagination

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`

Track **sql**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **Nested loop vs hash join vs merge join**: mô phỏng trên List, đếm số phép so sánh, khi nào planner chọn cái nào. Bài tập: cài 3 thuật toán, kết quả phải giống nhau, số phép so sánh của hash join nhỏ hơn nested loop với dữ liệu lớn.
2. **Keyset pagination vs OFFSET**: chèn dòng trong lúc phân trang làm OFFSET lặp/bỏ sót, keyset (created_at, id) thì không. Bài tập: `Pager` cả hai kiểu, test với dữ liệu bị chèn giữa các trang.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-sql.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
- Thêm lesson-sql-006 (MVCC/isolation/deadlock) và lesson-sql-007 (B-tree/covering index). Join và keyset pagination đã có lesson-sql-001/002/005, nên chọn chủ đề sâu khác. Đề xuất integrator thêm id vào js/data/path.js.
Reviewed-by: kilo (T854R)
