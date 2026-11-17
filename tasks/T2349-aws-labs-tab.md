# T2349 — #/aws: tab mới "🧪 Lab thực hành" (window.AWS_LABS)

Status: DONE
Agent: kilo
Owns: `js/views/aws.js`, `css/views/aws.css`

## Bối cảnh
Người học ôn SAP-C02 + DOP-C02 trong `#/aws` (tabs: overview / plan / practice / mock; đọc `js/views/aws.js` và docs/AWS-TRACK.md). Claude đã thêm `js/data/aws-labs.js` → `window.AWS_LABS` (nạp trong group `aws`; schema ở comment đầu file) và `docs/ref/labaws-index.tsv` (danh mục lab tham khảo của labaws.site). Agent khác sẽ điền dữ liệu lab (T2350–T2355); view phải chạy được cả khi mảng rỗng.

## Việc cần làm
1. Thêm tab `labs` (route `#/aws/labs`, nhãn "🧪 Lab thực hành" / "🧪 Hands-on labs") vào `TABS`, i18n vi/en.
2. Danh sách lab: lọc theo category (Network, RDS, Storage, Compute & Containers, Ops, Dev), theo kỳ thi (SAP/DOP), theo trạng thái (chưa làm / đã làm), ô tìm kiếm theo title/services. Mỗi lab là thẻ: title, level, minutes, services (badge), domain (tên domain lấy từ `AWS_PLAN.exams[].domains`).
3. Mở lab (bấm thẻ hoặc `#/aws/labs/<id>`): hiện `goal`, `steps`, `verify`, `cost` (hộp cảnh báo chi phí + dọn dẹp, dùng class warn có sẵn), `examTip` (render bằng `App.md`); danh sách "📚 Hướng dẫn chi tiết từng bước" = link `https://labaws.site/labs/<slug>` cho mỗi `ref` (target _blank, rel noopener; text = slug dễ đọc), ghi chú nhỏ "nguồn ngoài, cần tài khoản AWS — chú ý chi phí".
4. Nút "✅ Đã làm xong" / bỏ đánh dấu: lưu `App.store.data.awsLabs = { [id]: { doneAt, updatedAt } }` + `App.store.save()`; tiến độ % theo category trên tab overview (1 dòng) và đầu tab labs.
5. Escape mọi dữ liệu (`App.esc`), CSS prefix `.view-aws`, biến màu, 360px, nút có text/aria-label, phím tắt nếu hợp lý.

## Nghiệm thu
`node --check js/views/aws.js`, `node scripts/validate.js`, `node scripts/check-budget.js` → OK (Lỗi ở các file khác không thuộc task). Không commit, không mở trình duyệt. Status: DONE.

## Notes
- Đã thêm tab `labs` trong `js/views/aws.js` và CSS tương ứng trong `css/views/aws.css`.
- Đã thêm keyboard shortcut cơ bản `B` và `/` trong labs view.
- Lưu trữ `awsLabs` vào `App.store.data.labs`.
