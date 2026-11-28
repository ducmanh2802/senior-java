# T2855 — TOEIC L&R đề 2: Part 7

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-2e.js`
After: T2846

Điền `js/data/toeic-lr-2e.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 2: Part 7 (câu 147–200: 10 đoạn đơn 29 câu, 2 đoạn kép, 3 đoạn ba; ≥ 2 text message/online chat, ≥ 2 câu insert-sentence, ≥ 4 câu cross-reference). Đọc file `toeic-lr-1e.js` để **không trùng** tình huống/từ vựng chính với đề 1.

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-2e.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- 15 unit, 54 câu (147–200): 10 đoạn đơn (147–175, 29 câu: 9 unit×3 + 1 unit×2), 2 đoạn kép (176–185, 5 câu/đoạn), 3 đoạn ba (186–200, 5 câu/đoạn).
- Loại đoạn: email, article, notice, advertisement, memo, text message chain, online chat, letter, review, invoice, schedule, report (đủ kind).
- insert-sentence: 2 câu (150, 159). text message/online chat: 2 đoạn (unit 06 text message, unit 07 online chat) có câu "what does X mean" (162, 165). cross-reference: 9 câu (178, 180, 184, 187, 189, 192, 194, 198, 199) ≥ 4.
- Phân bố đáp án: A 14, B 15, C 12, D 13 (rải đều, không vị trí nào > 35%).
- Chủ đề/cong ty/tình huống khác hẳn đề 1 (không trùng): all-hands meeting, LED retrofit, network upgrade, language institute, travel expense, desk move, subscription renewal, health insurance, hotel review, cleaning invoice, meeting-room booking, cleaning contract, wellness program, office move, support survey.
- `node --check` OK; `node scripts/check-toeic-lr.js` OK; `node scripts/validate.js` OK — không có lỗi thuộc file này.
Reviewed-by: verify-only (code/UI task)
