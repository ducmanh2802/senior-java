# T2107R — Fact-check nội dung mới của T2107

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2107 (xem `git diff HEAD -- <file>`) do model free viết, đã review xong.

## Thành quả review

**4 câu hỏi bảo mật mới được thêm:** security-072 (CSRF cho SPA dùng cookie), security-073 (IDOR/BOLA so với thiếu xác thực), security-074 (SSRF trong backend Java), security-075 (Quản lý secret Spring Boot production).

**Xét lỗi kỹ thuật:**
- **API/flag bịa**: Không tìm thấy API/flag nào sai lệch hoặc bịa đặt. Mô tả cấu hình Spring Security, JWT, OAuth2 đều phù hợp với Java 17/21, Spring Boot 3.x.
- **Mặc định sai**: Không tìm thấy giá trị mặc định nào sai cách. Các cài đặt bảo mật (SameSite, cost factor, key rotation...) đều đúng theo hướng dẫn industry.
- **Cơ chế nói ngược**: Không có cơ chế nào bị đảo ngược mô tả.
- **Số liệu vô căn cứ**: Không có số liệu nào được đưa ra không có nguồn foundations. Mọi số liệu, thời gian, cấu hình đều có nguồn tham khảo hoặc là thiết kế chuẩn.
- **Lỗi markup**: Không có ký tự backtick `` ` `` trái lệch bên trong template literal. Dùng `{{...}}` cho inline code theo đúng AGENTS.md. Không có `${`未经转义`.
- **Chữ nước ngoài lẫn vào**: Văn phong tiếng Việt cho các thuật ngữ kỹ thuật bằng tiếng Anh, đáp ứng yêu cầu "Giao diện viết bằng tiếng Việt; thuật ngữ kỹ thuật giữ nguyên tiếng Anh".

**Kết quả validator:** Chạy `node scripts/validate.js q-security.js` không báo lỗi schema nào về câu hỏi bảo mật (chỉ báo `index-light.js: đã cũ` là do thêm mới câu hỏi nên cần rebuild index - đây là hành vi chuẩn khi thêm nội dung). Chạy validator toàn bộ project vẫn có lỗi từ các file khác (microservices, lessons, bugs...) nhưng là lỗi trước đã có, không liên quan đến file do task sở hữu.

**Kết luận:** Không có lỗi kiến thức, markup hoặc dữ liệu vô căn cứ nào trong 4 câu hỏi bảo mật mới. Nội dung phù hợp với đối tượng dev Java 4+ năm chuẩn bị phỏng vấn Senior, giải thích chi tiết theo đúng phong cách: mở đầu `**Tóm tắt:**`, đi sâu từng bước `cái gì → vì sao cần → hoạt động thế nào → ví dụ cụ thể → lỗi hay gặp → trả lời phỏng vấn thế nào`, và kết thúc bằng `> Senior tip:`.

## Notes
- index-light.js bị cũ làExpected khi thêm câu hỏi mới - chạy `node scripts/build-light-index.js` để khôi phục (mật lỗi build do q-microservices.js có syntax lỗi riêng, không phải do file này)
- Không sửa file core, base.css, index.html hay các file khác (theo quy tắc AGENTS.md mục 3)
- Task hoàn tất: việc fact-check 4 câu hỏi bảo mật mới xong, Status: DONE
