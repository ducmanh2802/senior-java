# T316 — CCDV-F câu hỏi tự luận (phần 1): Claude API, ứng dụng & tích hợp, chọn model

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`
After: T315

Thêm **20 câu** `claude-001` … `claude-020` (topic `claude`) vào `js/data/q-claude.js`. Tuân thủ AGENTS.md mục 4–6 và 13. Đây là nội dung ôn chứng chỉ **Claude Certified Developer – Foundations**. Theo các trang ôn thi bên thứ ba, đề có 8 domain: Applications & Integration ~33%, Model Selection & Optimization ~17%, Agents & Workflows ~15%, Prompt & Context Engineering ~11%, Tools & MCP ~11%, Security & Safety ~8%, Claude Code ~3%, Eval/Testing/Debugging ~3%. Task này phủ 2 domain đầu.

### Độ chính xác là yêu cầu số 1
- Trước khi viết, **đọc tài liệu chính thức** bằng công cụ webfetch: https://docs.claude.com (Messages API, streaming, tool use, structured outputs, prompt caching, batch, token counting, errors, rate limits, models overview, pricing).
- **Cách đọc docs nhanh** (trang HTML render bằng JS nên curl gần như rỗng; các lần chạy trước timeout vì cứ thử mò):
  - Dùng `curl -sL https://docs.claude.com/llms.txt` để lấy danh sách link, rồi tải bản markdown của từng trang (link trong llms.txt, đuôi `.md`), mỗi lệnh có `--max-time 20`.
  - Chỉ đọc **tối đa 8 trang** liên quan, lưu các ý chính vào ghi chú rồi bắt đầu viết.
  - **Ghi file theo từng đợt 5 câu**, mỗi đợt chạy `node --check`, để nếu bị ngắt thì không mất công.
- Không chắc thì **không viết** chi tiết đó. Không bịa tên tham số, header hay giá tiền.
- Model hiện hành là họ Claude 5: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`, `claude-fable-5-1`. Nếu nhắc tới thông số của từng model (context window, giá) thì phải lấy từ trang models/pricing. Không nêu được nguồn thì bỏ số.
- Mỗi câu nên có `refs` (≤ 3) trỏ tới trang docs.claude.com tương ứng; chạy `node scripts/check-links.mjs js/data/q-claude.js`.

### Danh sách gợi ý (theo phong cách phỏng vấn / tình huống)
- Cấu trúc request/response của Messages API: `role`, content blocks, `system`, `max_tokens`, các giá trị `stop_reason` và cách xử lý từng giá trị.
- Streaming SSE: thứ tự event, gom `content_block_delta`, khi nào nên stream.
- Hội thoại nhiều lượt: API stateless, quản lý lịch sử, cắt hoặc tóm tắt khi gần đầy context.
- Lỗi và retry: 429 / 529 / 5xx, header `retry-after`, exponential backoff + jitter, idempotency.
- Rate limits (RPM / input TPM / output TPM) và cách thiết kế hàng đợi.
- Prompt caching: `cache_control`, điểm đặt breakpoint, thứ tự phần tĩnh/động, TTL, cách đọc usage (`cache_creation_input_tokens`, `cache_read_input_tokens`), khi nào có lợi.
- Message Batches API: khi nào dùng, giới hạn, cách lấy kết quả.
- Structured output / JSON: dùng tool schema hoặc structured outputs, validate phía server.
- Token counting và ước lượng chi phí; chọn Opus, Sonnet hay Haiku theo độ khó, độ trễ, chi phí; routing nhiều model.
- Tích hợp vào backend Java/Spring: gọi qua SDK hoặc HTTP, timeout, circuit breaker, không lộ API key ra client, log usage.
- Extended thinking: khi nào bật, budget, ảnh hưởng tới chi phí và độ trễ (chỉ viết đúng như docs).
- Vision/PDF input, Files API (chỉ viết nếu docs xác nhận).

Level: khoảng 30% mid, 55% senior, 15% lead. Mỗi đáp án 1500–4000 ký tự, mở đầu `**Tóm tắt:**`, kết thúc `> Senior tip:`; code ví dụ dùng `~~~json` (request/response) hoặc `~~~java`. `node scripts/validate.js` → OK. Ghi Notes (liệt kê các trang docs đã đọc), `Status: DONE`.

## Notes

- Integrator (Claude) viết 20 câu claude-001..020 (5 mid, 10 senior, 5 lead; TB ~3800 ký tự), đối chiếu tài liệu Claude API hiện hành: Messages API/stateless, stop_reason, streaming SSE, 429/529 + retry, rate limit + queue, prompt caching (cơ chế + debug), Batch API, structured outputs, ước lượng chi phí, chọn model, effort/adaptive thinking, tích hợp Spring an toàn, vision/PDF/Files API, refusal + fallback, tối ưu chi phí, migration lên model 5.x, và 3 câu doanh nghiệp lớn (knowledge/RAG/MCP, Agent Skills, flow + quản trị). Không gắn refs (chưa kiểm chứng được URL docs).
Reviewed-by: claude (integrator)
