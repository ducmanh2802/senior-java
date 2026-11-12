# T1526 — Bổ sung 6 câu hỏi (sql) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: sql) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất hiện có của topic (xem `node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách đó để **không trùng ý**.

Gợi ý chủ đề: window function (ROW_NUMBER, LAG) cho bài toán thật, phân trang keyset vs OFFSET, GROUP BY + HAVING bẫy, NULL trong NOT IN, CTE đệ quy cho cây danh mục, đọc EXPLAIN ANALYZE để sửa query chậm.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → ví dụ code ngắn có comment → bảng so sánh/khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: phần lớn mid/senior.

## Luật
- Đọc AGENTS.md (mục 4–6, 13) trước. **Chỉ thêm** vào `js/data/q-sql.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-sql.js logs/tmp-T1526.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm sql-039–sql-044 (JSONB/GIN, partial index và prepared plan, foreign-key index/migration, LATERAL, timeout PostgreSQL, bulk load). Đã chạy build-light-index.js và validate.js; validate báo `OK — không có lỗi.`
Reviewed-by: kilo (T1526R)
