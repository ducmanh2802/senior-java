# T2311R — Fact-check nội dung mới của T2311

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2311 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi kỹ thuật sau trong 7 câu hỏi mới của T2311 (js/data/q-java.js):

**collections-057**:
- Sửa nhận định sai về CopyOnWriteArrayList: "khong dam bao thu tu on dinh" → "co thu tu nhung khong ho tro addFirst/addLast hieu qua" (CopyOnWriteArrayList là List nên giữ thứ tự insertion order, chỉ không implement SequencedCollection vì không hỗ trợ addFirst/addLast hiệu quả).
- Cập nhật ref URL từ JLS generic → JEP 431 chính xác: https://openjdk.org/jeps/431

**modern-069**:
- Cập nhật ref URLs từ JLS generic → JEP 440 (Record Patterns) và JEP 441 (Pattern Matching for switch) chính xác.

**modern-070**:
- Sửa phiên bản ScopedValue thành chuẩn: "Java 25" → "Java 24" (JEP 481 finalized in JDK 24).
- Cập nhật ref URL từ JLS generic → JEP 444 chính xác: https://openjdk.org/jeps/444

**modern-071**:
- Xoá các con số hiệu năng cụ thể không có cơ sở trong ví dụ thực tế: "G1 tren JDK 21 giam p99 GC pause tu 180 ms xuong 45 ms, RAM moi pod giam 15%" → "GC pause va bo nho co cai thien ro rang (ket qua thuc te phu thuoc workload)".
- Cập nhật ref URL từ JLS generic → Java 21 Migration Guide: https://docs.oracle.com/en/java/javase/21/migrate/

**modern-072**:
- Sửa phiên bản ScopedValue thành chuẩn: "Java 25" → "Java 24".
- Sửa lỗi đánh máy: "gui ket" → "gán kết".
- Cập nhật ref URLs từ JLS generic → JEP 459 (String Templates, withdrawn) và JEP 481 (Scoped Values) chính xác.

**modern-073**:
- Cập nhật ref URLs từ JLS generic → JEP 474 (ZGC Generational) và JEP 490 (ZGC: Remove Non-Generational) chính xác.

Tất cả thay đổi chỉ sửa lỗi kỹ thuật/chính tả/ref URL, không thay đổi văn phong, độ dài hay cấu trúc nội dung.
