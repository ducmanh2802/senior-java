# T107 — Tình huống thực tế lấy cảm hứng từ kênh "Tips Javascript" (viết lại cho Java)

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`
After: T104

**Dùng tìm kiếm web.** Kênh YouTube/blog "Tips Javascript" (anonystick — tipsjavascript, anonystick.com) có nhiều video về tình huống backend thực tế (flash sale, oversell tồn kho, Redis, Kafka, idempotency, rate limit, cache, thanh toán, phỏng vấn system design…).
1. Lập danh sách **15–25 video/bài** về tình huống backend thực tế của kênh: tiêu đề, link, tình huống cốt lõi. Ghi vào `## Notes` của task này.
2. Đối chiếu với các câu `scenario-*` và `design-*` đã có (đọc mọi `q:` trong js/data/q-scenario.js và q-system-design.js). Chọn **8–10 tình huống CHƯA có** hoặc có góc nhìn mới.
3. Viết 8–10 câu mới `scenario-0xx` (tiếp nối số lớn nhất) trong `q-scenario.js`: **tự viết bằng lời của bạn, lời giải bằng Java 17/21 + Spring Boot 3** (không dịch/chép nội dung kênh). Chuẩn chất lượng AGENTS.md mục 4–6 (Tóm tắt, ###, code Java ngắn, bảng trade-off, pitfall production, Senior tip, follow 2–3).
4. Mỗi câu có `refs` (AGENTS.md mục 13) gồm **link video/bài gốc của kênh làm nguồn cảm hứng** (`type: 'video'` hoặc `'article'`, note: "Tình huống gốc (Node.js) — lời giải ở đây viết cho Java") + 1 tài liệu chính thức. Chỉ dùng link bạn đã thấy trong kết quả tìm kiếm.
5. `node scripts/validate.js q-scenario.js` → OK; chạy `node scripts/check-links.mjs q-scenario.js` nếu môi trường có mạng.

## Notes

### Nguồn backend đã rà soát (tên — link — tình huống cốt lõi)

Các link dưới đây là bài viết/video nhúng của Anonystick; tình huống trong ngân hàng được viết lại độc lập theo Java/Spring, không dịch hay sao chép lời giải. Một số kết quả của kênh được tìm thấy qua trang tag backend/Redis khi site không hiển thị URL bài riêng trong kết quả tìm kiếm.

1. [Flash Sale: chặn bot và ba kịch bản đặt hàng](https://anonystick.com/blog-developer/chuong-27-ddd-vetautetcom-flash-sale-anh-oi-lam-sao-chan-duoc-bon-bot-3-kich-ban-tuy-chon-dat-hang-va-khau-tru-hang-ton-kho-cua-level-lap-trinh-vien-2025122477102345) — bot, quota, đặt hàng đồng thời.
2. [Đằng sau nút đặt hàng: flash sale chịu tải cao](https://anonystick.com/blog-developer/dang-sau-nut-dat-hang-cua-shopee-he-thong-flash-sale-chiu-tai-cao-viet-bang-go-va-java-2026070987834605) — oversell, Redis/Kafka, outbox, saga.
3. [Kafka ở cấp độ doanh nghiệp](https://anonystick.com/blog-developer/kafka-o-cap-do-doanh-nghiep-bai-viet-nay-la-du-hay-them-vao-cv-cua-chung-ta-2025020642404229) — consistency giữa cache và DB, message processing.
4. [Khấu trừ tồn kho bằng ba cách](https://anonystick.com/blog-developer/khau-tru-hang-ton-kho-thi-backend-se-chon-cach-nao-trong-3-cach-sau-day-2025022692398239) — conditional update, CAS và duplicate deduction.
5. [Redis Lua Script vs Distributed Lock](https://anonystick.com/blog-developer/redis-lua-script-vs-distributed-lock-2026050722120202) — hot key, atomic script, lock contention.
6. [Đảm bảo dữ liệu không trùng khi đồng thời cao](https://anonystick.com/blog-developer/cach-dam-bao-du-lieu-khong-bi-trung-lap-trong-cac-tinh-huong-dong-thoi-cao-2024121189484235) — unique constraint và idempotency.
7. [Redis: ba vấn đề lớn khi sử dụng cache](https://anonystick.com/blog-developer/redis-3-van-de-lon-co-the-mat-viec-khi-su-dung-cache-voi-shoppee-2021041335727914) — avalanche, breakdown, penetration và stale cache.
8. [Redis Cart: String hay Hash](https://anonystick.com/blog-developer/toi-su-dung-redis-de-luu-thong-tin-cart-gio-hang-nhung-string-hay-hash-thi-tot-hon-tinh-huong-nhu-sau-2025051719432550) — read-modify-write và cập nhật từng field.
9. [Upload Large File](https://anonystick.com/blog-developer/phan-tich-chuyen-sau-ve-chuc-nang-upload-large-file-den-luot-backend-nho-va-anh-em-frontend-2025050781640703) — chia part, retry và ghép file dung lượng lớn.
10. [Đảm bảo thứ tự khi nhiều luồng dùng Message Queue](https://anonystick.com/blog-developer/viec-dam-bao-thu-tu-khi-tham-gia-boi-nhieu-luong-khi-su-dung-messagequeue-mq-2025082744642665) — partition key, ordering và consumer concurrency.
11. [Thiết kế hệ thống tặng coupon tăng đột biến](https://anonystick.com/blog-developer/nodejs-cach-thiet-ke-he-thong-tang-phieu-giam-gia-tang-dot-bien-2021072221777804) — quota coupon và tải cao.
12. [Thiết kế database phục vụ tải lớn](https://anonystick.com/blog-developer/cach-thiet-ke-database-dap-ung-truy-xuat-cao-len-den-1-trieu-2021031883297318) — throughput, sharding và tăng trưởng dữ liệu.
13. [Tuyến phòng thủ thứ hai cho hệ thống bán vé](https://anonystick.com/blog-developer/ddd-ve-tau-tet-tuyen-phong-thu-thu-hai-cua-lap-trinh-vien-nhieu-kinh-nghiem-2024110894670283) — circuit breaker, rate limiter và overload.
14. [API Gateway: những chức năng cốt lõi](https://anonystick.com/blog-developer/luan-ban-ve-api-gateway-no-don-gian-khong-nen-cau-ky-2025100640682960) — rate limiting, routing, auth và cache.
15. [Tối ưu connection pool](https://anonystick.com/blog-developer/trai-nghiem-backend-khi-optimizing-connection-pools-toi-uu-ket-noi-database-chuyen-sau-2025071291466541) — pool sizing, chờ connection và timeout.
16. [Tìm kiếm 13 triệu dòng trong MySQL](https://anonystick.com/blog-developer/voi-13-trieu-du-lieu-va-4gb-chung-toi-cai-thien-tim-kiem-tu-6s-con-1s-trong-mysql-khong-su-dung-elasticsearch-2025032551977295) — tối ưu tìm kiếm theo pattern và index.

### Đối chiếu nội dung và phần bổ sung

Đã đọc các câu `q:` trong `q-scenario.js` (scenario-001..048) và `q-system-design.js`. Các câu về flash sale tổng thể, cache stampede, thanh toán idempotency, upload lớn và Kafka ordering đã có, nên câu mới chọn góc nhỏ hơn hoặc trường hợp phân tán nhiều region: reconcile reservation Redis–DB; rate limit nhiều chiều chống bot; lựa chọn Lua/lock/bucket; lost update của cart; stale cache write race; Kafka order theo aggregate/version; resumable upload an toàn; quota escrow đa region.

Đã thêm scenario-049..056. Mỗi câu có 2–3 follow-up, một link nguồn Anonystick và một tài liệu chính thức. Các link nguồn được tra cứu qua kết quả web; link category ở các mục 16–20 là trang chứa danh mục bài liên quan.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
