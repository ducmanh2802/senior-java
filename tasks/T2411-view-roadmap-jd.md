# T2411 — Roadmap view: chuyển giữa "Lộ trình chung" và "Theo JD (20 tuần)"

Status: DONE
Agent: kilo
Owns: `js/views/roadmap.js`, `css/views/roadmap.css`
After: T2410

`js/data/roadmap.js` giờ có thêm `window.JD_PLAN` (cùng schema `window.ROADMAP`, week id 'j01'..'j20'). Sửa view `#/roadmap`:
- Thêm hàng `.chips` đầu trang: "Lộ trình chung (26 tuần)" / "Theo JD (20 tuần)"; chỉ hiện khi `window.JD_PLAN` tồn tại. Lựa chọn nhớ trong `App.store.data.roadmap.plan` ('main' | 'jd'), gọi `App.store.save()`.
- Hàm `RM()` trả về plan đang chọn; mọi tính toán (tuần hiện tại, % hoàn thành, tick task) dùng plan đó. Key tiến độ giữ dạng `'<weekId>-<i>'` (j01-0 không đụng w01-0).
- Ngày bắt đầu: plan JD dùng `App.store.data.roadmap.jdStart` (mặc định = lần đầu chọn plan JD), không ghi đè `start` của plan chung.
- Hỗ trợ route `#/roadmap/jd` mở thẳng plan JD.
- Không phá giao diện/tiến độ cũ; dark mode, 360px; selector CSS bắt đầu bằng `.view-roadmap`.

## Luật
AGENTS.md mục 7. Chỉ sửa 2 file sở hữu. Không mở trình duyệt. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/views/roadmap.js`; `node scripts/validate.js` → OK. Status: DONE + Notes.

## Notes

- Đã thêm hàng `.chips` đầu trang (`planChipsHtml()`) với 2 nút "Lộ trình chung (26 tuần)" / "Theo JD (20 tuần)"; chỉ render khi `window.JD_PLAN` tồn tại. Lựa chọn lưu ở `App.store.data.roadmap.plan` ('main' | 'jd') + `App.store.save()`.
- `RM()` giờ trả về plan đang chọn (`planData()`): 'jd' → `window.JD_PLAN`, mặc định → `window.ROADMAP`. Mọi tính toán (tuần hiện tại, % hoàn thành, tick task) dùng plan đó.
- Số tuần & prefix động: `planWeeks()` (26 / 20), `planPrefix()` ('w' / 'j'), `curWeekId()` dùng prefix đúng; `weeksHtml()` bóc prefix bằng regex theo plan. Key tiến độ giữ `'<weekId>-<i>'` nên `j01-0` không đụng `w01-0`.
- Ngày bắt đầu: plan JD dùng `roadmap.jdStart` (mặc định = hôm nay ở lần đầu chọn JD, set cả khi vào qua route `/jd`); **không** ghi đè `roadmap.start` của plan chung. `bindStart` ghi vào đúng field theo plan.
- Route `#/roadmap/jd` mở thẳng plan JD; `#/roadmap/main` mở plan chung (đối xứng). `#/roadmap` giữ plan đã lưu. Nút chip điều hướng tới route tương ứng.
- i18n: thêm khóa `rm.planMainChip/JdChip`, `rm.planMainHint/JdHint`, `rm.planTitleJd` cho cả vi & en. Tiêu đề mục "Lộ trình" đổi theo plan.
- CSS: thêm `.rm-plan-switch`, `.rm-plan-hint` (mọi selector bắt đầu `.view-roadmap`); dùng `.chip.active` có sẵn trong base.css, responsive 360px (`.chips` đã flex-wrap).
- Kiểm thử logic bằng harness Node (giả lập App + DOM tối thiểu): xác nhận 5 kịch bản (main no-start, /jd set jdStart, /main vs /jd vs no-param, total 26/20, key j01 không đụng w01) + locale en đều đúng.
- Nghiệm thu: `node --check js/views/roadmap.js` OK; `node scripts/validate.js` → OK — không có lỗi.
- Lưu ý: lúc đầu validate báo `index-light.js` cũ do task khác (T24xx data) đồng thời sửa dữ liệu; sau khi agent kia build lại index thì validate OK. Task này KHÔNG đụng file dữ liệu nào.
Reviewed-by: verify-only (code/UI task)
