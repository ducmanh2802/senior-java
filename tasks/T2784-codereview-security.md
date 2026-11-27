# T2784 — 4 câu "review code tìm lỗi bảo mật" vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`

Thêm **4 câu hỏi mới** (topic: security) vào `js/data/q-security.js`, id nối tiếp id lớn nhất (`node scripts/qtool.js list js/data/q-security.js`).

Dạng câu hỏi: **"Bạn review PR sau, bạn thấy vấn đề gì và yêu cầu sửa thế nào?"**. Trong `q` mô tả ngắn PR; trong `a` có đoạn code Spring Boot **đang lỗi** (≤ 20 dòng, ~~~java) → chỉ ra dòng lỗi và VÌ SAO nguy hiểm (kịch bản tấn công cụ thể) → code đã sửa có comment → cách phát hiện tự động (test, static analysis, checklist review) → comment review mẫu viết cho đồng nghiệp (lịch sự, rõ, có đề xuất).

4 case:
1. **IDOR**: API `GET/PUT /orders/{id}` lấy và sửa record theo id nhưng không kiểm tra record có thuộc user đang đăng nhập → user A đọc/sửa dữ liệu user B. Sửa: kiểm tra ownership ở service (`findByIdAndOwnerId`), trả 404 thay vì 403, test tích hợp với 2 user.
2. **Endpoint thiếu phân quyền**: quên `@PreAuthorize` hoặc endpoint mới không nằm trong `SecurityFilterChain` (`requestMatchers`), nên ai cũng gọi được. Nói rõ `@EnableMethodSecurity`, nguyên tắc deny-by-default (`anyRequest().authenticated()`/`denyAll()`), test bằng `@WithMockUser`.
3. **SQL injection**: ghép chuỗi vào native query / `JdbcTemplate` / `ORDER BY` động. Sửa: bind parameter, whitelist cột cho `ORDER BY`, vì sao `PreparedStatement` chặn được.
4. **Lộ dữ liệu nhạy cảm trong log**: log password, JWT/token, số CMND/CCCD (`log.info("req={}", request)` với `toString()` sinh tự động). Sửa: mask ở `toString()`/DTO, `@ToString.Exclude`, masking trong logback, không log body auth; hậu quả khi log đẩy sang ELK/CloudWatch.

Câu 4 nối thêm mục `### Kể lại trong phỏng vấn`: cách trả lời câu "Lỗi quan trọng nhất bạn từng bắt được khi review code?" (STAR ngắn, 80–120 từ, ví dụ IDOR).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → nội dung trên → bảng tóm tắt lỗi / cách sửa / cách phát hiện → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `code review`. Level: 1 mid, 2 senior, 1 lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ**. Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Spring Security 6, Hibernate 6, PostgreSQL 15+. Không bịa API. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Ý nào đã có trong file thì vẫn viết, nhưng theo **dạng review code** (đọc đoạn code → tìm lỗi → sửa), không lặp lại câu lý thuyết cũ; ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 4 câu (id lớn nhất trước đó là security-086):
  - security-087 (senior) — IDOR: GET/PUT /orders/{id} thiếu kiểm tra ownership; sửa findByIdAndOwnerId, trả 404, test 2 user.
  - security-088 (mid) — Endpoint admin thiếu @PreAuthorize + không có requestMatchers; deny-by-default, @EnableMethodSecurity, test @WithMockUser.
  - security-089 (senior) — SQL injection qua JdbcTemplate nối chuỗi + ORDER BY động; bind ? + whitelist cột/hướng, LIMIT ép int.
  - security-090 (lead) — Lộ password/token/CCCD trong log (toString()/body); @ToString.Exclude, mask, không log body auth; có mục "### Kể lại trong phỏng vấn" (STAR, ví dụ IDOR).
- Level: 1 mid, 2 senior, 1 lead (đúng yêu cầu). Mỗi câu có Tóm tắt → code lỗi → code sửa → bảng → phát hiện tự động → comment review mẫu → Ví dụ đời thực có số liệu → Trả lời mẫu → Senior tip; follow 3 câu; tags có "code review".
- Nội dung viết dạng review code, không lặp lý thuyết cũ (các câu 001/002/008/055... bàn lý thuyết; các câu mới đọc code → tìm lỗi → sửa).
- Kiểm tra: `node --check js/data/q-security.js` OK; `node scripts/build-light-index.js` OK; `node scripts/qtool.js check` cho 087-090 OK; `node scripts/validate.js` không còn lỗi nào thuộc q-security.js (các lỗi còn lại thuộc file của agent khác: lessons-payments, quiz-ops, lessons-jpa, lessons-banking, lessons-modern — không sở hữu).
- Không commit (theo luật 4).
Reviewed-by: kilo (T2784R)
