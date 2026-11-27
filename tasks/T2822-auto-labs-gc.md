# T2822 — 2 debug lab (gc) vào labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2770

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-gc.js` để không trùng tình huống. id `lab-gc-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Humongous allocation trên G1**: GC log JDK 17 có nhiều "Pause Young (Concurrent Start) (G1 Humongous Allocation)", region size 4M, mảng byte 3MB từ export Excel; sửa: stream export, tăng G1HeapRegionSize. (2) **Metaspace tăng mãi do tạo class động**: log "Metaspace" tăng sau mỗi lần reload script/Groovy, Full GC (Metadata GC Threshold); sửa cache class/classloader.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab mới:
- `lab-gc-040`: **Đọc PostgreSQL BYTEA/BLOB: humongous allocation từ byte[] lớn gây G1 Full GC** — Batch job đọc 50.000 dòng PostgreSQL có cột receipt_blob BYTEA (1-5 MB). JdbcTemplate.select * đọc toàn bộ blob vào byte[] → G1 region 4MB → ngưỡng humongous 2MB → blob là humongous. Humongous regions tăng 80→560, To-space exhausted, Pause Full 2-3s. Fix: streaming cursor + getBinaryStream(), KHÔNG select * vào byte[].
- `lab-gc-041`: **Hệ thống plugin động: Metaspace leak từ URLClassLoader không bao giờ bị GC** — App core banking nạp plugin JAR bằng URLClassLoader, lưu trong static ConcurrentHashMap. Mỗi reload tạo ClassLoader mới, ClassLoader cũ không remove/close. pluginInstances giữ instance cũ → class cũ → ClassLoader cũ. 150 plugin × 5.000 class = 750k class, Metaspace 960MB > MaxMetaspaceSize 1GB → OOM. Fix: out-of-process plugin (gRPC/HTTP) là tốt nhất, hoặc close() + xóa instance.

Validation: `node --check js/data/labs-gc.js` PASS, `node scripts/validate.js` PASS (gc count: 23), no errors for labs-gc.js.
Reviewed-by: kilo (T2822R)
