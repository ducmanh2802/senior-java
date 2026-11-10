# T488 — Dịch lại (nội dung đã sửa): algo-16 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-16.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-16.en.js` đã cũ: **algo-109, algo-110, algo-111, algo-112, algo-113, algo-114, algo-115, algo-116, algo-117**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-16.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-16 → OK; node scripts/validate.js → OK.

## Notes

- Khi bắt đầu, `js/i18n/algo-16.en.js` trong working tree đã có bản dịch đầy đủ 9 mục do lần chạy trước bị gián đoạn (file còn ở HEAD chỉ là stub rỗng); đã đọc lại toàn bộ, không có lỗi cú pháp, `check-i18n` chạy được.
- Đối chiếu từng mục `algo-109` … `algo-117` với bản tiếng Việt hiện tại trong `js/data/algo.js` (đã viết lại ở commit 9b9bcd3): prompt, ví dụ, ràng buộc, toàn bộ hints, solution (gồm cả chú thích trong code Java đã dịch sang tiếng Anh, không còn comment tiếng Việt), mục "Chạy tay", "Độ phức tạp", "Lưu ý khi phỏng vấn", Senior tip và follow đều khớp nội dung mới — không còn đoạn nào của bản dịch cũ.
- Kiểm tra tự động: 9/9 id có đủ field `prompt`/`hints`/`solution`/`follow`; mỗi mục đều 3 hints + 2 follow, trùng bản VI; các code block Java khớp bản VI ngoài phần comment; số hiệu ràng buộc và inline code (`{{...}}`) khớp.
- Không có backtick trong giá trị, không có `${`; chỉ dùng markup của AGENTS.md mục 5.
- Đã chạy `node scripts/check-i18n.js algo-16` → OK — 9 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
- File nháp dùng để soát (`t488cmp.js`, thư mục `.tmp-t488/`) vẫn còn trong working tree vì shell của phiên này chặn lệnh xoá; cả hai là file chưa được track, người tích hợp có thể xoá, đừng commit.
