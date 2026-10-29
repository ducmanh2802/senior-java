# T539 — Dịch lại (nội dung đã sửa): q-scenario-4 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-4.en.js` đã cũ: **scenario-052, scenario-053, scenario-054, scenario-056**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-4 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 4 entry `scenario-052`, `scenario-053`, `scenario-054`, `scenario-056` trong `js/i18n/q-scenario-4.en.js`, khớp bản tiếng Việt hiện tại:
  - 052: pitfall 1 viết lại theo ý mới (một cart là một key nằm trọn một slot; hash tag chỉ cần khi muốn gom nhiều key của cùng user; không dùng tag chung cho mọi user vì gây hotspot).
  - 053: bổ sung đoạn tombstone + code comment mới (consumer ghi tombstone `{version: 8}` TTL ngắn, loader chỉ SET khi version >= version trong key), nhấn mạnh `DEL` làm mất mốc so sánh.
  - 054: pitfall 3 viết lại (concurrency > số partition chỉ tạo consumer rảnh; đẩy record sang thread pool phá thứ tự trừ khi serialize theo key và commit offset sau khi các record trước xong).
  - 056: dịch lại theo bản tiếng Việt hiện tại, giữ nguyên bảng và kết luận.
- Giữ nguyên key, tập field `q`/`a`/`follow`; code mẫu và comment trong code dịch sang tiếng Anh; không backtick, không `${`; giải thích ngắn các thuật ngữ (partition, offset, tombstone, outbox, DLQ, escrow, epoch/fencing…) cho người đọc chưa quen.
- Chỉ sửa `js/i18n/q-scenario-4.en.js` (diff 4 dòng thay 4 dòng, không đụng mục khác).
- `node scripts/check-i18n.js q-scenario-4` → OK (13 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
