# T2663R — Fact-check nội dung mới của T2663

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2663 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa markup cho 3 câu hỏi mới (modern-074, modern-075, modern-076):
- modern-074 (Record DTO/JPA projection): Bọc các thuật ngữ kỹ thuật bằng `{{...}}` như `{{DTO}}`, `{{projection}}`, `{{JPA entity}}`, `{{Hibernate}}`, `{{no-arg constructor}}`, `{{mutable state}}`, `{{dirty checking}}`, `{{canonical constructor}}`, `{{reflection}}`, `{{Lazy loading}}`, `{{proxy}}`, `{{final}}`, `{{@GeneratedValue}}`, `{{persist}}`, `{{Spring Data JPA}}`, `{{record projection}}`, `{{constructor projection}}`, `{{I/O}}`, `{{Interface projection}}`, `{{serialize}}`, `{{NPE}}`, `{{nullable}}`, `{{downstream}}`, `{{equals}}/{{hashCode}}`, `{{entity}}`, `{{read-heavy}}`, `{{GC pause}}`.
- modern-075 (Sealed interface + switch pattern matching): Bọc các thuật ngữ bằng `{{...}}` như `{{sealed interface}}`, `{{switch pattern matching}}`, `{{exhaustiveness}}`, `{{compile-time}}`, `{{permits}}`, `{{pattern matching}}`, `{{Timeout}}`, `{{compile error}}`, `{{default}}`, `{{guard when}}`, `{{record pattern}}`, `{{domain model}}`, `{{enum}}`, `{{compile check}}`.
- modern-076 (SequencedCollection Java 21): Bọc các thuật ngữ bằng `{{...}}` như `{{SequencedCollection}}`, `{{getFirst}}/{{getLast}}/{{reversed}}`, `{{List}}`, `{{IndexOutOfBounds}}`, `{{Deque}}`, `{{Collections.reverse}}`, `{{stream reverse}}`, `{{SequencedSet}}`, `{{SequencedMap}}`, `{{firstEntry}}/{{lastEntry}}`, `{{view}}`, `{{backed}}`, `{{snapshot}}`, `{{NoSuchElementException}}`, `{{isEmpty}}`, `{{Set}}`, `{{pattern matching}}`, `{{record}}`, `{{virtual thread}}`.

Nội dung kỹ thuật đã đúng (Java 21, Spring Boot 3.x, Hibernate 6), không cần sửa đổi kiến thức. Validate OK.
