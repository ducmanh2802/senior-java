# T745 — Dịch sang tiếng Anh: q-autotest (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-autotest-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-autotest.js`: **autotest-018, autotest-019, autotest-020, autotest-021, autotest-022, autotest-023, autotest-024, autotest-025, autotest-026, autotest-027, autotest-028, autotest-029**.

Viết vào `js/i18n/q-autotest-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-autotest-3.en.js` và `node scripts/check-i18n.js q-autotest-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 12/12 mục (autotest-018 → autotest-029), mỗi mục gồm `q`, `a`, `follow`. Không có field nào khác, không chép `refs`.
- `node scripts/check-i18n.js q-autotest-3` → `OK — 12 mục đã dịch.`
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn các cảnh báo đáp án ngắn có sẵn từ trước trong `q-java.js` / `q-scenario.js`, không liên quan file này).
- File parse được bằng `vm.runInNewContext` trong check-i18n (không báo lỗi cú pháp). Không thể chạy `node --check <file>` vì lệnh đó bị chặn theo permission của phiên này; check-i18n đã parse toàn bộ file nên tương đương.
- Đã đối chiếu độ trung thực bản dịch bằng script tạm (số heading `###`, số bullet, số bảng, số code fence, số follow, `**Summary:**`, `> Senior tip:` của từng mục) — khớp 12/12; độ dài bản EN bằng 113–131% bản VI (tiếng Anh dài hơn là bình thường), không tóm tắt hay bỏ đoạn.
- Bản gốc có vài chỗ lỗi text (do AI viết lần trước): "test chập ch fluctuate", "cuar ra suite", "h übernahm 80%", "equipo dành giờ debug", "phản hồi contrôled", "handful số lượng ca critical", "tại là bắt buộc". Đã suy ra ý đúng và dịch ý đó, không sao chép lỗi.
- autotest-023: code block Java chứa chuỗi tiếng Việt `assertEquals("ĐANG_GIAO", …)`. `check-i18n.js` bắt buộc code block không còn dấu tiếng Việt nên đã đổi thành `assertEquals("SHIPPING", …)` (đúng ý "đơn đang giao"). **Đề xuất (không tự sửa vì không sở hữu file):** người tích hợp cân nhắc dùng giá trị enum ASCII `SHIPPING` ngay trong `js/data/q-autotest.js` để bản VI và EN nhất quán.
- autotest-026: giữ nguyên `$(pwd)` trong code block bash (không phải `${`), và giữ dấu `\` cuối dòng giống bản gốc — trong template literal nó là line-continuation nên 2 dòng lệnh gộp làm một, cùng hành vi với bản VI.
- Còn một file tạm của phiên này không tự xoá được vì mọi lệnh `rm`/`mv` đều bị chặn theo permission: `scripts/tmp-t745-check.js` (script đối chiếu độ dài/kết cấu ở trên). **Người tích hợp vui lòng xoá giúp file này** và không commit nó.
Reviewed-by: check-i18n (translation, no LLM review)
