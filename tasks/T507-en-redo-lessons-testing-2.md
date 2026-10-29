# T507 — Dịch lại (nội dung đã sửa): lessons-testing-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-testing.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-testing-2.en.js` đã cũ: **lesson-testing-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-testing.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-testing-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-testing-2 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ entry `lesson-testing-003` trong `js/i18n/lessons-testing-2.en.js` theo bản tiếng Việt hiện tại của `js/data/lessons-testing.js` (đọc lại sau lần chạy trước bị gián đoạn, giữ phần tốt, chỉ sửa câu chữ chưa chuẩn): title, goals (3), body (8 mục `###`, 2 code block `~~~java` với comment đã dịch, bảng 6 loại property, 5 bullet giới hạn), 1 exercise (title/prompt/3 hints/explain), 3 câu check (q/4 options/explain).
- Các thay đổi tiếng Việt được phản ánh đủ: dòng Metamorphic mới (merge(a,b)=merge(b,a), cộng k), đoạn ghi chú `Random` thread-safe bằng `AtomicLong`/CAS + `ThreadLocalRandom` không đặt seed được + `SplittableRandom` nhận seed, ví dụ shrinking mới (`a = []`, `b = [0]`), và yêu cầu message harness chứa `seed=<seed trial>`/`trial=<số trial>`.
- Không chép `starter`/`tests`/`reference` (code giữ từ file dữ liệu, chỉ field dịch nằm trong overlay); không đụng mục nào khác. Header đổi sang task T507 cho khớp các file redo khác.
- Kiểm tra: `node scripts/check-i18n.js lessons-testing-2` → OK (1 mục); `node scripts/validate.js` → OK — không có lỗi.
- Lưu ý môi trường: `node --check` bị sandbox chặn quyền chạy trên máy này; cú pháp đã được xác minh gián tiếp vì `check-i18n.js` biên dịch và chạy chính file trong `vm`.
Reviewed-by: check-i18n (translation, no LLM review)
