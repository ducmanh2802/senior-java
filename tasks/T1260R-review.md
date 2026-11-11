# T1260R — Fact-check nội dung mới của T1260

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1260 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ `js/data/q-devops.js` (devops-001 → devops-024). Kết quả:

- `node scripts/validate.js` → OK — không có lỗi.
- Kiểm tra markup: không có backtick hay `${` chưa escape bên trong template literal; toàn bộ lệnh/tham số đã bọc bằng `{{...}}`.
- Kiến thức kỹ thuật đúng: các con số (layer 95%, fat jar 80–150 MB, image 120→45 MB), cgroup v2 (`cpu.max`/`memory.max`), JDK container-support (8u191/10, cgroup v2 từ 15/11.0.16/8u372), HPA công thức & timing, probe groups, graceful shutdown, expand-contract, Flyway Community không có undo — đều chính xác.

Sửa markup (không đổi nội dung):
- `devops-010`: `Jenkins chạy helm upgrade` → `Jenkins chạy {{helm upgrade}}`.
- `devops-011`: `chạy helm template` và `kubectl diff` → bọc `{{helm template}}`, `{{kubectl diff}}`.

Các phần "Ví dụ đời thực" mới (devops-001, 003, 005, 007, 008, 009, 010, 011, 012) đều tự nhất quán: số liệu, tên service, công cụ và kết quả đo được khớp với phần đáp án chính. Không có lỗi kiến thức.
