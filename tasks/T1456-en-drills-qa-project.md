# T1456 — Luyện nói tiếng Anh: thêm 8 bài hỏi–đáp (project) drill-qa-058…065

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`

Thêm **8 bài luyện nói hỏi–đáp** (kind "qa") vào `js/data/drills-qa.js`, id `drill-qa-058` … `drill-qa-065`. Người học là dev Java ~4 năm kinh nghiệm, tiếng Anh nói còn yếu, cần câu trả lời mẫu để tập nói to. Xem chú thích schema ở đầu file và vài bài có sẵn làm mẫu.

Chủ đề đợt này: **kể về dự án và vai trò của mình**. Gợi ý 8 câu hỏi (trước khi viết chạy `node scripts/qtool.js list js/data/drills-qa.js` để xem câu đã có; câu nào trùng ý thì thay bằng câu khác cùng chủ đề):
1. Walk me through the most complex system you have worked on.
2. What exactly was your role, and what did you build yourself?
3. Tell me about a technical decision you made and the trade-offs behind it.
4. Describe a production incident you handled from alert to fix.
5. How did you improve the performance of a service? What were the numbers?
6. Tell me about a time you had to change legacy code safely.
7. How do you make sure a feature is ready for production?
8. If you rebuilt that project today, what would you do differently?

Mỗi bài: `{ id, kind: "qa", theme, level, seconds, q, sample, phrases }`
- `theme`: intro | tech | behavioral | design | project | negotiation | smalltalk (chọn đúng chủ đề của câu). `level`: mid | senior | lead (đa số senior).
- `q`: câu hỏi của interviewer, tiếng Anh, 1 câu.
- `seconds`: 60 | 90 | 120. `sample`: câu trả lời mẫu để NÓI, văn bản thuần một đoạn (không markdown, không xuống dòng), **80–200 từ** (validator kiểm tra): 60 giây ≈ 90–120 từ, 90 giây ≈ 130–160 từ, 120 giây ≈ 170–195 từ. Ngôi thứ nhất, có tình huống và con số cụ thể (ví dụ "p99 dropped from 900 to 180 milliseconds"), có trade-off; không nói chung chung.
- `phrases`: 3–6 cụm từ đáng học, **trích nguyên văn từ sample**.

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/drills-qa.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1456.js`, rồi chạy `node scripts/qtool.js append js/data/drills-qa.js logs/tmp-T1456.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

Đã thêm 8 bài qa (drill-qa-058 … drill-qa-065) vào js/data/drills-qa.js, chủ đề "kể về dự án và vai trò của mình":
- drill-qa-058 (project, senior, 120s): kiến trúc dự án cuối và lý do chọn từng thành phần (thay câu "most complex system" vì trùng ý drill-qa-008)
- drill-qa-059 (project, senior, 90s): vai trò và gì mình tự build
- drill-qa-060 (design, senior, 120s): quyết định kỹ thuật và trade-off
- drill-qa-061 (behavioral, senior, 120s): sự cố production từ alert đến fix
- drill-qa-062 (tech, senior, 120s): cải thiện hiệu năng và con số
- drill-qa-063 (tech, senior, 120s): thay code cũ an toàn
- drill-qa-064 (project, senior, 120s): làm sao đảm bảo tính năng sẵn sàng production
- drill-qa-065 (design, senior, 120s): nếu xây lại dự án hôm nay sẽ làm gì khác

node scripts/qtool.js append đã chèn 8 object; node scripts/build-light-index.js + node scripts/validate.js → OK — không có lỗi. Không commit.Reviewed-by: check-i18n (translation, no LLM review)
