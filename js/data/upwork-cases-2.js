/*
 * Case khó Freelance & Upwork (#/upwork, tab Case khó), phần 2. Schema + luật: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Case mẫu: uw-case-001 trong upwork-cases-1.js.
 * Id uw-case-NNN duy nhất trên mọi file upwork-cases-*.js.
 */
(window.UPWORK_CASES = window.UPWORK_CASES || []).push(
{
  id: 'uw-case-101',
  category: 'client',
  level: 'senior',
  severity: 'high',
  title: 'Khách biến mất giữa hợp đồng, milestone đang funded và đã có phần làm dở',
  situation: `Hợp đồng fixed-price 1.800 USD, 3 milestone: thiết kế + API (600), tích hợp thanh toán (700), deploy + tài liệu (500). Milestone 1 đã funded và được duyệt. Milestone 2 funded 700 USD; bạn làm 11 ngày, đẩy code lên repo GitHub riêng của khách và nhắn "done, please check". Khách trả lời một tin nhắn ngắn "looks good, will review soon". Sau đó im lặng 14 ngày: không trả lời tin nhắn, không bấm approve, không yêu cầu sửa. Milestone 2 vẫn còn tiền trong escrow và bạn còn phần tài liệu nhỏ chưa xong. Bạn không biết khách còn dự án hay đã bỏ.`,
  signals: [
    'Khách im lặng nhiều ngày sau khi bạn báo xong, không phản hồi bất kỳ tin nhắn nào.',
    'Milestone đã funded và code đã giao nhưng chưa được duyệt.',
    'Bạn bắt đầu nghi ngờ khách "lấy code rồi biến mất", dù không có bằng chứng rõ.',
    'Mốc thời gian review đang chạy, sắp hết hạn.',
  ],
  steps: `1. **Bình tĩnh, không kết luận vội.** Im lặng 2 tuần có nhiều nguyên nhân: khách bận, công ty gặp sự cố, email không báo, hoặc thật sự bỏ. Mọi hành động từ giờ phải dựa vào cơ chế của Upwork, không phải cảm xúc.
2. **Kiểm tra trạng thái milestone:** xác nhận số tiền 700 USD vẫn nằm trong escrow và hạn review còn lại bao nhiêu ngày. Đây là điều kiện tiên quyết — nếu tiền còn trong escrow, bạn vẫn an toàn về mặt tài chính.
3. **Gửi một tin nhắn "check-in" nhẹ nhàng trên Upwork Messages**, nhắc phạm vi đã làm, link commit/tag, và hỏi khách có cần hỗ trợ gì để review không. Giữ giọng chuyên nghiệp, không ép.
4. **Nếu khách vẫn im lặng:** để hạn review tự chạy. Theo cơ chế Upwork, milestone đã funded mà khách không phản hồi trong thời hạn review sẽ tự giải ngân cho freelancer (kiểm tra mốc thời gian hiện hành trên Upwork Help). Đừng tự bấm hoàn tiền hay huỷ.
5. **Hoàn thiện phần tài liệu nhỏ còn lại** trước khi submit work, để khi tự giải ngân bạn đã giao đủ phạm vi. Không vì khách im lặng mà giảm chất lượng.
6. **Nếu khách quay lại sau khi tự giải ngân:** trả lời lịch sự, tổng kết những gì đã giao, và hỏi họ muốn tiếp tục milestone 3 không. Không nhắc lại "anh im lặng" làm căng thẳng.
7. **Nếu khách quay lại và đòi "hoàn tiền vì tôi không đồng ý":** bám bằng chứng submit work + commit + memo; tiền đã tự giải ngân theo cơ chế nên bạn có quyền giữ, nhưng vẫn sẵn sàng sửa nhỏ nếu trong phạm vi.
8. **Nếu milestone 3 chưa funded:** không bắt đầu milestone 3 cho đến khi khách fund. Dùng thời gian chờ để viết tài liệu, dọn code, và liên hệ khách thêm một lần qua email đã lưu (nếu có) — nhưng mọi thoả thuận chính thức phải quay về Upwork Messages.
9. **Rút kinh nghiệm:** chia milestone nhỏ (≤ 1 tuần công) để mỗi lần rủi ro chỉ là một phần nhỏ; gửi "báo cáo tiến độ + link commit" mỗi 2-3 ngày để khách luôn thấy tiến độ, giảm khả năng "biến mất vì không biết gì".

Nhánh hay gặp:
- **Khách quay lại sau 3 tuần và nói "tôi bận, mới xem":** tổng kết lại bằng tin nhắn, đề nghị review trong X ngày; không trách móc.
- **Khách đòi hoàn tiền sau khi tự giải ngân:** giữ lập trường bám bằng chứng; đề nghị sửa nhỏ trong phạm vi nếu hợp lý.
- **Khách báo "công ty đã đóng cửa":** giữ professionalism, kết thúc hợp đồng theo cơ chế; không làm thêm miễn phí; ghi lại bài học về khách không có lịch sử thanh toán.`,
  templates: [
    { name: 'Check-in nhẹ nhàng', text: 'Hi Mark, hope you are doing well. I completed and submitted milestone 2 (payment integration) on [date], and the funds are currently in escrow. I wanted to check in and see if you need any help reviewing or if anything is unclear in the code (commits a1b2c3, d4e5f6). Happy to walk through it on a short call. Please let me know by [date] so we can keep things moving.' },
    { name: 'Hoàn thiện và nhắc hạn review', text: 'Hi Mark, just a quick note that milestone 2 is within its review window and the $700 is funded in escrow. I have also finished the remaining docs (link). If it is easier, you can let the review period run and the funds will be released automatically. I am available if you need any changes within scope. Thanks.' },
    { name: 'Tổng kết khi khách quay lại', text: 'Hi Mark, welcome back. To recap: milestone 2 (payment integration) was submitted on [date] and the funds have been released per the platform review window. The code and docs are in the repo (tag v1.0). If you would like any adjustments within the agreed scope, please list them and I will address them. For milestone 3, please fund it when you are ready to continue.' },
  ],
  mistakes: [
    'Kết luận "khách lừa đảo" và xoá quyền repo đột ngột: vi phạm và có thể phạm luật, mất bằng chứng.',
    'Tự bấm hoàn tiền hoặc huỷ milestone vì sốt ruột: mất tiền và làm yếu thế khi tranh chấp.',
    'Bắt đầu milestone 3 khi khách chưa fund: lặp lại rủi ro mất trắng.',
    'Không theo dõi hạn review: bỏ lỡ cơ chế tự giải ngân.',
    'Giảm chất lượng phần còn lại vì "khách bỏ rồi": vẫn phải giao đủ phạm vi đã cam kết.',
  ],
  prevention: `- Chia milestone nhỏ (≤ 1 tuần công) để mỗi lần rủi ro chỉ là một phần nhỏ của hợp đồng.
- Gửi báo cáo tiến độ + link commit mỗi 2-3 ngày để khách luôn thấy tiến độ.
- Với khách mới, không có lịch sử thanh toán trên Upwork, ưu tiên milestone nhỏ đầu tiên làm phép thử.
- Lưu mọi trao đổi trên Upwork Messages; không chuyển sang email/chat ngoài làm kênh chính.

> Senior tip: Khi khách im lặng, "bằng chứng" và "cơ chế" làm việc cho bạn, không phải lời nói. Một milestone đã funded + submit work đúng hạn + memo rõ ràng = tiền tự giải ngân theo quy định, dù khách có trả lời hay không. Hãy giữ bình tĩnh và để hệ thống chạy.`,
  related: ['uw-ch-01', 'remote-012', 'uw-case-001'],
  tags: ['client', 'ghosting', 'milestone', 'escrow', 'fixed-price'],
},
{
  id: 'uw-case-102',
  category: 'client',
  level: 'senior',
  severity: 'high',
  title: 'Khách nhắn liên tục ngoài giờ theo giờ Mỹ, thái độ xúc phạm; muốn kết thúc hợp đồng hạn chế rủi ro review xấu',
  situation: `Hợp đồng hourly 45 USD/giờ, limit 20 giờ/tuần, làm việc cho một khách Mỹ. Trong 2 tuần gần đây khách nhắn tin liên tục vào 2-4 giờ sáng theo giờ Việt Nam (giờ hành chính Mỹ), yêu cầu "fix ngay", dùng từ ngữ xúc phạm ("this is garbage", "you are wasting my time"). Bạn đã làm đúng phạm vi hợp đồng, Work Diary đầy đủ. Bạn muốn kết thúc hợp đồng nhưng sợ review 1 sao và JSS giảm. Khách vừa nhắn: "If you can't handle this, I'll leave a bad review and find someone else."`,
  signals: [
    'Khách nhắn liên tục ngoài giờ làm việc của bạn, đòi phản hồi ngay.',
    'Dùng từ ngữ xúc phạm, công kích cá nhân thay vì góp ý cụ thể.',
    'Đe doạ review xấu để ép bạn làm thêm/điều chỉnh scope.',
    'Bạn bắt đầu mất ngủ, hiệu suất giảm, ảnh hưởng các hợp đồng khác.',
  ],
  steps: `1. **Tách cảm xúc khỏi dữ liệu.** Bạn đang có Work Diary đầy đủ và phạm vi hợp đồng rõ; đó là "vũ khí" của bạn. Đừng trả lời trong lúc nóng giận, và đừng xin lỗi quá mức.
2. **Đặt ranh giới về giờ làm việc bằng văn bản trên Upwork Messages:** nêu rõ múi giờ của bạn, giờ phản hồi trong ngày, và cách xử lý yêu cầu khẩn cấp (ví dụ: "I respond within 24 hours during my business hours; for urgent production issues, please mark 'urgent' and I will prioritize"). Đây là chuyên nghiệp, không phải vô lý.
3. **Tách yêu cầu "khẩn cấp" khỏi scope creep:** nếu khách đòi "fix ngay" cho việc mới ngoài phạm vi, đó là change request, không phải bug. Ghi nhận và báo giá/thời gian, không làm miễn phí vì bị xúc phạm.
4. **Với từ ngữ xúc phạm:** trả lời bình tĩnh, bám sự kiện ("I understand the urgency; here is what I shipped in commit X"). Không tranh cãi về thái độ; nếu nặng hơn, báo cho hỗ trợ Upwork. Giữ tin nhắn làm bằng chứng.
5. **Quyết định kết thúc hợp đồng:** nếu ranh giới không được tôn trọng, bạn có quyền kết thúc. Với hourly, bạn có thể dừng nhận thêm giờ và gửi "wrap-up" tổng kết những gì đã làm + link commit. Không phải xin phép khách để dừng.
6. **Giảm rủi ro review xấu:** (a) kết thúc chuyên nghiệp, gửi tổng kết công việc đã làm rõ ràng; (b) không trả đũa bằng lời; (c) nếu khách đe doạ review xấu để ép làm việc, điều đó vi phạm điều khoản và có thể báo hỗ trợ Upwork — giữ bằng chứng. Review hai chiều nên feedback của bạn về khách cũng quan trọng.
7. **Sau khi kết thúc:** viết feedback cho khách một cách công bằng, factual (giờ làm việc, giao tiếp), không công kích cá nhân. Đây là quyền của bạn và giúp JSS của bạn được "đối trọng".
8. **Rút kinh nghiệm:** đưa "giờ làm việc, múi giờ, cách xử lý khẩn cấp" vào tin nhắn chốt hợp đồng; với khách ở múi giờ xa, đồng ý một "cửa sổ overlap" cố định (ví dụ 1-2 giờ) thay vì luôn sẵn sàng.

Nhánh hay gặp:
- **Khách xin lỗi và hứa thay đổi:** có thể cho cơ hội một lần, nhưng giữ ranh giới bằng văn bản; nếu tái phạm, kết thúc.
- **Khách escalating "tôi sẽ report bạn":** giữ bình tĩnh, bám bằng chứng; báo hỗ trợ Upwork nếu có quấy rối.
- **Khách đồng ý kết thúc hoà bình:** gửi wrap-up + feedback factual; thường review vẫn có thể xấu nhưng bạn đã giảm thiểu.`,
  templates: [
    { name: 'Đặt ranh giới giờ làm việc', text: 'Hi Mark, I want to make sure we keep delivery on track. My working hours are 9am-6pm ICT (UTC+7), and I reply within one business day. For urgent production issues, please mark the message as "urgent" and I will prioritize within my next working window. This keeps response quality consistent and avoids late-night context switching. Thanks for understanding.' },
    { name: 'Bám sự kiện khi bị xúc phạm', text: 'Hi Mark, I understand the frustration. Here is what is currently in place: [commit X] fixed the checkout issue you raised, and [commit Y] added the retry logic. Could you point to the specific behavior that is still failing so I can address it precisely? I am happy to fix anything within the agreed scope.' },
    { name: 'Wrap-up khi kết thúc', text: 'Hi Mark, after reviewing our recent communication, I think it is best for both of us to wrap up this contract. Summary of what was delivered: [list commits/features], with Work Diary covering the billed hours. I will submit a final note and leave feedback reflecting the work. Thank you for the opportunity, and I wish you success with the project.' },
  ],
  mistakes: [
    'Trả lời trong lúc nóng giận, công kích lại: tin nhắn đó trở thành bằng chứng chống lại bạn.',
    'Xin lỗi quá mức và nhượng bộ scope: tạo tiền lệ và làm mất uy tín.',
    'Làm việc 24/7 theo giờ khách: kiệt sức, chất lượng giảm, ảnh hưởng các hợp đồng khác.',
    'Kết thúc đột ngột không tổng kết: tăng rủi ro review xấu và tranh chấp.',
    'Dùng lời đe doạ "tôi sẽ report bạn": không cần thiết; giữ factual và báo hỗ trợ nếu cần.',
  ],
  prevention: `- Đưa "múi giờ, giờ làm việc, cách xử lý khẩn cấp" vào tin nhắn chốt hợp đồng.
- Đồng ý một "cửa sổ overlap" cố định với khách ở múi giờ xa, thay vì luôn sẵn sàng.
- Theo dõi chất lượng giao tiếp: nếu khách bắt đầu xúc phạm, đặt ranh giới sớm, đừng chờ đến kiệt sức.
- Giữ mọi trao đổi trên Upwork Messages để có bằng chứng nếu cần báo hỗ trợ.

> Senior tip: Ranh giới về giờ làm việc không phải "khó tính", mà là chuyên nghiệp. Một câu "I reply within one business day during my working hours" nói một lần, bằng văn bản, bảo vệ bạn khỏi kiệt sức và giữ chất lượng công việc — điều khách thực sự trả tiền cho.`,
  related: ['remote-009', 'remote-010', 'remote-036'],
  tags: ['client', 'communication', 'boundaries', 'review', 'JSS'],
},
{
  id: 'uw-case-103',
  category: 'client',
  level: 'lead',
  severity: 'high',
  title: 'Bạn gây sự cố production cho khách: deploy lỗi làm mất đơn hàng 3 giờ',
  situation: `Bạn làm fixed-price cho một cửa hàng e-commerce. Trong đợt deploy bản vá, bạn chạy migration DB thiếu bước rollback và deploy code không tương thích với schema mới. Kết quả: API đặt hàng trả 500 trong 3 giờ, khách mất khoảng 40 đơn hàng (ước tính 2.400 USD doanh thu). Bạn phát hiện sau 45 phút qua alert của khách, rollback trong 20 phút, rồi mất thêm 1 giờ để xử lý dữ liệu đơn hàng bị kẹt. Bạn tự nhận ra lỗi của mình. Hợp đồng milestone hiện tại đang funded 1.000 USD, chưa submit.`,
  signals: [
    'Sự cố production xuất hiện ngay sau deploy của bạn, với triệu chứng 500 trên API đặt hàng.',
    'Bạn tự phát hiện thiếu bước rollback trong migration và không tương thích schema.',
    'Khách mất doanh thu thực (đơn hàng không tạo được trong 3 giờ).',
    'Bạn đang cân nhắc có nên hoàn tiền một phần hay không.',
  ],
  steps: `1. **Ưu tiên khôi phục dịch vụ trước mọi thứ.** Rollback code + DB về trạng thái trước deploy, xác nhận API đặt hàng hoạt động, theo dõi 30-60 phút. Đừng tranh luận trách nhiệm trong lúc sự cố còn mở.
2. **Xử lý dữ liệu bị kẹt:** kiểm tra đơn hàng nào đã mất, đơn nào tạo một phần; phục hồi từ log/backup nếu có; nếu không thể tự động, làm thủ công có kiểm soát và ghi lại. Mục tiêu: khôi phục tối đa doanh thu cho khách.
3. **Thông báo cho khách ngay, minh bạch:** nêu thời gian sự cố, tác động (số đơn, doanh thu ước tính), nguyên nhân gốc (migration thiếu rollback + không tương thích schema), và các bước đã làm để khôi phục. Không đổ lỗi cho hạ tầng hay khách.
4. **Viết postmortem ngắn (trong 24-48 giờ):** timeline, nguyên nhân gốc, tại sao không phát hiện sớm, và hành động phòng ngừa (migration có rollback, deploy blue-green/canary, test staging giống production, alert sớm). Gửi cho khách.
5. **Về tiền: phân biệt "hoàn tiền milestone" và "bồi thường doanh thu mất".** Milestone là tiền công việc; doanh thu mất là thiệt hại production. Bạn không bắt buộc bồi thường doanh thu mất theo hợp đồng, nhưng uy tín và JSS phụ thuộc cách xử lý. Cân nhắc: (a) hoàn một phần milestone (ví dụ 200-300 USD) để thể hiện trách nhiệm; (b) không hoàn toàn bộ vì công việc còn lại vẫn phải làm; (c) nếu khách đòi bồi thường doanh thu mất, đây là đàm phán thương mại, không phải nghĩa vụ pháp lý tự động — cân nhắc quy mô và mối quan hệ.
6. **Thương lượng bằng văn bản trên Upwork:** đề xuất concrete (ví dụ hoàn 250 USD từ milestone + ưu tiên xử lý dữ liệu + postmortem + thay đổi quy trình). Để khách quyết định; không tự bấm hoàn tiền lớn mà không thống nhất.
7. **Tiếp tục milestone với chất lượng cao:** sửa migration, thêm test, deploy lại theo quy trình mới; submit work với bằng chứng (test, postmortem). Đây là cách khôi phục niềm tin nhanh nhất.
8. **Rút kinh nghiệm cho các dự án sau:** migration phải có rollback tested, deploy có canary/blue-green, staging giống production, alert trong 5 phút, và "deploy checklist" bắt buộc. Ghi vào runbook.

Nhánh hay gặp:
- **Khách đòi hoàn toàn bộ milestone + bồi thường doanh thu:** giữ bình tĩnh, bám phạm vi hợp đồng; đề xuất giải pháp concrete; nếu không đồng ý, có thể mediation. Không để cảm xúc quyết định.
- **Khách thông cảm và muốn bạn tiếp tục:** tận dụng để xây dựng lòng tin bằng chất lượng và quy trình mới.
- **Bạn phát hiện có thể phục hồi thêm đơn hàng từ backup:** làm ngay, báo khách; đây là điểm cộng lớn.`,
  templates: [
    { name: 'Thông báo sự cố minh bạch', text: 'Hi Mark, I want to be upfront about an incident during today\'s deployment. From [time] to [time] UTC, the order API returned 500 errors and some orders could not be placed. I have rolled back and the system is stable now. Root cause: a database migration I deployed was missing a rollback step and was not compatible with the previous schema. Estimated impact: about 40 orders / ~$2,400 revenue. I am now recovering any partially created orders from logs and will send a full postmortem within 48 hours, including the prevention steps.' },
    { name: 'Đề xuất đền bù và prevention', text: 'Hi Mark, following the incident, I propose: (1) I refund $250 from the current milestone as a goodwill gesture, (2) I complete the remaining milestone work with the new deploy process (migration rollback tested, canary deploy, staging parity, 5-min alerts), and (3) I share the postmortem and checklist. I cannot cover the full revenue loss, but I take full responsibility for the technical cause and want to make this right. Please let me know if this works for you.' },
    { name: 'Postmortem tóm tắt', text: 'Hi Mark, here is the postmortem for the [date] incident. Timeline: deploy at 14:00 UTC, first alert 14:45, rollback complete 15:05, data recovery done 16:00. Root cause: migration added a NOT NULL column without backfill and without a tested rollback. Why not caught: staging DB had old data shape. Actions: (1) rollback tested in CI, (2) canary deploy to 10% traffic, (3) staging data refresh weekly, (4) deploy checklist signed off before release. I will apply these to the remaining work.' },
  ],
  mistakes: [
    'Giấu sự cố hoặc đổ lỗi cho hạ tầng/khách: mất niềm tin, và khách tự phát hiện thì tệ hơn.',
    'Tranh luận trách nhiệm trong lúc sự cố còn mở: kéo dài downtime.',
    'Hoàn toàn bộ milestone + bồi thường doanh thu ngay lập tức vì tội lỗi: không cần thiết và tạo tiền lệ.',
    'Không viết postmortem: lặp lại sự cố.',
    'Bỏ qua dữ liệu bị kẹt: doanh thu mất vĩnh viễn, khách nhớ lâu.',
  ],
  prevention: `- Migration phải có rollback tested trong CI trước khi deploy.
- Deploy canary/blue-green cho thay đổi schema; không deploy thẳng production.
- Staging phải giống production về dữ liệu và schema.
- Alert trong 5 phút cho lỗi 5xx trên API quan trọng.
- Deploy checklist bắt buộc: rollback plan, owner on-call, thời gian rollback ước tính.

> Senior tip: Sự cố production không phải dấu chấm hết cho uy tín; cách bạn phản ứng mới là. Minh bạch trong 1 giờ đầu, khôi phục trong 1 giờ tiếp, postmortem trong 48 giờ, và thay đổi quy trình để không lặp lại — đó là thứ biến một khách hàng tức giận thành khách hàng trung thành. Uy tín của Senior được đo ở cách xử lý khi mọi thứ sai, không phải khi mọi thứ đúng.`,
  related: ['remote-013', 'remote-033', 'remote-034', 'remote-035'],
  tags: ['incident', 'production', 'deploy', 'postmortem', 'refund'],
},
{
  id: 'uw-case-104',
  category: 'review',
  level: 'senior',
  severity: 'high',
  title: 'Nhận review 3 sao kèm nhận xét không công bằng, JSS giảm',
  situation: `Bạn vừa hoàn thành hợp đồng fixed-price 1.500 USD cho một khách. Khách bấm approve milestone và trả tiền đầy đủ, nhưng để lại public review 3/5 sao với nhận xét: "Good developer but communication could be better, delivered a bit late." Bạn tự đánh giá: bạn đã giao đúng scope, trễ 1 ngày vì khách đổi yêu cầu giữa chừng (đã ghi nhận bằng văn bản), và giao tiếp qua Upwork Messages đều trong 24 giờ. JSS của bạn giảm từ 98% xuống 91% sau review này. Bạn cảm thấy không công bằng và muốn phản hồi.`,
  signals: [
    'Review 3 sao kèm nhận xét chung chung, không khớp với bằng chứng trao đổi.',
    'JSS giảm đáng kể sau một review không tương xứng chất lượng công việc.',
    'Khách đã approve và trả tiền đầy đủ, nhưng feedback công khai lại thấp.',
    'Bạn muốn phản hồi công khai nhưng sợ làm tình hình tệ hơn.',
  ],
  steps: `1. **Đọc lại toàn bộ trao đổi trước khi phản ứng.** Kiểm tra: phạm vi gốc, các change request, thời gian giao, và thời gian phản hồi tin nhắn. Xác định điểm nào khách có thể cảm thấy không hài lòng (dù bạn thấy vô lý) để hiểu góc nhìn của họ.
2. **Phân biệt "phản hồi công khai" và "khiếu nại":** phản hồi công khai (public reply) là câu trả lời của bạn dưới review; khiếu nại (dispute feedback) là yêu cầu Upwork xem xét review vi phạm điều khoản. Hai con đường khác nhau, không phải lúc nào cũng dùng cả hai.
3. **Viết phản hồi công khai ngắn, factual, không công kích:** cảm ơn, nêu nhẹ các sự kiện (đã giao đúng scope, trễ 1 ngày do change request đã thống nhất, phản hồi trong 24 giờ), và kết thúc bằng lời chúc. Không tranh cãi từng chữ, không công kích khách.
4. **Nếu review vi phạm điều khoản** (chứa thông tin sai sự thật có thể chứng minh, thông tin cá nhân, hoặc dùng để ép làm thêm), có thể gửi yêu cầu Upwork xem xét. Chuẩn bị bằng chứng: link trao đổi, change request, thời gian. Không bảo đảm thành công; Upwork thường chỉ gỡ review vi phạm nghiêm trọng.
5. **Không trả đũa bằng review của bạn cho khách:** viết feedback factual, chuyên nghiệp. Review hai chiều nên feedback của bạn về khách cũng ảnh hưởng JSS của họ; giữ factual giúp bạn giữ uy tín.
6. **Kế hoạch phục hồi JSS:** (a) nhận thêm hợp đồng nhỏ, giao đúng hạn, xin feedback tốt; (b) tập trung vào khách quen và referral; (c) cải thiện giao tiếp (báo cáo tiến độ chủ động, xác nhận change request bằng văn bản) để tránh lặp lại. JSS phục hồi theo thời gian khi có thêm feedback tốt.
7. **Rút kinh nghiệm:** từ giờ, với mỗi hợp đồng, gửi "wrap-up summary" trước khi khách bấm approve, nêu rõ những gì đã làm, thời gian, và mời góp ý. Nhiều review xấu bắt nguồn từ kỳ vọng không khớp, không phải chất lượng code.
8. **Đừng để một review định nghĩa bạn:** JSS là trung bình trượt; một review 3 sao không phải thảm hoạ nếu bạn có nhiều hợp đồng tốt. Tập trung vào hành động, không phải cảm xúc.

Nhánh hay gặp:
- **Khách đồng ý sửa review sau khi bạn liên hệ lịch sự:** có thể, nhưng đừng ép; nếu họ sửa, cảm ơn và không nhắc lại.
- **Khách từ chối sửa:** chấp nhận, chuyển sang kế hoạch phục hồi JSS; tranh cãi thêm chỉ hại bạn.
- **Review chứa thông tin sai sự thật rõ ràng:** gửi yêu cầu Upwork xem xét kèm bằng chứng; kết quả không bảo đảm.
- **Bạn muốn "trả đũa" review:** không làm; giữ professionalism, feedback factual là cách tốt nhất.`,
  templates: [
    { name: 'Phản hồi công khai factual', text: 'Hi Mark, thank you for the feedback and for the collaboration. For transparency: the scope was delivered as agreed, and the one-day delay followed a change request we confirmed in messages on [date]. I responded to messages within 24 hours throughout. I appreciate the note on communication and will make progress updates even more explicit on future projects. Wishing you success with the product.' },
    { name: 'Liên hệ riêng để làm rõ', text: 'Hi Mark, thanks again for approving and paying the milestone. I saw the public review and wanted to check in: is there a specific part of the delivery or communication that did not meet your expectations? I am always looking to improve, and if anything is unclear I am happy to clarify. Either way, I appreciate the opportunity to work together.' },
    { name: 'Yêu cầu xem xét (nếu vi phạm)', text: 'Hi Upwork Support, I would like to request a review of the feedback on contract [id]. The review states "[quote]", which I believe is not accurate based on our message history: [link to messages] shows the change request on [date] and my responses within 24 hours. I am not asking to remove fair feedback, only to verify the factual claims. Thank you for your time.' },
  ],
  mistakes: [
    'Phản hồi công khai công kích khách: làm tình hình tệ hơn và hại uy tín.',
    'Tranh cãi từng chữ trong review: không thay đổi được điểm số, chỉ làm bạn trông defensive.',
    'Trả đũa bằng review của bạn cho khách: hại uy tín và JSS của bạn.',
    'Bỏ qua kế hoạch phục hồi JSS: JSS không tự phục hồi nếu bạn không nhận thêm hợp đồng tốt.',
    'Kết luận "khách xấu" và ngừng nhận việc: làm hại thu nhập dài hạn.',
  ],
  prevention: `- Gửi "wrap-up summary" trước khi khách bấm approve, nêu rõ những gì đã làm và thời gian.
- Xác nhận change request bằng văn bản, kèm tác động đến thời gian giao.
- Báo cáo tiến độ chủ động mỗi 2-3 ngày, không đợi khách hỏi.
- Giữ mọi trao đổi trên Upwork Messages để có bằng chứng nếu cần.
- Nhận thêm hợp đồng nhỏ để đa dạng hoá feedback và phục hồi JSS.

> Senior tip: Một review 3 sao không phải thảm hoạ nếu bạn có nhiều hợp đồng tốt; JSS là trung bình trượt theo thời gian. Điều quan trọng là phản hồi công khai factual, không công kích, và tiếp tục giao tốt các hợp đồng tiếp theo. Uy tín thực sự được xây từ cách bạn xử lý feedback xấu, không phải từ việc không bao giờ nhận feedback xấu.`,
  related: ['remote-010', 'remote-036', 'remote-012'],
  tags: ['review', 'JSS', 'feedback', 'reputation', 'communication'],
},
{
  id: 'uw-case-105',
  category: 'account',
  level: 'mid',
  severity: 'high',
  title: 'Tài khoản bị tạm khoá do xác minh danh tính / đăng nhập bất thường',
  situation: `Bạn đang làm freelance trên Upwork từ Việt Nam. Tuần trước bạn đi công tác Singapore, đăng nhập Upwork từ IP mới, dùng VPN công ty, và uplink ảnh CMND cũ (chụp mờ). Hôm nay bạn nhận email: "Your account has been temporarily suspended pending identity verification." Bạn không thể truy cập hợp đồng, không thể trả lời khách, và có 2 milestone đang funded (tổng 900 USD) chưa được duyệt. Bạn lo mất tiền và mất khách.`,
  signals: [
    'Email từ Upwork báo tạm khoá tài khoản, yêu cầu xác minh danh tính.',
    'Bạn vừa đăng nhập từ IP/máy mới (đi công tác, VPN).',
    'Ảnh giấy tờ tuỳ thân đã nộp cũ/chụp mờ.',
    'Bạn không thể truy cập hợp đồng và trả lời khách trong thời gian bị khoá.',
  ],
  steps: `1. **Đừng hoảng và đừng tạo tài khoản mới.** Tạo tài khoản mới khi tài khoản cũ bị khoá có thể bị coi là lách quy định và làm tình hình tệ hơn. Giữ bình tĩnh, đọc kỹ email của Upwork.
2. **Đọc kỹ yêu cầu trong email:** Upwork thường nêu rõ tài liệu cần (CMND/CCCD/passport), cách nộp (upload trong tài khoản hoặc qua link), và thời hạn. Ghi lại các yêu cầu cụ thể.
3. **Chuẩn bị tài liệu rõ ràng:** ảnh giấy tờ tuỳ thân rõ nét, không bị cắt góc, ánh sáng đủ; nếu dùng passport, chụp trang có ảnh và chữ ký; nếu dùng CMND/CCCD, chụp cả hai mặt. Đảm bảo tên khớp với tên trên tài khoản Upwork.
4. **Nộp theo đúng hướng dẫn của Upwork**, không gửi email tuỳ tiện. Nếu có form upload, dùng form đó. Nếu được yêu cầu selfie/ảnh chân dung, làm theo đúng (ánh sáng tốt, mặt rõ, không đeo kính râm).
5. **Trả lời khách trong khi chờ:** nếu còn truy cập email, nhắn khách qua kênh đã có (email đã lưu) để giải thích ngắn gọn: tài khoản đang xác minh, bạn sẽ quay lại sớm, công việc không bị mất. Nếu không thể liên lạc, Upwork thường có cơ chế thông báo; nhưng bạn nên cố gắng liên lạc qua email đã lưu.
6. **Về tiền trong escrow:** tiền đã funded trong escrow không mất khi tài khoản bị tạm khoá; nó vẫn thuộc hợp đồng. Sau khi tài khoản được mở lại, bạn tiếp tục quy trình bình thường. Đây là lý do không nên hoảng.
7. **Theo dõi thời gian xử lý:** Upwork thường xử lý trong vài ngày (kiểm tra mốc hiện hành trên Upwork Help). Nếu quá hạn, gửi một ticket hỗ trợ với thông tin đầy đủ (không gửi nhiều lần).
8. **Sau khi mở lại:** bật xác thực hai yếu tố (2FA), đăng nhập từ thiết bị quen thuộc, tránh VPN khi truy cập Upwork, và cập nhật giấy tờ tuỳ thân nếu sắp hết hạn. Ghi lại bài học.

Nhánh hay gặp:
- **Yêu cầu thêm tài liệu (địa chỉ, sao kê ngân hàng):** nộp đúng theo hướng dẫn, không gửi dữ liệu nhạy cảm qua email tuỳ tiện.
- **Tài khoản bị khoá lâu hơn dự kiến:** gửi một ticket hỗ trợ với thông tin đầy đủ; đừng tạo tài khoản mới.
- **Khách huỷ hợp đồng vì bạn không trả lời:** giải thích sau khi mở lại, đề nghị khôi phục; giữ professionalism. Đây là rủi ro của việc bị khoá, nên phòng ngừa bằng liên lạc qua email đã lưu.
- **Bạn dùng VPN thường xuyên cho công việc:** cân nhắc tách: dùng VPN cho dev, nhưng truy cập Upwork từ IP ổn định/thiết bị quen.`,
  templates: [
    { name: 'Nhắn khách trong khi chờ xác minh', text: 'Hi Mark, quick heads-up: my Upwork account is currently under a routine identity verification, so I cannot access the contract or messages for a short time. Your funds and the work are safe, and I will resume as soon as it is resolved (usually a few days). I will send a full update once I am back. Sorry for the inconvenience and thank you for your patience.' },
    { name: 'Ticket hỗ trợ khi quá hạn', text: 'Hi Upwork Support, my account is under identity verification and I have submitted the requested documents on [date]. It has been [N] days and I have not received an update. I have active contracts with funded milestones that I cannot access. Could you please check the status and let me know if any additional documents are needed? Thank you.' },
    { name: 'Cập nhật sau khi mở lại', text: 'Hi Mark, good news — my account verification is complete and I am back online. Nothing changed with your contract or the funded milestones. I will continue with [next step] and send a progress update by [date]. Thanks again for your patience.' },
  ],
  mistakes: [
    'Tạo tài khoản mới khi tài khoản cũ bị khoá: có thể bị coi là lách quy định, làm tình hình tệ hơn.',
    'Nộp ảnh giấy tờ mờ/cắt góc: kéo dài thời gian xác minh.',
    'Gửi email tuỳ tiện với dữ liệu nhạy cảm thay vì dùng form của Upwork.',
    'Hoảng và hứa với khách "sẽ xong ngay" mà không biết thời gian xử lý.',
    'Không bật 2FA sau khi mở lại: dễ bị khoá lại.',
  ],
  prevention: `- Bật xác thực hai yếu tố (2FA) và giữ thông tin tài khoản cập nhật.
- Dùng ảnh giấy tờ tuỳ thân rõ nét, chụp lại khi cần (không mờ, không cắt góc).
- Tránh đăng nhập Upwork từ VPN/IP lạ; nếu phải, thông báo trước hoặc dùng thiết bị quen.
- Lưu email liên lạc của khách để có thể thông báo khi không truy cập được Upwork.
- Giữ giấy tờ tuỳ thân còn hiệu lực; cập nhật trước khi hết hạn.

> Senior tip: Tài khoản bị tạm khoá vì xác minh là tình huống thường gặp và thường được giải quyết trong vài ngày nếu bạn nộp đúng tài liệu. Tiền trong escrow không mất, và hợp đồng không tự huỷ. Điều quan trọng nhất là không tạo tài khoản mới và không hoảng — giữ bình tĩnh, nộp đúng, và liên lạc với khách qua email đã lưu.`,
  related: ['remote-016', 'remote-010', 'remote-009'],
  tags: ['account', 'verification', 'suspension', '2FA', 'identity'],
},
{
  id: 'uw-case-106',
  category: 'account',
  level: 'mid',
  severity: 'medium',
  title: 'Profile bị từ chối duyệt hoặc không ai xem proposal sau 1 tháng',
  situation: `Bạn là dev Java 4 năm, mới tạo profile Upwork 1 tháng trước. Profile của bạn đã được gửi duyệt nhưng bị từ chối với lý do chung "does not meet our standards" (không nêu cụ thể). Bạn sửa lại và gửi lại, nhưng vẫn bị từ chối. Trong thời gian đó bạn gửi 15 proposal cho các job Java/Spring, không nhận được bất kỳ phản hồi nào (kể cả từ chối). Bạn đang nghi ngờ Upwork "chặn" bạn, và cân nhắc tạo profile mới hoặc trả tiền để được duyệt.`,
  signals: [
    'Profile bị từ chối duyệt với lý do chung chung, không cụ thể.',
    'Gửi nhiều proposal nhưng không có bất kỳ phản hồi nào trong 1 tháng.',
    'Bạn nghi ngờ Upwork "chặn" hoặc "shadow ban" tài khoản.',
    'Bạn cân nhắc tạo profile mới hoặc trả tiền để được duyệt.',
  ],
  steps: `1. **Hiểu cơ chế duyệt profile:** Upwork duyệt profile dựa trên nhiều yếu tố (độ hoàn thiện, chuyên môn rõ ràng, không trùng lặp với profile khác, không vi phạm điều khoản). Bị từ chối không có nghĩa là "chặn vĩnh viễn"; bạn có thể sửa và gửi lại. Tạo profile mới để "lách" là vi phạm và có thể bị khoá tài khoản.
2. **Chẩn đoán profile:** kiểm tra các điểm thường bị từ chối: tiêu đề quá chung (ví dụ "Java Developer"), không có chuyên môn rõ ràng, ảnh đại diện không chuyên nghiệp, mô tả quá ngắn hoặc copy từ template, kỹ năng không khớp với kinh nghiệm thực, hoặc profile trùng với profile đã có (cùng email/thiết bị).
3. **Viết lại profile theo "niche":** thay vì "Java Developer", chọn một niche cụ thể bạn thật sự làm được (ví dụ "Spring Boot backend for e-commerce/SaaS", "Java microservices with Kafka"). Niche rõ ràng giúp khách tìm thấy bạn và tăng tỷ lệ được duyệt.
4. **Hoàn thiện profile:** ảnh chuyên nghiệp, tiêu đề rõ, mô tả 3-5 đoạn (ai bạn là, làm gì, cho ai, bằng chứng), portfolio 2-3 dự án (có thể là dự án cá nhân/demo), kỹ năng phù hợp, giờ làm việc và múi giờ. Mỗi phần phải "kiểm chứng được".
5. **Về proposal không có phản hồi:** đây là vấn đề riêng với profile. Kiểm tra: bạn có gửi proposal cho job phù hợp với niche không? Proposal có cá nhân hoá (đề cập yêu cầu cụ thể của job) hay copy-paste? Giá có phù hợp với thị trường không? Bạn có gửi quá nhiều proposal cùng lúc làm loãng chất lượng?
6. **Cải thiện proposal:** mỗi proposal phải trả lời 3 câu hỏi của khách: bạn hiểu yêu cầu gì, bạn sẽ làm thế nào, và tại sao bạn phù hợp. Đính kèm 1-2 dòng chứng minh (dự án tương tự). Tránh "I am interested, please hire me".
7. **Chiến lược ban đầu (0 review):** với profile mới, nhận job nhỏ, giá hợp lý, để có review đầu tiên; sau đó tăng giá dần. Đừng nhắm job lớn ngay từ đầu.
8. **Nếu vẫn bị từ chối sau nhiều lần:** gửi ticket hỗ trợ Upwork hỏi cụ thể lý do và cách cải thiện; không spam gửi lại. Có thể cần thời gian (vài tuần) để profile "chín" hơn.
9. **Rút kinh nghiệm:** profile là sản phẩm marketing của bạn; đầu tư thời gian viết niche, portfolio, và proposal cá nhân hoá. Đây là kỹ năng dài hạn, không phải "điền form".

Nhánh hay gặp:
- **Bạn nghi ngờ "shadow ban":** thường không phải; vấn đề là profile/proposal chưa đủ hấp dẫn. Kiểm tra bằng cách cải thiện niche và proposal, theo dõi phản hồi.
- **Bạn muốn trả tiền để được duyệt:** không có dịch vụ trả tiền chính thức; tránh bên thứ ba hứa "đảm bảo duyệt" (có thể là scam).
- **Bạn tạo profile mới để "reset":** vi phạm điều khoản, có thể bị khoá tài khoản; không làm.
- **Sau khi được duyệt, proposal vẫn không có phản hồi:** quay lại bước 5-6, cải thiện proposal và niche; cũng có thể thị trường job bạn nhắm quá cạnh tranh.`,
  templates: [
    { name: 'Profile headline + mô tả niche', text: 'Spring Boot Backend Developer for SaaS & E-commerce\n\nI help small and mid-size teams ship reliable Java backends: REST APIs with Spring Boot 3, PostgreSQL, and Docker. Recent work: a booking API with Stripe webhooks (idempotent, retry-safe) and a microservice migration from monolith. I write clean, tested code and document as I go. Available [hours] ICT. Portfolio: [link]. Let us discuss your project.' },
    { name: 'Proposal cá nhân hoá', text: 'Hi [Name], I read your job post carefully. You need a Spring Boot service that integrates with [X] and handles [Y]. I have done similar work: [1-2 sentences with concrete detail]. My plan: (1) clarify edge cases in a short call, (2) deliver a thin vertical slice in [N] days, (3) iterate with tests. I can start [date]. Happy to share a sample repo. Does this approach fit your timeline?' },
    { name: 'Ticket hỗ trợ khi bị từ chối nhiều lần', text: 'Hi Upwork Support, my profile has been declined a few times and I want to improve it properly. Could you share the specific reason(s) or areas I should fix (title, overview, portfolio, skills)? I am a Java/Spring Boot backend developer with [N] years of experience. I want to align with Upwork standards rather than resubmit blindly. Thank you.' },
  ],
  mistakes: [
    'Tạo profile mới để "reset" hoặc lách duyệt: vi phạm điều khoản, có thể bị khoá tài khoản.',
    'Tiêu đề quá chung ("Java Developer"): khó được tìm thấy và dễ bị từ chối.',
    'Proposal copy-paste, không cá nhân hoá: tỷ lệ phản hồi gần như 0.',
    'Nhắm job lớn ngay từ đầu với profile 0 review: khó cạnh tranh.',
    'Tin vào bên thứ ba hứa "đảm bảo duyệt" (có thể là scam).',
  ],
  prevention: `- Chọn một niche cụ thể và viết profile xung quanh niche đó.
- Hoàn thiện mọi phần profile: ảnh, tiêu đề, mô tả, portfolio, kỹ năng, giờ làm việc.
- Cá nhân hoá mỗi proposal theo job post; tránh copy-paste.
- Nhận job nhỏ đầu tiên để có review, sau đó tăng giá dần.
- Theo dõi tỷ lệ phản hồi proposal; nếu 0 sau 10-15 proposal, sửa profile/proposal trước khi gửi thêm.

> Senior tip: Profile bị từ chối và proposal không có phản hồi là vấn đề của "vị trí" (positioning), không phải "năng lực". Một dev Java 4 năm có đủ năng lực, nhưng trên Upwork bạn phải tự định vị mình trong một niche rõ ràng và viết proposal trả lời đúng câu hỏi của khách. Niche + proposal cá nhân hoá + job nhỏ đầu tiên để có review — đó là con đường thực tế nhất để bắt đầu.`,
  related: ['remote-004', 'remote-006', 'remote-010', 'uw-ch-01'],
  tags: ['profile', 'proposal', 'niche', 'review', 'account'],
},
);
