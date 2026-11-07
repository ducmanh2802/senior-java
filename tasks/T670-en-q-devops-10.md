# T670 — Dịch sang tiếng Anh: q-devops (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-053, devops-054, devops-055**.

Viết vào `js/i18n/q-devops-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-10.en.js` và `node scripts/check-i18n.js q-devops-10` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 3 mục devops-053/054/055 (q, a, follow) vào `js/i18n/q-devops-10.en.js`; file chỉ có khung rỗng từ lần chạy trước nên viết mới toàn bộ.
- Cấu trúc giữ nguyên 1-1 với bản gốc: 19 heading `###`, 18 dòng fence `~~~` (6 file 053, 10 file 054 gồm 1 `~~~seq`, 2 file 055), 36 dòng bảng `|`. Dịch cả comment tiếng Việt bên trong code block (yaml/text/seq) vì `check-i18n.js` soi cả phần đó.
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, `### Bẫy thực tế` → `### Real-world traps`, `### Thuật ngữ nền` → `### Background terms`, `### Ví dụ đời thường` → `### An everyday analogy` (nhất quán với q-devops-9).
- `node scripts/check-i18n.js q-devops-10` → "OK — 3 mục đã dịch."; `node scripts/validate.js` → "OK — không có lỗi." (không đổi js/data nên không cần build-light-index). `node scripts/stale-i18n.js` exit 0.
- `node --check js/i18n/q-devops-10.en.js` bị cổng permission của CLI chặn (đã thử 3 biến thể lệnh), nên không chạy được trực tiếp; syntax đã được xác nhận gián tiếp vì check-i18n.js nạp file bằng `vm.runInNewContext` và báo OK (lỗi cú pháp sẽ in "không chạy được").
- `q-devops-10` đã có sẵn trong `js/i18n/manifest.js` nên không cần đăng ký thêm; không sửa file nào ngoài `js/i18n/q-devops-10.en.js` và file task này. Không commit.
Reviewed-by: check-i18n (translation, no LLM review)
