# T2854 — TOEIC L&R đề 2: Part 5–6

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-2d.js`
After: T2846

Điền `js/data/toeic-lr-2d.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 2: Part 5 (30 câu 101–130: khoảng 40% từ loại/ngữ pháp, 40% từ vựng/collocation, còn lại giới từ/liên từ/đại từ) và Part 6 (4 đoạn, câu 131–146, mỗi đoạn 1 câu chèn câu). Đọc file `toeic-lr-1d.js` để **không trùng** tình huống/từ vựng chính với đề 1.

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-2d.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- Đã điền `js/data/toeic-lr-2d.js`: **34 unit / 46 câu** — Part 5: 30 unit (101–130), Part 6: 4 đoạn (131–146, mỗi đoạn 4 câu, sentence-insert ở 134/138/142/146).
- Chủ đề đề 2 khác đề 1: ra mắt sản phẩm, giao hàng/kho, tiệc cưới, công tác, đặt chỗ, nhà cung cấp, chiến dịch marketing, tuyển dụng, bảo hành, hội nghị, xây cầu, sáp nhập, quy định, tàu; Part 6: notice bảo trì nước, web page khóa học, letter chậm giao hàng, article tái chế.
- Phân bố đáp án Part 5: A=9, B=8, C=7, D=6 (max 9/30 = 30% < 35%). Part 6: A/B/C/D mỗi vị trí 4/16.
- Type Part 5: word-form (101,106,112,118,124,128 = 6), verb-tense (102,109,116,127 = 4), vocabulary (103,108,114,120,126 = 5), preposition (104,111,117,125,130 = 5), pronoun (105,115,123 = 3), conjunction (107,119 = 2), relative-clause (110,121 = 2), comparison (113,122 = 2), synonym (129 = 1). Part 6: preposition, conjunction, word-form, verb-tense, comparison, sentence-insert.
- Kiểm tra: `node --check` OK; `node scripts/check-toeic-lr.js` không có lỗi thuộc file này (lỗi còn lại `lr2-p4-10` thuộc file part 4 của task khác); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: verify-only (code/UI task)
