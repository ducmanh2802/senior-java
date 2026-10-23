# T33 — View: Tài khoản (đăng nhập, đồng bộ, hạn mức AI, dữ liệu của tôi)

Status: DONE
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

### Đã làm
- `js/views/account.js` (583 dòng) + `css/views/account.css` — route `#/account`, không sửa `index.html`.
- **3 trạng thái** theo `App.auth.enabled` / `App.auth.user`:
  1. **Chưa cấu hình**: card giải thích tiến độ nằm trong localStorage của trình duyệt này, kèm nút
     “Xuất tiến độ” (bấm hộ nút `#exportBtn` ở footer, có fallback tự tải file JSON) + lưới số liệu
     tiến độ local (đã thuộc / cần ôn / chưa biết / chưa học / đến hạn ôn / chuỗi học).
  2. **Chưa đăng nhập**: 4 lợi ích (đồng bộ nhiều thiết bị, dùng AI chấm điểm, giữ lịch sử lâu dài,
     bạn chủ dữ liệu), nút “Đăng nhập với Google”, ô email + “Gửi link đăng nhập” (validate email,
     báo đúng câu **“Đã gửi, kiểm tra hộp thư …”**), link `#/legal/privacy` và `#/legal/terms`.
  3. **Đã đăng nhập**: hồ sơ (avatar ảnh hoặc chữ cái đầu, email, sửa tên hiển thị qua
     `updateDisplayName`, badge `admin` khi `role === 'admin'`), đồng bộ (`App.sync.status` icon +
     chữ, “Lần cuối: …” qua `App.fmtDate`, nút “Đồng bộ ngay” → `App.sync.now()`), hạn mức AI hôm nay
     (`.progress` used/limit, đổi màu warn ≥ 80% / bad ≥ 100%, chi tiết theo loại grade/review/run/
     interview từ `usageToday().byKind`), “Dữ liệu của tôi” (`exportData()` → file JSON, “Đăng xuất”)
     và vùng nguy hiểm `--bad` với **xoá tài khoản xác nhận 2 bước** (bước 2 phải gõ đúng `XOA`,
     checkbox “Xoá cả dữ liệu trên máy này” → `deleteAccount({clearLocal})` + `App.store.reset()`).
- Đăng ký `App.auth.onChange` + `App.sync.onStatus` trong `render()` và **huỷ trong cleanup**; đổi
  trạng thái đăng nhập thì vẽ lại trang, chỉ đổi tên/email thì cập nhật tại chỗ (giữ mọi thông điệp).
- Nút 👤 trên thanh trên cùng (`.account-btn`) hiện **chữ cái đầu của tên** khi đã đăng nhập — sửa qua
  DOM (`textContent`, `title`, `aria-label`), **không sửa `index.html`**.
- Mọi lời gọi async đều `try/catch` + hiển thị bằng `setMsg()`; không tự gọi API nào (đúng luật “không
  gọi AI tự động”), dùng `App.auth`/`App.sync` có fallback để view không vỡ nếu `js/core/auth.js` chưa nạp.

### Kiểm tra
- `node --check js/views/account.js` OK.
- `node scripts/validate.js` → **`OK — không có lỗi.`**
- Test logic bằng Node (DOM giả, **không mở trình duyệt** theo luật 9): 2 script ở thư mục tạm,
  ~40 assertion — render đủ 3 trạng thái, nút “Xuất tiến độ” bấm hộ `#exportBtn`, hạn mức AI vẽ
  đúng `used/limit` + chi tiết theo loại, sửa tên (trim) → `updateDisplayName`, xuất dữ liệu,
  đăng xuất, xoá tài khoản 2 bước (từ khoá sai → nút tắt, đúng `XOA` → nút bật, huỷ, `clearLocal`),
  email sai → báo lỗi, email đúng → “Đã gửi, kiểm tra hộp thư”; mọi API lỗi đều không làm vỡ view.
- CSS: mọi selector bắt đầu bằng `.view-account`, chỉ dùng `var(--…)` (dark mode tự chạy),
  không màu hard-code; media query ≤ 640px (lưới 1 cột, nút full width) → vừa 360px.
- **Không chạy `npm run smoke`** (cần headless Chromium) để tuân thủ luật 9 — người tích hợp test UI.

### Ngoài phạm vi task (cần integrator review)
- `js/data/labs-gc.js` (file của **T42**, agent bị stalled, task vẫn `Status: TODO`) làm
  `node scripts/validate.js` đỏ vì **13 inline code viết bằng backtick markdown nằm trong template
  literal `answer`** → `SyntaxError: Unexpected identifier 'toByteArray'` (file không parse được).
  Để repo validate được, tôi sửa **tối thiểu, không đổi câu chữ**: đổi 13 cặp backtick đó thành
  markup `{{code}}` chuẩn của AGENTS.md mục 5 (8 dòng, dòng 143–175). Đây là sửa ngoài phạm vi task —
  nếu agent T42 chạy lại và ghi đè file thì cần kiểm tra lại lỗi backtick này.

Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
