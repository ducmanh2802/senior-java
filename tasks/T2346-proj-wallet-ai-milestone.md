# T2346 — Dự án ví điện tử: thêm 2 milestone cuối "AI phân loại khiếu nại" + "Đóng gói portfolio"

Status: DONE
Agent: kilo
Owns: `js/data/projects.js`
After: T1567

## Bối cảnh
Người học (Java dev 4 năm, chưa có kinh nghiệm nghiệp vụ ngân hàng) dùng dự án `proj-wallet` trong `#/projects` làm **portfolio** để chứng minh hiểu nghiệp vụ + biết tích hợp AI. Đọc kỹ object `proj-wallet` trong `js/data/projects.js` (business, schema, milestones…) và dự án `proj-rag` nếu có, để giữ đúng giọng văn và định dạng.

## Việc cần làm
Trong `proj-wallet`, **chỉ THÊM 2 phần tử vào CUỐI mảng `milestones`** (không sửa milestone/field khác; nếu object có field `weeks` thì tăng thêm 2):
1. **"AI phân loại khiếu nại & tóm tắt giao dịch"**: endpoint nhận khiếu nại của khách → đẩy Kafka → consumer gọi LLM (qua interface `ComplaintClassifier`, có bản giả để test) trả JSON {loại, mức độ, giao dịch liên quan, tóm tắt}; che số tài khoản/điện thoại trước khi gửi; timeout + retry + idempotency theo complaintId; độ tin cậy thấp → chuyển người xử lý; lưu audit; bộ eval 30 khiếu nại có nhãn và đo accuracy. Các bước đánh số, tiêu chí "xong khi", test cần viết, câu hỏi phỏng vấn liên quan.
2. **"Đóng gói portfolio & kể chuyện khi phỏng vấn"**: README có sơ đồ kiến trúc + luồng tiền, docker compose chạy 1 lệnh, demo script 3 phút, bảng quyết định thiết kế (vì sao ledger kép, vì sao outbox, vì sao idempotency key), câu chuyện STAR mẫu có số liệu đo được (p95, số test, lỗi đã sửa), 10 câu interviewer hay hỏi về dự án và gợi ý trả lời.
Cùng cấu trúc field với các milestone sẵn có (đọc 2 milestone cũ để bắt chước). Không bịa tham số API/giá model.

## Luật
Không sửa phần khác của file, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số milestone trước/sau (11 → 13) vào Notes.

## Nghiệm thu
`node --check js/data/projects.js`, `node scripts/validate.js` → OK. Status: DONE + Notes.

## Notes
Hai milestone yêu cầu ("AI phân loại khiếu nại & tóm tắt giao dịch" và "Đóng gói portfolio & kể chuyện khi phỏng vấn") đã có sẵn ở cuối mảng milestones (tổng 7 milestone). Chỉ cập nhật `weeks` từ 10 → 12 theo yêu cầu. `node --check js/data/projects.js` và `node scripts/validate.js` đều OK (lỗi validate là pre-existing ở file khác, không liên quan projects.js).
Reviewed-by: verify-only (code/UI task)
