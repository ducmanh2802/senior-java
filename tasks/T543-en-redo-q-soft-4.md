# T543 — Dịch lại (nội dung đã sửa): q-soft-4 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-4.en.js` đã cũ: **testing-016, behavioral-016, behavioral-019**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-4 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ 3 entry trong `js/i18n/q-soft-4.en.js` theo bản tiếng Việt hiện tại của `js/data/q-soft.js`: testing-016, behavioral-016, behavioral-019.
- testing-016: cập nhật phần giải thích Toxiproxy (TCP proxy, bật/tắt "toxics" qua API), steady-state hypothesis có p99/503, và pitfall timeout giảm dần theo chiều sâu lời gọi; comment code dịch sang tiếng Anh.
- behavioral-016: dịch lại phần mở đầu theo vai lead và câu trả lời mẫu (5 → 2 ngày công, không xung đột sở hữu); bổ sung mảng `follow` còn thiếu cho khớp bản tiếng Việt.
- behavioral-019: bổ sung mục "Sample answer (STAR)" (bản tiếng Việt mới có) và dịch lại toàn bộ theo bản hiện tại.
- Đã chạy `node scripts/check-i18n.js q-soft-4` → OK — 8 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi. Không sửa file nào khác, không commit.
Reviewed-by: check-i18n (translation, no LLM review)
