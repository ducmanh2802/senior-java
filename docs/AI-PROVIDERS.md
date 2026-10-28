# AI providers (chấm bài, phỏng vấn AI)

Server (`api/_claude.js`) gọi lần lượt các nhà cung cấp có free tier, theo chuẩn chat completions tương thích OpenAI.
Một provider chỉ được bật khi có đủ **key + model**. Khi một bên trả 429, hết hạn mức, lỗi 5xx, hết giờ hoặc JSON hỏng, server tự chuyển sang bên khác:
- Mỗi request thử tối đa 3 bên.
- Bên bị giới hạn sẽ tạm nghỉ: 60 giây nếu giới hạn theo phút, đến giờ reset (hoặc 1 giờ) nếu hết hạn mức ngày.
- Các request liên tiếp bắt đầu ở các bên khác nhau để rải tải.

| Provider | Biến môi trường trên Vercel | Lấy key | Cần thẻ? |
|---|---|---|---|
| Groq | `GROQ_API_KEY`, `GROQ_MODEL` | https://console.groq.com/keys | Không |
| Google Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` | https://aistudio.google.com/apikey | Không |
| GitHub Models | `GITHUB_MODELS_TOKEN` (fine-grained token, quyền Models: Read), `GITHUB_MODEL` | https://github.com/settings/personal-access-tokens | Không |
| OpenRouter | `OPENROUTER_API_KEY`, `AI_MODELS` (danh sách phân tách dấu phẩy, model `:free`) hoặc `AI_MODEL` (mặc định `openrouter/free`) | https://openrouter.ai/settings/keys | Không (model free) |
| Cerebras | `CEREBRAS_API_KEY`, `CEREBRAS_MODEL` | https://cloud.cerebras.ai | Có thể yêu cầu |
| Mistral | `MISTRAL_API_KEY`, `MISTRAL_MODEL` | https://console.mistral.ai/api-keys | Có thể yêu cầu |

Các biến tuỳ chọn:
- `AI_PROVIDERS`: thứ tự ưu tiên, ví dụ `groq,gemini,openrouter`. Không đặt thì dùng thứ tự trong bảng.
- `AI_MAX_TOKENS`: trần `max_tokens` cho provider khác OpenRouter (mặc định 8000).

Lưu ý:
- Tên model lấy đúng như trong trang models của từng bên (Groq: console.groq.com/docs/models; Gemini: ai.google.dev/gemini-api/docs/models). Model sai sẽ trả 400/404 và server tự chuyển bên khác.
- Hạn mức free của mỗi bên thay đổi theo thời gian, nên xem trên trang của từng bên.
- **Không dùng chung tài khoản OpenRouter với agent chạy trên máy**: hạn mức free tính theo tài khoản, không theo key.
- Sửa env xong phải **Redeploy** thì mới có hiệu lực. Kiểm tra bằng `POST /api/status`: field `providers` liệt kê các bên đang bật (không bao giờ trả key).
- Test không cần mạng: `node scripts/test-openrouter.js`, `node scripts/test-providers.js`.
