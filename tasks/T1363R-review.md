# T1363R — Fact-check nội dung mới của T1363

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1363 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi review: js/data/q-java.js (chỉ sửa file này, theo AGENTS.md mục 3 và Owns của task).
- Nội dung MỚI của T1363 trong q-java.js: các mục "Ví dụ đời thực"/"Trả lời mẫu" (plus "So sánh lựa chọn thay thế", "Mẹo thực tế", "Lưu ý khi viết test") của modern-032, modern-033, modern-034, modern-035, modern-037, modern-038.
- Kiến thức: toàn bộ kỹ thuật mới đã kiểm tra và ĐÚNG (Java 17/21/24/25: JEP 430/459 string templates đã bị rút, JEP 490 gỡ ZGC non-generational JDK 24, sealed+switch exhaustiveness, ScopedValue JDK 25/JEP 506, Generational ZGC JDK 21+23, text block \s, chiến lược nâng LTS theo wave). Không có lỗi API/flag/mặc định/số liệu.
- Lỗi markup đã sửa (2 chỗ, đều ở modern-037 "Lưu ý khi viết test"):
  * `{\n}` và `{\s}` viết bằng 1 gạch ngược trong template literal → cooked template literal bỏ gạch ngược (`\n` thành xuống dòng thật, `\s` thành `s`) render sai/rỗng. Sửa thành `{\\n}` và `{\\s}` trong nguồn để render đúng `\n`/`\s`.
- validate.js: KHÔNG đạt OK do js/data/q-spring-data.js (dòng 6588: `### Ví dụ đời thực` sau nháy đóng template literal → SyntaxError). File KHÔNG thuộc quyền sở hữu T1363R (quy tắc AGENTS.md mục 3, không tự sửa). Lỗi này khiến spring/jpa/db (0 câu) không nạp được và lan sang path.js/bugs.js/index-light.js ("đã cũ" vì build-light-index.js cũng bị chặn). Cần task review q-spring-data.js sửa syntax rồi chạy node scripts/build-light-index.js + validate.js.
- Lưu ý: validate.js chạy ở đầu phiên (trước khi sửa q-java.js) đã OK với spring 46/jpa 47/db 55; q-spring-data.js bị hỏng bởi công việc đồng thời của agent khác trong lúc làm, không do tác động của task này.
