# T2085R — Fact-check nội dung mới của T2085

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2085 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. 12 câu hỏi mới (qz-jvm-046 đến qz-jvm-057) đều đúng kỹ thuật:
- ZGC concurrent, pause <10ms cho heap lớn (046, 053)
- GC log unified logging: 45.678ms là pause duration (047)
- Metaspace OOM do classloader leak khi hot redeploy (048)
- Container memory: MaxRAMPercentage mặc định 25%, -Xmx chỉ heap, cần chừa non-heap (049, 055)
- JIT warm-up: interpreter → C1 → C2, cần warm-up (050, 057)
- Heap dump: retained heap cho biết tổng bộ nhớ giải phóng (051)
- G1GC settings: -XX:+UseG1GC + -XX:MaxGCPauseMillis=200 (052)
- OOM mapping: Java heap space=heap, Metaspace=class metadata, Direct buffer=direct memory (054)
- Heap dump timing: khi OOM hoặc nghi ngờ leak (056)
Markup chuẩn {{code}}, không backtick, không ${ chưa escape. Multi-select đúng format (multi: true, "(Chọn 2)", answer mảng tăng dần). validate.js OK cho file quiz.js.
