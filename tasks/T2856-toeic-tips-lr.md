# T2856 — TOEIC tips & tricks: Listening + Reading + chiến lược chung (12 bài)

Status: DONE
Agent: claude
Owns: `js/data/toeic-tips.js`

Viết **12 bài tip**:
- overall (tip-o-01..03): cấu trúc đề và cách tính điểm (thang 5–495 mỗi phần, không có công thức quy đổi chính thức — chỉ ước lượng), lộ trình 8 tuần theo mục tiêu điểm, chiến lược ngày thi và quản lý thời gian (Reading 75 phút: Part 5 ~10 phút, Part 6 ~8 phút, Part 7 ~55 phút).
- listening (tip-l-01..04): Part 1 (bẫy động từ bị động/tiếp diễn, vật không có trong ảnh), Part 2 (bẫy đồng âm, câu trả lời gián tiếp, loại trừ), Part 3 (đọc trước câu hỏi trong lúc đọc hướng dẫn, nghe từ khoá chuyển ý, câu graphic, implied), Part 4 (đoán loại bài nói, thứ tự thông tin trùng thứ tự câu hỏi).
- reading (tip-r-01..05): Part 5 từ loại theo vị trí (trước danh từ là tính từ…), thì và bị động, từ vựng/collocation hay gặp, Part 6 câu chèn (đọc cả đoạn, từ nối, đại từ), Part 7 skimming/scanning, câu NOT true, đoạn kép/ba (cross-reference), câu insert-sentence.

Viết vào `js/data/toeic-tips.js` (thay dòng giữ chỗ bằng `(window.TOEIC_TIPS = window.TOEIC_TIPS || []).push(...)`, task sau thì chỉ THÊM). Schema ở cuối docs/TOEIC-LR.md. Mỗi bài: **Tóm tắt:** → chiến thuật từng bước VÌ SAO hiệu quả → ví dụ cụ thể (câu/đoạn mẫu tự viết, phân tích bẫy) → bảng lỗi hay gặp → lộ trình luyện theo mức điểm (450 → 650 → 800 → 900+) → `> Senior tip:`. Xu hướng đề mới chỉ nói ở mức quan sát chung, không bịa thống kê. `related` có thể trỏ `toeic-s1-001`… (S&W có sẵn) hoặc `lr1-p3-05`… (nếu đã có).

## Luật
- Tiếng Việt CÓ DẤU, ví dụ tiếng Anh tự nhiên. Không backtick, không `${`. Chỉ sửa file bạn sở hữu. KHÔNG commit.

## Nghiệm thu
`node --check js/data/toeic-tips.js`; `node scripts/check-toeic-lr.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. Xong: `Status: DONE` + Notes.

## Notes
- 12 tip (tip-o-01..03, tip-l-01..04, tip-r-01..05), body 3000–3700 ký tự/bài, tổng khoảng 41.4k ký tự. Mỗi bài: Tóm tắt, chiến thuật, ví dụ tự viết, bảng lỗi, lộ trình 450/650/800/900+, Senior tip. Video chỉ dùng ID trong scripts/videos-verified.js; related chỉ trỏ lr1-p1/p2/p3 và tip id có thật.
- node --check, check-toeic-lr.js (OK, 20 tip tính cả S/W) và validate.js (OK) đều sạch.


## Video hướng dẫn (bổ sung 2026-11-28)

Mỗi tip phải có field `videos` (1–3 video). Đọc mục `videos` trong tài liệu schema. **Chỉ dùng ID trong `scripts/videos-verified.js`**; checker chặn ID ngoài danh sách. `note` nói rõ xem đoạn nào và vì sao.
Reviewed-by: verify-only (code/UI task)
