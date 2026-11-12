# T1484 — Trắc nghiệm: thêm 15 câu topic security

Status: DONE
Agent: kilo
Owns: `js/data/quiz-ops.js`

Thêm **15 câu trắc nghiệm** topic `security` vào cuối `js/data/quiz-ops.js` (schema AGENTS.md mục 4; xem các câu có sẵn trong file làm mẫu). Id `qz-security-NNN`, nối tiếp id lớn nhất hiện có của topic (tìm: `grep -oh "qz-security-[0-9]*" js/data/quiz*.js | sort | tail -1`).

Nội dung: OWASP Top 10, JWT/OAuth2/OIDC, CSRF/CORS, lưu mật khẩu (bcrypt/argon2), quản lý secret, SQL injection, Spring Security 6. Câu hỏi dạng tình huống thực tế ("Service X gặp…, nguyên nhân/cách sửa nào đúng?"), không hỏi định nghĩa suông, không trùng ý câu đã có. Khoảng 10 câu một đáp án và 5 câu `multi: true` (Chọn 2). Đáp án đúng rải đều vị trí 0–3. `explain` (tiếng Việt có dấu) giải thích vì sao đúng VÀ vì sao từng phương án sai là sai. Kiến thức phải ĐÚNG (Java 17/21, Spring Boot 3.x).

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/quiz-ops.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1484.js`, rồi chạy `node scripts/qtool.js append js/data/quiz-ops.js logs/tmp-T1484.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

- Đã thêm 15 câu `qz-security-023`–`qz-security-037`: 10 câu một đáp án và 5 câu chọn 2.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js`; validator in `OK — không có lỗi.` (có cảnh báo sẵn về `lesson-design-007` ngoài PATH).
Reviewed-by: kilo (T1484R)
