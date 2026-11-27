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
{
  id: 'uw-case-107',
  category: 'client',
  level: 'senior',
  severity: 'high',
  title: 'Khách không rành kỹ thuật, đổi ý mỗi tuần và đổ lỗi khi kết quả không như mong đợi',
  situation: `Hợp đồng fixed-price 2.400 USD, chia 4 milestone, làm một ứng dụng quản lý kho cho một chủ cửa hàng. Khách không rành kỹ thuật: mọi yêu cầu đều nói bằng miệng hoặc nhắn kiểu "làm cho giống Shopee đi", "cho nó đẹp", "thêm cái này nhanh thôi". Tuần 1 khách muốn file Excel, tuần 2 đổi sang web, tuần 3 đòi thêm app điện thoại, tuần 4 đổi màu và bố cục. Mỗi lần bạn đưa bản demo (bản chạy thử để xem trước), khách lại nhắn "this is not what I asked, you wasted my time" và đòi giảm giá, dù bạn chưa từng có một trang đặc tả (spec - tài liệu mô tả yêu cầu) nào được chốt bằng văn bản.`,
  signals: [
    'Khách mô tả yêu cầu bằng ví dụ mơ hồ ("giống Shopee", "cho đẹp") thay vì tiêu chí cụ thể.',
    'Mỗi tuần lại đổi hướng: Excel rồi web rồi app, không có tài liệu đặc tả được chốt.',
    'Khách chê "không giống trong đầu tôi" nhưng không chỉ ra được điểm nào sai.',
    'Không có tiêu chí nghiệm thu (acceptance criteria - điều kiện để coi là xong) bằng văn bản.',
    'Khách hay so sánh với sản phẩm khác và đổ lỗi chung chung khi bạn làm theo lời nói trước đó.',
  ],
  steps: `1. **Chuyển mọi yêu cầu nói miệng thành văn bản có tiêu chí nghiệm thu.** Sau mỗi buổi trao đổi, gửi một tin nhắn "scope recap" (tóm tắt phạm vi): mục nào sẽ làm, mục nào không, và điều kiện để coi là xong. Đây là bước quan trọng nhất: khi khách không rành kỹ thuật, "spec" không phải là từ ngữ kỹ thuật, mà là một danh sách gạch đầu dòng mà khách bấm "đồng ý".
2. **Vẽ trước khi code.** Dùng wireframe (bản phác thảo màn hình bằng khung xám, chưa có màu) hoặc ảnh chụp mockup, rồi làm một bản demo bấm được (clickable prototype) để khách duyệt HÌNH DÁNG trước. Với khách không rành kỹ thuật, nhìn hình dễ đúng hơn đọc chữ nhiều. Nếu khách duyệt wireframe, mọi chê "không giống" sau đó quay về một điểm cụ thể trên wireframe.
3. **Chốt "quy tắc thay đổi" ngay từ đầu:** yêu cầu mới ngoài spec sẽ được ước lượng và làm thành milestone mới, hoặc đổi ngang (swap) với mục ưu tiên thấp hơn. Nói một lần, bằng văn bản, nhẹ nhàng.
4. **Khi khách chê "không giống trong đầu tôi":** hỏi lại bằng câu cụ thể ("Which screen or which button is different from what you expected?"), rồi đối chiếu với acceptance criteria đã chốt. Nếu điểm khách muốn khác với spec, đó là thay đổi — báo giá; nếu giống spec, giải thích lại và mời khách đánh dấu vào spec.
5. **Giới hạn số vòng chỉnh sửa (revision rounds) trong mỗi milestone:** ví dụ "milestone này bao gồm 2 vòng chỉnh sửa nhỏ sau bản demo". Điều này chặn vòng lặp "sửa mãi chưa xong" mà không tăng giá. Ghi rõ trong mô tả milestone.
6. **Nếu khách đòi giảm giá vì "không như mong đợi":** không giảm; bám acceptance criteria đã chốt và bản demo đã duyệt. Đề nghị sửa đúng những gì trong scope, không nhận lỗi cho phần khách tự đổi ý.
7. **Nếu khách đổi ý sang nền tảng khác giữa chừng (Excel sang app):** coi đó là dự án mới, milestone mới, không gộp vào hợp đồng cũ. Nếu khách khăng khăng gộp, từ chối và giải thích khối lượng.
8. **Nếu khách đe doạ review xấu:** giữ bình tĩnh, bám bằng chứng (spec, wireframe đã duyệt, demo), không nhượng bộ vì doạ; feedback dùng để ép làm miễn phí là điều có thể báo hỗ trợ Upwork.
9. **Rút kinh nghiệm:** với khách không rành kỹ thuật, thứ tự đúng là spec bằng văn bản → wireframe → demo → code. Đầu tư 20% thời gian đầu để chốt hình dạng sẽ tiết kiệm 50% thời gian sửa về sau.`,
  templates: [
    { name: 'Recap phạm vi sau trao đổi', text: 'Hi Mark, to make sure we build the right thing, here is a short recap of what we agreed for this milestone:\n1) Inventory list with search by name and SKU.\n2) Add/edit/delete items with a confirmation step.\n3) Low-stock alert on the dashboard.\nNot included in this milestone: the mobile app and the color redesign (we can plan those next).\nCould you reply "agreed" so I can start? This keeps us both aligned and protects the timeline.' },
    { name: 'Hỏi phản hồi cụ thể khi khách chê', text: 'Hi Mark, thanks for the demo feedback. To fix exactly the right thing, could you point me to the specific screen or button that looks different from what you expected? For example, is it the layout of the item list, the search box position, or the colors? Once you point it out, I will map it against the spec we agreed and either adjust it (if it is within scope) or send a quick estimate (if it is a new change).' },
    { name: 'Báo giá thay đổi ngoài scope', text: 'Hi Mark, the mobile app is a new piece of work outside the current milestone, so I can deliver it as a separate milestone. The impact is about 30-35 hours (new API endpoints, responsive UI, and testing on two screen sizes), which comes to 900 USD with delivery in 10 business days after it is funded. If budget is tight, we can instead swap it with a lower-priority item from the current scope. Which option works for you?' },
  ],
  mistakes: [
    'Nhận yêu cầu bằng miệng rồi code ngay: không có spec, mọi thứ đều "không giống trong đầu khách".',
    'Không vẽ wireframe/demo trước: khách không hình dung được, dễ chê sau khi code xong.',
    'Để khách đổi ý vô hạn mà không tính phí: dự án thành lỗ thời gian và trễ milestone gốc.',
    'Nhận lỗi và giảm giá mỗi lần khách chê: tạo tiền lệ, khách đổi ý liên tục.',
    'Gộp "làm app" vào hợp đồng web với giá cũ: khối lượng tăng gấp đôi mà không thêm tiền.',
    'Tranh cãi cảm tính "anh nói thế mà": nên đưa spec và wireframe đã duyệt ra làm căn cứ.',
  ],
  prevention: `- Với khách không rành kỹ thuật, luôn chốt spec bằng văn bản và wireframe trước khi code.
- Đưa "số vòng chỉnh sửa" và "không bao gồm" vào mô tả milestone.
- Gửi scope recap sau mỗi buổi trao đổi; xin một câu "agreed" trước khi làm.
- Coi mọi yêu cầu mới là change request có ước lượng, không làm miễn phí.
- Dùng milestone nhỏ (≤ 1 tuần công) để mỗi lần đổi ý chỉ ảnh hưởng một phần nhỏ.

> Senior tip: Với khách không rành kỹ thuật, "spec" không phải tài liệu dày, mà là một danh sách gạch đầu dòng khách bấm đồng ý, cộng một wireframe khách nhìn thấy. Đầu tư 20% thời gian đầu để chốt hình dạng sẽ tiết kiệm 50% thời gian sửa về sau — và biến "không giống trong đầu tôi" thành "đúng rồi, nhưng tôi muốn thêm mục này", tức là một change request có giá.`,
  related: ['uw-ch-04', 'uw-ch-05', 'remote-011', 'uw-case-004'],
  tags: ['client', 'scope', 'spec', 'wireframe', 'change-request', 'fixed-price'],
},
{
  id: 'uw-case-108',
  category: 'client',
  level: 'senior',
  severity: 'high',
  title: 'Khách gửi mật khẩu production và database có dữ liệu khách hàng thật qua chat',
  situation: `Bạn làm fixed-price 1.600 USD, sửa lỗi và tối ưu một hệ thống cho khách. Khách nhắn trên Upwork: "Here is the production access so you can debug faster — user: admin, password: Passw0rd!2024, DB host: 10.0.3.12, and I attached a CSV with 5,000 real customer rows (name, email, phone, address) so you can test with real data." Khách ở EU (khách hàng của họ là công dân EU, thuộc phạm vi bảo vệ dữ liệu GDPR - giải thích bên dưới). Bạn chỉ cần đọc schema và chạy vài câu SELECT để tìm nguyên nhân chậm, không cần dữ liệu thật.`,
  signals: [
    'Khách gửi mật khẩu tài khoản admin/production và thông tin database trực tiếp trong chat.',
    'Đính kèm tệp CSV chứa dữ liệu khách hàng thật: email, số điện thoại, địa chỉ (gọi là PII).',
    'Khách nói "cứ dùng tạm cho nhanh" và không có quy trình cấp quyền nào.',
    'Dữ liệu thuộc công dân EU, tức là có thể chịu GDPR (quy định bảo vệ dữ liệu của EU).',
  ],
  steps: `1. **Không dùng mật khẩu đó và không tải tệp CSV về máy cá nhân.** Mật khẩu admin production gõ vào máy cá nhân, máy quán cà phê, hay máy chưa dọn sẽ là rủi ro rò rỉ. Tệp 5.000 dòng PII tải về laptop cũ không mã hoá là một vụ lộ dữ liệu tiềm tàng. Dừng lại trước khi làm gì.
2. **Nhắn khách ngay, lịch sự nhưng dứt khoát:** cảm ơn, nhưng vì bảo mật, bạn đề nghị cách truy cập an toàn hơn. Nêu rõ bạn không cần dữ liệu thật để tìm nguyên nhân chậm — chỉ cần schema và một bản dữ liệu mẫu đã che (masked).
3. **Giải thích rủi ro bằng ngôn ngữ khách hiểu (không hù doạ):** PII là thông tin nhận dạng cá nhân; nếu rò rỉ, khách (và cả bạn với vai trò người xử lý) có thể vi phạm GDPR, bị phạt và mất niềm tin khách hàng của họ. Đây là lý do bạn không thể nhận mật khẩu thật qua chat.
4. **Đề xuất quy trình an toàn cụ thể:** (a) khách tạo một user database riêng cho bạn, chỉ có quyền đọc (read-only) trên đúng schema cần, đặt mật khẩu tạm và đổi sau khi bạn xong; (b) dùng bản sao dữ liệu đã che (mask email/phone/address) hoặc dữ liệu giả; (c) nếu buộc vào production, dùng kênh quản trị tạm (bastion/VPN) do khách cấp, không đưa root key.
5. **Nếu khách khăng khăng "nhanh thôi, cứ dùng đi":** giữ ranh giới. Không nhận. Đề nghị làm trên môi trường staging (môi trường thử nghiệm giống production) với dữ liệu giả; nếu khách cần gấp, bạn vẫn bắt đầu phần đọc code không cần dữ liệu.
6. **Nếu khách đã lỡ gửi mật khẩu thật:** khuyên khách đổi mật khẩu ngay (rotate) sau khi bạn xong, và bạn không lưu lại, không chụp màn hình, không ghi vào ghi chú. Ghi nhận tình huống để rút kinh nghiệm.
7. **Không commit secret vào repo:** không dán mật khẩu, connection string, hay key vào code, file cấu hình, hay tin nhắn. Dùng biến môi trường (environment variable) hoặc file cấu hình không đưa lên git.
8. **Nếu lỡ có sự cố rò rỉ do bạn:** báo khách ngay trong 1 giờ, nêu rõ dữ liệu nào, khắc phục (thu hồi quyền, đổi mật khẩu), và hợp tác. Che giấu sự cố là sai lầm lớn hơn nhiều so với việc để lộ.
9. **Rút kinh nghiệm:** đưa "cách cấp quyền truy cập và xử lý dữ liệu" vào danh sách câu hỏi ngay từ buổi kickoff (buổi họp khởi động). Khách nghiêm túc sẽ có quy trình; khách không có, bạn là người đề xuất chuẩn an toàn.`,
  templates: [
    { name: 'Đề xuất truy cập an toàn thay cho mật khẩu thật', text: 'Hi Mark, thanks for the access, and I want to flag something important for security. I do not need real customer data to fix the slow query, and I should not use production admin credentials over chat. A safer setup: please create a read-only database user for me limited to the reporting schema, with a temporary password you rotate when I am done. For testing, a masked sample (emails and phones hidden) or synthetic rows works perfectly. This protects your customers and keeps us GDPR-compliant.' },
    { name: 'Giải thích PII và GDPR cho khách', text: 'Hi Mark, quick context on why I am careful here: the file contains personal data (names, emails, phone numbers, addresses) of EU residents, which is regulated by GDPR. If that data leaks from a personal laptop, both of us could face serious consequences, including fines and loss of customer trust. I can absolutely help you, I just need to do it through a secure, read-only path with masked data. Could you set that up, or should I start with the code review while you prepare it?' },
    { name: 'Chốt quy trình bàn giao và rotate mật khẩu', text: 'Hi Mark, to close this cleanly: I will use the read-only user you created and the masked dataset only. I have not stored the production password anywhere. Please rotate that admin password now that it was shared in chat, and delete the CSV from the chat if possible. When I finish, I will confirm the read-only user can be removed. Thanks for helping keep your customers data safe.' },
  ],
  mistakes: [
    'Dùng mật khẩu admin production gửi qua chat trên máy cá nhân: rủi ro rò rỉ và vi phạm bảo mật.',
    'Tải tệp 5.000 dòng PII về máy không mã hoá để "test cho nhanh": có thể thành vụ lộ dữ liệu.',
    'Commit mật khẩu/connection string vào repo git: secret bị lộ vĩnh viễn trong lịch sử commit.',
    'Không khuyên khách rotate mật khẩu sau khi chia sẻ: mật khẩu đó vẫn còn hiệu lực.',
    'Che giấu nếu lỡ làm rò rỉ dữ liệu: sai lầm lớn hơn nhiều so với việc để lộ.',
  ],
  prevention: `- Đưa "cách cấp quyền truy cập và xử lý dữ liệu" vào checklist kickoff của mọi dự án.
- Mặc định dùng read-only user + dữ liệu đã che; không bao giờ nhận mật khẩu admin qua chat.
- Không commit secret; dùng biến môi trường và file cấu hình không đưa lên git.
- Nếu buộc dùng production, dùng kênh quản trị tạm do khách cấp và không lưu thông tin đăng nhập.
- Biết nguyên tắc GDPR ở mức cơ bản: PII phải được bảo vệ, chỉ dùng đúng mục đích, che dữ liệu khi test.

> Senior tip: Khi khách gửi mật khẩu production và dữ liệu thật qua chat, phản xạ đúng không phải "dùng luôn cho nhanh" mà là "dừng lại và đề xuất cách an toàn". Một câu "I do not need real customer data to fix this, let us use a read-only user and masked data" vừa bảo vệ khách, vừa bảo vệ bạn, và cho khách thấy bạn là người biết lo rủi ro — điều một Senior thực sự được trả tiền để làm.`,
  related: ['remote-025', 'remote-036', 'uw-ch-08', 'uw-case-007'],
  tags: ['security', 'pii', 'gdpr', 'credentials', 'client', 'production'],
},
{
  id: 'uw-case-109',
  category: 'client',
  level: 'senior',
  severity: 'high',
  title: 'Code cũ của khách rất tệ; khách đòi sửa nhanh trong ngân sách nhỏ và hứa "refactor sau"',
  situation: `Khách có một ứng dụng Spring Boot cũ (phiên bản 2.7, tức bản đã lỗi thời), code 8 năm, không có một bài test nào, controller dài 2.000 dòng, câu SQL nối chuỗi (có nguy cơ SQL injection - chèn mã độc vào câu lệnh), thiếu index (chỉ mục giúp tra cứu nhanh) nên trang báo cáo mất 40 giây. Khách nhắn: "I just need a few urgent bug fixes in 3 days, budget is 400 USD. Don't touch the architecture, we will refactor later once things are stable." Bạn thấy sửa nhanh kiểu này dễ làm hỏng thêm và tạo nợ kỹ thuật (technical debt - nợ kỹ thuật là việc làm tạm cho xong nhưng để lại rắc rối phải trả sau).`,
  signals: [
    'Code không có test, kiến trúc tệ (controller khổng lồ, SQL nối chuỗi), thiếu index.',
    'Khách chỉ muốn vá nhanh, ngân sách nhỏ (400 USD) so với khối lượng thật.',
    'Khách hứa "refactor sau khi ổn định" — một lời hứa thường không bao giờ tới.',
    'Không có tài liệu, không có môi trường staging, không ai trong công ty hiểu code.',
  ],
  steps: `1. **Đánh giá nhanh (triage - phân loại mức độ) trước khi nhận việc.** Liệt kê: bug nào chặn người dùng, bug nào chỉ khó chịu, và rủi ro bảo mật nào (SQL injection là ưu tiên cao nhất). Đừng vẽ lại toàn bộ hệ thống — việc đó không nằm trong 400 USD và 3 ngày.
2. **Phân biệt "hotfix an toàn" và "phải refactor mới sửa được".** Một số bug sửa vá được trong 1-2 giờ (thêm tham số, thêm index). Một số bug gốc rễ nằm ở kiến trúc, sửa tạm sẽ tái phát — nói rõ với khách, đừng nhận rồi làm tạm.
3. **Đề xuất phạm vi nhỏ, có giới hạn:** "gói hotfix an toàn" trong ngân sách (ví dụ 400 USD) gồm 3-4 mục cụ thể, cộng một "báo cáo nợ kỹ thuật" (danh sách vấn đề còn lại, xếp theo mức rủi ro) để khách thấy bức tranh thật. Báo cáo này là giá trị gia tăng, không tính tiền.
4. **Không hứa "refactor sau" thay khách.** Nếu khách muốn refactor, đó là một milestone riêng, có giá và thời gian riêng. Đừng gộp "sửa nhanh" với "refactor" trong một hợp đồng nhỏ.
5. **Bảo vệ bằng test hồi quy (regression test):** với mỗi bug sửa, thêm một test nhỏ để bug đó không tái phát. Đây là cách sửa "nhanh" mà không tạo thêm nợ.
6. **Nếu khách ép "3 ngày, 400 USD, đừng đụng nhiều":** chốt scope bằng văn bản — "gói này chỉ gồm X, Y, Z; KHÔNG bao gồm refactor, migration, hay các bug khác". Gửi kèm cảnh báo rủi ro còn lại bằng văn bản, để khi sự cố xảy ra, bạn đã cảnh báo trước.
7. **Giới hạn bảo hành (warranty):** ví dụ 14 ngày cho đúng phần đã sửa, không bảo hành cho phần khách tự sửa hoặc phần ngoài scope. Nói rõ để tránh bị gọi lại vô hạn.
8. **Nếu khách đòi rewrite (viết lại từ đầu) trong 400 USD:** từ chối lịch sự — rewrite là dự án khác, cần đánh giá và ngân sách riêng. Đề nghị gói hotfix hoặc một buổi tư vấn ngắn.
9. **Rút kinh nghiệm:** định giá theo "loại việc" (hotfix, audit, refactor, rewrite) và ghi "known issues" (vấn đề đã biết) ngay từ đầu. Dự án "sửa nhanh vô hạn với ngân sách nhỏ" là dự án lỗ; chuyên nghiệp là nói không đúng lúc.`,
  templates: [
    { name: 'Chốt scope hotfix và cảnh báo rủi ro', text: 'Hi Mark, I reviewed the code and I can do a safe hotfix package within your 400 USD budget: (1) fix the report timeout by adding the missing index, (2) replace the string-concatenated SQL with a parameterised query to close the injection risk, (3) fix the two blocking bugs. This does not include a refactor or the other known issues, which I will list in a short technical-debt report at no extra cost. I will add a regression test for each fix. Does this scope work for you?' },
    { name: 'Báo giá refactor riêng', text: 'Hi Mark, the deeper issues (the 2,000-line controller, missing tests, no staging) cannot be fixed safely inside a 3-day hotfix. A proper refactor is a separate piece of work: I would estimate 60-80 hours, delivered in phases so nothing breaks. I can send a phased plan with a fixed price per phase after the hotfix. For now, I recommend we ship the safe hotfix first and schedule the refactor as its own milestone. Would you like the phased plan?' },
    { name: 'Xác nhận giới hạn bảo hành bằng văn bản', text: 'Hi Mark, to set clear expectations: the 14-day warranty covers the specific fixes in this hotfix package. It does not cover issues caused by changes made after delivery, or problems in the parts we agreed are out of scope. I have documented the remaining known issues in the report so nothing is a surprise. If anything in the fixed scope misbehaves, I will address it free of charge within the warranty period. Thanks for understanding.' },
  ],
  mistakes: [
    'Nhận "sửa nhanh" rồi vá bừa: bug tái phát, khách mất niềm tin, bạn mất thời gian sửa lại.',
    'Cố refactor trong ngân sách 400 USD: vượt giờ, lỗ, và dễ làm hỏng hệ thống đang chạy.',
    'Không thêm test hồi quy: cùng một bug quay lại sau vài tuần.',
    'Không chốt scope bằng văn bản: khi sự cố xảy ra, khách nói "anh làm chưa xong".',
    'Tin "refactor sau" rồi làm miễn phí phần lớn công việc: lời hứa đó hiếm khi thành.',
    'Nhận rewrite với giá hotfix: dự án đội gấp nhiều lần, kết thúc trong tranh chấp.',
  ],
  prevention: `- Phân loại dự án theo loại việc (hotfix, audit, refactor, rewrite) và định giá riêng.
- Luôn thêm test hồi quy cho mỗi bug sửa; đó là cách "nhanh" mà không tạo nợ mới.
- Ghi "scope + không bao gồm + known issues" bằng văn bản trước khi bắt đầu.
- Giới hạn bảo hành có thời hạn và phạm vi rõ ràng.
- Từ chối dự án "sửa nhanh vô hạn, ngân sách nhỏ"; thà mất một hợp đồng hơn mất nhiều giờ.

> Senior tip: "Refactor sau" là một trong những lời hứa khó thành nhất trong freelance, vì ngân sách và deadline của "sau" thường còn tệ hơn "bây giờ". Cách chuyên nghiệp không phải làm cật lực rồi kiệt sức, mà là tách bạch: hotfix an toàn trong ngân sách, báo cáo nợ kỹ thuật để khách thấy sự thật, và refactor thành milestone riêng. Người trả tiền cho Senior là người dám nói "phần này cần một hợp đồng khác".`,
  related: ['remote-056', 'remote-030', 'uw-ch-05', 'uw-case-006'],
  tags: ['legacy', 'refactor', 'technical-debt', 'scope', 'fixed-price', 'security'],
},
{
  id: 'uw-case-110',
  category: 'review',
  level: 'senior',
  severity: 'medium',
  title: 'Hợp đồng dài hạn kết thúc êm nhưng khách không để feedback; nhiều hợp đồng nhỏ không hoạt động lâu',
  situation: `Bạn vừa kết thúc một hợp đồng retainer (gói trả cố định định kỳ) kéo dài 8 tháng với một khách, mọi thứ êm đẹp, khách hài lòng. Nhưng khách "không bấm feedback" vì công ty họ có chính sách không đánh giá freelancer. Trước đó bạn còn 6 hợp đồng nhỏ 1-2 tuần, khách bận nên cũng không để lại đánh giá. Kết quả: bạn làm nhiều nhưng rất ít review công khai, và JSS (Job Success Score - điểm thành công trên Upwork, dựa trên phản hồi của khách) cùng "recent feedback" (phản hồi gần đây) của bạn khá thấp, làm giảm cơ hội được mời việc.`,
  signals: [
    'Nhiều hợp đồng kết thúc mà không có feedback công khai, dù khách hài lòng.',
    'Liên tục nhận job ngắn 1-2 tuần, không có hợp đồng dài hạn đủ lớn.',
    'Khách nói "công ty tôi không đánh giá freelancer" hoặc simply quên bấm.',
    'JSS hoặc "recent feedback" thấp, ít lời mời (invite) từ khách.',
  ],
  steps: `1. **Hiểu cơ chế JSS trước khi lo lắng.** JSS dựa trên phản hồi (cả riêng tư và công khai) của khách trong một khoảng thời gian trượt; hợp đồng dài hạn đóng đúng cách được tính, còn hợp đồng không có phản hồi hoặc kết thúc vội có thể kéo điểm xuống (cơ chế và ngưỡng thay đổi theo thời gian, kiểm tra trên Upwork Help). Đừng cầu xin review — hãy làm cho việc để lại review trở nên dễ dàng.
2. **Chủ động xin feedback đúng cách, đúng lúc:** trước khi đóng hợp đồng, gửi một tin nhắn "wrap-up" (tóm tắt kết quả) kèm lời mời nhẹ: "If you are happy with the work, a short review would mean a lot." Không hứa hẹn, không đổi chác (xem case uw-case-111).
3. **Đóng hợp đồng đúng cách (end contract) thay vì để treo.** Với hourly, khi công việc đã xong, chủ động đóng và cảm ơn; để hợp đồng treo không giúp JSS. Với fixed-price, đảm bảo mọi milestone đã giải ngân rồi đóng.
4. **Với khách không để feedback (chính sách công ty):** chấp nhận, không ép, không giảm giá để đổi review (vi phạm). Bù lại bằng hợp đồng mới và khách quen. Có thể xin một "private feedback" (phản hồi riêng, chỉ Upwork thấy) — nó vẫn ảnh hưởng JSS mà không cần công khai.
5. **Xây khách lặp lại (repeat clients):** giữ liên hệ sau khi đóng, đề xuất gói bảo trì (maintenance retainer) nhỏ, hoặc hỏi "do you know anyone who needs similar work?" (referral - giới thiệu). Khách quen thường để feedback dễ hơn khách một lần.
6. **Chọn hợp đồng dài hơn, ít hơn:** nếu mục tiêu là JSS, một hợp đồng 3-6 tháng có feedback tốt có giá trị hơn 10 job 2 ngày không ai đánh giá. Cân nhắc giảm nhận job ngắn liên tục.
7. **Nếu khách hứa "sẽ để review" rồi quên:** nhắc đúng một lần sau khoảng 1 tuần, nhẹ nhàng; không nhắc nhiều lần, không làm khách khó chịu.
8. **Rút kinh nghiệm:** đưa "feedback request" vào quy trình đóng hợp đồng như một bước bắt buộc; theo dõi tỷ lệ hợp đồng có feedback; đa dạng hoá nguồn khách để không phụ thuộc một khách không bao giờ đánh giá.`,
  templates: [
    { name: 'Wrap-up kèm lời mời review', text: 'Hi Mark, it has been a pleasure working with you over the past 8 months. Quick recap of what we delivered: [list 2-3 outcomes with numbers]. The code and docs are handed over, and the contract is ready to close. If you are happy with the work, a short review would mean a lot to my profile. Either way, thank you for the trust, and I am here if you need anything later.' },
    { name: 'Nhắc nhẹ sau một tuần', text: 'Hi Mark, just a gentle follow-up on my earlier note. No pressure at all, but if a quick review is possible on your side, it would really help my profile. I have enjoyed working with you and would be glad to help again on future projects. Thanks either way.' },
    { name: 'Đề xuất gói bảo trì dài hạn', text: 'Hi Mark, now that the main build is done, I can offer a small monthly maintenance plan (for example 4 hours per month for bug fixes, dependency updates, and monitoring). That keeps the system healthy and gives you priority support. If that is useful, I can set it up as an Upwork retainer. Happy to tailor the scope to what you need.' },
  ],
  mistakes: [
    'Không xin feedback vì sợ làm phiền: mất review hợp pháp mà bạn xứng đáng có.',
    'Ép khách để review hoặc giảm giá để đổi review: vi phạm, có thể bị gỡ review.',
    'Để hợp đồng treo không đóng: ảnh hưởng JSS và lịch sử làm việc.',
    'Nhận liên tục job 1-2 ngày: ít review, JSS khó cải thiện.',
    'Không giữ liên hệ sau đóng: mất khách quen và nguồn referral.',
    'Xin review nhiều lần, dai dẳng: gây khó chịu, phản tác dụng.',
  ],
  prevention: `- Đưa "wrap-up + feedback request" thành bước bắt buộc khi đóng mọi hợp đồng.
- Ưu tiên hợp đồng dài hạn có feedback hơn là nhiều job ngắn không ai đánh giá.
- Giữ liên hệ với khách cũ và đề xuất gói bảo trì; xây nguồn referral.
- Chấp nhận khách không để feedback; xin private feedback nếu được.
- Theo dõi tỷ lệ hợp đồng có phản hồi và "recent feedback" để điều chỉnh cách làm.

> Senior tip: JSS không được xây bằng một hợp đồng hoàn hảo, mà bằng nhiều hợp đồng kết thúc đúng cách và để lại phản hồi. Đừng chờ khách tự nhớ bấm đánh giá — hãy gửi một wrap-up gọn kèm lời mời nhẹ, đóng hợp đồng sạch sẽ, và giữ liên hệ. Một khách hài lòng không để feedback vẫn là một khách quen tiềm năng; một khách một lần không ai đánh giá thì gần như không có giá trị cho hồ sơ của bạn.`,
  related: ['uw-ch-07', 'uw-ch-09', 'remote-013', 'remote-017', 'remote-041'],
  tags: ['review', 'JSS', 'feedback', 'retainer', 'repeat-clients'],
},
{
  id: 'uw-case-111',
  category: 'review',
  level: 'senior',
  severity: 'high',
  title: 'Khách đề nghị "5 sao nếu giảm giá" hoặc đòi bạn để review tốt cho họ trước',
  situation: `Bạn đang hoàn thành một hợp đồng fixed-price 1.200 USD. Khách nhắn: "I will give you 5 stars if you drop the price by 20%." Ở một hợp đồng khác, khách nhắn: "Leave me a 5-star review first and I will do the same for you." Bạn mới làm freelance và đang rất cần review, nên bị cám dỗ đồng ý. Nhưng cả hai đề nghị đều là review có điều kiện (đổi đánh giá lấy tiền hoặc lấy đánh giá qua lại) — điều này vi phạm điều khoản của Upwork và có thể khiến review bị gỡ hoặc tài khoản bị khoá.`,
  signals: [
    'Khách gắn review với điều kiện: "5 sao nếu giảm giá", "để tôi 5 sao nếu anh giảm".',
    'Khách đề nghị trao đổi review qua lại: "bạn để tôi 5 sao trước, tôi để lại bạn".',
    'Bạn đang cần review nên muốn nhượng bộ để "cho xong".',
    'Không có thoả thuận bằng văn bản nào về việc review là tự nguyện.',
  ],
  steps: `1. **Nhận diện đây là review có điều kiện (review manipulation):** feedback phải tự nguyện và không gắn với tiền, việc thêm, hay đánh giá qua lại. "5 sao đổi giảm giá" và "để review tốt cho nhau" đều là điều kiện — vi phạm điều khoản, rủi ro bị gỡ review hoặc khoá tài khoản. Đây là rủi ro tài khoản, không phải cơ hội.
2. **Từ chối lịch sự, tách bạch review khỏi giá:** nói rõ bạn không đổi review lấy giá, và review của khách là tự nguyện. Giữ giọng hợp tác, không lên lớp. Ví dụ: "I keep pricing and reviews separate — the review is entirely up to you."
3. **Không chủ động "để review tốt trước" cho khách.** Đó cũng là một dạng mặc cả (dù khách gợi ý trước). Feedback hai chiều là bình thường, nhưng không ai được xem review của mình như một món hàng để trao đổi.
4. **Nếu khách vẫn ép "giảm giá đi tôi mới để 5 sao":** giữ giá. Chấp nhận rằng bạn có thể mất review này; một review không xứng đáng không đáng để bạn phá cơ chế giá và rủi ro tài khoản. Đề nghị giữ nguyên giá và mời review tự nguyện nếu khách hài lòng.
5. **Nếu khách đe doạ "không giảm giá thì 1 sao":** giữ bình tĩnh, bám bằng chứng công việc đã làm, và báo hỗ trợ Upwork nếu có ép buộc; giữ lại tin nhắn làm bằng chứng. Feedback dùng để ép giá là điều có thể báo cáo.
6. **Nếu bạn lỡ đồng ý "để review qua lại":** dừng ngay, không thực hiện. Nếu đã thực hiện, hiểu rằng review có thể bị gỡ và tài khoản bị điều tra; đừng lặp lại.
7. **Xin review đúng cách:** sau khi giao tốt, gửi wrap-up và mời nhẹ "If you are happy with the work, a short review would mean a lot." Không hứa hẹn, không gắn với giảm giá, không mặc cả.
8. **Rút kinh nghiệm:** không bao giờ gắn review với tiền hay việc; xây review từ chất lượng và giao tiếp. Một hồ sơ có 10 review thật, tự nguyện, bền hơn 1 review "mua" bằng giảm giá.`,
  templates: [
    { name: 'Từ chối đổi review lấy giá', text: 'Hi Mark, thanks for the offer, but I keep pricing and reviews separate. The price for this milestone reflects the agreed scope, and I am not able to lower it in exchange for a rating. The review is completely your call and there is no condition attached either way. I am glad to deliver the work as scoped, and if you are happy with it, a short honest review would be appreciated but never expected.' },
    { name: 'Từ chối trao đổi review qua lại', text: 'Hi Mark, I appreciate the thought, but I am not able to exchange reviews. Feedback should be honest and independent on both sides, so I will leave my review based on our actual collaboration, and yours is entirely up to you. I have really enjoyed working on this and I hope the delivery speaks for itself. Thank you for understanding.' },
    { name: 'Giữ giá và mời review tự nguyện', text: 'Hi Mark, I understand the budget concern, and I am happy to discuss scope if the price is tight, but I cannot tie the rating to a discount. The current price covers the agreed work. If, after delivery, you feel the work was solid, a short honest review would mean a lot. Either way, I will make sure the milestone is delivered properly and on time.' },
  ],
  mistakes: [
    'Đồng ý giảm giá để lấy 5 sao: vi phạm điều khoản, review có thể bị gỡ, mất tiền oan.',
    'Chủ động "để review tốt trước" cho khách: cũng là mặc cả, rủi ro tương tự.',
    'Nhượng bộ vì đang cần review: một review không xứng đáng không đáng rủi ro tài khoản.',
    'Không giữ bằng chứng khi bị đe doạ 1 sao: khó báo hỗ trợ Upwork.',
    'Làm review qua lại rồi kể lại với freelancer khác: có thể bị coi là mạng lưới thao túng.',
  ],
  prevention: `- Nói rõ "pricing và review tách biệt" ngay từ đầu nếu khách nhắc tới review.
- Không bao giờ gắn review với giảm giá, việc thêm, hay đánh giá qua lại.
- Xin review đúng cách: wrap-up + lời mời nhẹ, không điều kiện.
- Giữ bằng chứng nếu bị ép; báo hỗ trợ Upwork khi có đe doạ.
- Xây review từ chất lượng thật; 10 review tự nguyện bền hơn 1 review "mua".

> Senior tip: Một review 5 sao đổi bằng 20% giảm giá nghe có vẻ "cả hai cùng lợi", nhưng thực chất bạn đang đánh đổi tiền thật và cả tài khoản lấy một dòng đánh giá có thể bị gỡ bất cứ lúc nào. Cách của Senior: giữ giá, giao tốt, mời review tự nguyện. Điểm số đến từ chất lượng sẽ ở lại; điểm số mua bằng giảm giá luôn là một quả bom hẹn giờ.`,
  related: ['uw-ch-07', 'uw-ch-08', 'remote-013', 'uw-case-104', 'uw-case-110'],
  tags: ['review', 'JSS', 'review-manipulation', 'discount', 'account', 'policy'],
},
{
  id: 'uw-case-112',
  category: 'account',
  level: 'lead',
  severity: 'high',
  title: 'Bạn ốm hoặc việc gia đình phải nghỉ 2 tuần giữa 3 hợp đồng đang chạy: thông báo, bàn giao, giữ uy tín',
  situation: `Bạn đang chạy 3 hợp đồng cùng lúc: hai hợp đồng hourly (mỗi hợp đồng 15 giờ/tuần) và một hợp đồng fixed-price có milestone đang funded 800 USD nhưng chưa xong. Bạn phải nhập viện (hoặc lo việc gia đình gấp) và không thể làm gì trong 2 tuần. Bạn sợ: khách nổi giận, để review xấu; milestone funded quá hạn review sẽ tự giải ngân cho phần chưa làm; hợp đồng hourly không log giờ thì không có tiền; và JSS của bạn bị ảnh hưởng vì " biến mất".`,
  signals: [
    'Sự kiện bất khả kháng (ốm, việc gia đình) buộc bạn nghỉ 2 tuần không báo trước.',
    'Đang có 3 hợp đồng mở, trong đó một milestone fixed-price đã funded nhưng chưa xong.',
    'Khách ở múi giờ khác, không quen việc bạn vắng mặt dài.',
    'Bạn lo mất khách, review xấu, và JSS giảm vì bị coi là biến mất.',
  ],
  steps: `1. **Thông báo sớm, trung thực, ngắn gọn cho từng khách trên Upwork Messages.** Không cần kể chi tiết y tế; chỉ nói bạn có việc khẩn cấp phải nghỉ khoảng 2 tuần, kèm ngày quay lại dự kiến. Gửi ngay khi có thể, đừng chờ đến sát hạn. Một tin nhắn sớm biến "biến mất" thành "có lý do rõ ràng".
2. **Với milestone fixed-price đang funded:** nếu chưa xong, đừng để hạn review tự chạy trong khi bạn vắng (tiền có thể tự giải ngân cho phần chưa làm, hoặc khách bấm yêu cầu sửa mà bạn không trả lời). Chủ động đề nghị gia hạn mốc review hoặc tạm dừng (mô tả cơ chế, kiểm tra trên Upwork Help), hoặc thoả thuận một mốc mới bằng văn bản. Nếu khách muốn, hoàn phần chưa làm qua escrow — đó là công bằng.
3. **Với hợp đồng hourly:** dừng log giờ ngay (không ghi giờ bạn không làm). Nếu khách đồng ý, có thể tạm dừng hợp đồng hoặc bàn giao một phần cho đồng nghiệp (chỉ khi khách đồng ý và có thoả thuận rõ ràng). Không để Work Diary trống một cách khó hiểu — nhắn trước rằng bạn sẽ tạm dừng.
4. **Đề xuất 3 phương án cho khách chọn:** (a) tạm dừng 2 tuần rồi tiếp tục; (b) bàn giao tạm cho một người khác (nếu có); (c) dời deadline. Đưa lựa chọn, đừng biến mất.
5. **Chuẩn bị "handover note" (tài liệu bàn giao) ngắn:** trạng thái hiện tại, việc còn lại, link repo, cách chạy, và các rủi ro đã biết. Tài liệu này giúp khách hoặc người thay thế tiếp tục mà không phụ thuộc bạn. Đây là điểm cộng lớn về chuyên nghiệp.
6. **Nếu khách phản ứng gay gắt:** giữ bình tĩnh, xin lỗi vì sự bất tiện, đưa mốc cụ thể và cam kết quay lại. Không hứa bừa "sẽ xong ngay" khi bạn đang không thể làm gì.
7. **Nếu khách đòi hoàn tiền milestone chưa làm:** đồng ý hoàn phần chưa làm (escrow bảo vệ khách), giữ phần đã làm và đã được duyệt. Đây là cách công bằng và giữ uy tín; tranh cãi khi bạn đang nghỉ chỉ làm tệ hơn.
8. **Sau khi quay lại:** gửi tin nhắn cập nhật, xin lỗi ngắn, cảm ơn khách đã kiên nhẫn, và tiếp tục đúng cam kết. Nếu có thể, bù một chút thiện chí nhỏ (không bắt buộc) để giữ quan hệ.
9. **Rút kinh nghiệm:** luôn có "bus factor" (số người có thể thay bạn — nên > 1), tài liệu bàn giao cập nhật, và quỹ dự phòng để chịu được giai đoạn không làm việc. Sức khoẻ và việc gia đình là ưu tiên; một hệ thống làm việc bền vững phải chịu được việc bạn vắng mặt.`,
  templates: [
    { name: 'Thông báo vắng mặt và ngày quay lại', text: 'Hi Mark, I need to let you know that I have a family medical emergency and will be unable to work for about two weeks. I am very sorry for the short notice and any disruption. I expect to be back on [date]. Your milestone is funded in escrow and safe. I will send a short handover note today so nothing is blocked, and I will resume as soon as I am back. Thank you for your understanding.' },
    { name: 'Handover note ngắn gọn', text: 'Hi Mark, here is a quick handover so nothing is stuck while I am away:\n- Current state: [what is done, what is in progress].\n- Remaining work: [list].\n- Repo and how to run: [link and steps].\n- Known risks: [list].\nIf you want, I can pause the contract and we can resume on [date], or we can agree on a new review date for the milestone. Please tell me which you prefer.' },
    { name: 'Cập nhật và cảm ơn khi quay lại', text: 'Hi Mark, thank you for your patience while I was away. I am back online as of today and will continue with [next step] immediately, on track for [date]. I have reviewed the handover notes and everything is in order. I really appreciate your understanding, and I will make sure the remaining work is delivered with the same quality. Please let me know if anything urgent came up in the meantime.' },
  ],
  mistakes: [
    'Im lặng biến mất 2 tuần: khách lo lắng, dễ để review xấu và mất niềm tin.',
    'Để milestone funded tự giải ngân cho phần chưa làm mà không nói gì: rủi ro tranh chấp.',
    'Vẫn log giờ hourly khi không làm: sai và không được bảo vệ.',
    'Hứa "sẽ xong ngay" khi đang không thể làm: mất uy tín khi không giữ lời.',
    'Không chuẩn bị handover note: khách và người thay thế bị kẹt.',
    'Tranh cãi đòi giữ tiền khi khách hoàn phần chưa làm: đẩy mâu thuẫn lên cao.',
  ],
  prevention: `- Luôn có "bus factor" > 1: ít nhất một người hoặc tài liệu đủ để người khác tiếp tục.
- Cập nhật handover note và trạng thái dự án thường xuyên, không đợi đến lúc khẩn.
- Có quỹ dự phòng (tài chính) đủ sống vài tuần không làm việc.
- Đưa "kế hoạch khi có sự cố cá nhân" vào quy trình làm việc: ai liên hệ, bàn giao thế nào.
- Sức khoẻ và gia đình là ưu tiên; một công việc freelance bền vững phải chịu được việc bạn vắng.

> Senior tip: Sự cố cá nhân là chuyện không ai muốn, nhưng cách bạn xử lý nó mới là thứ khách nhớ. Một tin nhắn sớm "tôi có việc khẩn, nghỉ 2 tuần, đây là handover" giữ được uy tín tốt hơn nhiều so với việc cố làm cho xong rồi giao trễ trong im lặng. Hãy xây hệ thống làm việc có bus factor > 1 và một tài liệu bàn giao luôn cập nhật — đó là dấu hiệu của một người làm việc chuyên nghiệp, không phải một người "không bao giờ vắng".`,
  related: ['remote-039', 'remote-041', 'uw-ch-08', 'uw-ch-05', 'uw-case-101'],
  tags: ['account', 'handover', 'reputation', 'JSS', 'emergency', 'bus-factor'],
},
);
