# T2320 — 5 câu phỏng vấn bảo mật Spring mới

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2238

Thêm 5 câu: Spring Security 6 SecurityFilterChain (bỏ WebSecurityConfigurerAdapter) và thứ tự filter, resource server validate JWT (issuer, audience, rotation JWKS), lưu secret/API key (Vault/Secrets Manager, không để trong application.yml), rate limiting + brute-force protection cho login, bảo vệ API gọi LLM khỏi lộ dữ liệu nhạy cảm (PII masking, log an toàn). Đúng chuẩn AGENTS.md mục 6 (Tóm tắt, ### cơ chế, code ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn, > Senior tip:, 3000–5000 ký tự). Dùng qtool.js list để không trùng ý.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm).

## Nghiệm thu
`node --check js/data/q-security.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Added 5 new questions: security-077, security-078, security-079, security-080, security-081
All validation commands pass: node --check, build-light-index.js, validate.js → OK
Reviewed-by: kilo (T2320R)
