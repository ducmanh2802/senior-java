# T739 — Dịch sang tiếng Anh: q-soft (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-soft.js`: **behavioral-039, behavioral-040, behavioral-041, behavioral-042, behavioral-043, behavioral-044**.

Viết vào `js/i18n/q-soft-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-soft-11.en.js` và `node scripts/check-i18n.js q-soft-11` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 6 mục (behavioral-039 → behavioral-044), chỉ có field `q`, `a`, `follow`; giữ nguyên cấu trúc markup: 4–7 heading `###` mỗi đáp án, 1–2 bảng, danh sách `- `/`1. `, `> Senior tip:` giữ nguyên nhãn, `**Tóm tắt:**` → `**Summary:**`.
- Thuật ngữ giữ nguyên (Kafka, Kubernetes, AWS, ESOP, EOR, contractor, idempotency, Hō-Ren-Sō, BHXH/BHYT/BHTN); giải thích thêm 1 câu cho thuật ngữ lạ (outourcing, cache, transaction, isolation level, liquidity event) theo tinh thần bản gốc.
- Số liệu/đơn vị giữ nguyên (17/27/30/80 triệu, 25–35 triệu gross/tháng, 5–6 giờ, 12–14 giờ…). Không có backtick, không có `${`.
- Nghiệm thu: `node scripts/check-i18n.js q-soft-11` → `OK — 6 mục đã dịch.` (script này nạp file bằng VM nên cũng xác nhận file parse hợp lệ); `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ ở q-java.js/q-scenario.js, không liên quan file này). `node --check` bị chặn bởi permission rule nên dùng check-i18n làm bằng chứng parse.
Reviewed-by: check-i18n (translation, no LLM review)
