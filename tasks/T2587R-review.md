# T2587R — Fact-check nội dung mới của T2587

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2587 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (trực tiếp trong js/data/quiz-java.js, nội dung mới qz-modern-051..060 của T2587):
- qz-modern-054: text block thực ra dài 83 ký tự (đã chạy javac/Java 17 để đếm: 15+10+22+32 + 4 newline), không phải 103. Đổi options thành [83, 98, 102, 107], answer 2→0, và sửa lại phép đếm trong explain.
- qz-modern-058: multi: true chỉ cho 2–3 đáp án, nhưng 4 phát biểu đúng. Viết lại phương án 4 thành sai ("orElseThrow() ném IllegalStateException" → thực ra NoSuchElementException), giữ answer [0,1,2]; cập nhật explain mục 4 tương ứng.
- qz-modern-056: phương án 0 thiếu cặp ngoặc nhọn của Map.toString; sửa thành `{even=[2, 4, 6], odd=[1, 3, 5]}` và explain khớp.

Các nội dung mới khác đã kiểm tra kỹ và đúng: qz-modern-051 (record không defensive copy tự động), 052 (sealed switch exhaustive, không có cú pháp deconstruction record trong Java 21), 053 (pattern matching switch + erasure, thứ tự case), 055 (var), 057 (Stream.toList vs Collectors.toList/toUnmodifiableList), 059 (pinning do synchronized JDK 21–23, JEP 491 là thật và đã được tôi xác minh qua openjdk.org/jeps/491), 060 (virtual thread executor/startVirtualThread/ThreadLocal không kế thừa). Không thêm/xoá mục, không sửa nội dung ở HEAD. Markup: không backtick, không ${, {{}} khớp.

Chưa đạt `node scripts/validate.js → OK` trên toàn repo do lỗi của CÁC FILE KHÁC (không thuộc task này, không đục theo luật 3 AGENTS.md):
- js/data/lessons-design.js: lesson('014') chưa đóng (thiếu ',' sau template literal định ≈ dòng 4059/4060) → làm crash build-light-index.js, do đó index-light.js bị báo "đã cũ" (chưa có qz-modern-051..060).
- js/data/lessons-jvm.js: lesson-jvm-004 related "jvm-032" không phải id câu hỏi thật.
- js/data/path.js: path-10 tham chiếu lesson-design-001..005 không có trong window.LESSONS.
Nên integrator sửa ba file trên rồi chạy node scripts/build-light-index.js + node scripts/validate.js. validate.js js/data/quiz-java.js riêng lẻ không lỗi schema nào (chỉ báo index-light đã cũ do lý do trên).
