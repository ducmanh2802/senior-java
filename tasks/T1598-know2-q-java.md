# T1598 — Kiến thức: 8 câu Java hiện đại và hiệu năng

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: modern, core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý**.

Chủ đề: virtual thread (Java 21) khác platform thread thế nào và khi nào không có lợi, record pattern và switch pattern matching, text block và String.formatted, Sequenced Collections (Java 21), tối ưu hiệu năng: tránh autoboxing trong vòng lặp nóng, chọn cấu trúc dữ liệu theo độ phức tạp, JMH benchmark đúng cách, đo và giảm allocation.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-java.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-java.js logs/tmp-T1598.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 8 câu mới vào `js/data/q-java.js`: `modern-050` (lead, virtual thread vs platform thread), `modern-051` (senior, record pattern + pattern matching switch), `modern-052` (senior, text block + String.formatted), `modern-053` (senior, Sequenced Collections Java 21), `core-046` (senior, autoboxing/unboxing hot loop), `collections-042` (senior, chọn cấu trúc dữ liệu theo Big-O/đặc tính), `core-047` (senior, JMH benchmark đúng cách), `core-048` (lead, đo/giảm allocation với GC log/JFR/profiler).
- Tất cả câu có `**Tóm tắt:**`, mục chi tiết (cơ chế/VÌ SAO, code/bảng), `### Pitfall thực tế trên production`, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, và `follow` 3 câu.
- Đã chạy: `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo path.js về bài học không nằm trong PATH, có sẵn từ trước).
- Sửa nhỏ trong phần mới thêm (modern-051) để pass validate: thay inline code có `{}` lồng nhau (record declaration/if block) bằng dạng inline đơn giản (validator báo inline code không được chứa dấu { } lồng nhau). Không sửa mục đã có trước đó.
- Không commit, không sửa file ngoài phạm vi sở hữu. Temp: `logs/tmp-T1598.js`, `scripts/tmp-gen-t1598.js`.
Reviewed-by: kilo (T1598R)
