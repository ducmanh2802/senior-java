# T2860 — TOEIC L&R đề 3: Part 1–2 + tạo file và group

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-3a.js`, `js/data/toeic-lr-3b.js`, `js/data/toeic-lr-3c.js`, `js/data/toeic-lr-3d.js`, `js/data/toeic-lr-3e.js`, `js/core/data-manifest.js`
After: T2846

## Làm
1. Tạo 4 file giữ chỗ js/data/toeic-lr-3b.js … toeic-lr-3e.js (mỗi file 1 dòng comment + window.TOEIC_LR = window.TOEIC_LR || [];).
2. Trong js/core/data-manifest.js thêm 5 file toeic-lr-3a.js … toeic-lr-3e.js vào **cuối** group toeic-lr (chỉ sửa dòng đó).
3. Tạo và điền js/data/toeic-lr-3a.js: Part 1 (6 unit, câu 1–6: ảnh người/vật, mô tả ảnh trong field picture) và Part 2 (25 unit, câu 7–31: đủ loại WH, yes/no, lựa chọn, đề nghị/yêu cầu, câu trần thuật, câu trả lời gián tiếp kiểu "Let me check the schedule"). Đọc toeic-lr-1a.js, toeic-lr-2a.js để không trùng.

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-3a.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes
Reviewed-by: verify-only (code/UI task)
