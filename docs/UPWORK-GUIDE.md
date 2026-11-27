# Cẩm nang Freelance & Upwork (`#/upwork`)

Phần riêng, tách khỏi lộ trình `#/freelance` (lộ trình đó là cho MỘT job cụ thể). Ở đây có hai tab:

- **📖 Cẩm nang**: các chương đọc theo thứ tự, từ cơ chế Upwork tới làm freelance bền vững.
- **🔥 Case khó**: từng tình huống khó có thật, gồm dấu hiệu nhận biết, cách xử lý từng bước, tin nhắn mẫu tiếng Anh,
  sai lầm hay gặp và cách phòng ngừa.

Người đọc: dev Java khoảng 4 năm ở Việt Nam, mới (hoặc sắp) làm freelance trên Upwork, tiếng Anh ở mức đọc được.
Giải thích bằng tiếng Việt có dấu; tin nhắn/mẫu gửi khách viết bằng tiếng Anh.

Kiểm tra: `node scripts/check-upwork.js` → `OK`. Không trùng nội dung với câu hỏi topic `remote` (`js/data/q-remote.js`);
có thể trỏ tới chúng qua `related`.

## Dữ liệu

### `js/data/upwork-guide.js` → `window.UPWORK_GUIDE`
```js
(window.UPWORK_GUIDE = window.UPWORK_GUIDE || []).push(
{
  id: 'uw-ch-01',            // uw-ch-NN, duy nhất, tăng dần
  order: 1,                  // thứ tự đọc (số nguyên, duy nhất)
  title: 'Cơ chế Upwork: …', // ≤ 90 ký tự
  icon: '⚙️',
  summary: '1–2 câu: đọc chương này để làm được gì',   // 40–300 ký tự
  body: `markup ≥ 3000 ký tự: ### các phần, bảng, ~~~seq, > lưu ý; kết thúc bằng > Senior tip:`,
  checklist: ['việc cụ thể làm ngay sau khi đọc', '…'], // 3–8 mục, mỗi mục ≥ 15 ký tự
  related: ['remote-012'],   // tuỳ chọn: id câu hỏi có thật, hoặc id case 'uw-case-NNN'
},
);
```

### `js/data/upwork-cases-<n>.js` → `window.UPWORK_CASES`
```js
(window.UPWORK_CASES = window.UPWORK_CASES || []).push(
{
  id: 'uw-case-001',         // uw-case-NNN, duy nhất toàn bộ các file
  category: 'payment',       // account | proposal | contract | payment | client | scam | review
  level: 'senior',           // mid | senior | lead (độ khó xử lý)
  severity: 'high',          // high | medium | low (mức thiệt hại nếu xử lý sai)
  title: 'Khách nhận code rồi không duyệt milestone, còn đòi hoàn tiền',   // ≤ 110 ký tự
  situation: `markup ≥ 300 ký tự: bối cảnh cụ thể có số liệu (giá, ngày, tin nhắn của khách)`,
  signals: ['dấu hiệu nhận biết sớm', '…'],          // 2–6 mục
  steps: `markup ≥ 1200 ký tự: xử lý TỪNG BƯỚC, đánh số; mỗi bước nói làm gì trên Upwork, vì sao, nếu khách phản ứng X thì sao`,
  templates: [                                     // 1–4 tin nhắn mẫu, tiếng Anh, lịch sự nhưng chắc
    { name: 'Nhắc duyệt milestone', text: 'Hi Mark, …' },          // text ≥ 120 ký tự, plain text (không markup)
  ],
  mistakes: ['sai lầm hay gặp + hậu quả', '…'],      // 2–6 mục
  prevention: `markup ≥ 300 ký tự: làm gì từ đầu để case này không xảy ra; kết > Senior tip:`,
  related: ['remote-012'],                          // tuỳ chọn: id câu hỏi / chương / case có thật
  tags: ['milestone', 'dispute'],                   // tuỳ chọn
},
);
```

## Luật nội dung
- Markup như AGENTS.md mục 5. Không backtick, không `${` trong template literal.
- **Đúng sự thật về Upwork.** Phí, giá Connects, ngưỡng badge, số ngày của các mốc thay đổi theo thời gian:
  chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế.
  Không bịa tên tính năng hay nút bấm.
- Cơ chế cốt lõi được phép dựa vào: hợp đồng hourly (Work Diary, Payment Protection cho giờ được ghi bằng Upwork
  desktop app) và fixed-price (milestone được nạp tiền vào escrow trước khi làm, freelancer bấm submit work, khách duyệt
  hoặc yêu cầu sửa, quá hạn review thì tiền tự giải ngân); dispute qua bộ phận hỗ trợ (mediation), arbitration có phí;
  điều khoản cấm lôi khách ra ngoài (khách gặp trên Upwork trong 24 tháng, trừ khi trả conversion fee); không nhận tiền
  ngoài nền tảng; Job Success Score và feedback hai chiều.
- Mỗi case phải là tình huống **thật sự khó** (có xung đột lợi ích, tiền, rủi ro tài khoản, hoặc lựa chọn không hiển nhiên),
  không phải mẹo chung chung. Xử lý phải có thứ tự, có nhánh "nếu khách làm X thì…".
- Tin nhắn mẫu: tiếng Anh tự nhiên, ngắn, không xin lỗi quá mức, không đe doạ; nêu sự kiện + đề xuất + hạn.
