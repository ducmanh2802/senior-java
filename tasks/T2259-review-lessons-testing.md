# T2259 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-testing.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-testing.js`
After: T2173

## Notes

Số mục trước/sau: **13 bài (`lesson-testing-001` … `lesson-testing-013`) — không đổi**, không xoá/đổi id.

Lần chạy trước bị gián đoạn giữa bài 010: file còn **lỗi cú pháp** (2 dòng trong `body` của bài 010 dùng backtick thay vì `{{…}}` làm vỡ template literal) và **bài 008–009, 011–013 bị mất dấu tiếng Việt** (body bị ghi lại dạng không dấu, lẫn "tưong tac", "dưoc"…). Đã restore các body đó từ HEAD rồi add lại phần còn thiếu, giữ nguyên các mục `exercises`/`starter`/`tests`/`reference`/`check` (không sửa code chạy).

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| 001 | Thiếu `**Tóm tắt:**`, thiếu ví dụ số liệu + trả lời mẫu; không có lỗi cú pháp | Giữ phần thêm từ lần trước (Tom tat/Ví dụ đời thực/Trả lời mẫu); rà lại check — explain đã nêu vì sao từng phương án sai |
| 002 | Mô tả `Clock.tick` sai ("nhích từng bước cố định"); thiếu Tóm tắt/ví dụ/trả lời mẫu | Sửa lại: `Clock.tick` **làm tròn xuống** theo bước (bỏ mili giây), dùng khi code nhạy độ phân giải; giữ các mục đã thêm |
| 003 | Tóm tắt chèn tiếng Anh "hàng hundred input" | Sửa thành "hàng trăm input"; các mục khác đã đủ |
| 004 | Heading "### Trả lời mẫu khi phỏngấn" (sai chính tả, lặp ở 4 bài) | Sửa thành "phỏng vấn" cho 004/005/006/007; phần thân đã đạt (bốn trạng thái PASS/FAIL/SKIP/NOT RUN, bất biến tổng) |
| 005 | "thay thuật toán,.extract class"; "Approach:" lẫn tiếng Anh; biến `legacyOut` khai báo mà không dùng; gợi ý "Instancio/Snapshot Testing" sai (Instancio là bộ sinh dữ liệu, không phải snapshot); câu "khác với spec test" viết thường | Sửa 5 chỗ trên: đổi thành approval testing (ApprovalTests) + JsonAssert; xoá biến thừa; viết hoa đầu câu; giữ mục "Tóm tắt cho phỏng vấn" |
| 006 | "thuật toán tham lâm" (sai chính tả); mô tả nhãn output jqwik ("falsified/shrunken sample") như đúng từng phiên bản | Sửa chính tả; viết lại ở mức nguyên lý: cần tìm **mẫu gốc + mẫu đã thu gọn + seed**, tên dòng log đổi theo phiên bản |
| 007 | "Ví dụ đời thực" sai logic: mô tả mutant sống sót như bug production ("production trả 20.000 thay vì 23.000") | Viết lại: mutant sống = **lỗ hổng của suite**; nếu ai đó đưa điều kiện `kg <= 6` vào code thì CI vẫn xanh và hệ thống thu thiếu 3.000/đơn; giữ số liệu 60% → 90% |
| 008 | Body bị strip dấu (không đọc được); thiếu Tóm tắt + ví dụ + trả lời mẫu | Restore body có dấu; thêm `**Tom tắt:**` (không có ký tự accent lẫn), "Vi du doi thuc: service dat hang voi 3 dependency", "Tra loi mau khi phong van" |
| 009 | Body bị strip dấu; thiếu Tóm tắt; **trả lời mẫu dùng `Asia/Ho_Chi_Minh` trong khi câu hỏi là Paris**; ví dụ cleanup tự mâu thuẫn (2 token hết hạn nhưng `cleanup()` trả 0) | Restore body có dấu; sửa timezone thành `Europe/Paris`; viết lại ví dụ cleanup: A hết hạn (deleted 1) → advance 10 ngày → B hết hạn (deleted 1), C còn hạn; thêm Tom tắt/Ví dụ/Trả lời mẫu |
| 010 | **SyntaxError**: `createdAt`, `LocalDateTime`, `Clock.fixed`, `Instant.now()`… trong `body` viết bằng backtick → vỡ template literal, cả file không parse được | Đổi toàn bộ inline code sang `{{…}}` (đúng markup mục 5); thêm `**Tóm tắt:**`, "Ví dụ đời thực: mốc thời gian bị cắt lẻ sau khi lưu database", "Trả lời mẫu khi phỏng vấn" |
| 011 | Body bị strip dấu; thiếu Tóm tắt/ví dụ/trả lời mẫu | Restore body có dấu (bảng stub/mock/fake, code đếm call); thêm Tóm tắt + "Ví dụ đời thực: report service timeout vì N+1" (5.001 query → 2 query) + Trả lời mẫu |
| 012 | Body bị strip dấu; thiếu Tóm tắt/ví dụ/trả lời mẫu; `lockRow_blocksConcurrentReaders` sai (PostgreSQL `SELECT FOR UPDATE` chặn **writer**, không chặn reader) | Restore body có dấu; đổi tên method thành `lockRow_blocksConcurrentUpdate`; thêm Tóm tắt (test pyramid + slice test + Testcontainers) + ví dụ suite 480 test 38 phút → 6 phút + Trả lời mẫu; xác nhận `@MockitoBean` (Boot 3.4+) / `@ServiceConnection` (3.1+) là API thật |
| 013 | Body bị strip dấu; thiếu Tóm tắt/ví dụ/trả lời mẫu | Restore body có dấu (3 nguyên tắc chống flaky); thêm Tóm tắt + "Ví dụ đời thực: test hết hạn token đỏ 1 trong 20 lần" (MutableClock static dùng chung) + Trả lời mẫu |

Rà `check` (không đổi đáp án, chỉ bổ sung `explain`): 008 q2, 009 q1, 011 q1, 011 q2 trước đây chỉ giải thích đáp án đúng — đã thêm câu giải thích vì sao từng phương án còn lại sai. Các câu còn lại của 13 bài đã có đủ phần này.

Kiểm tra đã chạy (theo mục Nghiệm thu):
- `node --check js/data/lessons-testing.js` → OK (trước khi sửa: `SyntaxError: Unexpected identifier 'createdAt'`)
- `node scripts/build-light-index.js` → sinh lại `js/data/index-light.js`
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ `path.js: có 77 bài học không nằm trong PATH`, không phải lỗi)
- `node scripts/test-lessons.js` → `Lesson exercises OK: 304/304` (không sửa `tests`/`reference` nên kết quả không đổi)

Ghi chú thêm: không sửa `starter`/`tests`/`reference` của bất kỳ bài nào; body 008–009 giữ nguyên văn phong không dấu của bản gốc (ngoài phần mới thêm), các bài 010–013 dùng tiếng Việt có dấu theo HEAD.

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-testing.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js); JUnit 5/Mockito API có thật.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-testing.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.
Reviewed-by: verify-only (review task)
