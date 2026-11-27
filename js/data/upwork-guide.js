/*
 * Cẩm nang Freelance & Upwork (#/upwork, tab Cẩm nang). Schema + luật nội dung: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Chương mẫu: uw-ch-01 (đọc kỹ trước khi viết chương mới).
 * Số liệu của nền tảng thay đổi theo thời gian: chỉ ghi khi chắc chắn, kèm "(tại thời điểm viết)".
 */
(window.UPWORK_GUIDE = window.UPWORK_GUIDE || []).push(
{
  id: 'uw-ch-01',
  order: 1,
  title: 'Cơ chế Upwork: tiền đi đâu và khi nào bạn được bảo vệ',
  icon: '⚙️',
  summary: 'Hiểu hai loại hợp đồng (hourly, fixed-price), dòng tiền qua escrow và điều kiện để Upwork bảo vệ bạn. Mọi case khó phía sau đều dựa trên chương này.',
  body: `**Tóm tắt:** Upwork chỉ bảo vệ tiền của bạn khi bạn làm đúng "đường ray" của nó: hourly thì giờ phải được ghi bằng Work Diary, fixed-price thì chỉ làm phần việc đã có milestone được nạp tiền (funded) và nộp bài bằng nút submit trên hợp đồng. Ra khỏi đường ray (nhận tiền ngoài, làm trước khi nạp tiền, ghi giờ thủ công) là tự bỏ bảo hiểm.

### Vì sao phải hiểu cơ chế trước khi nhận việc
Phần lớn freelancer mới mất tiền không phải vì code dở mà vì **làm việc ngoài vùng được bảo vệ**: giao toàn bộ source code trước khi khách nạp tiền milestone, đồng ý "làm thử 2 ngày rồi tính", hoặc nhận chuyển khoản riêng. Khi có tranh chấp, bộ phận hỗ trợ của Upwork chỉ nhìn vào những gì nằm trên nền tảng: hợp đồng, milestone, Work Diary, tin nhắn trong Upwork Messages, file đã nộp. Thứ gì nằm ngoài (Telegram, email riêng, cuộc gọi không ghi lại) gần như không có giá trị làm bằng chứng.

### Hai loại hợp đồng
| | Hourly | Fixed-price |
|---|---|---|
| Trả theo | giờ làm, tính theo tuần | milestone (mốc bàn giao) |
| Bạn được bảo vệ khi | giờ ghi bằng Upwork desktop app (Work Diary có ảnh chụp màn hình + memo), đúng phạm vi hợp đồng, trong giới hạn giờ/tuần khách đặt | milestone đã **funded** (tiền nằm trong escrow) trước khi bạn làm, và bạn nộp bài bằng submit work |
| Rủi ro chính | khách tranh chấp giờ ghi tay (manual time), giờ vượt weekly limit | scope creep, khách không duyệt, khách đòi hoàn tiền |
| Hợp với | việc khó ước lượng, bảo trì, hỗ trợ dài hạn | việc có đầu ra rõ, khách mới chưa tin nhau |

**Escrow** là tài khoản trung gian: khách nạp tiền milestone vào đó trước, Upwork giữ hộ, chỉ chuyển cho bạn khi milestone được duyệt (hoặc tự động giải ngân khi hết thời gian review mà khách không phản hồi). Ví dụ đời thường: giống mua hàng trên sàn thương mại điện tử, tiền nằm ở sàn cho tới khi người mua bấm "đã nhận hàng" hoặc hết hạn khiếu nại.

### Dòng tiền của một milestone fixed-price
~~~seq
title: Một milestone fixed-price đi đúng đường ray
actors: Client | Upwork | Freelancer
Client -> Upwork: Nạp tiền milestone 1 (funded, vào escrow)
Upwork --> Freelancer: Thông báo milestone đã funded
Freelancer -> Freelancer: Bắt đầu làm (chỉ sau bước này)
Freelancer -> Upwork: Submit work kèm file/link + mô tả
Upwork --> Client: Yêu cầu review trong thời hạn
Client -> Upwork: Approve hoặc request changes
Upwork --> Freelancer: Giải ngân (hoặc tự giải ngân khi quá hạn review)
~~~

Ba điểm hay bị bỏ qua:
1. **"Funded" khác "đã thỏa thuận".** Khách nhắn "ok bắt đầu đi" nhưng chưa nạp tiền thì milestone chưa được bảo vệ. Kiểm tra trạng thái trên trang hợp đồng, không tin lời nhắn.
2. **Nộp bài phải qua submit work.** Gửi link GitHub trong tin nhắn không làm đồng hồ review chạy. Không submit thì không có mốc tự giải ngân.
3. **Request changes không phải từ chối.** Khách được yêu cầu sửa; bạn sửa trong phạm vi đã thoả thuận rồi submit lại. Yêu cầu ngoài phạm vi thì đề xuất milestone mới (xem case scope creep).

### Hourly: giờ nào được bảo vệ
Hourly protection dựa trên **Work Diary**: Upwork desktop app chụp màn hình ngẫu nhiên theo từng khoảng 10 phút và ghi mức hoạt động bàn phím/chuột, kèm memo bạn viết. Khách xem lại giờ trong một khoảng thời gian review sau khi tuần kết thúc và có thể tranh chấp giờ trong khoảng đó. Giờ được bảo vệ khi: ghi bằng app, ảnh chụp cho thấy đúng việc của hợp đồng, memo mô tả rõ, không vượt giới hạn giờ/tuần. **Manual time** (giờ nhập tay) thường không được bảo vệ, chỉ dùng khi khách đã đồng ý bằng tin nhắn trên Upwork.

Ví dụ: hợp đồng 30 USD/giờ, limit 20 giờ/tuần. Bạn làm 24 giờ vì "khách gấp". 4 giờ vượt limit không được tính tiền. Muốn làm thêm thì nhờ khách nâng limit trên hợp đồng **trước**, xác nhận bằng tin nhắn.

### Phí và rút tiền (mức cơ chế)
Upwork thu phí dịch vụ trên mỗi khoản bạn nhận và mức phí đã đổi nhiều lần; xem trang Fees trên Upwork Help trước khi báo giá. Khi tính giá, luôn tính **tiền thực nhận** = giá × (1 − phí) − phí rút tiền − chênh lệch tỷ giá. Tiền vừa giải ngân thường qua một khoảng thời gian chờ (security period) rồi mới rút được, nên đừng hứa trả nợ hay chi tiêu theo ngày khách approve.

### Điều khoản dễ vi phạm nhất
- **Lôi khách ra ngoài:** khách bạn gặp qua Upwork thì trong 24 tháng không được chuyển sang làm/nhận tiền ngoài nền tảng, trừ khi trả conversion fee theo quy định. Vi phạm có thể bị khoá tài khoản vĩnh viễn, mất luôn số dư.
- **Chia sẻ thông tin liên lạc trước khi có hợp đồng:** hệ thống quét tin nhắn; khách lạ đòi chuyển sang Telegram/WhatsApp ngay là dấu hiệu lừa đảo kinh điển.
- **Cho người khác dùng tài khoản / đứng tên hộ:** vi phạm và là đường tắt bị khoá tài khoản.

### Pitfall thực tế
- Làm milestone 2 trong khi milestone 2 chưa funded vì "khách quen rồi" → khách hết ngân sách, bạn mất trắng một tuần.
- Dùng hourly nhưng quên bật app một buổi, nhập manual 5 giờ → khách tranh chấp, giờ đó không được bảo vệ.
- Gửi source code đầy đủ qua tin nhắn trước khi submit → khách có sản phẩm, không còn động lực approve.

> Senior tip: Trước mỗi hợp đồng, tự hỏi một câu: "Nếu ngày mai khách biến mất, phần nào trong công sức của mình đang được Upwork bảo vệ?". Câu trả lời phải là "tất cả những gì đã làm". Nếu không, dừng lại và yêu cầu fund milestone hoặc chuyển sang hourly có Work Diary trước khi làm tiếp.`,
  checklist: [
    'Mở một hợp đồng bất kỳ (hoặc xem trang Help) và chỉ ra trạng thái funded của từng milestone.',
    'Cài Upwork desktop app, thử bật/tắt ghi giờ và viết memo cho một phiên làm việc.',
    'Đọc trang Fees và Payment Protection trên Upwork Help, ghi lại tỷ lệ phí hiện tại vào ghi chú của bạn.',
    'Tính tiền thực nhận cho một milestone 500 USD theo phí hiện tại và phí rút tiền của phương thức bạn dùng.',
    'Viết sẵn một câu trả lời lịch sự khi khách đề nghị chuyển sang làm ngoài Upwork.',
  ],
  related: ['remote-010', 'remote-011', 'remote-012', 'remote-016'],
},
);
