# T2106R — Fact-check nội dung mới của T2106

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2106 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Duyệt 5 câu mới của T2106 (jvm-065 CFS throttling/Kubernetes, jvm-066 OOMKilled/tmpfs, jvm-067 TLAB/JFR allocation, jvm-068 G1 vs ZGC, jvm-069 heap leak/Histogram Delta/OQL): không tìm thấy lỗi kỹ thuật (cơ chế CFS quota/period, availableProcessors = ceil(quota/period), cpu.stat nr_throttled/nr_periods/throttled_usec; cgroup v2 memory.current/memory.stat, page cache reclaim vs tmpfs không reclaim, exit 137; JFR jdk.ObjectAllocationSample/InNewTLAB/OutsideTLAB, flag -XX:TLABSize/-XX:ActiveProcessorCount/ConcGCThreads/SoftMaxHeapSize/ZGenerational; marker log GC G1/ZGC; Histogram Delta, immediate dominator, retained size, Path to GC Roots, OQL, jcmd GC.class_histogram). Không có lỗi markup (không backtick, không \${ trong template literal, 12 block `~~~` khép đôi, bảng cột khớp header), id jvm-065..069 nối tiếp sau jvm-064 ở HEAD, topic `jvm` thuộc đúng file này (topics.js dòng 12).
- Tuân thủ AGENTS.md: chỉ sửa `js/data/q-concurrency-jvm.js` (của task này); không sửa nội dung đã có ở HEAD; không thêm/xoá mục; không chỉnh văn phong/độ dài vì không có lỗi kiến thức.
- Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js`: tập tin sở hữu không báo lỗi.
- Lỗi còn lại của validate nằm ngoài sở hữu task này và đã tồn tại trước khi bắt đầu (working tree đã bị sửa sẵn): `quiz.js` qz-concurrency-013.explain fenced block chưa đóng; `quiz-java.js` trùng id qz-concurrency-007..018. Không được sửa theo quy tắc 3 AGENTS.md — đề xuất integrator xử lý. Cảnh báo `path.js` (65 bài học không trong PATH) cũng tiền tồn và không liên quan.
