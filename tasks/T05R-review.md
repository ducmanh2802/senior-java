# T05R — Fact-check nội dung mới của T05

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T05 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- design-013 (đối soát thanh toán): bỏ khẳng định settlement chung qua tài khoản NHNN và ràng buộc số dư cuối phiên; phụ thuộc scheme/switch.
- design-014 (cấp ID): làm rõ sequence cấp đầu block, khoảng cách INCREMENT BY, khả năng có gap và điều kiện không tái cấp block.
- design-015 (matching engine): replay chỉ deterministic khi journal lưu đủ input có thứ tự và dữ liệu/quyết định bên ngoài.
- design-018 (search QPS): sửa mô tả LIKE prefix để phản ánh khả năng dùng index; 17.000 QPS được trình bày là giả định peak, không phải giới hạn kỹ thuật cố định.
- design-019 (logging): Kafka hấp thụ spike chỉ trong ngưỡng dung lượng/retention; nêu lag, disk buffer và chính sách khi buffer đầy.
- design-020 (rate counter): ghi rõ bucket phút là xấp xỉ, INCR/TTL cần nguyên tử và retry cần idempotency.
- architecture-020 (clean architecture): sửa hướng phụ thuộc; adapter implement port do domain sở hữu.
- architecture-021 (ArchUnit): sửa điều kiện empty should và tên cấu hình/API.
- architecture-022 (multi-tenancy): xác thực tenant từ host/claim, bỏ fallback system, làm rõ RLS trong transaction/pool và kiểm soát schema.
