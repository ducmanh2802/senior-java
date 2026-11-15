# T2124 — Dashboard: kế hoạch hôm nay ưu tiên câu lõi

Status: DONE
Agent: claude
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`
After: T2122

## Bối cảnh
Người học có 6 tháng ôn phỏng vấn Senior Java, ngân hàng ~2000 câu là quá nhiều; trọng tâm là bộ ~400 câu lõi (tag 'core'). App phải tự dẫn người học ôn đúng thứ cần ôn.

## Việc cần làm
1. Đọc kỹ phần "Kế hoạch hôm nay" hiện có trong js/views/dashboard.js. Giữ nguyên phần câu đến hạn ôn (`App.dueItems()`) đứng đầu.
2. Thêm khối **"Câu lõi mới hôm nay"**: chọn 4 câu trong `DATA_INDEX.core` chưa học (`App.store.getStatus(id)` rỗng/unseen), ưu tiên theo thứ tự nhóm chủ đề: core/collections/modern → concurrency/jvm → spring/jpa/db/sql → api/microservices/design/architecture → còn lại; mỗi câu là link `#/bank/<topic>` (hoặc cách mở câu hiện có của dashboard).
3. Thanh tiến độ **"Bộ câu lõi: X/Y đã thuộc"** (known / tổng core) và số câu core đến hạn hôm nay.
4. Gợi ý 1 việc phụ xen kẽ theo ngày (ngày chẵn: 1 bài thuật toán `#/algo` chưa làm; ngày lẻ: 1 bài học `#/learn` chưa xong) — dùng dữ liệu có trong DATA_INDEX (algos, lessons).
5. Số câu mới mỗi ngày (mặc định 4) chỉnh được 2–8, lưu vào `App.store.data.corePlan = {perDay}` rồi `App.store.save()`.

## Luật
- Đọc AGENTS.md mục 2, 3, 7 (và 9, 11 nếu đụng AI/phỏng vấn). Không framework, classic script, escape mọi dữ liệu bằng App.esc(). Chuỗi UI thêm vào cả bảng i18n 'vi' và 'en' ở đầu file view (theo mẫu có sẵn).
- Danh sách id câu lõi: `(window.DATA_INDEX && window.DATA_INDEX.core) || []` (sinh từ tag 'core', các task T2115–T2122 đang gắn). Khi danh sách rỗng, mọi tính năng mới phải tự ẩn hoặc hiện `.empty` thân thiện, không lỗi.
- KHÔNG sửa js/core/*, css/base.css, index.html, scripts/*. Cần thì ghi đề xuất vào Notes. CSS mới bắt đầu bằng `.view-<view>`, chỉ dùng biến màu, responsive 360px.
- Không gọi AI tự động. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check` các file đã sửa; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả thay đổi.

## Notes
- 2026-11-15 Claude: làm trực tiếp (user giao). Plan v2 (PLAN_VERSION) thêm item 'core' (perDay 2–8 lưu ở store.data.corePlan), ngày thường xen kẽ algo/lesson; thẻ ⭐ Bộ câu lõi (ẩn khi DATA_INDEX.core rỗng); details 'Báo cáo tuần này' (7 ngày từ store.day, top 3 chủ đề yếu + mock < 3). Test bằng browser-shim.
