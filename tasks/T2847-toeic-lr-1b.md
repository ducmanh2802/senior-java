# T2847 — TOEIC L&R đề 1: Part 3

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-1b.js`
After: T2846

Điền `js/data/toeic-lr-1b.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 1: Part 3 (13 hội thoại, câu 32–70; ≥ 2 hội thoại 3 người, ≥ 3 bài có graphic ở 3 hội thoại cuối như đề thật, ≥ 2 câu implied).

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-1b.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
- 13 unit (lr1-p3-01..13), 39 câu (32–70), 3 câu/unit. `node --check` OK; `node scripts/check-toeic-lr.js` OK; `node scripts/validate.js` OK — không có lỗi.
- Hội thoại 3 người: unit 03 (W/M/W2) và 06 (M/W/M2) → ≥2.
- Graphic ở 3 hội thoại cuối: unit 11 (bảng venue), 12 (lịch tàu), 13 (gói phần mềm) → ≥3.
- Câu implied: unit 07 câu 51 và unit 10 câu 60 ("What does the man mean/imply when he says…") → ≥2.
- Phân bố đáp án (A/B/C/D): 10/10/9/10 — vị trí D và A cao nhất 10/39 ≈ 25.6% (<35%).
- Accent rải đều: us, uk, us, au, ca, uk, us, au, ca, uk, us, au, ca.
- Type câu hỏi dùng: gist, detail, next-action, suggestion-request, implied, graphic.
- Mỗi unit có `vi` (dịch) + `vocab` (3–4 mục). Không backtick/`${`.
Reviewed-by: verify-only (code/UI task)
