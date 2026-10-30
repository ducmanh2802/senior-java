# T548 — Dịch lại (nội dung đã sửa): q-spring-data-7 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-7.en.js` đã cũ: **db-016, db-017, db-018, db-019**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-7 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ 4 entry db-016, db-017, db-018, db-019 theo bản tiếng Việt hiện tại, bổ sung các mục mà bản cũ thiếu: Quick intuition (Hiểu nhanh), Key terms (Thuật ngữ), các khối "từng bước" (đường đi giao dịch chuyển tiền / thứ tự chạy của SQL / đánh giá đề xuất procedure / khôi phục sau DELETE sai), Common mistakes (Lỗi hay gặp) và One-minute spoken answer (Trả lời miệng 1 phút).
- db-016: cập nhật bullet replay bị chặn bởi query dài (max_standby_streaming_delay, hot_standby_feedback) và thêm mục common mistakes về readOnly trong transaction ghi.
- Giữ nguyên key, tập field (q/a/follow); code mẫu giữ nguyên nội dung, chỉ dịch comment/chuỗi tiếng Việt trong code sang tiếng Anh (kể cả sơ đồ ASCII và bảng ví dụ ROWS/RANGE).
- Các entry spring-022…spring-026 giữ nguyên không đổi.
- Chỉ sửa `js/i18n/q-spring-data-7.en.js` và file task này.
- `node scripts/check-i18n.js q-spring-data-7` → OK (9 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
