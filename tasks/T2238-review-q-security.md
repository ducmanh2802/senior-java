# T2238 — Rà soát chất lượng các câu về OAuth2/OIDC/JWT/session trong q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2212

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về OAuth2/OIDC/JWT/session (`node scripts/qtool.js list js/data/q-security.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: luồng OAuth2 Authorization Code + PKCE, refresh token, JWT validation phải đúng RFC hiện hành (implicit flow đã không khuyến nghị); luồng nhiều bên chưa có sơ đồ thì thêm ~~~seq (tối đa 5).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Số mục trước/sau: 71 / 71 (không thêm/bớt, không đổi id). Đã rà các câu OAuth2/OIDC/JWT/session: security-003, 004, 017, 018, 023, 033, 034, 035, 043, 044, 061, 062, 063, 064, 065, 066, 072.

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| security-003 | Nói "validate bắt buộc: iat, sub" — sai: RFC 7519 không bắt buộc kiểm iat; sub chỉ để định danh | Sửa tóm tắt: bắt buộc chữ ký + exp (thiếu exp phải từ chối), nbf nếu có, iss/aud khớp cấu hình; iat chỉ tham khảo |
| security-004 | "RFC 9700 khuyến nghị PKCE cho mọi client" chưa đúng mức normative; implicit rò rỉ qua "log server/proxy" là không chính xác với URL fragment | Sửa: public client MUST dùng PKCE, confidential RECOMMENDED (OAuth 2.1 bắt buộc mọi client); mô tả lại đường rò của implicit (history, log extension/proxy, Referer với trình duyệt lỗi — RFC 9700 §4.2) |
| security-023 | Code refresh: `if (rt.isRevoked() \|\| rt.isExpired()) throw` đặt trước check `usedAt` → khi refresh token đã dùng bị gửi lại, reuse detection không bao giờ chạy | Đưa check `getUsedAt() != null` (reuse → revoke family) lên trước, rồi mới check revoked/expired |
| security-033 | Bảng thứ tự filter ghi số cụ thể (~100/~400/~1500…) sai giữa các bản Spring Security; nói `SecurityFilters` enum | Bỏ số, đổi thành thứ tự tương đối + ghi chú `FilterOrderRegistration` (số thay đổi theo phiên bản) |
| security-034 | "exp, iat, iss, aud là claim chuẩn — thư viện phải kiểm tra" (iat không bắt buộc kiểm) | Sửa: exp/nbf là claim thời gian phải kiểm; iss/aud khớp cấu hình; iat chỉ tham khảo |
| security-035 | Ref trỏ draft-ietf-oauth-security-topics (đã thành RFC 9700); mô tả rò token implicit chưa chính xác | Đổi ref sang RFC 9700 (rfc-editor); sửa câu implicit (log extension/proxy, Referer với trình duyệt lỗi) |
| security-061 | CloudFront vượt header trả 400 — thực tế 494 (header quá lớn), 414 (URL quá dài) | Sửa mã lỗi CloudFront trong bảng giới hạn |
| security-064 | Comment `requireProofKey(true)` ghi "(S256)" (Spring chỉ bắt buộc PKCE, không ép S256); `reuseRefreshTokens(false)` bị mô tả là có sẵn reuse detection | Sửa comment thành "nên dùng S256"; sửa thành "one-time use (rotation); reuse detection cần logic riêng" ở code và câu trả lời mẫu |
| security-066 | Luồng token exchange nhiều bên chưa có sơ đồ | Thêm `~~~seq` (Service A → Auth Server → Service B) minh hoạ delegation RFC 8693 |

Nghiệm thu: `node --check js/data/q-security.js` OK; `node scripts/build-light-index.js` (sinh lại `js/data/index-light.js`); `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js về bài học chưa nằm trong PATH, không thuộc file này).
