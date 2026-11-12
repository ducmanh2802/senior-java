# T1485 — Trắc nghiệm: thêm 15 câu topic api

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`

Thêm **15 câu trắc nghiệm** topic `api` vào cuối `js/data/quiz-spring.js` (schema AGENTS.md mục 4; xem các câu có sẵn trong file làm mẫu). Id `qz-api-NNN`, nối tiếp id lớn nhất hiện có của topic (tìm: `grep -oh "qz-api-[0-9]*" js/data/quiz*.js | sort | tail -1`).

Nội dung: REST design, status code, versioning, pagination, idempotency key, rate limit, OpenAPI, gRPC vs REST, backward compatibility. Câu hỏi dạng tình huống thực tế ("Service X gặp…, nguyên nhân/cách sửa nào đúng?"), không hỏi định nghĩa suông, không trùng ý câu đã có. Khoảng 10 câu một đáp án và 5 câu `multi: true` (Chọn 2). Đáp án đúng rải đều vị trí 0–3. `explain` (tiếng Việt có dấu) giải thích vì sao đúng VÀ vì sao từng phương án sai là sai. Kiến thức phải ĐÚNG (Java 17/21, Spring Boot 3.x).

## Luật
- Đọc AGENTS.md trước. **Chỉ thêm** object mới vào cuối `js/data/quiz-spring.js`; không sửa/xoá mục đã có; không sửa file nào khác.
- Cách thêm an toàn (khuyên dùng): viết các object mới (cú pháp JavaScript, cách nhau bằng dấu phẩy) vào file tạm `logs/tmp-T1485.js`, rồi chạy `node scripts/qtool.js append js/data/quiz-spring.js logs/tmp-T1485.js`. Tool tự kiểm tra cú pháp, id trùng và chèn đúng chỗ. **KHÔNG ghi lại toàn bộ file dữ liệu.**
- Chuỗi tiếng Anh có dấu nháy đơn (I'm, don't, it's) → bọc chuỗi bằng dấu nháy kép "...". Không dùng backtick và ký tự $ trong nội dung.
- Tiếng Anh phải **đúng ngữ pháp, tự nhiên, câu ngắn dễ nói** (trình độ B1–B2, đúng kiểu một kỹ sư nói khi phỏng vấn, không văn viết hoa mỹ). Nội dung kỹ thuật phải ĐÚNG. Tiếng Việt có dấu đầy đủ.
- Tự viết bằng lời của mình, không chép từ sách hay trang web. Không trùng ý với mục đã có.

## Nghiệm thu
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Sửa dòng `Status: TODO` thành `Status: DONE` và ghi Notes: danh sách id đã thêm.

## Notes

- Đã thêm 15 câu `qz-api-026`–`qz-api-040` (10 câu một đáp án, 5 câu chọn 2).
- `node scripts/qtool.js check`, `node --check`, build light index và `node scripts/validate.js` đã chạy; validator in `OK — không có lỗi.` Còn cảnh báo có sẵn về `lesson-design-007` không nằm trong PATH.
Reviewed-by: kilo (T1485R)
