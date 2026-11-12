# T1509 — TOEIC Speaking Q1–4: 8 bài read aloud (s1) và 8 bài describe a picture (s2)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`

Thêm bài luyện TOEIC Speaking & Writing vào `js/data/toeic.js`, id toeic-s1-001…008, toeic-s2-001…008. **Đọc kỹ chú thích schema ở đầu file** (bảng format đề đã đối chiếu với ETS/IIBC, các field theo từng part, số từ). Nếu file đã có bài của task trước thì đọc để giữ cùng phong cách và không trùng chủ đề.

Nội dung: s1: thông báo nơi công cộng, quảng cáo, tin nhắn thoại, bản tin ngắn, giới thiệu diễn giả; có tên riêng, số, danh sách liệt kê (để luyện ngữ điệu). stress = 4–8 từ/cụm cần nhấn hoặc chỗ dễ đọc sai. s2: cảnh văn phòng, nhà hàng, đường phố, công trường, cửa hàng, sân bay, công viên, phòng họp; scene mô tả kỹ để người học hình dung như nhìn ảnh.

## Yêu cầu chất lượng
- Giống đề TOEIC thật về độ khó và văn phong (tiếng Anh công sở, đời sống), nhưng **tự viết**, không chép đề hay sách luyện thi.
- Tiếng Anh mẫu đúng ngữ pháp, tự nhiên, trình độ đạt ~160–180/200 (rõ ràng, không hoa mỹ quá sức người học); đúng thời lượng/số từ trong schema.
- `tips` (2–4 mẹo tiếng Việt có dấu): cách làm dạng bài này, cụm từ nên dùng, lỗi người Việt hay mắc.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục khác hay file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1509.js` rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1509.js`. Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal; không backtick lồng, không `${`.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra field và số từ). KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm toeic-s1-001…008 (8 bài read aloud) và toeic-s2-001…008 (8 bài describe a picture); số từ, cú pháp và kiểm tra riêng `toeic.js` đều đạt.
- `node scripts/validate.js` vẫn báo `index-light.js` cũ; TOEIC không thuộc các nhóm dữ liệu được index. Không sửa file ngoài phạm vi sở hữu; cần integrator chạy `node scripts/build-light-index.js` để xử lý trạng thái index cũ.
Reviewed-by: verify-only (code/UI task)
