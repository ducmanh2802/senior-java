# T2814 — 4 câu hỏi theo JD LG CNS: React cho dev Java fullstack

Status: DONE
Agent: kilo
Owns: `js/data/q-frontend.js`

Thêm **4 câu hỏi** topic `frontend` vào `js/data/q-frontend.js`, bám JD:
- JD Fullstack Java Developer (Insurance/Banking domain) tại LG CNS Việt Nam, Hà Nội, 5+ năm: kênh số Web/Mobile cho bảo hiểm/ngân hàng (đăng ký online, báo giá, nộp hồ sơ hợp đồng, thanh toán, quản lý khách hàng); Java, Spring Boot, REST API, RDBMS; front-end JavaScript/HTML5/CSS + React (hoặc Vue/Angular); tích hợp Core Insurance, Payment, CRM; tuân thủ bảo mật và quy định ngành tài chính; English business level (bắt buộc), làm việc với team toàn cầu.

Câu cần có (ví dụ code React + TypeScript ngắn trong ~~~text vì validator chỉ nhận java/sql/yaml/json/bash/text; giải thích so sánh với khái niệm Java/Spring tương ứng):
1. React cho dev Java: component, props, state, useEffect, vòng đời render; so sánh với Vue mà file đã có; lỗi hay gặp (dependency array, render lặp). (mid)
2. Form nhiều bước cho đăng ký bảo hiểm online: quản lý state, validate client + server (Bean Validation), lưu nháp, chống submit hai lần, hiển thị lỗi từ API. (senior)
3. Gọi REST API từ React tới Spring Boot: xử lý loading/error, huỷ request, retry, CORS, chuẩn lỗi (RFC 9457 ProblemDetail của Spring 6). (senior)
4. Xác thực trên SPA tài chính: lưu token ở đâu (cookie HttpOnly vs localStorage), CSRF, refresh token, session timeout theo quy định ngân hàng/bảo hiểm. (senior)

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `'jd-2026-12'`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-frontend.js`); đọc danh sách để **không trùng ý** (nếu trùng thì chọn góc sâu hơn, ghi Notes).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ.**
- **Chỉ THÊM** vào `js/data/q-frontend.js` (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau.
- Không backtick, không `${` trong template literal.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, FIX 4.4/5.0 SP2 khi nói về FIX). Không bịa tag, API, flag. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, chuẩn bị phỏng vấn đúng JD bên dưới: giải thích từ gốc, từng bước, VÌ SAO.

## Nghiệm thu
`node --check js/data/q-frontend.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Da them 4 cau: frontend-034 (mid, React co ban), frontend-035 (senior, form nhieu buoc dang ky bao hiem), frontend-036 (senior, goi REST API React-Spring), frontend-037 (senior, xac thuc SPA tai chinh). Tat ca co tag 'jd-2026-12'. Ghi nhan: frontend-037 co chuyen de gan voi frontend-033 (luu JWT/XSS/CSRF/refresh) nhung viet theo goc quy dinh ngan hang/bao hiem (idle/absolute timeout, session theo quy định ngành); frontend-035 gan voi frontend-018/024/028 nhung xua xuoi form dang ky bao hiem nhieu buoc trong React.
