/*
 * Case khó Freelance & Upwork (#/upwork, tab Case khó), phần 3. Schema + luật: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Case mẫu: uw-case-001 trong upwork-cases-1.js.
 * Id uw-case-NNN duy nhất trên mọi file upwork-cases-*.js.
 */
(window.UPWORK_CASES = window.UPWORK_CASES || []).push(
{
  id: 'uw-case-201',
  category: 'scam',
  level: 'mid',
  severity: 'high',
  title: 'Khách lạ mời phỏng vấn, đòi chuyển sang Telegram/WhatsApp ngay, rồi gửi "check" để mua thiết bị',
  situation: `Bạn mới tạo profile Upwork 2 tuần, chưa có job nào. Một khách có profile mới (tạo cùng ngày) nhắn qua Upwork: "Hi, we saw your profile, we need a Java developer urgently. Please move to Telegram for faster communication: @fakeuser". Trên Telegram, họ gửi offer: "We will pay $3.000/month, but first we need you to buy a MacBook Pro for the project; we will send a check to cover it. Please buy the laptop and send the receipt." Bạn chưa ký hợp đồng nào trên Upwork, chưa có escrow, và họ chưa từng video call.`,
  signals: [
    'Khách có profile mới, không có lịch sử job, và không có review.',
    'Yêu cầu chuyển sang Telegram/WhatsApp ngay từ Upwork Messages.',
    'Mời làm việc và trả lương cao mà chưa phỏng vấn kỹ thuật, chưa ký hợp đồng trên nền tảng.',
    'Yêu cầu mua thiết bị/thanh toán trước rồi "hoàn tiền" bằng check hoặc chuyển khoản.',
    'Dùng từ "urgent", "guaranteed payment", "just trust us".',
  ],
  steps: `1. **Dừng lại, không trả lời tiếp trên Telegram.** Mọi giao dịch phải ở lại Upwork; nếu đã trả lời, ngừng và chuyển sang Upwork Messages để có bằng chứng.
2. **Không mua bất kỳ thiết bị nào, không gửi tiền, không cung cấp thông tin ngân hàng/thẻ.** "Check" là công cụ lừa đảo phổ biến (check giả, hoặc check thật rồi bị clawback sau khi bạn gửi tiền).
3. **Kiểm tra profile khách trên Upwork:** xem verification, số job đã đăng, review, thời gian tham gia. Profile mới + không verify = rủi ro cao.
4. **Báo cáo trên Upwork:** dùng nút Report/Flag trên profile hoặc tin nhắn; mô tả ngắn gọn: "Asked to move off platform and pay for equipment via check."
5. **Không ký hợp đồng ngoài Upwork.** Mọi hợp đồng phải trên Upwork để có escrow và bảo vệ; hợp đồng ngoài = không có bảo vệ và có thể vi phạm điều khoản.
6. **Nếu đã lỡ gửi thông tin:** đổi mật khẩu Upwork, bật 2FA, liên hệ ngân hàng nếu đã gửi số tài khoản.
7. **Quy tắc chung:** mọi công việc và thanh toán phải trên Upwork; mọi yêu cầu "mua thiết bị rồi hoàn tiền" là lừa đảo.

Nhánh hay gặp:
- **Khách nói "chỉ là test task":** vẫn phải trên Upwork với escrow; không có escrow = không làm.
- **Khách gửi link "verify account":** không bấm; chỉ verify qua Upwork chính thức.
- **Khách doạ "block bạn":** block trước, không ảnh hưởng tài khoản nếu bạn tuân thủ điều khoản.`,
  templates: [
    { name: 'Từ chối chuyển kênh, giữ trên Upwork', text: 'Hi, thanks for reaching out. I keep all work and payment on Upwork for both our protection. Could you share the job details and scope here so I can apply through the platform? I am happy to do a short paid test task inside an Upwork contract.' },
    { name: 'Từ chối mua thiết bị', text: 'Hi, I am not able to purchase equipment upfront or handle payments outside Upwork. If there is a hardware requirement, it should be funded through the contract or provided by your company. Let me know if we can proceed on-platform.' },
    { name: 'Báo cáo ngắn cho hỗ trợ Upwork', text: 'Reporting a suspicious client: requested to move to Telegram immediately, offered a job without interview, and asked me to buy a laptop with a check reimbursement. No contract or escrow. Profile appears newly created.' },
  ],
  mistakes: [
    'Chuyển sang Telegram/WhatsApp và làm việc ngoài Upwork: mất bảo vệ và có thể vi phạm điều khoản.',
    'Mua thiết bị rồi chờ "hoàn tiền": check giả hoặc clawback, mất tiền.',
    'Cung cấp thông tin ngân hàng/thẻ cho người lạ.',
    'Tin vào lời hứa lương cao mà không có hợp đồng.',
    'Không báo cáo: để scammer tiếp tục lừa người khác.',
  ],
  prevention: `- Giữ mọi trao đổi và thanh toán trên Upwork; coi "chuyển kênh" là red flag.
- Không mua thiết bị/thanh toán trước cho khách; mọi chi phí phải qua escrow hoặc khách cung cấp.
- Kiểm tra profile khách (verification, lịch sử) trước khi trả lời.
- Bật 2FA và không chia sẻ thông tin nhạy cảm.
- Báo cáo nghi ngờ scam ngay.

> Senior tip: Trên Upwork, mọi thứ phải đi qua escrow. Một khách thật sẽ không ngại phỏng vấn trên platform và ký hợp đồng trước khi bạn làm bất cứ điều gì. "Mua laptop rồi hoàn tiền" là kịch bản lừa đảo kinh điển — không ai trả lương cao mà chưa thấy bạn làm việc.`,
  related: ['uw-ch-01', 'remote-008'],
  tags: ['scam', 'off-platform', 'equipment', 'telegram', 'report'],
},
{
  id: 'uw-case-202',
  category: 'scam',
  level: 'senior',
  severity: 'high',
  title: 'Bài test kỹ thuật: repo chứa mã độc đánh cắp ví, SSH key',
  situation: `Bạn ứng tuyển job "Fix bug in Node.js app". Khách gửi repo GitHub riêng và nhắn: "Please clone and run npm install, then npm start to reproduce the bug. We will discuss after." Bạn clone repo, thấy package.json có scripts "postinstall": "node scripts/setup.js". File scripts/setup.js dài 200 dòng, gọi exec để chạy lệnh hệ thống, đọc ~/.ssh, ~/.aws, và gửi dữ liệu đi. Bạn chưa chạy npm install. Repo có vẻ là project thật nhưng có thể đã bị chèn mã độc.`,
  signals: [
    'Yêu cầu chạy npm install / chạy file ngay mà không có hợp đồng hoặc escrow.',
    'package.json có scripts postinstall/preinstall chạy lệnh hệ thống.',
    'File trong repo đọc thư mục nhạy cảm (~/.ssh, ~/.aws, browser cookies).',
    'Khách thúc giục "chạy nhanh để xem bug", không giải thích rõ.',
    'Repo private, không có lịch sử commit rõ ràng hoặc commit mới nhất thêm file lạ.',
  ],
  steps: `1. **Không chạy npm install, không chạy bất kỳ lệnh nào từ repo.** Dừng ngay; mã độc có thể chạy trong postinstall trước khi bạn kịp đọc.
2. **Đọc package.json scripts trước:** kiểm tra scripts (install, postinstall, preinstall, start). Nếu có exec, curl, wget, hoặc đọc file hệ thống → red flag.
3. **Kiểm tra file đáng ngờ:** tìm exec, spawn, readFileSync với đường dẫn ~/.ssh, ~/.aws, cookies, wallet. Dùng grep trong repo (không chạy code).
4. **Chạy an toàn nếu bắt buộc:** dùng VM/container không có secret, không có SSH key, không có ví; tắt mạng hoặc chỉ cho phép domain cần thiết; dùng user không có quyền sudo.
5. **Không đưa secret vào môi trường test:** không để AWS keys, GitHub token, ví crypto trong container/VM.
6. **Báo cáo:** flag repo/client trên Upwork; nếu repo public, báo cáo lên GitHub (Report abuse). Ghi lại link commit và file độc hại.
7. **Nếu đã chạy:** coi máy bị compromise: đổi mật khẩu, rotate SSH key, revoke token, kiểm tra ví crypto, quét malware.

Nhánh hay gặp:
- **Khách nói "chỉ cần chạy test":** vẫn phải đọc scripts trước; test có thể chạy mã độc.
- **Khách gửi file .jar/.exe:** không chạy trên máy thật; chỉ chạy trong VM cô lập.
- **Bạn muốn "xem nhanh":** dùng container + network disabled + no secrets; không chạy trên máy chính.

Lưu ý: mã độc đánh cắp ví, cookie, SSH key là rủi ro thực; không bao giờ chạy code không tin cậy trên máy có secret.`,
  templates: [
    { name: 'Yêu cầu đọc scripts trước', text: 'Hi, before I run anything I need to review the package.json scripts and any setup files for security. I noticed a postinstall script; could you explain what it does and why it is needed? I can run the app in an isolated environment once that is clarified.' },
    { name: 'Từ chối chạy, đề xuất cách an toàn', text: 'Hi, I cannot run npm install or execute files from the repo on my main machine. If you need me to reproduce, please provide a clean minimal reproduction or allow me to run in a sandboxed container with no secrets. I am happy to review the code statically first.' },
    { name: 'Báo cáo ngắn', text: 'Reporting suspicious client: sent a private repo with a postinstall script that reads ~/.ssh and ~/.aws and exfiltrates data. Asked me to run npm install immediately. No contract or escrow.' },
  ],
  mistakes: [
    'Chạy npm install ngay mà không đọc scripts: mã độc chạy trong postinstall.',
    'Chạy trên máy có SSH key, AWS credentials, ví crypto: bị đánh cắp.',
    'Tin "repo là project thật" mà không kiểm tra commit history.',
    'Không báo cáo: để scammer tiếp tục.',
    'Dùng cùng máy cho nhiều tài khoản secret: lây nhiễm.',
  ],
  prevention: `- Luôn đọc package.json scripts và file setup trước khi chạy.
- Chạy code không tin cậy trong VM/container không có secret, mạng bị giới hạn.
- Không lưu secret trên máy dùng để test.
- Kiểm tra commit history và người commit.
- Báo cáo nghi ngờ.

> Senior tip: "npm install" không phải lệnh vô hại; postinstall có thể chạy bất cứ điều gì. Hãy coi mọi repo từ khách lạ như mã độc cho đến khi chứng minh ngược lại. Một container sạch mất 2 phút setup, nhưng cứu bạn khỏi mất SSH key và ví crypto.`,
  related: ['uw-ch-01', 'remote-024'],
  tags: ['scam', 'malware', 'npm', 'security', 'sandbox'],
},
{
  id: 'uw-case-203',
  category: 'scam',
  level: 'mid',
  severity: 'high',
  title: 'Đề nghị "thuê tài khoản Upwork" của bạn hoặc nhờ bạn đứng tên nhận tiền hộ, chia phần trăm',
  situation: `Bạn có profile Upwork với vài job và JSS tốt. Một người lạ nhắn: "Hi, I am a developer in Vietnam but my Upwork account was banned. Can I use your account to receive payments for my work? I will do the work, you just receive money and send me 80%, keep 20%. Easy money." Hoặc: "I need someone with good JSS to apply for jobs, I will pay you 10% of each contract." Bạn chưa nhận tiền nào, nhưng đề nghị rõ ràng vi phạm điều khoản Upwork.`,
  signals: [
    'Yêu cầu dùng tài khoản của bạn để nhận tiền/ký hợp đồng thay người khác.',
    'Chia phần trăm "easy money" mà không làm việc.',
    'Người đề nghị có account bị ban hoặc không thể verify.',
    'Yêu cầu cung cấp thông tin đăng nhập hoặc OTP.',
    'Hứa "không ai biết" hoặc "Upwork không kiểm tra".',
  ],
  steps: `1. **Từ chối ngay, không thương lượng.** Account sharing/renting là vi phạm điều khoản và có thể dẫn đến ban tài khoản vĩnh viễn.
2. **Không cung cấp thông tin đăng nhập, OTP, hoặc xác minh danh tính cho người khác.** Đây là hành vi gian lận danh tính.
3. **Giải thích nhẹ nhàng nhưng dứt khoát:** tài khoản là cá nhân, không thể chuyển nhượng; mọi hợp đồng phải do chính bạn thực hiện.
4. **Báo cáo người đề nghị trên Upwork** (Report) để bảo vệ cộng đồng.
5. **Nếu đã lỡ chia sẻ thông tin:** đổi mật khẩu, bật 2FA, liên hệ hỗ trợ Upwork, tự khai báo để giảm rủi ro.
6. **Hiểu hậu quả:** ban tài khoản, mất tiền trong escrow, mất JSS, có thể bị pháp lý nếu gian lận thanh toán.
7. **Nếu đã lỡ:** đổi mật khẩu ngay, bật 2FA, báo hỗ trợ Upwork tự khai để giảm rủi ro, theo dõi giao dịch bất thường.
8. **Nguyên tắc:** chỉ làm việc bạn tự thực hiện; tiền chỉ nhận cho công việc của chính bạn; không proxy thanh toán cho ai.

Nhánh hay gặp:
- **Người đề nghị nói "chỉ nhận tiền hộ":** vẫn vi phạm; Upwork theo dõi IP/device và phát hiện.
- **Hứa trả "phí bảo hiểm":** không có bảo hiểm nào cho hành vi vi phạm.
- **Bạn cần tiền gấp:** rủi ro mất toàn bộ tài khoản không đáng.

Lưu ý: Upwork có thể kiểm tra device fingerprint, IP, và pattern thanh toán; account renting dễ bị phát hiện.`,
  templates: [
    { name: 'Từ chối account renting', text: 'Hi, I am not able to share or rent my Upwork account. My account is tied to my identity and all contracts must be work I personally perform. I cannot receive payments on behalf of others. I wish you the best in getting your own account verified.' },
    { name: 'Từ chối "nhận tiền hộ"', text: 'Hi, I cannot act as a payment receiver or proxy for another freelancer. That would violate Upwork terms and put both accounts at risk. If you need help with verification, Upwork Support is the right channel.' },
    { name: 'Báo cáo ngắn', text: 'Reporting a user who offered to rent my Upwork account / asked me to receive payments on their behalf for a percentage. This is account sharing and payment proxying.' },
  ],
  mistakes: [
    'Chia sẻ tài khoản để "kiếm tiền dễ": bị ban và mất toàn bộ.',
    'Cung cấp OTP/mật khẩu: mất kiểm soát tài khoản.',
    'Tin "Upwork không kiểm tra": thực tế có kiểm tra device/IP.',
    'Nhận tiền cho công việc không làm: gian lận thanh toán.',
    'Không báo cáo: để scammer tiếp tục.',
  ],
  prevention: `- Không bao giờ chia sẻ tài khoản, mật khẩu, OTP.
- Chỉ nhận tiền cho công việc tự thực hiện.
- Báo cáo đề nghị renting/proxy.
- Giữ thiết bị và mạng ổn định, tránh đăng nhập từ nhiều IP lạ.
- Đọc điều khoản Upwork về account ownership.

> Senior tip: "Easy money" từ renting account thường kết thúc bằng ban vĩnh viễn và mất toàn bộ tiền trong escrow. Tài khoản Upwork là tài sản cá nhân gắn với danh tính; bảo vệ nó quan trọng hơn vài phần trăm hoa hồng.`,
  related: ['uw-ch-01', 'remote-018'],
  tags: ['scam', 'account-renting', 'terms', 'security', 'report'],
},
{
  id: 'uw-case-204',
  category: 'proposal',
  level: 'mid',
  severity: 'medium',
  title: 'Gửi 30 proposal, 0 phản hồi: chẩn đoán phễu bằng số liệu và sửa từng khâu',
  situation: `Bạn là dev Java 4 năm, mới làm Upwork. Trong 2 tuần bạn gửi 30 proposal cho các job Java/Spring, giá 25-35 USD/giờ, nhưng 0 phản hồi, 0 interview. Bạn không biết vấn đề ở đâu: profile, proposal, job chọn, hay giá. Bạn có số liệu: 30 sent, 0 viewed? (Upwork có thể hiện số proposal được xem), 0 interview. Cần chẩn đoán phễu và sửa từng khâu thay vì gửi thêm proposal.`,
  signals: [
    '0 phản hồi sau nhiều proposal: vấn đề ở phễu, không phải số lượng.',
    'Profile mới, chưa có job và review.',
    'Proposal dài, chung chung, không trả lời đúng câu hỏi của job post.',
    'Ứng tuyển job có quá nhiều proposal (>50) hoặc job cũ (>7 ngày).',
    'Giá hoặc kỹ năng không khớp với job.',
  ],
  steps: `1. **Dừng gửi thêm proposal.** Phân tích số liệu trước: sent, viewed, replied, interviewed. Nếu viewed thấp → vấn đề ở tiêu đề/profile; nếu viewed cao nhưng replied thấp → proposal.
2. **Kiểm tra profile:** ảnh, headline, overview, portfolio, skills. Profile phải rõ ràng: "Java/Spring Boot backend, 4 years, API/DB, remote". Thêm 1-2 case study ngắn.
3. **Kiểm tra job chọn:** ưu tiên job mới (<24h), proposal <20, ngân sách phù hợp, kỹ năng khớp ≥80%. Tránh job "Expert only" nếu chưa có review.
4. **Sửa proposal:** ngắn (150-250 từ), trả lời đúng pain point trong job post, đề xuất bước tiếp theo (call 15 phút), không copy-paste. Dùng template nhưng cá nhân hoá 2-3 câu.
5. **Giá:** với profile mới, cân nhắc giá thấp hơn một chút hoặc fixed-price nhỏ để lấy review đầu tiên; không undercut quá nhiều (tạo nghi ngờ).
6. **Theo dõi và lặp:** gửi 5-10 proposal chất lượng, đo viewed/replied; điều chỉnh.
7. **Nhận job nhỏ đầu tiên:** ưu tiên job dễ, scope nhỏ để có review 5 sao; sau đó nâng giá.

Nhánh hay gặp:
- **Viewed thấp:** sửa headline/profile và job chọn.
- **Viewed cao, replied thấp:** sửa proposal (độ dài, cá nhân hoá, CTA).
- **Replied nhưng không interview:** sửa cách trả lời follow-up, đề xuất call.
- **Không có job nào phù hợp:** mở rộng niche hoặc hạ yêu cầu.

Lưu ý: Upwork tính phí Connects; gửi proposal chất lượng quan trọng hơn số lượng.`,
  templates: [
    { name: 'Proposal ngắn, cá nhân hoá', text: 'Hi [Name], I read your post about [specific pain point]. I have 4 years building Java/Spring Boot APIs and can deliver [concrete outcome] in [timeframe]. For your case, I would first [specific step] to confirm scope. Could we do a 15-minute call this week to align? I can share a similar project I delivered. Best, [Your name]' },
    { name: 'Follow-up sau viewed', text: 'Hi [Name], I noticed you viewed my proposal. Happy to answer any questions or adjust scope. Would a quick 10-minute call help? I can also share a short plan for the first milestone.' },
    { name: 'Đề nghị job nhỏ để lấy review', text: 'Hi [Name], I am new on Upwork but have 4 years Java experience. I can take a small, well-scoped task first (e.g., [task]) at a fair rate to prove quality, then scale. Let me know if that works for you.' },
  ],
  mistakes: [
    'Gửi proposal dài, chung chung, không trả lời job post.',
    'Ứng tuyển job quá cũ hoặc quá nhiều proposal.',
    'Giá không khớp kỹ năng/profile.',
    'Không đo số liệu, chỉ gửi nhiều hơn.',
    'Copy-paste cùng một proposal cho mọi job.',
  ],
  prevention: `- Đo phễu: sent → viewed → replied → interviewed.
- Viết proposal ngắn, cá nhân hoá, có CTA.
- Chọn job mới, ít proposal, kỹ năng khớp.
- Lấy job nhỏ đầu tiên để có review.
- Cập nhật profile với case study.

> Senior tip: 30 proposal 0 phản hồi không phải "không may"; đó là tín hiệu phễu bị nghẽn ở một khâu. Hãy đo từng bước và sửa khâu yếu nhất trước khi gửi thêm. Một proposal cá nhân hoá 200 từ tốt hơn mười proposal copy-paste.`,
  related: ['uw-ch-01', 'remote-011', 'remote-030'],
  tags: ['proposal', 'funnel', 'profile', 'upwork', 'metrics'],
},
{
  id: 'uw-case-205',
  category: 'proposal',
  level: 'senior',
  severity: 'medium',
  title: 'Khách ép giá xuống 50% vì có người rẻ hơn',
  situation: `Bạn được mời phỏng vấn cho job fixed-price "API e-commerce" với giá đề xuất 1.000 USD. Trong call, khách nói: "We have another freelancer offering $500 for the same scope. Can you match $500? Otherwise we go with them." Bạn biết scope thực tế ~40 giờ, $500 = $12.5/giờ, thấp hơn thị trường. Khách vẫn muốn toàn bộ scope. Bạn cần đàm phán: giảm phạm vi thay vì giảm giá, hoặc rút lui.`,
  signals: [
    'Khách dùng "người khác rẻ hơn" để ép giá.',
    'Yêu cầu giảm giá nhưng không giảm scope.',
    'So sánh apples-to-oranges (scope/quality khác).',
    'Khách vội vã, không rõ ràng về yêu cầu.',
    'Đe doạ "nếu không thì đi".',
  ],
  steps: `1. **Không giảm giá ngay.** Hỏi rõ scope của "người khác": họ có làm test, warranty, security, docs không? Thường so sánh không công bằng.
2. **Đề xuất giảm phạm vi thay vì giảm giá:** chia scope thành must-have và nice-to-have; báo giá cho must-have, phần còn lại làm milestone sau.
3. **Nêu giá trị của bạn:** kinh nghiệm, chất lượng, bảo hành, giao tiếp, on-time delivery. Khách trả cho rủi ro thấp hơn.
4. **Đặt ranh giới:** nếu khách khăng khăng $500 cho full scope, từ chối lịch sự. Không làm việc lỗ thời gian.
5. **Khi nào rút lui:** nếu khách không tôn trọng giá trị, ép giá liên tục, hoặc có red flag (không rõ scope, vội vã). Rút lui sớm tiết kiệm thời gian.
6. **Nếu khách đồng ý giảm scope:** chốt bằng văn bản, fund milestone mới.
7. **Sau đó:** nếu khách quay lại với giá cũ, giữ nguyên ranh giới; không hạ giá vì "đã quen".
8. **Ghi lại bài học:** đàm phán dựa trên scope và rủi ro, không dựa trên cảm xúc; mỗi lần ép giá là tín hiệu về khách hàng.

Nhánh hay gặp:
- **Khách nói "chỉ matching giá":** đề xuất scope nhỏ hơn tương ứng giá.
- **Khách doạ đi:** để họ đi; giữ chất lượng khách hàng.
- **Khách đồng ý giảm scope:** chốt milestone mới, không làm phần còn lại miễn phí.

Lưu ý: giảm giá mà không giảm scope = làm việc lỗ; tốt hơn là giảm scope.`,
  templates: [
    { name: 'Giảm scope thay vì giảm giá', text: 'Hi [Name], I understand budget is important. Rather than cutting quality, I can reduce scope to fit: deliver [must-have features] for $600, and the remaining items ([list]) as a follow-up milestone. This keeps the core working and protects timeline. Would that work?' },
    { name: 'Nêu giá trị và ranh giới', text: 'Hi [Name], my rate reflects 4 years of Java/Spring experience, tests, and support. I cannot deliver the full scope for $500 without cutting corners. I am happy to scope down to the essentials at $600, or proceed at $1,000 for full scope. Let me know which fits your budget.' },
    { name: 'Rút lui lịch sự', text: 'Hi [Name], thanks for the conversation. It seems our budget expectations do not align for this scope. I wish you success with the project and am happy to reconnect if requirements change.' },
  ],
  mistakes: [
    'Giảm giá 50% mà không giảm scope: làm việc lỗ.',
    'So sánh không kiểm chứng "người khác rẻ hơn".',
    'Nhượng bộ vì sợ mất job: tạo tiền lệ ép giá.',
    'Không chốt scope bằng văn bản: scope creep sau này.',
    'Tranh cãi về giá trị: nên tập trung vào scope và rủi ro.',
  ],
  prevention: `- Không giảm giá mà không giảm scope.
- Chia scope thành must-have/nice-to-have.
- Nêu giá trị (quality, support, on-time).
- Rút lui sớm nếu không tôn trọng.
- Chốt mọi thay đổi bằng văn bản.

> Senior tip: "Người khác rẻ hơn" thường là so sánh không công bằng về scope/quality. Hãy giữ nguyên giá và đề xuất giảm scope tương ứng. Làm việc lỗ thời gian để "giữ khách" chỉ tạo tiền lệ ép giá và làm bạn kiệt sức.`,
  related: ['uw-ch-01', 'remote-012', 'uw-case-004'],
  tags: ['negotiation', 'pricing', 'scope', 'proposal'],
},
{
  id: 'uw-case-206',
  category: 'proposal',
  level: 'senior',
  severity: 'medium',
  title: 'Job cần kỹ năng bạn chỉ có khoảng 60%',
  situation: `Job post: "Full-stack: Spring Boot backend + React/Next.js frontend, 2 tháng, $4.000." Bạn Java/Spring rất mạnh (4 năm) nhưng React/Next.js chỉ biết cơ bản (tự học 1 tháng, chưa production). Bạn muốn ứng tuyển vì backend là phần lớn, nhưng lo không đạt yêu cầu frontend. Cần quyết định: có nên apply, nói trung thực thế nào, và chia phạm vi (backend bạn làm, frontend outsource hoặc khách tự làm).`,
  signals: [
    'Job yêu cầu full-stack nhưng bạn chỉ mạnh một nửa.',
    'Phần yếu (React/Next.js) là yêu cầu bắt buộc trong job post.',
    'Khách có thể kỳ vọng một người làm cả hai.',
    'Bạn có thể chia scope để chỉ nhận phần mình mạnh.',
    'Cần nói trung thực để tránh thất bại sau này.',
  ],
  steps: `1. **Đánh giá thật:** bạn mạnh backend 90%, frontend 40-60%. Job yêu cầu cả hai. Nếu frontend là phần lớn hoặc critical → không nên nhận toàn bộ.
2. **Quyết định apply hay không:** apply nếu backend là phần lớn và bạn có thể chia scope; không apply nếu frontend là core hoặc khách không chấp nhận chia.
3. **Nói trung thực trong proposal:** nêu rõ strength (Java/Spring, API, DB) và limitation (React/Next.js cơ bản), đề xuất chia scope hoặc collaborate.
4. **Đề xuất chia phạm vi:** bạn làm backend + API + DB; frontend do khách hoặc freelancer khác; hoặc bạn học nhanh trong 2 tuần nếu scope frontend nhỏ.
5. **Nếu khách đồng ý:** chốt bằng văn bản phần nào bạn làm, phần nào không; giá tương ứng.
6. **Nếu khách không đồng ý:** rút lui lịch sự; không nhận full-stack mà không đủ kỹ năng.
7. **Nếu vẫn muốn thử:** chỉ nhận nếu frontend scope nhỏ và có thời gian học; đặt milestone nhỏ để kiểm chứng.

Nhánh hay gặp:
- **Khách nói "frontend đơn giản thôi":** vẫn chốt rõ scope frontend; nếu phức tạp, outsource.
- **Khách kỳ vọng bạn làm cả hai:** từ chối phần frontend hoặc đề xuất collaborate.
- **Bạn tự tin "học nhanh":** chỉ nếu scope nhỏ và có buffer thời gian; không overcommit.

Lưu ý: nói trung thực builds trust; overcommit leads to failure và bad review.`,
  templates: [
    { name: 'Proposal trung thực, đề xuất chia scope', text: 'Hi [Name], I am strong in Java/Spring Boot backend (4 years) and can deliver the API, DB, and integrations. My React/Next.js experience is basic, so for the frontend I suggest either (a) I collaborate with your frontend dev, or (b) we split scope: backend by me, frontend by someone else. I can also take a small frontend task to ramp up. Let me know your preference.' },
    { name: 'Đề xuất backend-only', text: 'Hi [Name], I can own the entire backend (Spring Boot, REST, DB, auth, tests) and deliver it well. For the Next.js frontend, I recommend pairing with a frontend specialist; I am happy to define the API contract and support integration. This keeps quality high on both sides.' },
    { name: 'Rút lui nếu không phù hợp', text: 'Hi [Name], thanks for the details. Since the role requires strong Next.js and my strength is backend, I may not be the best fit for the full-stack scope. I would not want to overcommit. If you split the work, I would love to handle the backend. Either way, best of luck with the project.' },
  ],
  mistakes: [
    'Overcommit full-stack mà không đủ frontend: fail và bad review.',
    'Giấu limitation: mất trust khi bị phát hiện.',
    'Nhận frontend scope lớn mà không có thời gian học.',
    'Không chốt scope bằng văn bản: scope creep.',
    'Tự tin "học nhanh" mà không đánh giá buffer.',
  ],
  prevention: `- Đánh giá kỹ năng thật và scope job.
- Nói trung thực về strength/limitation.
- Đề xuất chia scope hoặc collaborate.
- Chốt bằng văn bản phần làm.
- Rút lui nếu không phù hợp.

> Senior tip: Nhận việc ngoài kỹ năng không phải "dũng cảm"; đó là rủi ro cho cả bạn và khách. Nói trung thực và đề xuất chia scope builds trust và tránh fail. Một backend tốt cộng frontend specialist tốt hơn một full-stack yếu.`,
  related: ['uw-ch-01', 'remote-011', 'remote-030'],
  tags: ['proposal', 'skills', 'scope', 'honesty', 'full-stack'],
},
);
