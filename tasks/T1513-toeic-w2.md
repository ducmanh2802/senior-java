# T1513 — TOEIC Writing Q6–7: 8 bài respond to a written request (w2)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T1512

Thêm bài luyện TOEIC Speaking & Writing vào `js/data/toeic.js`, id toeic-w2-001…008. **Đọc kỹ chú thích schema ở đầu file** (bảng format đề đã đối chiếu với ETS/IIBC, các field theo từng part, số từ). Nếu file đã có bài của task trước thì đọc để giữ cùng phong cách và không trùng chủ đề.

Nội dung: e-mail công việc (khách hàng, đồng nghiệp, nhà cung cấp, sự kiện, tuyển dụng); task yêu cầu cụ thể như "give two pieces of information and ask one question"; sample 80–150 từ, đủ mọi yêu cầu, có lời chào/kết lịch sự.

## Yêu cầu chất lượng
- Giống đề TOEIC thật về độ khó và văn phong (tiếng Anh công sở, đời sống), nhưng **tự viết**, không chép đề hay sách luyện thi.
- Tiếng Anh mẫu đúng ngữ pháp, tự nhiên, trình độ đạt ~160–180/200 (rõ ràng, không hoa mỹ quá sức người học); đúng thời lượng/số từ trong schema.
- `tips` (2–4 mẹo tiếng Việt có dấu): cách làm dạng bài này, cụm từ nên dùng, lỗi người Việt hay mắc.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục khác hay file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1513.js` rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1513.js`. Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal; không backtick lồng, không `${`.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra field và số từ). KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 8 bài `toeic-w2-001`…`toeic-w2-008` (respond to a written request, part w2) vào `js/data/toeic.js` qua `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1513.js`.
- Chủ đề: team lunch (colleague/manager), đơn hàng thiếu (supplier), phản hồi khách sạn (customer), chuẩn bị họp khách hàng (colleague), trả lời mời phỏng vấn (recruitment), đăng ký training (colleague), sự kiện networking (event), làm rõ hóa đơn (vendor). Mỗi bài có `email`, `task`, `sample` 80–150 từ, đủ yêu cầu, có lời chào/kết, 3 tips tiếng Việt.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` `node --check js/data/toeic.js` OK. Không commit, không sửa file ngoài phạm vi.
Reviewed-by: verify-only (code/UI task)
