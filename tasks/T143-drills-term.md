# T143 — Drills phát âm thuật ngữ kỹ thuật

Status: TODO
Agent: opencode
Owns: `js/data/drills-term.js`

Đọc comment schema đầu file (đã có sẵn, rỗng, đã gắn index.html) và AGENTS.md mục 2, 5. Người học: dev Java Việt Nam 4–8 năm, tiếng Anh đọc tốt nhưng nói chưa trôi, chuẩn bị phỏng vấn Senior với công ty nước ngoài/ngân hàng. Tiếng Anh tự nhiên kiểu người bản xứ nói trong phỏng vấn (American English), không văn viết cứng, không sai ngữ pháp. Dữ liệu là chuỗi thường (không markup), không dùng backtick và `${`. id tăng dần 3 chữ số, duy nhất.

Thêm **~80 thuật ngữ** `kind: 'term'` mà dev Việt hay đọc sai hoặc ngập ngừng: cache, queue, idempotent, asynchronous, Kubernetes, PostgreSQL, Nginx, OAuth, JSON, YAML, SQL ("sequel"/"S-Q-L"), schema, throughput, latency, scalability, concurrency, deterministic, hierarchy, architecture, Hibernate, Lombok, Gradle, Maven, Kafka, Redis, microservice, payload, legacy, entity, null, char, enum, tuple, suite, height/width, data, gauge, archive… `say`: gợi ý đọc cho người Việt (âm tiết, trọng âm viết HOA, ví dụ "ai-DEM-po-tần"), `wrong`: lỗi hay gặp ("đọc 'cát-chê' cho cache"), `example`: 1 câu tiếng Anh dùng từ đó trong ngữ cảnh phỏng vấn. Chỉ ghi cách đọc bạn chắc chắn đúng (theo từ điển Cambridge/Merriam-Webster). `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
