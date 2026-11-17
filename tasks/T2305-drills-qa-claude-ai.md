# T2305 — 20 drill hỏi-đáp tiếng Anh: phỏng vấn vị trí Java backend + AI integration (Claude)

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T2272

## Bối cảnh
Người học (Java dev 4 năm) hướng tới vị trí **Senior Java backend + tích hợp AI (Claude API)** và đi phỏng vấn bằng tiếng Anh. Drill `qa` luyện nói trong `#/speak` (TTS/STT trình duyệt, không gọi AI). Định dạng ở comment đầu file `js/data/drills-qa.js`; đọc 3 drill có sẵn trước.

## Việc cần làm
Thêm **20 drill `kind: "qa"`** (id `drill-qa-NNN` tiếp số lớn nhất), chèn ngay trước dòng `);` cuối file:
- 8 theme `tech`: tích hợp LLM vào service Java (timeout/retry/idempotency khi gọi API, streaming, prompt caching để giảm chi phí, tool use, RAG với pgvector, đánh giá chất lượng output, xử lý prompt injection, chọn model theo chi phí/độ trễ).
- 6 theme `project`: kể một dự án tích hợp AI/backend (STAR, có số liệu).
- 3 theme `design`: thiết kế hệ thống có thành phần LLM (queue, cache, fallback khi API lỗi).
- 3 theme `behavioral`: dùng AI coding tools trong team, review code do AI viết, bất đồng về áp dụng AI.
- `sample` 80–200 từ, văn nói tự nhiên của Senior, đúng ngữ pháp; `phrases` 3–6 cụm hữu ích. Không bịa giá/tên model cụ thể (nói chung chung "a smaller, cheaper model").
- Chuỗi dùng nháy kép như file hiện có; không backtick.

## Nghiệm thu
`node --check js/data/drills-qa.js`, `node scripts/validate.js` → OK. Đếm id trước/sau (+20). KHÔNG commit. Status: DONE + id mới vào Notes.

## Notes

## Notes
- Thêm 20 drill qa (drill-qa-162..181): 8 tech, 6 project, 3 design, 3 behavioral.
Reviewed-by: kilo (T2305R)
