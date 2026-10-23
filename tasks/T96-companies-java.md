# T96 — Công ty mục tiêu cho dev Java/Spring Boot: cập nhật + bổ sung hồ sơ

Status: DONE
Agent: opencode
Owns: `js/data/companies.js`

Người dùng là dev **Java/Spring Boot** muốn đậu Senior. Công ty mục tiêu: **Techcombank, VPBank, NAB Vietnam, GoTymeX, EPAM Vietnam, Money Forward Vietnam**.
**Dùng tìm kiếm web** (ITviec company reviews & interview reviews, Glassdoor, trang tuyển dụng chính thức, blog kỹ thuật của công ty, bài chia sẻ phỏng vấn 2024–2026).

## Việc cần làm
1. Đọc cấu trúc object trong `js/data/companies.js` (giữ nguyên đúng các field đang dùng, ví dụ `techcombank`) và cách view `js/views/companies.js` hiển thị chúng.
2. **Cập nhật** `techcombank`, `vpbank`, `nab-vietnam` bằng thông tin mới (2025–2026): stack, quy trình phỏng vấn, câu hỏi ứng viên kể lại, mẹo.
3. **Thêm mới** `gotymex`, `epam-vietnam`, `money-forward-vietnam`.
4. **Đề xuất thêm 3–4 công ty** stack Java/Spring Boot, review ITviec tốt (≥ 4.5) và quy trình phỏng vấn được ứng viên đánh giá dễ chịu/minh bạch — ví dụ cân nhắc GFT Technologies Vietnam, NAVER VIETNAM, Thoughtworks Vietnam, Topicus, Rakuten Fintech, MB Bank (đã có) — chọn theo bằng chứng tìm được.
5. Nếu field cho phép, ghi các chỉ số **có nguồn**: điểm ITviec, % recommend, độ khó phỏng vấn / tỷ lệ trải nghiệm tích cực (Glassdoor). **KHÔNG bịa "tỷ lệ đỗ"** — không có nguồn công khai; chỉ ghi chỉ số thật kèm nguồn, hoặc bỏ qua.
6. Mọi thông tin phải kèm nguồn (URL) trong field nguồn mà file đang dùng; thông tin cũ/không chắc thì ghi rõ mức độ tin cậy.

## Ràng buộc
- `focus` chỉ dùng topic id có trong `js/data/topics.js`. Không backtick, không `${`, không chữ Trung/Nhật/Hàn/Nga.
- `node --check js/data/companies.js` và `node scripts/validate.js` → OK.

## Notes

- Đã cập nhật Techcombank với case study AWS/annual report; VPBank theo JD Senior Java chính thức; NAB bổ sung review interview 2026, đồng thời ghi rõ review đó thuộc role khác và quy trình thay đổi theo team.
- Đã thêm GoTymeX, EPAM Vietnam, Money Forward Vietnam và đề xuất GFT Technologies Vietnam, NAVER VIETNAM, Rakuten Fintech Vietnam. Các điểm ITviec/recommend đều có nguồn; không thêm tỷ lệ đỗ.
- Không tìm thấy dữ liệu phỏng vấn Java Việt Nam mới, đủ tin cậy cho một số công ty; ghi rõ chưa xác minh và không tuyên bố interview dễ/chắc chắn minh bạch. Câu hỏi luyện tập được đánh dấu là gợi ý domain khi phù hợp.
- Kiểm tra: `node --check js/data/companies.js` và `node scripts/validate.js` đều thành công; validator in `OK — không có lỗi.`
Reviewed-by: codex (T96R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
