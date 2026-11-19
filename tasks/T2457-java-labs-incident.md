# T2457 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2423

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Redis cache stampede giờ mở cửa**: key giá chứng khoán hết hạn cùng lúc, 3.000 request đồng thời đổ vào DB, p99 từ 40ms lên 4s; sửa bằng TTL jitter, single-flight/lock, refresh-ahead.
2. **Task kẹt IN_PROGRESS sau khi pod bị OOMKilled**: không có lease timeout, 1.200 task không ai xử lý 3 giờ; sửa bằng lease + heartbeat + job quét lại.

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 lab:
- lab-incident-046: Redis cache stampede giờ mở cửa (10 hot key cùng hết hạn TTL 10s, 3.000 req/s, ~2.850 truy vấn DB thay vì 10)
- lab-incident-047: Task kẹt IN_PROGRESS sau khi pod OOMKilled (1.200 task kẹt 3 giờ do thiếu lease timeout + heartbeat)
Reviewed-by: kilo (T2457R)
