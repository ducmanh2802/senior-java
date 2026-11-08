# T1035 — Dịch sang tiếng Anh: lessons-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-021**.

Viết vào `js/i18n/lessons-devops-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-13.en.js` và `node scripts/check-i18n.js lessons-devops-13` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-devops-021` ("Đo nền tảng như sản phẩm: tính 4 chỉ số DORA từ dữ liệu deploy và sự cố") to English in `js/i18n/lessons-devops-13.en.js` (App.i18n.content overlay). Covered fields: title, goals (4), body, exercises[0].title/prompt/hints/explain, check[0-2].q/options/explain (3 items). Markup preserved; code blocks kept as-is; fixed labels applied (Tóm tắt → Summary, Lưu ý khi phỏng vấn → Interview notes); no backticks/`${`.
- `node --check js/i18n/lessons-devops-13.en.js` — OK. `node scripts/check-i18n.js lessons-devops-13` — `OK — 1 mục đã dịch.`
- Full `node scripts/validate.js` currently fails on a pre-existing issue outside owned scope: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. Warnings (pre-existing): `modern-033` short answer, `PATH` missing `lesson-design-006/007`. Not modified (rule 3).
Reviewed-by: check-i18n (translation, no LLM review)
