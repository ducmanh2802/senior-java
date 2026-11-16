# T2229 — Rà soát chất lượng toàn bộ câu trong quiz-cca-4.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-4.js`
After: T2191

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm toàn bộ câu (`node scripts/qtool.js list js/data/quiz-cca-4.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tìm mọi câu nhắc temperature, top_p, top_k, budget_tokens, thinking enabled/disabled, tool_choice any/tool (ép gọi tool), assistant prefill, extended thinking, tên model cũ (Claude 3.x, Sonnet 4.5, Opus 4.x được nói như model mới nhất). Trên model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2): tham số sampling bị từ chối (400); thinking là adaptive, độ sâu chỉnh bằng output_config.effort, budget_tokens trả 400; Opus 5.5 không tắt được thinking; Sonnet 5.5 tắt bằng thinking type between_tools; tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1+ (dùng auto + prompt + strict: true hoặc structured outputs); prefill trả 400; model mạnh nhất là Fable 5.2 ($8/$40), Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50. Câu nào dạy cách cũ như cách đúng thì VIẾT LẠI cho đúng (giữ id, giữ tag [Domain]); câu hỏi chung về khái niệm vẫn đúng thì giữ. Notes: bảng id .
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-cca-4.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát toàn bộ 51 mục (`qz-ccat-001`…`qz-ccat-051`). Số mục trước/sau: **51 = 51**, không xoá, không đổi id, giữ nguyên tag `[Tool Design & MCP]`.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-ccat-005 | Dùng `any`/`none` như lựa chọn hợp lệ; mô tả `any` là "buộc gọi ít nhất một tool" | Giữ đáp án `auto`; sửa option `any` thành "forced tool choice" và ghi rõ any/tool bị 400 trên model hiện hành; thêm strict input schema / structured outputs |
| qz-ccat-006 | Dạy `any` là cách đúng để "buộc có tool call" | Viết lại: any/tool bị 400, auto không bảo đảm; đáp án đúng là chỉ khai báo tool verification + strict schema + executor kiểm tra tool_use (thiếu thì reject/retry) |
| qz-ccat-007 | Dạy `tool_choice none` là ranh giới chính; `any` là "buộc gọi tool" | Đáp án đổi thành "không đưa tool customer vào request" (none chỉ là lớp bổ sung khi model hỗ trợ); sửa option `any` |
| qz-ccat-008 | Dạy `{type: "tool", name: ...}` (forced tool use) là cách đúng; tiền đề "model hỗ trợ forced tool use" | Viết lại: forced any/tool bị 400; đáp án đúng là chỉ expose `lookup_refund_policy` + strict schema + executor kiểm tra tên tool; bỏ tiền đề sai |
| qz-ccat-009 | Option distractor "temperature = 0" | Giữ đáp án; sửa giải thích: temperature là sampling bị từ chối 400 và không liên quan authorization |
| qz-ccat-031 | Option distractor "tăng temperature" | Giữ đáp án; sửa giải thích: sampling bị từ chối 400, không truy cập trạng thái mới |
| qz-ccat-051 | Option distractor "temperature = 0"; thiếu cảnh báo forced any/tool | Giữ đáp án `auto` + `disable_parallel_tool_use`; thêm ghi chú kiểm tra capability và forced any/tool bị 400; sửa giải thích temperature |

Các mục còn lại (001–004, 010–030, 032–050) giữ nguyên: kiểm tra theo checklist (temperature, top_p, top_k, budget_tokens, thinking/extended thinking, prefill, tool_choice any/tool, tên model cũ) — không còn chỗ nào dạy cơ chế cũ như cách đúng; nội dung nguyên lý (tool design, MCP transport, roots, sampling, authorization, telemetry…) vẫn đúng.

Đã chạy: `node --check js/data/quiz-cca-4.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: verify-only (review task)
