# T2310 — 6 câu phỏng vấn mới: tích hợp Claude vào hệ thống Java production

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T2232

Đọc AGENTS.md mục 4–6; `node scripts/qtool.js list js/data/q-claude.js` để không trùng ý.
Thêm 6 câu `claude-NNN` (topic `claude`, 2 mid / 3 senior / 1 lead), đúng chuẩn mục 6 (Tóm tắt, ### cơ chế, ví dụ Java ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự):
1. Gọi Claude API từ Spring Boot: timeout, retry 429/529 có backoff, circuit breaker, idempotency.
2. Streaming response tới client (SSE) qua backend Java mà không giữ thread lâu (virtual threads / WebFlux).
3. Giảm chi phí: prompt caching, batch API cho job không gấp, chọn model nhỏ hơn cho tác vụ đơn giản, đo usage.
4. Chống prompt injection khi đưa dữ liệu người dùng/tài liệu vào prompt và khi agent gọi tool có side effect.
5. Đánh giá chất lượng output trước khi release (bộ eval có nhãn, LLM-as-judge, regression khi đổi model).
6. (lead) Kiến trúc nền tảng AI dùng chung cho nhiều team: gateway, quota, audit log, PII masking, quan sát chi phí.
Không bịa tham số API/giá; chỗ không chắc viết ở mức nguyên lý. Có `~~~seq` cho luồng nhiều bên.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Đếm id trước/sau trong Notes (phải tăng đúng số đã thêm) — lần trước có task ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/q-claude.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- **File sở hữu:** `js/data/q-claude.js` (chỉ file này bị sửa; 589 insertions, 0 deletions — chỉ THÊM, không đụng claude-001..042).
- **Số câu trước/sau:** trước 42 câu (`claude-001`..`claude-042`), sau 48 câu. Đã thêm **đúng 6 câu mới**: `claude-043`..`claude-048`.
- **6 câu mới (topic `claude`, đúng chủ đề T2310, tỉ lệ 2 mid / 3 senior / 1 lead):**
  - `claude-043` (mid) — Gọi Claude API từ Spring Boot: timeout (connect 5s/read 60s), retry 429/5xx backoff+jitter, circuit breaker, idempotency key.
  - `claude-044` (mid) — Streaming SSE tới client không giữ thread lâu: WebFlux vs Spring MVC + virtual threads, tắt proxy buffering.
  - `claude-045` (senior) — Giảm chi phí: prompt caching, Batch API, token hygiene, chọn model nhỏ hơn, đo usage, chi phí/tác vụ.
  - `claude-046` (senior) — Chống prompt injection: 6 lớp (tool_result + JSON escape, system prompt policy, least privilege ở code, human-in-the-loop, sàng lọc Haiku, red-team CI).
  - `claude-047` (senior) — Đánh giá chất lượng trước release: success criteria, golden set, LLM-as-judge + calibration, regression theo slice, CI/shadow/A-B.
  - `claude-048` (lead) — Nền tảng AI dùng chung nhiều team: gateway (key/quota/audit/PII masking/cost observability), routing Bedrock/Vertex/Foundry, catalog, lộ trình; có sơ đồ `~~~seq`.
- **Sửa lỗi lần chạy trước bị gián đoạn (đã đọc lại, giữ nội dung tốt, chỉ sửa cú pháp):**
  - 6 template literal `a` của `claude-043`..`claude-048` bị **thiếu backtick đóng** (dòng Senior tip cuối mỗi đáp án) → thêm lại `` `, ``.
  - `claude-048` (dòng "Lưu 1 năm...") dùng backtick inline `` `team_id` ``… làm vỡ template literal → đổi sang `{{team_id}}`.
  - `claude-044` còn ký tự lạ tiếng Trung "切流量" → viết lại "load balancer phải chuyển hướng lưu lượng sang node khác".
  - `claude-048` sơ đồ `~~~seq`: dòng `Gateway <- Model:` dùng mũi tên sai và "Model" không có trong actors → đổi actors sang `Model`, sửa thành `Gateway -> Model` / `Model --> Gateway`.
  - `claude-043`/`claude-048`: inline code lồng `{ }` (`{{summarize:{ticketId}}}`, metric Prometheus `{{ai_cost_usd_total{...}}}`) → viết lại không còn ngoặc lồng.
- **Nghiệm thu:** `node --check js/data/q-claude.js` → OK. `node scripts/build-light-index.js` → ghi `js/data/index-light.js`. `node scripts/validate.js`: **q-claude.js sạch (0 lỗi)**.
- **LƯU Ý cho integrator:** `validate.js` hiện còn **4 lỗi ở file KHÔNG thuộc task này** (đang do agent/task khác sửa dở, working tree đã M trong git): `sdlc.js` (missing ) after argument list), `labs-thread.js` (lab-thread-007/008 sai dạng id), `lessons-claude.js` (lesson-claude-013 prompt lệch `{{`/`}}`). Theo luật 3 (không sửa file ngoài quyền sở hữu) tôi **không** tự sửa các file này. Bản HEAD của chúng đều OK → lỗi do thay đổi chưa commit của task khác, sẽ hết khi các task đó hoàn tất.
- Không chạy `git commit`/`git push`, không tạo branch.
