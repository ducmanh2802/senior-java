# T501 — Dịch lại (nội dung đã sửa): lessons-security-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-security-2.en.js` đã cũ: **lesson-security-002**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-security-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-security-2 → OK; node scripts/validate.js → OK.

## Notes

- Re-translated the whole `lesson-security-002` entry from the current `js/data/lessons-security.js` (review commit 07eabf1): body (verification steps 0–5 with leeway/iss/aud/nbf, Spring Boot `NimbusJwtDecoder` paragraph, rewritten alg-confusion trap, updated HS256/RS256 table, replay section), both exercises (prompt incl. the `~~~json` payload block, hints, explain) and the three check questions (with `answer` indices like sibling lesson files).
- Kept the same fields as other lesson overlays: no `starter`/`tests`/`reference`; ids unchanged; the Java comment inside the body code block translated.
- Added one-line glosses for jargon the target reader has not met yet (JWT, claims, HMAC, constant-time, clock skew, NTP, JWKS, IdP, opaque token, nonce, canonical string, TTL), per the "explain every term on first use" brief.
- Verified: `node scripts/check-i18n.js lessons-security-2` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- No other file touched; no commit made.
Reviewed-by: check-i18n (translation, no LLM review)
