# T2041R — Fact-check nội dung mới của T2041

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2041 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã đọc `git diff HEAD -- js/data/q-concurrency-jvm.js` (6 câu mới: jvm-059..jvm-064). Kiểm tra từng id theo chuẩn Java 17/21, Spring Boot 3.x, HotSpot.
- Kết quả fact-check: nội dung **về cơ bản đúng kỹ thuật**. Xác minh các điểm dễ sai đều chính xác: class identity = (tên, defining loader); ClassLoader chỉ GC khi không còn GC root; DriverManager static giữ Driver → leak; deopt/uncommon trap/safepoint; inline cache monomorphic/bimorphic/megamorphic (>2); EA NoEscape/ArgEscape/GlobalEscape; NMT summary/detail/baseline/summary.diff + các hạng mục Thread/Class/Internal/Code/GC/Symbol; MALLOC_ARENA_MAX, pmap, jemalloc; GraalVM closed-world, Spring AOT, @RegisterReflectionForBinding, PGO, `./mvnw -Pnative native:compile`. Mọi flag/metric/API đều có thật, số liệu các ví dụ nhất quán.
- **Đã sửa 1 lỗi kỹ thuật (jvm-062):** câu mô tả profiler bị nhầm lẫn gộp hai profiler khác nhau — `-prof stack` (built-in, lấy mẫu stack, không cần thư viện ngoài) bị gán là "nếu có async-profiler tích hợp"; async-profiler thực ra là `-prof async`. Đã sửa thành: `-prof stack` (built-in, lấy mẫu stack) hoặc `-prof async` (async-profiler, nếu có tích hợp). Không đụng văn phong/bố cục/độ dài, không thêm/xoá mục.
- Ngoài ra không có lỗi markup (code fence cân bằng, không có backtick/`${` trong template literal), không có chữ nước ngoài lẫn sai. Lưu ý nhỏ không phải lỗi kiến thức: dòng megamorphic ở jvm-060 ghi "> 2 (thường > 2)" hơi lặp nhưng đúng (megamorphic là > 2 kiểu), để nguyên theo yêu cầu không sửa văn phong.
- `node --check js/data/q-concurrency-jvm.js` → OK. `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js là có sẵn, không liên quan file này). Không commit, không sửa file khác.
