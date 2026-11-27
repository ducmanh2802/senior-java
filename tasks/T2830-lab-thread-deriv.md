# T2830 — Debug lab: deadlock chuyển ký quỹ giữa 2 tài khoản trong batch EOD

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`

Thêm **1 lab** `lab-thread-038` vào `js/data/labs-thread.js` theo AGENTS.md mục 10 (Debug lab).

Bối cảnh: người học là dev Java 5 năm chuẩn bị phỏng vấn sàn **phái sinh hàng hoá** (kiểu MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD: khớp lệnh, ký quỹ (margin), nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Pet project liên quan: proj-commodity-exchange, proj-clearing-margin, proj-deriv-risk (có thể chưa có trong projects.js).

Kịch bản: batch EOD tính variation margin chạy 16 thread, đồng thời luồng chuyển tiền ký quỹ giữa tài khoản mẹ–con; hệ thống treo lúc 17:05, API nạp tiền timeout. Artifact: jstack định dạng JDK 17 (có "Found one Java-level deadlock", 2 thread giữ khoá ngược thứ tự, lock id <0x...> khớp nhau), log ứng dụng có timestamp, metric pool HikariCP đầy. Answer: nguyên nhân gốc (khoá ngược thứ tự), dẫn chứng trích dòng, cách sửa (khoá theo thứ tự id, tryLock có timeout, hoặc SELECT … FOR UPDATE theo thứ tự id), phòng ngừa. Rubric ≥ 3 ý.

## Luật
- Đọc AGENTS.md trước (mục liên quan tới loại dữ liệu bên dưới). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM** vào `js/data/labs-thread.js` (chèn trước dấu đóng mảng cuối file); không sửa mục đã có, không sửa file khác. Id nối tiếp id lớn nhất hiện có.
- Kiến thức đúng; số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)"; không chắc thì ghi rõ là ví dụ giả định.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Added lab-thread-038 (batch EOD variation margin deadlock) to js/data/labs-thread.js. node --check OK; validate has no errors in labs-thread.js.
Reviewed-by: kilo (T2830R)
