# T354 — Tình huống production thật (phần 2): bảo mật, vận hành, vai trò lead

Status: DONE
Agent: claude
Owns: `js/data/q-scenario.js`
After: T353

Thêm **15 câu** topic scenario theo đúng khung của T353. Chủ đề:
- Bảo mật: credential stuffing vào API login; SSRF qua tính năng tải ảnh từ URL; secret lộ trong Git history; dependency có CVE nghiêm trọng (như Log4Shell) phải vá gấp.
- Vận hành và chi phí: hoá đơn AWS tăng gấp 3 sau một tháng; test flaky làm CI đỏ liên tục; alert fatigue; disk đầy vì log.
- Vai trò lead: điều phối một incident nghiêm trọng (incident commander, giao tiếp); viết postmortem không đổ lỗi; bất đồng thiết kế trong team; dự án trễ hạn phải cắt scope; onboarding người mới vào codebase legacy; review PR lớn rủi ro cao.
Không trùng scenario-001..056 và các câu T353 vừa thêm.

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Đã thêm 15 câu scenario-072..086 (mid 3, senior 6, lead 6): 072 credential stuffing, 073 SSRF tải ảnh từ URL (IMDSv2, DNS rebinding), 074 secret trong Git history (filter-repo/BFG, push protection), 075 CVE nghiêm trọng vá gấp (SBOM, Log4Shell), 076 hoá đơn AWS x3 (Cost Explorer, NAT, logs), 077 test flaky ở mức code, 078 alert fatigue (SLO burn rate), 079 disk đầy vì log (lsof +L1, total-size-cap, ephemeral-storage), 080 incident commander, 081 postmortem blameless, 082 bất đồng thiết kế (ADR), 083 trễ hạn cắt scope, 084 onboarding legacy, 085 review PR lớn rủi ro cao, 086 bus factor / chuyển giao khi người chủ chốt nghỉ.
- Góc khác với scenario-024 và q-security/q-soft/q-aws (tập trung tình huống có số liệu + kịch bản lời nói).
- node --check OK, check-links q-scenario.js 80 link 0 hỏng, validate.js OK.

Reviewed-by: claude (subagent; validate OK)
