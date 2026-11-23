# T2577R — Fact-check nội dung mới của T2577

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2577 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 lab mới (lab-gc-024, lab-gc-025):

**lab-gc-024 (Humongous allocation khi xuất Excel):**
- Cơ chế G1 humongous object đúng: region 4MB → ngưỡng 2MB, byte[] 3MB cấp phát thẳng Old Gen trên region liên tiếp
- GC log JDK 17 format đúng: "Pause Young (Concurrent Start) (G1 Humongous Allocation)", "To-space exhausted", "Pause Full (G1 Compaction Pause)"
- Humongous regions tăng 80→500 (2GB), Full GC không giảm humongous (460→460, 500→500) vì object còn được tham chiếu bởi thread đang xử lý
- GC(120) chứng minh không leak: traffic giảm → humongous 500→10, heap 2100M→480M trong young GC thường
- JFR weight 3.1 MB tại ByteArrayOutputStream.toByteArray khớp code
- Sửa gốc: streaming export ghi workbook trực tiếp vào HttpServletResponse.getOutputStream(), bulkhead giới hạn đồng thời

**lab-gc-025 (Metaspace leak do GroovyClassLoader):**
- Metaspace lưu class metadata (native memory), MaxMetaspaceSize=512M
- ScriptEngine tạo `new GroovyClassLoader()` mỗi lần gọi run() → 1250 instance classloader, mỗi instance giữ 1 class Script_NNN
- Full GC (Metadata GC Threshold) không giảm Metaspace (480→480, 510→510, 511→511) vì classloader cũ vẫn reachable
- Heap ổn định ~2.5GB → không phải heap leak
- Sửa gốc: cache class theo tên script trong ConcurrentHashMap, kiểm tra lastModified, dùng một GroovyClassLoader cha

Không tìm thấy lỗi kỹ thuật, markup, hay thuật ngữ sai. `node scripts/validate.js` → OK.
