# T2101R — Fact-check nội dung mới của T2101

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2101 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 12 item mới (`qz-core-043` … `qz-core-054`) trong `git diff HEAD -- js/data/quiz.js`.

Lỗi kỹ thuật đã sửa:

- `qz-core-045`: câu hỏi ghi "(Chọn 2)" và `answer: [1, 3]` nhưng phương án 0 ("So sánh trực tiếp Integer với int bằng toán tử ==") cũng gây NPE khi unboxing `Integer` null → có 3 đáp án đúng. Đã đổi thành "(Chọn 3)", `answer: [0, 1, 3]`, và cập nhật dòng "Đáp án đúng" trong `explain` cho khớp.
- `qz-core-043`: phần "Vì sao đúng" mô tả sai cơ chế (nói object lưu ở bucket X nhưng `get` lại tìm ở bucket Y "tùy thuộc hashCode mới"). Với `hashCode` mặc định của `Object`, cùng một reference luôn ra cùng bucket; lỗi thực tế là hai object `equals()` nhưng khác identity hashCode rơi vào hai bucket khác nhau. Đã viết lại đúng cơ chế `hashCode` chọn bucket rồi `equals` so sánh trong bucket.

Không có lỗi ở các item còn lại (`qz-core-044`, `046`–`054`): đúng với Java 17/21.

`node --check js/data/quiz.js` → SYNTAX_OK. `node scripts/validate.js` không báo lỗi nào cho `js/data/quiz.js`.

Lưu ý (không thuộc phạm vi task, không tự sửa):
- `node scripts/validate.js` hiện còn lỗi từ file của task khác đang dở: `js/data/q-devops.js` lỗi cú pháp "Unexpected identifier 'tắt'", kéo theo `js/data/lessons-devops.js` báo `related` không tồn tại. Vì vậy `node scripts/build-light-index.js --check` không chạy được (throw khi load `q-devops.js`), và `index-light.js` chưa thể cập nhật cho quiz mới. Cần chạy lại `node scripts/build-light-index.js` sau khi `q-devops.js` được sửa.
