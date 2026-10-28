# T325 — AI dùng luân phiên nhiều nhà cung cấp free (OpenRouter, Groq, Gemini, Cerebras, GitHub Models, Mistral)

Status: DONE
Agent: opencode
Owns: `api/_claude.js`, `scripts/test-openrouter.js`, `scripts/test-providers.js`, `api/status.js`, `docs/AI-PROVIDERS.md`
After: T324

Integrator cho phép sửa đúng các file trong `Owns`. Vấn đề: chỉ dùng OpenRouter free (khoảng 50 request/ngày) nên phỏng vấn AI hay báo hết lượt. Thêm nhiều nhà cung cấp có free tier và tự chuyển sang nhà cung cấp khác khi một bên hết lượt hoặc lỗi.

Không thêm npm dependency; chỉ dùng `fetch` của Node 18+. Giữ nguyên chữ ký `askJson` / `reply` / `clampScore` / `MODEL` để `api/grade.js`, `interview.js`, `coach.js`, `jd.js` không phải sửa.

### 1. Danh sách provider (đều là endpoint chat completions tương thích OpenAI)

| id | URL | env key | env model (bắt buộc, không hard-code model mặc định ngoài OpenRouter) |
|---|---|---|---|
| openrouter | `https://openrouter.ai/api/v1/chat/completions` | `OPENROUTER_API_KEY` | `AI_MODELS` / `AI_MODEL` như hiện tại |
| groq | `https://api.groq.com/openai/v1/chat/completions` | `GROQ_API_KEY` | `GROQ_MODEL` |
| gemini | `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` | `GEMINI_API_KEY` | `GEMINI_MODEL` |
| cerebras | `https://api.cerebras.ai/v1/chat/completions` | `CEREBRAS_API_KEY` | `CEREBRAS_MODEL` |
| github | `https://models.github.ai/inference/chat/completions` | `GITHUB_MODELS_TOKEN` | `GITHUB_MODEL` |
| mistral | `https://api.mistral.ai/v1/chat/completions` | `MISTRAL_API_KEY` | `MISTRAL_MODEL` |

- Một provider chỉ **bật** khi có đủ key và model.
- Thứ tự thử lấy từ env `AI_PROVIDERS` (ví dụ `groq,gemini,openrouter,cerebras`). Không có env này thì dùng mọi provider đang bật theo thứ tự trong bảng.
- Các tham số riêng của OpenRouter (`models`, `provider`, header `HTTP-Referer`/`X-Title`) **chỉ** gửi cho openrouter.
- Provider khác dùng `response_format: { type: 'json_object' }` cộng câu hướng dẫn JSON trong system prompt. Không gửi `json_schema` strict, vì không phải provider nào cũng hỗ trợ.
- Kết quả vẫn qua bộ đọc JSON bền và validate của T308.

### 2. Luân phiên và chuyển provider (failover)

- **Chuyển provider khác ngay** khi gặp: 429 (theo phút hoặc theo ngày), 402, 5xx, timeout, `bad_json` sau khi đã đọc JSON bền.
- **Không chuyển** khi gặp 400 do request sai hoặc 401 do key sai; trả lỗi luôn và ghi rõ provider nào bị lỗi.
- **Cooldown** (bộ nhớ của instance, `Map` provider → thời điểm được dùng lại):
  - 429 theo phút: 60 giây, hoặc theo `Retry-After` nếu có.
  - Hết hạn mức ngày (`per-day`, `quota`, `RESOURCE_EXHAUSTED`): đến `X-RateLimit-Reset` nếu có, không có thì 1 giờ.
  - 5xx/timeout: 30 giây.
  - Provider đang cooldown thì bỏ qua.
- **Giới hạn tổng:** tối đa 3 provider mỗi request, tổng thời gian dưới 55 giây (timeout mỗi lần gọi lấy theo T308).
- **Rải tải:** request lẻ đi theo thứ tự, request chẵn bắt đầu từ provider thứ hai đang bật (bộ đếm trong bộ nhớ instance). Mục đích là không dồn hết lên một provider.
- Mọi provider đều lỗi thì trả lỗi tổng hợp: `{ status: 429 hoặc 502, code: 'all_providers_busy', message: 'Tất cả AI miễn phí đang hết lượt/bận. Thử lại sau ít phút.' }`.
- Kết quả thành công trả thêm `provider` và `model` để client hiển thị chip "chấm bởi …".

### 3. `api/status.js`

Trả thêm danh sách provider đang bật: id, model, đang cooldown hay không. **Không trả key**, không trả một phần nào của key.

### 4. `docs/AI-PROVIDERS.md`

Hướng dẫn ngắn: lấy key free ở đâu (link trang console của từng provider), đặt env nào trên Vercel, gợi ý `AI_PROVIDERS`. Ghi rõ: hạn mức free mỗi bên thay đổi theo thời gian, người dùng phải tự kiểm tra trên trang provider; không ghi con số hạn mức nếu không chắc.

### 5. Test

`scripts/test-providers.js` mock `fetch`, không gọi mạng, cover các trường hợp:
- Chuyển provider khi 429 / 5xx / timeout / bad_json.
- Không chuyển khi 400/401.
- Cooldown được tôn trọng.
- Tham số riêng OpenRouter không lọt sang provider khác.
- Thứ tự `AI_PROVIDERS` được tuân theo.
- Tất cả cùng lỗi thì trả `all_providers_busy`.
- `status` không lộ key.

`node scripts/test-providers.js` và `node scripts/test-openrouter.js` phải pass hết; chạy `node --check` cho các file api. Ghi Notes, `Status: DONE`.

## Notes

- Integrator (Claude) làm gộp T308+T324+T325 trong một lần viết lại `api/_claude.js` (agent free lỗi liên tục ở T308): failover nhiều provider (openrouter, groq, gemini, github, cerebras, mistral), cooldown + luân phiên, đọc JSON bền (fence/chữ lẫn/reasoning), phân biệt hết hạn mức ngày (quota_exceeded) với 429 theo phút (rate_limited + retry_after), `AI_MODELS` + `require_parameters` cho OpenRouter, `temperature`/`timeoutMs` tuỳ chọn. `api/status.js` trả `providers` (không lộ key). Test: `scripts/test-openrouter.js` 15/15, `scripts/test-providers.js` 10/10. Hướng dẫn: `docs/AI-PROVIDERS.md`.
