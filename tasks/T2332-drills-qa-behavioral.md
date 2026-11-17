# T2332 — 20 drill hỏi-đáp tiếng Anh behavioral cho Senior

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T2305

Định dạng `qa` ở comment đầu file. Grep `q:` để không trùng. Thêm 20 drill (theme behavioral/project/negotiation): xung đột trong team, sự cố production, deadline gấp, mentoring, nói không với yêu cầu vô lý, thương lượng lương/offer remote, giải thích khoảng trống CV, lý do nghỉ việc. sample 80–200 từ STAR có số liệu, phrases 3–6.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/drills-qa.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Id trước: `drill-qa-181` (id lớn nhất cũ). Id sau: `drill-qa-201`. Đã thêm **20 drill mới** (id `drill-qa-182` … `drill-qa-201`), tăng đúng 20 số.
- Theme: 9 behavioral (182, 183, 184, 185, 192, 193, 196, 199, 201), 6 negotiation (186, 187, 188, 189, 195, 198), 5 project (190, 191, 194, 197, 200).
- Nội dung theo yêu cầu: xung đột trong team (182), sự cố production ngoài giờ (183), deadline gấp + từ chối scope (184, 197), mentoring junior (185), nói không với yêu cầu vô lý / scope miễn phí (186), thương lượng remote vs hybrid (187), giải thích khoảng trống CV (188), lý do nghỉ việc (189), trade-off kỹ thuật (190), migration/cutover rủi ro (191), bất đồng với người senior (192), bị blame oan (193), cải tiến legacy không rewrite (194), thương lượng promotion (195), xử lý underperformance (196), xin tăng lương (198), yêu cầu mơ hồ (199), phụ thuộc cross-team (200), nhận trách nhiệm & lãnh đạo khôi phục (201).
- Mỗi sample 110–130 từ (trong khoảng 80–200), phrases 4–5 mục (3–6), không backtick, không ký hiệu `$`.
- Nghiệm thu: `node --check js/data/drills-qa.js` → OK; `node scripts/build-light-index.js` đã chạy (index-light 336.2 KB); `node scripts/validate.js` không báo lỗi nào cho `drills-qa.js` (201 drill hợp lệ).
- Lưu ý: `validate.js` hiện còn báo lỗi ở các file KHÁC đang được agent khác sửa dở (dấu hiệu đồng thời): `labs-thread.js` (Unexpected identifier 'rubric'), `lessons-jpa.js` (Unexpected token ':'), `quiz-autotest.js` (### thụt đầu dòng), `projects.js`/`path.js` (lesson-jpa chưa tồn tại). Đây KHÔNG phải file của task này (rule 3: không sửa file ngoài phạm vi). Khi các agent kia hoàn tất và chạy lại build-light-index + validate, repo sẽ OK.
Reviewed-by: kilo (T2332R)
