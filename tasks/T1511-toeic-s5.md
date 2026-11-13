# T1511 — TOEIC Speaking Q11: 10 bài express an opinion (s5)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T1510

Thêm bài luyện TOEIC Speaking & Writing vào `js/data/toeic.js`, id toeic-s5-001…010. **Đọc kỹ chú thích schema ở đầu file** (bảng format đề đã đối chiếu với ETS/IIBC, các field theo từng part, số từ). Nếu file đã có bài của task trước thì đọc để giữ cùng phong cách và không trùng chủ đề.

Nội dung: chủ đề công việc và đời sống: làm việc từ xa, đào tạo, công nghệ, môi trường, giáo dục, quản lý; sample 110–160 từ, có cụm mở đầu/chuyển ý dễ học thuộc.

## Yêu cầu chất lượng
- Giống đề TOEIC thật về độ khó và văn phong (tiếng Anh công sở, đời sống), nhưng **tự viết**, không chép đề hay sách luyện thi.
- Tiếng Anh mẫu đúng ngữ pháp, tự nhiên, trình độ đạt ~160–180/200 (rõ ràng, không hoa mỹ quá sức người học); đúng thời lượng/số từ trong schema.
- `tips` (2–4 mẹo tiếng Việt có dấu): cách làm dạng bài này, cụm từ nên dùng, lỗi người Việt hay mắc.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục khác hay file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1511.js` rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1511.js`. Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal; không backtick lồng, không `${`.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra field và số từ). KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm toeic-s5-001…010; mỗi sample dài 120–130 từ. `node scripts/validate.js` báo `OK — không có lỗi.`
Reviewed-by: verify-only (code/UI task)
