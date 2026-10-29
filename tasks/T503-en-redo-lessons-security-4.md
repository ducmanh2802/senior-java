# T503 — Dịch lại (nội dung đã sửa): lessons-security-4 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-security-4.en.js` đã cũ: **lesson-security-004, lesson-security-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-security-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-security-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated both entries (`lesson-security-004`, `lesson-security-005`) from the current `js/data/lessons-security.js`, same keys and same field set as sibling chunks (title, goals, body, exercises[title/prompt/hints/explain], check[q/options/answer/explain]); no starter/tests/reference code copied.
- Header comment updated to note the T503 re-sync. Reworded for the target reader (explained sid, TTL, load balancer, Tomcat, Redis, SecurityContext, XSS, BREACH, Same-Origin Policy, constant time, EnumMap/EnumSet, privilege escalation on first use).
- Hint/check array lengths kept equal to the Vietnamese source so the i18n deep merge does not leave Vietnamese strings behind; answer indices unchanged.
- `node scripts/check-i18n.js lessons-security-4` → OK (2 mục). `node scripts/validate.js` → OK — không có lỗi. No git commit.
Reviewed-by: check-i18n (translation, no LLM review)
