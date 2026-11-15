# T2144 — Rà soát độ chính xác 15 câu mới nhất trong q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2107

## Bối cảnh
Các câu security mới do model free viết (đợt T20xx) chưa được kiểm tra chéo. Mảng: Spring Security 6, OAuth2/OIDC, JWT, OWASP Top 10. Người học dùng để đi phỏng vấn thật → phải đúng.

## Việc cần làm
1. `node scripts/qtool.js list js/data/q-security.js` → lấy **15 câu có id lớn nhất** của topic security. Xem từng câu bằng `node scripts/qtool.js show js/data/q-security.js <id>` (KHÔNG đọc cả file).
2. Mỗi câu kiểm tra:
   - **Sai kỹ thuật**: API/annotation/flag không tồn tại, giá trị mặc định sai, tên dịch vụ/tính năng AWS sai hoặc đã đổi, giới hạn/quota bịa, mô tả cơ chế sai → **sửa đúng**; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa.
   - **Trùng ý** với câu cũ hơn trong file → ghi vào Notes (không xoá).
   - **Thiếu cấu trúc** (AGENTS.md mục 6): **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: → bổ sung ngắn, đúng.
   - Code java/yaml trong khối ~~~ hợp lệ (Java 17, YAML đúng thụt lề).
3. Chỉ sửa chỗ sai/thiếu, giữ phần đúng. Không xoá câu, không đổi id.

## Luật
- Đọc AGENTS.md mục 4–6 (bẫy backtick và ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung. Đếm số câu trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.`
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

Đã rà soát 15 câu có id lớn nhất (057–066, 072–076). Đếm câu trước/sau: 71 = 71 (không xoá, không đổi id). `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| security-057 | Lỗi chính tả "lễ Rezeption" (trộn tiếng Đức) và "ánh xạ tường chỉ" (thiếu chữ) | Sửa thành "lễ tân" và "ánh xạ tường minh" |
| security-058 | Khối properties "Code sửa" khai báo `management.endpoints.web.exposure.include` 2 lần (dòng prometheus ghi đè dòng `health,info`, mâu thuẫn); follow-up "show-details=always vẫn rủi ro dù chỉ trả UP/DOWN" tự mâu thuẫn (always là trả chi tiết) | Comment dòng prometheus thành tuỳ chọn (không trùng key); sửa follow-up thành hỏi `when-authorized` |
| security-059 | Lỗi chính tả "dữ liệu đãserialize" (dính chữ) | Sửa thành "dữ liệu đã serialize" |
| security-060 | Câu hỏi có từ tiếng Anh lạc "lets" | Sửa thành "cho phép người dùng truyền tên file" |
| security-061 | Số liệu quota sai: ALB ghi "tổng header tối đa ~16 KB"; CloudFront "~20 KB" | Đúng theo docs AWS: ALB mỗi header ≤ 16 KB, tổng request header ≤ 64 KB; CloudFront tổng request (header+query) ≤ 32 KB (32.768 byte) |
| security-062 | Bất đẳng thức nbf sai chiều: ghi `now + skew > nbf` nhưng đó là điều kiện hợp lệ | Sửa thành `now + skew < nbf` (token đến trước nbf → 401) |
| security-063 | OK | — |
| security-064 | Code `registeredClientRepository` build 2 client (`spa`, `svc`) nhưng KHÔNG `save()` và return repo mới → client không được đăng ký, biến thừa | Thêm `JdbcRegisteredClientRepository repo`, `repo.save(spa)`, `repo.save(svc)`, `return repo` |
| security-065 | OK | — |
| security-066 | OK | — |
| security-072 | OK | — |
| security-073 | OK | — |
| security-074 | OK | — |
| security-075 | OK (đã xác minh `?prefix=` là cú pháp hợp lệ của Spring Cloud AWS 3.0.x) | — |
| security-076 | OK | — |

### Trùng ý với câu cũ hơn (ghi nhận, không xoá)
- security-057 (mass assignment / BeanUtils.copyProperties) ↔ security-016.
- security-061/062/063 (JWT kích thước, clock skew, scope/role) ↔ security-003, security-017, security-018.
- security-064/065 (Spring Authorization Server, id/access token) ↔ security-004, security-018.
- security-072 (CSRF/SPA) ↔ security-006.
- security-073 (IDOR/BOLA) ↔ security-008, security-024.
- security-074 (SSRF) ↔ security-012, security-037.
- security-075 (quản lý secret) ↔ security-019, security-025.
- security-076 (audit log tamper-evident) ↔ security-021, security-030.

### Ghi chú kỹ thuật khác
- Câu 057, 059, 061, 063, 064, 065, 066 có comment code viết không dấu (chấp nhận được vì là comment).
- Đã kiểm tra mọi `${` trong các câu này đều escape thành `\${` trong source (đúng luật template literal) — không phát sinh lỗi nội suy.
- Không đụng tới câu cũ, không đổi cấu trúc file, không commit.
Reviewed-by: kilo (T2144R)
