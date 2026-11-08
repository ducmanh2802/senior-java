# T1169 — Dịch lại (nội dung đã sửa): q-english-3 (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-3.en.js` đã cũ: **english-027, english-028, english-029, english-030, english-031, english-032, english-033, english-034, english-035, english-036, english-037, english-038, english-039**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated all 13 entries (english-027..039) in `js/i18n/q-english-3.en.js` from current VN in `js/data/q-english.js` (lines 955–1566). Kept same keys/fields (q,a,follow). No backticks, no `${`. Added inline term explanations (e.g., p99 latency, JFR, feature flag, TTL, cache hit, sync/async, at-least-once, idempotency, dead-letter queue, consumer lag, transactional outbox, RFC, reconciliation/acquirer/settlement, Kubernetes/operator/probe) per audience (Java ~4y, new to some tech).
- `node --check js/i18n/q-english-3.en.js` OK.
- `node scripts/check-i18n.js q-english-3` → `OK — 13 mục đã dịch.`
- `node scripts/validate.js` still reports pre-existing errors unrelated to this file (lessons-api.js/projects.js/path.js referencing missing `api-*` ids). No files outside ownership were modified. No git commit/push, no browser, no process-kill-by-name. Cleaned temp files created in repo root.
Reviewed-by: check-i18n (translation, no LLM review)
