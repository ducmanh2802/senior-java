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
{
  id: 'uw-case-207',
  category: 'scam',
  level: 'senior',
  severity: 'high',
  title: 'Khách mạo danh công ty lớn: form onboarding đòi CCCD, ảnh mặt, tài khoản ngân hàng',
  situation: `Bạn nhận email từ địa chỉ "hr@amaz0n-careers.com" (chữ o là số 0) mời phỏng vấn cho vị trí "Senior Java Developer - remote". Email có logo Amazon và link form Google Forms "onboarding": họ yêu cầu điền họ tên, số CCCD, ảnh mặt trước/sau, số tài khoản ngân hàng, mã OTP ngân hàng, và ảnh selfie cầm CCCD. Họ nói "để verify danh tính trước khi ký hợp đồng". Bạn chưa có hợp đồng Upwork nào với họ, chưa có escrow, và email không phải domain chính thức.`,
  signals: [
    'Tên miền email gần giống thật nhưng sai ký tự (amaz0n-careers.com thay vì amazon.com).',
    'Yêu cầu thông tin nhạy cảm: CCCD, ảnh mặt, tài khoản ngân hàng, OTP.',
    'Form "onboarding" trước khi có hợp đồng/escrow.',
    'Logo công ty nhưng link không phải domain chính thức.',
    'Hứa lương cao, quy trình nhanh, "verify ngay".',
  ],
  steps: `1. **Dừng lại, không điền form.** Không cung cấp CCCD, ảnh mặt, tài khoản ngân hàng, OTP cho ai qua form/email.
2. **Kiểm tra tên miền:** so sánh từng ký tự với domain chính thức; nếu sai một ký tự → scam.
3. **Kiểm tra trên Upwork:** mọi hợp đồng phải trên Upwork với escrow; email ngoài platform không có bảo vệ.
4. **Không trả lời email đó.** Nếu đã trả lời, ngừng; chuyển sang Upwork Messages nếu có job post thật.
5. **Báo cáo:** forward email cho abuse@upwork.com (hoặc Report trên Upwork) kèm header email; báo cáo domain giả mạo cho công ty thật (Amazon có trang report phishing).
6. **Nếu đã điền form:** coi thông tin bị lộ: đổi mật khẩu ngân hàng, liên hệ ngân hàng để khóa thẻ/tài khoản, theo dõi giao dịch, đổi mật khẩu email và bật 2FA.
7. **Quy tắc:** không có hợp đồng/escrow → không cung cấp thông tin nhạy cảm; mọi onboarding chính thức chỉ sau khi ký hợp đồng trên platform.
8. **Giữ bằng chứng:** screenshot email, form, tên miền để báo cáo và điều tra.

Nhánh hay gặp:
- **Khách nói "chỉ để verify":** vẫn không cung cấp; verify chỉ qua Upwork chính thức.
- **Form có vẻ chuyên nghiệp:** giao diện có thể bị giả; domain và escrow mới là bằng chứng.
- **Bạn đã gửi CCCD:** hành động ngay (khóa tài khoản, báo công an nếu cần).`,
  templates: [
    { name: 'Từ chối cung cấp thông tin', text: 'Hi, I do not share personal IDs, bank details, or OTPs outside an official onboarding process tied to a signed contract on Upwork. Please share the official job post and contract link so I can proceed on-platform.' },
    { name: 'Xác minh domain', text: 'Hi, the email domain does not match the official company domain. Could you confirm the official job posting on Upwork and the hiring manager contact? I only proceed through verified channels.' },
    { name: 'Báo cáo ngắn', text: 'Reporting phishing: email from lookalike domain requesting ID, selfie, bank details via Google Form before any contract. No escrow. Domain: amaz0n-careers.com.' },
  ],
  mistakes: [
    'Điền form vì logo và email có vẻ chuyên nghiệp.',
    'Cung cấp OTP ngân hàng: mất tiền ngay.',
    'Tin "verify trước hợp đồng": không có escrow = không có bảo vệ.',
    'Không báo cáo: để scammer tiếp tục.',
    'Dùng cùng mật khẩu cho nhiều tài khoản: lây nhiễm.',
  ],
  prevention: `- Kiểm tra từng ký tự tên miền; sai một chữ → scam.
- Không cung cấp thông tin nhạy cảm trước khi có hợp đồng/escrow.
- Chỉ onboarding qua Upwork chính thức.
- Bật 2FA, dùng mật khẩu khác nhau.
- Báo cáo phishing ngay.

> Senior tip: Scammer đầu tư vào giao diện chuyên nghiệp để tạo trust; nhưng domain và escrow không thể giả. Nếu chưa có hợp đồng trên Upwork, mọi yêu cầu "verify" đều là red flag. CCCD + ảnh mặt + OTP = bộ ba để đánh cắp danh tính và tiền.`,
  related: ['uw-ch-01', 'remote-008'],
  tags: ['scam', 'phishing', 'identity', 'onboarding', 'report'],
},
{
  id: 'uw-case-208',
  category: 'scam',
  level: 'senior',
  severity: 'high',
  title: 'Khách nhờ cài remote control/extension theo dõi giờ làm hoặc đăng nhập tài khoản họ',
  situation: `Bạn nhận job "Java bug fix" với khách mới. Sau khi ký hợp đồng nhỏ, khách nói: "Please install TeamViewer/AnyDesk so I can monitor your work hours and guide you." Sau đó: "Also log into my AWS console using these credentials to deploy." Họ gửi file .exe "time tracker" và yêu cầu cài extension Chrome "to verify hours". Bạn chưa cài gì. Yêu cầu rõ ràng vi phạm bảo mật và có thể là mã độc.`,
  signals: [
    'Yêu cầu cài remote control (TeamViewer/AnyDesk) để "theo dõi".',
    'Gửi file .exe/.msi "tracker" không rõ nguồn.',
    'Yêu cầu đăng nhập tài khoản của họ (AWS, GitHub) trên máy bạn.',
    'Yêu cầu cài extension Chrome không rõ.',
    'Khách không giải thích rõ lý do bảo mật.',
  ],
  steps: `1. **Từ chối cài remote control và file không rõ nguồn.** Không cài TeamViewer/AnyDesk theo yêu cầu khách; không chạy .exe/.msi.
2. **Không đăng nhập tài khoản của họ trên máy bạn.** Nếu cần deploy, khách phải cấp quyền qua IAM role/credentials tạm thời, hoặc bạn deploy bằng tài khoản của mình với quyền giới hạn.
3. **Giải thích Upwork có time tracker chính thức** (nếu fixed/hourly). Không cần remote control; screenshot/log là đủ.
4. **Nếu cần chia sẻ màn hình:** dùng tool chính thức (Zoom/Meet) và chỉ share khi bạn chủ động; không cho điều khiển máy.
5. **Kiểm tra extension Chrome:** chỉ cài từ Chrome Web Store chính thức; đọc permission; không cài extension yêu cầu "read all data".
6. **Báo cáo nếu khách ép:** flag trên Upwork; mô tả "requested remote control install and account sharing".
7. **Nếu đã cài:** gỡ phần mềm, quét malware, đổi mật khẩu, revoke token, kiểm tra tài khoản AWS/GitHub.
8. **Nguyên tắc:** máy bạn là biên giới bảo mật; không cho ai điều khiển hoặc đăng nhập tài khoản của họ.

Nhánh hay gặp:
- **Khách nói "chỉ để xem":** vẫn không cho điều khiển; chỉ share màn hình một chiều.
- **Khách gửi "tracker chính thức":** kiểm tra domain và chữ ký; không chạy nếu không chắc.
- **Bạn muốn "hợp tác":** đề xuất Zoom share screen + log Upwork thay vì remote control.`,
  templates: [
    { name: 'Từ chối remote control', text: 'Hi, I cannot install remote control software or run executables from clients. For hour tracking, Upwork has a built-in time tracker with screenshots. I am happy to share progress via screen share on a call instead.' },
    { name: 'Từ chối đăng nhập tài khoản họ', text: 'Hi, I cannot log into your accounts on my machine. For deployment, please provide temporary scoped credentials (e.g., IAM role with limited permissions) or I can deploy from my environment with your review. This protects both of us.' },
    { name: 'Báo cáo ngắn', text: 'Reporting client: requested installation of remote control software and running an executable "time tracker", plus asked me to log into their AWS account. Refused; no contract beyond small job.' },
  ],
  mistakes: [
    'Cài TeamViewer/AnyDesk theo yêu cầu: mất kiểm soát máy.',
    'Chạy .exe "tracker": mã độc.',
    'Đăng nhập AWS/GitHub của khách trên máy bạn: lộ secret và vi phạm bảo mật.',
    'Cài extension không rõ: đánh cắp dữ liệu trình duyệt.',
    'Không báo cáo: để scammer tiếp tục.',
  ],
  prevention: `- Không cài phần mềm remote control theo yêu cầu khách.
- Không chạy file .exe/.msi không rõ nguồn.
- Không đăng nhập tài khoản của khách trên máy bạn.
- Chỉ dùng Upwork time tracker chính thức.
- Báo cáo yêu cầu vi phạm bảo mật.

> Senior tip: Remote control + file lạ + đăng nhập tài khoản khách = bộ ba để đánh cắp máy và secret. Upwork có time tracker chính thức; không ai cần remote control để "theo dõi giờ làm". Nếu khách ép, đó là red flag.`,
  related: ['uw-ch-01', 'remote-024'],
  tags: ['scam', 'remote-control', 'malware', 'security', 'account-sharing'],
},
{
  id: 'uw-case-209',
  category: 'scam',
  level: 'senior',
  severity: 'high',
  title: 'Job có dấu hiệu vi phạm pháp luật hoặc điều khoản: viết review giả, bypass bảo vệ, clone app có bản quyền',
  situation: `Bạn thấy job: "Need someone to post 5-star reviews on our app store listing (50 reviews, $2 each)" hoặc "Bypass Cloudflare protection to scrape competitor data" hoặc "Clone TikTok app with full features, remove watermark". Khách trả tiền tốt, scope rõ ràng. Bạn cần nhận diện và từ chối vì vi phạm pháp luật/điều khoản nền tảng và có thể bị ban tài khoản.`,
  signals: [
    'Yêu cầu viết review giả, vote giả, follow giả.',
    'Yêu cầu bypass bảo vệ (Cloudflare, CAPTCHA, rate limit).',
    'Yêu cầu clone app có bản quyền, xóa watermark, crack license.',
    'Yêu cầu scrape dữ liệu vi phạm ToS hoặc dữ liệu cá nhân.',
    'Khách nói "không ai biết", "chỉ cần kết quả".',
  ],
  steps: `1. **Nhận diện vi phạm:** review giả = gian lận; bypass bảo vệ = hack; clone bản quyền = vi phạm IP; scrape dữ liệu cá nhân = vi phạm privacy.
2. **Từ chối ngay, không thương lượng.** Không làm một phần "để test".
3. **Giải thích ngắn gọn cho khách:** bạn không làm việc vi phạm pháp luật/điều khoản; có thể bị ban tài khoản và pháp lý.
4. **Đề xuất thay thế hợp pháp:** thay vì review giả → marketing thật; thay vì bypass → dùng API chính thức; thay vì clone → xây app gốc với tính năng tương tự.
5. **Báo cáo job trên Upwork** (Report) để bảo vệ cộng đồng.
6. **Nếu đã làm một phần:** dừng ngay, không nhận tiền, báo cáo để giảm rủi ro.
7. **Hiểu hậu quả:** ban tài khoản vĩnh viễn, mất tiền escrow, có thể bị pháp lý (đặc biệt IP và dữ liệu cá nhân).
8. **Ghi lại bài học:** giữ nguyên tắc "không làm việc vi phạm" dù trả tiền cao.

Nhánh hay gặp:
- **Khách nói "chỉ test":** vẫn vi phạm; không làm.
- **Khách nói "không ai biết":** Upwork và pháp luật có thể biết; rủi ro cao.
- **Bạn cần tiền:** rủi ro mất toàn bộ tài khoản không đáng.
- **Khách ép deadline:** giữ ranh giới; không làm việc vi phạm dù trả cao.
- **Khách hứa "không ai biết":** không có bảo mật nào cho hành vi vi phạm; Upwork có thể kiểm tra.`,
  templates: [
    { name: 'Từ chối review giả', text: 'Hi, I cannot post fake reviews or manipulate ratings. That violates platform terms and can lead to account bans. I can help with legitimate marketing or user feedback collection instead.' },
    { name: 'Từ chối bypass bảo vệ', text: 'Hi, I cannot bypass security measures like Cloudflare or CAPTCHA. I can integrate with official APIs or build compliant data collection within rate limits.' },
    { name: 'Từ chối clone bản quyền', text: 'Hi, I cannot clone or remove watermarks from copyrighted apps. I can build an original app with similar features from scratch, which is safer and legal.' },
  ],
  mistakes: [
    'Làm "một chút" review giả: vẫn vi phạm.',
    'Tin "không ai biết": rủi ro cao.',
    'Nhận tiền cho việc vi phạm: mất tiền và tài khoản.',
    'Không báo cáo: để scammer tiếp tục.',
    'Giảm giá vì "khách trả cao": không đáng.',
  ],
  prevention: `- Không làm review giả, bypass bảo vệ, clone bản quyền.
- Đề xuất thay thế hợp pháp.
- Báo cáo job vi phạm.
- Giữ nguyên tắc dù trả tiền cao.
- Đọc điều khoản Upwork và pháp luật.

> Senior tip: "Tiền cao cho việc vi phạm" là bẫy; ban tài khoản vĩnh viễn + pháp lý không đáng. Một freelancer chuyên nghiệp từ chối rõ ràng và đề xuất thay thế hợp pháp; đó chính là giá trị của bạn.`,
  related: ['uw-ch-01', 'remote-018'],
  tags: ['scam', 'terms', 'legal', 'ip', 'report'],
},
{
  id: 'uw-case-210',
  category: 'proposal',
  level: 'senior',
  severity: 'medium',
  title: 'Được mời (invite) vào job ngân sách quá thấp so với phạm vi: giữ quan hệ mà không bán rẻ',
  situation: `Bạn nhận invite từ khách có profile tốt (nhiều job, review 5 sao) cho job "Build admin dashboard + API + auth + deploy" với ngân sách fixed $300. Scope thực tế ~60 giờ. Khách nói "We like your profile, can you do it for $300? We have tight budget." Bạn muốn giữ quan hệ với khách tốt nhưng $300 = $5/giờ, không khả thi. Cần trả lời để giữ quan hệ mà không bán rẻ.`,
  signals: [
    'Invite từ khách tốt nhưng ngân sách thấp hơn nhiều so với scope.',
    'Khách dùng "tight budget" để ép giá.',
    'Scope lớn nhưng budget nhỏ.',
    'Khách có review tốt → có thể là khách thật, nhưng ngân sách không hợp lý.',
    'Bạn muốn giữ quan hệ dài hạn.',
  ],
  steps: `1. **Cảm ơn invite và xác nhận quan tâm.** Giữ tone chuyên nghiệp, không từ chối ngay.
2. **Đề xuất giảm scope để khớp budget:** chia scope thành must-have và nice-to-have; báo giá cho must-have trong budget, phần còn lại làm milestone sau.
3. **Nêu giá trị của bạn:** kinh nghiệm, chất lượng, bảo hành; khách trả cho rủi ro thấp hơn.
4. **Đặt ranh giới:** nếu khách khăng khăng full scope $300, từ chối lịch sự. Không làm việc lỗ.
5. **Đề xuất alternative:** nếu budget cố định, đề xuất hourly với cap, hoặc chia thành nhiều milestone nhỏ.
6. **Giữ quan hệ:** nếu không deal được, để cửa mở cho job sau với budget phù hợp.
7. **Ghi lại:** đàm phán dựa trên scope, không dựa trên cảm xúc; khách tốt vẫn có thể có budget không hợp lý.

Nhánh hay gặp:
- **Khách nói "chỉ pilot":** vẫn chốt scope pilot rõ ràng; phần còn lại là milestone riêng.
- **Khách doạ "đi tìm người khác":** để họ đi; giữ chất lượng khách hàng.
- **Khách đồng ý giảm scope:** chốt milestone mới, không làm phần còn lại miễn phí.
- **Khách ép giá thêm:** giữ ranh giới; không giảm thêm.
- **Khách quay lại sau:** giữ nguyên ranh giới; không hạ giá.
- **Khách tốt nhưng budget thấp:** vẫn giữ chất lượng; không bán rẻ.
- **Khách hỏi hourly:** đề xuất cap giờ để kiểm soát budget.`,
  templates: [
    { name: 'Giảm scope để khớp budget', text: 'Hi [Name], thanks for the invite—I would love to work with you. For $300, I can deliver the core: [must-have features] with tests and basic deploy. The remaining items ([list]) can be a follow-up milestone. Would that fit your budget?' },
    { name: 'Đề xuất hourly với cap', text: 'Hi [Name], given the scope, $300 is below my minimum for full delivery. I can do hourly at $X with a cap of Y hours for the first milestone, then we review. This keeps quality high and budget controlled.' },
    { name: 'Giữ quan hệ, từ chối lịch sự', text: 'Hi [Name], thanks for reaching out. For this scope my minimum is $Z; I cannot deliver full quality at $300. If budget changes or scope can be reduced, I would be glad to help. Wishing you success with the project.' },
  ],
  mistakes: [
    'Nhận full scope $300: làm việc lỗ.',
    'Giảm giá mà không giảm scope: tạo tiền lệ.',
    'Từ chối thô: mất khách tốt.',
    'Không đề xuất alternative: bỏ cơ hội.',
    'Tranh cãi về giá trị: nên tập trung scope.',
  ],
  prevention: `- Không giảm giá mà không giảm scope.
- Chia scope thành must-have/nice-to-have.
- Nêu giá trị (quality, support, on-time).
- Đề xuất alternative (hourly, milestone).
- Giữ quan hệ dù không deal.

> Senior tip: Khách tốt có budget không hợp lý không phải "kẻ xấu"; đó là cơ hội để đàm phán scope. Giảm scope tương ứng budget keeps quality và builds trust. Bán rẻ full scope chỉ tạo tiền lệ ép giá và kiệt sức.`,
  related: ['uw-ch-01', 'remote-012', 'uw-case-205'],
  tags: ['proposal', 'invite', 'pricing', 'scope', 'relationship'],
},
{
  id: 'uw-case-211',
  category: 'proposal',
  level: 'senior',
  severity: 'medium',
  title: 'Khách hỏi "làm được trong 3 ngày không" với việc cần 2 tuần: ước lượng trung thực, đưa phương án cắt phạm vi',
  situation: `Khách urgently cần feature "payment integration + invoice + email notification + tests" và hỏi: "Can you do it in 3 days?" Bạn ước tính cần 10-14 ngày để làm đầy đủ (tích hợp payment gateway, xử lý webhook, invoice PDF, email, test, deploy). Khách nói "3 ngày là deadline cứng, nếu không thì không thuê." Bạn cần ước lượng trung thực và đưa phương án cắt phạm vi để đáp ứng deadline.`,
  signals: [
    'Khách đặt deadline cứng ngắn hơn ước tính.',
    'Scope lớn nhưng thời gian ít.',
    'Khách doạ "không thuê nếu không kịp".',
    'Bạn có thể cắt scope để đáp ứng deadline.',
    'Cần nói trung thực để tránh fail.',
  ],
  steps: `1. **Ước lượng trung thực:** nói rõ cần 10-14 ngày cho full scope; không hứa 3 ngày nếu không làm được.
2. **Phân tích deadline:** 3 ngày = 24 giờ làm việc; full scope không khả thi; phải cắt scope.
3. **Đề xuất cắt phạm vi:** chia thành must-have (payment integration cơ bản + webhook) và nice-to-have (invoice PDF, email, tests đầy đủ); làm must-have trong 3 ngày, phần còn lại milestone sau.
4. **Nêu rủi ro:** nếu ép full scope trong 3 ngày → bug, không test, deploy lỗi, bad review.
5. **Đề xuất alternative:** nếu deadline cứng, khách có thể thêm người hoặc chấp nhận scope nhỏ hơn.
6. **Chốt bằng văn bản:** scope nào làm trong 3 ngày, phần nào sau; giá tương ứng.
7. **Nếu khách không chấp nhận:** rút lui lịch sự; không overcommit.

Nhánh hay gặp:
- **Khách nói "chỉ MVP":** vẫn chốt rõ MVP scope; phần còn lại là milestone.
- **Khách doạ đi:** để họ đi; giữ chất lượng.
- **Khách đồng ý cắt scope:** chốt milestone mới, không làm phần còn lại miễn phí.
- **Khách ép deadline thêm:** giữ ranh giới; không overcommit.
- **Khách quay lại sau:** giữ nguyên ranh giới.
- **Khách deadline cứng:** phải cắt scope hoặc thêm người.
- **Khách hỏi partial:** đề xuất milestone nhỏ để kiểm chứng.
- **Khách ép thêm:** giữ ranh giới; không overcommit.`,
  templates: [
    { name: 'Ước lượng trung thực + cắt scope', text: 'Hi [Name], full scope (payment + invoice + email + tests) needs ~10-14 days for quality. For a 3-day deadline, I can deliver the core payment integration + webhook handling in 3 days, and invoice/email/tests as a follow-up milestone. This avoids rushed bugs. Would that work?' },
    { name: 'Đề xuất must-have only', text: 'Hi [Name], to meet 3 days, I suggest we scope to: (1) payment gateway integration, (2) webhook handling, (3) basic error handling. Invoice PDF, email notifications, and full tests can be milestone 2. I can start immediately if we agree on this scope.' },
    { name: 'Rút lui nếu không phù hợp', text: 'Hi [Name], thanks for the urgency. I cannot deliver full scope in 3 days without cutting quality. If 3 days is hard, I am happy to do the core in 3 days and the rest next week, or you may need additional help. Let me know how you would like to proceed.' },
  ],
  mistakes: [
    'Hứa 3 ngày cho full scope: fail và bad review.',
    'Cắt scope nhưng không chốt bằng văn bản: scope creep.',
    'Làm full scope trong 3 ngày: bug, không test.',
    'Từ chối thô: mất khách.',
    'Không đề xuất alternative: bỏ cơ hội.',
  ],
  prevention: `- Ước lượng trung thực.
- Cắt scope để đáp ứng deadline.
- Nêu rủi ro overcommit.
- Chốt bằng văn bản scope và thời gian.
- Rút lui nếu không phù hợp.

> Senior tip: "Làm được trong 3 ngày không" thường là test về honesty và estimation. Một Senior trả lời trung thực và đề xuất cắt scope; overcommit leads to fail và bad review. Deadline cứng + scope lớn = phải cắt scope hoặc thêm người.`,
  related: ['uw-ch-01', 'remote-011', 'remote-030'],
  tags: ['proposal', 'estimation', 'deadline', 'scope', 'honesty'],
},
{
  id: 'uw-case-212',
  category: 'proposal',
  level: 'senior',
  severity: 'medium',
  title: 'Hai khách cùng muốn thuê một lúc, tổng việc vượt năng lực: chọn ai, từ chối/hoãn chuyên nghiệp',
  situation: `Bạn đang làm job A (2 tuần còn lại, 20 giờ/tuần) với khách tốt. Đồng thời khách B invite bạn cho job B (4 tuần, 30 giờ/tuần) với giá tốt hơn. Tổng 50 giờ/tuần, vượt năng lực của bạn (max 35 giờ/tuần). Bạn không thể làm cả hai full-time. Cần quyết định chọn ai, từ chối/hoãn chuyên nghiệp, và giữ quan hệ với cả hai.`,
  signals: [
    'Hai job cùng thời gian, tổng giờ vượt năng lực.',
    'Cả hai khách đều tốt, giá tốt.',
    'Bạn không thể làm full-time cả hai.',
    'Cần chọn dựa trên tiêu chí (giá, duration, relationship, growth).',
    'Cần từ chối/hoãn chuyên nghiệp để giữ quan hệ.',
  ],
  steps: `1. **Đánh giá năng lực thật:** max 35 giờ/tuần; job A 20 + job B 30 = 50 → vượt 15 giờ.
2. **Chọn dựa trên tiêu chí:** giá/giờ, duration, relationship hiện tại, growth potential, độ khó, rủi ro. Job A đã commit → ưu tiên giữ commitment.
3. **Quyết định:** thường ưu tiên job đang làm (A) để không break commitment; job B có thể hoãn hoặc từ chối.
4. **Với job B:** từ chối lịch sự hoặc đề xuất start sau khi job A xong; nêu lý do (đang commit với job khác) và giữ cửa mở.
5. **Với job A:** không thay đổi commitment; nếu cần, đề xuất tăng giờ nhẹ nếu còn capacity.
6. **Nếu muốn làm cả hai:** giảm scope một job (ví dụ job B part-time 15 giờ) và chốt bằng văn bản; đảm bảo không overcommit.
7. **Ghi lại bài học:** luôn có buffer; không nhận job mới khi đang full; từ chối sớm hơn tốt hơn fail sau.

Nhánh hay gặp:
- **Khách B doạ đi:** để họ đi; giữ commitment với A.
- **Khách B đồng ý hoãn:** chốt start date sau job A; giữ quan hệ.
- **Bạn muốn làm cả hai part-time:** chỉ nếu tổng ≤ capacity và chốt bằng văn bản.
- **Khách B doạ đi:** để họ đi; giữ commitment với A.
- **Khách B đồng ý hoãn:** chốt start date sau job A.
- **Khách B muốn part-time:** chỉ nếu tổng ≤ capacity.
- **Khách B muốn start ngay:** từ chối nếu vượt capacity.`,
  templates: [
    { name: 'Từ chối job B, giữ quan hệ', text: 'Hi [Name], thanks for the invite—I would love to work with you. Unfortunately I am fully committed to another project until [date] and cannot take on 30 hrs/week right now. I would be glad to start after [date] or take a smaller scope if that helps. Let me know.' },
    { name: 'Đề xuất hoãn start', text: 'Hi [Name], I am interested but currently at capacity. I could start on [date] after my current project ends, or take a reduced scope (e.g., 15 hrs/week) now. Which works better for you?' },
    { name: 'Giữ commitment với job A', text: 'Hi [Name A], just confirming I remain fully committed to our project and on track for the agreed timeline. No changes on my side.' },
  ],
  mistakes: [
    'Nhận cả hai full-time: overcommit, fail cả hai.',
    'Break commitment với job A: bad review.',
    'Từ chối thô job B: mất quan hệ.',
    'Không có buffer: không có chỗ cho việc phát sinh.',
    'Quyết định theo cảm xúc: nên theo tiêu chí.',
  ],
  prevention: `- Giữ buffer capacity (max 35 giờ nếu có thể 40).
- Ưu tiên commitment hiện tại.
- Từ chối/hoãn chuyên nghiệp, giữ cửa mở.
- Chốt scope/giờ bằng văn bản.
- Quyết định theo tiêu chí, không cảm xúc.

> Senior tip: Overcommit là lỗi phổ biến của freelancer mới: "yes" với mọi job dẫn đến fail cả hai. Một Senior biết capacity của mình và từ chối sớm; giữ commitment hiện tại builds trust và reputation dài hạn. Từ chối lịch sự today mở cửa cho job tốt tomorrow.`,
  related: ['uw-ch-01', 'remote-011', 'remote-030'],
  tags: ['proposal', 'capacity', 'commitment', 'prioritization', 'relationship'],
},
);

