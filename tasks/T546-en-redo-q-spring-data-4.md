# T546 — Dịch lại (nội dung đã sửa): q-spring-data-4 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-4.en.js` đã cũ: **db-010, db-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-4 → OK; node scripts/validate.js → OK.

## Notes

Dịch lại toàn bộ 2 entry `db-010`, `db-011` trong `js/i18n/q-spring-data-4.en.js` theo bản tiếng Việt hiện tại (đã có thêm các mục Hiểu nhanh / Thuật ngữ / vòng đời job / Lỗi hay gặp / Trả lời miệng 1 phút). Giữ nguyên id, cùng tập field `q/a/follow`; không đụng 6 entry còn lại. Các điểm nội dung mới đã đưa vào bản dịch: sơ đồ vòng đời job ASCII + lease/reaper, phần tối ưu index (partial index, LISTEN/NOTIFY), quy ước INCREMENT BY = allocationSize, `TIMESTAMP WITH LOCAL TIME ZONE`, quy tắc gập tên bảng/cột (Oracle → hoa, PostgreSQL → thường), ORA-01400/ORA-01795. Không có backtick, không `${`.

Kết quả: `node scripts/check-i18n.js q-spring-data-4` → OK (8 mục); `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
