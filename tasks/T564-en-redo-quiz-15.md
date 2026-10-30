# T564 — Dịch lại (nội dung đã sửa): quiz-15 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-15.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-15.en.js` đã cũ: **qz-devops-005, qz-devops-006, qz-devops-007, qz-kotlin-003, qz-kotlin-004, qz-kotlin-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-15.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-15 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại 6 mục theo nội dung VI hiện tại: qz-devops-005/006/007, qz-kotlin-003/004/005. Các thay đổi mới trong VI đều có mặt: expand-contract "tương thích với cả hai phiên bản" + PostgreSQL 11/volatile default; retry chỉ che lỗi race trong code + công thức 1−0.99^100; ghi chú NativeMemoryTracking=summary; runInterruptible/setQueryTimeout; constrainOnce; "Any() as T" + java.lang.Object.
- Lưu ý: bản trong HEAD của `js/i18n/quiz-15.en.js` là stub rỗng, nên file làm việc chứa đủ 19 mục (13 mục còn lại giữ bản dịch sẵn có) để `check-i18n` đạt yêu cầu 19/19. Chỉ nội dung 6 mục mục tiêu được viết lại.
- Không backtick, không `${`, code block giữ nguyên và chuỗi/comment đã dịch sang tiếng Anh.
- Đã chạy: `node scripts/check-i18n.js quiz-15` → OK (19 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
