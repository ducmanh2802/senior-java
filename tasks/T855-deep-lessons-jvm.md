# T855 — 2 bài senior: mô phỏng GC thế hệ và cấp phát TLAB

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jvm.js`

Track **jvm**: đọc hết file để không trùng. Đây là **bài học đào sâu cấp senior**: bài tập Java thuần **tự mô phỏng cơ chế bên trong** (tự viết phiên bản thu nhỏ) để người học hiểu vì sao hệ thống thật hoạt động như vậy. Thêm 2 bài level `senior`, id và order tiếp nối số lớn nhất hiện có, mỗi bài 1–2 bài tập tự chấm (≥ 5 case, có case biên). Body giải thích cơ chế thật trước (kèm tên class/cấu hình thật của JDK/framework), rồi nói rõ bản mô phỏng đơn giản hoá ở đâu. Nếu một chủ đề đã có thì chọn chủ đề sâu khác cùng track và ghi lý do vào Notes.

1. **GC thế hệ thu nhỏ**: eden, survivor, tuổi object, promotion khi vượt MaxTenuringThreshold, premature promotion khi survivor đầy. Bài tập: `MiniHeap` với allocate/minorGc trên đồ thị tham chiếu, test object sống/chết và số lần promote.
2. **Bump-pointer allocation và TLAB**: vì sao cấp phát trên heap rẻ, TLAB tránh tranh chấp, object lớn đi đường khác. Bài tập: `Allocator` với TLAB theo thread, refill, test địa chỉ cấp phát và số lần refill.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-jvm.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
Reviewed-by: kilo (T855R)
