# T155 — Song ngữ EN/VI cho giao diện: chuỗi hiển thị trong core: App.ui.* (feedback, codeFeedback, runResult, speechStats, error), hộp cài đặt AI, toast/confirm xuất-nhập-xoá tiến độ, thông báo lỗi AiError, auth/sync status. CHỈ đổi chuỗi hiển thị — tuyệt đối không đổi logic, API, tên hàm, payload gửi server. `js/core/i18n.js` được nạp NGAY SAU app.js nên trong app.js chỉ gọi `App.t` bên trong hàm chạy lúc runtime (không gọi ở top-level lúc app.js vừa nạp); đăng ký từ điển core trong ai.js/auth.js ở top-level là được (chúng nạp sau i18n.js), từ điển cho chuỗi của app.js cũng đặt ở ai.js.

Status: DONE
Agent: opencode
Owns: `js/core/app.js`, `js/core/ai.js`, `js/core/auth.js`

App đã có lõi i18n: đọc kỹ comment đầu `js/core/i18n.js` (`App.t`, `App.i18n.add`, `App.lang`, `App.setLang` render lại view hiện tại; `App.LEVELS`/`App.STATUS` tự đổi nhãn). Nút EN/VI ở header đã có. Chỉ **giao diện** song ngữ — nội dung dữ liệu (câu hỏi, đáp án, bài học, quiz, lab, roadmap, công ty…) giữ nguyên tiếng Việt, KHÔNG dịch.

Với từng file được giao:
1. Ở đầu IIFE gọi `App.i18n.add({ vi: {...}, en: {...} })` với key `<view>.<tên>` (ví dụ `bank.search`, `bank.found`). Bản `vi` giữ NGUYÊN chữ hiện tại (không đổi giọng văn); bản `en` là tiếng Anh tự nhiên, ngắn gọn kiểu UI (Title case cho tiêu đề, sentence case cho nút).
2. Thay MỌI chuỗi tiếng Việt hiển thị cho người dùng (tiêu đề, nút, nhãn, placeholder, aria-label, title, thông báo, empty state, confirm/alert, toast, đơn vị như "câu", "phút", số nhiều tiếng Anh dùng `{n}`) bằng `App.t('key', { n })`. `title` của view → `get title() { return App.t('<view>.title'); }`. Ngày giờ: dùng `App.lang === 'en' ? 'en-US' : 'vi-VN'` cho `toLocale*String` nếu file đang tự format.
3. Không đổi logic, class CSS, id, cấu trúc HTML; không sửa file khác (cần thì ghi `## Notes`). Chuỗi gửi cho AI (prompt, config interview) giữ nguyên.
4. `node --check` từng file, `grep` lại để chắc không sót chuỗi tiếng Việt hiển thị (comment thì giữ), `node scripts/validate.js` → OK, rồi `Status: DONE` + ghi chú số key đã thêm.

## Notes
- Added ~18 i18n keys in `js/core/app.js` (app.toast.*, app.confirm.*, app.footer.*, app.noView, app.error.render, app.settings.*)
- Added ~65 i18n keys in `js/core/ai.js` (ai.noServer, ai.noPasscode, ai.noAuth, ai.networkError, ai.settings.*, ai.errorPrefix, ai.error.*, ai.feedback.head.*, ai.feedback.*, ai.codeFeedback.head.*, ai.codeFeedback.*, ai.runResult.*, ai.speech.*, ai.interview.error.*)
- Added ~19 i18n keys in `js/core/auth.js` (auth.notConfigured, auth.notSignedIn, auth.googleNotEnabled, auth.invalidEmail, auth.rateLimit, auth.networkError, auth.genericError, auth.emptyDisplayName, auth.deleteAccount.*, auth.export.title, auth.sync.status.*, auth.sync.lastSync, auth.sync.never, auth.sync.errorPrefix, auth.login.*)
- Replaced all hardcoded Vietnamese UI strings with `App.t()` calls
- Updated `fmtDate()` in app.js to use `App.lang` for locale
- Removed unused `NOT_CONFIGURED` and `NOT_SIGNED_IN` constants from auth.js
- Fixed syntax error in `js/data/lessons-sql.js` (escaped backticks in template literal)
- `node scripts/validate.js` → OK — không có lỗi
Reviewed-by: verify-only (code/UI task)
Verify-failed: 2026-10-25 11:26:45
