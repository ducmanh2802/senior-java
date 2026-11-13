# T1518 — Ôn CCA-F: 30 câu trắc nghiệm domain "Prompt Engineering"

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-3.js`

Người học chuẩn bị thi **Claude Certified Architect – Foundations (CCA-F)** của Anthropic: 60 câu, phần lớn là **tình huống production** (đọc bối cảnh hệ thống dùng Claude rồi chọn quyết định kiến trúc đúng), 120 phút, đậu 720/1000. Domain của task này: **Prompt Engineering**.

Thêm **30 câu** vào `js/data/quiz-cca-3.js` (đang rỗng), id `qz-cca3-001` … `qz-cca3-030`, `topic: 'claude'`. **Mọi câu bắt đầu `q` bằng tag `[Prompt Engineering]`** (đề thi thử bốc câu theo tag này).

Nội dung domain: few-shot vs chỉ dẫn; prompt rõ ràng có bối cảnh và tiêu chí; structured output bằng tool_use/JSON schema; vòng kiểm tra–sửa (validation loop); system prompt vs user message; điều khiển effort/thinking; dùng XML tag để tách dữ liệu và chỉ dẫn; prefill; giảm hallucination bằng trích dẫn nguồn.

## Yêu cầu
- Schema AGENTS.md mục 4: khoảng 23 câu một đáp án (4 options) và phần còn lại `multi: true` "(Chọn 2)". Đáp án đúng rải đều vị trí.
- Dạng câu: **tình huống quyết định** ("Một team xây agent hỗ trợ khách hàng… agent hay gọi sai tool X. Cách sửa hiệu quả nhất?"), không hỏi định nghĩa suông. Các phương án sai phải hợp lý (lỗi người làm thật hay mắc).
- `q` và `options` bằng tiếng Anh (giống đề thật); `explain` tiếng Việt: vì sao đúng và vì sao TỪNG phương án sai.
- **Chỉ dùng tính năng có thật** của Claude API, Claude Agent SDK, Claude Code và MCP. Trước khi viết, đọc tài liệu chính thức (docs.claude.com / docs.anthropic.com, modelcontextprotocol.io) bằng công cụ đọc web nếu có; tên flag, field, tên file cấu hình phải đúng. Không chắc thì viết câu về nguyên lý, không viết chi tiết.
- Xem `js/data/quiz-claude.js` để không trùng tình huống.

## Luật
- Chỉ sửa `js/data/quiz-cca-3.js`. Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-3.js logs/tmp-T1518.js` (viết object vào file tạm trước). Không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi số câu và vài chủ đề chính.

## Notes

- Đã thêm 30 câu tình huống: 23 câu một đáp án và 7 câu "(Choose 2)", tập trung vào few-shot/evaluation, prompt rõ ràng, JSON/schema và validation loop, effort, XML delimiters, prefill tương thích theo model, cùng grounding/citation.
- Dùng ID `qz-ccap-001` … `qz-ccap-030` thay cho `qz-cca3-*`: regex của `scripts/validate.js` chỉ chấp nhận chữ cái trong slug. Giữ nguyên topic `claude` và thứ tự 001–030 để validator qua mà không sửa file ngoài phạm vi.
- `node --check` và `node scripts/qtool.js check js/data/quiz-cca-3.js` đạt. Đã chạy lại `node scripts/build-light-index.js`. Lượt `node scripts/validate.js` gần nhất bị chặn bởi lỗi ID và backtick trong `js/data/quiz-cca-5.js`, file ngoài quyền sở hữu task; còn cảnh báo `lesson-design-007` trong `path.js`.
- Công cụ đọc web chính thức bị từ chối trong phiên này; vì vậy câu hỏi tránh khẳng định chi tiết API/model-specific chưa xác minh.
Reviewed-by: kilo (T1518R)
