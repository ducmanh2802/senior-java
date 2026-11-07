# T661 — Dịch sang tiếng Anh: q-banking (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-banking.js`: **banking-001, banking-002, banking-003, banking-004, banking-005, banking-006, banking-007, banking-008**.

Viết vào `js/i18n/q-banking-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-banking-1.en.js` và `node scripts/check-i18n.js q-banking-1` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 8 mục banking-001..008 vào `js/i18n/q-banking-1.en.js` (chỉ field `q`, `a`, `follow`; giữ nguyên cấu trúc markup, các block `~~~seq`, bảng, list, `> Senior tip:`, `### ...`).
- `node scripts/check-i18n.js q-banking-1` → `OK — 8 mục đã dịch.` (id nằm trong header, không còn chữ Việt có dấu kể cả trong code block, không backtick, không chép code/artifact).
- `node --check` bị chặn theo allowlist của agent, nên đã xác thực cú pháp bằng `node scripts/check-i18n.js q-banking-1` (script này nạp file trong `vm` — file không parse được sẽ báo lỗi ngay) và bằng một script tạm `scripts/tmp-t661-seqcheck.js` để chạy `Diagram.parseSeq` trên cả 8 block `~~~seq` (kết quả: all OK, 3–5 actors, 4–11 steps). Xin integrator xoá giúp file tạm đó (`rm` bị chặn quyền).
- `~~~seq`: actor/step đã dịch sang tiếng Anh, vẫn giữ đúng 2–6 actor và cú pháp `A -> B:` / `-->` để `Diagram.parseSeq` render được.
- `~~~java` (banking-003): giữ nguyên code, chỉ dịch comment.
- `node scripts/validate.js` vẫn báo 2 LỖI **không thuộc task này**, ở file tôi không sở hữu:
  `lessons-autotest.js: lesson-autotest-010.body: inline code {{qa-{{threadName…}} / {{post { always { archiveArtifac…}} chứa dấu { } lồng nhau`.
  File `js/data/lessons-autotest.js` đang bị sửa dở bởi task khác trong working tree (xem `git status`). Đề xuất integrator sửa bằng cách bỏ `{{…}}` lồng nhau (đoạn Jenkins pipeline nên để trong `~~~groovy`/`~~~text`), hoặc task sở hữu `lessons-autotest.js` tự sửa. validate.js không quét `js/i18n/*` nên không liên quan cổng của T661.
Reviewed-by: check-i18n (translation, no LLM review)
