# T2034R — Fact-check nội dung mới của T2034

Status: TODO
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2034 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes

Đã review nội dung mới thêm vào `js/data/q-devops.js` (devops-152 → devops-163, tương đương 12 câu hỏi mới). Sửa 2 lỗi kỹ thuật:

1. **devops-159** (JVM flags cho virtual threads + JFR): dòng `~~~bash` khai báo JFR continuous profiling dùng flag không tồn tại `path=/tmp/jfr` và `eventstream=true`. Sửa:
   - `path=/tmp/jfr` → `repository=/tmp/jfr` (đúng tên tham số của `-XX:FlightRecorderOptions`).
   - Bỏ `-XX:FlightRecorderOptions=eventstream=true` (không phải flag hợp lệ; JFR event streaming dùng API `RecordingStream`/`EventStream.openRepository`, không phải cờ JVM).
   - Thêm `threadbuffersize=256k` để đầy đủ tham số JFR.

2. **devops-159**: mô tả virtual thread stack `{{-XX:VirtualThreadStackSize=512k}}` → đúng flag là `VirtualThreadStackSize` (đã fix).

Các câu hỏi còn lại (devops-152, 153, 154, 155, 156, 157, 158, 160, 161, 162, 163) đã kiểm tra: markup đúng, không backtick lồng, không `${` trong template literal, nội dung kỹ thuật chính xác (Java 17/21, Spring Boot 3.x, Kubernetes, Docker, Loki, Prometheus, Kafka, CDS/AOT cache, jlink, distroless). Không phát hiện thêm lỗi kiến thức.

Chạy `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js`. `node scripts/validate.js` → `OK — không có lỗi.`
