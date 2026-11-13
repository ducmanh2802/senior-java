# T1578R — Fact-check nội dung mới của T1578

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1578 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-concurrency-012` ex1: sửa lỗi compile/kiểm thử kỹ thuật — starter/reference bỏ `abstract static` (không hợp lệ trong Java) và để `SafePublisher` là class thường; reference bổ sung định nghĩa `Holder` và `SafePublisher` để assemble+compile được với tests; sửa tests để đếm pass/fail đúng (tránh `RESULT` cố định khiến starter bị coi là pass hết), bắt exception/timeout, và kiểm tra an toàn xuất bản (không thấy payload mặc định 0) thay vì so sánh payload giữa các luồng (dễ false-fail do race hợp lệ khi nhiều luồng publish).
- `lesson-concurrency-012` ex2: sửa `walkerStackTrace()` reference ép kiểu `(int) s.count()` (Stream.count() trả `long`) và sửa ngoặc dư `collect(Collectors.toList()))` gây compile error.
- `lesson-concurrency-013` ex2: sửa reference `VirtualBatch.run` gắn index cho kết quả lỗi trong submit (`"ERR-" + idx`) để khớp mong đợi tests (trước trả `"ERR"`).
- `lesson-concurrency-014`: sửa câu hỏi/giải thích check dùng `in(data)` (sai cú pháp/không rõ) thành `System.out.println(data)`; sửa mục tiêu bị gõ sai/lặp từ (`Noe... dung chung chung chung` → `Neu... dung chung`) để nội dung rõ nghĩa.
- `lesson-concurrency-015`: sửa chữ gõ sai/garbled ảnh hưởng kỹ thuật/hiểu nhầm: `het bo nhiro` → `het bo nho`, `chua bao gioc chay` → `chua bao gio chay`, `khong bao gioc duoc mo` → `khong bao gio duoc mo`.
- Kiểm tra: `node --check js/data/lessons-concurrency.js` OK; `node scripts/test-lessons.js` → 245/245; `node scripts/validate.js` → `OK — không có lỗi.` (còn warning path.js sẵn có).
