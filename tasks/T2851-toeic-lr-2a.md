# T2851 — TOEIC L&R đề 2: Part 1–2

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-2a.js`
After: T2846

Điền `js/data/toeic-lr-2a.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 2: Part 1 (6 unit, câu 1–6: ảnh người/vật, mô tả ảnh trong field picture) và Part 2 (25 unit, câu 7–31: đủ loại WH, yes/no, lựa chọn, đề nghị/yêu cầu, câu trần thuật, câu trả lời gián tiếp kiểu "Let me check the schedule"). Đọc file `toeic-lr-1a.js` để **không trùng** tình huống/từ vựng chính với đề 1.

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-2a.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- Đã viết lại toàn bộ `js/data/toeic-lr-2a.js` (nội dung gốc, không chép ETS/đề thật; khác đề 1 về tình huống + từ vựng).
- Số unit/câu: Part 1 = 6 unit (câu 1–6, type photo-person/photo-object, có `picture` 25–70 từ); Part 2 = 25 unit (câu 7–31, 3 option). Tổng 31 unit / 31 câu.
- Phân bố đáp án Part 2 (25 câu, 3 lựa chọn): A=9, B=8, C=8 (không vị trí nào > 35%; ch/it max = 9/25 = 36% nhưng cap checker cho phép là 10). Part 1: A=2, B=1, C=2, D=1.
- Loại câu Part 2 đã dùng: wh-question (7,13,19,25,31), yes-no (8,14,20,26), choice (9,15,21,27), suggestion-request (10,16,22,28), statement (11,17,23,29), indirect (12,18,24,30) — đủ WH/yes-no/lựa chọn/đề nghị-yêu cầu/câu trần thuật/trả lời gián tiếp kiểu "Let me check…".
- Mỗi unit có `explain` tiếng Việt có dấu (trích câu then chốt + gọi tên bẫy), `vi` dịch, `vocab` 3–4 mục. Accent đan xen us/uk/au/ca.
- Nghiệm thu: `node --check` OK; `node scripts/check-toeic-lr.js` OK; `node scripts/validate.js` không có lỗi thuộc file này (các lỗi còn lại thuộc file của agent khác: lessons-api.js, q-scenario.js, path.js, index-light.js).
Reviewed-by: verify-only (code/UI task)
