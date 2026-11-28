# T2852 — TOEIC L&R đề 2: Part 3

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-2b.js`
After: T2846

Điền `js/data/toeic-lr-2b.js` (thay dòng giữ chỗ bằng `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...)`), đề 2: Part 3 (13 hội thoại, câu 32–70; ≥ 2 hội thoại 3 người, ≥ 3 bài có graphic ở 3 hội thoại cuối như đề thật, ≥ 2 câu implied). Đọc file `toeic-lr-1b.js` để **không trùng** tình huống/từ vựng chính với đề 1.

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-2b.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes

- Hoàn tất: 13 unit (lr2-p3-01 → 13), 39 câu (n32–70), mỗi unit 3 câu.
- Hội thoại 3 người: unit 02 (W/M/W2), unit 05 (M/W/M2).
- Graphic ở 3 hội thoại cuối: unit 11 (phòng họp), 12 (gói bảo trì), 13 (chuyến bay).
- Câu implied: n51 (unit 07, "hold off on new hires"), n60 (unit 10, "push back").
- Loại câu: gist, detail, next-action, implied, graphic (đủ 5 type Part 3).
- Phân bố đáp án (0/1/2/3): 8/12/10/9 → vị trí 1 chiếm 30.8% (< 35%).
- Accent: us/uk/au/ca rải đều; không trùng tình huống/từ vựng chính với đề 1 (toeic-lr-1b.js).
- Kiểm tra: `node --check` OK; `node scripts/check-toeic-lr.js` và `node scripts/validate.js` không có lỗi thuộc lr2-p3-* (lỗi còn lại thuộc file khác: lr2-p1-*, lessons-api/modern, path, index-light — không sở hữu, không sửa).
- Không backtick/`${` trong chuỗi; không commit; không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
