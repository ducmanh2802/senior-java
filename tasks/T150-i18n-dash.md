# T150 — Song ngữ EN/VI cho giao diện: dashboard, roadmap, account

Status: DONE
Agent: opencode
Owns: `js/views/dashboard.js`, `js/views/roadmap.js`, `js/views/account.js`

App đã có lõi i18n: đọc kỹ comment đầu `js/core/i18n.js` (`App.t`, `App.i18n.add`, `App.lang`, `App.setLang` render lại view hiện tại; `App.LEVELS`/`App.STATUS` tự đổi nhãn). Nút EN/VI ở header đã có. Chỉ **giao diện** song ngữ — nội dung dữ liệu (câu hỏi, đáp án, bài học, quiz, lab, roadmap, công ty…) giữ nguyên tiếng Việt, KHÔNG dịch.

Với từng file được giao:
1. Ở đầu IIFE gọi `App.i18n.add({ vi: {...}, en: {...} })` với key `<view>.<tên>` (ví dụ `bank.search`, `bank.found`). Bản `vi` giữ NGUYÊN chữ hiện tại (không đổi giọng văn); bản `en` là tiếng Anh tự nhiên, ngắn gọn kiểu UI (Title case cho tiêu đề, sentence case cho nút).
2. Thay MỌI chuỗi tiếng Việt hiển thị cho người dùng (tiêu đề, nút, nhãn, placeholder, aria-label, title, thông báo, empty state, confirm/alert, toast, đơn vị như "câu", "phút", số nhiều tiếng Anh dùng `{n}`) bằng `App.t('key', { n })`. `title` của view → `get title() { return App.t('<view>.title'); }`. Ngày giờ: dùng `App.lang === 'en' ? 'en-US' : 'vi-VN'` cho `toLocale*String` nếu file đang tự format.
3. Không đổi logic, class CSS, id, cấu trúc HTML; không sửa file khác (cần thì ghi `## Notes`). Chuỗi gửi cho AI (prompt, config interview) giữ nguyên.
4. `node --check` từng file, `grep` lại để chắc không sót chuỗi tiếng Việt hiển thị (comment thì giữ), `node scripts/validate.js` → OK, rồi `Status: DONE` + ghi chú số key đã thêm.

## Notes

- Lần chạy trước bị gián đoạn: dashboard.js chỉ có dict `dash.*` chưa thay chuỗi → đã giữ nguyên dict và hoàn tất thay toàn bộ chuỗi hiển thị (kèm `get title()`).
- dashboard.js: dict 73 key (đối chiếu vi=en đầy đủ); thay mọi chuỗi cứng trong topicGroups, historyRow, todayCard, historyCard, interviewPlanCard, render bằng `tr()`. Không còn chuỗi tiếng Việt hiển thị ngoài dict (chỉ còn comment).
- roadmap.js: thêm dict `rm.*` — **57 key** (vi giữ nguyên chữ gốc, en tự nhiên kiểu UI). `WD` thành hàm `WD()` theo `App.lang` (Sun/Mon… hoặc CN/T2…); `fmtDay` theo `App.lang` (en: m/d/yyyy; vi: d/m/yyyy). Tiêu đề view `get title()`.
- account.js: thêm dict `acc.*` — **101 key**. `SYNC_STATE.label` → `labelKey` + `tr()`; `KIND_LABEL` → khóa qua `tr()`; `errText` fallback qua key; thông điệp mọi wire function (google/email/name/sync/export/signOut/delete/quota) qua `tr()`. `DELETE_WORD` giữ 'XOA' ở cả hai ngôn ngữ (chỉ dịch dòng hướng dẫn gõ). Tiêu đề view `get title()`.
- Đã kiểm tra: `node --check` ok cả 3 file; `node scripts/validate.js` → `OK — không có lỗi.`; smoke test qua `scripts/browser-shim.js`: render vi + en không lỗi, khi en không còn chuỗi UI tiếng Việt sót (chỉ còn nội dung dữ liệu: tên chủ đề, tuần roadmap — giữ tiếng Việt theo đúng yêu cầu).
- Không sửa file nào ngoài 3 file được giao.
