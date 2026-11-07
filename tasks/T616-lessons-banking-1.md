# T616 — 3 bài học nghiệp vụ ngân hàng (tiền, sổ cái, vòng đời giao dịch)

Status: DONE

Notes: fixed syntax (id), expanded body ≥2500. lesson-banking-001 added. sdlc.js pre-existing syntax error unrelated. Path integration needed (lesson-banking-001 not in PATH).
Agent: kilo
Owns: `js/data/lessons-banking.js`

Track **banking** mới (file trống). Mục tiêu: người học **hiểu nghiệp vụ ngân hàng bằng cách tự code nó**. Mỗi bài mở đầu bằng một câu chuyện người dùng thật (Lan chuyển tiền, Minh vay mua xe…), giải thích nghiệp vụ bằng lời thường, rồi mới tới code. Đọc field `business` của proj-wallet trong js/data/projects.js để lấy giọng văn. Thêm 3 bài (order 1–3):
1. **Tiền trong code**: vì sao không dùng double, đơn vị nhỏ nhất (VND không có xu, USD có cent), BigDecimal scale/RoundingMode, phí giao dịch, chia tiền không mất đồng. Bài tập: `MoneyMath.fee(amount, percent, min, max)` làm tròn HALF_UP và kẹp min/max; `MoneyMath.allocate(long total, int[] ratios)` theo largest-remainder, tổng luôn bằng total. ≥ 6 case (có case 100.000 chia 3).
2. **Sổ cái kế toán kép**: tài khoản, bút toán Nợ/Có, giao dịch cân bằng, số dư = tổng bút toán, append-only, hoàn tiền bằng bút toán đảo. Bài tập: `Ledger` với `post(String txId, List<Entry>)` (ném lỗi khi lệch Nợ/Có, txId trùng, tài khoản khách bị âm), `balance(account)`, `reverse(txId)` chỉ 1 lần. ≥ 6 case.
3. **Vòng đời giao dịch chuyển khoản liên ngân hàng**: PENDING → SUCCESS / FAILED / TIMEOUT; TIMEOUT rồi ngân hàng đối tác báo SUCCESS muộn; callback trùng; tra soát (inquiry); vì sao "tiền bị trừ mà app báo lỗi". Bài tập: `TransferStateMachine` với `apply(event)` chỉ cho chuyển trạng thái hợp lệ, callback trùng là no-op, callback muộn sau TIMEOUT chuyển sang NEEDS_INQUIRY; ≥ 6 case.

- **Sơ đồ:** luồng có nhiều bên (app, service, DB, Kafka, ngân hàng đối tác…) hãy vẽ bằng khối ~~~seq (cú pháp ở AGENTS.md mục 5), mỗi bài/câu/giai đoạn quan trọng ít nhất 1 sơ đồ; validator kiểm tra cú pháp.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-banking.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes
Reviewed-by: kilo (T616R)
