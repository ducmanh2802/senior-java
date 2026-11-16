# T2228 — Rà soát chất lượng toàn bộ câu trong quiz-cca-3.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-3.js`
After: T2184

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (`node scripts/qtool.js list js/data/quiz-cca-3.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-3.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- 55 câu qz-ccap-001..055 (topic claude, tag [Prompt Engineering]) — đếm trước/sau đều 55, không đổi id, không xoá mục.
- Đối chiếu với nguồn chuẩn trong repo: `q-claude.js` (claude-011/012/017 và mục migration model) — các model hiện hành: Fable 5.2 $8/$40 (mạnh nhất), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50; context tới ~1M; sampling (temperature/top_p/top_k) 400; thinking adaptive + output_config.effort; Opus không tắt thinking; Sonnet tắt bằng between_tools; tool_choice any/tool 400; prefill 400.

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| qz-ccap-014 | Prefill được mô tả "một số model không chấp nhận" — chưa nêu rõ model hiện hành từ chối 400 | Bổ sung: prefill 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+, chuyển sang structured outputs/output_config.format |
| qz-ccap-029 | Câu hỏi prefill chung chung, chưa phản ánh prefill bị bỏ | Đổi option/explain sang "xác minh model còn chấp nhận prefill (thường là không, 400)" + structured outputs; vẫn chọn [1,4] |
| qz-ccap-032 | **Đáp án đúng = "dùng temperature thấp gần 0"** — sai, temperature bị từ chối 400 | Viết lại: ghim model id + effort tường minh + strict/structured output + eval held-out; answer giữ 1 |
| qz-ccap-035 | **Đáp án đúng = "top_p điều khiển độ đa dạng"** — sai, top_p 400 | Viết lại: điều khiển đa dạng bằng prompt + effort, sampling đã bỏ; answer giữ 1 |
| qz-ccap-036 | **Đáp án đúng = "tool_choice required để ép gọi tool"** — sai, any/tool 400 | Viết lại: structured outputs hoặc strict tool + validate; nêu rõ any/tool 400 trên model mới; answer giữ 1 |
| qz-ccap-038 | "Claude 3.7+ extended thinking + thinking budget" — budget_tokens 400, tên model cũ | Viết lại: adaptive thinking + output_config.effort; nêu budget_tokens 400, Opus không tắt thinking; answer giữ 1 |
| qz-ccap-040 | "Claude 3 family ~200K" — lỗi thời (model mới ~1M) | Sửa thành context ~1M tùy model, vẫn có trần, ví dụ 500K vẫn vượt nếu quá trần |
| qz-ccap-049 | **Đáp án đúng = "thử temperature thấp và few-shot"** — temperature 400 | Viết lại: giữ effort thấp + làm rõ prompt/mô tả nhãn + eval; answer giữ 1 |
| qz-ccap-054 | Dùng "Claude extended thinking" + "thinking budget" — cần khung current/effort | Đổi sang adaptive thinking + output_config.effort; answer giữ [0,2] |

- Các câu còn lại (006, 024, 034, 037, 051, 050…) nhắc temperature/top_p/budget/stop_sequences chỉ ở **phương án sai** (distractor) hoặc ở satisfied concept (stop_sequences, max_tokens, prompt caching vẫn đúng) — giữ nguyên.
- `node --check js/data/quiz-cca-3.js` OK; `node scripts/build-light-index.js` OK (314.8 KB); `node scripts/validate.js` → **OK — không có lỗi.**
- Không có backtick/`${` lẫn trong template literal; validate chạy qua vm không lỗi cú pháp; cấu trúc đáp án (answer index, multi [Choose N]) kiểm tra lại OK.
