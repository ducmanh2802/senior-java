# T2846 — TOEIC L&R đề 1: Part 1–2 + tạo file và group

Status: DONE
Agent: kilo
Owns: `js/data/toeic-lr-1a.js`, `js/data/toeic-lr-1b.js`, `js/data/toeic-lr-1c.js`, `js/data/toeic-lr-1d.js`, `js/data/toeic-lr-1e.js`, `js/data/toeic-lr-2a.js`, `js/data/toeic-lr-2b.js`, `js/data/toeic-lr-2c.js`, `js/data/toeic-lr-2d.js`, `js/data/toeic-lr-2e.js`, `js/data/toeic-tips.js`, `js/core/data-manifest.js`

## Làm
1. Tạo 11 file giữ chỗ: `js/data/toeic-lr-1a.js` … `toeic-lr-1e.js`, `toeic-lr-2a.js` … `toeic-lr-2e.js` (mỗi file 1 dòng comment + `window.TOEIC_LR = window.TOEIC_LR || [];`) và `js/data/toeic-tips.js` (comment + `window.TOEIC_TIPS = window.TOEIC_TIPS || [];`).
2. Trong `js/core/data-manifest.js` thêm group mới (1 dòng, ngay sau group `toeic`): `'toeic-lr': ['toeic-tips.js', 'toeic-lr-1a.js', …, 'toeic-lr-2e.js'],   // #/toeic tab L&R + tips (docs/TOEIC-LR.md)`. KHÔNG sửa route (task view làm).
3. Điền `js/data/toeic-lr-1a.js`: Part 1 (6 unit, câu 1–6: ảnh người/vật, mô tả ảnh trong field picture) và Part 2 (25 unit, câu 7–31: đủ loại WH, yes/no, lựa chọn, đề nghị/yêu cầu, câu trần thuật, câu trả lời gián tiếp kiểu "Let me check the schedule").

Đọc **docs/TOEIC-LR.md** (bản quyền, format, schema, quy tắc) và AGENTS.md mục 5. Đề phải **tự viết**, bám format và xu hướng các đề ETS mới nhất (2024–2026): chủ đề business đời thường, hội thoại 3 người, câu hỏi graphic, câu "What does the man mean when he says…", text message/online chat, đoạn ba (triple passages), Part 5 nặng từ loại + từ vựng collocation. **Không chép** câu, script, đoạn văn từ sách ETS hay "đề thi thật" lan truyền. Độ khó trộn như đề thật (khoảng 30% dễ, 50% trung bình, 20% khó, câu khó dồn về cuối mỗi part).

## Luật
- Tiếng Anh tự nhiên, đúng ngữ pháp, giọng business; distractor là bẫy TOEIC thật (đồng âm, lặp từ, sai thì, sai người, có nhắc nhưng không trả lời câu hỏi).
- `explain` tiếng Việt CÓ DẤU: trích câu then chốt trong script/đoạn văn, vì sao đúng, vì sao từng phương án sai (gọi tên kiểu bẫy). Có `vi` (dịch) và `vocab` cho mỗi unit (trừ Part 5 có thể bỏ `vi`).
- Đáp án rải đều (không vị trí nào > 35% trong part).
- Chỉ sửa file bạn sở hữu. Không backtick, không `${`. KHÔNG commit, không mở trình duyệt.

## Nghiệm thu
`node --check js/data/toeic-lr-1a.js`; `node scripts/check-toeic-lr.js` → không có lỗi thuộc file của bạn; `node scripts/validate.js` → không có lỗi thuộc file của bạn.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi số unit/câu, phân bố đáp án, các type câu hỏi đã dùng.

## Notes

- Đã tạo đủ 11 file giữ chỗ (1a–1e, 2a–2e) + `toeic-tips.js`; 10 file b–e và tips đã có sẵn dạng placeholder, chỉ `toeic-lr-1a.js` được điền nội dung thật.
- `js/core/data-manifest.js`: thêm group `'toeic-lr'` (1 dòng, ngay sau group `toeic`), gồm `toeic-tips.js` + 10 file lr. KHÔNG đụng route.
- `toeic-lr-1a.js`: **31 unit / 31 câu**.
  - Part 1: 6 unit (câu 1–6), mỗi unit 1 câu, type photo-person/photo-object, có `picture` (25–70 từ), không script, accent đa dạng (us/uk/au/ca).
  - Part 2: 25 unit (câu 7–31), mỗi unit 1 câu, script 1 dòng. Các type đã dùng: wh-question 9, yes-no 4, statement 4, choice 3, suggestion-request 3, indirect 2 (đủ WH / yes-no / lựa chọn / đề nghị-yêu cầu / câu trần thuật / trả lời gián tiếp kiểu "Let me check the schedule").
  - Mỗi unit có `vi` (dịch) + `vocab` (4 mục "word – nghĩa"); `explain` tiếng Việt có dấu, trích câu then chốt, gọi tên bẫy (lặp từ, sai loại câu hỏi, sai thì, lạc chủ đề).
- Phân bố đáp án: Part 1 A/B/C/D = 2/1/2/1; Part 2 A/B/C = **8/8/9** (rải đều nhất có thể).
- **LƯU Ý CHECKER (cần integrator xử lý, KHÔNG thuộc file tôi sở hữu):** `scripts/check-toeic-lr.js` báo `toeic-lr-1a.js: part 2 đáp án C chiếm 36% (tối đa 35%)`. Đây là lỗi thiết kế của checker: Part 2 có 25 câu / 3 lựa chọn, theo nguyên lý chuồng bồ câu luôn có 1 vị trí ≥ ⌈25/3⌉ = 9 câu = 36% > 35%, nên **bất khả thi** để qua ngưỡng 35%. Phân bố 8/8/9 đã là tối ưu (max = 36%, không thể thấp hơn). Đề xuất: nâng ngưỡng cho part 2 lên ≥ 40% (hoặc dùng `> 0.4`), hoặc bỏ qua part 2 khỏi luật 35%. Các phần còn lại của file (Part 1, mọi rule khác) đều PASS.
- `node --check js/data/toeic-lr-1a.js` → OK. `node scripts/validate.js`: lỗi duy nhất thuộc file tôi là luật 35% bất khả thi ở trên; mọi lỗi khác trong validate thuộc file của task khác (q-frontend, quiz-ops, quiz-ckad, lessons-*), không phải file tôi sở hữu. Không có lỗi manifest/index-light do thay đổi của tôi.
- Không commit, không mở trình duyệt, không npm install, không kill tiến trình.
Reviewed-by: verify-only (code/UI task)
Verify-failed: 2026-11-28 02:06:13
