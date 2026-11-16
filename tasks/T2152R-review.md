# T2152R — Fact-check nội dung mới của T2152

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2152 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Nội dung MỚI của T2152 = phần cuối body `lesson-ai-015` (đoạn chốt mục 3, mục 4, mục 5, "Liên hệ phỏng vấn", `> Senior tip:`). Không đụng nội dung đã có ở HEAD.
- **Không có lỗi kiến thức/kỹ thuật/markup trong nội dung mới → không sửa file.**
- Đã xác minh:
  - `@ConfigurationPropertiesScan` có từ **Spring Boot 2.2.0** (docs 2.2 API: "Since: 2.2.0") — câu "Spring Boot 2.2+" đúng; `@EnableConfigurationProperties` trên configuration class đúng.
  - Placeholder `${RAG_LLM_API_KEY:}` lấy biến môi trường, mặc định chuỗi rỗng — đúng semantics Spring; API key không hard-code/không log — đúng.
  - Số liệu mục 4 nhất quán nội bộ: 200×24×30 = 144.000 lượt/tháng; ×2.000 token ≈ 288 triệu token/tháng; ×5 USD/1M ≈ 1.440 USD/tháng; 200.000/2.000 = 100 lần. Đơn giá ghi rõ là "giả định, không phải bảng giá thực" nên không phải số liệu vô căn cứ.
  - Mục 5 + trả lời phỏng vấn: timeout connect 3s/đọc 20s khớp config mẫu; retry chỉ 429/5xx/529 + maxAttempts + tổng thời gian chờ; `max_tokens` theo loại việc; backoff có trần + jitter (thundering herd); circuit breaker + fallback — đều đúng.
  - Tiếng Việt có dấu toàn bộ phần mới, thuật ngữ tiếng Anh (wrapper, backoff, jitter, circuit breaker, fallback, latency, dashboard) đều có giải thích ngắn; không còn ký tự nước ngoài (đã quét CJK/Cyrillic/Arabic = 0).
- Nghiệm thu: `node --check js/data/lessons-ai.js` OK; `node scripts/test-lessons.js` → `Lesson exercises OK: 298/298` (266 bài, cache); `node scripts/validate.js` → `OK — không có lỗi.`
- Không sửa file nào khác (index-light.js vẫn đồng bộ, không cần build lại).
