# T294R — Fact-check nội dung mới của T294

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T294 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check và sửa nội dung mới trong `js/data/lessons-ai.js` (lesson-ai-002, lesson-ai-003, lesson-ai-004):

- **lesson-ai-002 (Che PII)**: body 2542 ký tự (đủ ≥ 2500). Nội dung kỹ thuật đúng: CCCD 12 số, SĐT 10 số bắt đầu 0/+84, email regex, số thẻ 13-19 số qua Luhn, thứ tự mask email→phone→CCCD→card, LinkedHashMap giữ thứ tự placeholder, unmask chỉ ở biên trả về. Không phát hiện lỗi kỹ thuật.
- **lesson-ai-003 (RAG mini)**: body 2586 ký tự. Đã sửa:
  - Dòng "Cosine similarity = dot(a,b)/(||a||*||b||), phạm vi [-1,1]" → `[0,1]` vì bag-of-words chỉ có giá trị không âm; cosine giữa hai vector không âm nằm trong [0,1], không thể âm. Viết [-1,1] là sai về mặt toán học trong ngữ cảnh này.
- **lesson-ai-004 (AI production)**: body 2628 ký tự. Đã sửa:
  - Option `"Bỏ qua"` trong check[0] và check[2] có ký tự đầu dòng bị thay bằng khoảng trắng (UTF-8 `B\u0111\u00f3 qua` thay vì `Bỏ qua`) → đã xóa khoảng trắng để đúng chính tả.
- Kiểm tra lại:
  - `node scripts/validate.js` → OK (không lỗi, chỉ có cảnh báo không liên quan đến task này).
  - `node scripts/test-lessons.js` → 119/119 bài tập pass (3 bài mới + lesson-ai-001 đã có). exercises reference, starter, tests đều biên dịch được và pass 100%.

Cảnh báo không phải của task này (không cần sửa, thuộc sở hữu của integrator):
- `path.js: có 4 bài học không nằm trong PATH: lesson-testing-005, lesson-ai-002, lesson-ai-003, lesson-ai-004` — path.js là file của integrator, các lesson-* mới cần được thêm vào PATH bởi người sở hữu path.js.