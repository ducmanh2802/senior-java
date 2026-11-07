# T815 — 2 bài security: phân quyền RBAC/ABAC và chống SQL injection

Status: DONE
Agent: qoder
Owns: `js/data/lessons-security.js`

Track **security** đã có một số bài (đọc hết file, không trùng). Thêm các bài dưới, id và order tiếp nối số lớn nhất hiện có, bài tập Java thuần chạy với Java 17 và tự chấm (≥ 4 case mỗi bài tập). Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.

1. **Phân quyền RBAC vs ABAC và lỗi IDOR**: role → permission, kiểm tra quyền theo thuộc tính (chủ sở hữu, chi nhánh, hạn mức), vì sao chỉ kiểm tra role ở controller dẫn tới IDOR. Bài tập: `PolicyEngine.allowed(user, action, resource)` kết hợp role và điều kiện thuộc tính; test các case nhân viên chi nhánh khác, chủ tài khoản, admin.
2. **SQL injection từ gốc và parameterized query**: vì sao nối chuỗi nguy hiểm, PreparedStatement làm gì, ORDER BY động phải whitelist, LIKE escape. Bài tập: `QueryBuilder` dựng câu SQL với placeholder ? và danh sách tham số, cột sort qua whitelist, escape % và _ cho LIKE; test với input độc hại.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-security.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Đã thêm 2 bài (chỉ chèn object mới trước `);` cuối file, không sửa bài cũ).** Số `id: '` trong `js/data/lessons-security.js`: **7 → 9** (+2, khớp).

| id | order | level | title | bài tập |
|---|---|---|---|---|
| `lesson-security-008` | 8 | mid | SQL injection từ gốc: code và data đi chung một đường, PreparedStatement tách chúng ra, và ba chỗ phải tự canh | `QueryBuilder` (placeholder `?` + danh sách tham số, whitelist cột/bảng, sort whitelist, LIKE escape) — 10 case |
| `lesson-security-009` | 9 | senior | SSRF: vì sao để server tự đi gọi một URL theo yêu cầu là nguy hiểm, và kiểm tra URL đúng cách ở tầng ứng dụng | `UrlGuard.check(url)` (scheme/allowlist/IP công khai, resolver giả lập để deterministic) — 10 case |

**Lý do đổi chủ đề mục 1:** yêu cầu "RBAC vs ABAC + IDOR + `PolicyEngine.allowed(user, action, resource)`" **đã có bài phủ trọn** trong track này: `lesson-security-005` dạy đúng ma trận role × domain × action, deny-by-default, tenant isolation, IDOR/BOLA, bài tập kiểu policy engine và cả câu "RBAC khác ABAC thế nào". Rule "không trùng / chủ đề đã có thì chọn chủ đề cùng track chưa có" nên tôi chọn **SSRF** — là topic an ninh trọng tâm chưa có bài nào trong track (mới chỉ tồn tại dưới dạng câu hỏi `security-011` gộp chung với XXE/deserialization), có `~~~seq` vẽ luồng DNS rebinding 4 bên (Attacker | App | DNS | Metadata) theo mục 5 AGENTS.md. Mục 2 (SQL injection) giữ nguyên như task.

**Cổng nghiệm thu (chỉ chạy bằng `node <file>`, không mở trình duyệt, không kill tiến trình, không npm install):**
- `node scripts/test-lessons.js lesson-security-008` → reference `RESULT 10/10`, starter biên dịch được và không pass → "Lesson exercises OK: 1/1".
- `node scripts/test-lessons.js lesson-security-009` → reference `RESULT 10/10`, starter biên dịch được và không pass → "Lesson exercises OK: 1/1".
- `node scripts/build-light-index.js` → đã ghi lại `js/data/index-light.js` (138.5 KB).
- `node scripts/validate.js` → **"OK — không có lỗi."** (track security báo 9 bài). Chỉ còn warning có sẵn từ trước: đáp án ngắn ở vài topic khác và "lesson chưa có trong PATH".
- Liên quan: `related` trỏ id câu hỏi thật — 008 dùng `security-002`, `security-001`; 009 dùng `security-011`, `security-001`.

**Đề xuất cho integrator:**
1. Thêm `lesson-security-008` và `lesson-security-009` vào `js/data/path.js` (khu vực `path-08`, ngay sau `lesson-security-005`) để hết warning "lesson không có trong PATH".
2. `node scripts/test-lessons.js` chạy toàn suite hiện **exit 1 vì một bài không thuộc task này**: `lesson-banking-007#1` reference chỉ đạt `RESULT 38/39`, fail `hai_hold_cung_lam_tron_khong_cheo_nhau: kha_dung=199999` — tái hiện được cả khi chạy lẻ `node scripts/test-lessons.js lesson-banking-007`, tức là lỗi deterministic, **có trước** và nằm trong `js/data/lessons-banking.js` (T815 không sở hữu, tôi không sửa).
3. Vệ sinh repo: file tạm `tmp-check-parse.js` ở gốc repo do tôi tạo ra để dò lỗi cú pháp, lệnh xoá bị từ chối quyền nên vẫn còn — nhờ integrator xoá giúp (`git status` sẽ nó là untracked, không nằm trong nội dung commit).Reviewed-by: kilo (T815R)
