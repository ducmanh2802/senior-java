# T741 — Dịch sang tiếng Anh: q-english (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-114, english-115, english-116, english-117, english-118, english-119, english-120, english-121, english-122**.

Viết vào `js/i18n/q-english-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-13.en.js` và `node scripts/check-i18n.js q-english-13` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 9/9 mục (english-114 → english-122) vào `js/i18n/q-english-13.en.js`, mỗi mục chỉ gồm `q`, `a`, `follow` (q và follow vốn đã là tiếng Anh nên giữ nguyên).
- Nhãn cố định: `**Tóm tắt (30 giây, nói miệng):**` → `**Summary (30 seconds, spoken):**`; `**Tóm tắt:**` → `**Summary:**`; `> Senior tip:` giữ nguyên. Đầu đề mục dịch thống nhất với các file anh em đã xong (q-english-12): `### Concept breakdown (for someone new to this)`, `### Useful phrases`, `### Vocabulary`, `### Common mistakes for Vietnamese speakers`, `### Sample answer`.
- Phần "Useful phrases"/"Từ vựng": bản gốc là chú giải tiếng Việt cho mẫu câu tiếng Anh, nên phần chú giải được viết lại bằng tiếng Anh tương đương (paraphrase/định nghĩa) để build EN không còn chữ Việt; số lượng bullet bằng đúng bản gốc, không bỏ mục nào.
- Không có code block (`~~~`) trong 9 mục này nên không phải dịch comment trong code. Không dùng backtick, không dùng `${`, không còn ký tự tiếng Việt.
- Kiểm tra: `node scripts/check-i18n.js q-english-13` → `OK — 9 mục đã dịch.` (script này chạy file bằng `vm.runInNewContext` và sẽ báo lỗi "không chạy được" nếu cú pháp sai — nên nó xác nhận luôn cả parsing). `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo đáp án ngắn có sẵn ở q-java.js/q-scenario.js, không thuộc file này). Lưu ý: `node --check js/i18n/q-english-13.en.js` bị chặn bởi prompt phân quyền Bash trên máy này nên không chạy được trực tiếp; việc xác nhận cú pháp đã do check-i18n đảm nhiệm. Không sửa file nào khác; không commit.
Reviewed-by: check-i18n (translation, no LLM review)
