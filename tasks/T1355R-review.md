# T1355R — Fact-check nội dung mới của T1355

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1355 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1355 (`git diff HEAD -- js/data/q-concurrency-jvm.js`): +42 dòng, thêm 6 mục `### Ví dụ đời thực` cho các id: `jvm-022`, `concurrency-028`, `concurrency-029`, `jvm-023`, `jvm-024`, `jvm-025`.
- Kiểm tra kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x): không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ. Các điểm kiểm tra: Lombok `@Data` gây đệ quy `toString`/`equals` hai chiều (đúng); `volatile` release/acquire + reordering ARM (đúng); `ForkJoinPool.commonPool` parallelism = `availableProcessors()-1` (đúng, pod 4 vCPU → 3 worker) và work-stealing không giúp khi worker bị block I/O (đúng); Generational ZGC (JEP 439, JDK 21) pause sub-ms khả thi, CPU overhead cao hơn G1 (đúng); JFR event `jdk.ObjectAllocationSample`, escape analysis/scalar replacement C2 (đúng); JFR events `jdk.Compilation`/`jdk.Deoptimization`/`jdk.CodeCacheFull`, `jcmd Compiler.codecache`, tiered C1→C2 (đúng).
- Kiểm tra markup: không có backtick, không có `${` chưa escape trong các section mới.
- Không có lỗi kiến thức. Không sửa nội dung. `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/validate.js` → OK (không lỗi; chỉ warning sẵn có: path.js có 2 bài học không nằm trong PATH `lesson-design-006,007`).
