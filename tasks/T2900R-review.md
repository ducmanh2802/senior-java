# T2900R — Fact-check nội dung mới của T2900

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2900 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi trong q-scenario.js (nội dung mới của T2900):

1. **scenario-194**: Sửa sequence diagram — actor names và messages từ tiếng Việt sang tiếng Anh (theo spec AGENTS.md: actors tên ngắn, text ≤ 60 ký tự, không dùng tiếng Việt trong seq diagram). Actors: `Replica(DR)`→`ReplicaDR`, `LB/DNS`→`LBDNS`, `Region cũ`→`OldRegion`.

2. **scenario-195**: Sửa lỗi kỹ thuật — "StringBuilder bị boxing" không đúng (StringBuilder là object mutable, không bị boxing). Thay bằng "String.format / nối chuỗi bằng + trong vòng lặp, boxing primitive".

3. **scenario-196**: Sửa sequence diagram — actor names và messages từ tiếng Việt sang tiếng Anh (`Đối tác`→`Partner`, `API`→`API`, `Queue`→`Queue`, `Service`→`Service`; note text cũng dịch sang Anh).

4. **scenario-198**: Sửa lỗi kỹ thuật — JFR event `jdk.CPULoad` không tồn tại. Thay bằng `jdk.ExecutionSample` (CPU profiling sample event chuẩn).

Lưu ý: `node scripts/validate.js` vẫn báo lỗi do `quiz-ccdv-1.js` (file không thuộc task này, thiếu `);` cuối file) và `index-light.js` cũ (không rebuild được do lỗi quiz). File q-scenario.js đã pass syntax check (`node --check`) và không có lỗi validator riêng.
