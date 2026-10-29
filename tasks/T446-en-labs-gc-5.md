# T446 — Dịch sang tiếng Anh: labs-gc (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-gc-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-gc.js`: **lab-gc-005, lab-gc-006**.

Viết vào `js/i18n/labs-gc-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-gc-5.en.js` và `node scripts/check-i18n.js labs-gc-5` → OK, rồi `Status: DONE`.

## Notes

- `js/i18n/labs-gc-5.en.js` trước đó tồn tại nhưng chỉ là stub rỗng (lần chạy trước bị gián đoạn); đã viết lại đầy đủ.
- Dịch `lab-gc-005`, `lab-gc-006`, chỉ các field title / scenario / questions / hints / answer / rubric; artifacts (gc log, jstat, diff code) không chép, chỉ phần translate giữ nguyên.
- Giữ nguyên mọi markup (`**`, `{{}}`, `###`, bảng, `~~~java` … `~~~`); comment tiếng Việt trong code block đã dịch, code/định danh/số liệu giữ nguyên. Nhãn "**Summary:**" và "> Senior tip:" theo quy ước.
- Kiểm tra: `node scripts/check-i18n.js labs-gc-5` → OK — 2 mục đã dịch (script này parse và chạy file qua `vm`, nên cũng xác nhận cú pháp hợp lệ). `node scripts/validate.js` → OK — không có lỗi.
- `node --check js/i18n/labs-gc-5.en.js` và `node -e …` bị môi trường chặn (deny rule của shell tool), không chạy được trực tiếp; cú pháp đã được xác nhận gián tiếp qua `scripts/check-i18n.js` như trên.
Reviewed-by: check-i18n (translation, no LLM review)
