# T535 — Dịch lại (nội dung đã sửa): q-microservices-2 (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-2.en.js` đã cũ: **microservices-011, microservices-012, microservices-013, microservices-014, microservices-015, microservices-016, microservices-017, microservices-018, microservices-019, microservices-020**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-2 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 10 entry (microservices-011 → 020) từ bản tiếng Việt hiện tại trong `js/data/q-microservices.js`; giữ nguyên key, chỉ dùng field `q`/`a`/`follow` như các entry còn lại trong file.
- Bản dịch bám đủ cấu trúc mới: Tóm tắt → Quick understanding → Terminology → cơ chế từng bước → bảng/bullets trade-off → Common pitfalls → 1-minute interview answer → Senior tip, gồm cả code/yaml/sql/text block và các con số (43 phút error budget, burn rate 14,4, công thức 50×4×6 = 1.200 series…). Comment trong code mẫu đã dịch sang tiếng Anh; `\${HOSTNAME}` giữ escape đúng template literal.
- Không backtick, không `${` chưa escape (đã kiểm bằng grep), không còn ký tự tiếng Việt ngoài code block.
- Kiểm tra: `node scripts/check-i18n.js q-microservices-2` → OK (10 mục); `node scripts/validate.js` → OK — không có lỗi.
- Lưu ý: khi thay nội dung file, một lần ghi thử đã làm rỗng file nhưng đã ghi lại đầy đủ ngay sau đó; không có thay đổi nào ngoài `js/i18n/q-microservices-2.en.js` và file task này.
Reviewed-by: check-i18n (translation, no LLM review)
