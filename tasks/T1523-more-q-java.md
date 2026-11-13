# T1523 — Bổ sung 8 câu hỏi (collections, core) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: collections, core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất hiện có của topic (xem `node scripts/qtool.js list js/data/q-java.js`); đọc danh sách đó để **không trùng ý**.

Gợi ý chủ đề: câu kinh điển hay bị hỏi mà ngân hàng còn thiếu: equals/hashCode với key mutable, ConcurrentModificationException và fail-fast iterator, TreeMap với Comparator không nhất quán với equals, String immutability và string pool, autoboxing/Integer cache, exception checked vs unchecked khi thiết kế API, generics wildcard (PECS), Optional dùng đúng/sai.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → ví dụ code ngắn có comment → bảng so sánh/khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: phần lớn mid/senior.

## Luật
- Đọc AGENTS.md (mục 4–6, 13) trước. **Chỉ thêm** vào `js/data/q-java.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-java.js logs/tmp-T1523.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `collections-036` đến `collections-039` và `core-039` đến `core-042` vào `js/data/q-java.js`; sinh lại `js/data/index-light.js`. `node scripts/validate.js` trả `OK — không có lỗi.`
Reviewed-by: kilo (T1523R)
