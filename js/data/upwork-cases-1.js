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
{
  id: 'uw-case-002',
  category: 'payment',
  level: 'senior',
  severity: 'high',
  title: 'Khách tranh chấp 12 giờ tuần trước, trong đó 3 giờ là manual time',
  situation: `Hợp đồng hourly 35 USD/giờ, limit 25 giờ/tuần. Tuần trước bạn làm 15 giờ, đều bật Upwork desktop app (Work Diary) trừ một buổi mất điện 3 giờ bạn nhập tay (manual time) vì "khách gấp, cần gấp bản vá". Hôm nay khách mở tranh chấp (dispute) 12 giờ của tuần trước, nhắn: "I only see about 3 hours of real work in the diary, the rest looks padded, please refund". Bạn kiểm tra: 12 giờ khách đánh dấu gồm 9 giờ có ảnh chụp Work Diary (đúng việc hợp đồng) và 3 giờ manual. Khách chỉ phản đối chung chung, không chỉ ra dòng memo nào sai.`,
  signals: [
    'Khách chỉ trích "looks padded" nhưng không nêu được giờ/memo cụ thể nào không khớp mô tả công việc.',
    'Phần tranh chấp trùng đúng những giờ bạn nhập tay (manual time) — phần yếu nhất về bảo vệ.',
    'Thời điểm tranh chấp sát hạn review của tuần (giờ chỉ được bảo vệ trong một khoảng thời gian sau khi tuần kết thúc).',
    'Khách đổi giọng từ hài lòng sang nghi ngờ ngay sau khi bạn báo "đã xong bản vá".',
  ],
  steps: `1. **Không phản ứng trong lúc bực.** Mọi tin nhắn từ giờ là bằng chứng cho bộ phận hỗ trợ. Không viết "I worked those hours, trust me" — phải dựa vào dữ liệu trên nền tảng.
2. **Mở lại Work Diary của tuần đó và phân loại 12 giờ thành 2 nhóm:** 9 giờ có ảnh chụp màn hình + memo (được Payment Protection bảo vệ) và 3 giờ manual (không có ảnh, thường KHÔNG được bảo vệ). Đây là con số bạn phải nắm chắc trước khi trả lời.
3. **Trả lời trong Upwork Messages, bám sự kiện:** nêu rõ 9 giờ có Work Diary hợp lệ, mô tả memo từng buổi khớp việc gì; với 3 giờ manual, thừa nhận thẳng là nhập tay và giải thích lý do (mất điện), không chối.
4. **Đề xuất phương án chia đôi rủi ro:** chấp nhận hoàn 3 giờ manual (105 USD) để giữ 9 giờ được bảo vệ và giữ JSS, thay vì cãi cả 12 giờ. Tính: 3 giờ × 35 = 105 USD so với nguy cơ mất cả 12 giờ (420 USD) cộng review xấu.
5. **Nếu khách vẫn đòi cả 12 giờ:** từ chối phần 9 giờ có bằng chứng và để họ mở dispute chính thức để Upwork mediation xem Work Diary. Gửi link/ảnh chụp các buổi có memo rõ. Không tự bấm hoàn toàn bộ.
6. **Nếu khách đồng ý phương án 3 giờ:** hoàn đúng 3 giờ manual qua cơ chế của dispute, xác nhận bằng tin nhắn "Thanks, I have refunded the 3 manual hours; the remaining 9 hours are covered by the Work Diary". Kết thúc, không nhắc lại chuyện cũ.
7. **Rút kinh nghiệm vận hành:** từ giờ không nhập manual cho việc của hợp đồng; mất điện/mất app thì nhắn khách trên Upwork TRƯỚC "I will log this session as manual time, is that ok?" để có đồng ý bằng văn bản, hoặc làm bù giờ khác trong limit.

Nhánh hay gặp:
- **Khách nói "tôi chỉ đồng ý nếu hoàn hết":** giữ 9 giờ có bằng chứng, mở mediation, không nhượng bộ phần được bảo vệ.
- **Khách im lặng sau khi bạn đề xuất hoàn 3 giờ:** để đồng hồ dispute chạy; đừng tự hoàn thêm để "cho xong".
- **Bạn phát hiện memo 9 giờ viết sơ sài ("work on API"):** chủ động bổ sung mô tả chi tiết việc đã làm (endpoint nào, sửa lỗi gì) để mediation thấy rõ, nhưng không bịa.`,
  templates: [
    { name: 'Phân loại giờ và đề xuất hoàn phần manual', text: 'Hi Mark, I reviewed the Work Diary for last week. Of the 12 hours in question, 9 hours were tracked with the desktop app and include screenshots and memos (e.g. Tue 2-5pm: fixed the booking API 500 error, added validation). Those hours are covered by Upwork Payment Protection. The other 3 hours were logged as manual time because of a power outage while I was finishing the hotfix. I agree those 3 hours are not protected, so I can refund them (3 x $35 = $105). I am not able to refund the 9 hours that are documented in the diary.' },
    { name: 'Giữ phần có bằng chứng, mời mediation', text: 'Hi Mark, I understand the concern, but I am not able to refund the 9 hours that are fully documented in the Work Diary with screenshots and memos matching the agreed tasks. If you still believe those hours are not valid, please open a dispute on the contract and I will provide the diary entries to Upwork for review. I am happy to keep this factual and let the platform decide.' },
    { name: 'Xác nhận sau khi hoàn phần manual', text: 'Hi Mark, thanks for agreeing. I have refunded the 3 manual hours ($105) through the dispute. The remaining 9 hours are covered by the Work Diary and stay as billed. I have also noted to always confirm manual time with you in Upwork chat first if anything like this happens again.' },
  ],
  mistakes: [
    'Cãi cả 12 giờ kể cả 3 giờ manual không có ảnh: mất luôn phần 9 giờ lẽ ra được bảo vệ.',
    'Nhập manual time cho việc hợp đồng mà không xin đồng ý bằng tin nhắn trước.',
    'Trả lời cảm tính "tôi làm việc thật mà" thay vì dẫn Work Diary, memo, ảnh chụp cụ thể.',
    'Bỏ qua hạn review của tuần: để khách tranh chấp khi bạn không còn chuẩn bị bằng chứng.',
    'Tự hoàn toàn bộ để "giữ hoà khí": tạo tiền lệ và mất tiền oan cho phần có bảo vệ.',
  ],
  prevention: `- Luôn bật Upwork desktop app cho mọi giờ làm hợp đồng; coi manual time là ngoại lệ phải xin phép bằng tin nhắn trước.
- Viết memo mỗi phiên theo kiểu "làm gì - kết quả", đủ để người lạ đọc cũng thấy đúng việc: tên endpoint, lỗi đã sửa, file đã đổi.
- Khi mất điện/mất app, nhắn khách trên Upwork ngay trong lúc đó, đừng im lặng rồi nhập tay sau.
- Theo dõi hạn review của tuần; chuẩn bị sẵn link commit/memo trước khi khách kịp tranh chấp.

> Senior tip: Với hourly, "bằng chứng" của bạn là Work Diary chứ không phải lời nói. Một memo tốt ("Fixed NPE in PaymentService when coupon is null; added test PaymentServiceTest#nullCoupon") bảo vệ bạn tốt hơn mười tin nhắn "I really worked". Hãy viết memo như viết cho một người điều tra chưa biết gì về dự án.`,
  related: ['uw-ch-01', 'remote-015', 'remote-010'],
  tags: ['hourly', 'work-diary', 'manual-time', 'dispute', 'payment-protection'],
},
{
  id: 'uw-case-003',
  category: 'payment',
  level: 'mid',
  severity: 'medium',
  title: 'Khách hết ngân sách giữa chừng, đề nghị trả nửa milestone, phần còn lại "tháng sau"',
  situation: `Hợp đồng fixed-price 1.500 USD chia 3 milestone, mỗi mốc 500 USD. Milestone 1 đã duyệt. Bạn vừa submit milestone 2 (đã funded 500 USD, đang trong hạn review). Khách nhắn: "We are a bit short on budget this month, the company will get new funding next month. Can you accept $250 now for milestone 2, and I will pay the remaining $250 next month? The work is great, I promise." Bạn chưa bấm gì; milestone 2 vẫn đang chờ review và tiền vẫn nằm trong escrow.`,
  signals: [
    'Khách xin "trả một nửa" thay vì duyệt đủ số tiền đã funded.',
    'Lý do là dòng tiền phía khách ("new funding next month"), không phải chất lượng công việc.',
    'Khách dùng lời hứa cá nhân ("I promise") thay cho việc bấm approve trên hệ thống.',
    'Đề nghị đi kèm khen ngợi để giảm áp lực từ chối.',
  ],
  steps: `1. **Hiểu rõ escrow trước khi trả lời.** Tiền milestone 2 (500 USD) đã nằm trong escrow của Upwork, không phải tiền khách đang cầm. "Hết ngân sách tháng này" là chuyện nội bộ của khách; tiền duyệt milestone 2 không lấy từ ví tháng này của họ. Đây là lập luận mạnh nhất của bạn, nói nhẹ nhàng.
2. **Không đồng ý "nửa bây giờ, nửa tháng sau".** Nếu bạn bấm chấp nhận 250 USD, phần 250 USD còn lại thành một khoản nợ NGOÀI hợp đồng, không còn escrow bảo vệ — khách có quyền không trả và bạn gần như không có cách nào cưỡng chế. Đây là bẫy phổ biến nhất của case này.
3. **Trả lời tích cực nhưng giữ nguyên cơ chế:** cảm ơn lời khen, khẳng định milestone 2 đã funded sẵn trong escrow nên việc duyệt không ảnh hưởng ngân sách tháng này; đề nghị khách bấm approve để giải ngân đủ 500 USD.
4. **Nếu khách nói "công ty tôi cần xuất hoá đơn/thanh toán theo tháng":** giải thích Upwork giải ngân theo milestone đã funded, không theo lịch công nợ nội bộ; nếu cần trễ, có thể cùng thống nhất mốc thời gian review nhưng số tiền không đổi.
5. **Nếu khách vẫn khăng khăng và đe doạ "không duyệt thì đừng làm tiếp":** nhắc rằng bạn có thể để hạn review tự chạy (quá hạn mà khách không phản hồi thì tiền tự giải ngân), và bạn sẵn sàng submit bằng chứng phạm vi. Không găng, chỉ nêu cơ chế.
6. **Nếu khách im lặng:** chờ hết hạn review; theo quy định, milestone funded quá hạn review không phản hồi sẽ tự giải ngân cho freelancer (kiểm tra mốc thời gian hiện hành trên Upwork Help). Nhắc một lần trước hạn.
7. **Với milestone 3 (chưa làm):** coi đây là tín hiệu rủi ro dòng tiền của khách. Yêu cầu fund milestone 3 trước khi bắt đầu, hoặc đề xuất chia nhỏ hơn, để không dồn rủi ro vào cuối.

Nhánh hay gặp:
- **Khách chuyển khoản "nửa còn lại" ngoài Upwork tháng sau:** từ chối — nhận tiền ngoài nền tảng vi phạm điều khoản và mất bảo vệ; kiên quyết giữ mọi thanh toán trên Upwork.
- **Khách đồng ý duyệt đủ nhưng xin bạn "chịu khó chờ rút tiền":** được, vì tiền đã giải ngân; chỉ cần không đổi sang thỏa thuận nợ ngoài.
- **Khách tố "freelancer khác chấp nhận trả chậm":** lịch sự giữ lập trường: chính sách của bạn là chỉ làm việc qua escrow để cả hai đều an toàn.`,
  templates: [
    { name: 'Giải thích escrow, xin duyệt đủ', text: 'Hi Mark, thank you for the kind words, I am glad milestone 2 works well. Good news: the $500 for milestone 2 is already funded and sitting in Upwork escrow, so approving it does not draw from this month\'s budget on your side. Could you click approve on the milestone so the full amount is released? That keeps everything protected for both of us.' },
    { name: 'Từ chối trả góp ngoài, giữ trên nền tảng', text: 'Hi Mark, I understand the cash-flow situation, but I am not able to split milestone 2 into $250 now and $250 next month outside the contract. Any amount not released through Upwork escrow would leave me unprotected, and I keep all payments on the platform. The $500 is already funded, so approving the milestone is the cleanest path and does not affect this month\'s budget. Happy to proceed as soon as you approve.' },
    { name: 'Nhắc hạn review, mở đường milestone 3', text: 'Hi Mark, just a gentle note that milestone 2 is still within its review window and the $500 is funded in escrow. If it is easier, you can let the review period run and the funds will be released automatically. Before we start milestone 3, could you fund it as well so we keep the same protection? Thanks for understanding.' },
  ],
  mistakes: [
    'Đồng ý "nửa bây giờ nửa tháng sau": biến 250 USD thành nợ ngoài, mất escrow bảo vệ.',
    'Nhận phần còn lại qua chuyển khoản riêng ngoài Upwork: vi phạm điều khoản, dễ bị khoá tài khoản.',
    'Ép khách, dọa review xấu: đẩy một khách chỉ trục trặc dòng tiền thành xung đột.',
    'Bắt đầu milestone 3 khi khách chưa fund, vì "khách hứa tháng sau": lặp lại rủi ro mất trắng.',
    'Không phân biệt "hết ngân sách" (việc nội bộ khách) với "tiền đã trong escrow" (đã là của bạn khi duyệt).',
  ],
  prevention: `- Luôn giữ mọi milestone được fund TRƯỚC khi làm; không bao giờ đổi sang thỏa thuận trả nợ ngoài nền tảng.
- Khi khách có dấu hiệu dòng tiền yếu, chia milestone nhỏ hơn để giảm rủi ro mỗi lần.
- Nhắc khách: tiền trong escrow không tính vào ngân sách tháng; đây là điều nhiều khách không biết.
- Lưu mọi trao đổi về thanh toán trên Upwork Messages làm bằng chứng.

> Senior tip: "Trả một nửa bây giờ, nửa sau tháng sau" nghe hợp lý nhưng thực chất là chuyển tiền của bạn từ escrow (được bảo vệ) sang một lời hứa (không được bảo vệ). Câu trả lời chuẩn chỉ cần một ý: tiền đã nằm trong escrow, duyệt không tốn ngân sách tháng này. Nói đúng sự thật, nhẹ nhàng, và không nhượng bộ phần cơ chế.`,
  related: ['uw-ch-01', 'uw-case-001', 'remote-012'],
  tags: ['escrow', 'fixed-price', 'milestone', 'cash-flow', 'payment'],
},
{
  id: 'uw-case-004',
  category: 'contract',
  level: 'senior',
  severity: 'high',
  title: 'Scope creep trên fixed-price: khách liên tục thêm "chỉ một chỉnh sửa nhỏ", tổng đã gấp đôi phạm vi',
  situation: `Hợp đồng fixed-price 900 USD: "Build REST API quản lý đơn hàng" gồm 5 endpoint, tài liệu Swagger, 2 tuần. Đã qua 3 tuần. Mỗi 1-2 ngày khách lại nhắn "just a tiny change": thêm lọc theo ngày, thêm export CSV, đổi sang xác thực JWT, thêm vai trò admin, thêm trang admin nho nhỏ... Mỗi lần bạn đều "làm nhanh cho khách vui". Đến giờ tổng khối lượng đã gấp đôi phạm vi ban đầu, bạn vẫn nhận 900 USD, và khách vừa nhắn "thêm giúp cái dashboard đếm doanh thu, nhanh thôi mà". Bạn mệt và bắt đầu trễ các mục gốc.`,
  signals: [
    'Mỗi yêu cầu đều đi kèm "nhỏ thôi", "nhanh thôi", "chỉ một chút".',
    'Các "yêu cầu nhỏ" cộng lại đã vượt xa phạm vi hợp đồng (thêm auth, export, vai trò, dashboard...).',
    'Bạn đã làm miễn phí nhiều lần nên khách tin "lần nào cũng thêm được".',
    'Mốc bàn giao gốc bắt đầu trễ vì thời gian bị rút cho việc ngoài phạm vi.',
  ],
  steps: `1. **Dừng ngay việc nhận "OK" trên chat.** Từ giờ, mọi yêu cầu mới đều phải đi qua một quy trình: ghi nhận → làm rõ → đánh giá tác động → đề xuất bằng văn bản → chỉ làm sau khi khách chốt (và fund nếu fixed-price). Đây chính là quy trình change request.
2. **Lập bảng đối chiếu phạm vi:** liệt kê những gì trong hợp đồng gốc (5 endpoint, Swagger) và những gì đã làm thêm ngoài phạm vi (lọc ngày, CSV, JWT, admin role...). Con số này giúp bạn nói chuyện bằng sự thật, không phải cảm xúc "tôi làm nhiều rồi".
3. **Tính "effective hourly rate" để thấy thiệt hại:** ví dụ 900 USD, ước lượng gốc 30 giờ (30 USD/giờ); thực tế đã làm ~55 giờ vì các "yêu cầu nhỏ" → còn ~16 USD/giờ. Đây là lý do bạn phải chặn scope creep, không phải vì khó tính.
4. **Gửi một tin nhắn "reset" lịch sự nhưng dứt khoát:** cảm ơn, xác nhận bạn muốn dự án thành công, nêu rõ phạm vi gốc đã hoàn thành phần lớn, và từ giờ mọi yêu cầu mới sẽ được ước lượng + báo giá (milestone mới) hoặc đổi scope tương đương.
5. **Với yêu cầu dashboard vừa nhắn:** đánh giá tác động cụ thể (API đếm doanh thu, query tổng hợp, cache, test, quyền truy cập) → đề xuất milestone mới có giá, nêu giả định (khoảng thời gian, vai trò được xem). Không làm miễn phí.
6. **Nếu khách phản đối "freelancer trước làm hết miễn phí":** giữ ranh giới lịch sự — "I understand, but on my side each new feature needs a small estimate so we both stay clear on scope and timing". Đưa lựa chọn, không tranh cãi.
7. **Nếu khách đe doạ review xấu / không duyệt:** không nhượng bộ vì doạ; ghi lại, bám phạm vi gốc đã làm để submit/đối chiếu; feedback dùng để ép làm miễn phí là điều có thể báo hỗ trợ Upwork.
8. **Nếu bạn muốn giữ khách và chủ động tặng:** chỉ tặng một thay đổi THỰC SỰ rất nhỏ (≤ 20-30 phút) và nói rõ "lần này", để không tạo tiền lệ; mọi thứ lớn hơn đều qua milestone mới.

Nhánh hay gặp:
- **Khách chọn "đổi scope tương đương":** đồng ý, nhưng phải chốt bằng văn bản mục nào bị hoãn (đưa sang giai đoạn sau), tránh mất việc gốc đã hứa.
- **Khách im lặng sau khi bạn báo giá milestone mới:** quay lại hoàn thiện phạm vi gốc, submit milestone gốc, không tự làm dashboard miễn phí.
- **Khách nói "gộp hết vào milestone cuối đi":** từ chối gộp vô hạn; mỗi milestone phải có phạm vi + giá rõ, nếu không sẽ lặp lại đúng vấn đề.`,
  templates: [
    { name: 'Reset phạm vi, báo quy trình change request', text: 'Hi Mark, I want to make sure we ship this successfully. Looking back, the original scope was the 5 order endpoints plus Swagger docs, and I have also added date filtering, CSV export, JWT auth and the admin role along the way. From here, to keep things clear on scope and timeline, I will send a quick estimate for each new request before starting, either as a small new milestone or as a swap with a lower-priority item. Nothing will be blocked, I just want us aligned in writing.' },
    { name: 'Báo giá dashboard mới', text: 'Hi Mark, I reviewed the revenue dashboard request. It is outside the original scope, and the impact is about 6-8 hours (new aggregation endpoint, caching, role-based access, and tests). Assumptions: totals by day/month for the last 12 months, admin role only. I can add it as Milestone 4 at $260, delivered within 3 business days after it is funded. If budget is tight, we can instead swap it with a lower-priority item from the current scope. Which option works for you?' },
    { name: 'Đáp khi khách viện "freelancer trước làm miễn phí"', text: 'Hi Mark, I understand previous freelancers handled small extras informally. On my side I keep a short estimate for each new feature so we both stay clear on scope and delivery dates, which is what has kept the core work on track. I am happy to include one tiny tweak as a one-time courtesy now, and for anything larger I will send a quick estimate. This keeps things fair and predictable for both of us.' },
  ],
  mistakes: [
    'Nói "OK" ngay mỗi lần khách thêm việc "nhỏ": tự cam kết miễn phí và tạo tiền lệ.',
    'Không ghi bảng đối chiếu phạm vi: khi cần nói chuyện, chỉ có cảm xúc "tôi làm nhiều rồi".',
    'Gộp mọi yêu cầu vào "milestone cuối" vô thời hạn: không còn mốc nào để nghiệm thu và thanh toán.',
    'Làm dashboard miễn phí vì sợ mất khách: effective rate rơi thảm, dự án thành lỗ thời gian.',
    'Tranh cãi cảm tính "việc này không nhỏ" thay vì đưa tác động kỹ thuật (DB, auth, test, giờ).',
  ],
  prevention: `- Ngay khi chốt hợp đồng, gửi một tin nhắn "quy tắc thay đổi": mọi yêu cầu ngoài scope sẽ được ước lượng + báo giá trước khi làm.
- Viết mô tả milestone kiểm chứng được, liệt kê rõ "không bao gồm" (out of scope) để có căn cứ từ chối.
- Theo dõi giờ thực tế so với ước lượng; khi vượt 20-30% là dấu hiệu scope creep phải chặn.
- Chia milestone nhỏ (≤ 1 tuần công) để mỗi lần "thêm việc" chỉ là một quyết định nhỏ, dễ nói "để milestone sau".

> Senior tip: Scope creep không đến từ một yêu cầu lớn, mà từ mười lần "nhanh thôi mà" bạn không tính tiền. Một câu "I can do that — here is the impact and options" lặp lại đủ nhiều lần sẽ rèn cho khách thói quen hỏi giá trước, và bảo vệ thu nhập theo giờ thực của bạn. Hãy đưa "quy tắc thay đổi" vào tin nhắn chốt scope ngay từ ngày đầu.`,
  related: ['remote-011', 'remote-030', 'uw-case-001'],
  tags: ['scope-creep', 'change-request', 'fixed-price', 'estimate', 'contract'],
},
{
  id: 'uw-case-005',
  category: 'contract',
  level: 'mid',
  severity: 'medium',
  title: 'Khách đòi làm "test task" không trả tiền 8 giờ trước khi thuê',
  situation: `Bạn ứng tuyển một job fixed-price "Build a payment integration module" trên Upwork. Sau khi trao đổi, khách nhắn: "Before we move forward, I'd like you to complete a small test task: integrate Stripe checkout with webhooks, handle failures, and write tests. It should take a few hours. We do this with all candidates. Once I see the quality, I will hire you and we can start the real project." Khách không nói rõ có trả tiền cho test task hay không, và gợi ý "it should take a few hours" trong khi khối lượng mô tả thực chất khoảng 8 giờ. Bạn chưa ký hợp đồng nào cho phần test này.`,
  signals: [
    '"Test task" mô tả gần y hệt phần lõi của dự án thật (tích hợp Stripe + webhooks).',
    'Thời lượng bị nói giảm ("a few hours") trong khi khối lượng thực lớn hơn nhiều.',
    'Không có hợp đồng/escrow cho phần test; chỉ là lời hứa "sẽ thuê sau".',
    'Khách nói "làm với mọi ứng viên" để tạo cảm giác đây là chuẩn mực, khó từ chối.',
  ],
  steps: `1. **Nhận diện rủi ro:** một "test task" 8 giờ không trả tiền, giống hệt phần lõi dự án, là cách một số khách lấy code miễn phí (đôi khi từ nhiều ứng viên rồi ghép lại). Nguyên tắc: bạn không làm việc đáng giá nhiều giờ miễn phí khi chưa có hợp đồng.
2. **Phân biệt test nhỏ hợp lệ và "free work trá hình":** một bài test 30-60 phút (đọc code, sửa một bug nhỏ, viết một hàm) là bình thường và có thể chấp nhận. Khi khối lượng là cả một module (auth, webhook, test), đó là phần việc thật, không phải bài kiểm tra.
3. **Đề xuất 3 phương án bằng văn bản trên Upwork:** (a) một test THAY THẾ nhỏ (≤ 45 phút) trong thời gian phỏng vấn; (b) một hợp đồng hourly nhỏ có escrow cho phần "pilot" 2-3 giờ, nếu khách muốn xem code thật; (c) dùng portfolio/repo mẫu có sẵn của bạn (một module Stripe bạn từng làm) để chứng minh năng lực mà không làm việc miễn phí.
4. **Nếu khách khăng khăng "làm free rồi mới thuê":** lịch sự từ chối, nêu rõ bạn sẵn sàng làm một bài test ngắn trong buổi phỏng vấn hoặc một pilot có trả tiền, nhưng không giao cả module miễn phí. Giữ quan hệ, không găng.
5. **Nếu khách đồng ý pilot hourly có escrow:** làm đúng 2-3 giờ, ghi Work Diary, giao kết quả, rồi hai bên quyết định tiếp. Đây là cách biến "test" thành việc được trả tiền và được bảo vệ.
6. **Nếu khách bỏ ứng viên khác sau khi bạn từ chối:** đó là tín hiệu tốt — khách tôn trọng ranh giới thường là khách nghiêm túc. Đừng hạ tiêu chuẩn để "giữ cơ hội".
7. **Nếu bạn lỡ làm và khách biến mất:** rút bài học; từ giờ mọi yêu cầu "làm thử nhiều giờ" đều phải có hợp đồng/escrow. Ghi lại tên/chi tiết để tránh (nếu khách lặp lại với freelancer khác, có thể báo hỗ trợ Upwork).

Nhánh hay gặp:
- **Khách nói "ai cũng làm test, không làm thì thôi":** đây là chiêu tạo áp lực; giữ phương án test ngắn/pilot có trả tiền, không làm cả module free.
- **Khách đồng ý test 45 phút nhưng giao bài rất dài:** đánh giá lại khối lượng; nếu vượt 1 giờ, chuyển sang pilot có escrow.
- **Khách xin "chỉ cần xem cách bạn tổ chức code":** đưa repo mẫu/portfolio thay vì làm task mới; vừa chứng minh năng lực vừa không mất công.`,
  templates: [
    { name: 'Đề xuất test ngắn hoặc pilot có trả tiền', text: 'Hi Mark, I am very interested in this project. For the evaluation step, I am happy to do a short paid pilot (2-3 hours via an hourly contract with escrow) on a small slice of the Stripe integration, or a 30-45 minute live exercise during our call. I keep all real work on a contract so both sides are protected, and I can also share a sample repo where I did a similar Stripe + webhook module. Which option suits you best?' },
    { name: 'Từ chối làm cả module miễn phí', text: 'Hi Mark, thanks for explaining your process. Completing the full Stripe checkout with webhooks, failure handling and tests is essentially the core of the project (around 8 hours), so I am not able to deliver that for free before a contract is in place. I can do a short paid pilot or a brief live exercise instead, and I am confident the quality will be clear from that. Let me know how you would like to proceed.' },
    { name: 'Chốt pilot hourly có escrow', text: 'Hi Mark, sounds good. Let us set up a small hourly contract for a 2-3 hour pilot where I implement the Stripe checkout session plus one webhook handler with a test. I will track the time with the Upwork app and share the code and a short demo at the end. After that we can both decide on the full project with clear milestones. Please send the contract when ready.' },
  ],
  mistakes: [
    'Làm cả module 8 giờ miễn phí vì "sợ mất cơ hội": mất công, và code có thể bị dùng mà không thuê bạn.',
    'Không phân biệt test nhỏ (hợp lệ) và "free work trá hình" (cả phần lõi dự án).',
    'Đồng ý làm free khi chưa có hợp đồng/escrow: không có bằng chứng, không được bảo vệ.',
    'Để khách nói giảm thời lượng ("a few hours") mà không tự đánh giá khối lượng thật.',
    'Tranh cãi gay gắt "đây là bóc lột": mất khách một cách không cần thiết; đưa phương án thay thế lịch sự hơn.',
  ],
  prevention: `- Đặt sẵn một câu trả lời mẫu cho "test task": mời test ngắn trong phỏng vấn hoặc pilot hourly có escrow, kèm link portfolio.
- Chuẩn bị 1-2 repo mẫu (Stripe, webhook, REST API) để chứng minh năng lực mà không phải làm việc miễn phí.
- Coi "làm thử nhiều giờ miễn phí" là red flag; khách nghiêm túc chấp nhận trả cho pilot.
- Mọi công việc thật (kể cả "thử việc") đều phải có hợp đồng và escrow trước khi bắt đầu.

> Senior tip: Ranh giới giữa "bài kiểm tra năng lực" và "phần việc thật miễn phí" nằm ở khối lượng: 30-60 phút là test, cả một module là dự án. Một câu "I keep all real work on a contract so both sides are protected" vừa chuyên nghiệp vừa chặn được yêu cầu làm free, và thường chính khách nghiêm túc mới tôn trọng ranh giới đó.`,
  related: ['remote-004', 'remote-006', 'uw-ch-01'],
  tags: ['test-task', 'free-work', 'contract', 'proposal', 'escrow'],
},
{
  id: 'uw-case-006',
  category: 'contract',
  level: 'senior',
  severity: 'high',
  title: 'Ước lượng sai: milestone fixed-price đã tốn gấp đôi thời gian dự kiến, còn 40% việc',
  situation: `Bạn nhận milestone fixed-price 700 USD "Tích hợp cổng thanh toán + xử lý webhook", ước lượng 20 giờ (35 USD/giờ). Thực tế bạn đã làm 38 giờ và mới xong 60%: phần webhook retry, đối soát giao dịch và xử lý edge case tốn hơn dự tính rất nhiều (tài liệu Stripe phức tạp, môi trường sandbox của khách hay lỗi). Còn ~40% việc (đối soát, test end-to-end, tài liệu). Bạn đang lỗ thời gian và sợ nếu nói thật thì khách hối thúc hoặc đòi giảm giá.`,
  signals: [
    'Số giờ thực đã gấp đôi ước lượng nhưng milestone chưa xong.',
    'Nguyên nhân là ước lượng thiếu (chưa tính edge case, sandbox lỗi), không phải bạn làm chậm.',
    'Bạn giấu việc trễ giờ vì sợ khách mất niềm tin.',
    'Phần còn lại (đối soát, test, tài liệu) vẫn còn lớn, nguy cơ lỗ tiếp tục tăng.',
  ],
  steps: `1. **Thừa nhận với chính mình: đây là bài học ước lượng, không phải lỗi khách.** Fixed-price nghĩa là bạn đã nhận một mức giá cố định cho một phạm vi; nếu ước lượng sai, phần thiệt về thời gian là rủi ro của bạn. Đừng đổ lỗi cho khách.
2. **Đánh giá lại phần còn lại một cách trung thực:** liệt kê 40% còn lại (đối soát giao dịch, test end-to-end, tài liệu), ước lượng giờ thực tế (ví dụ còn ~15 giờ). So với 700 USD, tổng ~53 giờ → ~13 USD/giờ. Đây là con số bạn cần biết trước khi quyết định.
3. **Chọn 1 trong 3 hướng, không trộn cảm tính:**
   - (a) **Hoàn tất đúng phạm vi, chấp nhận lỗ thời gian** để giữ uy tín + review tốt (hợp lý nếu số tiền chênh không quá lớn và bạn muốn giữ khách).
   - (b) **Đề nghị đổi scope:** cắt bớt phần ít giá trị nhất khỏi milestone (ví dụ gộp tài liệu vào milestone sau, hoặc bỏ phần đối soát nâng cao) để giảm giờ, giữ nguyên giá — phải chốt bằng văn bản.
   - (c) **Đề nghị milestone phụ có trả thêm** cho phần đã nới ra ngoài ước lượng ban đầu (ví dụ đối soát nâng cao không có trong mô tả gốc) — chỉ hợp lý nếu phần đó thực sự ngoài phạm vi.
4. **Tránh hai thái cực:** (i) im lặng làm tiếp rồi giao trễ/đ persuade khách; (ii) đổ lỗi "tài liệu Stripe tệ" để đòi thêm tiền cho phần vốn trong scope. Cả hai đều hại uy tín.
5. **Nếu chọn (a) hoặc (b): viết một tin nhắn minh bạch ngắn:** nêu bạn đang hoàn thiện phần còn lại, tập trung vào chất lượng, và (nếu đổi scope) đề xuất bỏ/hoãn mục X để kịp tiến độ. Không kể lể giờ lỗ — khách không cần, và nó không thay đổi được giá.
6. **Nếu chọn (c): chỉ yêu cầu thêm khi phần đó NGOÀI mô tả milestone.** Dẫn lại mô tả gốc, chỉ ra phần mới, đề xuất milestone phụ có giá + thời gian. Nếu khách từ chối, quay về (a) hoặc (b).
7. **Hoàn tất phần còn lại với chất lượng, submit đúng phạm vi đã chốt (sau khi điều chỉnh nếu có).** Giao đúng hạn là cách nhanh nhất khôi phục niềm tin và JSS.
8. **Rút kinh nghiệm ước lượng cho lần sau:** với tích hợp bên thứ ba (Stripe, webhook), cộng thêm 40-60% buffer cho edge case, sandbox, retry/đối soát; chia milestone nhỏ; ước lượng theo "loại việc" đã làm nhiều lần thay vì cảm giác.

Nhánh hay gặp:
- **Khách hỏi "sao lâu vậy?":** trả lời tập trung tiến độ và chất lượng ("I am on the reconciliation and end-to-end tests, on track to submit by X"), không kể lể giờ lỗ.
- **Khách đòi giảm giá vì trễ:** nếu bạn chọn (a), giữ giá đã chốt trong scope, bù bằng chất lượng; nếu phần trễ do ngoài scope, dùng (c) để nói rõ.
- **Khách đồng ý đổi scope (b):** chốt bằng văn bản mục nào bị hoãn, tránh hiểu lầm khi nghiệm thu.
- **Bạn nhận ra không thể hoàn thành đúng hạn:** báo sớm (trước hạn, không phải sát nút), đề xuất mốc mới hợp lý kèm lý do kỹ thuật.`,
  templates: [
    { name: 'Minh bạch tiến độ, tập trung chất lượng', text: 'Hi Mark, quick update on the payment milestone. The checkout and webhook handling are done and tested in sandbox; I am now on transaction reconciliation and the end-to-end tests, which are the most detail-heavy part. I want to make sure the edge cases (retries, duplicate events) are solid before I submit. I am on track to deliver by [date]. I will send a short demo once it is ready for review.' },
    { name: 'Đề xuất đổi scope để kịp tiến độ', text: 'Hi Mark, to keep the delivery date comfortable without cutting quality on the core flow, I would like to propose a small scope adjustment: I can move the advanced reconciliation report to a follow-up milestone and keep this milestone focused on the payment flow, webhooks and standard tests. That keeps the price unchanged and the timeline safe. Would that work for you, or would you prefer I include everything as originally planned?' },
    { name: 'Đề xuất milestone phụ cho phần ngoài scope', text: 'Hi Mark, the original milestone covered the checkout flow and standard webhook handling. The advanced reconciliation and multi-currency edge cases we discussed are beyond that original description, so I can deliver them as a small follow-up milestone at $X with delivery in [N] days. If you prefer, I can also keep them out and complete the original scope first. Let me know which you prefer.' },
  ],
  mistakes: [
    'Im lặng làm tiếp rồi giao trễ/cầu hòa: mất niềm tin và có thể thành tranh chấp.',
    'Đổ lỗi "tài liệu Stripe tệ" để đòi thêm tiền cho phần vốn trong scope: thiếu chuyên nghiệp.',
    'Không đánh giá lại 40% còn lại: tiếp tục lỗ mà không biết, quyết định trong mù mờ.',
    'Tự ý cắt chất lượng (bỏ test, bỏ edge case) để kịp giờ: tạo bug production, hại review về sau.',
    'Lấy lần ước lượng sai làm cái cớ hạ giá trị bản thân; đây là chuyện bình thường, xử lý minh bạch là đủ.',
  ],
  prevention: `- Với tích hợp bên thứ ba (Stripe, webhook, OAuth...), cộng 40-60% buffer cho edge case, sandbox và đối soát; đừng ước lượng theo "happy path".
- Chia milestone nhỏ (≤ 1 tuần) để sai số mỗi lần nhỏ, dễ phát hiện sớm.
- Theo dõi giờ thực so với ước lượng hằng ngày; khi vượt 30% là lúc phải đánh giá lại, không đợi đến cuối.
- Ghi lại "bài học ước lượng" theo loại việc (tích hợp thanh toán, migration DB...) để lần sau báo giá chính xác hơn.

> Senior tip: Ước lượng sai là chuyện xảy ra với cả Senior; điều phân biệt chuyên nghiệp là xử lý minh bạch và không để nó âm thầm bào mòn chất lượng. Với tích hợp bên thứ ba, mặc định cộng buffer 40-60% cho edge case và sandbox — một con số ước lượng "đủ dày" bảo vệ thu nhập theo giờ của bạn tốt hơn mọi lời hứa cố định giá.`,
  related: ['remote-030', 'remote-011', 'remote-013'],
  tags: ['estimate', 'fixed-price', 'scope', 'buffer', 'communication'],
},
{
  id: 'uw-case-007',
  category: 'contract',
  level: 'lead',
  severity: 'high',
  title: 'Khách đòi dùng tài khoản cloud/API key cá nhân của bạn, hoặc ký NDA/IP ngoài Upwork bất lợi',
  situation: `Bạn làm fixed-price cho một startup. Khách nhắn: "To save cost, can you use your own AWS account and API keys for the project? We will reimburse later. Also, please sign this NDA and IP agreement I attached (a PDF outside Upwork) before you continue — it says all code and ideas belong to us and includes a penalty clause." Tài khoản AWS cá nhân của bạn sẽ gánh chi phí hạ tầng (có thể vài trăm USD/tháng), còn hợp đồng ngoài Upwork có điều khoản chuyển giao toàn bộ IP và phạt nếu vi phạm, không có giới hạn trách nhiệm. Bạn chưa ký, chưa dùng key cá nhân.`,
  signals: [
    'Đề nghị dùng tài khoản/cloud + API key cá nhân của bạn, "hoàn tiền sau" (rủi ro bạn gánh chi phí trước).',
    'NDA/IP agreement là file ngoài Upwork, có điều khoản chuyển giao IP rộng và phạt, không giới hạn trách nhiệm.',
    'Chi phí hạ tầng không rõ ai trả, không có escrow cho phần "hoàn tiền sau".',
    'Hợp đồng ngoài có thể mâu thuẫn với điều khoản Upwork (thanh toán, sở hữu, tranh chấp).',
  ],
  steps: `1. **Hiểu rủi ro trước khi ký/dùng gì:** (a) dùng AWS/key cá nhân = bạn trả tiền trước, "hoàn sau" là một lời hứa không escrow; nếu khách biến mất, bạn vừa mất công vừa mất tiền hạ tầng; (b) ký NDA/IP ngoài Upwork có thể chuyển giao IP rộng và thêm phạt, đồng thời mâu thuẫn với cơ chế thanh toán/bảo vệ của Upwork.
2. **Không dùng tài khoản/key cá nhân cho chi phí thật.** Đề xuất dùng tài khoản cloud của KHÁCH (họ tạo IAM user/key riêng cho bạn, giới hạn quyền), hoặc hoá đơn hạ tầng tách riêng do khách trả trực tiếp cho nhà cung cấp. Nếu buộc dùng tài khoản bạn, yêu cầu khách fund trước một khoản chi phí vào escrow, và trần chi tiêu (billing alarm) rõ ràng.
3. **Về NDA/IP ngoài Upwork:** đọc kỹ; không ký vội. Các điểm cần soi: phạm vi chuyển giao IP (có bao gồm ý tưởng/tổng thể không), điều khoản phạt và giới hạn trách nhiệm (liability cap), luật áp dụng, và có mâu thuẫn với điều khoản Upwork không. Nếu không chắc, nói bạn cần thời gian đọc và hỏi ý kiến chuyên gia pháp lý — đây là nguyên tắc, không phải tư vấn pháp lý.
4. **Đề xuất giữ mọi thứ trên Upwork:** với công việc trên Upwork, cơ chế thanh toán và sở hữu đã có sẵn (IP chuyển cho khách khi thanh toán phần việc). Một hợp đồng ngoài không cần thiết và có thể làm mất bảo vệ của Upwork. Đề nghị dùng thoả thuận trong Upwork, hoặc nếu khách cần NDA, dùng một bản NDA cân bằng (có giới hạn trách nhiệm, không phạt vô lý).
5. **Nếu khách khăng khăng "không ký thì dừng":** đây là phép thử. Khách nghiêm túc thường chấp nhận dùng tài khoản của họ và thoả thuận trên Upwork. Nếu họ ép điều khoản bất lợi + dùng key cá nhân, đó là rủi ro lớn — cân nhắc từ chối dự án.
6. **Bảo vệ bản thân ngay cả khi làm:** bật billing alarm trên tài khoản cloud của bạn (nếu tạm dùng), đặt trần chi tiêu; không đưa root key; tạo IAM user giới hạn quyền; lưu mọi trao đổi về chi phí trên Upwork Messages.
7. **Ghi lại bài học và chia sẻ (nếu phù hợp):** cấu hình "tài khoản cloud của khách + IAM giới hạn + chi phí trả trực tiếp" là chuẩn cho mọi dự án; đưa vào câu hỏi làm rõ ngay từ đầu dự án.

Nhánh hay gặp:
- **Khách nói "công ty tôi bắt buộc dùng NDA mẫu của họ":** đề nghị một bản có giới hạn trách nhiệm và phạm vi IP hợp lý; nếu bản của họ bất lợi và không đổi, cân nhắc từ chối.
- **Khách hứa "hoàn tiền hạ tầng cuối tháng":** yêu cầu fund trước vào escrow hoặc trả trực tiếp cho nhà cung cấp; lời hứa không escrow là rủi ro.
- **Khách ép dùng key cá nhân vì "nhanh":** đề xuất IAM user giới hạn trên tài khoản khách; từ chối gánh chi phí không giới hạn trên tài khoản bạn.
- **Bạn lỡ dùng key cá nhân và phát sinh chi phí:** báo ngay, chốt trần chi tiêu, yêu cầu hoàn qua Upwork; nếu khách chối, đây là tranh chấp — giữ bằng chứng hoá đơn + trao đổi.`,
  templates: [
    { name: 'Đề xuất dùng tài khoản khách, IAM giới hạn', text: 'Hi Mark, to keep things clean on cost and security, I suggest running the project under your AWS account with a dedicated IAM user for me (limited permissions, no root keys). That way infrastructure costs are billed directly to you and there is nothing to reimburse later. If you prefer I use my own account temporarily, I would need the estimated infra cost funded into escrow first, with a clear spending cap. Which works better for you?' },
    { name: 'Đề nghị NDA cân bằng, giữ trên Upwork', text: 'Hi Mark, I am fine signing an NDA, but I would like to review the IP/penalty clauses first and keep them reasonable (for example a liability cap and a clear scope of what transfers). For the work itself, I prefer to keep payment and IP transfer under the Upwork contract, which already transfers ownership on payment and protects both of us. If you need a specific NDA, could you share an editable version so I can flag anything unusual?' },
    { name: 'Giữ ranh giới khi khách ép', text: 'Hi Mark, I want to be transparent: I am not able to take on unlimited infrastructure costs on my personal account, and I cannot sign an agreement with uncapped penalties before reviewing it properly. I am very willing to proceed under your cloud account with a scoped IAM user and a balanced NDA on Upwork. If those terms do not work on your side, I completely understand, and I hope we can work together on a future project.' },
  ],
  mistakes: [
    'Dùng AWS/key cá nhân gánh chi phí thật, tin "hoàn sau" không escrow: mất tiền nếu khách biến mất.',
    'Ký NDA/IP ngoài Upwork mà không đọc kỹ điều khoản phạt và chuyển giao IP rộng.',
    'Đưa root key hoặc key không giới hạn quyền: rủi ro bảo mật và chi phí.',
    'Bỏ qua mâu thuẫn giữa hợp đồng ngoài và điều khoản Upwork: mất bảo vệ thanh toán/sở hữu.',
    'Ép bản thân chấp nhận vì "sợ mất dự án": khách ép điều khoản bất lợi thường là khách rủi ro.',
  ],
  prevention: `- Chuẩn hoá nguyên tắc ngay từ đầu: hạ tầng chạy trên tài khoản khách (IAM giới hạn), chi phí khách trả trực tiếp; không gánh chi phí cá nhân.
- Mặc định mọi thanh toán và chuyển giao IP đi qua Upwork; coi NDA/hợp đồng ngoài là ngoại lệ cần đọc kỹ và hỏi chuyên gia.
- Nếu buộc dùng tài khoản cá nhân, yêu cầu fund chi phí vào escrow + đặt billing alarm + trần chi tiêu.
- Đưa "ai trả chi phí hạ tầng, dùng tài khoản nào" vào danh sách câu hỏi làm rõ trước khi nhận việc.

> Senior tip: "Dùng tài khoản của bạn, hoàn tiền sau" là cách một dự án biến freelancer thành nhà tài chính không tự nguyện cho hạ tầng của khách. Nguyên tắc an toàn: hạ tầng chạy trên tài khoản khách với IAM giới hạn, chi phí trả trực tiếp, mọi thứ trên Upwork. Còn NDA/IP có điều khoản phạt vô hạn thì phải đọc kỹ và hỏi chuyên gia — đừng để một chữ ký vội đánh đổi cả thu nhập lẫn bảo vệ của nền tảng.`,
  related: ['remote-036', 'remote-025', 'remote-016', 'uw-ch-01'],
  tags: ['cloud', 'iam', 'nda', 'ip', 'contract', 'security'],
},
{
  id: 'uw-case-008',
  category: 'payment',
  level: 'senior',
  severity: 'high',
  title: 'Khách đã duyệt milestone, một tháng sau đòi hoàn tiền vì "phát hiện bug"',
  situation: `Hợp đồng fixed-price 1.000 USD, 2 milestone: tích hợp cổng thanh toán (500) và xử lý webhook + đối soát (500). Milestone 1 đã được khách bấm duyệt và bạn đã nhận tiền 5 tuần trước, tiền đã qua khoảng chờ (security period) và rút được. Hôm nay khách nhắn: "We found a critical bug in the payment module you delivered last month: some customers are charged twice. We want a full refund of milestone 1 (500 USD) and you fix it for free." Bạn mở log và thấy: hiện tượng tính tiền hai lần chỉ xảy ra sau khi phía khách tự thêm một cổng thanh toán thứ hai (do dev nội bộ của họ làm) vào cùng luồng checkout, và nhánh mới đó không gửi idempotency key (khoá chống gửi trùng). Nhánh code bạn giao vẫn có idempotency và test cho request trùng.`,
  signals: [
    'Khách đòi hoàn tiền một milestone đã duyệt từ nhiều tuần trước, khi tiền đã giải ngân và rút được.',
    'Lỗi chỉ xuất hiện sau một thay đổi do chính phía khách thêm vào, không nằm trong phần bạn đã giao.',
    'Khách yêu cầu "hoàn tiền cộng sửa miễn phí" thay vì chỉ báo lỗi và hỏi nguyên nhân.',
    'Không có bằng chứng lỗi nằm trong code bạn đã submit; log cho thấy lỗi ở nhánh mới của khách.',
    'Thời điểm đòi tiền trùng lúc ngân sách hoặc kế hoạch phía khách thay đổi.',
  ],
  steps: `1. **Bình tĩnh, không nhận lỗi ngay, không hứa hoàn tiền trong lúc nóng.** Từ giờ mọi tin nhắn là bằng chứng. Không viết "xin lỗi, để tôi hoàn tiền" khi chưa điều tra, vì câu đó có thể bị dùng để buộc bạn hoàn cả phần đã làm đúng.
2. **Điều tra bằng dữ liệu trước khi trả lời.** Lấy order ID và timestamp của các giao dịch bị tính hai lần, đọc log, xác định nhánh code nào tạo ra request thứ hai. So sánh với code bạn đã submit ở milestone 1 (tag/commit) để biết lỗi nằm ở đâu. Ghi lại thành một bảng ngắn: triệu chứng, thời điểm, nhánh code, bằng chứng.
3. **Phân biệt rõ ba khả năng:** (a) lỗi thật trong phạm vi bạn đã giao; (b) lỗi do thay đổi mới của khách (ngoài phạm vi); (c) lỗi do bên thứ ba (nhà cung cấp thanh toán đổi API). Mỗi khả năng dẫn tới cách xử lý khác nhau, đừng trộn lẫn.
4. **Trả lời khách bằng sự kiện, không bằng cảm giác:** cảm ơn đã báo, nêu bạn đang trace, hỏi order ID/thời điểm cụ thể, và nói rõ bạn sẽ xác định nguyên nhân gốc. Giữ giọng hợp tác, không phòng thủ.
5. **Nếu điều tra cho thấy lỗi thuộc phạm vi milestone 1:** nhận trách nhiệm, sửa miễn phí trong phạm vi, thêm test hồi quy, và bù một phần thiện chí nhỏ nếu thiệt hại của khách lớn. Đây là cách giữ uy tín và JSS (Job Success Score - điểm thành công của freelancer trên Upwork).
6. **Nếu lỗi do thay đổi mới của khách:** trình bày bảng đối chiếu, chỉ ra nhánh mới không có idempotency, và đề xuất sửa như một milestone nhỏ có trả tiền (ví dụ 180 USD, 2 ngày). Đồng thời có thể mời một buổi call ngắn miễn phí để hướng dẫn dev của khách, thể hiện thiện chí mà không nhận lỗi oan.
7. **Về tiền đã giải ngân:** milestone 1 đã duyệt và tiền đã rút, nên khách không còn "cần nút" nào để ép bạn; việc hoàn tiền lúc này là tự nguyện. Bạn có quyền từ chối hoàn toàn bộ, nhưng hãy cân nhắc một khoản thiện chí nhỏ nếu muốn giữ quan hệ và tránh review xấu. Tính: 500 USD so với chi phí một review 1 sao và thời gian tranh chấp.
8. **Nếu khách mở tranh chấp (dispute) dù tiền đã giải ngân:** nộp bảng điều tra, link submit work, tag/commit, log. Trong tranh chấp, người có bằng chứng gọn gàng gần như luôn thắng người chỉ có cảm tính.
9. **Rút kinh nghiệm:** ghi rõ "out of scope" trong mô tả milestone, và nhắc khách mọi thay đổi sau bàn giao đều là scope mới. Lưu "hộp bằng chứng" gồm submit, commit, video demo ngay từ đầu.

Nhánh hay gặp:
- **Khách gửi order ID và thừa nhận đã thêm cổng mới:** xác nhận, đề xuất milestone sửa, giữ quan hệ.
- **Khách khăng khăng "lỗi của anh" mà không đưa bằng chứng:** giữ lập trường bám log, mời mediation, không tự nhận lỗi.
- **Khách doạ review 1 sao:** không nhượng bộ vì doạ; feedback dùng để ép hoàn tiền là điều có thể báo hỗ trợ Upwork, giữ bằng chứng.
- **Bạn phát hiện lỗi thật sự thuộc code mình:** nhận, sửa miễn phí, thêm test, và bù thiện chí; đừng chối để rồi mất khách và JSS.`,
  templates: [
    { name: 'Điều tra và phản hồi bằng sự kiện', text: 'Hi Mark, thanks for flagging this. I take double charging very seriously and I want to find the root cause quickly. I reviewed the current checkout flow and the logs around the reported charges. The duplicate charge happens on the second payment provider that was added after milestone 1 was delivered, and that branch does not send an idempotency key. The module I delivered uses idempotency and has tests for duplicate requests. Could you share the exact order IDs and timestamps of the affected charges so I can trace them precisely? I want to fix the real cause, not just the symptom.' },
    { name: 'Đề xuất sửa có trả tiền nếu ngoài phạm vi', text: 'Hi Mark, after tracing the order IDs, the duplicate charges come from the new provider branch added by your team, which is outside the milestone 1 scope I delivered. I am happy to help fix it properly: add idempotency to the new branch, add a regression test, and verify with your test cards. Since this is new work, I can do it as a small milestone at 180 USD, delivered in 2 business days. If you prefer, I can also walk your developer through the fix on a short call at no cost.' },
    { name: 'Từ chối hoàn tiền, giữ thiện chí', text: 'Hi Mark, I understand the urgency, but I am not able to approve a full refund of milestone 1. That milestone was delivered, reviewed and approved, and the reported issue comes from a change made after delivery. What I can do is fix the new branch quickly as a paid milestone, or share a short call with your developer. I want to leave this with a working checkout and a clear record, and I am confident we can get there fast.' },
  ],
  mistakes: [
    'Nhận lỗi và hứa hoàn tiền ngay khi chưa điều tra: mất tiền oan và tạo tiền lệ.',
    'Không lấy order ID, timestamp, log: khi tranh chấp chỉ còn cảm tính, dễ thua.',
    'Trộn lẫn lỗi trong phạm vi với lỗi do thay đổi mới của khách: xử lý sai cả hai.',
    'Sửa miễn phí phần ngoài phạm vi để "cho xong": khách tiếp tục đẩy việc mới.',
    'Trả lời gay gắt hoặc im lặng: đẩy một khách đang hoang mang thành tranh chấp.',
  ],
  prevention: `- Viết mô tả milestone có phần "out of scope" rõ ràng, liệt kê những gì không bao gồm.
- Giao kèm video demo và checklist nghiệm thu để có mốc "đã đúng" trước khi khách đổi hệ thống.
- Lưu "hộp bằng chứng" mỗi hợp đồng: submit work, commit/tag, log, trao đổi quan trọng.
- Khi khách thêm cổng/tính năng mới, nhắc bằng văn bản rằng đó là scope mới cần milestone riêng.
- Không bao giờ nhận lỗi hoặc hoàn tiền trước khi có kết quả điều tra cụ thể.

> Senior tip: Một milestone đã duyệt và đã rút tiền không còn escrow để khách ép bạn, nên "đòi hoàn tiền sau một tháng" thực chất là đàm phán, không phải quyền của khách. Vũ khí của bạn là log và mốc "đã giao đúng" — hãy điều tra trước, nói bằng sự kiện, và chỉ nhượng bộ phần thiện chí nhỏ nếu nó rẻ hơn một review xấu.`,
  related: ['uw-ch-01', 'uw-ch-08', 'remote-012', 'uw-case-001'],
  tags: ['refund', 'bug', 'post-delivery', 'dispute', 'fixed-price', 'JSS'],
},
{
  id: 'uw-case-009',
  category: 'payment',
  level: 'senior',
  severity: 'high',
  title: 'Khách muốn trả bonus hoặc chuyển lương ngoài Upwork qua PayPal/chuyển khoản "cho nhanh"',
  situation: `Hợp đồng hourly 40 USD/giờ, limit 20 giờ/tuần, đang chạy tốt 6 tuần. Khách nhắn: "The work is great, I want to give you a 300 USD bonus for the extra effort. PayPal is faster, just send me your PayPal email. Also, from next month I will transfer your pay directly to your bank to save fees, it is simpler." Bạn chưa nhận gì ngoài nền tảng. Khoản bonus không có trong hợp đồng, và việc chuyển lương về tài khoản ngân hàng riêng là thanh toán ngoài Upwork cho công việc của hợp đồng Upwork.`,
  signals: [
    'Đề nghị trả tiền ngoài Upwork (PayPal, chuyển khoản ngân hàng) với lý do "nhanh", "đỡ phí", "đơn giản".',
    'Khoản bonus không được ghi vào hợp đồng, chỉ là lời hứa chuyển riêng.',
    'Khách gợi ý gửi email PayPal hoặc số tài khoản — bước đầu của việc rời nền tảng.',
    'Việc chuyển "lương tháng" ám chỉ đưa cả quan hệ thanh toán ra ngoài, không chỉ một khoản nhỏ.',
  ],
  steps: `1. **Hiểu vì sao đây là vấn đề lớn, không phải cơ hội:** mọi thanh toán cho công việc của hợp đồng Upwork phải đi qua Upwork. Nhận tiền ngoài nền tảng là vi phạm điều khoản chống lách (circumvention) và có thể bị khoá tài khoản, mất luôn số dư. Đây là rủi ro tài khoản, không phải chuyện nhỏ.
2. **Hiểu "bonus" đúng cách:** Upwork cho phép thêm tiền thưởng (bonus) ngay trong hợp đồng, nên bạn không cần PayPal. Cách này vừa hợp lệ vừa được ghi nhận, và tiền vẫn được bảo vệ theo cơ chế nền tảng (kiểm tra nút hiện hành trên Upwork Help).
3. **Trả lời lịch sự, cảm ơn, nhưng từ chối phần ngoài nền tảng:** nêu rõ chính sách của bạn là giữ mọi thanh toán trên Upwork để cả hai được bảo vệ. Đề nghị khách thêm bonus qua hợp đồng.
4. **Với đề nghị "chuyển lương về bank cho đỡ phí":** từ chối dứt khoát nhưng nhẹ nhàng. Giải thích phí là một phần của việc giữ hệ thống an toàn và có hồ sơ; nhận chuyển khoản riêng cho công việc Upwork là vi phạm và bạn không thể làm.
5. **Nếu khách khăng khăng "không ai biết":** giữ lập trường. Upwork có thể phát hiện qua pattern thanh toán và báo cáo; "không ai biết" không phải là bảo vệ. Không nhượng bộ.
6. **Nếu khách nói "vậy thôi, giữ nguyên":** quay lại làm việc bình thường, không nhắc lại. Ghi lại tình huống để rút kinh nghiệm.
7. **Nếu khách đe doạ "không bonus thì dừng":** bonus là tự nguyện; bạn không làm việc để đổi lấy một khoản ngoài nền tảng. Giữ chất lượng công việc, để khách quyết định.
8. **Bảo vệ bản thân:** không gửi email PayPal, không gửi số tài khoản, không nhận chuyển khoản ngoài. Nếu lỡ nhận, báo hỗ trợ Upwork và hoàn lại qua kênh chính thức.

Nhánh hay gặp:
- **Khách chỉ muốn "tặng thêm" một khoản nhỏ:** vẫn phải qua hợp đồng; dùng cơ chế bonus của Upwork.
- **Khách nói "công ty tôi không dùng được bonus":** đề nghị một milestone thưởng nhỏ có mô tả, hoặc giữ nguyên; không nhận ngoài.
- **Khách chuyển sang "vậy trả qua Wise/Payoneer của tôi":** vẫn là ngoài nền tảng, từ chối.
- **Bạn cần tiền gấp:** rủi ro khoá tài khoản và mất toàn bộ JSS không đáng một khoản bonus.`,
  templates: [
    { name: 'Cảm ơn và đề nghị bonus qua Upwork', text: 'Hi Mark, thank you, that is very kind and I really appreciate it. To keep everything protected and compliant, I am not able to accept payments outside Upwork. Upwork lets you add a bonus to the contract directly, so the extra amount is recorded and protected for both of us. If you add the 300 USD bonus on the contract, I will see it right away. Happy to keep the good work going.' },
    { name: 'Từ chối chuyển lương về tài khoản ngoài', text: 'Hi Mark, I understand the idea about saving fees, but my policy is to keep all payments for this work on Upwork. Off-platform transfers are not something I can use, and they would leave both of us without the platform protection. The fees are part of how I keep the work safe and documented. I am glad to continue, and you can send any bonus through the contract.' },
    { name: 'Giữ ranh giới khi khách khăng khăng', text: 'Hi Mark, I really value working with you, and I have to be clear: I cannot accept PayPal or bank transfers for this contract. If a platform bonus does not work on your side, we can simply keep the current terms. I would rather keep everything clean and protected than risk the account for both of us. Let me know how you would like to proceed.' },
  ],
  mistakes: [
    'Nhận bonus qua PayPal vì "chỉ một lần": vi phạm điều khoản, có thể bị khoá tài khoản.',
    'Gửi số tài khoản ngân hàng để nhận lương ngoài: mất bảo vệ và tạo bằng chứng vi phạm.',
    'Tin "không ai biết": Upwork có thể phát hiện qua pattern thanh toán.',
    'Đổi việc lấy bonus ngoài nền tảng: tạo tiền lệ và rủi ro pháp lý/thuế.',
    'Trả lời gay gắt hoặc im lặng: mất khách tốt chỉ vì một đề nghị chưa hiểu cơ chế.',
  ],
  prevention: `- Luôn nói rõ chính sách "mọi thanh toán qua Upwork" ngay từ tin nhắn chốt hợp đồng.
- Biết cơ chế bonus trong hợp đồng của Upwork để đề xuất thay thế hợp lệ.
- Không gửi email PayPal, số tài khoản, hay nhận chuyển khoản ngoài cho việc Upwork.
- Coi "cho nhanh", "đỡ phí", "không ai biết" là red flag của đề nghị lách nền tảng.
- Giữ mọi trao đổi về tiền trên Upwork Messages làm bằng chứng.

> Senior tip: "Tặng thêm cho nhanh" nghe như lời khen, nhưng nhận tiền ngoài Upwork là đánh đổi cả tài khoản và JSS lấy một khoản nhỏ. Câu trả lời chuẩn chỉ cần một ý: tôi giữ mọi thanh toán trên Upwork để cả hai được bảo vệ, và Upwork có sẵn cách thêm bonus hợp lệ. Nói đúng sự thật, nhẹ nhàng, và không nhượng bộ phần cơ chế.`,
  related: ['uw-ch-01', 'uw-ch-08', 'remote-016', 'remote-015'],
  tags: ['bonus', 'off-platform', 'circumvention', 'payment', 'PayPal'],
},
{
  id: 'uw-case-010',
  category: 'contract',
  level: 'senior',
  severity: 'medium',
  title: 'Khách muốn chuyển hợp đồng fixed-price đang dở sang hourly (hoặc ngược lại)',
  situation: `Hợp đồng fixed-price 1.200 USD, 3 milestone. Milestone 1 đã duyệt, milestone 2 đang làm dở (đã funded 500 USD). Khách nhắn: "This is turning into ongoing work with many small changes, can we switch to hourly instead? Or actually, I prefer a fixed price for the rest so I know the cost. Can you change the contract type?" Bạn chưa làm gì. Bạn nhận ra fixed-price và hourly là hai loại hợp đồng khác nhau, không có nút "đổi loại" tự động, và việc chuyển loại giữa chừng có thể làm mất mốc bảo vệ của phần đang làm.`,
  signals: [
    'Khách muốn đổi loại hợp đồng giữa chừng vì bản chất công việc thay đổi (thêm việc nhỏ, hoặc scope rõ hơn).',
    'Đề nghị "đổi loại" như thể chỉ là một nút bấm, trong khi hai loại có cơ chế bảo vệ khác nhau.',
    'Milestone 2 đang funded và đang làm dở — phần này cần được xử lý trước khi đổi.',
    'Khách chưa nói rõ ai chịu phần việc đã làm và tiền đã nạp khi chuyển.',
  ],
  steps: `1. **Hiểu bản chất:** fixed-price và hourly là hai loại hợp đồng với cơ chế bảo vệ khác nhau (fixed dựa vào milestone funded + submit work; hourly dựa vào Work Diary). Upwork không có nút "đổi loại" một hợp đồng đang chạy; cách sạch là chốt và đóng hợp đồng cũ, rồi mở hợp đồng mới đúng loại mong muốn.
2. **Xử lý phần đang dở trước:** với milestone 2 đang funded, hãy hoàn tất và submit, để khách duyệt (hoặc để hạn review tự chạy). Không bỏ dở một milestone đã funded để "chuyển loại", vì phần đó sẽ mất mốc bảo vệ.
3. **Đóng hợp đồng cũ đúng cách:** khi mọi milestone đã giải ngân, dùng chức năng đóng hợp đồng (end contract) và xin feedback. Việc đóng đúng cách giữ JSS tốt hơn là để hợp đồng treo.
4. **Mở hợp đồng mới đúng loại:** nếu khách muốn hourly, khách gửi offer hourly mới với rate và weekly limit; nếu muốn fixed, tạo milestone mới có mô tả và giá. Chỉ bắt đầu làm sau khi hợp đồng mới đã active.
5. **Khi nào nên đồng ý chuyển:** fixed sang hourly hợp lý khi việc trở nên thường xuyên, khó ước lượng, nhiều thay đổi nhỏ, hoặc cần bảo trì dài hạn. Hourly sang fixed hợp lý khi scope đã rõ, có đầu ra cụ thể, và khách muốn biết trước chi phí.
6. **Khi nào không nên chuyển:** nếu phần việc đang dở chưa xong, nếu khách muốn "gộp" để né review, hoặc nếu việc chuyển làm mất bằng chứng của phần đã làm. Trong trường hợp đó, hoàn tất phần cũ trước.
7. **Đặt kỳ vọng bằng văn bản:** tóm tắt loại hợp đồng mới, rate/giá, phạm vi, và mốc bắt đầu. Tránh hiểu lầm "đã chốt" khi hợp đồng mới chưa active.
8. **Rút kinh nghiệm:** ngay từ đầu chọn đúng loại theo độ rõ của scope; nếu scope dễ đổi, hourly linh hoạt hơn; nếu scope rõ, fixed giúp khách yên tâm chi phí.

Nhánh hay gặp:
- **Khách muốn fixed sang hourly vì "nhiều việc nhỏ":** đồng ý sau khi chốt milestone đang dở; mở hourly với weekly limit rõ.
- **Khách muốn hourly sang fixed để "kiểm soát chi phí":** đồng ý nếu scope đã rõ; viết milestone có acceptance criteria.
- **Khách muốn chuyển ngay giữa chừng, bỏ milestone đang funded:** từ chối, hoàn tất phần đang dở trước.
- **Khách nói "cứ làm đi, hợp đồng tính sau":** không làm khi hợp đồng mới chưa active; mất bảo vệ.`,
  templates: [
    { name: 'Giải thích cách chuyển sạch', text: 'Hi Mark, happy to adjust how we work together. Fixed-price and hourly are two different contract types on Upwork, so the clean way is to finish the current funded milestone first, close this contract, and then open a new contract of the type you prefer. That keeps every hour and milestone protected. Would you like to finish milestone 2 first, or should I submit what is ready now?' },
    { name: 'Chốt loại mới và phạm vi', text: 'Hi Mark, that works for me. Once milestone 2 is approved, we can close this contract and start an hourly contract at 40 USD per hour with a 20-hour weekly limit. I will track time with the Upwork app and send a short weekly update. Please send the new offer when you are ready, and I will start only after it is active.' },
    { name: 'Từ chối chuyển khi phần dở chưa xong', text: 'Hi Mark, I want to make sure the work and the payment stay protected, so I would prefer to finish and submit the current funded milestone before we change the contract type. Switching in the middle would leave that part without a clear review record. Once it is approved, I am glad to move to hourly or fixed, whichever suits you best.' },
  ],
  mistakes: [
    'Bỏ dở milestone đang funded để "chuyển loại": mất mốc bảo vệ và có thể mất tiền.',
    'Tưởng có nút đổi loại hợp đồng tự động: thực tế phải đóng và mở hợp đồng mới.',
    'Bắt đầu làm khi hợp đồng mới chưa active: làm việc không được bảo vệ.',
    'Không chốt lại phạm vi và rate của loại mới: dễ scope creep và tranh chấp.',
    'Để hợp đồng cũ treo không đóng: ảnh hưởng JSS và lịch sử làm việc.',
  ],
  prevention: `- Chọn đúng loại hợp đồng ngay từ đầu theo độ rõ của scope.
- Khi scope thay đổi, hoàn tất phần đang dở rồi mới đóng và mở hợp đồng mới.
- Ghi lại loại mới, rate/giá, phạm vi và ngày bắt đầu bằng văn bản trên Upwork.
- Không làm việc khi hợp đồng mới chưa active.
- Đóng hợp đồng cũ đúng cách và xin feedback để giữ JSS.

> Senior tip: Chuyển loại hợp đồng không phải "đổi nút" mà là "đóng đúng, mở đúng". Hoàn tất milestone đang funded, đóng hợp đồng cũ, rồi mở hợp đồng mới đúng loại — đó là cách giữ mọi giờ và milestone được bảo vệ. Đừng để một lần chuyển loại vội làm mất mốc review của phần việc đã làm.`,
  related: ['uw-ch-01', 'uw-ch-04', 'remote-012', 'remote-010'],
  tags: ['contract-type', 'fixed-price', 'hourly', 'switch', 'escrow'],
},
{
  id: 'uw-case-011',
  category: 'contract',
  level: 'lead',
  severity: 'high',
  title: 'Khách mời làm full-time/dài hạn ngoài Upwork sau 3 tháng hợp tác tốt',
  situation: `Bạn làm hourly cho một khách 3 tháng, 20 giờ/tuần, mọi thứ suôn sẻ. Khách nhắn: "You are the best developer we have worked with. Let us skip Upwork and its fees. I want to hire you full-time / long-term directly, pay you a monthly salary to your bank, and we can start next month. No platform, no fees, faster for both of us." Đề nghị nghe hấp dẫn: thu nhập ổn định, không mất phí dịch vụ. Nhưng khách là người bạn gặp qua Upwork, và việc chuyển quan hệ thanh toán ra ngoài trong thời gian cấm là rủi ro lớn.`,
  signals: [
    'Đề nghị chuyển sang làm trực tiếp, trả lương qua ngân hàng, "bỏ Upwork cho đỡ phí".',
    'Khách là người bạn gặp qua Upwork — quan hệ này chịu điều khoản chống lách trong một thời gian dài.',
    'Hứa "full-time", "lâu dài", "không phí" để tạo cảm giác an toàn và cấp bách.',
    'Chưa có hợp đồng lao động/dịch vụ chính thức, chỉ là lời hứa chuyển khoản.',
  ],
  steps: `1. **Nhận diện đây là tình huống chống lách (non-circumvention):** khách gặp qua Upwork thì trong một thời gian dài (quy định hiện hành là 24 tháng, kiểm tra lại trên Upwork Help) không được chuyển sang làm hoặc nhận tiền ngoài nền tảng để né phí, trừ khi trả conversion fee (phí chuyển đổi) theo quy định. Đây là rủi ro tài khoản, không phải mẹo.
2. **Đừng đồng ý bằng lời, đừng gửi số tài khoản.** Một câu "ok, tháng sau anh chuyển cho em" đã có thể bị coi là vi phạm. Giữ mọi trao đổi trên Upwork Messages.
3. **So sánh hai con đường một cách trung thực:** (a) ở lại Upwork: mất phí dịch vụ nhưng có escrow, quy trình dispute, bằng chứng, và không rủi ro khoá tài khoản; (b) ra ngoài: không mất phí nhưng mất bảo vệ, rủi ro không được trả, rắc rối hợp đồng/thuế, và nguy cơ vi phạm điều khoản nếu trong thời gian cấm.
4. **Đề xuất giữ trên Upwork trước:** nếu khách muốn dài hạn, có thể làm retainer (gói trả cố định định kỳ) ngay trên Upwork, hoặc một hợp đồng hourly dài hạn với weekly limit. Điều này đáp ứng mong muốn "ổn định" mà không vi phạm.
5. **Nếu khách vẫn muốn ra ngoài:** nói rõ bạn chỉ xem xét khi đáp ứng điều kiện hợp lệ (hết thời gian cấm, hoặc trả conversion fee theo quy định), và phải có hợp đồng dịch vụ/lao động chính thức, tư vấn pháp lý/thuế. Không tự suy đoán, kiểm tra trang chính thức của Upwork.
6. **Phân biệt "full-time employment" và "freelance dài hạn":** nếu khách muốn tuyển bạn làm nhân viên chính thức, đó là quan hệ lao động với hợp đồng, bảo hiểm, thuế khác — cần tư vấn chuyên gia, không phải chỉ chuyển khoản.
7. **Giữ quan hệ, không găng:** cảm ơn lời khen, nêu bạn rất muốn hợp tác lâu dài, và đề xuất cách làm an toàn. Khách nghiêm túc sẽ tôn trọng ranh giới.
8. **Ghi lại bài học:** đưa "chính sách chỉ làm trên Upwork" vào từ đầu, để những đề nghị như thế này không còn là bất ngờ.

Nhánh hay gặp:
- **Khách nói "chỉ là chuyển khoản, không ai biết":** giữ lập trường; rủi ro khoá tài khoản và mất toàn bộ không đáng.
- **Khách đồng ý làm retainer trên Upwork:** chốt số giờ, phạm vi, thời gian phản hồi bằng văn bản.
- **Khách muốn bạn làm nhân viên chính thức:** đây là con đường khác, cần hợp đồng lao động và tư vấn pháp lý/thuế.
- **Khách khăng khăng "không lên Upwork thì thôi":** để họ đi; giữ tài khoản và JSS quan trọng hơn một khách.`,
  templates: [
    { name: 'Cảm ơn và đề xuất hợp tác trên Upwork', text: 'Hi Mark, thank you, that means a lot and I have really enjoyed working with you. I keep all client work and payments on Upwork, so I am not able to move to direct payments right now. What I can do is set up a longer-term arrangement on Upwork, for example a monthly retainer with a clear scope and hours, so you get stability and we both stay protected. Would that work for you?' },
    { name: 'Giải thích ranh giới, giữ cửa mở', text: 'Hi Mark, I want to be transparent: I only take payments through Upwork for work that started on the platform, because moving off-platform during the covered period would put my account at risk. I would love to keep working with you long term, and an Upwork retainer or a longer hourly contract can give you the stability you want. If your plans change later, we can revisit the right way to do it.' },
    { name: 'Nếu khách vẫn muốn ra ngoài', text: 'Hi Mark, I understand the goal of a long-term setup. I am not able to accept direct bank payments for this relationship at the moment. If you would like, I can prepare a proper service agreement for review by a legal and tax professional, and we can look at the compliant options and any applicable conversion fee before making any change. Until then, I am happy to continue on Upwork.' },
  ],
  mistakes: [
    'Đồng ý bằng lời "tháng sau chuyển khoản": có thể bị coi là vi phạm điều khoản.',
    'Gửi số tài khoản ngân hàng hoặc nhận chuyển khoản ngoài: mất bảo vệ và tạo bằng chứng vi phạm.',
    'Tin "không ai biết": Upwork có thể phát hiện và khoá tài khoản.',
    'Không phân biệt full-time employment và freelance dài hạn: rắc rối hợp đồng/thuế.',
    'Từ chối thô hoặc găng: mất khách tốt chỉ vì không giải thích được cơ chế.',
  ],
  prevention: `- Nói rõ chính sách "chỉ làm và nhận tiền qua Upwork" ngay từ đầu hợp đồng.
- Biết cơ chế conversion fee và thời gian cấm (kiểm tra Upwork Help) để không tự suy đoán.
- Đề xuất retainer hoặc hợp đồng dài hạn trên Upwork khi khách muốn ổn định.
- Không gửi số tài khoản, không nhận chuyển khoản ngoài cho việc Upwork.
- Khi khách muốn ra ngoài, yêu cầu hợp đồng chính thức và tư vấn pháp lý/thuế.

> Senior tip: "Bỏ Upwork cho đỡ phí" là một trong những đề nghị nguy hiểm nhất với freelancer mới, vì nó đánh đổi cả tài khoản và JSS lấy phần phí tiết kiệm được. Câu trả lời chuẩn: tôi rất muốn hợp tác lâu dài, và tôi giữ mọi thanh toán trên Upwork để cả hai được bảo vệ; nếu muốn ổn định, ta làm retainer trên nền tảng. Nói đúng, nhẹ nhàng, và không nhượng bộ phần cơ chế.`,
  related: ['uw-ch-09', 'uw-ch-08', 'remote-016', 'remote-017'],
  tags: ['non-circumvention', 'conversion-fee', 'full-time', 'retainer', 'off-platform'],
},
{
  id: 'uw-case-012',
  category: 'contract',
  level: 'senior',
  severity: 'high',
  title: 'Hợp đồng hourly giới hạn 10 giờ/tuần nhưng khách giao việc 25 giờ và giục deadline',
  situation: `Hợp đồng hourly 30 USD/giờ, weekly limit 10 giờ/tuần. Tuần này khách giao một khối lượng lớn: "We need the payment module, the admin dashboard, and the deploy done by Friday, it is urgent." Ước lượng thực tế khoảng 25 giờ. Khách nhắn liên tục "please hurry", "we are behind", và không nhắc gì tới weekly limit. Bạn biết nếu làm 25 giờ thì 15 giờ vượt limit sẽ không được tính tiền và không được bảo vệ, nhưng deadline thì đang dí.`,
  signals: [
    'Khối lượng việc vượt xa weekly limit (10 giờ) nhưng khách không nhắc tới giới hạn.',
    'Khách giục deadline gấp, tạo áp lực "cứ làm đi, tính sau".',
    'Bạn bị cám dỗ làm thêm giờ ngoài limit để "cho kịp".',
    'Không có thỏa thuận nâng limit hoặc chuyển phần vượt sang fixed-price.',
  ],
  steps: `1. **Hiểu weekly limit là trần cứng:** giờ vượt limit không được tính tiền và không được Payment Protection bảo vệ. Làm 25 giờ khi limit 10 giờ nghĩa là 15 giờ bạn làm không công và không có bằng chứng được trả.
2. **Không tự ý làm vượt limit.** Trước khi làm thêm, phải yêu cầu khách nâng weekly limit trên hợp đồng, hoặc chuyển phần vượt sang một milestone fixed-price, hoặc chia thành hợp đồng khác. Xác nhận bằng tin nhắn trên Upwork.
3. **Trả lời khách bằng sự kiện và phương án:** nêu khối lượng ước lượng (25 giờ) so với limit (10 giờ), và đưa lựa chọn: (a) nâng limit lên 25 giờ tuần này; (b) chia scope, làm phần lõi 10 giờ trong tuần, phần còn lại milestone sau; (c) chuyển phần vượt sang fixed-price có giá.
4. **Nếu khách đồng ý nâng limit:** khách cập nhật weekly limit trên hợp đồng trước, bạn mới làm phần vượt. Không làm trước khi limit được nâng.
5. **Nếu khách không muốn nâng limit và vẫn giục deadline:** đề xuất cắt scope để vừa 10 giờ, hoặc nhận deadline trễ hơn. Không nhận deadline bất khả thi rồi làm vượt limit.
6. **Nếu khách nói "cứ làm, tôi sẽ trả thêm sau":** từ chối; lời hứa "trả sau" ngoài limit là nợ không được bảo vệ. Đề nghị milestone fixed-price cho phần vượt.
7. **Ghi giờ đúng cách:** chỉ ghi giờ trong limit bằng Upwork desktop app, memo rõ. Không ghi giờ vượt limit rồi mong được trả.
8. **Rút kinh nghiệm:** khi nhận hợp đồng hourly, luôn hỏi weekly limit và khối lượng dự kiến; nếu khối lượng lớn, đặt limit đủ hoặc dùng fixed-price cho phần lớn.

Nhánh hay gặp:
- **Khách đồng ý nâng limit:** nâng trước, làm sau, xác nhận bằng tin nhắn.
- **Khách từ chối nâng, chấp nhận cắt scope:** chốt scope 10 giờ bằng văn bản, phần còn lại milestone sau.
- **Khách ép "làm hết trong 10 giờ":** nói rõ chất lượng sẽ giảm, đề xuất deadline thực tế; không overcommit.
- **Khách hứa "trả thêm ngoài":** từ chối, giải thích cơ chế limit và bảo vệ.`,
  templates: [
    { name: 'Nêu khối lượng và ba phương án', text: 'Hi Mark, I want to deliver this properly. The full scope (payment module, admin dashboard, deploy) is about 25 hours, but the contract has a 10-hour weekly limit, and hours above the limit are not paid or protected. Here are the options: (1) raise the weekly limit to 25 hours for this week, (2) I do the core 10 hours now and the rest as a fixed-price milestone, or (3) we move the deadline. Which works best for you?' },
    { name: 'Đề xuất nâng limit trước khi làm', text: 'Hi Mark, that sounds good. Please update the weekly limit on the contract to 25 hours first, and once it shows the new limit I will start the extra work right away. I will track all hours with the Upwork app and send a short daily update. This keeps every hour paid and protected for both of us.' },
    { name: 'Đề xuất fixed-price cho phần vượt', text: 'Hi Mark, since the extra work is a clear block, I can do it as a fixed-price milestone at 450 USD with delivery by Friday, on top of the 10 hourly hours this week. That way the hourly limit stays clean and the extra scope is fully protected. Please create and fund the milestone, and I will start as soon as it is funded.' },
  ],
  mistakes: [
    'Làm 25 giờ khi limit 10 giờ: 15 giờ không được trả và không được bảo vệ.',
    'Tin "trả thêm sau": nợ ngoài limit không có escrow, khó cưỡng chế.',
    'Không yêu cầu nâng limit trước khi làm: mất tiền oan.',
    'Nhận deadline bất khả thi rồi làm vội: bug, chất lượng giảm, review xấu.',
    'Ghi giờ vượt limit rồi mong được tính: hệ thống không bảo vệ phần vượt.',
  ],
  prevention: `- Luôn hỏi weekly limit và khối lượng dự kiến trước khi nhận hourly.
- Khi khối lượng vượt limit, yêu cầu nâng limit hoặc chuyển phần vượt sang fixed-price trước khi làm.
- Xác nhận mọi thay đổi limit bằng tin nhắn trên Upwork.
- Không nhận deadline bất khả thi; đề xuất cắt scope hoặc dời hạn.
- Ghi giờ bằng app, memo rõ, chỉ trong limit.

> Senior tip: Weekly limit không phải "gợi ý" mà là trần cứng của thu nhập và bảo vệ. Làm vượt limit vì bị deadline dí là cách nhanh nhất biến 15 giờ thành làm không công. Một câu "scope này khoảng 25 giờ, mình nâng limit hoặc chuyển phần vượt sang fixed trước nhé" vừa chuyên nghiệp vừa bảo vệ bạn — khách nghiêm túc sẽ chọn phương án, khách ép bạn làm free là red flag.`,
  related: ['uw-ch-01', 'uw-ch-05', 'remote-010', 'remote-039'],
  tags: ['hourly', 'weekly-limit', 'deadline', 'scope', 'payment-protection'],
},
{
  id: 'uw-case-013',
  category: 'contract',
  level: 'lead',
  severity: 'high',
  title: 'Khách là agency/trung gian thuê lại bạn cho khách cuối: ai sở hữu code, ai chịu trách nhiệm',
  situation: `Một công ty tên "BrightLabs" (agency - công ty trung gian nhận dự án rồi thuê lại freelancer) mời bạn làm fixed-price 2.000 USD cho một dự án. Họ nói: "Chúng tôi là đối tác của khách cuối FinCo. Bạn làm theo yêu cầu của chúng tôi, giao code cho chúng tôi, chúng tôi trả tiền cho bạn qua Upwork. Khách cuối sẽ nhận sản phẩm qua chúng tôi." Hợp đồng Upwork là giữa bạn và BrightLabs. BrightLabs hỏi: "Code thuộc về chúng tôi để chúng tôi bàn giao cho khách cuối, bạn đồng ý chứ? Nếu khách cuối không trả, chúng tôi vẫn trả bạn vì tiền đã fund." Bạn chưa ký, và bắt đầu nhận ra có nhiều tầng trách nhiệm.`,
  signals: [
    'Khách chính là agency/trung gian, không phải người dùng cuối của sản phẩm.',
    'Yêu cầu bạn giao code cho agency để agency bàn giao lại cho khách cuối.',
    'Nói "ai sở hữu code" và "ai chịu trách nhiệm" một cách chung chung, chưa rõ bằng văn bản.',
    'Rủi ro khách cuối không trả agency, hoặc agency chậm trả bạn.',
    'Có thể có yêu cầu ký NDA với khách cuối hoặc làm ngoài Upwork.',
  ],
  steps: `1. **Xác định rõ các bên:** bạn - agency (BrightLabs) - khách cuối (FinCo). Hợp đồng Upwork là giữa bạn và agency; agency là người trả tiền và là đầu mối duy nhất của bạn. Mọi yêu cầu từ khách cuối phải đi qua agency, không nhận việc trực tiếp từ khách cuối nếu chưa có thỏa thuận.
2. **Làm rõ quyền sở hữu code (IP):** trong mô hình agency, agency thường cần quyền sử dụng/bàn giao code cho khách cuối, nhưng quyền đó phải đến từ agency một cách hợp lệ (agency có quyền với khách cuối). Bạn chỉ chuyển giao cho agency khi agency thanh toán phần việc đó. Ghi rõ trong hợp đồng: IP chuyển cho agency khi milestone được thanh toán.
3. **Làm rõ trách nhiệm và phạm vi:** ai là người duyệt (agency), ai báo lỗi, thời gian phản hồi, và phạm vi "đã duyệt" nghĩa là gì. Tránh tình trạng agency duyệt rồi khách cuối đổi ý — đó là scope mới, không phải lỗi của bạn.
4. **Về rủi ro "khách cuối không trả agency":** nếu milestone đã funded trong escrow của Upwork, bạn được bảo vệ bất kể agency có nhận tiền từ khách cuối hay không. Đây là lý do phải giữ mọi milestone funded trước khi làm. Nếu agency nói "tiền đã fund" thì kiểm tra trạng thái funded trên hợp đồng, đừng tin lời.
5. **Cảnh giác các dấu hiệu rủi ro:** agency yêu cầu bạn ký NDA trực tiếp với khách cuối, yêu cầu bạn xuất hóa đơn cho khách cuối, hoặc yêu cầu làm ngoài Upwork để "đỡ phí trung gian". Những điều này làm bạn mất bảo vệ và có thể vi phạm điều khoản.
6. **Đề xuất cấu trúc an toàn:** hợp đồng Upwork với agency, milestone nhỏ funded trước, IP chuyển cho agency khi thanh toán, mọi trao đổi qua Upwork Messages, agency là đầu mối duy nhất. Nếu agency muốn bạn làm việc với khách cuối, yêu cầu một thỏa thuận rõ ràng bằng văn bản về vai trò và thanh toán.
7. **Nếu agency từ chối fund trước hoặc yêu cầu làm ngoài:** cân nhắc từ chối. Agency nghiêm túc hiểu cơ chế escrow và chấp nhận fund; agency muốn bạn gánh rủi ro là red flag.
8. **Ghi lại bài học:** mô hình agency hợp lệ nếu có escrow và IP rõ ràng; rủi ro nằm ở agency muốn bạn làm free hoặc ngoài nền tảng.

Nhánh hay gặp:
- **Agency đồng ý fund milestone và IP rõ ràng:** làm bình thường, giao qua agency, giữ Upwork Messages.
- **Agency yêu cầu ký NDA với khách cuối:** yêu cầu bản NDA cân bằng, có giới hạn trách nhiệm; không ký bản chuyển giao IP quá rộng.
- **Khách cuối liên hệ trực tiếp và muốn thuê bạn riêng:** chuyển lại cho agency, không nhận việc ngoài; nếu muốn làm riêng, phải qua thỏa thuận hợp lệ.
- **Agency chậm trả dù đã funded:** mở dispute, nộp bằng chứng; escrow bảo vệ bạn.`,
  templates: [
    { name: 'Xác nhận các bên và cơ chế', text: 'Hi Mark, thanks for the details. To keep things clear: my contract is with BrightLabs, you are my single point of contact, and I will deliver the work to you for handover to the end client. I keep everything on Upwork, and I will start each milestone once it shows as funded in escrow. That protects both of us if anything changes on the end-client side. Does that match how you work?' },
    { name: 'Làm rõ IP và trách nhiệm', text: 'Hi Mark, I am fine transferring the code to BrightLabs on payment for each milestone, so you can hand it over to the end client. To avoid confusion later: the acceptance is based on the milestone criteria we agree, and any new request from the end client after delivery is a new scope with a new milestone. Could you confirm the IP transfer is on payment and that BrightLabs is the approving party?' },
    { name: 'Từ chối làm ngoài hoặc NDA quá rộng', text: 'Hi Mark, I keep all work and payments on Upwork and I can only sign a balanced NDA with a clear scope and a liability cap. I am not able to invoice the end client directly or move the work off-platform. If BrightLabs can fund the milestones on Upwork and confirm the IP terms, I am glad to proceed and deliver good work for your client.' },
  ],
  mistakes: [
    'Không xác định rõ agency là đầu mối duy nhất: nhận việc từ nhiều phía, rối trách nhiệm.',
    'Giao code trước khi milestone funded: mất đòn bẩy nếu agency không trả.',
    'Ký NDA/IP quá rộng với khách cuối: chuyển giao quyền không kiểm soát.',
    'Làm ngoài Upwork vì "đỡ phí trung gian": mất bảo vệ và vi phạm điều khoản.',
    'Tin "tiền đã fund" mà không kiểm tra trạng thái trên hợp đồng.',
  ],
  prevention: `- Xác định rõ các bên và đầu mối duy nhất ngay từ đầu.
- Giữ hợp đồng Upwork với agency, milestone funded trước khi làm.
- Ghi rõ IP chuyển cho agency khi thanh toán, và agency là bên duyệt.
- Mọi trao đổi qua Upwork Messages; không nhận việc trực tiếp từ khách cuối.
- Cảnh giác yêu cầu làm ngoài, xuất hóa đơn cho khách cuối, hoặc NDA quá rộng.

> Senior tip: Mô hình agency không xấu, nhưng rủi ro nằm ở chỗ bạn có thể bị kẹp giữa agency và khách cuối. Nguyên tắc an toàn: hợp đồng Upwork với agency, milestone funded trước, IP chuyển khi thanh toán, agency là đầu mối duy nhất. Nếu agency muốn bạn gánh rủi ro "chờ khách cuối trả" hoặc làm ngoài nền tảng, đó là lúc phải dừng lại và nói không.`,
  related: ['uw-ch-04', 'uw-ch-08', 'remote-036', 'remote-017'],
  tags: ['agency', 'subcontract', 'ip', 'escrow', 'contract', 'client'],
},
);
