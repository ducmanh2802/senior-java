# T1510 — TOEIC Speaking Q5–10: 6 bộ respond to questions (s3) và 6 bộ respond using information (s4)

Status: DONE
Agent: kilo
Owns: `js/data/toeic.js`
After: T1509

Thêm bài luyện TOEIC Speaking & Writing vào `js/data/toeic.js`, id toeic-s3-001…006, toeic-s4-001…006. **Đọc kỹ chú thích schema ở đầu file** (bảng format đề đã đối chiếu với ETS/IIBC, các field theo từng part, số từ). Nếu file đã có bài của task trước thì đọc để giữ cùng phong cách và không trùng chủ đề.

Nội dung: s3: bối cảnh kiểu "a marketing firm is doing research / you are talking to a friend about…" (mua sắm, du lịch, thể thao, công nghệ, ăn uống, làm việc từ xa); câu 1–2 trả lời 15 giây, câu 3 trả lời 30 giây. s4: info là lịch hội thảo, lịch phỏng vấn, chương trình tour, lịch đào tạo, bảng giá; câu hỏi giống người gọi điện hỏi thông tin; câu 3 thường hỏi tóm tắt nhiều mục (30 giây). Samples ngắn đúng thời lượng (15 giây ≈ 30–40 từ, 30 giây ≈ 60–75 từ).

## Yêu cầu chất lượng
- Giống đề TOEIC thật về độ khó và văn phong (tiếng Anh công sở, đời sống), nhưng **tự viết**, không chép đề hay sách luyện thi.
- Tiếng Anh mẫu đúng ngữ pháp, tự nhiên, trình độ đạt ~160–180/200 (rõ ràng, không hoa mỹ quá sức người học); đúng thời lượng/số từ trong schema.
- `tips` (2–4 mẹo tiếng Việt có dấu): cách làm dạng bài này, cụm từ nên dùng, lỗi người Việt hay mắc.

## Luật
- Đọc AGENTS.md. **Chỉ thêm** vào `js/data/toeic.js`; không sửa mục khác hay file khác.
- Cách thêm: viết các object (cách nhau bằng dấu phẩy) vào `logs/tmp-T1510.js` rồi `node scripts/qtool.js append js/data/toeic.js logs/tmp-T1510.js`. Chuỗi bọc dấu nháy kép; nhiều dòng dùng template literal; không backtick lồng, không `${`.
- Nghiệm thu: `node scripts/validate.js` → `OK — không có lỗi.` (validator kiểm tra field và số từ). KHÔNG commit.
- Xong: `Status: TODO` → `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 12 object vào `js/data/toeic.js` bằng `node scripts/qtool.js append`: `toeic-s3-001…006` (respond to questions: mua sắm, du lịch, thể thao, công nghệ, ăn uống, làm việc từ xa) và `toeic-s4-001…006` (respond using information: lịch hội thảo, lịch phỏng vấn, chương trình tour, lịch đào tạo, bảng giá, hướng dẫn họp trực tuyến). Mỗi bài đúng 3 `questions` + 3 `samples`, `tips` 3 mục tiếng Việt; không sửa dòng nào có sẵn (`git diff --numstat` = 318 thêm / 0 xoá).
- Số từ mẫu theo thời lượng ETS: câu 1–2 khoảng 28–37 từ (15 giây), câu 3 khoảng 62–75 từ (30 giây) — đã kiểm tra bằng script riêng, không có mẫu nào lệch khoảng.
- `node --check js/data/toeic.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ `path.js: lesson-design-007` không thuộc phạm vi task này). TOEIC S&W hiện 28 bài `{s1:8, s2:8, s3:6, s4:6}`.
- Không tự commit; file tạm `logs/tmp-T1510.js` và `logs/tmp-check-t1510.js` nằm trong `logs/` (đã gitignore). Lúc thêm bằng `qtool.js append`, `git diff --numstat` là 318 thêm / 0 xoá (không sửa dòng có sẵn).
- **Lưu ý cho integrator:** giữa lúc task đang chạy, autopilot đã commit `4efd5f7 Content: T1510 (auto-committed after kilo review + verify)` khi tôi còn đang rà lại chính tả. Sau commit đó tôi còn sửa 4 dòng (không phải thêm mới) để nội dung khớp đúng bảng `info`: bỏ chi tiết "on the second floor" ở `toeic-s4-001`/`s4-002`/`s4-004` (bảng không nói registration/Computer Lab/Room 210 ở tầng nào), đổi "There are four stops" → "The tour has four parts" ở `toeic-s4-003` (đang kể 3 điểm dừng + 1 lần tự do ăn trưa), và làm rõ "on Tuesday evenings" ở `toeic-s3-003`. Bốn thay đổi này **đang nằm ngoài commit** (`git diff` 4 dòng), chưa commit theo luật 4 — cần commit bù.
Reviewed-by: verify-only (code/UI task)
