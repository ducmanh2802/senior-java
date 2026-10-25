# T151 — Song ngữ EN/VI cho giao diện: bank, flash, quiz

Status: DONE
Agent: opencode
Owns: `js/views/bank.js`, `js/views/flash.js`, `js/views/quiz.js`

App đã có lõi i18n: đọc kỹ comment đầu `js/core/i18n.js` (`App.t`, `App.i18n.add`, `App.lang`, `App.setLang` render lại view hiện tại; `App.LEVELS`/`App.STATUS` tự đổi nhãn). Nút EN/VI ở header đã có. Chỉ **giao diện** song ngữ — nội dung dữ liệu (câu hỏi, đáp án, bài học, quiz, lab, roadmap, công ty…) giữ nguyên tiếng Việt, KHÔNG dịch.

Với từng file được giao:
1. Ở đầu IIFE gọi `App.i18n.add({ vi: {...}, en: {...} })` với key `<view>.<tên>` (ví dụ `bank.search`, `bank.found`). Bản `vi` giữ NGUYÊN chữ hiện tại (không đổi giọng văn); bản `en` là tiếng Anh tự nhiên, ngắn gọn kiểu UI (Title case cho tiêu đề, sentence case cho nút).
2. Thay MỌI chuỗi tiếng Việt hiển thị cho người dùng (tiêu đề, nút, nhãn, placeholder, aria-label, title, thông báo, empty state, confirm/alert, toast, đơn vị như "câu", "phút", số nhiều tiếng Anh dùng `{n}`) bằng `App.t('key', { n })`. `title` của view → `get title() { return App.t('<view>.title'); }`. Ngày giờ: dùng `App.lang === 'en' ? 'en-US' : 'vi-VN'` cho `toLocale*String` nếu file đang tự format.
3. Không đổi logic, class CSS, id, cấu trúc HTML; không sửa file khác (cần thì ghi `## Notes`). Chuỗi gửi cho AI (prompt, config interview) giữ nguyên.
4. `node --check` từng file, `grep` lại để chắc không sót chuỗi tiếng Việt hiển thị (comment thì giữ), `node scripts/validate.js` → OK, rồi `Status: DONE` + ghi chú số key đã thêm.

## Notes

## Notes
- `bank`: thêm ~35 key (title, subtitle, search, level, hide answer, status chips, grades, practice, answer hidden/reveal, follow, self-assess, expand/collapse, more, count, empty, mic, ai wait, bookmark, due label, filter aria, topic all). Title đổi thành getter `get title() { return App.t('bank.title'); }`.
- `flash`: thêm ~25 key (title, subtitle, mode labels/chips, flip/grade/empty/new deck/bank links, summary, weak retry, toast saved/due, bookmark badge, keys, follow title, hint). Title đổi thành getter.
- `quiz`: thêm ~20 key (title, subtitle, topic/count setup, start/history/result titles/actions, timer label, result breakdown, wrong items, score badge, nav buttons, topic chips). Title đổi thành getter.
- Không sửa file khác (core/app/i18n giữ nguyên). `node --check` OK cho cả 3 file. `node scripts/validate.js` → OK.
Reviewed-by: verify-only (code/UI task)
