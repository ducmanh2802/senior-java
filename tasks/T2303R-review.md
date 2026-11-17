# T2303R — Fact-check nội dung mới của T2303

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2303 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **lab-gc-003**: Sai hoàn toàn nội dung đáp án/hints/rubric — scenario nói về Groovy script compilation nhưng answer giải thích về dynamic Proxy (`Proxy.newProxyInstance`). Đã viết lại đúng: GroovyShell.parse compile script thành class mới, nạp bởi GroovyClassLoader con; fix là cache CompiledScript/Script hoặc dùng GroovyScriptEngine/JSR-223 Compilable; tăng MaxMetaspaceSize nếu cần. Sửa cả ký tự Trung "隔离" thành "tách biệt".
- **lab-gc-004**: Sai kỹ thuật về nguyên nhân humongous allocation. Protobuf `parseFrom(byte[])` không tạo `byte[]` mới — `byte[]` đến từ Kafka `ConsumerRecord.value()`. Humongous là chính mảng `byte[]` message lớn (>1MB với region 2MB). Fix đề xuất "buffer pool/DirectByteBuffer/Netty ByteBuf" không áp dụng được cho consumer. Đã sửa: giải thích đúng cơ chế, fix là tăng `G1HeapRegionSize` (giảm ngưỡng humongous), tách topic/message lớn, chunking ở producer, hoặc reject/DLQ. Sửa markup: thay backticks bằng `{{code}}` trong template literal.
- **lab-gc-001, lab-gc-002, lab-gc-005**: Kiểm tra kỹ thuật, markup — không có lỗi kiến thức, giữ nguyên.
