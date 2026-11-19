# T2498 — Thêm 3 công ty manufacturing/outsource Hàn-Nhật

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`
After: T2409

Thêm **3 object** vào `window.COMPANIES` (schema giống `vpbank`/`samsung-rd-vietnam`; xem 2 object đó, KHÔNG đọc cả file): **LG CNS Việt Nam**, **Rikkei Soft (Rikkeisoft)**, **Samsung SDS Vietnam** — nếu không đủ nguồn công khai cho cái thứ 3 thì thay bằng Samsung SDS Việt Nam. Không trùng id có sẵn (grep "id: '").
- summary/stack/process CHỈ từ nguồn công khai bạn chắc chắn tồn tại (trang tuyển dụng chính thức, ITviec/TopCV company page); thiếu thì ghi rõ "chưa có review công khai" và confidence thấp. KHÔNG bịa lương, review, quy trình.
- focus nhấn domain manufacturing/MES/IoT, yêu cầu tiếng Hàn/Nhật nếu JD có.
- questions: 12–15 id câu hỏi CÓ THẬT (`node scripts/qtool.js list <file>`), ưu tiên Java core, Spring, SQL, scenario nhà máy.

## Notes
- Added 3 company objects: lg-cns-vietnam, rikkei-soft, samsung-sds-vietnam
- Questions: 15 questions per company (45 total), prioritizing Java core, Spring, SQL, manufacturing/MES/IoT scenarios
- Ran `node scripts/validate.js` → `OK — không có lỗi.`
- Built light index: `node scripts/build-light-index.js`

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/companies.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: verify-only (code/UI task)
