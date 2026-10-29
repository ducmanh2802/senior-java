# T519 — Dịch lại (nội dung đã sửa): q-devops-1 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-devops-1.en.js` đã cũ: **devops-001, devops-002, devops-003, devops-004, devops-005, devops-006, devops-007, devops-008, devops-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-devops-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-devops-1 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ 9 entry devops-001..009 trong `js/i18n/q-devops-1.en.js` từ bản tiếng Việt hiện tại, giữ key và chỉ dùng field `q`/`a`/`follow`.
- Bản tiếng Việt đã thêm các mục mới (`Hiểu nhanh`, `Thuật ngữ`, `Trả lời miệng 1 phút`, `Lỗi hay gặp` dạng đánh số, bullet mới về ingress-nginx ngừng bảo trì 3/2026, NMT + heap dump trống ở devops-002); bản dịch bám đủ các mục này.
- Dịch cả chú thích tiếng Việt trong code block sang tiếng Anh; giữ nguyên code, id, cấu trúc markup, bảng, sơ đồ ASCII (escape `\\` đúng để render `\`).
- `node scripts/check-i18n.js q-devops-1` → OK (9 mục); `node scripts/validate.js` → OK. Không sửa file nào khác, không commit.
Reviewed-by: check-i18n (translation, no LLM review)
