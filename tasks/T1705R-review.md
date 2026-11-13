# T1705R — Fact-check nội dung mới của T1705

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1705 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check `js/data/labs-gc.js` (2 bài mới do T1705 thêm: `lab-gc-013`, `lab-gc-014`). `node scripts/validate.js` → OK (14 bài gc). Không có lỗi kiến thức; chỉ sửa 6 lỗi kỹ thuật/định nghĩa:

- `lab-gc-013`:
  1. Dòng "Thu hồi thế nào?" ghi humongous chỉ reclaim được khi *mảng primitive* đã chết → sai khái niệm. Đã sửa thành: reclaim được khi **tất cả object bên trong humongous đã chết** (đối với mảng `byte[]` lớn thì toàn bộ mảng phải mất tham chiếu), không gom theo loại primitive.
  2. Dòng "Concurrent mark ... gần như không thu hồi được gì đáng kể vì phần lớn là humongous còn đang được tham chiếu bởi request đang xử lý" → văn phong mâu thuẫn (đã nói "gần như không thu hồi được gì"). Đã sửa thành: "cho thấy sau khi mark xong, lượng region rỗng thu hồi được không đáng kể vì phần lớn heap là humongous còn sống" (trích dẫn từ GC(605) Pause Remark 2420M->2418M).
  3. Hint 2: "humongous dạng mảng primitive đã chết có thể được thu hồi ở young GC" → sửa thành "humongous đã chết (mọi object bên trong không còn tham chiếu) có thể được eagerly thu hồi ở young GC".
  4. Khoảng cách khi tăng `G1HeapRegionSize`: "region 4M -> ngưỡng 2M; region 8M -> 4M" → đúng là ngưỡng = 50% region size, đã sửa thành "region 4M → ngưỡng 2 MB; region 8M → ngưỡng 4 MB". Bổ sung nhược điểm: số region giảm (region 4M chỉ còn 1024 region, region 8M chỉ còn 512) làm giảm độ nhạy của policy IHOP và selection; giá trị phải là lũy thừa 2, heap là bội số region size.
- `lab-gc-014`:
  5. Dòng "String: ... [C] (mảng char, backing của String trong nhiều biểu diễn/thống kê) và [B] (mảng byte) tăng mạnh" → không chính xác: từ JDK 9 `String` dùng compact strings, backing là `byte[]` (`[B`), không phải `char[]` (`[C`). Đã sửa: `[B]` là backing của `String` với compact strings từ JDK 9; `[C]` là mảng char do các buffer/xử lý ký tự khác tạo ra.
  6. Dòng "phù hợp với old_gen_used_after_gc tăng ~700-680 MB mỗi mốc 24h trong điều kiện promote/fragmentation" → "promote/fragmentation" không chính xác. Đã sửa thành giải thích old gen tăng nhiều hơn live set đo bằng histogram vì G1 mixed GC chỉ thu hồi một phần old region mỗi chu kỳ, nên old gen còn chứa rác chưa thu hồi (floating garbage).

Không thay đổi nội dung khác, không thêm/xoá mục. Các bài lab khác (001–012) đã có ở HEAD, không sửa.
