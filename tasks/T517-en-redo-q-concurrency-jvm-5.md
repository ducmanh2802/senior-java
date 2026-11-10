# T517 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-5 (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-5.en.js` đã cũ: **concurrency-024, concurrency-025, concurrency-026, concurrency-027, jvm-019, jvm-020, jvm-021**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-5 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 7 mục (concurrency-024..027, jvm-019..021) từ bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js`, thay entry cũ trong `js/i18n/q-concurrency-jvm-5.en.js`; giữ nguyên id, key và tập field `q`/`a`/`follow`.
- Bám đủ cấu trúc mới của bản Việt: Tóm tắt, Hiểu nhanh/Quick intuition, Thuật ngữ/Terms, các bước cơ chế kèm sơ đồ ASCII, bảng so sánh, Lỗi hay gặp/Common mistakes, Trả lời miệng/One-minute spoken answer, Senior tip.
- Code, id, số liệu giữ nguyên; toàn bộ chú thích và chuỗi tiếng Việt trong code mẫu (kể cả nhãn trong sơ đồ ASCII) đã dịch sang tiếng Anh. Không dùng backtick hay `${` bên trong nội dung.
- `node scripts/check-i18n.js q-concurrency-jvm-5` → OK (7 mục); `node scripts/validate.js` → OK — không có lỗi. Không sửa file nào ngoài file được sở hữu; không commit.
