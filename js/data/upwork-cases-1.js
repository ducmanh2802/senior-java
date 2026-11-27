/*
 * Case khó Freelance & Upwork (#/upwork, tab Case khó), phần 1. Schema + luật: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Case mẫu: uw-case-001 (đọc kỹ trước khi viết case mới).
 * Id uw-case-NNN duy nhất trên mọi file upwork-cases-*.js.
 */
(window.UPWORK_CASES = window.UPWORK_CASES || []).push(
{
  id: 'uw-case-001',
  category: 'payment',
  level: 'senior',
  severity: 'high',
  title: 'Khách nhận code rồi không duyệt milestone, còn đòi hoàn tiền',
  situation: `Hợp đồng fixed-price 1.200 USD, 3 milestone: API đặt lịch (400), tích hợp thanh toán (500), deploy + tài liệu (300). Milestone 1 đã funded và được duyệt. Milestone 2 funded 500 USD; bạn làm 9 ngày, đẩy code lên repo GitHub riêng của khách (khách cấp quyền) và nhắn "done, please check". Ba ngày sau khách trả lời: "The payment flow is not what we need, I want a refund for milestone 2". Kiểm tra lại: tính năng chạy đúng mô tả trong hợp đồng; khách chưa từng nhắn yêu cầu nào khác. Bạn cũng nhận ra mình **chưa bấm submit work** trên hợp đồng.`,
  signals: [
    'Khách im lặng nhiều ngày sau khi bạn báo xong, rồi xuất hiện với yêu cầu hoàn tiền thay vì góp ý cụ thể.',
    'Lời chê chung chung ("not what we need") không chỉ ra điểm nào lệch so với mô tả milestone.',
    'Khách đã có toàn bộ source code trong repo của họ trước khi milestone được duyệt.',
    'Ngân sách hoặc kế hoạch phía khách vừa thay đổi (họ nhắc tới "pivot", "investor", "budget cut").',
  ],
  steps: `1. **Bình tĩnh, không trả lời trong lúc nóng giận.** Mọi tin nhắn từ giờ có thể là bằng chứng. Không đe doạ review xấu, không xoá quyền repo một cách đột ngột khi chưa nói rõ lý do.
2. **Submit work ngay trên hợp đồng.** Đính kèm link commit/tag, mô tả ngắn từng mục trong phạm vi milestone và cách kiểm tra. Đây là mốc chính thức để khách review; thiếu nó thì không có cơ chế tự giải ngân và bạn yếu thế khi tranh chấp.
3. **Đối chiếu phạm vi bằng văn bản.** Lập bảng: mục trong mô tả milestone → bằng chứng đã làm (commit, ảnh chụp, video 2 phút demo). Gửi cho khách qua Upwork Messages, hỏi cụ thể: "Which item in the milestone description is not met?".
4. **Tách yêu cầu mới khỏi milestone cũ.** Nếu điều khách muốn khác với mô tả (ví dụ đổi từ Stripe Checkout sang subscription), đó là phạm vi mới: đề xuất milestone mới có giá, không sửa miễn phí trong milestone 2.
5. **Khi khách bấm yêu cầu hoàn tiền trên hệ thống:** bạn có thể đồng ý, hoàn một phần, hoặc từ chối. Nếu phần việc đúng phạm vi đã làm xong, hãy từ chối và mở dispute để bộ phận hỗ trợ của Upwork làm trung gian (mediation). Nộp bảng đối chiếu ở bước 3, link submit, toàn bộ trao đổi trên Upwork.
6. **Cân nhắc hoàn một phần nếu bạn cũng có lỗi.** Ví dụ bạn làm thiếu webhook xử lý thanh toán lỗi mà mô tả có ghi: đề nghị hoàn 100 USD và hoàn tất phần thiếu, thay vì đánh cược cả 500 USD và JSS.
7. **Nếu mediation không thành:** arbitration có phí và mất thời gian; với khoản vài trăm USD thường không đáng. Tính toán: số tiền còn tranh chấp so với phí, thời gian và rủi ro review xấu. Ghi lại bài học, đừng để cảm xúc quyết định.
8. **Quyền sở hữu code:** với fixed-price, quyền sở hữu sản phẩm thường chuyển cho khách khi khách thanh toán cho phần việc đó. Trong tin nhắn, nhắc nhẹ rằng code của milestone 2 thuộc phần chưa thanh toán; không xoá dữ liệu của khách, không chèn mã "khoá" sản phẩm (vi phạm và có thể phạm luật).

Nhánh hay gặp:
- **Khách trả lời "ok I will check" rồi im lặng:** để thời hạn review chạy hết; nhắc một lần trước hạn 2–3 ngày.
- **Khách đòi call để "giải thích":** đồng ý, nhưng gửi lại tóm tắt cuộc gọi bằng tin nhắn Upwork ngay sau đó ("To recap our call…").
- **Khách doạ để lại review 1 sao:** không đổi lập trường vì doạ; feedback dùng để ép thanh toán là vi phạm điều khoản, có thể báo cho hỗ trợ của Upwork.`,
  templates: [
    { name: 'Nộp bài kèm đối chiếu phạm vi', text: 'Hi Mark, I have submitted milestone 2 on the contract. Here is how each item in the milestone description is covered:\n1) Checkout session for bookings: commit a1b2c3, demo video (2 min) linked in the submission.\n2) Payment success/failure webhooks: commit d4e5f6, tested with test-mode events.\n3) Booking status update after payment: covered by the tests in PaymentFlowTest.\nCould you tell me which item does not match what you need? I am happy to fix anything that is within this scope.' },
    { name: 'Từ chối hoàn tiền, mở đường cho yêu cầu mới', text: 'Hi Mark, thanks for the feedback. The work delivered matches the milestone description we agreed on, so I am not able to approve a full refund. If your plans have changed and you now need subscriptions instead of one-time payments, I can propose a new milestone for that change with a clear scope and price. Let me know by Friday which option works for you.' },
    { name: 'Tóm tắt sau cuộc gọi', text: 'Hi Mark, to recap our call today: (1) the one-time payment flow in milestone 2 works as described, (2) you would like to switch to monthly subscriptions, which is new scope, (3) I will send a proposal for a new milestone by tomorrow. Please correct me if I missed anything.' },
  ],
  mistakes: [
    'Không bấm submit work, chỉ nhắn "done" trong chat: không có mốc review, tranh chấp khó hơn nhiều.',
    'Giao toàn bộ source code trước khi milestone được duyệt: khách có sản phẩm mà không còn động lực trả tiền.',
    'Chấp nhận hoàn tiền toàn bộ để "giữ hoà khí": mất tiền và tạo tiền lệ khách khác lợi dụng.',
    'Đổi ý sửa miễn phí phạm vi mới để được approve: sau đó khách tiếp tục đổi yêu cầu.',
    'Trả lời gay gắt, đe doạ: tin nhắn đó trở thành bằng chứng chống lại bạn khi mediation.',
  ],
  prevention: `- Viết mô tả milestone **kiểm chứng được**: liệt kê tính năng, tiêu chí nghiệm thu, thứ không nằm trong phạm vi.
- Giao bản demo (video, staging, ảnh chụp) trước; giao source đầy đủ qua submit work hoặc khi milestone được duyệt, tuỳ thoả thuận ban đầu.
- Chia milestone nhỏ (≤ 1 tuần công) để mỗi lần rủi ro chỉ là một phần nhỏ của hợp đồng.
- Với khách mới, không có lịch sử thanh toán trên Upwork, ưu tiên milestone nhỏ đầu tiên làm phép thử.

> Senior tip: Mỗi lần nhắn "done", hãy để nó đi kèm một lần submit work và một bảng đối chiếu phạm vi 3–5 dòng. Thói quen này tốn 10 phút nhưng biến hầu hết tranh chấp thành cuộc trao đổi về một dòng cụ thể, thay vì về cảm giác "không như mong đợi".`,
  related: ['uw-ch-01', 'remote-011', 'remote-012'],
  tags: ['milestone', 'refund', 'dispute', 'fixed-price'],
},
);
