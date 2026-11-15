# T2113R — Fact-check nội dung mới của T2113

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2113 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung MỚI của T2113 (chỉ có `lesson-ai-015`, `lesson-ai-016`). Sửa các lỗi sau:

**lesson-ai-015**
- Mục 2, code mẫu `ask`: escape trong template literal sai — file ghi `\"` nên khi render ra `"` (mất dấu `\`), code Java hiện ra bị vỡ: `String body = "{"model": "" + ...`. Đã đổi thành `\\"` để render đúng `"{\"model\": \""`.
- Mục 2, code mẫu: gọi Anthropic Messages API (`https://api.anthropic.com/v1/messages`) nhưng dùng header `Authorization: Bearer` — API này yêu cầu `x-api-key` + `anthropic-version: 2023-06-01`. Đã sửa header cho đúng.
- Mục 2: câu "Timeout phải có hai tầng (HttpClient phân biệt connect timeout và read timeout)" không chính xác — `java.net.http.HttpClient` chỉ có `connectTimeout`, timeout đọc đặt trên `HttpRequest`. Đã sửa lại câu.
- Bài tập `RagTokenClient` (phần `prompt`): công thức token output ghi `output.length()/4`, nhưng `reference`/`tests` dùng `(length + 3) / 4` (làm tròn). Người học làm theo prompt sẽ ra 1 token thay vì 2 và fail `eq(2, r.tokens)`. Đã sửa prompt thành `(output.length() + 3) / 4`.

**lesson-ai-016**
- Mục 3: "pgvector ... (PostgreSQL 15+)" sai — pgvector hỗ trợ PostgreSQL 13+ (README chính thức). Đã sửa thành 13+.
- Mục 4: lỗi từ "trên nhiều làn vector" → "truy vấn HNSW trả kết quả trong milliseconds".

Đã kiểm tra các số liệu (không sửa vì đúng): 225 USD/tháng = 10.000 lượt × (5.000 input × 3 USD + 500 output × 15 USD)/1M; 144.000 lượt/tháng × 2.000 token = 288 triệu token; 288 × 5 USD = 1.440 USD/tháng; 50.000 × 384 × 4 ≈ 76 MB; 10.000 tài liệu × 5 chunk = 50.000 chunk.

Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` → 296/296 pass (lesson-ai-015: 5/5, lesson-ai-016: 7/7).

Quan sát (KHÔNG sửa vì ngoài phạm vi fact-check / task yêu cầu không chỉnh văn phong, không thêm nội dung):
- Phần lớn mục 2–5 và "Liên hệ phỏng vấn" của `lesson-ai-015` viết tiếng Việt **không dấu** (khác chuẩn các bài khác). Đề xuất author chuẩn hóa dấu.
- Code mẫu nối JSON bằng chuỗi (`"{\"model\": \"" + ... + prompt + ...`) không escape `prompt`; nếu prompt chứa `"` sẽ vỡ JSON. Nên dùng `ObjectMapper`. Không sửa vì sẽ thêm nội dung ngoài phạm vi.
- `lesson-ai-015`/`016` chưa có trong `js/data/path.js` (validate vẫn cảnh báo 69 bài không nằm trong PATH; các bài `lesson-ai-007`..`016` đều chưa có). `path.js` không thuộc task này.
