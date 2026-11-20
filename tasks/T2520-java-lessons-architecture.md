# T2520 — 2 bài học (architecture) vào lessons-architecture.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-architecture.js`
After: T2265

Thêm **2 bài học mới** (track `architecture`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: TỪ SỐ 0 — Elasticsearch bên trong: vì sao LIKE %abc% trong SQL chậm, inverted index (như mục "từ khóa → trang" cuối sách), analyzer tách từ/viết thường, chấm điểm liên quan ở mức khái niệm, shard/replica, near real-time; bài tập Java thuần: tự xây inverted index Map<String, Set<Integer>> cho 10 tài liệu, tìm AND/OR nhiều từ, so sánh số phép so sánh với quét tuần tự, test xác định.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Mức giải thích (BẮT BUỘC)## LuậtnNgười học ÍT tiếp xúc công nghệ sâu. Bài học viết như dạy người CHƯA BIẾT GÌ: ví dụ đời thường trước, thuật ngữ sau; từng bước một ý; sơ đồ ASCII## Luật~~~seq minh hoạ; ví dụ số chạy tay; mục "### Tự thử trên máy" (Docker 1 dòng + lệnh + kết quả mong đợi); kết bằng "### Tóm lại 3 ý" rồi "### Liên hệ phỏng vấn". body 4000–8000 ký tự.## Luậtn
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-architecture.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added lesson-architecture-013, lesson-architecture-014 (Elasticsearch inverted index).
Reviewed-by: kilo (T2520R)
