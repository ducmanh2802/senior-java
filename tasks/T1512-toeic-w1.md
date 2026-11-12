# T1512 — TOEIC Writing Q1–5: 20 bài write a sentence based on a picture (w1)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T1511

Thêm bài luyện TOEIC Speaking & Writing vào `js/data/toeic.js`, id toeic-w1-001…020. **Đọc kỹ chú thích schema ở đầu file** (bảng format đề đã đối chiếu với ETS/IIBC, các field theo từng part, số từ). Nếu file đã có bài của task trước thì đọc để giữ cùng phong cách và không trùng chủ đề.

Nội dung: mỗi bài 2 từ cho sẵn (danh từ/động từ/giới từ/liên từ như because, while, next to, so that); sample là MỘT câu đúng ngữ pháp dùng đủ 2 từ (được đổi dạng từ), đúng với scene; tips chỉ lỗi hay gặp.

## Yêu cầu chất lượng
- Giống đề TOEIC thật về độ khó và văn phong (tiếng Anh công sở, đời sống), nhưng **tự viết**, không chép đề hay sách luyện thi.
- Tiếng Anh mẫu đúng ngữ pháp, tự nhiên, trình độ đạt ~160–180/200 (rõ ràng, không hoa mỹ quá sức người học); đúng thời lượng/số từ trong schema.
- `tips` (2–4 mẹo tiếng Việt có dấu): cách làm dạng bài này, cụm từ nên dùng, lỗi người Việt hay mắc.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục khác hay file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1512.js` rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1512.js`. Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal; không backtick lồng, không `${`.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra field và số từ). KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 20 bài TOEIC Writing part 1 (write a sentence based on a picture) vào js/data/toeic.js: toeic-w1-001…020. Mỗi bài có scene (tiếng Việt), words (2 từ), sample (1 câu dùng đủ 2 từ) và tips (2–4 mẹo tiếng Việt có dấu). validate.js: OK cho toeic.js (lỗi còn lại ở q-system-design.js, file không thuộc task này, không được sửa theo luật #3 AGENTS.md).
Reviewed-by: verify-only (code/UI task)
