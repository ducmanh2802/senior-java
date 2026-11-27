/*
 * Cẩm nang Freelance & Upwork, phần 2 (cùng window.UPWORK_GUIDE với upwork-guide.js). Schema: docs/UPWORK-GUIDE.md.
 * Kiểm tra: node scripts/check-upwork.js. Chương mẫu: uw-ch-01 trong upwork-guide.js.
 */
(window.UPWORK_GUIDE = window.UPWORK_GUIDE || []).push(
{
  id: 'uw-ch-10',
  order: 10,
  title: 'Tiếng Anh làm việc với khách: mẫu câu và lỗi hay mắc',
  icon: '🗣️',
  summary: 'Bộ mẫu câu tiếng Anh cho sáu tình huống hay gặp (kickoff, báo tiến độ, báo trễ hạn, từ chối yêu cầu, hỏi lại, nhận lỗi), lỗi diễn đạt người Việt hay mắc và cách viết tin nhắn async rõ ràng cho khách lệch múi giờ.',
  body: `**Tóm tắt:** Khi làm việc với khách nước ngoài, tiếng Anh của bạn không cần hoàn hảo — nó cần **rõ ràng, có cấu trúc và đúng việc**. Khách là kỹ sư hoặc founder bận rộn; họ đọc tin nhắn để biết trạng thái, rủi ro và bước tiếp theo, không phải để chấm ngữ pháp. Chương này cho bạn mẫu câu tiếng Anh cho sáu tình huống hay gặp nhất, chỉ ra lỗi diễn đạt người Việt hay mắc (quá thẳng hoặc xin lỗi quá mức), và cách viết tin nhắn async để khách ở múi giờ khác vẫn nắm được.

### Vì sao "rõ ràng" quan trọng hơn "hoàn hảo"
Người Việt học tiếng Anh thường sợ sai nên viết dài, vòng vo, hoặc thêm "Sorry" ở mọi câu. Khách quốc tế lại đọc tin nhắn theo kiểu **quét thông tin**: trạng thái là gì, có rủi ro không, tôi cần làm gì. Một tin nhắn "Sorry to bother you, I just want to ask a small question, if you have time, sorry for the inconvenience" làm khách mất 20 giây mà không biết bạn hỏi gì. Một tin nhắn "Quick question: should the retry wait be 1s or 5s? I'll use 1s unless you say otherwise." trả lời được trong 5 giây.

Nguyên tắc vàng: **mỗi tin nhắn một mục đích, mở đầu bằng thông tin quan trọng nhất, kết bằng bước tiếp theo hoặc câu hỏi**. Đặt câu hỏi ở đầu, không chôn ở cuối.

### Mẫu câu 1 — Kickoff (cuộc gặp đầu tiên)
Kickoff là lúc hai bên thống nhất cách làm việc. Đừng chỉ "nice to meet you". Hãy chốt lại phạm vi, nhịp báo cáo và kênh liên lạc ngay trong tin nhắn đầu tiên.

~~~text
Hi Sarah, thanks for the kickoff call. To confirm what we agreed:
- Scope: Milestone 1 covers the order API and the VNPAY webhook, as in the contract.
- Timeline: I start Monday, submit Friday, your review window is 3 business days.
- Updates: I'll post a short written update every day here, and a live demo every Thursday.
- Access: I have the repo invite and the staging credentials. I still need the VNPAY sandbox keys.
Please correct anything I got wrong. I'll start once milestone 1 shows as funded.
Best, Nam
~~~

Điểm mạnh của tin nhắn này: nó biến cuộc nói chuyện thành văn bản, nêu đúng thứ bạn còn thiếu (sandbox keys), và nhắc điều kiện funded một cách lịch sự.

### Mẫu câu 2 — Báo tiến độ (daily / weekly)
Khách không đọc code mỗi ngày. Báo tiến độ giúp họ yên tâm và tạo bằng chứng nếu sau này có tranh chấp. Dùng cấu trúc ba dòng: xong gì, đang làm gì, vướng gì.

~~~text
Daily update - Tue Nov 12
Done: order API (POST/GET) with idempotency key, 24 unit tests passing.
In progress: VNPAY webhook signature verification.
Blocked: still waiting for the sandbox keys you mentioned yesterday.
Tomorrow: finish the webhook, start MoMo.
~~~

Nếu không có gì vướng, đừng viết "no blockers" suông — hãy viết "No blockers; on track for Friday submit." để khách biết bạn vẫn đang chạy.

### Mẫu câu 3 — Báo trễ hạn (deliverable sẽ muộn)
Đây là tình huống phân biệt freelancer chuyên nghiệp và nghiệp dư. **Báo sớm, nêu lý do, đề xuất phương án, xin xác nhận.** Đừng im lặng đến phút chót rồi mới nói "sorry, delayed".

~~~text
Hi Mark, a heads-up on Milestone 1: I'll need one extra day and will submit Thursday evening instead of Wednesday. The MoMo sandbox rejected our test signature and I'm waiting on their support to confirm the correct flow. Everything else is done and tested.
Two options: (1) I submit Thursday with MoMo marked as pending their reply, or (2) I submit Wednesday without MoMo and add it as a small follow-up milestone. Which do you prefer?
~~~

Chú ý: tin nhắn này không xin lỗi lê thê, không kể khó, mà đưa **hai lựa chọn** để khách quyết. Đó là cách nói "no" mà vẫn giữ được quyền chủ động.

### Mẫu câu 4 — Từ chối yêu cầu ngoài phạm vi
Scope creep (khách đòi thêm việc ngoài hợp đồng) là rủi ro lớn nhất của fixed-price. Từ chối lịch sự nhưng dứt khoát: ghi nhận yêu cầu, chỉ ra nó ngoài phạm vi, đề xuất milestone mới.

~~~text
Hi Anna, thanks for the idea - a Stripe integration alongside VNPAY would be useful. That's outside the current milestone (which covers VNPAY and MoMo only), so I don't want to quietly add it and risk the timeline.
I can scope it as a separate milestone: Stripe Checkout + webhook + tests, estimated 3 days, 300 USD. I'll send the full description once you confirm. Happy to keep Milestone 1 moving in the meantime.
~~~

Cấu trúc: cảm ơn → khẳng định giá trị → nói rõ ngoài phạm vi → đề xuất milestone mới có giá và thời gian → tiếp tục việc cũ. Không có chữ "sorry" nào cả, vì từ chối một yêu cầu ngoài hợp đồng không phải là lỗi.

### Mẫu câu 5 — Hỏi lại khi chưa rõ
Giả vờ hiểu rồi làm sai tốn kém hơn nhiều so với hỏi một câu ngắn. Mẫu câu an toàn: tóm tắt lại cách hiểu của bạn và xin xác nhận.

~~~text
Quick check before I build this: when you say "active user", do you mean anyone who logged in during the last 30 days, or anyone who completed at least one order? I'll go with "logged in within 30 days" unless you tell me otherwise.
~~~

Câu "I'll go with X unless you tell me otherwise" cho phép bạn **không bị chặn** mà vẫn đúng — nếu khách không trả lời, bạn đã có một giả định hợp lý ghi bằng văn bản.

### Mẫu câu 6 — Nhận lỗi
Khi bạn sai, nhận nhanh và ngắn, kèm cách khắc phục. Đừng biến nó thành phiên toà.

~~~text
You're right - I missed the null check on the cart total and that's why the 500 happened. I've added the check plus a regression test, and deployed the fix to staging. Could you retest the checkout flow when you have a moment?
~~~

Công thức: công nhận sự thật → nói bạn đã làm gì để sửa → mời khách kiểm tra lại. Không "I'm so so sorry", chỉ một lời nhận lỗi gọn.

### Lỗi diễn đạt người Việt hay mắc
| Lỗi | Vì sao hại | Sửa thành |
|---|---|---|
| "Sorry to bother you..." mở đầu mọi tin | Làm tin nhắn dài, khách không thấy câu hỏi | Bỏ "sorry", vào thẳng việc |
| "I will try my best" | Mơ hồ, không cam kết | "I'll deliver X by Friday" |
| "Yes, no problem" khi bị ép scope | Rồi không làm nổi, trễ hạn | "That's new scope; I'll send a separate milestone" |
| Dịch thẳng từ tiếng Việt ("Can you help me check?") | Nghe như nhờ vả, không rõ việc | "Could you confirm whether the sandbox keys are ready?" |
| "As soon as possible" | Không có ngày, khách không biết khi nào | "by Thursday 5 PM your time" |
| Viết hoa toàn bộ / dấu chấm than nhiều | Trông như đang to tiếng | Viết thường, một dấu chấm |

### Viết tin nhắn async cho khách lệch múi giờ
Bạn ở UTC+7, khách ở Mỹ (UTC-5 đến UTC-8) lệch 12–15 tiếng. Nếu bạn chỉ nhắn "are you free for a call?", một vòng hỏi–đáp mất hai ngày. Cách async tốt:
- Nêu câu hỏi kèm **giả định mặc định** để khách chỉ cần trả lời "yes" hoặc sửa.
- Gửi vào đầu ngày của bạn để khách thấy khi họ thức dậy.
- Gom nhiều câu hỏi nhỏ vào **một** tin nhắn, đừng bắn từng câu.
- Khi cần họp, đề xuất 2–3 khung giờ cụ thể theo giờ của khách kèm giờ của bạn.

~~~text
Hi Tom, three quick things so you can answer in one go when you're back online:
1) Sandbox keys - ready? If not, I'll proceed with mocks.
2) The retry wait - I'll use 1s unless you prefer 5s.
3) Demo - does Thu 10 AM your time (10 PM mine) work, or is Fri better?
No rush, just replying to this one message is enough.
~~~

### Liên hệ phỏng vấn
Nhà tuyển dụng remote đánh giá rất cao khả năng giao tiếp async: họ cần người viết trạng thái rõ, không cần quản lý sát. Khi phỏng vấn, bạn có thể nói: "I keep clients in sync with a short daily written update and a weekly demo, and I always confirm scope in writing after a call." Câu này cho thấy bạn đã làm việc remote thật, không chỉ biết code.

> Senior tip: Tiếng Anh làm việc không phải môn học, mà là một quy trình: mỗi tin nhắn trả lời được ba câu hỏi "trạng thái là gì, rủi ro là gì, tôi cần khách làm gì". Dành 10 phút soạn sẵn 6 mẫu câu trên thành snippet, mỗi lần gửi chỉ điền chỗ trống. Sau một tháng, bạn sẽ nhận ra khách trả lời nhanh hơn hẳn — không phải vì tiếng Anh bạn giỏi lên, mà vì bạn đã bỏ đi những câu vòng vo và "sorry" thừa.`,
  checklist: [
    'Soạn 6 mẫu câu (kickoff, tiến độ, trễ hạn, từ chối, hỏi lại, nhận lỗi) thành snippet để điền nhanh.',
    'Đọc lại 5 tin nhắn gần nhất bạn gửi khách, xoá mọi "sorry" mở đầu không cần thiết.',
    'Chuyển mọi câu hỏi mơ hồ thành câu có giả định mặc định ("I\'ll use X unless you say otherwise").',
    'Lập một tin nhắn async mẫu gộp 3 câu hỏi, gửi thử cho một khách và đo thời gian phản hồi.',
    'Khi trễ hạn, tập báo sớm kèm hai lựa chọn thay vì im lặng đến phút chót.',
  ],
  related: ['remote-014', 'remote-023', 'remote-024', 'remote-049', 'remote-050', 'uw-ch-05'],
},
{
  id: 'uw-ch-11',
  order: 11,
  title: 'Dùng AI khi làm freelance mà không mất uy tín',
  icon: '🤖',
  summary: 'Dùng AI để code và viết proposal giúp bạn nhanh hơn, nhưng dán nhầm secret hay dữ liệu khách, hay giao code chưa review, sẽ làm mất uy tín và có thể vi phạm hợp đồng. Chương này vạch ranh giới an toàn, cách review và cách minh bạch với khách.',
  body: `**Tóm tắt:** AI là công cụ tăng tốc, không phải người thay bạn chịu trách nhiệm. Dùng AI để viết code, viết proposal, viết tài liệu là hợp lý — nhưng bạn phải tự đọc và hiểu mọi dòng trước khi giao, không bao giờ dán secret hay dữ liệu của khách vào công cụ AI khi chưa được phép, và minh bạch khi khách hỏi. Uy tín freelance được xây bằng "giao đúng, giao được bảo trì", không bằng "giao nhanh rồi để khách tự sửa".

### Vì sao AI vừa là cơ hội vừa là rủi ro
Với một dev Java 4 năm, AI giúp viết nhanh một REST API mẫu, sinh test, giải thích một đoạn code cũ, dịch tài liệu. Đó là lợi thế thật. Nhưng ba rủi ro đi kèm:
1. **Code chạy được nhưng sai nghiệp vụ:** AI không biết luật thanh toán của khách, nó đoán. Bạn giao mà không đọc kỹ thì lỗi nổ trên production.
2. **Rò rỉ dữ liệu:** dán log, dump database, file .env, mã nguồn khách vào một công cụ AI bên thứ ba có thể vi phạm NDA và điều khoản hợp đồng.
3. **Mất bản lĩnh:** nếu bạn không giải thích được code bạn giao, khách phỏng vấn hoặc code review sẽ phát hiện ngay, và uy tín của bạn coi như xong.

Nguyên tắc gốc: **AI viết, bạn kiểm**. Mọi dòng code ra khỏi editor của bạn phải là dòng bạn hiểu và bảo vệ được.

### Dùng AI để code: vạch đỏ
Dùng AI cho:
- Viết code lặp lại (DTO, mapper, controller khung), sinh unit test, viết javadoc.
- Giải thích code cũ, đề xuất cách refactor, tìm chỗ có thể có N+1 query.
- Viết script deploy, file cấu hình mẫu.

Không giao khi:
- Bạn chưa chạy và đọc kết quả. Code AI hay "trông đúng" nhưng sai logic biên (null, concurrency, transaction).
- Bạn không hiểu tại sao nó chọn cách đó — khách hỏi "vì sao dùng cái này" là bạn lộ.
- Code dính tới bảo mật (auth, xử lý token, truy vấn SQL ghép chuỗi) mà bạn không tự kiểm.

Quy trình an toàn: AI sinh → bạn đọc từng dòng → chạy test → tự viết lại phần quan trọng theo cách bạn hiểu → mới commit. Đừng copy nguyên một khối 200 dòng rồi giao.

### Dùng AI để viết proposal
AI viết proposal rất nhanh, nhưng proposal hàng loạt giống nhau bị khách nhận ra ngay và bỏ qua. Cách dùng đúng:
- Dùng AI để **diễn đạt lại** ý của bạn cho gọn, không để AI bịa kinh nghiệm bạn không có.
- Luôn thêm 1–2 câu cụ thể về job đó (tên hệ thống, công nghệ khách nhắc) để chứng minh bạn đã đọc.
- Đọc lại, cắt mọi câu sáo rỗng ("I am a hardworking developer passionate about...").

### Không dán secret và dữ liệu khách vào công cụ AI
Đây là ranh giới dễ vi phạm nhất. Trước khi dán bất cứ thứ gì vào công cụ AI, hỏi: "Thứ này có phải bí mật của khách không?" Nếu có, đừng dán khi chưa được phép bằng văn bản.
- **Secret:** API key, mật khẩu, token, chuỗi kết nối database, file .env. Dán vào AI = có thể bị lưu, bị rò.
- **Dữ liệu khách:** dump database thật, log có thông tin người dùng, mã nguồn riêng tư, hợp đồng, NDA.
- **Cách làm thay thế:** che (redact) mọi giá trị nhạy cảm thành {{DB_URL}}, {{API_KEY}} trước khi dán; hoặc mô tả vấn đề bằng lời thay vì dán nguyên file; hoặc dùng công cụ AI do chính công ty/khách cấp phép.

Nếu khách đã cho phép bằng văn bản ("you may use AI tools on this codebase"), vẫn chỉ dán phần cần thiết và che secret.

### Minh bạch với khách
Minh bạch không có nghĩa là "tôi dùng AI nên code dở". Nó có nghĩa là: bạn chịu trách nhiệm, và nếu khách hỏi, bạn trả lời thật.
- Nếu khách hỏi "bạn có dùng AI không?", trả lời thẳng: "Yes, I use AI tools to speed up boilerplate and tests, and I review and test everything before delivery."
- Nếu hợp đồng hoặc NDA cấm dùng AI cho code khách, **không dùng** — vi phạm điều khoản có thể dẫn tới chấm dứt hợp đồng và mất tiền.
- Trong lúc bàn giao, nói rõ phần nào bạn tự viết, phần nào là code sinh ra đã được bạn kiểm và test. Khách senior đánh giá cao sự trung thực này.

### Chính sách của Upwork về nội dung AI (mức nguyên tắc)
Upwork có các quy định về việc sử dụng nội dung do AI tạo ra và về việc phải trung thực với khách; chi tiết thay đổi theo thời gian nên **đọc trang Help hiện hành** thay vì học thuộc. Ở mức nguyên tắc, hãy nhớ:
- Bạn, freelancer, là người chịu trách nhiệm cho chất lượng và tính hợp lệ của thứ bạn giao, dù có dùng AI hay không.
- Không dùng AI để tạo nội dung giả mạo (proposal hàng loạt, đánh giá giả, danh tính giả).
- Tôn trọng điều khoản hợp đồng và NDA của khách về công cụ được phép dùng.

Khi nghi ngờ, hỏi thẳng bộ phận hỗ trợ của Upwork hoặc luật sư, đừng tự suy đoán.

### Ví dụ đời thực
Bạn nhận một milestone "thêm chức năng xuất báo cáo Excel". Bạn dùng AI sinh code Apache POI. Bản nháp chạy được với file 10 dòng. Bạn giao sau khi chỉ test 10 dòng. Lên production, khách có 50.000 đơn, file Excel làm treo API 30 giây và tràn heap (OutOfMemoryError). Khách bực, yêu cầu sửa gấp. Bài học: code AI không biết dữ liệu thật lớn; bạn phải tự hỏi "nếu dữ liệu gấp 5000 lần thì sao?" và test với dữ liệu lớn trước khi giao. Sau khi sửa bằng cách ghi theo lô (streaming) và test với 100k dòng, bạn giữ được uy tín — nhưng nếu test trước đã không có sự cố nào.

### Liên hệ phỏng vấn
Khi được hỏi "bạn có dùng AI trong công việc không?", câu trả lời tốt không phải "không" (không thật) mà là: "I use AI for boilerplate and test scaffolding, but I review every line, run the tests, and never paste client secrets or data into external tools without written permission." Câu này cho thấy bạn hiểu cả năng suất lẫn rủi ro — đúng thứ một senior cần.

> Senior tip: Coi AI như một thực tập sinh giỏi nhưng chưa biết ngữ cảnh khách: nó viết nhanh, bạn phải review như review code của người khác. Đặt một quy tắc bất di bất dịch: không secret, không dữ liệu khách, không dòng code nào bạn không giải thích được. Ba quy tắc đó giữ cho bạn cả uy tín lẫn tài khoản.`,
  checklist: [
    'Liệt kê 3 loại dữ liệu tuyệt đối không dán vào công cụ AI (secret, dữ liệu khách, hợp đồng/NDA).',
    'Thử che một đoạn log có key thành {{API_KEY}} trước khi dán, biến nó thành thói quen.',
    'Chọn 3 việc AI làm tốt (boilerplate, test, giải thích code cũ) và 3 việc bạn luôn tự kiểm.',
    'Viết sẵn một câu trả lời trung thực khi khách hỏi bạn có dùng AI không.',
    'Đọc trang Help của Upwork về nội dung AI và ghi lại điều khoản hợp đồng hiện tại của bạn về công cụ.',
  ],
  related: ['remote-057', 'remote-059', 'remote-061', 'remote-064', 'uw-ch-02'],
},
{
  id: 'uw-ch-12',
  order: 12,
  title: 'Kế hoạch 30 ngày đầu trên Upwork',
  icon: '🗓️',
  summary: 'Lịch từng tuần cho tháng đầu: tuần 1 hoàn thiện hồ sơ, tuần 2 apply proposal mỗi ngày, tuần 3 chốt hợp đồng nhỏ đầu tiên, tuần 4 giao và xin review đầu tiên. Kèm các chỉ số cần theo dõi và thời điểm điều chỉnh giá hoặc ngách.',
  body: `**Tóm tắt:** Tháng đầu trên Upwork không phải để "kiếm nhiều tiền" mà để **có review đầu tiên và một nhịp làm việc ổn định**. Chia 4 tuần: tuần 1 xây hồ sơ và bật xác minh, tuần 2 apply proposal chọn lọc mỗi ngày và theo dõi phễu, tuần 3 chốt một hợp đồng nhỏ làm phép thử, tuần 4 giao đúng hạn và xin review 5 sao. Song song, theo dõi vài chỉ số đơn giản để biết nên sửa hồ sơ, sửa proposal hay đổi ngách.

### Tổng quan 4 tuần
| Tuần | Mục tiêu chính | Kết quả cần có cuối tuần |
|---|---|---|
| 1 | Hồ sơ + xác minh + chọn ngách | Profile hoàn chỉnh, đã bật Identity Verification, 3 portfolio card |
| 2 | Apply proposal mỗi ngày, đo phễu | 15–25 proposal chọn lọc, có phỏng vấn đầu tiên |
| 3 | Chốt hợp đồng nhỏ đầu tiên | Một milestone nhỏ đã funded, kickoff xong |
| 4 | Giao + xin review | Giao đúng hạn, submit work, xin feedback 5 sao |

Đừng nhảy cóc: nhảy thẳng vào apply khi hồ sơ còn lủng củng là đốt Connects vô ích.

### Tuần 1 — Hồ sơ và nền tảng
Mục tiêu: để khách tìm thấy bạn và tin bạn đủ để mời phỏng vấn.
- Hoàn thiện title (chứa từ khoá Java, Spring Boot, AWS), overview 4 đoạn, 2–3 portfolio card (xem chương 2).
- Bật Identity Verification (xác minh danh tính) sớm — badge Verified làm tăng lượng khách mời.
- Cài Upwork desktop app để sẵn sàng cho hợp đồng hourly có Work Diary.
- Chọn 1 ngách chính (ví dụ payment/fintech hoặc nâng cấp hệ thống cũ) để mọi proposal xoay quanh nó.
- Đọc lại cơ chế escrow, milestone, phí (chương 1 và 6) để không bị bất ngờ.

Cuối tuần 1, nhờ một người bạn (hoặc chính bạn) đọc profile và trả lời: "Trong 10 giây, bạn có hiểu tôi làm gì và vì sao nên chọn tôi không?" Nếu không, sửa title và 2 dòng đầu overview.

### Tuần 2 — Proposal mỗi ngày, đo phễu
Mục tiêu: tạo ra cơ hội phỏng vấn. Áp dụng chương 3: lọc job (Payment Verified, budget phù hợp, posted < 7 ngày), mỗi ngày apply 2–4 job chọn lọc bằng proposal 5 phần.
- Lập một bảng theo dõi đơn giản: ngày, job, số Connects, đã được xem chưa, có phỏng vấn chưa.
- Cuối tuần, tính phễu: được xem / apply, phỏng vấn / được xem. Nếu tỷ lệ xem thấp, sửa hook và title; nếu xem cao mà không phỏng vấn, sửa phần thân proposal hoặc portfolio.
- Đừng nản nếu tuần đầu chưa có phỏng vấn — đó là bình thường. Điều chỉnh sau mỗi 10 proposal, không phải sau mỗi cái.

### Tuần 3 — Hợp đồng nhỏ đầu tiên
Mục tiêu: có một hợp đồng nhỏ, funded, để làm phép thử với khách. Chọn milestone 3–5 ngày, 200–500 USD, scope rõ (xem chương 4).
- Khi khách mời phỏng vấn, chuẩn bị 7 câu hỏi bắt buộc, hỏi kỹ "done" nghĩa là gì.
- Chốt milestone có deliverable + acceptance criteria + deadline + out of scope.
- **Chỉ bắt đầu khi milestone hiện Funded.** Kickoff, chốt kênh liên lạc và nhịp báo cáo.
- Nếu tuần 3 vẫn chưa chốt được, lùi sang tuần 4 nhưng đừng hạ giá quá thấp chỉ để có việc — review 5 sao cho job 50 USD hại hơn lợi.

### Tuần 4 — Giao và xin review đầu tiên
Mục tiêu: giao đúng hạn, submit work, lấy review 5 sao đầu tiên.
- Gửi daily update ngắn, báo sớm nếu có rủi ro trễ (chương 10).
- Khi xong, submit work trên hợp đồng kèm link, mô tả đối chiếu phạm vi, video demo ngắn.
- Nhắn khách xin feedback: "If you're happy with the work, a short review would mean a lot as I'm building my profile here."
- Đóng hợp đồng chủ động, cảm ơn, và hỏi về nhu cầu tiếp theo (chương 9).

Review đầu tiên là tài sản lớn nhất của tháng đầu — nó mở khoá tâm lý khách cho các hợp đồng sau.

### Chỉ số cần theo dõi
Chỉ cần vài con số, cập nhật hàng tuần:
- **Số proposal / tuần** và **số Connects** đã tiêu.
- **Tỷ lệ được xem / apply** (mục tiêu tham khảo ≥ 50%).
- **Tỷ lệ phỏng vấn / được xem** (mục tiêu ≥ 30%).
- **Số hợp đồng đang chạy** và **thu nhập thực nhận** (sau phí, chương 6).
- **JSS và số review** (chương 7).

Đừng theo dõi quá nhiều chỉ số — bốn đến năm con số đủ để biết cần sửa gì.

### Khi nào điều chỉnh giá hoặc ngách
- **Điều chỉnh giá** khi: tỷ lệ phỏng vấn cao nhưng tỷ lệ chốt thấp (giá đang cao so với bằng chứng), hoặc bạn liên tục bị khách mặc cả. Tăng giá 10–15% trên hợp đồng mới khi đã có 3–5 review tốt và JSS ≥ 90% (chương 2 và 9).
- **Đổi ngách** khi: sau 20–30 proposal bạn không có phỏng vấn nào trong ngách đó — có thể ngách quá cạnh tranh hoặc hồ sơ chưa khớp. Thử một ngách khác ít người làm hơn (chương 9).
- **Giữ nguyên** khi: đang có nhịp phỏng vấn đều và review tốt — đừng sửa hồ sơ mỗi tuần, hãy để nó chạy.

### Ví dụ đời thực
Một dev Java 4 năm ở Việt Nam, tháng đầu: tuần 1 làm profile mất 6 tiếng; tuần 2 apply 18 proposal, được xem 9, phỏng vấn 2; tuần 3 chốt một milestone 350 USD (thêm API tìm kiếm cho một app Node nhỏ), funded; tuần 4 giao sau 4 ngày, submit work, khách để lại 5 sao kèm "clear communication, delivered on time". Cuối tháng: 1 review, JSS chưa có nhưng đã có bằng chứng đầu tiên. Tháng 2, tỷ lệ được mời tăng rõ vì profile đã có review — đó là mục tiêu thật của 30 ngày đầu.

### Liên hệ phỏng vấn
Nếu được hỏi "kế hoạch 90 ngày đầu freelance của bạn là gì?", bạn có thể trả lời: "Month one is about the first review and a repeatable rhythm: profile, daily targeted proposals, one small funded contract, then deliver and ask for feedback. I track a few funnel numbers weekly and adjust price or niche only when the data says so." Câu này cho thấy bạn làm có hệ thống, không cảm tính.

> Senior tip: Tháng đầu, đừng đo thành công bằng tiền — hãy đo bằng "một review 5 sao và một quy trình lặp lại được". Tiền đến sau khi bạn có bằng chứng và nhịp ổn định. Nếu cuối tháng 1 bạn có 1 review tốt, 2–3 khách quay lại trong danh sách liên lạc, và một bảng theo dõi phễu, bạn đã đi đúng hướng — dù tài khoản chỉ nhích nhẹ.`,
  checklist: [
    'Lên lịch 4 tuần: tuần 1 hồ sơ, tuần 2 proposal, tuần 3 hợp đồng nhỏ, tuần 4 giao và xin review.',
    'Tạo bảng theo dõi phễu 5 cột: proposal, Connects, được xem, phỏng vấn, hợp đồng.',
    'Đặt mục tiêu tuần 2 là 15–25 proposal chọn lọc, không phải apply càng nhiều càng tốt.',
    'Viết sẵn tin nhắn xin review sau khi giao, và chỉ gửi khi khách thực sự hài lòng.',
    'Chọn 2 ngưỡng điều chỉnh: phỏng vấn/tháng và JSS, ghi lại mốc để quyết định tăng giá.',
  ],
  related: ['remote-001', 'remote-003', 'remote-031', 'remote-033', 'remote-047', 'uw-ch-02', 'uw-ch-03'],
},
);
