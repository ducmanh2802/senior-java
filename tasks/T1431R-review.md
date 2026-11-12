# T1431R — Fact-check nội dung mới của T1431

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1431 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới (T1431) trong `js/data/lessons-devops.js`:
  - `lesson-devops-020` (Golden path/template): bổ sung "### Cơ chế từng bước", "### Lỗi hay gặp trên production", snippet render/quét placeholder, 1 câu check về quét placeholder sót. Kiểm tra: quy tắc tên service/DNS label và port hợp lý và nhất quán với validation/exercise (bắt đầu chữ thường, không "--", không kết thúc "-", 3–30 ký tự; port 1024–65535); dùng `String.replace` (không regex) đúng; quét placeholder `__CHU_HOA__` sau render đúng mục đích fail-fast; không backtick/`${` trong template literal; Java/JDK chuẩn, Java 17 compatible. **Không phát hiện lỗi kỹ thuật/markup.**
  - `lesson-devops-021` (DORA metrics): bổ sung "### Cơ chế từng bước", snippet trung vị lead time, "### Lỗi hay gặp trên production", 1 câu check về xử lý rỗng. Kiểm tra: 4 chỉ số DORA định nghĩa đúng (deployment frequency, lead time for changes dùng trung vị, change failure rate, MTTR/time to restore); công thức trung vị chẵn/lẻ đúng; xử lý biên `Duration.ZERO`/0.0 và `days <= 0` đúng; không giả định thời gian hệ thống. **Không phát hiện lỗi kỹ thuật/markup.**
- Sửa lỗi kiến thức: **không có** (không chỉnh văn phong/độ dài/bố cục, không thêm/xoá mục).
- Kiểm tra: `node --check js/data/lessons-devops.js` OK.
- `node scripts/validate.js` hiện **FAIL** do lỗi sẵn có ngoài phạm vi sở hữu (không sửa theo luật 3): `js/data/q-soft.js` (lỗi cú pháp/chạy: Unexpected identifier 'POST'), `lessons-testing.js` (related id không tồn tại), `projects.js`/`path.js` (tham chiếu testing-* không tồn tại), `index-light.js` cũ cần `node scripts/build-light-index.js`, và cảnh báo `lesson-design-007` không nằm trong PATH. Không có lỗi validate nào thuộc `js/data/lessons-devops.js`.
- `node scripts/test-lessons.js`: không chạy (môi trường chưa có `javac`/JDK, `javaAvailable() === false` → script báo "JDK/javac không khả dụng" và exit 0 theo thiết kế). Đề xuất integrator chạy `node scripts/test-lessons.js` và `node scripts/validate.js` trên máy có JDK 17 và sửa các lỗi pre-existing ngoài phạm vi task.
