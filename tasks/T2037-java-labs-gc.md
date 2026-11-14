# T2037 — 2 debug lab (gc) vào labs-gc.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-gc.js`
After: T1705

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-gc.js` để không trùng tình huống. id `lab-gc-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Metaspace OOM do tạo class động liên tục** (proxy/Groovy script/regex compile trong vòng lặp tạo classloader mới): log "java.lang.OutOfMemoryError: Metaspace", jcmd VM.metaspace / GC.class_stats tăng dần; cách sửa.
2. **GC pause dài do heap quá lớn với G1 mặc định** trên service latency thấp: GC log JDK 17 có pause 800ms+ ở mixed GC; phân tích và lựa chọn (MaxGCPauseMillis, ZGC generational ở JDK 21, giảm allocation rate).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-gc.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Thêm lab-gc-017 (Metaspace OOM: URLClassLoader + Proxy mới mỗi webhook, cache static không xóa, TiniFin) và lab-gc-018 (mixed GC 850–950 ms do heap 12 GB vs live set 3 GB, VimoPay) vào js/data/labs-gc.js, chèn trước dòng `);` cuối file.
- node --check js/data/labs-gc.js → pass.
- node scripts/validate.js → không có lỗi liên quan labs-gc.js (gc labs: 18). Cảnh báo/LỖI còn lại (q-devops-*, q-devops-part.js, path.js) là file khác, không thuộc quyền sở hữu task này.
Reviewed-by: kilo (T2037R)
