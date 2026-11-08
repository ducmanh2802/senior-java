# T1234 — Dịch lại (nội dung đã sửa): quiz-ops-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-ops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-ops-4.en.js` đã cũ: **qz-devops-050**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-ops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-ops-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-ops-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `qz-devops-050` in `js/i18n/quiz-ops-4.en.js` to match the current, more detailed Vietnamese source in `js/data/quiz-ops.js` (Terraform plan replace/AWS RDS {{engine_version}} scenario). Kept the same key and fields (`q`, `options`, `explain`); preserved code/identifiers ({{terraform plan}}, {{engine_version}}, {{aws_db_instance.orders}}, {{-/+}}, etc.) and followed markup rules (no backticks, no `${`).
- `node --check js/i18n/quiz-ops-4.en.js` → OK.
- `node scripts/check-i18n.js quiz-ops-4` → `OK — 28 mục đã dịch.`
- `node scripts/validate.js` reports pre-existing errors unrelated to `quiz-ops`/`qz-devops-050` (missing `api-*` question IDs referenced by lessons/projects/path, plus a path warning for `lesson-design-006/007`). No changes made outside the owned file.
Reviewed-by: check-i18n (translation, no LLM review)
