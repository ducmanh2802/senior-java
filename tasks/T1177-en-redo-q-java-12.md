# T1177 — Dịch lại (nội dung đã sửa): q-java-12 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-12.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-12.en.js` đã cũ: **core-014, collections-027, collections-028, modern-025, modern-026, modern-027, core-032, core-033, collections-030**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-12.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-12 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated 9 entries from current VI in `js/data/q-java.js`: `core-014, collections-027, collections-028, modern-025, modern-026, modern-027, core-032, core-033, collections-030`. Kept keys/fields consistent; untouched other entries in the file.
- Translated code comments/strings to English; preserved code/ids/markup (`{{}}`, `~~~`, no backticks, no `${` in templates). Added term explanations for ~4-year readers (autoboxing, GC/JIT, HashMap/bucket, thread-safety/eviction/TTL, sealed/record/ADT, JPA/Hibernate/ORM/lazy/proxy, generics/type erasure/wildcard, Comparator/TreeMap/TimSort).
- Verification: `node --check js/i18n/q-java-12.en.js` OK; `node scripts/check-i18n.js q-java-12` → `OK — 13 mục đã dịch`.
- `node scripts/validate.js` reports 31 pre-existing LỖI and 2 Cảnh báo in files outside this task's ownership (`lessons-sql.js, lessons-api.js, projects.js, path.js` broken `api-*` related refs; `q-java.js:modern-033` short answer; path lessons) — present before this change; I did not modify them (AGENTS.md rule 3). No new errors introduced by this edit.
Reviewed-by: check-i18n (translation, no LLM review)
