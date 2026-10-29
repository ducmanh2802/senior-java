# T419 — Dịch sang tiếng Anh: quiz-java (23 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-core-007, qz-core-008, qz-core-009, qz-core-010, qz-core-011, qz-core-012, qz-core-013, qz-core-014, qz-core-015, qz-core-016, qz-core-017, qz-core-018, qz-core-019, qz-core-020, qz-collections-007, qz-collections-008, qz-collections-009, qz-collections-010, qz-collections-011, qz-collections-012, qz-collections-013, qz-collections-014, qz-collections-015**.

Viết vào `js/i18n/quiz-java-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-1.en.js` và `node scripts/check-i18n.js quiz-java-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 23/23 mục (14 `qz-core-007…020`, 9 `qz-collections-007…015`) vào `js/i18n/quiz-java-1.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain`.
- Giữ nguyên markup và khối code; chỉ dịch comment tiếng Việt trong code (`// drop the smallest element`, comment ở sơ đồ ASCII của `qz-core-009`, `(hundreds of MB)` trong `qz-core-016`). Số fence `~~~` khớp bản gốc: 38 (19 block).
- Nhãn cố định: `**Tóm tắt:**` không có trong nhóm này; `> Senior tip:` giữ nguyên; `### Vì sao đúng` → `### Why it is correct`; `### Vì sao các phương án còn lại sai` → `### Why the other options are wrong`.
- Thuật ngữ giữ nguyên tiếng Anh: HashMap, HashSet, TreeSet, EnumMap, LinkedHashMap, String pool, fail-fast, PECS, defensive copy, ordinal, accessOrder…, kèm giải thích ngay trong câu khi là khái niệm ít gặp (this$0, humongous object, circular buffer, heavy hitters).
- Kiểm tra: `node scripts/check-i18n.js quiz-java-1` → `OK — 23 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý: lệnh `node --check <file>` bị lớp phân quyền shell của phiên chặn (mọi biến thể đều bị từ chối), nên việc parse được xác nhận gián tiếp qua `check-i18n.js` — script này `vm.runInNewContext` toàn bộ file (parse + thực thi, sẽ ném lỗi nếu sai cú pháp hoặc có `${`/backtick).
- Không sửa file ngoài phạm vi sở hữu; không commit.
Reviewed-by: check-i18n (translation, no LLM review)
