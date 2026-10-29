# T495 — Dịch lại (nội dung đã sửa): lessons-devops-2 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-devops-2.en.js` đã cũ: **lesson-devops-003, lesson-devops-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-devops-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-devops-2 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại cả hai entry theo bản tiếng Việt hiện tại (sau commit fact-check a5db76a), giữ nguyên key, id và cùng tập field như trước: `title`, `goals`, `body`, `exercises` (chỉ `title`/`prompt`/`hints`/`explain`), `check`.
- lesson-devops-003: cập nhật dòng blue-green trong bảng (chi phí "hai môi trường chạy song song", rollback = đổi selector của Service, ràng buộc schema DB tương thích cả hai bản), đoạn giải thích `String.hashCode()`/`Object.hashCode()` + MurmurHash và salt theo tên experiment, viết lại 4 bẫy (hash định danh ổn định, bucket con khi tăng %, rollback vì noise 3/3 request, metrics thiếu nhãn version) và ý "đủ mẫu theo thời gian thay vì số request" trong `explain`.
- lesson-devops-004: dịch lại toàn bộ bài sau khi nội dung được viết lại — bảng mã lỗi dùng mã Microsoft Graph thật (`activityLimitReached`, `serviceNotAvailable`, `accessDenied`, `itemNotFound`), thêm mục Retry-After, idempotency khi upload, 3 bẫy production và phần explain/hints mới của bài tập.
- Comment tiếng Việt trong code mẫu nằm trong `body` đã dịch sang tiếng Anh; id/API/tên lớp giữ nguyên.
- Nghiệm thu: `node scripts/check-i18n.js lessons-devops-2` → OK (2 mục); `node scripts/validate.js` → OK — không có lỗi.
- Ghi chú ngoài phạm vi: harness `tests` của lesson-devops-003 trong `js/data/lessons-devops.js` còn chuỗi tiếng Việt "mong đợi gần 500"; file dịch không được chép field `tests` (check-i18n chặn), nên muốn dịch chuỗi này phải sửa ở file dữ liệu — đề xuất cho integrator/task nội dung.
Reviewed-by: check-i18n (translation, no LLM review)
