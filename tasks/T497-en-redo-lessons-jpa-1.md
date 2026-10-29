# T497 — Dịch lại (nội dung đã sửa): lessons-jpa-1 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jpa-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-jpa.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-jpa-1.en.js` đã cũ: **lesson-jpa-001, lesson-jpa-002, lesson-jpa-003, lesson-jpa-004, lesson-jpa-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-jpa.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-jpa-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-jpa-1 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 5 entry (lesson-jpa-001…005) từ bản tiếng Việt hiện tại trong `js/data/lessons-jpa.js`: giữ nguyên key, cùng tập field (title, goals, body, exercises, check), bổ sung `answer` cho từng câu `check` khớp thứ tự option của bản tiếng Việt; mọi chuỗi tiếng Việt trong code mẫu (`~~~java`, `~~~text`) đã dịch sang tiếng Anh.
- Nội dung viết chi tiết cho người đọc chưa quen công nghệ: giải thích thuật ngữ ngay lần đầu (persistence context, snapshot, flush, proxy, N+1, round-trip, pooled optimizer…), có ví dụ số liệu/sơ đồ ASCII, bảng trade-off, pitfall production và mục "Interview relevance".
- Kiểm tra: `node scripts/check-i18n.js lessons-jpa-1` → `OK — 5 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý cho integrator: trong lúc làm việc có tạo file nháp `js/i18n/lessons-jpa-1.en.staged.txt` (chứa bản nháp nội dung) nhưng môi trường chặn lệnh xoá (`rm`/`node -e unlink`). File này KHÔNG được nạp (manifest chỉ nạp `*.en.js`), đề nghị xoá khi commit. Ngoài file đó, chỉ `js/i18n/lessons-jpa-1.en.js` bị sửa.
Reviewed-by: check-i18n (translation, no LLM review)
