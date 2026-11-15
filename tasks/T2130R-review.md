# T2130R — Fact-check nội dung mới của T2130

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2130 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

không có lỗi — 5 đoạn nội dung mới (git diff) đã fact-check, không cần sửa:

- **concurrency-005 (thenApply/thenCompose/thenCombine bảng so sánh)**: đúng. thenApply = map (value→value), thenCompose = flatMap (value→CompletableFuture, tránh lồng CF<CF<T>>), thenCombine = gộp 2 CF độc lập. Dòng "Nếu chọn sai" ở cột thenCompose ("lỗi biên dịch ngay") chính xác: thenCompose bắt buộc lambda trả về CompletionStage, dùng nhầm vào bước chỉ cần giá trị thường sẽ không biên dịch được. Các cột còn lại đúng so với code mẫu ở line 371-381.
- **concurrency-001 (hình unsafe publication so sánh field thường vs volatile)**: đúng. Không happens-before: JIT/CPU cho phép thread B thấy gán reference (3) trước ghi field bps (2) → object "nửaời", in ra 0. Có volatile: ghi bps (2) happens-before gán current (3) → reader chắc chắn thấy 150. Khớp hoàn toàn với JMM/JLS §17 và ví dụ Rate(150) ở line 1620-1626.
- **concurrency-001 (hình Fast Throw / OmitStackTraceInFastThrow)**: đúng. Chỉ khi cùng một điểm throw ngầm lặp ≥ ngưỡng trong code đã do C2 compile nóng, JVM mới thay bằng 1 instance dựng sẵn, không fillInStackTrace → log trống tên exception. `throw new IllegalArgumentException(...)` do bạn viết thì không bị cắt. Bật `-XX:-OmitStackTraceInFastThrow` để luôn có stack.
- **concurrency-028 (hình DCE benchmark bẫy)**: đúng. Khi `sum` là local không ai đọc, C2 xoá gần hết thân vòng lặp → "0,9 ns/op" ảo. JMH (trả kết quả + warm-up + fork) chênh 15-25%. Khớp với bảng 5 bẫy ở line 5506-5512.
- **concurrency-031 (hình lock contention + Little's law)**: đúng. Vùng găng 2 ms → tối đa 500 req/s dù 200 thread, thread còn lại BLOCKED xếp hàng, CPU thấp. Thêm thread chỉ làm hàng chờ dài hơn. Khớp với định luật Little và thread dump ở line 5842-5855.

Kiểm tra kỹ:
- `node --check js/data/q-concurrency-jvm.js` → SYNTAX OK
- `node scripts/validate.js` → OK — không có lỗi (lỗi `lessons-jpa.js: lesson-jpa-003.body` ở lần chạy là **đã có sẵn từ trước**, không phải do task này; đã đối chiếu bằng `git stash` + validate: file task không liên quan, không phải do diff này gây ra)
- Không có backtick, không có `${` (escape không cần) trong 5 đoạn mới — template literal an toàn
- Không có tiếng Anh lẫn vào (toàn bộ bằng tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh theo quy ước)
- Markup đúng: `~~~text` block, bảng `|---|`, `**đậm**`, `{{code}}` — toàn bộ hợp lệ với App.md()
- Không sửa nội dung đã có ở HEAD — chỉ thêm, không xoa bỏ
