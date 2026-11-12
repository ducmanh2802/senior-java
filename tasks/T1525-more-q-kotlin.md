# T1525 — Bổ sung 6 câu hỏi (kotlin) vào q-kotlin.js

Status: DONE
Agent: kilo
Owns: `js/data/q-kotlin.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: kotlin) vào `js/data/q-kotlin.js`. Id nối tiếp id lớn nhất hiện có của topic (xem `node scripts/qtool.js list js/data/q-kotlin.js`); đọc danh sách đó để **không trùng ý**.

Gợi ý chủ đề: null safety khi gọi code Java (platform type), data class và equals, coroutine vs thread vs virtual thread, structured concurrency và cancellation, extension function, Kotlin với Spring Boot (final class, plugin all-open/jpa).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → ví dụ code ngắn có comment → bảng so sánh/khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: phần lớn mid/senior.

## Luật
- Đọc AGENTS.md (mục 4–6, 13) trước. **Chỉ thêm** vào `js/data/q-kotlin.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-kotlin.js logs/tmp-T1525.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm kotlin-030 đến kotlin-035 vào `js/data/q-kotlin.js`; đã build light index và `node scripts/validate.js` báo `OK — không có lỗi.`
Reviewed-by: kilo (T1525R)
