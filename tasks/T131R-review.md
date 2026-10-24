# T131R — Fact-check nội dung mới của T131

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T131 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

File ở HEAD chỉ là skeleton 2 dòng nên toàn bộ ~1015 dòng là nội dung mới của T131, đã review toàn bộ (3 bài lesson-jvm-001..003). Các bài tập Java compile + pass đủ (5/5, 6/6, 4/4, 3/3), validator OK ngay lần đầu — nội dung gốc chất lượng tốt. Lỗi đã sửa trực tiếp:

### lesson-jvm-001
- check #3 (static final Map): giải thích đang nói "Static field thực chất nằm trong vùng dành cho class (Metaspace chứa metadata, không chứa object heap)" — mập mờ, gần như ngược sự thật. Sửa đúng theo HotSpot: từ JDK 7 static field nằm trong `java.lang.Class` object trên Java heap (Metaspace chỉ chứa metadata), việc là GC root mới là nguyên nhân.
- Sắp xếp lại options check #2 (answer 1→3) và #3 (1→2) vì các đáp án đúng dồn về index 1, dễ đoán.

### lesson-jvm-002
- Bullet tuning System.gc() đang viết "trừ khi có lý do rất rõ và đã tắt `-XX:+DisableExplicitGC`" — logic ngược/b vô nghĩa (tắt flag thì call vẫn chạy). Sửa thành: nên không gọi và bật `-XX:+DisableExplicitGC` để chặn call vô tình từ thư viện.
- Tri-color: câu dẫn "Hai cách xử lý" + check #3 explain đang ngầm nói SATB cũng giữ invariant "đen không trỏ tới trắng" — sai kỹ thuật (SATB giữ ảnh chụp đầu phiên, không giữ invariant mạnh). Sửa lại: incremental update giữ invariant; SATB ghi giá trị cũ tham chiếu bị ghi đè.
- Sắp xếp lại options check #2 (answer 1→3) để rải vị trí đáp án.

### lesson-jvm-003
- Thêm ngoại lệ pha Preparation theo JLS 12.4.2: static final constant variable (có thuộc tính `ConstantValue` trong bytecode) được gán giá trị ngay ở Preparation, không phải gán mặc định.
- Cả 4 câu check đều có answer = 1 → sắp xếp lại options để rải vị trí đáp án (1→1, 1→2, 1→0, 1→3); không đổi nội dung đáp án.

### Kiểm chứng
- `node --check js/data/lessons-jvm.js` → OK.
- `node scripts/validate.js` → `OK — không có lỗi.` (run nhiều lần).
- `node scripts/test-lessons.js lesson-jvm-001|002|003` → cả 2 bài tập mỗi bài (003 có 2) pass 100%: 5/5, 6/6, 4/4, 3/3; starter compile được và không pass.
- Không có `${`, không backtick lạc trong template, không ký tự nước ngoài lạ.
- 9 id `related` (jvm-001..020) đều tồn tại trong `q-concurrency-jvm.js`.
- Lưu ý môi trường: `test-lessons.js` báo `EPERM` khi `fs.rmSync` dọn thư mục temp cuối script (lỗi dọn dẹp trên Windows, xảy ra SAU khi toàn bộ test đã pass) — không liên quan nội dung, không sửa vì không sở hữu script.

