# T2849 — TOEIC L&R đề 1: Part 5–6

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-1d.js`
After: T2846

Điền `js/data/toeic-lr-1d.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 1: Part 5 (30 câu 101–130: khoảng 40% từ loại/ngữ pháp, 40% từ vựng/collocation, còn lại giới từ/liên từ/đại từ) và Part 6 (4 đoạn, câu 131–146, mỗi đoạn 1 câu chèn câu).

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-1d.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- 34 unit / 46 câu: Part 5 = 30 unit (câu 101–130), Part 6 = 4 đoạn × 4 câu (131–146), mỗi đoạn 1 câu sentence-insert (134, 138, 142, 146).
- Phân bố đáp án Part 5 (30 câu): A=7, B=8, C=8, D=7 (không vị trí nào > 35%). Part 6 (16 câu): A=4, B=4, C=4, D=4.
- Part 5 type (30 câu): word-form 6 (101,106,112,118,124,128), verb-tense 4 (102,109,116,127), vocabulary 5 (103,108,114,120,126), preposition 5 (104,111,117,125,130), pronoun 3 (105,115,123), conjunction 2 (107,119), relative-clause 2 (110,121), comparison 2 (113,122), synonym 1 (129). (≈40% từ loại/ngữ pháp, ≈40% từ vựng, còn lại giới từ/liên từ/đại từ/so sánh).
- Part 6 type: word-form (131,135,136,140,143,144), verb-tense (132), preposition (133,139,141,145), vocabulary (137), sentence-insert (134,138,142,146).
- Chủ đề: email chuyển văn phòng, quảng cáo sản phẩm tẩy rửa, memo dã ngoại công ty, báo cáo xu hướng remote-work — đều là business đời thường theo format ETS 2024–2026, tự viết, không chép.
- Kiểm tra: `node --check` OK; `node scripts/check-toeic-lr.js` OK; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: verify-only (code/UI task)
