# T736 — Dịch sang tiếng Anh: q-devops (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-14.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-074, devops-075, devops-076, devops-077, devops-078**.

Viết vào `js/i18n/q-devops-14.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-14.en.js` và `node scripts/check-i18n.js q-devops-14` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 5 mục (devops-074..078) vào `js/i18n/q-devops-14.en.js`, mỗi mục chỉ các field `q`, `a`, `follow`.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, bảng `|`, `~~~text/bash/seq` … `~~~`); trong code block chỉ dịch comment (bash, text, seq). Actor nhất quán trong seq: `Node-3 (faulty)`, `K8s API`, `DB (shared)`, `CoreDB (on-prem)`…
- `~~~seq` phải parse bằng `js/core/diagram.js`: `note Loan (AWS),CoreDB (on-prem): chatty + VPN = latency multiplies` giữ cấu trúc note multi-actor của bản gốc.
- Vẽ lại ASCII diagram ở devops-075 (`~~~text`) với nhãn tiếng Anh; các dòng `\\` được escape thành single backslash trong template literal như bản gốc.
- Thuật ngữ giữ nguyên: CrashLoopBackOff, DiskPressure/PIDPressure, cgroup, hostPath, toleration, OOMKilled, p95/p99, SLO/SLI, IRSA, HikariCP, Direct Connect, MTU, keep-alive, VPC Endpoint…
- Nhãn cố định: `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, "### Trả lời phỏng vấn" → "### Interview answer", "### Pitfall (lỗi hay gặp)" → "### Pitfalls (common mistakes)".
- Bỏ một gloss Việt còn sót "(tuân thủ)" trong devops-075 terms — validator check-i18n không bắt (regex 2-lớp), nhưng vẫn phải xóa để đúng yêu cầu.
- `node --check` bị chặn permission ở CLI này; thay vào đó `node scripts/check-i18n.js q-devops-14` chạy file qua `vm.runInNewContext` → parse thành công (không có lỗi "không chạy được") ⇒ syntax OK.
- `node scripts/validate.js` → OK — không có lỗi (chỉ warning trên q-java/q-scenario không liên quan).
Reviewed-by: check-i18n (translation, no LLM review)
