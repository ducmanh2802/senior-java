# T2820 — 10 câu trắc nghiệm (scenario) vào quiz-design.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`
After: T2778

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-design.js` (topic `scenario`; id `qz-scenario-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-scenario-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống production: API chậm đột ngột, pool connection cạn, consumer Kafka lag tăng, OOM sau deploy, cache stampede, retry storm — chọn bước điều tra/ xử lý đúng đầu tiên. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-scenario đã có.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 10 câu trắc nghiệm vào js/data/quiz-design.js (topic scenario), id nối tiếp từ max cũ qz-scenario-050:
qz-scenario-051 .. qz-scenario-060.

Các góc đã chọn (tránh trùng với qz-scenario-001..050 đã có):
- 051: PostgreSQL max_connections vượt quá khi scale pod (50 pod × HikariCP 20 = 1000 > 100) → PgBouncer hoặc giảm pool mỗi pod (single)
- 052: Hibernate N+1 sau deploy tính năng mới → show_sql/p6spy xác nhận, @EntityGraph/JOIN FETCH (multi, Chọn 2)
- 053: Redis DEL key chứa 1 triệu mục chặn luồng chính → UNLINK hoặc xóa dần theo lô nhỏ (single)
- 054: Kafka producer gửi tin nhắn 2 MB bị MessageTooLargeException → tăng message.max.bytes/max.request.size hoặc dùng object storage (single)
- 055: System.gc() trong tác vụ định kỳ gây Full GC stop-the-world mỗi giờ → xóa lệnh gọi hoặc dùng -XX:+DisableExplicitGC (single)
- 056: Ổ đĩa log đầy 100%, appender đồng bộ chặn request → AsyncAppender + rolling policy/retention/cảnh báo ổ đĩa (multi, Chọn 2)
- 057: Transaction quên commit giữ row lock trên orders 10 phút → pg_stat_activity/pg_locks, pg_terminate_backend nếu cần, sửa code transaction ngắn (single)
- 058: HashMap static chia sẻ, nhiều thread put đồng thời khi resize → vòng lặp vô hạn CPU 100% → ConcurrentHashMap (single)
- 059: @Async mặc định tạo luồng không giới hạn → hết luồng/OOM → ThreadPoolTaskExecutor có giới hạn + backpressure (single)
- 060: ArrayList static tích luỹ lịch sử sự kiện không bao giờ xóa → heap OOM (java.lang.OutOfMemoryError: Java heap space) → giới hạn kích thước/TTL, không lưu vĩnh viễn trong heap JVM (single)

Phối hợp: 2 câu multi (052, 056, khoảng 1/4), 8 câu single; vị trí đáp án phân tán đều (0, 1, 2, 3); explain có Tóm tắt, Vì sao đúng, Vì sao các phương án khác sai, Senior tip; tiếng Việt có dấu đầy đủ; không backtick, không ${.

Kiểm tra: node --check js/data/quiz-design.js → OK. validate.js không báo lỗi nào thuộc quiz-design.js hoặc qz-scenario-05x.

Lưu ý (ngoài phạm vi sở hữu, không sửa theo quy tắc 3): build-light-index.js và validate.js không chạy đến được "OK" do lỗi cú pháp đã có sẵn trong js/data/labs-gc.js (nội dung của agent khác, bị bỏ giữa chừng) — đã để nguyên, không sửa file ngoài quyền sở hữu của task này.
Reviewed-by: kilo (T2820R)
