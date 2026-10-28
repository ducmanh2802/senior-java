# T322 — CCDV-F trắc nghiệm: mở rộng lên 200 câu (có câu chọn nhiều đáp án)

Status: DONE
Agent: opencode
Owns: `js/data/quiz-claude.js`
After: T318

Điều kiện: T320 (schema `multi`) phải DONE trước. Nếu chưa xong thì chỉ viết câu một đáp án và ghi chú lại trong Notes.

Thêm **140 câu** `qz-claude-061` … `qz-claude-200` vào `js/data/quiz-claude.js`. Chỉ thêm, không sửa câu 001–060. Áp dụng đúng các quy tắc trong `tasks/T318-claude-cert-quiz.md` và mục "Độ chính xác là yêu cầu số 1" trong `tasks/T316-claude-cert-q-api.md`:
- Câu viết mới từ tài liệu chính thức https://docs.claude.com.
- **Tuyệt đối không chép** đề từ Udemy, các trang dump hay khoá luyện thi trả phí.
- `explain` nói rõ vì sao từng phương án đúng hoặc sai.

1. Phân bổ (tổng sau khi xong ≈ 200 câu):

   | Domain | Số câu thêm |
   |---|---|
   | Applications | 46 |
   | Model Selection | 24 |
   | Agents | 21 |
   | Prompt | 15 |
   | Tools | 16 |
   | Security | 11 |
   | Claude Code | 4 |
   | Eval | 3 |

   Mỗi câu mở đầu bằng tag `[Domain]` (đúng tên domain như T318 đã dùng; kiểm tra lại trong file).
2. Khoảng 20% là câu **chọn nhiều đáp án** (`multi: true`, ghi "(Chọn 2)" hoặc "(Chọn 3)" trong `q`).
3. Không trùng ý với 60 câu đã có: đọc hết file trước khi viết. Mỗi domain phải có câu tình huống khó (đọc đoạn JSON request/response, chọn cách sửa).
4. Chia làm nhiều lần ghi file, mỗi lần khoảng 20 câu, và chạy `node --check` + `node scripts/validate.js` sau mỗi lần để không mất công nếu bị ngắt.
5. Ghi Notes (số câu theo domain, số câu multi), `Status: DONE`.

## Notes

- Phần 1 (061–130) xong — Claude subagent. 70 câu, đáp án single rải đều 14/14/14/14 (vị trí 0..3), 14 câu multi. Theo domain: Applications 23, Model Selection 12, Agents 11, Prompt 7, Tools 8, Security 5, Claude Code 2, Eval 2 → **phần 2 (131–200) còn: Applications 23, Model Selection 12, Agents 10, Prompt 8, Tools 8, Security 6, Claude Code 2, Eval 1** (≈14 multi).
  - Chủ đề đã dùng (phần 2 tránh trùng): Applications: input_json_delta khi stream, event error giữa stream, đọc content theo type (không content[0]), retry chồng retry (SDK mặc định 2 lần), timeout/bulkhead, lỗi nào retry (multi), 413/32 MB, batch expired/errored, sự thật về Batch (multi), fallback không dùng trong batch, rate limit chung 10 pod, header anthropic-ratelimit-*, HashMap làm vỡ cache, các thứ làm tụt cache hit (multi), prefix dưới ngưỡng, TTL 1h cho traffic thưa, Files API + cache, citations vs structured outputs, 600 trang PDF, model_context_window_exceeded, thinking display summarized, structured outputs bị cắt max_tokens, tính chi phí 3 loại input token. Model Selection: effort sweep, Opus 5.5 effort mặc định medium, Haiku 5.5 còn nhận forced tool còn Sonnet 5.5 thì 400, budget_tokens → effort + max_tokens, tính tiền 100K tài liệu Sonnet, rủi ro cascade, context awareness/task budgets, Fable 2.5x Opus, chi phí mỗi tác vụ hoàn thành, giá cache read Opus/Sonnet (multi), thinking ăn max_tokens, 1M không cần beta header. Agents: mixed server+client tool (chỉ tool_result), giữ nguyên thinking block khi gửi tool_result, max_tokens cắt tool_use (multi), lỗi "failed" + phát hiện lặp, brief cho subagent, lạm dụng subagent (multi), người duyệt từ chối → is_error, workflow routing, state file nhiều context window, context editing clear_tool_uses (multi), tool tuần tự bị bỏ qua → is_error. Prompt: thay prefill bỏ câu mở đầu, viết tiếp không prefill, long context tài liệu đầu/quotes (multi), nói điều nên làm, giải thích lý do (TTS), few-shot đa dạng, over-prompting gây gọi tool quá nhiều (multi). Tools: regex tên tool, input_examples sai schema → 400, gộp tool + namespace, tham số "reasoning" → reasoning_extraction, đổi tool_choice làm vỡ cache messages, Anthropic-schema tools (multi), MCP mỗi server đúng một toolset, merge default_config/configs (multi). Security: email vào tool_result, không đặt hướng dẫn trong tool_result, screen Haiku bị refusal = gắn cờ, chống jailbreak trực tiếp (multi), JSON-encode nội dung không tin cậy. Claude Code: gộp nhiều hook PreToolUse (deny thắng), --bare + Bash(git diff *) (multi). Eval: volume over quality, tips LLM grader (multi).
  - `node --check` OK; `node scripts/validate.js` chỉ còn lỗi cú pháp ở `q-microservices.js` (agent khác đang sửa), không có lỗi nào ở quiz-claude.js.

- Phần 2 (131–200) xong — Claude subagent. 70 câu, đáp án single rải đều 14/14/14/14, 14 câu multi. Theo domain: Applications 23, Model Selection 12, Agents 10, Prompt 8, Tools 8, Security 6, Claude Code 2, Eval 1 → tổng file 200 câu (khớp phân bổ T322).
  - Chủ đề phần 2: Applications: stop_details chỉ khi refusal, header fallbacks 06-01/07-01, fallback trên Bedrock (middleware client), timeout TS tính ms, request-id, pre-warm max_tokens 0 (multi), fan-out đồng thời không đọc cache, lookback 20 vị trí, 4 breakpoint + automatic → 400, thứ tự TTL 1h trước 5m, cache cô lập theo workspace, TTL tính từ đầu request, mid-conversation system message, compaction phải append content, citations page_location, Files API block khớp MIME, biên dịch schema 24h, giới hạn JSON Schema (multi), temperature 400 với 2026-10-21, lỗi web search trả 200, inference_geo, cache read không tính ITPM, cái gì chiếm context window (multi). Model Selection: Haiku 5.5 > 100K giá cao, fast mode, Sonnet 5.5 between_tools, tokenizer Fable re-baseline, Fable cần 30 ngày retention (ZDR), Priority Tier không hỗ trợ Opus 5.5, cache theo model → subagent, Models API max_input_tokens, PDF 100/600 trang, advisor pairing, migrate Sonnet 5→5.5 (multi), chuẩn bị Fable 5.1 lượt dài (multi). Agents: approval trong Tool Runner, tiêu chí có nên xây agent (multi), bash vs tool chuyên dụng, programmatic tool calling, memory qua phiên, prompt chaining tự sửa, hành động khó đảo ngược, Managed Agents chạy theo lịch, Tool Runner vs Agent SDK (multi), effort trong agent (multi). Prompt: gợi ý vs hành động, XML tag, over-engineering, hard-code test, investigate before answering (multi), yêu cầu tóm tắt sau tool, overthinking, độ dài Opus 5 không theo effort (multi). Tools: tool_result phải đứng đầu, tách tool_result làm mất song song, description chi tiết, tool search defer_loading (multi), regex quyết định → schema, ảnh trong tool_result, eager_input_streaming (multi), strict + additionalProperties false. Security: web_fetch/allowed_domains (multi), memory tool nhiều người dùng (multi), screen output tool bằng Haiku, nêu nguồn nội dung OCR, computer use trong sandbox, system message giữa hội thoại làm kênh operator. Claude Code: claude -p --json-schema → structured_output, exit code hook PreToolUse. Eval: tiêu chí thành công đo được.
  - `node --check` OK; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: claude (subagents; facts from docs.claude.com pages; validate OK)
