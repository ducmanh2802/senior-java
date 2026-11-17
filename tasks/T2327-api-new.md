# T2327 — 5 câu phỏng vấn API design mới

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2243

Thêm 5 câu: thiết kế API bất đồng bộ (202 Accepted + polling/webhook), webhook an toàn (chữ ký HMAC, retry, replay), API gateway rate limit theo client (token bucket), backward compatibility khi đổi response, OpenAPI contract-first với Spring Boot. Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/q-api.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Id trước: api-001..api-066 (66 câu). Id sau: api-001..api-071 (71 câu). Thêm đúng 5 câu mới, không sửa/xoá mục cũ.
- Câu mới (đều senior/lead, ~5600–6250 ký tự, đủ RST: Ví dụ đời thực / Trả lời mẫu / Senior tip):
  - api-067 senior — API async job theo lô (202 + status resource + cancel + Idempotency-Key), có ~~~seq.
  - api-068 senior — Gửi webhook an toàn: SSRF + HMAC chữ ký + chống replay + retry/backoff.
  - api-069 senior — Rate limit theo client tại API gateway (Spring Cloud Gateway + Redis + 429).
  - api-070 lead — Migrate định dạng lỗi (code,message) → RFC 9457 problem+json.
  - api-071 senior — Contract-first OpenAPI đa ngôn ngữ + CI gate (oasdiff).
- Append bằng `node scripts/qtool.js append` (tự verify 66 object cũ không đổi). Không backtick, không `${` trong mọi `a`.
- `node --check js/data/q-api.js` → OK; `node scripts/qtool.js check js/data/q-api.js` → OK; đã chạy `node scripts/build-light-index.js` (viết lại js/data/index-light.js).
- `node scripts/validate.js`: KHÔNG còn lỗi/cảnh báo nào thuộc q-api.js (grep xác nhận NO_Q_API_ISSUES). Các lỗi còn lại thuộc file của agent khác (sdlc.js, quiz-design.js, quiz-ops.js, path.js) — không phải file sở hữu.
- Không commit (integrator review + commit).
