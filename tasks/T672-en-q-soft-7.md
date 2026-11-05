# T672 — Dịch sang tiếng Anh: q-soft (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-soft.js`: **behavioral-021, behavioral-022, behavioral-023, behavioral-024, behavioral-025, behavioral-026, behavioral-027, behavioral-028, behavioral-029, behavioral-030**.

Viết vào `js/i18n/q-soft-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-soft-7.en.js` và `node scripts/check-i18n.js q-soft-7` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 10 mục `behavioral-021` → `behavioral-030` vào `js/i18n/q-soft-7.en.js` (chỉ field `q`, `a`, `follow`).
- Giữ nguyên cấu trúc markup: bảng, `###`, blockquote mẫu hội thoại/đáp án, `~~~java` / `~~~text`; comment tiếng Việt trong code block đã dịch sang Anh, code giữ nguyên.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên; thuật ngữ (ZGC, G1, outbox, idempotency key, Testcontainers, ProblemDetail, ADR…) giữ nguyên; README mẫu trong behavioral-027 sao chép y nguyên vì bản gốc đã tiếng Anh.
- Không có backtick, không có `${`, không còn ký tự tiếng Việt trong phần dịch.
- Verify: `node scripts/check-i18n.js q-soft-7` → `OK — 10 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo PATH bài học có từ trước, không liên quan). File parse được (check-i18n chạy qua vm), nên `node --check` cũng đạt — lệnh `node --check` bị chặn bởi permission nên không chạy trực tiếp.
- Chỉ sửa `js/i18n/q-soft-7.en.js` và file task này. Không commit.
Reviewed-by: check-i18n (translation, no LLM review)
