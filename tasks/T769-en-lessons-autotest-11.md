# T769 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-013**.

Viết vào `js/i18n/lessons-autotest-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-11.en.js` và `node scripts/check-i18n.js lessons-autotest-11` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ `lesson-autotest-013` sang `js/i18n/lessons-autotest-11.en.js` (file trước đó chỉ là stub rỗng): title, goals (5), body (toàn bộ 10 mục + 2 bảng + 3 code block + 1 seq + Senior tip), exercises[0] (title/prompt/hints 6/explain 4 đoạn), check (4 câu: q/options/explain — không chép answer vì là index).
- Không chép `starter`/`tests`/`reference` (đúng yêu cầu check-i18n). Comment và chú thích ASCII-Vietnamese trong code block + sơ đồ đã dịch sang tiếng Anh; code giữ nguyên, kể cả escape `\\"` như bản gốc.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview connections`, `> Senior tip:` giữ nguyên.
- `node scripts/check-i18n.js lessons-autotest-11` → `OK — 1 mục đã dịch.` (vm chạy file thành công = cú pháp hợp lệ; dạng `node --check` bị chặn bởi permission shell trên máy này nên không chạy được).
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ cảnh báo đáp án ngắn có sẵn từ trước trong q-java.js/q-scenario.js, không liên quan file này). Không sửa file dữ liệu nên không cần build-light-index.
Reviewed-by: check-i18n (translation, no LLM review)
