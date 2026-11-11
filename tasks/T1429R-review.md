# T1429R — Fact-check nội dung mới của T1429

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1429 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa 1 lỗi kỹ thuật trong lesson-devops-001 (mục "Lỗi hay gặp trên production", bullet "Phụ thuộc vào job không tồn tại"): GitHub Actions/GitLab CI xác thực DAG ngay khi lập lịch — job thiếu dependency bị từ chối chạy ngay, KHÔNG phải "báo lỗi sau khi pipeline chạy vài phút". Sửa về mô hình đúng (fail-fast tại DAG validation).
- Kiểm tra lại phần mới còn lại của T1429 (thuật toán Kahn/in-degree, YAML cache key, quality gate + waiver deterministic, 6 câu hỏi phỏng vấn, 2 câu trắc nghiệm): đúng kỹ thuật, markup hợp lệ (~~~ fence, {{ }} khớp, không backtick, không ký tự lạ), không liên quan file khác.
- node scripts/test-lessons.js lesson-devops-001 → OK (9/9 exercises pass, JDK 17).
- Chưa đạt validate.js in "OK — không có lỗi" do lỗi LƯỢT TRUỚC không thuộc task này: js/data/q-soft.js (HEAD syntax OK, working tree bị chèn `` `git log ...`` trong template literal → lỗi cú pháp) chặn node scripts/build-light-index.js → js/data/index-light.js bị bản cũ so với dữ liệu. File q-soft.js không sở hữu của T1429R, không được sửa theo luật 3 AGENTS.md. lessons-devops.js riêng không báo lỗi nào khi chạy validate.js.