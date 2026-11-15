# T2106 — 5 câu hỏi Senior Java (jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2081

Thêm **5 câu hỏi phỏng vấn mới** (topic: jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: JVM trên container: heap vs non-heap, MaxRAMPercentage, OOMKilled vs OutOfMemoryError, đọc heap dump bằng Eclipse MAT, JFR để tìm hot method và allocation, chọn G1 vs ZGC theo SLA.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 5 câu hỏi (topic `jvm`) vào `js/data/q-concurrency-jvm.js`, id nối tiếp `jvm-064`:
  - `jvm-065` (senior): CPU throttling CFS quota/period trên Kubernetes — đọc `cpu.stat`, vì sao p99 cao dù CPU thấp, ActiveProcessorCount.
  - `jvm-066` (senior): page cache / tmpfs / emptyDir `medium: Memory` tính vào `memory.current` → OOMKilled dù heap thấp; `memory.stat`, `sizeLimit`.
  - `jvm-067` (senior): TLAB + JFR allocation (`jdk.ObjectAllocationSample` vs `ObjectAllocationInNewTLAB`/`OutsideTLAB`), tune `TLABSize`/`ResizeTLAB`.
  - `jvm-068` (lead): G1 vs ZGC theo failure mode (pause problem vs allocation stall/throughput) và CPU headroom.
  - `jvm-069` (senior): MAT khi Leak Suspects trống — Histogram Delta 2 dump, OQL, Path to GC Roots loại weak/soft/phantom, `jcmd GC.class_histogram`.
- Kiểm tra: `node --check js/data/q-concurrency-jvm.js` → OK. `node scripts/validate.js q-concurrency-jvm.js` → EXIT 0, không lỗi/cảnh báo cho file này (jvm tăng từ 64 lên 69 câu; mỗi câu 5193–6722 ký tự, đủ `**Tóm tắt:**`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, 3 `follow`). Đã chạy `node scripts/build-light-index.js` (BUILD_OK) nên `index-light.js` đã cập nhật.
- `node scripts/validate.js` toàn repo vẫn còn lỗi NGOÀI phạm vi T2106, thuộc các task quiz đang làm dở: `quiz.js` (qz-concurrency-013 thiếu đóng code fence, qz-concurrency-017 lẫn ký tự Hàn "심한") và `quiz-java.js` (trùng id qz-concurrency-007..018 với quiz.js). Không sửa file ngoài phạm vi T2106 theo AGENTS.md mục 3; các lỗi này sẽ hết khi task quiz hoàn tất. File T2106 không đóng góp lỗi nào.
Reviewed-by: kilo (T2106R)
