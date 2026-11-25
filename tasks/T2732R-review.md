# T2732R — Fact-check nội dung mới của T2732

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2732 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Nội dung mới của T2732 trong file này là lesson-collections-013 (TreeMap nâng cao: subMap/headMap/tailMap, Comparator, ConcurrentSkipListMap) và lesson-collections-014 (fail-fast, modCount, CME, iterator an toàn) — diff so với HEAD chỉ thêm 2 bài này ở cuối file; 001–012 đã có ở HEAD, không sửa.

Không có lỗi kiến thức nào cần sửa: API/flag/mặc định/số liệu đều đúng (subMap half-open [from,to), headMap exclusive, tailMap inclusive, ConcurrentSkipListMap weakly consistent + không cho null key, modCount/expectedModCount ở next(), removeIf tự quản lý modCount, subMap().size() O(k) không O(1)...). Markup sạch: không backtick, không `${`, fences ~~~ đóng, tiêu đề ### không thụt, related ids (collections-001/003/005/007) đều có thật trong q-java.js.

Xác nhận:
- `node scripts/validate.js js/data/lessons-collections.js` → OK — không có lỗi.
- `node scripts/test-lessons.js lesson-collections-013` → RESULT 4/4 (starter không pass, reference pass 4/4).
- `node scripts/test-lessons.js lesson-collections-014` → RESULT 4/4 (starter không pass, reference pass 4/4).
- Không chạy `node scripts/build-light-index.js` vì không thêm/sửa bài học nào (index-light.js đã đồng bộ với dữ liệu hiện tại; validate toàn repo không báo index-light cũ).

Lỗi validate.js còn lại của toàn repo (quiz-ops.js qz-ai-051…060 tiêu đề ### thụt/lỗi {{}}, lessons-jpa.js lesson-jpa-020 body < 2500 ký tự) nằm ở file thuộc tác vụ khác, không trong quyền sở hữu của task này nên không sửa (quy tắc 3 AGENTS.md).
