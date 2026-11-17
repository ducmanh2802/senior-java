# T2345 — 5 câu luyện "hỏi lại cho rõ" khi nhận yêu cầu nghiệp vụ ngân hàng (phần 2)

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2344

## Bối cảnh
Người học chưa có kinh nghiệm nghiệp vụ. Kỹ năng then chốt khi phỏng vấn/nhận việc: **gặp yêu cầu nghiệp vụ mơ hồ thì hỏi lại đúng câu** thay vì đoán. Đọc AGENTS.md mục 4–6; `node scripts/qtool.js list js/data/q-banking.js` để không trùng.

## Việc cần làm
Thêm 5 câu (topic `banking`, id tiếp số LỚN NHẤT, level senior), mỗi câu là một yêu cầu mơ hồ kiểu PO/interviewer đưa ra, lần lượt cho: đối soát với đối tác, tính lãi tiền gửi, mở tài khoản online eKYC, cảnh báo gian lận, xuất sao kê/báo cáo cho cơ quan quản lý.
Ví dụ dạng `q`: "PO nói: 'Làm cho anh tính năng hoàn tiền cho khách.' Trước khi thiết kế, bạn sẽ hỏi lại những gì và vì sao?"
Đáp án (3000–5000 ký tự):
- **Tóm tắt:** 1–2 câu.
- ### Các câu nên hỏi lại: 8–12 câu, nhóm theo: phạm vi & người dùng / tiền & số liệu (hạn mức, phí, làm tròn, tiền tệ) / trạng thái & lỗi (timeout, trùng, đảo) / quy định & audit / phi chức năng (độ trễ, khối lượng, realtime hay batch). Mỗi câu kèm **vì sao hỏi** (rủi ro nếu không hỏi).
- ### Nếu không hỏi thì chuyện gì xảy ra: 1 sự cố ví dụ có số liệu.
- ### Từ câu trả lời tới thiết kế: các câu trả lời khác nhau dẫn tới thiết kế khác nhau thế nào (bảng).
- ### Trả lời mẫu khi phỏng vấn: 150–220 từ, giọng Senior, có câu tiếng Anh ngắn tương đương ở cuối (2–3 câu hỏi lại bằng tiếng Anh).
- > Senior tip:

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá câu cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (+5).

## Nghiệm thu
`node --check js/data/q-banking.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id vào Notes.

## Notes

Đã thêm 5 câu: banking-067 (đối soát đối tác), banking-068 (tính lãi tiền gửi), banking-069 (mở tài khoản online eKYC), banking-070 (cảnh báo gian lận), banking-071 (xuất sao kê/báo cáo quản lý). Trước dòng `);` cuối file, không sửa câu cũ.
