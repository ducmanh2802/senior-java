# T2785 — 4 câu "review code tìm lỗi mất dữ liệu / race condition" vào q-spring-data.js

Status: DONE
Notes: Repaired interrupted file (closed premature template literals) and fixed inline braces. Added spring-111..spring-113 review-code questions (self-invocation transaction, swallowed exception, migration missing WHERE, check-then-act race). Validate OK.
Agent: kilo
Owns: `js/data/q-spring-data.js`

Thêm **4 câu hỏi mới** vào `js/data/q-spring-data.js` (topic `spring`, `jpa` hoặc `db` cho đúng nội dung), id nối tiếp id lớn nhất của từng topic (`node scripts/qtool.js list js/data/q-spring-data.js`).

Dạng câu hỏi: **"Bạn review PR sau, bạn thấy vấn đề gì và yêu cầu sửa thế nào?"**. Trong `a` có đoạn code **đang lỗi** (≤ 20 dòng) → chỉ ra dòng lỗi và kịch bản hỏng dữ liệu cụ thể (có số liệu) → code đã sửa có comment → test tái hiện lỗi → comment review mẫu viết cho đồng nghiệp.

4 case:
1. **`@Transactional` không có tác dụng / tách sai transaction**: method gọi method khác trong cùng class (self-invocation qua proxy), hoặc hai thao tác ghi lẽ ra chung một transaction lại tách ra → lỗi giữa chừng thì dữ liệu lệch (trừ tiền nhưng không tạo đơn).
2. **Catch rỗng nuốt exception**: `try { save } catch (Exception e) {}` hoặc chỉ log → transaction vẫn commit phần còn lại, lỗi ghi dữ liệu bị giấu; thêm chuyện `rollbackFor` với checked exception.
3. **Script migration `UPDATE`/`DELETE` thiếu hoặc sai `WHERE`** (Flyway): cách review script, chạy trong transaction, kiểm tra số dòng bị ảnh hưởng, backup/PITR.
4. **Race condition check-then-act**: đọc số dư/tồn kho rồi ghi lại không khoá → 2 request đồng thời bán âm kho; check-then-insert chống trùng mà không có unique constraint. Sửa: `@Version` (optimistic lock) hoặc `SELECT ... FOR UPDATE`, `UPDATE ... SET stock = stock - 1 WHERE stock >= 1`, unique constraint; so sánh trade-off.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → nội dung trên → bảng trade-off → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `code review`. Level: 1 mid, 2 senior, 1 lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ**. Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Spring Security 6, Hibernate 6, PostgreSQL 15+. Không bịa API. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Ý nào đã có trong file thì vẫn viết, nhưng theo **dạng review code** (đọc đoạn code → tìm lỗi → sửa), không lặp lại câu lý thuyết cũ; ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2785R)
