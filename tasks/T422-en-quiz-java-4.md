# T422 — Dịch sang tiếng Anh: quiz-java (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-jvm-019, qz-jvm-020**.

Viết vào `js/i18n/quiz-java-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-4.en.js` và `node scripts/check-i18n.js quiz-java-4` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 2 mục: qz-jvm-019 (6 options, multi, đáp án 0/1/4) và qz-jvm-020 (4 options, đáp án 3).
- Giữ nguyên markup, bảng, `~~~text` trong đề qz-jvm-020, các `{{...}}` (`-Xlog:safepoint`, `Reaching safepoint: …`, `jdk.SafepointBegin`…), nhãn "> Senior tip:".
- Giải thích giữ đúng độ chi tiết bản gốc (lý do đúng + lý do từng phương án sai), thuật ngữ kỹ thuật giữ nguyên tiếng Anh.
- `node scripts/check-i18n.js quiz-java-4` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Không sửa file nào khác; `quiz-java-4` đã có sẵn trong `js/i18n/manifest.js`.
Reviewed-by: check-i18n (translation, no LLM review)
