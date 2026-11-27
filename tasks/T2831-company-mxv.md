# T2831 — Thêm công ty: Sở Giao dịch Hàng hóa Việt Nam (MXV), Java Backend Middle–Senior

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`

Thêm **1 object** vào `window.COMPANIES` trong `js/data/companies.js` (đúng schema các công ty có sẵn, đọc `techcombank` làm mẫu), `id: 'mxv'`.

Bối cảnh: người học là dev Java 5 năm chuẩn bị phỏng vấn sàn **phái sinh hàng hoá** (kiểu MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD: khớp lệnh, ký quỹ (margin), nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Pet project liên quan: proj-commodity-exchange, proj-clearing-margin, proj-deriv-risk (có thể chưa có trong projects.js).

Nguồn: JD công khai "Java Backend Developer (Middle–Senior)" của MXV trên joboko (11/2026): https://vn.joboko.com/viec-lam-java-backend-developer-level-middle-senior-xvi6824881 (đọc bằng WebFetch nếu có) và trang chính thức mxv.com.vn. **Chỉ ghi điều có nguồn**; quy trình phỏng vấn không có nguồn thì ghi rõ "chưa có báo cáo công khai; dự kiến theo mẫu chung của sàn giao dịch". `focus` dùng id có trong topics.js. `questions` 10–14 câu sát JD (khớp lệnh, FIX, margin, WebSocket market data, GC/latency, deadlock, Kafka, Redis/Hazelcast). `tips` gợi ý dùng pet project phái sinh trong #/projects.

Không sửa entry `lg-cns-vietnam`; nếu thấy nó chỉ nói MES/IoT, thiếu mảng insurance/banking thì ghi Notes.

## Luật
- Đọc AGENTS.md trước (mục liên quan tới loại dữ liệu bên dưới). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM** vào `js/data/companies.js` (chèn trước dấu đóng mảng cuối file); không sửa mục đã có, không sửa file khác. Id nối tiếp id lớn nhất hiện có.
- Kiến thức đúng; số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)"; không chắc thì ghi rõ là ví dụ giả định.

## Nghiệm thu
`node --check js/data/companies.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm object id 'mxv' (Sở Giao dịch Hàng hóa Việt Nam) vào js/data/companies.js, chèn trước dấu đóng mảng cuối file (sau entry 'samsung-sds-vietnam').
- Nguồn: Joboko JD "Java Backend Developer (Level Middle - Senior)" (11/2026) + mxv.com.vn. Quy trình phỏng vấn MXV chưa có báo cáo công khai → ghi rõ là dự kiến theo mẫu chung của sàn giao dịch.
- Đã chạy: node --check js/data/companies.js (OK), node scripts/build-light-index.js (OK), node scripts/validate.js (không lỗi thuộc companies.js). Không commit, không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
