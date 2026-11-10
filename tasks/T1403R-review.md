# T1403R — Fact-check nội dung mới của T1403

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1403 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-banking-001 (line 27): sửa số liệu vô căn cứ về sai số tích lũy — "1 triệu giao dịch/ngày × 365 ngày tạo chênh lệch vài trăm đến vài nghìn đồng" sai toán (1M × 365 × 1e-10 ≈ 0.0365). Thay bằng mô tả không con số cụ thể.
- lesson-banking-001 (line 44): xoá từ Anh "(always)" lẫn vào câu tiếng Việt.
- lesson-banking-001 (line 168, check Q4): sửa giải thích sai kỹ thuật — {{BigDecimal.valueOf(0.1)}} nội bộ dùng {{Double.toString(0.1)}} = "0.1" nên kết quả cũng chính xác, không phải "Sai"; giữ đáp án C là quy ước rõ ràng nhất.
- lesson-banking-002: nội dung mới (cơ chế từng bước, lỗi hay gặp, ví dụ phân loại, liên hệ phỏng vấn) đúng kỹ thuật, không cần sửa.
- Không sửa nội dung đã có ở HEAD (lessons 003–007). Không thêm/xoá mục.
- Chạy: node scripts/build-light-index.js → OK; node scripts/validate.js → OK; node scripts/test-lessons.js → 220/220.
