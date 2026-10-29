# T362 — Collections: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`

Thêm **8 câu** topic collections, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- equals/hashCode sai làm HashMap/HashSet mất phần tử
- ConcurrentModificationException và cách xoá phần tử khi duyệt
- LinkedHashMap làm LRU cache
- Comparable vs Comparator, sort ổn định
- Arrays.asList, List.of và unmodifiable: bẫy hay gặp
- ArrayDeque vs Stack vs LinkedList
- EnumMap/EnumSet và khi nào dùng
- Chọn collection cho bài toán thực tế (tra cứu, thứ tự, trùng lặp)

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Thêm 8 câu collections-019..026 (5 mid, 2 senior, 1 lead): HashMap merge/computeIfAbsent, Comparable vs Comparator, chọn collection, Big-O/contains O(n²), thứ tự duyệt HashMap/Set.of, collection view/subList, initial capacity/newHashMap (Java 19), guideline anti-pattern. Các gợi ý đã có (CME, LRU, Arrays.asList, ArrayDeque, EnumMap, equals/hashCode) được thay bằng góc khác. Không thêm refs.
Reviewed-by: claude (subagent; validate OK)
