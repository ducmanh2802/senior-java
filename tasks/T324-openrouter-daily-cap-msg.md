# T324 — Phân biệt "hết hạn mức ngày" với "giới hạn tốc độ" của OpenRouter

Status: DONE
Agent: opencode
Owns: `api/_claude.js`, `scripts/test-openrouter.js`
After: T308

Integrator cho phép sửa đúng các file trong `Owns`. Khi OpenRouter trả 429 vì hết hạn mức free trong ngày (thông điệp có `free-models-per-day`, hoặc header `X-RateLimit-Remaining: 0` kèm `X-RateLimit-Reset`), site hiện báo nhầm là "OpenRouter đang giới hạn tốc độ, thử lại sau", khiến người dùng thử lại vô ích.

1. Trong `mapOpenRouterError` (hoặc nơi xử lý 429), nếu thông điệp lỗi chứa `per-day` / `per day` / `free-models-per-day`:
   - Trả về `{ status: 429, code: 'quota_exceeded', message: 'Hết lượt AI miễn phí hôm nay (giới hạn OpenRouter). Thử lại sau <giờ reset> hoặc nạp credit OpenRouter.' }`.
   - Nếu có header `X-RateLimit-Reset` (epoch ms) thì đổi sang giờ Việt Nam (UTC+7) dạng HH:mm.
   - Lỗi này **không retry** (retry chỉ tốn thêm lượt).
2. 429 thông thường (theo phút) giữ code `rate_limited`, kèm `retry_after` (giây) nếu có header `Retry-After`.
3. Thêm test mock cho cả 2 trường hợp vào `scripts/test-openrouter.js`; `node scripts/test-openrouter.js` phải pass hết.
4. Ghi Notes, `Status: DONE`.

## Notes

- Integrator (Claude) làm gộp T308+T324+T325 trong một lần viết lại `api/_claude.js` (agent free lỗi liên tục ở T308): failover nhiều provider (openrouter, groq, gemini, github, cerebras, mistral), cooldown + luân phiên, đọc JSON bền (fence/chữ lẫn/reasoning), phân biệt hết hạn mức ngày (quota_exceeded) với 429 theo phút (rate_limited + retry_after), `AI_MODELS` + `require_parameters` cho OpenRouter, `temperature`/`timeoutMs` tuỳ chọn. `api/status.js` trả `providers` (không lộ key). Test: `scripts/test-openrouter.js` 15/15, `scripts/test-providers.js` 10/10. Hướng dẫn: `docs/AI-PROVIDERS.md`.
