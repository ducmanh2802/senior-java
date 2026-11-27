# T2815 — 4 câu phỏng vấn tiếng Anh theo JD LG CNS (business English)

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Thêm **4 câu hỏi** topic `english` (có `lang: 'en'`) vào `js/data/q-english.js`, bám JD:
- JD Fullstack Java Developer (Insurance/Banking domain) tại LG CNS Việt Nam, Hà Nội, 5+ năm: kênh số Web/Mobile cho bảo hiểm/ngân hàng (đăng ký online, báo giá, nộp hồ sơ hợp đồng, thanh toán, quản lý khách hàng); Java, Spring Boot, REST API, RDBMS; front-end JavaScript/HTML5/CSS + React (hoặc Vue/Angular); tích hợp Core Insurance, Payment, CRM; tuân thủ bảo mật và quy định ngành tài chính; English business level (bắt buộc), làm việc với team toàn cầu.

Đọc vài câu english có sẵn để theo đúng format (câu hỏi tiếng Anh, đáp án giải thích tiếng Việt + câu trả lời mẫu tiếng Anh). Câu cần có:
1. "Walk me through a digital channel feature you built end to end" — kể dự án fullstack (Spring Boot + React) theo STAR, có số liệu. (senior)
2. "How would you explain a technical trade-off to a non-technical insurance product owner?" (senior)
3. "Tell me about a time you worked with a team in another country or time zone. What went wrong and what did you change?" (mid)
4. "A production payment issue happens during a global team meeting. How do you report it in English?" — mẫu báo cáo sự cố ngắn: impact, timeline, next steps. (senior)

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu; `tags` có `'jd-2026-12'`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-english.js`); đọc danh sách để **không trùng ý** (nếu trùng thì chọn góc sâu hơn, ghi Notes).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ.**
- **Chỉ THÊM** vào `js/data/q-english.js` (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau.
- Không backtick, không `${` trong template literal.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL 15+, Kafka 3.x, FIX 4.4/5.0 SP2 khi nói về FIX). Không bịa tag, API, flag. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, chuẩn bị phỏng vấn đúng JD bên dưới: giải thích từ gốc, từng bước, VÌ SAO.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm english-259..english-262 (4 câu) vào js/data/q-english.js.
Reviewed-by: kilo (T2815R)
