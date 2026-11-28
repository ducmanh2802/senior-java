# T2850 — TOEIC L&R đề 1: Part 7

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-1e.js`
After: T2846

Điền `js/data/toeic-lr-1e.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 1: Part 7 (câu 147–200: 10 đoạn đơn 29 câu, 2 đoạn kép, 3 đoạn ba; ≥ 2 text message/online chat, ≥ 2 câu insert-sentence, ≥ 4 câu cross-reference).

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-1e.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- Đã điền `js/data/toeic-lr-1e.js`: 15 unit / 54 câu (147–200).
  - 10 đoạn đơn (147–175, 29 câu): email, article (insert 151), notice, advertisement, memo (insert 160), text message chain (implied 163), online chat (implied 166), letter, review, invoice.
  - 2 đoạn kép (176–185, 5 câu/đoạn): email+schedule, memo+advertisement.
  - 3 đoạn ba (186–200, 5 câu/đoạn): email+article+schedule, email+notice+schedule, report+memo+schedule.
- Phân bố đáp án: A 14, B 14, C 13, D 13 (max 25.9% < 35%).
- Loại câu: detail 33, cross-reference 10, inference 4, main-idea 3, insert-sentence 2 (151, 160), implied 2 (163, 166).
- ≥2 text message/online chat có "what does X mean" (unit 06, 07); ≥4 cross-reference (177, 179, 183, 185, 187, 189, 192, 194, 198, 199).
- Kiểm tra: `node --check` OK; `node scripts/check-toeic-lr.js` OK; `node scripts/validate.js` không còn lỗi thuộc file này (lỗi còn lại là quiz-java.js của T12, không thuộc T2850).
- Nội dung tự viết, không chép ETS/đề thật; không backtick/`${`; không commit; không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
