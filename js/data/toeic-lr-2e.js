// TOEIC L&R đề 2 — Part 7 (câu 147–200, 54 câu).
// 10 đoạn đơn (147–175, 29 câu), 2 đoạn kép (176–185, 5 câu/đoạn), 3 đoạn ba (186–200, 5 câu/đoạn).
// ≥2 câu insert-sentence (150, 159); ≥2 đoạn text message/online chat có câu "what does X mean" (162, 165);
// ≥4 câu cross-reference (178, 180, 184, 187, 189, 192, 194, 198, 199).
// Nội dung tự viết, bám format ETS mới (2024–2026), không chép từ sách ETS / đề thi thật; không trùng đề 1.
// Đáp án rải đều: A 14, B 15, C 12, D 13.
(window.TOEIC_LR = window.TOEIC_LR || []).push(
  // ======================= ĐOẠN ĐƠN — câu 147–175 =======================
  // ---- UNIT 01 (email) — câu 147–149 ----
  {
    id: 'lr2-p7-01', test: 2, part: 7,
    passages: [
      { kind: 'email', title: 'Quarterly All-Hands Meeting', text: `Subject: Quarterly All-Hands Meeting

Dear Colleagues,

The next quarterly all-hands meeting will be held on Thursday, October 10, at 2:00 p.m. in the main auditorium. This quarter the agenda will focus on the company's expansion into the European market and a review of our sustainability goals.

Because the auditorium seats only two hundred people, employees in other offices may join the live stream on the company intranet. A recording will be posted the following morning for anyone who cannot attend.

Please submit questions for the leadership team through the anonymous online form by October 8. We will answer as many as time allows.

Best regards,
Office of the CEO` },
    ],
    questions: [
      { n: 147, q: "What is the main purpose of the email?", type: 'main-idea', answer: 1,
        options: ["To announce a new product launch", "To announce an all-hands meeting and its agenda", "To report the results of the European expansion", "To ask employees to attend a training session"],
        explain: `Đáp án đúng (B): cả email xoay quanh "The next quarterly all-hands meeting will be held..." và "the agenda will focus on...", tức thông báo cuộc họp toàn công ty và nội dung. (A) không có sản phẩm mới (bẫy suy diễn). (C) chưa có kết quả mở rộng, đó chỉ là chủ đề sẽ thảo luận (bẫy suy diễn). (D) không phải buổi đào tạo (bẫy bịa).` },
      { n: 148, q: "How can employees in other offices take part in the meeting?", type: 'detail', answer: 3,
        options: ["By calling the auditorium", "By traveling to the main office", "By watching a recording the next day", "By joining the live stream on the intranet"],
        explain: `Đáp án đúng (D): câu "employees in other offices may join the live stream on the company intranet" nói rõ cách tham gia là xem trực tiếp trên intranet. (A) không gọi điện (bẫy bịa). (B) không cần đến trụ sở (bẫy suy diễn). (C) bản ghi là dành cho người "cannot attend", không phải cách tham gia trực tiếp (bẫy nhầm chi tiết).` },
      { n: 149, q: "By what date should employees submit questions?", type: 'detail', answer: 0,
        options: ["By October 8", "By October 10", "By the morning after the meeting", "By the end of the quarter"],
        explain: `Đáp án đúng (A): câu "submit questions ... by October 8" nêu hạn nộp câu hỏi là 8 tháng 10. (B) 10 tháng 10 là ngày họp (bẫy nhầm mốc). (C) sáng sau họp là lúc đăng bản ghi (bẫy nhầm chi tiết). (D) không được nêu (bẫy bịa).` },
    ],
    vi: `Gửi các đồng nghiệp, cuộc họp toàn công ty hằng quý sắp tới sẽ diễn ra vào thứ Năm, ngày 10 tháng 10, lúc 2 giờ chiều tại hội trường chính. Nội dung quý này tập trung vào việc mở rộng công ty sang thị trường châu Âu và rà soát các mục tiêu phát triển bền vững. Vì hội trường chỉ chứa hai trăm người, nhân viên ở các văn phòng khác có thể xem trực tiếp trên intranet của công ty. Bản ghi sẽ được đăng vào sáng hôm sau cho những ai không dự được. Vui lòng gửi câu hỏi cho ban lãnh đạo qua biểu mẫu trực tuyến ẩn danh trước ngày 8 tháng 10.`,
    vocab: ['all-hands meeting – họp toàn công ty', 'agenda – chương trình nghị sự', 'auditorium – hội trường', 'live stream – phát trực tiếp']
  },

  // ---- UNIT 02 (article, insert-sentence 150) — câu 150–152 ----
  {
    id: 'lr2-p7-02', test: 2, part: 7,
    passages: [
      { kind: 'article', title: 'City Library Cuts Energy Costs with New Lighting', text: `The Riverside City Library recently completed a project to replace every fluorescent light in the building with LED bulbs. [1] The change was funded by a municipal energy-efficiency grant and took three months to finish.

Library staff say the new lighting has made the reading areas noticeably brighter. [2] The bulbs also produce far less heat, so the air-conditioning system runs less often in summer.

According to the facilities manager, the library's electricity bill has fallen by about thirty percent since the work began. [3] The old fixtures will be recycled through a local program.

[4] The library plans to install solar panels on the roof next year.` },
    ],
    questions: [
      { n: 150, q: "In which position marked [1]-[4] should this sentence be inserted? 'The new bulbs are expected to last for at least fifteen years.'", type: 'insert-sentence', answer: 3,
        options: ["[1]", "[2]", "[3]", "[4]"],
        explain: `Đáp án đúng (D, vị trí [4]): câu chèn nói bóng mới dùng được ít nhất mười lăm năm, nối tiếp tự nhiên sau "The old fixtures will be recycled" (bóng cũ được tái chế) và trước "plans to install solar panels" (kế hoạch tương lai). (A) [1] đứng trước nguồn kinh phí, lạc mạch. (B) [2] ở đoạn nói độ sáng và nhiệt, chưa hợp. (C) [3] ngay trước "old fixtures recycled", chưa dứt mạch (bẫy vị trí).` },
      { n: 151, q: "What paid for the lighting project?", type: 'detail', answer: 1,
        options: ["A donation from local residents", "A municipal energy-efficiency grant", "A federal tax increase", "Money from the library budget"],
        explain: `Đáp án đúng (B): câu "funded by a municipal energy-efficiency grant" nói dự án do quỹ tiết kiệm năng lượng của thành phố tài trợ. (A) không có quyên góp của dân (bẫy bịa). (C) không tăng thuế (bẫy bịa). (D) không lấy từ ngân sách thư viện (bẫy suy diễn).` },
      { n: 152, q: "By about how much has the electricity bill fallen?", type: 'detail', answer: 2,
        options: ["By about five percent", "By about fifteen percent", "By about thirty percent", "By about sixty percent"],
        explain: `Đáp án đúng (C): câu "the library's electricity bill has fallen by about thirty percent" nêu hóa đơn điện giảm khoảng ba mươi phần trăm. (A), (B), (D) đều sai số liệu (bẫy số liệu).` },
    ],
    vi: `Thư viện Thành phố Riverside vừa hoàn thành dự án thay toàn bộ đèn huỳnh quang trong tòa nhà bằng bóng LED. Thay đổi này được tài trợ bởi một quỹ tiết kiệm năng lượng của thành phố và mất ba tháng để hoàn thành. Nhân viên thư viện cho biết ánh sáng mới làm khu đọc sáng hơn rõ rệt. Bóng cũng tỏa ít nhiệt hơn nhiều, nên hệ thống điều hòa chạy ít hơn vào mùa hè. Theo quản lý cơ sở, hóa đơn điện của thư viện đã giảm khoảng ba mươi phần trăm kể từ khi bắt đầu. Các đèn cũ sẽ được tái chế qua một chương trình địa phương. Thư viện dự định lắp tấm pin mặt trời trên mái vào năm sau.`,
    vocab: ['fluorescent – huỳnh quang', 'LED bulb – bóng LED', 'grant – quỹ tài trợ', 'fixtures – thiết bị đèn']
  },

  // ---- UNIT 03 (notice) — câu 153–155 ----
  {
    id: 'lr2-p7-03', test: 2, part: 7,
    passages: [
      { kind: 'notice', title: 'Scheduled Network Upgrade', text: `Please be aware that the company network will be upgraded on Sunday, November 3, between midnight and 6:00 a.m. During this window, internet access and shared drives will be unavailable in all buildings.

The upgrade will improve wireless coverage on the fourth and fifth floors, where connections have been unreliable. Employees who work overnight should save their files locally before the shutdown begins.

If you notice any problems after 6:00 a.m. on Monday, please contact the IT help desk at extension 4500. Do not attempt to restart the network equipment yourself.

Thank you for your cooperation.
IT Services` },
    ],
    questions: [
      { n: 153, q: "When will the network upgrade take place?", type: 'detail', answer: 0,
        options: ["Sunday, November 3, from midnight to 6:00 a.m.", "Monday, November 4, during the day", "Saturday, November 2, in the afternoon", "Friday, November 1, after midnight"],
        explain: `Đáp án đúng (A): câu "upgraded on Sunday, November 3, between midnight and 6:00 a.m." chỉ rõ thời gian nâng cấp. (B) thứ Hai là ngày kiểm tra sự cố, (C) thứ Bảy, (D) thứ Sáu đều sai (bẫy nhầm mốc).` },
      { n: 154, q: "Which floors will have better wireless coverage?", type: 'detail', answer: 2,
        options: ["The first and second floors", "The second and third floors", "The fourth and fifth floors", "The basement and ground floor"],
        explain: `Đáp án đúng (C): câu "improve wireless coverage on the fourth and fifth floors" nêu rõ tầng bốn và tầng năm. (A), (B), (D) đều sai tầng (bẫy chi tiết sai).` },
      { n: 155, q: "What should overnight employees do before the shutdown?", type: 'detail', answer: 1,
        options: ["Restart the network equipment", "Save their files locally", "Work from another building", "Contact the help desk in advance"],
        explain: `Đáp án đúng (B): câu "Employees who work overnight should save their files locally before the shutdown begins" khuyên lưu tệp cục bộ. (A) bị cấm ("Do not attempt to restart") (bẫy trái nghĩa). (C) không nhắc chuyển tòa nhà (bẫy bịa). (D) chỉ liên hệ nếu có sự cố sau 6 giờ (bẫy nhầm chi tiết).` },
    ],
    vi: `Xin lưu ý rằng mạng công ty sẽ được nâng cấp vào Chủ nhật, ngày 3 tháng 11, từ nửa đêm đến 6 giờ sáng. Trong thời gian này, truy cập internet và ổ đĩa chia sẻ sẽ không dùng được ở tất cả các tòa nhà. Nâng cấp sẽ cải thiện sóng không dây ở tầng bốn và tầng năm, nơi kết nối trước đây không ổn định. Nhân viên làm việc qua đêm nên lưu tệp cục bộ trước khi ngừng dịch vụ. Nếu thấy sự cố sau 6 giờ sáng thứ Hai, vui lòng liên hệ bộ phận hỗ trợ CNTT theo số nội bộ 4500. Không tự ý khởi động lại thiết bị mạng.`,
    vocab: ['upgrade – nâng cấp', 'coverage – vùng phủ sóng', 'shutdown – ngừng dịch vụ', 'help desk – bộ phận hỗ trợ']
  },

  // ---- UNIT 04 (advertisement) — câu 156–158 ----
  {
    id: 'lr2-p7-04', test: 2, part: 7,
    passages: [
      { kind: 'advertisement', title: 'Westbridge Language Institute — Evening Classes', text: `Looking to improve your English for work? Westbridge Language Institute is now enrolling for its evening business English courses, held every Tuesday and Thursday from 6:30 to 8:30 p.m.

Classes are taught by experienced instructors and are limited to twelve students to ensure plenty of speaking practice. The twelve-week program ends with a certificate of completion.

New students can attend a free trial lesson on September 9. To register, visit our website or call the front desk. Early registration before August 25 earns a ten percent discount on tuition.

We look forward to helping you reach your goals.` },
    ],
    questions: [
      { n: 156, q: "What is the main purpose of the advertisement?", type: 'main-idea', answer: 3,
        options: ["To hire new English instructors", "To announce a new campus location", "To promote a summer camp for children", "To attract students to evening English courses"],
        explain: `Đáp án đúng (D): toàn bài quảng cáo "evening business English courses" và mời "now enrolling", mục đích là thu hút học viên. (A) không tuyển giáo viên (bẫy bịa). (B) không đổi địa điểm (bẫy bịa). (C) không phải trại hè trẻ em (bẫy suy diễn).` },
      { n: 157, q: "How many students are allowed in each class?", type: 'detail', answer: 1,
        options: ["Six", "Twelve", "Twenty", "Thirty"],
        explain: `Đáp án đúng (B): câu "limited to twelve students" nói mỗi lớp tối đa mười hai học viên. (A), (C), (D) đều sai số (bẫy số liệu).` },
      { n: 158, q: "What does early registration before August 25 earn?", type: 'detail', answer: 3,
        options: ["A free trial lesson", "A free certificate", "A one-week extension", "A ten percent discount on tuition"],
        explain: `Đáp án đúng (D): câu "Early registration before August 25 earns a ten percent discount on tuition" nói đăng ký sớm được giảm mười phần trăm học phí. (A) buổi học thử miễn phí là ưu đãi khác (bẫy nhầm chi tiết). (B) chứng chỉ không miễn phí (bẫy bịa). (C) không gia hạn (bẫy bịa).` },
    ],
    vi: `Bạn muốn cải thiện tiếng Anh cho công việc? Viện Ngôn ngữ Westbridge hiện đang tuyển sinh cho các khóa tiếng Anh thương mại buổi tối, học vào thứ Ba và thứ Năm hằng tuần từ 6 rưỡi đến 8 rưỡi tối. Lớp do giảng viên giàu kinh nghiệm dạy và giới hạn mười hai học viên để đảm bảo nhiều cơ hội luyện nói. Chương trình mười hai tuần kết thúc bằng chứng chỉ hoàn thành. Học viên mới có thể dự buổi học thử miễn phí ngày 9 tháng 9. Để đăng ký, hãy truy cập trang web hoặc gọi quầy lễ tân. Đăng ký sớm trước ngày 25 tháng 8 được giảm mười phần trăm học phí.`,
    vocab: ['enrolling – tuyển sinh', 'tuition – học phí', 'trial lesson – buổi học thử', 'certificate – chứng chỉ']
  },

  // ---- UNIT 05 (memo, insert-sentence 159) — câu 159–161 ----
  {
    id: 'lr2-p7-05', test: 2, part: 7,
    passages: [
      { kind: 'memo', title: 'Travel Expense Policy Update', text: `To: All Staff
From: Finance Department
Subject: Travel Expense Policy

Beginning January 1, the company will update its travel expense policy to simplify reimbursement. [1] Employees will no longer need to submit paper receipts for meals under twenty-five dollars.

Instead, a photo of the receipt uploaded through the mobile app is now sufficient. [2] This change should shorten the reimbursement process from two weeks to five business days.

[3] All other rules, including the requirement to book economy-class flights, remain unchanged.

[4]` },
    ],
    questions: [
      { n: 159, q: "In which position marked [1]-[4] should this sentence be inserted? 'These changes are intended to reduce the time employees wait for repayment.'", type: 'insert-sentence', answer: 0,
        options: ["[1]", "[2]", "[3]", "[4]"],
        explain: `Đáp án đúng (A, vị trí [1]): câu chèn nói các thay đổi nhằm giảm thời gian chờ hoàn tiền, làm câu dẫn dắt hợp lý ngay sau "to simplify reimbursement" và trước chi tiết "no longer need to submit paper receipts". (B) [2] đã vào chi tiết app, lạc. (C) [3] ở đoạn "other rules unchanged", trái mạch. (D) [4] cuối cùng, không còn gì để dẫn (bẫy vị trí).` },
      { n: 160, q: "What is now enough for meals under twenty-five dollars?", type: 'detail', answer: 2,
        options: ["A paper receipt", "A manager's signature", "A photo of the receipt in the app", "A credit card statement"],
        explain: `Đáp án đúng (C): câu "a photo of the receipt uploaded through the mobile app is now sufficient" nói chỉ cần ảnh hóa đơn tải qua app. (A) giấy đã bỏ (bẫy trái nghĩa). (B) không cần chữ ký (bẫy bịa). (D) không dùng sao kê thẻ (bẫy bịa).` },
      { n: 161, q: "How long will reimbursement take after the change?", type: 'detail', answer: 1,
        options: ["Two weeks", "Five business days", "One business day", "Thirty days"],
        explain: `Đáp án đúng (B): câu "shorten the reimbursement process from two weeks to five business days" nói rút xuống còn năm ngày làm việc. (A) hai tuần là thời gian cũ (bẫy nhầm mốc). (C), (D) sai số (bẫy số liệu).` },
    ],
    vi: `Gửi toàn thể nhân viên, từ phòng Tài chính. Bắt đầu ngày 1 tháng 1, công ty sẽ cập nhật chính sách hoàn tiền công tác để đơn giản hóa việc thanh toán. Nhân viên sẽ không còn phải nộp hóa đơn giấy cho các bữa ăn dưới hai mươi lăm đô. Thay vào đó, ảnh chụp hóa đơn tải qua ứng dụng di động là đủ. Thay đổi này sẽ rút ngắn quy trình hoàn tiền từ hai tuần xuống còn năm ngày làm việc. Mọi quy tắc khác, gồm yêu cầu đặt vé máy bay hạng phổ thông, vẫn giữ nguyên.`,
    vocab: ['reimbursement – hoàn tiền', 'receipt – hóa đơn/biên nhận', 'policy – chính sách', 'economy-class – hạng phổ thông']
  },

  // ---- UNIT 06 (text message chain, implied 162) — câu 162–163 ----
  {
    id: 'lr2-p7-06', test: 2, part: 7,
    passages: [
      { kind: 'text message chain', title: 'Text Messages', text: `Woman: Hi, they moved our team to the fifth floor.
Man: Already? I thought that was next month.
Woman: The movers came early. My new desk is right by the window.
Man: Nice. Is the network working up there yet?
Woman: Not yet. IT says it will be ready by noon.` },
    ],
    questions: [
      { n: 162, q: "What does the woman mean when she says, 'The movers came early'?", type: 'implied', answer: 1,
        options: ["The movers arrived late in the morning", "The move happened sooner than expected", "The movers broke some furniture", "The team refused to move"],
        explain: `Đáp án đúng (B): "The movers came early" (nhóm chuyển đồ đến sớm) so với "I thought that was next month" cho thấy việc chuyển diễn ra sớm hơn dự kiến. (A) "late" ngược nghĩa (bẫy trái nghĩa). (C) không ai làm hỏng đồ (bẫy bịa). (D) không ai từ chối (bẫy bịa).` },
      { n: 163, q: "When will the network be ready?", type: 'detail', answer: 2,
        options: ["It is already working", "Tomorrow morning", "By noon", "Next month"],
        explain: `Đáp án đúng (C): câu "IT says it will be ready by noon" nói mạng sẽ sẵn sàng trước trưa. (A) mâu thuẫn "Not yet" (bẫy trái nghĩa). (B), (D) sai thời điểm (bẫy chi tiết sai).` },
    ],
    vi: `Nữ: Chào, họ chuyển nhóm mình lên tầng năm rồi. Nam: Xong rồi à? Tưởng sang tháng sau. Nữ: Nhóm chuyển đồ đến sớm. Bàn mới của mình ngay cạnh cửa sổ. Nam: Tốt. Mạng trên đó chạy chưa? Nữ: Chưa. CNTT nói sẽ xong trước trưa.`,
    vocab: ['movers – nhóm chuyển đồ', 'by noon – trước trưa', 'network – mạng', 'floor – tầng']
  },

  // ---- UNIT 07 (online chat, implied 165) — câu 164–166 ----
  {
    id: 'lr2-p7-07', test: 2, part: 7,
    passages: [
      { kind: 'online chat', title: 'Online Chat — Subscription Support', text: `Agent: Thank you for chatting with us. How may I help you today?
Customer: My annual subscription to the design software expires today. Can I renew at the same price?
Agent: Let me check your account. Yes, you can renew at the current rate for one more year.
Customer: Great. And will I keep my saved projects?
Agent: Absolutely. All your files stay in your account after renewal.
Customer: Perfect, please go ahead and renew it.` },
    ],
    questions: [
      { n: 164, q: "What does the customer want to do?", type: 'detail', answer: 0,
        options: ["Renew a subscription at the same price", "Cancel an annual subscription", "Upgrade to a more expensive plan", "Download a free trial"],
        explain: `Đáp án đúng (A): câu "Can I renew at the same price?" cho thấy khách muốn gia hạn với giá cũ. (B) không hủy (bẫy trái nghĩa). (C) không nâng cấp (bẫy bịa). (D) không dùng bản thử (bẫy bịa).` },
      { n: 165, q: "What does the agent mean when he says, 'All your files stay in your account after renewal'?", type: 'implied', answer: 2,
        options: ["The customer must back up the files first", "The files will be deleted at midnight", "The customer will not lose any saved projects", "The account will be closed"],
        explain: `Đáp án đúng (C): "All your files stay in your account" nghĩa là mọi tệp vẫn còn, khách không mất dự án đã lưu. (A) không cần sao lưu trước (bẫy suy diễn). (B) "deleted" ngược nghĩa (bẫy trái nghĩa). (D) không đóng tài khoản (bẫy bịa).` },
      { n: 166, q: "For how long can the customer renew?", type: 'detail', answer: 1,
        options: ["For six months", "For one more year", "For two years", "For one month"],
        explain: `Đáp án đúng (B): câu "renew at the current rate for one more year" nói gia hạn thêm một năm. (A), (C), (D) sai thời hạn (bẫy số liệu).` },
    ],
    vi: `Nhân viên: Cảm ơn bạn đã trò chuyện. Tôi giúp gì được hôm nay? Khách: Gói thuê bao năm của phần mềm thiết kế hết hạn hôm nay. Tôi gia hạn cùng giá được không? Nhân viên: Để tôi kiểm tra tài khoản. Vâng, bạn có thể gia hạn mức giá hiện tại thêm một năm. Khách: Tuyệt. Vậy tôi có giữ được các dự án đã lưu không? Nhân viên: Hoàn toàn. Mọi tệp của bạn vẫn ở trong tài khoản sau khi gia hạn. Khách: Hoàn hảo, vui lòng gia hạn giúp tôi.`,
    vocab: ['subscription – thuê bao', 'renew – gia hạn', 'account – tài khoản', 'rate – mức giá']
  },

  // ---- UNIT 08 (letter) — câu 167–169 ----
  {
    id: 'lr2-p7-08', test: 2, part: 7,
    passages: [
      { kind: 'letter', title: 'Annual Health Insurance Enrollment', text: `Dear Employee,

This is a reminder that the annual enrollment period for company health insurance begins on November 1 and ends on November 30. During this time, you may add or remove dependents, or switch to a different plan.

This year the company is offering a new plan with a lower monthly premium and a wider network of doctors. Full details of each plan are available on the company intranet.

If you do not submit a change by November 30, your current coverage will be renewed automatically for another year.

Sincerely,
Human Resources Department` },
    ],
    questions: [
      { n: 167, q: "When is the enrollment period?", type: 'detail', answer: 0,
        options: ["From November 1 to November 30", "From October 1 to October 31", "Throughout December", "Only on November 1"],
        explain: `Đáp án đúng (A): câu "begins on November 1 and ends on November 30" nêu rõ thời gian ghi danh. (B) tháng 10, (C) tháng 12, (D) chỉ một ngày đều sai (bẫy nhầm mốc).` },
      { n: 168, q: "What happens if an employee submits no change by November 30?", type: 'detail', answer: 3,
        options: ["The coverage is cancelled", "The employee must reapply in person", "A new plan is chosen for them", "The current coverage is renewed automatically"],
        explain: `Đáp án đúng (D): câu "your current coverage will be renewed automatically for another year" nói gói hiện tại tự động gia hạn. (A) không bị hủy (bẫy trái nghĩa). (B) không phải nộp lại trực tiếp (bẫy bịa). (C) không ai chọn thay (bẫy bịa).` },
      { n: 169, q: "What is new about the plan offered this year?", type: 'detail', answer: 1,
        options: ["It covers dental care only", "It has a lower premium and a wider doctor network", "It is free for all employees", "It requires a higher monthly payment"],
        explain: `Đáp án đúng (B): câu "a new plan with a lower monthly premium and a wider network of doctors" nêu điểm mới là phí thấp hơn và mạng lưới bác sĩ rộng hơn. (A) không chỉ nha khoa (bẫy bịa). (C) không miễn phí (bẫy suy diễn). (D) "higher" ngược với "lower" (bẫy trái nghĩa).` },
    ],
    vi: `Kính gửi nhân viên, đây là lời nhắc rằng thời gian ghi danh bảo hiểm sức khỏe công ty hằng năm bắt đầu ngày 1 tháng 11 và kết thúc ngày 30 tháng 11. Trong thời gian này, bạn có thể thêm hoặc bớt người phụ thuộc, hoặc chuyển sang gói khác. Năm nay công ty cung cấp một gói mới với phí hằng tháng thấp hơn và mạng lưới bác sĩ rộng hơn. Thông tin chi tiết từng gói có trên intranet công ty. Nếu không nộp thay đổi trước ngày 30 tháng 11, gói hiện tại của bạn sẽ tự động gia hạn thêm một năm. Trân trọng, Phòng Nhân sự.`,
    vocab: ['enrollment – ghi danh', 'premium – phí bảo hiểm', 'dependents – người phụ thuộc', 'coverage – phạm vi bảo hiểm']
  },

  // ---- UNIT 09 (review) — câu 170–172 ----
  {
    id: 'lr2-p7-09', test: 2, part: 7,
    passages: [
      { kind: 'review', title: 'Customer Review — Seaview Hotel', text: `I stayed at the Seaview Hotel for three nights during a business conference last month. The location was excellent, just a short walk from the convention center, and the front-desk staff were friendly and helpful.

The room itself was clean and quiet, but the walls are thin, so I could hear conversations in the hallway. The breakfast buffet offered a good selection, though it ended at 9:00 a.m., which was a little early for me.

Overall, I would gladly stay here again for the convenient location, but I would not recommend it to light sleepers.` },
    ],
    questions: [
      { n: 170, q: "What did the reviewer like most about the hotel?", type: 'detail', answer: 0,
        options: ["Its convenient location near the convention center", "The large size of the room", "The late breakfast hours", "The soundproof walls"],
        explain: `Đáp án đúng (A): câu "The location was excellent, just a short walk from the convention center" cho thấy điểm thích nhất là vị trí thuận tiện. (B) không khen phòng rộng (bẫy bịa). (C) bữa sáng sớm bị chê (bẫy trái nghĩa). (D) tường mỏng bị chê (bẫy trái nghĩa).` },
      { n: 171, q: "What is one complaint in the review?", type: 'detail', answer: 2,
        options: ["The staff were unfriendly", "The room was dirty", "The walls are thin, so hallway noise is heard", "The breakfast had too few choices"],
        explain: `Đáp án đúng (C): câu "the walls are thin, so I could hear conversations in the hallway" nêu than phiền tường mỏng, nghe tiếng hành lang. (A) nhân viên được khen "friendly" (bẫy trái nghĩa). (B) phòng "clean" (bẫy trái nghĩa). (D) bữa sáng "a good selection" (bẫy trái nghĩa).` },
      { n: 172, q: "For whom would the reviewer NOT recommend the hotel?", type: 'inference', answer: 1,
        options: ["Business travelers attending a conference", "Light sleepers", "Guests who want a central location", "Visitors who like a good breakfast"],
        explain: `Đáp án đúng (B): câu "I would not recommend it to light sleepers" nói không nên giới thiệu cho người ngủ khó. (A) chính là người đánh giá (bẫy suy diễn). (C) vị trí trung tâm được khen (bẫy trái nghĩa). (D) bữa sáng được khen (bẫy trái nghĩa).` },
    ],
    vi: `Tôi ở Seaview Hotel ba đêm trong một hội thảo công tác tháng trước. Vị trí rất tuyệt, chỉ đi bộ một đoạn ngắn tới trung tâm hội nghị, và nhân viên quầy lễ tân thân thiện, nhiệt tình. Bản thân căn phòng sạch sẽ và yên tĩnh, nhưng tường mỏng nên tôi nghe được các cuộc trò chuyện ngoài hành lang. Đồ ăn buffet sáng có nhiều lựa chọn, dù kết thúc lúc 9 giờ, hơi sớm với tôi. Nhìn chung, tôi sẵn sàng quay lại vì vị trí thuận tiện, nhưng sẽ không giới thiệu cho người ngủ khó.`,
    vocab: ['buffet – tiệc tự chọn', 'selection – sự lựa chọn', 'convention center – trung tâm hội nghị', 'light sleeper – người ngủ khó']
  },

  // ---- UNIT 10 (invoice) — câu 173–175 ----
  {
    id: 'lr2-p7-10', test: 2, part: 7,
    passages: [
      { kind: 'invoice', title: 'Invoice — Bright Office Cleaning', text: `Invoice Number: BC-7712
Date: August 14
Bill To: Summit Accounting, 77 River Road

Description: Monthly office cleaning service (4 visits) — 320 dollars
Carpet shampooing (1 room) — 90 dollars
Total due — 410 dollars

Payment is due within fourteen days of the invoice date. Please make checks payable to Bright Office Cleaning. A discount of five percent applies if payment is received within seven days.` },
    ],
    questions: [
      { n: 173, q: "What is the total amount due?", type: 'detail', answer: 3,
        options: ["320 dollars", "90 dollars", "230 dollars", "410 dollars"],
        explain: `Đáp án đúng (D): dòng "Total due — 410 dollars" cho tổng phải trả là 410 đô (320 + 90). (A) chỉ tiền dọn, (B) chỉ tiền giặt thảm, (C) là số trừ sai (bẫy số liệu).` },
      { n: 174, q: "Within how many days must payment be made?", type: 'detail', answer: 0,
        options: ["Fourteen days", "Seven days", "Thirty days", "Sixty days"],
        explain: `Đáp án đúng (A): câu "Payment is due within fourteen days" nêu hạn thanh toán mười bốn ngày. (B) bảy ngày là mốc để được giảm giá, không phải hạn (bẫy nhầm mốc). (C), (D) sai số (bẫy số liệu).` },
      { n: 175, q: "What discount is offered for early payment?", type: 'detail', answer: 2,
        options: ["Two percent", "Ten percent", "Five percent", "Fifteen percent"],
        explain: `Đáp án đúng (C): câu "A discount of five percent applies if payment is received within seven days" nêu giảm năm phần trăm nếu trả trong bảy ngày. (A), (B), (D) sai số (bẫy số liệu).` },
    ],
    vi: `Số hóa đơn: BC-7712. Ngày: 14 tháng 8. Gửi tới: Summit Accounting, 77 River Road. Mô tả: Dịch vụ dọn văn phòng hằng tháng (4 lần) — 320 đô. Giặt thảm (1 phòng) — 90 đô. Tổng phải trả — 410 đô. Thanh toán trong vòng mười bốn ngày kể từ ngày hóa đơn. Vui lòng viết séc cho Bright Office Cleaning. Giảm năm phần trăm nếu thanh toán được nhận trong vòng bảy ngày.`,
    vocab: ['invoice – hóa đơn', 'total due – tổng phải trả', 'payable – thanh toán cho', 'discount – giảm giá']
  },

  // ======================= ĐOẠN KÉP — câu 176–185 =======================
  // ---- UNIT 11 (email + schedule) — câu 176–180 ----
  {
    id: 'lr2-p7-11', test: 2, part: 7,
    passages: [
      { kind: 'email', title: 'New Meeting Room Booking System', text: `From: Office Operations
To: All Staff
Subject: New Meeting Room Booking System

Starting next Monday, all meeting rooms must be reserved through the new online booking system. Walk-in use is no longer allowed because several rooms were double-booked last month.

Each reservation may last up to two hours. If you need a room for a longer meeting, please book two consecutive slots. Rooms that are not claimed within ten minutes of the start time will be released to other employees.` },
      { kind: 'schedule', title: 'Meeting Room Guidelines', text: `All rooms include a projector and video-conference equipment.
Catering must be ordered at least one day in advance.
The large conference room (capacity 30) requires approval from a department head.
Small rooms (capacity 6) may be booked by any employee.` },
    ],
    questions: [
      { n: 176, q: "Why is the new booking system being introduced?", type: 'detail', answer: 3,
        options: ["The old system was too expensive", "Employees requested smaller rooms", "The rooms are being renovated", "Several rooms were double-booked last month"],
        explain: `Đáp án đúng (D): câu "because several rooms were double-booked last month" nêu lý do. (A) không nhắc chi phí (bẫy bịa). (B) không ai xin phòng nhỏ (bẫy bịa). (C) không cải tạo (bẫy bịa).` },
      { n: 177, q: "How long may a single reservation last?", type: 'detail', answer: 1,
        options: ["Thirty minutes", "Up to two hours", "Up to four hours", "The whole day"],
        explain: `Đáp án đúng (B): câu "Each reservation may last up to two hours" nói mỗi lần đặt tối đa hai giờ. (A), (C), (D) sai thời lượng (bẫy số liệu).` },
      { n: 178, q: "What must an employee do to use the large conference room?", type: 'cross-reference', answer: 0,
        options: ["Reserve it online and get a department head's approval", "Only arrive early and use it as a walk-in", "Pay a daily fee at the front desk", "Book two consecutive small rooms instead"],
        explain: `Đáp án đúng (A): email yêu cầu "must be reserved through the new online booking system", còn bảng hướng dẫn ghi "The large conference room (capacity 30) requires approval from a department head" — phải ghép hai đoạn. (B) đã bỏ walk-in (bẫy trái nghĩa). (C) không thu phí (bẫy bịa). (D) không thay bằng phòng nhỏ (bẫy bịa).` },
      { n: 179, q: "What happens if a room is not claimed within ten minutes?", type: 'detail', answer: 2,
        options: ["The reservation is cancelled and a fee is charged", "The room is held for the whole day", "It is released to other employees", "The booking system crashes"],
        explain: `Đáp án đúng (C): câu "Rooms that are not claimed within ten minutes ... will be released to other employees" nói phòng được nhả cho người khác. (A) không thu phí (bẫy bịa). (B) không giữ cả ngày (bẫy bịa). (D) không nói hệ thống lỗi (bẫy bịa).` },
      { n: 180, q: "Based on both passages, what is required for a meeting that includes lunch?", type: 'cross-reference', answer: 1,
        options: ["Only a walk-in reservation on the same day", "An online booking and catering ordered a day ahead", "A department head's approval for food", "A payment to the projector vendor"],
        explain: `Đáp án đúng (B): email bắt buộc đặt phòng trực tuyến, bảng hướng dẫn ghi "Catering must be ordered at least one day in advance" — ghép hai ý. (A) walk-in đã bị cấm (bẫy trái nghĩa). (C) phê duyệt chỉ áp dụng cho phòng lớn, không cho đồ ăn (bẫy nhầm). (D) không trả tiền cho nhà cung cấp máy chiếu (bẫy bịa).` },
    ],
    vi: `Email: Bắt đầu thứ Hai tới, mọi phòng họp phải được đặt qua hệ thống đặt chỗ trực tuyến mới. Không còn dùng kiểu đến trực tiếp vì tháng trước nhiều phòng bị đặt trùng. Mỗi lần đặt tối đa hai giờ. Nếu cần họp lâu hơn, hãy đặt hai khung liền nhau. Phòng không được nhận trong vòng mười phút sau giờ bắt đầu sẽ được nhả cho nhân viên khác. Hướng dẫn: Mọi phòng có máy chiếu và thiết bị hội nghị truyền hình. Đồ ăn phải đặt trước ít nhất một ngày. Phòng họp lớn (sức chứa 30) cần trưởng phòng phê duyệt. Phòng nhỏ (sức chứa 6) nhân viên nào cũng đặt được.`,
    vocab: ['double-booked – đặt trùng', 'reservation – đặt chỗ', 'capacity – sức chứa', 'catering – dịch vụ ăn uống']
  },

  // ---- UNIT 12 (memo + advertisement) — câu 181–185 ----
  {
    id: 'lr2-p7-12', test: 2, part: 7,
    passages: [
      { kind: 'memo', title: 'New Cleaning Contract', text: `To: Building Committee
From: Facilities Manager
Subject: New Cleaning Contract

After reviewing four bids, we have selected SparkleClean to provide nightly cleaning for our office building. The company offered the most competitive price and agreed to a three-year contract with no mid-term increase.

SparkleClean will begin service on the first of next month. The current provider has been notified and will finish the final week.

Committee members with questions may contact the facilities office before Friday.` },
      { kind: 'advertisement', title: 'SparkleClean — Professional Office Cleaning', text: `SparkleClean has served local businesses for over fifteen years. Our trained staff use environmentally friendly products, and all supervisors are background-checked. We offer flexible nightly or weekend service, and every contract is backed by a satisfaction guarantee. Call today for a free on-site estimate.` },
    ],
    questions: [
      { n: 181, q: "Why was SparkleClean selected?", type: 'detail', answer: 0,
        options: ["It offered the lowest price and a three-year deal with no increase", "It is located in the same building", "It promised to clean the carpets for free", "It has the most employees"],
        explain: `Đáp án đúng (A): memo nêu "the most competitive price and agreed to a three-year contract with no mid-term increase". (B) không nhắc vị trí (bẫy bịa). (C) không giặt thảm miễn phí (bẫy bịa). (D) không nói số nhân viên (bẫy bịa).` },
      { n: 182, q: "When will SparkleClean begin service?", type: 'detail', answer: 2,
        options: ["Next Monday", "This Friday", "On the first of next month", "In three years"],
        explain: `Đáp án đúng (C): câu "will begin service on the first of next month" nói bắt đầu vào mùng một tháng sau. (A) thứ Hai, (B) thứ Sáu (là hạn liên hệ), (D) ba năm là thời hạn hợp đồng (bẫy nhầm mốc).` },
      { n: 183, q: "According to the advertisement, how long has SparkleClean been in business?", type: 'detail', answer: 1,
        options: ["For three years", "For over fifteen years", "For six months", "For thirty years"],
        explain: `Đáp án đúng (B): câu "has served local businesses for over fifteen years" nói hơn mười lăm năm. (A) ba năm là hợp đồng (bẫy nhầm). (C), (D) sai số (bẫy số liệu).` },
      { n: 184, q: "Based on both passages, what can the committee expect from SparkleClean?", type: 'cross-reference', answer: 0,
        options: ["A fairly priced service backed by a satisfaction guarantee", "A free carpet-cleaning machine", "A two-year contract that can be raised anytime", "Weekend-only service"],
        explain: `Đáp án đúng (A): memo cho "most competitive price", quảng cáo cho "satisfaction guarantee" — ghép lại là dịch vụ giá tốt, có bảo đảm hài lòng. (B) không tặng máy (bẫy bịa). (C) hợp đồng ba năm, không tăng giữa kỳ (bẫy trái nghĩa). (D) còn có cả dịch vụ tối (bẫy chi tiết sai).` },
      { n: 185, q: "What does the advertisement say about the cleaning products?", type: 'detail', answer: 2,
        options: ["They are imported from abroad", "They are the cheapest on the market", "They are environmentally friendly", "They are provided by the client"],
        explain: `Đáp án đúng (C): câu "use environmentally friendly products" nói sản phẩm thân thiện môi trường. (A) không nhập khẩu (bẫy bịa). (B) không nói rẻ nhất (bẫy bịa). (D) không do khách cấp (bẫy bịa).` },
    ],
    vi: `Memo: Sau khi xem bốn báo giá, chúng tôi chọn SparkleClean cung cấp dịch vụ dọn ban đêm cho tòa nhà. Công ty đưa giá cạnh tranh nhất và đồng ý hợp đồng ba năm không tăng giữa kỳ. SparkleClean sẽ bắt đầu vào mùng một tháng sau. Nhà cung cấp hiện tại đã được thông báo và sẽ làm nốt tuần cuối. Thành viên ban quản lý có câu hỏi vui lòng liên hệ phòng cơ sở trước thứ Sáu. Quảng cáo: SparkleClean đã phục vụ doanh nghiệp địa phương hơn mười lăm năm. Nhân viên được đào tạo dùng sản phẩm thân thiện môi trường, mọi giám sát đều được kiểm tra lý lịch. Chúng tôi cung cấp dịch vụ ban đêm hoặc cuối tuần linh hoạt, mọi hợp đồng đều có bảo đảm hài lòng. Hãy gọi để nhận báo giá miễn phí tại chỗ.`,
    vocab: ['bid – báo giá', 'competitive – cạnh tranh', 'mid-term – giữa kỳ', 'satisfaction guarantee – bảo đảm hài lòng']
  },

  // ======================= ĐOẠN BA — câu 186–200 =======================
  // ---- UNIT 13 (email + article + schedule) — câu 186–190 ----
  {
    id: 'lr2-p7-13', test: 2, part: 7,
    passages: [
      { kind: 'email', title: 'New Wellness Program', text: `From: Human Resources
To: All Employees
Subject: New Wellness Program

We are pleased to introduce a company wellness program starting September 1. Employees may join one of three activities: a lunchtime yoga class, a walking group, or a weekly health workshop.

Participation is voluntary and free of charge. Those who attend at least eight sessions during the month will receive a twenty-dollar voucher for the company cafeteria.` },
      { kind: 'article', title: 'Workplace Wellness and Productivity', text: `Studies suggest that workplace wellness programs can reduce sick days and improve morale. However, experts note that participation is highest when activities are held during work hours and are easy to reach. Programs that require employees to stay late tend to see low turnout.` },
      { kind: 'schedule', title: 'September Wellness Schedule', text: `Yoga: Tuesdays, 12:00 p.m., Conference Room A
Walking group: Wednesdays, 12:30 p.m., meet in the lobby
Health workshop: Thursdays, 3:00 p.m., Conference Room B
All sessions last about forty-five minutes.` },
    ],
    questions: [
      { n: 186, q: "When does the wellness program begin?", type: 'detail', answer: 0,
        options: ["September 1", "September 5", "September 8", "October 1"],
        explain: `Đáp án đúng (A): câu "a company wellness program starting September 1" nói chương trình bắt đầu 1 tháng 9. (B), (C), (D) đều sai ngày (bẫy nhầm mốc).` },
      { n: 187, q: "According to the article and the email, how does the program encourage participation?", type: 'cross-reference', answer: 1,
        options: ["By requiring employees to stay late", "By holding sessions during work hours at no cost", "By paying employees to attend", "By making attendance mandatory"],
        explain: `Đáp án đúng (B): bài báo nói tham gia cao nhất khi "held during work hours"; email cho thấy các buổi lúc 12 giờ và 3 giờ chiều, lại "free of charge" — ghép hai đoạn. (A) "stay late" bị bài báo chê (bẫy trái nghĩa). (C) không trả tiền (bẫy bịa). (D) "voluntary" (bẫy trái nghĩa).` },
      { n: 188, q: "What reward is given for attending at least eight sessions?", type: 'detail', answer: 3,
        options: ["A free lunch every day", "A new yoga mat", "A cash bonus", "A twenty-dollar cafeteria voucher"],
        explain: `Đáp án đúng (D): câu "will receive a twenty-dollar voucher for the company cafeteria" nói tặng phiếu ăn 20 đô. (A) không có bữa trưa miễn phí (bẫy bịa). (B) không tặng thảm (bẫy bịa). (C) không phải tiền mặt (bẫy nhầm).` },
      { n: 189, q: "When is the walking group scheduled?", type: 'cross-reference', answer: 0,
        options: ["Wednesdays at 12:30 p.m.", "Tuesdays at 12:00 p.m.", "Thursdays at 3:00 p.m.", "Fridays at 5:00 p.m."],
        explain: `Đáp án đúng (A): bảng lịch ghi "Walking group: Wednesdays, 12:30 p.m."; câu hỏi gắn với ba hoạt động nêu ở email. (B) là giờ yoga, (C) là workshop, (D) không có (bẫy nhầm chi tiết).` },
      { n: 190, q: "How long does each session last?", type: 'detail', answer: 3,
        options: ["About fifteen minutes", "About thirty minutes", "About one hour", "About forty-five minutes"],
        explain: `Đáp án đúng (D): câu "All sessions last about forty-five minutes" nói mỗi buổi khoảng bốn mươi lăm phút. (A), (B), (C) sai thời lượng (bẫy số liệu).` },
    ],
    vi: `Email: Chúng tôi vui mừng giới thiệu chương trình sức khỏe công ty bắt đầu 1 tháng 9. Nhân viên có thể tham gia một trong ba hoạt động: lớp yoga giờ trưa, nhóm đi bộ, hoặc buổi tư vấn sức khỏe hằng tuần. Tham gia tự nguyện và miễn phí. Ai dự ít nhất tám buổi trong tháng sẽ nhận phiếu ăn 20 đô ở căng tin công ty. Bài báo: Các chương trình sức khỏe nơi làm việc có thể giảm ngày ốm và cải thiện tinh thần. Tuy nhiên, tham gia cao nhất khi hoạt động tổ chức trong giờ làm và dễ tiếp cận. Chương trình bắt nhân viên ở lại muộn thường ít người dự. Lịch: Yoga thứ Ba 12 giờ trưa phòng A. Đi bộ thứ Tư 12 rưỡi, gặp ở sảnh. Tư vấn sức khỏe thứ Năm 3 giờ chiều phòng B. Mỗi buổi khoảng bốn mươi lăm phút.`,
    vocab: ['wellness – sức khỏe', 'voluntary – tự nguyện', 'voucher – phiếu/phiếu quà', 'turnout – số người tham dự']
  },

  // ---- UNIT 14 (email + notice + schedule) — câu 191–195 ----
  {
    id: 'lr2-p7-14', test: 2, part: 7,
    passages: [
      { kind: 'email', title: 'Our Move to the Elm Street Building', text: `From: Office Manager
To: Marketing Team
Subject: Our Move to the Elm Street Building

The marketing team will move to the new Elm Street office on December 5. The new space is twice the size of our current floor and includes a quiet room for focused work.

Please pack your personal items in the boxes provided and label them with your name by December 3. The moving company will handle all furniture and equipment.` },
      { kind: 'notice', title: 'Moving Day Instructions', text: `On December 5, employees should enter through the Elm Street main entrance. The parking garage will be closed for moving trucks from 7:00 a.m. to 10:00 a.m. Security staff will be available at the front desk to issue new access cards.` },
      { kind: 'schedule', title: 'Move Timeline', text: `Packing completed: December 3
Move day: December 5 (trucks arrive at 7:00 a.m.)
Network and phone setup: December 5, afternoon
First day in the new office: December 6
Any unpacking questions may be sent to the office manager.` },
    ],
    questions: [
      { n: 191, q: "When will the team move to the new office?", type: 'detail', answer: 0,
        options: ["December 5", "December 3", "December 6", "December 10"],
        explain: `Đáp án đúng (A): email nêu "will move to the new Elm Street office on December 5". (B) là hạn đóng gói, (C) là ngày làm việc đầu, (D) không được nêu (bẫy nhầm mốc).` },
      { n: 192, q: "Given the notice, how should employees enter on move day?", type: 'cross-reference', answer: 1,
        options: ["Through the parking garage", "Through the Elm Street main entrance", "Through the old building's side door", "Through the loading dock only"],
        explain: `Đáp án đúng (B): email cho địa điểm mới, thông báo nói "employees should enter through the Elm Street main entrance" vì "parking garage will be closed" — ghép hai đoạn. (A) nhà xe đóng cửa (bẫy trái nghĩa). (C), (D) không được nêu (bẫy bịa).` },
      { n: 193, q: "By what date must employees pack and label their boxes?", type: 'detail', answer: 3,
        options: ["December 5", "December 6", "November 30", "December 3"],
        explain: `Đáp án đúng (D): câu "label them with your name by December 3" nêu hạn 3 tháng 12. (A) ngày chuyển, (B) ngày làm việc đầu, (C) không được nêu (bẫy nhầm mốc).` },
      { n: 194, q: "When will the network and phones be set up?", type: 'cross-reference', answer: 2,
        options: ["On December 3", "On December 6", "On December 5, in the afternoon", "One week after the move"],
        explain: `Đáp án đúng (C): bảng lịch ghi "Network and phone setup: December 5, afternoon"; câu hỏi gắn với ngày chuyển ở email. (A) là hạn đóng gói, (B) là ngày làm việc đầu, (D) sai (bẫy nhầm chi tiết).` },
      { n: 195, q: "When can the team begin working in the new office?", type: 'inference', answer: 3,
        options: ["On December 3", "On December 5", "During the weekend", "On December 6"],
        explain: `Đáp án đúng (D): bảng lịch ghi "First day in the new office: December 6", nên ngày làm việc đầu tiên là 6 tháng 12. (A) chỉ đóng gói, (B) là ngày chuyển (chưa xong mạng), (C) cuối tuần không làm (bẫy suy diễn).` },
    ],
    vi: `Email: Nhóm marketing sẽ chuyển sang văn phòng mới ở đường Elm vào ngày 5 tháng 12. Không gian mới rộng gấp đôi tầng hiện tại và có phòng yên tĩnh để tập trung. Vui lòng đóng đồ cá nhân vào thùng được cấp và ghi tên trước ngày 3 tháng 12. Công ty chuyển dọn sẽ lo toàn bộ đồ đạc và thiết bị. Thông báo: Ngày 5 tháng 12, nhân viên vào qua cửa chính đường Elm. Nhà xe đóng cho xe tải từ 7 đến 10 giờ sáng. Nhân viên an ninh ở quầy lễ tân để cấp thẻ ra vào mới. Lịch: Đóng gói xong 3 tháng 12. Ngày chuyển 5 tháng 12. Lắp mạng và điện thoại 5 tháng 12 buổi chiều. Ngày làm việc đầu ở văn phòng mới 6 tháng 12.`,
    vocab: ['move – chuyển', 'label – dán nhãn', 'access card – thẻ ra vào', 'loading dock – khu bốc dỡ']
  },

  // ---- UNIT 15 (report + memo + schedule) — câu 196–200 ----
  {
    id: 'lr2-p7-15', test: 2, part: 7,
    passages: [
      { kind: 'report', title: 'Customer Satisfaction Survey — Results', text: `The annual customer satisfaction survey showed an overall rating of 82 percent, up from 76 percent last year. Customers especially praised the speed of the online support chat. However, the survey revealed that many customers find the phone support wait times too long, with an average wait of eighteen minutes.` },
      { kind: 'memo', title: 'Improving Phone Support', text: `To: Customer Service Team
From: Director of Support
Subject: Improving Phone Support

To reduce phone wait times, we will hire six additional representatives and extend evening hours. A new call-back feature will let customers keep their place in line without waiting on hold. These changes will take effect next quarter.` },
      { kind: 'schedule', title: 'Implementation Timeline', text: `Hiring completed: end of next month
Call-back feature launch: in three months
Evening hours begin: in four months
Progress will be reviewed monthly by the director of support.
All dates are measured from the start of next quarter.` },
    ],
    questions: [
      { n: 196, q: "What was the overall rating in this year's survey?", type: 'detail', answer: 0,
        options: ["82 percent", "76 percent", "18 percent", "64 percent"],
        explain: `Đáp án đúng (A): câu "an overall rating of 82 percent" nêu mức 82%. (B) 76% là năm ngoái (bẫy nhầm mốc). (C) 18 là số phút chờ (bẫy nhầm). (D) không được nêu (bẫy bịa).` },
      { n: 197, q: "What did customers especially praise?", type: 'detail', answer: 3,
        options: ["The phone support wait times", "The new call-back feature", "The evening hours", "The speed of the online support chat"],
        explain: `Đáp án đúng (D): câu "praised the speed of the online support chat" nói khách khen tốc độ chat trực tuyến. (A) bị chê là lâu (bẫy trái nghĩa). (B), (C) là thay đổi tương lai, chưa có (bẫy nhầm).` },
      { n: 198, q: "Why does the memo propose a call-back feature?", type: 'cross-reference', answer: 2,
        options: ["To lower the price of the product", "To replace the online chat", "To reduce long phone wait times", "To hire more managers"],
        explain: `Đáp án đúng (C): báo cáo nêu "phone support wait times too long, with an average wait of eighteen minutes"; memo trả lời "To reduce phone wait times ... a new call-back feature" — ghép hai đoạn. (A) không giảm giá (bẫy bịa). (B) không thay chat (bẫy bịa). (D) tuyển thêm nhân viên tổng đài, không phải quản lý (bẫy nhầm chi tiết).` },
      { n: 199, q: "According to the memo and the timeline, when will evening hours begin?", type: 'cross-reference', answer: 3,
        options: ["At the end of next month", "In three months", "Next quarter, immediately", "In four months"],
        explain: `Đáp án đúng (D): memo nói thay đổi "take effect next quarter", bảng lịch ghi "Evening hours begin: in four months" — ghép hai đoạn. (A) là hạn tuyển xong, (B) là lúc ra tính năng call-back, (C) "immediately" mâu thuẫn (bẫy nhầm mốc).` },
      { n: 200, q: "What is the main goal of the memo?", type: 'inference', answer: 1,
        options: ["To increase the overall survey rating to 90 percent", "To shorten phone support wait times", "To cancel the online support chat", "To reduce the number of representatives"],
        explain: `Đáp án đúng (B): memo mở đầu "To reduce phone wait times" và mọi biện pháp (tuyển thêm, kéo dài giờ, call-back) đều nhằm mục tiêu này. (A) không đặt mục tiêu 90% (bẫy bịa). (C) không hủy chat (bẫy trái nghĩa). (D) tuyển thêm chứ không giảm (bẫy trái nghĩa).` },
    ],
    vi: `Báo cáo: Khảo sát hài lòng khách hàng hằng năm cho mức đánh giá chung 82%, tăng từ 76% năm trước. Khách đặc biệt khen tốc độ chat hỗ trợ trực tuyến. Tuy nhiên, khảo sát cho thấy nhiều khách thấy thời gian chờ điện thoại quá lâu, trung bình mười tám phút. Memo: Để giảm thời gian chờ điện thoại, chúng tôi sẽ tuyển thêm sáu nhân viên tổng đài và kéo dài giờ buổi tối. Tính năng gọi lại mới cho phép khách giữ chỗ trong hàng chờ mà không phải giữ máy. Các thay đổi có hiệu lực quý tới. Lịch: Tuyển xong cuối tháng sau. Ra tính năng gọi lại sau ba tháng. Bắt đầu giờ tối sau bốn tháng. Tiến độ xem xét hằng tháng.`,
    vocab: ['satisfaction – sự hài lòng', 'wait time – thời gian chờ', 'call-back – gọi lại', 'representative – nhân viên tổng đài']
  }
);