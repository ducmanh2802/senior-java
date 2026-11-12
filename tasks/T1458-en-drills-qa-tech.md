# T1458 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (tech) drill-qa-074…081

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T1457

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-074` … `drill-qa-081`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **giải thích khái niệm kỹ thuật bằng lời (như đang nói với interviewer)**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. Explain transaction isolation levels to a junior developer.
2. An API suddenly becomes slow. How do you investigate?
3. When do you choose optimistic locking over pessimistic locking?
4. How do Kafka consumer groups work, and what does at-least-once mean for your code?
5. How do you decide what to cache and how to invalidate it?
6. How do you design database indexes for a slow query?
7. What happens when a Java service runs out of memory, and how do you find the cause?
8. Why should a payment API be idempotent, and how do you implement it?

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1458.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1458.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes
- Đã thêm 8 bài `drill-qa` (theme `tech`, level `senior`) vào cuối `js/data/drills-qa.js`:
  - `drill-qa-074` (90s): giải thích transaction isolation levels cho junior (định nghĩa transaction, isolation, dirty read, Read Committed/Repeatable Read/Serializable, ví dụ PostgreSQL).
  - `drill-qa-075` (90s): điều tra API chậm đột ngột (p99, tracing, lock contention, recent changes, fix + alert).
  - `drill-qa-076` (90s): chọn optimistic vs pessimistic locking (version/retry vs row lock, ví dụ profile vs booking, số liệu 300ms→20ms).
  - `drill-qa-077` (120s): Kafka consumer groups + at-least-once (partition, offset, idempotent xử lý, event id/upsert, payment không trùng charge).
  - `drill-qa-078` (90s): cache gì và invalidate thế nào (Redis, stale tolerance, TTL, delete key sau write, giảm 70% DB reads).
  - `drill-qa-079` (90s): thiết kế index cho slow query (EXPLAIN, composite index, selectivity, 4s→120ms, overhead write).
  - `drill-qa-080` (120s): Java service OOM (JVM, GC, heap, heap dump, leak/unbounded cache 2GB→eviction giảm 60%).
  - `drill-qa-081` (90s): payment API idempotent (idempotency key, uniqueness table, transaction, giảm 40% refund tickets).
- Mỗi sample 80–200 từ, plain text, có số liệu/trade-off, giải thích thuật ngữ lần đầu; phrases trích nguyên văn từ sample.
- Thêm qua `node scripts/qtool.js append ...`; `node scripts/build-light-index.js` + `node scripts/validate.js` → OK. Không commit. Temp files: `logs/make-T1458.js`, `logs/tmp-T1458.js`.
Reviewed-by: check-i18n (translation, no LLM review)
