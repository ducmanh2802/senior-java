# T1700R — Fact-check nội dung mới của T1700

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1700 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa các lỗi kỹ thuật (markup/typo/số liệu/API) sau, không chỉnh văn phong/độ dài/bố cục, không sửa nội dung HEAD:

**core-049** (generics/type erasure):
- Câu hỏi: `List<Object>` ở runtime → `List (raw type)` (erasure chỉ còn raw `List`, không còn `List<Object>`).
- Typo: `kiểuunchecked` → `kiểu unchecked`.
- Varargs: sửa khẳng định sai "`m(1,2)` với `T=Integer` sinh `Object[]`" — Integer reifiable nên sinh `Integer[]`; Object[] chỉ sinh khi type argument non-reifiable.
- Loại số liệu fabricate `0.02%/100% worker` → ghi `(số liệu kịch bản minh hoạ)`.
- `Collections.emptyList() trả List<Object> raw` → `(kiểu inferred)` (trả `List<Object>` suy luận, chỉ raw type mới warning).

**core-050** (PECS): typo `copy giảm 0` → `copy giảm đến 0`.

**core-051** (Optional):
- `flatMap(Optional::stream) (Java 9)` → `(Java 8)` (feature này có trong Java 8).
- `WRITE_NULL_MAP_VALUES=false` → `@JsonInclude(JsonInclude.Include.NON_NULL)` (feature cũ sai phạm vi; WRITE_NULL_MAP_VALUES chỉ điều khiển null MAP values, không phải field null).

**core-052** (exception hierarchy): lỗi nghiêm trọng — `abstract class AppException extends RuntimeException` → `extends Exception` (checked exception không thể là subclass của unchecked exception; nếu parent là RuntimeException thì tất cả con đều unchecked, trái với comment "checked..."). Đồng thời sửa comment `BusinessException`: `checked hoặc unchecked tuỳ recoverable` → `checked: nghiệp vụ có thể khôi phục`.

**core-053** (equals/hashCode): typo `SYMMETRY ĐƯỢC GỮ` → `SYMMETRY ĐƯỢC BẢO TOÀN`.

**modern-054 / core-054 / core-055**: không có lỗi kiến thức.
