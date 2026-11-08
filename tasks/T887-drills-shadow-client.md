# T887 — Bài shadowing: 20 câu tiếng Anh làm việc remote/freelance

Status: DONE
Agent: kilo
Owns: `js/data/drills-shadow.js`

Đọc phần chú thích đầu `js/data/drills-qa.js` (format `kind: "shadow"`) và các drill trong `js/data/drills-shadow.js`; id `drill-shadow-NNN` tiếp nối số lớn nhất, không trùng câu. Thêm **20 câu shadowing** (8–25 từ mỗi câu, `en` + `vi` nghĩa tự nhiên) cho các tình huống: chào hỏi client, làm rõ yêu cầu, đưa ước lượng, báo trễ, xin thêm thời gian, từ chối lịch sự, cảm ơn và xin review, báo cáo tiến độ, xin lỗi vì sự cố, đề xuất giải pháp. `theme` chỉ dùng: `negotiation`, `project`, `smalltalk`, `intro`. Câu phải tự nhiên như người bản xứ nói trong công việc (không sách vở), dễ phát âm theo nhịp.

`node scripts/validate.js` → OK. Ghi Notes: danh sách id mới.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Nghiệm thu
`node --check js/data/sdlc.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + tóm tắt vào Notes.

## Notes

Thêm 20 câu shadowing vào js/data/drills-shadow.js, id drill-shadow-121 đến drill-shadow-140 (không xóa/sửa câu cũ; drill-shadow-120 được giữ nguyên).
Các tình huống (2 câu mỗi tình huống): chào hỏi client (121, 122), làm rõ yêu cầu (123, 124), đưa ước lượng (125, 126), báo trễ (127, 128), xin thêm thời gian (129, 130), từ chối lịch sự (131, 132), cảm ơn và xin review (133, 134), báo cáo tiến độ (135, 136), xin lỗi vì sự cố (137, 138), đề xuất giải pháp (139, 140).
theme chỉ dùng: intro, smalltalk, project, negotiation; level: mid/senior. Mỗi câu en 8–25 từ, kèm vi nghĩa tự nhiên.
Chạy `node --check js/data/drills-shadow.js` → OK, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK — không có lỗi. Không commit.Reviewed-by: kilo (T887R)
