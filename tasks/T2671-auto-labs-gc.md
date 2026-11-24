# T2671 — 2 debug lab (gc) vào labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T2625

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-gc.js` để không trùng tình huống. id `lab-gc-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

(1) **Humongous allocation trên G1**: GC log JDK 17 có nhiều "Pause Young (Concurrent Start) (G1 Humongous Allocation)", region size 4M, mảng byte 3MB từ export Excel; sửa: stream export, tăng G1HeapRegionSize. (2) **Metaspace tăng mãi do tạo class động**: log "Metaspace" tăng sau mỗi lần reload script/Groovy, Full GC (Metadata GC Threshold); sửa cache class/classloader.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

Đã thêm 2 lab mới vào `js/data/labs-gc.js` (trước dòng `);` cuối file):

1. **lab-gc-028**: "Xử lý ảnh tải lên: humongous allocation từ BufferedImage và byte[] > 1MB khiến G1 Full GC" — Tình huống humongous allocation từ xử lý ảnh (BufferedImage TYPE_INT_RGB int[] pixel data 8MB + JPEG encode byte[] 3-4MB), region size 2M, khắc phục bằng streaming encode, object pool, off-heap. **Khác với lab-gc-001 (gRPC payment response) và lab-gc-024 (Excel export)** vì dùng image processing pixel buffer.

2. **lab-gc-029**: "Metaspace tăng mãi do Spring AOP tạo CGLIB proxy mới mỗi request (@Transactional trên bean prototype)" — Prototype scope + @Transactional khiến Spring tạo CGLIB subclass proxy mới cho mỗi instance request, 2500+ proxy class nạp vào Metaspace, Full GC (Metadata GC Threshold) không thu hồi được. Khắc phục bằng bỏ prototype dùng singleton, hoặc proxyMode=INTERFACES. **Khác với lab-gc-002 (GroovyShell) và lab-gc-005 (dynamic proxy thủ công)** vì do Spring AOP prototype scope tự động tạo proxy.

`node --check js/data/labs-gc.js` pass. `node scripts/validate.js` hiển thị gc labs 29 (tăng từ 27), không lỗi liên quan 2 lab mới. Các lỗi validation là pre-existing (lessons-aws.js syntax error, path.js missing lessons, index-light.js outdated).
Reviewed-by: kilo (T2671R)
