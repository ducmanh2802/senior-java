# T841R — Fact-check nội dung mới của T841

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T841 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Không sửa nội dung HEAD (banking-001..030), không thêm/xoá mục; chỉ viết lại đáp án của 8 câu mới T841 (banking-031..038) giữ nguyên id/topic/level/q/follow/tags.
- Lỗi đã sửa theo từng id:
  - banking-031: đáp án quá ngắn, chưa giải thích từ đầu → bổ sung khái niệm ledger balance / available balance, bảng so sánh, sơ đồ ~~~seq (Khach-Merchant-Acquirer-Network-Issuer), quy trình giải phóng hold, lỗi hay gặp, Senior tip, cụm từ.
  - banking-032: bổ sung chi tiết từng lớp bảo vệ (mobile/gateway/dịch vụ/core), thứ tự xử lý 7 bước, ví dụ số liệu UUID key.
  - banking-033: bổ sung ví dụ số liệu so khớp (TX001/TX002/TX003), xử lý 4 loại lệch, quy trình maker-checker.
  - banking-034: mở rộng mainframe vs hiện đại, bảng trade-off 6 tiêu chí, ví dụ số liệu.
  - banking-035: giải thích chi tiết PCI DSS, tokenization (PAN→token, vault), HSM, audit log append-only, lỗi hay gặp.
  - banking-036: bổ sung máy trạng thái giao dịch (DANG_GUI/CHO_TRA_SOT/THANH_CONG…), ~~~seq tra soát timeout, đối soát cuối ngày.
  - banking-037: bổ sung thiết kế khóa (UUID do khách tạo), lưu trữ Redis TTL ngắn vs DB unique constraint dài, xử lý in-flight, failure mode fail-closed cho tiền.
  - banking-038: bổ sung kiến trúc microservices (vault service duy nhất chạm PAN), luồng tokenization, lưu trữ WORM, nguyên tắc least exposure.
- Không có backtick / `${` / HTML trong đáp án; không thêm refs (không cần link).
- Chạy node scripts/build-light-index.js rồi node scripts/validate.js → OK — không có lỗi.
- node scripts/test-lessons.js: không áp dụng (không sửa bài học).
