# T308 — OpenRouter free: fallback model, JSON bền, timeout, retry

Status: DONE
Agent: opencode
Owns: `api/_claude.js`, `scripts/test-openrouter.js`

Integrator cho phép sửa đúng các file trong `Owns`. Bối cảnh: AI (chấm bài, phỏng vấn) chạy qua OpenRouter model free (`api/_claude.js`). Hiện tại:
- `AI_MODEL` mặc định `openrouter/free`, tức router chọn model ngẫu nhiên nên chất lượng thất thường.
- Timeout cứng 10s, mà model free chậm nên hay bị 504.
- `JSON.parse` thẳng `content`, trong khi model hay bọc code fence hoặc thêm chữ, nên ra `bad_json`.
- Không retry.

Yêu cầu (giữ nguyên chữ ký `askJson`/`reply`/`clampScore`/`MODEL` để các api khác không vỡ):
1. Env `AI_MODELS` = danh sách model phân tách dấu phẩy (ưu tiên giảm dần). Gửi qua tham số OpenRouter `models: [...]` (fallback routing chính thức của OpenRouter), với `model` = phần tử đầu. Không có `AI_MODELS` thì dùng `AI_MODEL` như cũ. Khi có `response_format` thì thêm `provider: { require_parameters: true }` để chỉ route tới provider hỗ trợ structured output.
2. Timeout theo tham số `timeoutMs` (mặc định 25000; tối đa 55000).
3. Đọc JSON bền: bỏ code fence; nếu vẫn lỗi thì lấy object JSON cân bằng ngoặc đầu tiên trong text; nếu `content` rỗng mà có `message.reasoning` thì thử tìm JSON trong đó.
4. Nếu vẫn `bad_json`, hoặc provider trả lỗi 429/5xx: retry **đúng 1 lần**. Lần 2 bỏ `json_schema`, dùng `json_object` và thêm câu "Chỉ trả về JSON hợp lệ đúng schema" vào system. Không retry quá 1 lần, vì mỗi lần đều tốn hạn mức free.
5. Thêm tham số `temperature` tuỳ chọn (ưu tiên hơn `effort`).
6. Kết quả trả thêm `attempts` và `model` thực tế (`data.model`).
7. Cập nhật `scripts/test-openrouter.js` (mock fetch, không gọi mạng) cho các trường hợp: fence, text lẫn JSON, reasoning, retry 1 lần rồi dừng, mảng `models`, tham số timeout. `node scripts/test-openrouter.js` phải pass hết; chạy `node --check api/_claude.js`.

Ghi Notes, `Status: DONE`.

## Notes

- Integrator (Claude) làm gộp T308+T324+T325 trong một lần viết lại `api/_claude.js` (agent free lỗi liên tục ở T308): failover nhiều provider (openrouter, groq, gemini, github, cerebras, mistral), cooldown + luân phiên, đọc JSON bền (fence/chữ lẫn/reasoning), phân biệt hết hạn mức ngày (quota_exceeded) với 429 theo phút (rate_limited + retry_after), `AI_MODELS` + `require_parameters` cho OpenRouter, `temperature`/`timeoutMs` tuỳ chọn. `api/status.js` trả `providers` (không lộ key). Test: `scripts/test-openrouter.js` 15/15, `scripts/test-providers.js` 10/10. Hướng dẫn: `docs/AI-PROVIDERS.md`.
