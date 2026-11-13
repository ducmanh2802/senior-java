Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1701 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- concurrency-058: sửa thuật ngữ "cực sắc" → "thất bại" (6 vị trí trong câu trả lời cho CompletableFuture).
- concurrency-060: không có lỗi kỹ thuật (tên JFR event, flame graph, thread dump đều đúng).
- jvm-050: sửa từ nước ngoài "Bajo" → "Dưới", "independiente" → "độc lập".
- concurrency-062: không có lỗi.
- jvm-051: không có lỗi (ZGC generational từ JDK 21, mặc định JDK 23, bỏ non-generational JDK 24 đúng).
- concurrency-064: sửa "cực sắc" → "thất bại" (đã xử lý chung ở replaceAll).
- concurrency-065: sửa "khô-năo" → "bị chờ lâu", "không deterministic" → "không xác định"; xóa đề cập "biased locking" vì đã vô hiệu hóa mặc định từ JDK 15 (3 vị trí: tóm tắt, cơ chế, câu trả lời mẫu).
- concurrency-066: sửa "Bajo" → "Dưới", "independiente" → "độc lập".
- jvm-052: sửa "không deterministic" → "không xác định"; xóa "biased locking" (vô hiệu hóa JDK 15) khỏi tóm tắt, cơ chế, câu trả lời.
- jvm-053: sửa nguồn Bootstrap từ "rt.jar" thành "JDK modules (java.base…)"; sửa "JVM tiêm classloader" → "ClassLoader khác nhau".
- jvm-055: sửa "mọiway" → "mọi method nóng"; sửa "sacrifices throughput" → "đánh đổi throughput" (2 chỗ).
- File q-concurrency-jvm.js qua validator riêng: OK. Validator toàn repo hiện báo lỗi ở labs-sql.js, q-scenario.js, lessons-sql.js — không thuộc file sở hữu, không sửa.
