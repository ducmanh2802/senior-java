# T33 — View: Tài khoản (đăng nhập, đồng bộ, hạn mức AI, dữ liệu của tôi)

Status: TODO
Agent: opencode
Owns: `js/views/account.js`, `css/views/account.css`

> **Ghi theo lô nhỏ** (≤ 120 dòng mỗi edit). Đọc `AGENTS.md` mục 7, 9, **10** và `js/core/auth.js` trước.

## `#/account`
Xử lý đủ 3 trạng thái:
1. **Chưa cấu hình** (`!App.auth.enabled`): card giải thích tiến độ đang lưu trong trình duyệt này, kèm nút "Xuất tiến độ" (bấm hộ nút `#exportBtn` có sẵn ở footer).
2. **Chưa đăng nhập**: lợi ích khi đăng nhập (đồng bộ nhiều thiết bị, dùng AI chấm điểm). Nút "Đăng nhập với Google", ô email kèm nút "Gửi link đăng nhập" (báo "Đã gửi, kiểm tra hộp thư"). Link tới `#/legal/privacy`.
3. **Đã đăng nhập**:
   - Hồ sơ: avatar, email, tên hiển thị (sửa được bằng `updateDisplayName`), badge `admin` nếu `role === 'admin'`.
   - **Đồng bộ**: trạng thái `App.sync.status` (icon + chữ), "Lần cuối: …" (`App.fmtDate`), nút "Đồng bộ ngay" (`App.sync.now()`), theo dõi bằng `onStatus`.
   - **Hạn mức AI hôm nay**: thanh `.progress` `used/limit`, chi tiết theo loại.
   - **Dữ liệu của tôi**: "Tải xuống toàn bộ dữ liệu" (`exportData` → file JSON), "Đăng xuất", và **"Xoá tài khoản"** (vùng nguy hiểm màu `--bad`; xác nhận 2 bước, bước 2 phải gõ chữ `XOA`; có checkbox "Xoá cả dữ liệu trên máy này").
- Đăng ký `App.auth.onChange` và `App.sync.onStatus` để re-render; huỷ đăng ký trong cleanup.
- Khi đã đăng nhập, nút 👤 trên thanh trên cùng (`.account-btn`) hiện chữ cái đầu của tên. Chỉ sửa phần tử đó qua DOM, không sửa `index.html`.

## Nghiệm thu
`node --check`, `npm run smoke` OK (trạng thái chưa cấu hình phải hiển thị đẹp). Responsive tới 360px.

## Notes
