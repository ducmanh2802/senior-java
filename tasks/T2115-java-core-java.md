# T2115 — Gắn tag 'core' cho ~60 câu lõi trong q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2105

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-java.js` (topic: core, collections, modern), chọn **khoảng 60 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: equals/hashCode, String, immutability, exception, generics, HashMap/ConcurrentHashMap nội bộ, ArrayList vs LinkedList, Stream, Optional, record, sealed, virtual threads cơ bản. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-java.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Da them tag 'core' vao 60 cau trong js/data/q-java.js (topic core, collections, modern). Tong so cau trong file khong doi (192), chi sua mang tags (them 'core'), khong sua q/a/follow, khong xoa cau.

Cau da gắn 'core' (60):
core-001, core-002, core-004, core-005, core-006, core-007, core-013, core-014, core-015, core-017, core-018, core-022, core-025, core-029, core-032, core-041, core-051, core-054, core-057, core-058, core-059, core-060, core-063, core-064, core-065, core-066, core-067, core-068,
collections-001, collections-002, collections-003, collections-004, collections-011, collections-015, collections-018, collections-024, collections-031, collections-033, collections-035,
modern-002, modern-008, modern-011, modern-013, modern-015, modern-020, modern-026, modern-028, modern-029, modern-031, modern-039, modern-041, modern-043, modern-044, modern-045, modern-050, modern-058, modern-064, modern-065, modern-067.

Chuyen de bao gom: equals/hashCode, String/immutability, exception, generics/reflection, HashMap/ConcurrentHashMap noi bo, ArrayList vs LinkedList, Stream, Optional, record, sealed, virtual threads co ban. Uu tien level mid/senior, cau co da tap tom tat + tra loi mau, khong chon 2 cau trung y.
Reviewed-by: kilo (T2115R)
