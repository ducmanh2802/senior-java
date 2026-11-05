# T744 — Dịch sang tiếng Anh: q-autotest (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-autotest-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-autotest.js`: **autotest-009, autotest-010, autotest-011, autotest-012, autotest-013, autotest-014, autotest-015, autotest-016, autotest-017**.

Viết vào `js/i18n/q-autotest-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-autotest-2.en.js` và `node scripts/check-i18n.js q-autotest-2` → OK, rồi `Status: DONE`.

## Notes
- Dịch đủ 9/9 mục (autotest-009 → autotest-017), mỗi mục chỉ có field `q`, `a`, `follow`; `refs` và code (`starter/tests/...`) không chép vào overlay.
- Nghiệm thu: `node scripts/check-i18n.js q-autotest-2` → `OK — 9 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo đáp án ngắn còn lại thuộc q-java.js / q-scenario.js, không phải file này). `node --check` bị chặn theo allowlist của phiên nên dùng chính check-i18n (chạy file trong `vm`) để xác nhận file parse hợp lệ.
- Chuỗi tiếng Việt bên trong code block đã dịch sang Anh để qua cổng check-i18n: comment trong ~~~java/~~~yaml/~~~text, và cả kịch bản Gherkin + step definition trong autotest-012 (`@When("the customer applies the code {string}")` → method `applyVoucher`). Số liệu/đơn vị (1,000,000 VND), id, URL, cấu hình YAML giữ nguyên; markup (`**`, `{{code}}`, `###`, bảng, `>`, `~~~lang`) giữ đúng vị trí — đã đối chiếu số heading và số code block từng mục với bản gốc.
- autotest-016 bản gốc có cụm "đơm halts" (nghi là lỗi đánh máy của "đơ/hang"); dịch là "they block each other and the run hangs".
- Chỉ sửa `js/i18n/q-autotest-2.en.js` (đã có sẵn trong `js/i18n/manifest.js`, không cần đăng ký thêm) và file task này. Không commit.
Reviewed-by: check-i18n (translation, no LLM review)
