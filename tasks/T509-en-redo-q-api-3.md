# T509 — Dịch lại (nội dung đã sửa): q-api-3 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-api-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-api.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-api-3.en.js` đã cũ: **api-018, api-019, api-020, api-022**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-api.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-api-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-api-3 → OK; node scripts/validate.js → OK.

## Notes

- Chỉ sửa `js/i18n/q-api-3.en.js` (không đụng `api-021` hay entry khác). Giữ nguyên key; mỗi entry chỉ có `q`, `a`, `follow`; code/id/URL giữ nguyên, chuỗi tiếng Việt trong code mẫu đã dịch sang tiếng Anh. Header file đổi sang task T509 theo convention các file redo.
- `api-018`: thêm ghi chú (khớp bản VN mới) rằng `spring.mvc.problemdetails.enabled` chỉ đăng ký `ResponseEntityExceptionHandler` mặc định khi chưa có bean cùng loại; advice tự viết `extends ResponseEntityExceptionHandler` sẽ thay thế nó. Đổi fence khối HTTP response từ `~~~json` sang `~~~text` cho khớp bản VN (nội dung là HTTP thô + JSON).
- `api-019`: thêm bullet `nowMs` lấy từ đồng hồ pod — lệch vài trăm ms làm bucket refill sai, có thể dùng `redis.call('TIME')` (Redis 5+) để mọi pod dùng chung đồng hồ Redis; thay bullet `RateLimit-*` bằng nội dung mới: dạng `RateLimit-Limit/-Remaining/-Reset` là draft IETF cũ, draft mới gộp thành hai header structured `RateLimit` + `RateLimit-Policy`, chưa là RFC nên phải ghi rõ format trong tài liệu API.
- `api-020`: thay comment `parseEtag` bằng giải thích If-Match dùng so sánh STRONG (RFC 9110) — ETag yếu `W/"7"` không bao giờ khớp, `parseEtag` trả -1 nên service không khớp version nào → 412. Viết lại Cách B: trong transaction phải tự so `entity.getVersion()` với `expected` và ném `OptimisticLockingFailureException`, gán `setVersion(expected)` lên entity managed không có tác dụng, exception của `@Version` chỉ ném ở flush/commit.
- `api-022`: đối chiếu từng đoạn với bản VN hiện tại — entry tiếng Việt không đổi sau T125 và bản dịch T187 vốn đã bám đúng, nên chỉ chỉnh vài chỗ sát nghĩa hơn (synchronous, "business logic not processed yet", "with its own retries", "per event_id"); không thêm/bớt ý.
- Kiểm tra: `node scripts/check-i18n.js q-api-3` → OK (5 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
