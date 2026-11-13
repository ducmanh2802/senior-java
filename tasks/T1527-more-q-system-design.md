# T1527 — Bổ sung 6 câu hỏi (design) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: design) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất hiện có của topic (xem `node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách đó để **không trùng ý**.

Gợi ý chủ đề: SOLID áp dụng khi refactor code thật, Strategy vs if-else, Factory/Builder khi nào cần, Observer/event trong Spring, composition over inheritance, anti-pattern God class/anemic domain (topic: design).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → ví dụ code ngắn có comment → bảng so sánh/khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: phần lớn mid/senior.

## Luật
- Đọc AGENTS.md (mục 4–6, 13) trước. **Chỉ thêm** vào `js/data/q-system-design.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-system-design.js logs/tmp-T1527.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu hỏi topic `design` vào `js/data/q-system-design.js`: `design-037` (senior, SOLID áp dụng khi refactor service thanh toán), `design-038` (mid, Strategy pattern + Spring loại bỏ if-else), `design-039` (mid, Factory/Builder/static factory/constructor, bẫy Lombok @Builder), `design-040` (senior, Observer/event trong Spring, @EventListener/@TransactionalEventListener, khi dùng event vs gọi trực tiếp/broker), `design-041` (mid, Composition over inheritance refactor cây kế thừa), `design-042` (senior, anti-pattern God class và Anemic Domain Model, nhận biết và refactor từng bước).
- Mỗi câu có `**Tóm tắt:**`, giải thích thuật ngữ từng bước, ví dụ code ngắn, bảng so sánh/khi nào dùng, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, `follow` 3 câu.
- Kiểm tra: `node --check js/data/q-system-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo PATH pre-existing, không phải lỗi). Không commit, không sửa file ngoài phạm vi.

Reviewed-by: kilo (T1527R)
