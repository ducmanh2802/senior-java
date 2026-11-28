/* CCAR-P (Claude Certified Architect – Professional) practice questions (topic claude, tag "[Domain]" = exam domain in js/data/exams.js): tasks T2178–T2181. Format: AGENTS.md mục 4 (QUIZ). */
(window.QUIZ = window.QUIZ || []).push(
// qtool append point
{
  id: 'qz-ccap-056',
  topic: 'claude',
  q: '[Enterprise Integration] A bank is adding an AI assistant to its mobile app. The assistant must keep the last ten turns of each conversation, and a user must be able to resume a chat days later on a different device. The team plans to call the Messages API directly. What is the most appropriate design?',
  options: [
    'Keep the conversation in device memory so the user never has to send it to the bank',
    'Pass a conversation id returned by the API and let the API restore the previous turns',
    'Treat the API as stateless, persist the transcript on the bank side, and rebuild the message array on every request',
    'Send only the newest message and rely on the model to remember earlier turns'
  ],
  answer: 2,
  explain: `**Đúng: Messages API không giữ trạng thái, nên phía gọi phải lưu hội thoại.** Mỗi request là một lần gọi độc lập: bạn gửi mảng messages, API trả lời, rồi quên. Muốn bot nhớ mười lượt, ngân hàng phải lưu transcript ở phía server (thường là một bảng conversation và một bảng message) rồi dựng lại mảng messages đúng thứ tự khi cần gọi tiếp. Nhờ vậy người dùng resume được trên thiết bị khác, vì trạng thái nằm ở ngân hàng chứ không nằm ở máy.

### Vì sao các phương án khác sai
- **Giữ trong bộ nhớ thiết bị:** đổi điện thoại hoặc xoá app là mất ngữ cảnh; ngoài ra hội thoại khách hàng là dữ liệu cần quản trị tập trung, không nên phân tán theo thiết bị.
- **Conversation id từ API:** Messages API trả về id của message, không phải một conversation id, và không tự lưu các lượt trước; không có gì để resume bằng id đó.
- **Chỉ gửi tin nhắn mới nhất:** model chỉ thấy đúng nội dung được gửi. Ở lượt thứ ba nó không biết khách đã nói gì ở lượt một và hai, nên trả lời sai ngữ cảnh.

### Cách làm cụ thể
Lưu tối thiểu: conversation_id, role, nội dung, thời điểm. Khi gửi, lấy N lượt gần nhất, cắt phần cũ nếu gần đầy context, rồi gọi API. Giới hạn mười lượt vừa đủ ngữ cảnh vừa giảm số token phải trả tiền.

> Nguyên tắc: coi mọi API model là stateless; mọi trạng thái hội thoại là việc của bạn.`
},
{
  id: 'qz-ccap-057',
  topic: 'claude',
  q: '[Enterprise Integration] A document platform must label 2 million support tickets overnight. The labels are needed by the next morning, not in real time. The current design fires one Messages API call per ticket from a web server pool and keeps hitting rate limits. Which change best fits the workload?',
  options: [
    'Move the job to the Message Batches API and submit the work asynchronously for the lower-cost non-urgent path',
    'Keep the real-time loop and add more application servers to raise throughput',
    'Merge all tickets into one prompt with a very large max_tokens',
    'Run the job from a developer laptop with Claude Code in headless mode'
  ],
  answer: 0,
  explain: `**Đúng: Message Batches API dành cho khối lượng lớn, không cần tức thời.** Batch cho phép nộp hàng loạt request rồi nhận kết quả sau, có thể mất tới 24 giờ, với chi phí thấp hơn so với gọi đồng bộ. Việc gán nhãn hai triệu ticket mỗi đêm đúng dạng bài toán này: chênh lệch vài giờ không ảnh hưởng, và bạn không phải giữ hàng nghìn kết nối đồng thời.

### Vì sao các phương án khác sai
- **Thêm server để tăng throughput:** vẫn là gọi đồng bộ theo thời gian thực; rate limit không được nới, chi phí không giảm, chỉ dời điểm nghẽn sang chỗ khác.
- **Gộp tất cả vào một prompt:** mỗi ticket là một mẫu độc lập; nhồi vào một prompt làm ngữ cảnh dài, dễ lẫn, khó parse, và vẫn vượt giới hạn kích thước.
- **Chạy từ laptop bằng Claude Code:** công cụ dòng lệnh cho lập trình, không phải hệ thống xử lý dữ liệu hàng loạt có kiểm soát, không có SLA, không có audit.

### Lưu ý thiết kế
Batch vẫn cần: chia nhỏ lô để dễ thử lại, lưu mapping giữa kết quả và dữ liệu gốc, và tự chống gửi trùng (idempotency) ở phía bạn vì batch không lo việc đó thay bạn.

> Với khối lượng lớn và không gấp, batch gần như luôn là lựa chọn mặc định trước khi nghĩ tới tối ưu đồng bộ.`
},
{
  id: 'qz-ccap-058',
  topic: 'claude',
  q: '[Enterprise Integration] A tax advisory service sends the same 12,000-word excerpt of tax rules plus one short user question on every request, 40,000 times a day. The architect must cut cost and latency without changing the answers. Which change is most appropriate?',
  options: [
    'Randomise the order of the rule sections per request so the provider can find more reuse',
    'Lower max_tokens so fewer output tokens are billed',
    'Split the excerpt into 40,000 small prompts to avoid cache writes',
    'Keep the static excerpt first as a stable prefix, mark a cache breakpoint with {{cache_control}}, and put the user question after it'
  ],
  answer: 3,
  explain: `**Đúng: prompt caching hoạt động theo prefix, nên phần tĩnh phải đứng trước và thật ổn định.** Mỗi request, API so khớp phần đầu prompt với cache; nếu giống, phần đó được đọc từ cache thay vì tính lại. Đánh dấu breakpoint bằng {{cache_control}} ở cuối phần tĩnh để cache biết ranh giới. Phần tĩnh được tính một lần, các lần sau chỉ trả tiền đọc cache, rẻ hơn nhiều.

### Vì sao các phương án khác sai
- **Xáo thứ tự mỗi request:** mỗi lần thứ tự khác nhau thì prefix khác nhau, không khớp cache, mất hết lợi ích.
- **Giảm max_tokens:** chỉ giới hạn độ dài output, không ảnh hưởng tới phần đầu vào đang bị tính lại mỗi ngày.
- **Chia thành 40.000 prompt nhỏ:** phá vỡ prefix dùng chung, tăng số request và mất phần lớn khả năng tái sử dụng.

### Ví dụ
Nếu mỗi request có 12.000 từ tĩnh cộng 30 từ câu hỏi, phần tĩnh chiếm gần như toàn bộ input token. Cache đúng cách biến chi phí chính từ trả tiền cho 12.000 từ mỗi lần thành trả tiền một lần ghi cộng đọc rẻ.

> Điều kiện: prefix phải thực sự giống nhau từng ký tự, kể cả khoảng trắng và thứ tự mục, thì mới khớp.`
},
{
  id: 'qz-ccap-059',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] During a product launch, a customer portal sends Claude requests in bursts and starts receiving 429 responses with a retry-after header. Which two changes best protect users? (Choose 2)',
  options: [
    'Retry immediately in a tight loop until the call succeeds',
    'Queue requests behind a rate limiter and use exponential backoff with jitter',
    'Return a friendly busy state or a queued position when the limit is reached, instead of an error page',
    'Disable prompt caching so requests look smaller',
    'Move all traffic to a single large model to reduce the number of calls'
  ],
  answer: [1, 2],
  explain: `**Đúng: hàng đợi cộng backoff, và phản hồi rõ ràng thay vì lỗi.** Rate limit là giới hạn tốc độ, không phải lỗi hệ thống. Hàng đợi giúp giữ số request mỗi giây dưới ngưỡng; exponential backoff có jitter tránh việc hàng nghìn client thử lại cùng lúc, hiện tượng gọi là thundering herd. Khi hàng đợi đầy, nói cho người dùng biết và cho thử lại sau thay vì trả trang lỗi.

### Vì sao các phương án còn lại sai
- **Retry ngay trong vòng lặp:** mỗi lần vượt giới hạn lại bị chặn; còn làm tăng tải và kéo dài thời gian chờ.
- **Tắt prompt caching:** không liên quan tới 429; chỉ làm chi phí và độ trễ xấu hơn.
- **Dồn sang một model lớn:** số request không giảm, mà mỗi request còn đắt và chậm hơn.

### Số liệu để theo dõi
Theo dõi tỉ lệ 429, độ trễ đuôi p95 và p99, độ sâu hàng đợi. Nếu 429 vẫn cao sau khi thêm hàng đợi, cần xin tăng hạn mức hoặc giảm tải ở nguồn.

> Backoff phải có jitter: nếu không, các client sẽ đồng bộ nhịp thử lại và tiếp tục tạo đỉnh tải.`
},
{
  id: 'qz-ccap-060',
  topic: 'claude',
  q: '[Enterprise Integration] A European healthcare group must keep patient data inside the EU. Legal approved Claude for a document summarisation feature but blocked calls that leave the region. Which integration approach best satisfies this constraint?',
  options: [
    'Call the Anthropic API directly from an EU office and shorten the timeout',
    'Use Claude models through a cloud platform that runs them in an EU region, such as Amazon Bedrock or Google Vertex AI, and keep storage in that region',
    'Strip patient names before the request and send the rest anywhere',
    'Run Claude Code on developer laptops located in the EU'
  ],
  answer: 1,
  explain: `**Đúng: dùng Claude qua nền tảng cloud có vùng EU.** Claude được cung cấp qua Amazon Bedrock và Google Vertex AI; khi bạn chọn region EU cho dịch vụ đó, dữ liệu được xử lý trong vùng đã chọn, phù hợp với yêu cầu lưu trú dữ liệu. Đây là cách thường được doanh nghiệp EU dùng khi không được phép gọi ra ngoài vùng.

### Vì sao các phương án khác sai
- **Gọi API trực tiếp từ EU rồi rút timeout:** vị trí máy gọi không quyết định nơi suy luận diễn ra; timeout chỉ là tham số, không phải kiểm soát dữ liệu.
- **Ẩn tên rồi gửi đi bất cứ đâu:** ẩn tên không loại bỏ toàn bộ dữ liệu cá nhân, mã hồ sơ, ngày sinh hay chẩn đoán vẫn có thể định danh được; và bạn không chứng minh được với cơ quan quản lý.
- **Chạy Claude Code trên laptop:** công cụ cho lập trình, không phải kênh xử lý dữ liệu bệnh nhân có kiểm soát tập trung.

### Điều cần kiểm tra
Xác nhận model bạn cần có mặt trên nền tảng đó ở region đó, và kiểm tra điều khoản lưu trữ log của nền tảng. Kiến trúc nên để một lớp cấu hình provider và region để đổi được khi cần.

> Nguyên tắc: yêu cầu pháp lý nên được giải quyết bằng lựa chọn hạ tầng, không bằng lời hứa trong prompt.`
},
{
  id: 'qz-ccap-061',
  topic: 'claude',
  q: '[Enterprise Integration] A payments team is embedding Claude into a new service. Developers need to test locally, CI runs integration tests, and production credentials must never leak. Which key strategy is best?',
  options: [
    'Use one production key everywhere, including the mobile client, to keep things simple',
    'Commit the key to the repository and encrypt the string with a simple cipher',
    'Issue separate credentials per environment, store them in a secret manager, and load them at runtime only on the server',
    'Rotate the shared key once a year and reuse it across all teams to simplify audits'
  ],
  answer: 2,
  explain: `**Đúng: mỗi môi trường một credential, giữ trong secret manager, chỉ nạp ở server.** Dev, CI và production có mức rủi ro khác nhau; dùng chung một key nghĩa là một key bị lộ là lộ cả production. Secret manager cho phép phân quyền, xoay vòng và audit ai đọc gì. Client như app hay browser không bao giờ được giữ key, vì mọi thứ gửi xuống client đều đọc được.

### Vì sao các phương án khác sai
- **Một key dùng mọi nơi, kể cả mobile:** nhúng key vào app là đưa key cho mọi người dùng; không có cách thu hồi an toàn khi bị trích xuất.
- **Commit key đã mã hoá bằng cipher tự chế:** khoá giải mã cũng nằm trong repo nên chỉ là che mắt; hơn nữa secret vẫn đi vào lịch sử git.
- **Xoay vòng mỗi năm một lần:** quá chậm so với thực tế; nên xoay định kỳ ngắn hơn và ngay khi nghi ngờ lộ.

### Thực hành
Tách key theo môi trường và theo service, giới hạn quyền tối thiểu, bật cảnh báo khi dùng bất thường, và ghi log việc truy cập key mà không ghi giá trị key.

> Kiểm tra nhanh: nếu key nằm trong git history thì coi như đã lộ, phải thu hồi chứ không chỉ xoá dòng code.`
},
{
  id: 'qz-ccap-062',
  topic: 'claude',
  q: '[Enterprise Integration] A summarisation service calls a large Claude model for every request. At peak time the API returns 529 overloaded for a growing share of calls, and the business still needs a summary. What is the best design?',
  options: [
    'Retry with backoff, then fall back to a smaller model in the same family, and degrade the output to a shorter summary rather than failing',
    'Retry the same model forever until one call succeeds',
    'Return the raw document to the user without any summary',
    'Disable streaming so the client stops noticing the delay'
  ],
  answer: 0,
  explain: `**Đúng: có đường lui và chấp nhận giảm chất lượng có kiểm soát.** 529 là quá tải tạm thời. Sau vài lần thử lại có backoff, chuyển sang model nhỏ hơn cùng dòng thường vẫn cho bản tóm tắt đủ dùng, nhanh và rẻ hơn. Quan trọng: người dùng nhận được kết quả ngắn thay vì một lỗi.

### Vì sao các phương án khác sai
- **Thử lại model lớn mãi mãi:** nếu quá tải kéo dài, request treo vô hạn; người dùng chờ rồi bỏ.
- **Trả nguyên văn tài liệu:** đẩy việc đọc hàng chục trang sang người dùng, đúng thứ họ muốn tránh.
- **Tắt streaming:** không giải quyết quá tải, chỉ làm trải nghiệm tệ hơn khi phải chờ.

### Thiết kế fallback
Cần một chính sách rõ: ngưỡng lỗi, số lần thử, model dự phòng, và điều kiện quay lại model chính. Fallback phải được ghi log để biết hệ thống đang chạy ở chế độ nào, tránh chạy âm thầm ở mức thấp hàng tuần mà không ai biết.

> Một hệ thống tốt không phải hệ thống không bao giờ lỗi, mà là hệ thống còn trả lời đúng khi thành phần chính chậm hoặc lỗi.`
},
{
  id: 'qz-ccap-063',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] An internal platform team wants to expose three capabilities to Claude through one MCP server: a searchable policy library, an action that opens a support ticket, and a reusable prompt for triaging incidents. Which mapping of MCP primitives is correct? (Choose 3)',
  options: [
    'Expose the policy library as resources that the client can read',
    'Expose the open-ticket action as a tool with a clear input schema',
    'Expose the triage instructions as a prompt the host can invoke',
    'Expose the open-ticket action as a resource so the model reads it as text',
    'Expose the policy library as a tool that ignores its arguments'
  ],
  answer: [0, 1, 2],
  explain: `**Đúng: resource cho dữ liệu để đọc, tool cho hành động, prompt cho mẫu chỉ dẫn.** MCP phân biệt ba primitive: resources là nội dung để client đọc, tools là hành động có input schema để model gọi, prompts là mẫu do người dùng hoặc host chọn để bắt đầu phiên. Ánh xạ đúng giúp client và model hiểu đúng bản chất từng thứ.

### Vì sao các phương án còn lại sai
- **Hành động mở ticket thành resource:** resource chỉ để đọc; model không thực thi nó, nên không mở được ticket.
- **Thư viện policy thành tool bỏ qua tham số:** tool phải có input schema rõ ràng và có tác dụng phụ khi gọi; ép dữ liệu tĩnh vào tool làm model hiểu sai mục đích và gây nhiễu khi chọn.

### Gợi ý triển khai
Đặt tên tool theo động từ và bối cảnh, mô tả input bằng JSON Schema, trả về lỗi có cấu trúc để model sửa. Với resource, cung cấp URI ổn định và metadata để client chọn đúng.

> Nguyên tắc thiết kế MCP: mỗi primitive trả lời một câu hỏi khác nhau, đọc cái gì, làm gì, bắt đầu thế nào.`
},
{
  id: 'qz-ccap-064',
  topic: 'claude',
  q: '[Enterprise Integration] A claims system asks Claude to read 40 pages of documents per claim and then call three internal services. One request takes about 90 seconds, and the browser gives up. Which design fits?',
  options: [
    'Raise the browser timeout to five minutes and keep the call synchronous',
    'Send the 40 pages as 40 separate messages inside one request',
    'Turn off streaming so the client waits quietly',
    'Accept the request, return a job id, process it in the background, and let the UI poll or subscribe for status'
  ],
  answer: 3,
  explain: `**Đúng: tách khỏi vòng đời HTTP bằng job cộng polling hoặc subscription.** 90 giây vượt xa ngưỡng chịu đựng của trình duyệt và của nhiều proxy. Mô hình đúng: request trả về job id ngay, công việc chạy ở worker, UI hỏi tiến độ hoặc nhận cập nhật. Người dùng thấy đang xử lý thay vì timeout, và bạn kiểm soát được retry, hàng đợi, giới hạn tài nguyên.

### Vì sao các phương án khác sai
- **Nâng timeout trình duyệt lên năm phút:** trình duyệt, proxy và load balancer đều có thể cắt; và người dùng không kiên nhẫn chờ năm phút trước màn hình trắng.
- **Gửi 40 trang thành 40 message trong một request:** vẫn là một request 90 giây; chỉ đổi cách mô tả, không giải quyết thời gian chờ.
- **Tắt streaming:** không làm ngắn thời gian xử lý, chỉ bỏ tín hiệu tiến độ.

### Lưu ý
Job system cần: trạng thái rõ ràng gồm queued, running, done, failed; thông báo khi xong; và khả năng chạy lại an toàn nếu worker chết giữa đường.

> Với tác vụ dài, hãy thiết kế cho gửi rồi nhận sau ngay từ đầu; thêm nó về sau thường đắt hơn nhiều.`
},
{
  id: 'qz-ccap-065',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] An assistant can issue refunds up to an approved limit. In testing the model once called the refund tool for a case that needed a human decision. Which two changes most directly reduce the risk? (Choose 2)',
  options: [
    'Lengthen the system prompt with more warnings about careful behaviour',
    'Set temperature to zero so the model becomes deterministic',
    'Require an explicit human approval step before the refund executes',
    'Notify the manager by email after the refund has already been issued',
    'Enforce the refund limit and the allowed actions in the backend, not only in the prompt'
  ],
  answer: [2, 4],
  explain: `**Đúng: chặn ở lớp thực thi, không chỉ ở lớp lời nhắc.** System prompt là chỉ dẫn, model có thể hiểu sai hoặc bị thuyết phục bởi dữ liệu độc hại. Với hành động có hậu quả như hoàn tiền, phải có bước phê duyệt của người và ràng buộc ở backend: kiểm tra hạn mức, quyền, trạng thái đơn hàng ngay trước khi thực thi.

### Vì sao các phương án còn lại sai
- **Viết prompt dài hơn:** tăng khả năng model hiểu nhưng không tạo ra ranh giới cưỡng chế được.
- **Đặt temperature bằng 0:** giảm ngẫu nhiên, không loại bỏ sai sót logic; model vẫn có thể chọn sai tool.
- **Email báo sau khi đã hoàn tiền:** hậu quả đã xảy ra; thông báo không phải kiểm soát.

### Cách kiểm thử
Tạo bộ tình huống có cả ca được phép và ca phải chuyển người, chạy trước mỗi lần đổi prompt hoặc model. Đo tỉ lệ gọi tool sai, không chỉ đo tỉ lệ câu trả lời hay.

> Nguyên tắc least privilege cho agent: tool nguy hiểm thì thêm một bước người, và luôn kiểm tra lại ở phía hệ thống.`
},
{
  id: 'qz-ccap-066',
  topic: 'claude',
  q: '[Enterprise Integration] Thirty product teams share one Claude integration. Finance wants cost per team, and the SRE team wants latency and error rates per endpoint. Which design best supports both?',
  options: [
    'Ask every team to self-report token counts from their own logs',
    'Split into thirty separate provider accounts so no reporting work is needed',
    'Route all calls through one internal gateway that records usage, latency and errors per caller and endpoint, and use the usage and cost reports from the provider',
    'Log errors only, because token counts are not actionable'
  ],
  answer: 2,
  explain: `**Đúng: một gateway nội bộ làm điểm đo và điểm kiểm soát.** Khi mọi request đi qua một lớp chung, lớp đó biết ai gọi, gọi endpoint nào, tốn bao nhiêu token, mất bao lâu, lỗi gì. Từ đó tính được chi phí theo team và theo dõi SLO theo endpoint. Báo cáo usage và cost của provider không tự biết team nào nếu bạn không gắn nhãn ở lớp của mình.

### Vì sao các phương án khác sai
- **Tự khai báo token từ log mỗi team:** số liệu phân tán, mỗi nơi đếm một kiểu, khó đối chiếu và không có nguồn sự thật.
- **Chia ba mươi account riêng:** cực đoan, khó vận hành, và không thay thế được quan sát theo endpoint.
- **Chỉ log lỗi:** mất phần lớn thông tin về chi phí và độ trễ, hai thứ mà tài chính và SRE cần nhất.

### Thiết kế gateway
Bắt buộc: request id, caller, model, phiên bản prompt, token in và out, cache hit, latency, status. Cảnh báo khi chi phí mỗi ngày vượt ngưỡng hoặc tỉ lệ lỗi tăng.

> Nếu chỉ đo được một thứ, hãy đo theo caller: nó vừa phục vụ chargeback vừa phát hiện team nào đang dùng bất thường.`
},
{
  id: 'qz-ccap-067',
  topic: 'claude',
  q: '[Enterprise Integration] A retailer wants Claude to summarise customer emails. Some emails contain card numbers and national identity numbers, and the security team requires data minimisation. What should the architecture do?',
  options: [
    'Send the full email and trust the model to ignore sensitive values',
    'Redact or tokenise sensitive fields before the request and keep the mapping only in systems of the company',
    'Disable all logging so the data is not retained',
    'Ask customers to remove their own card numbers before writing in'
  ],
  answer: 1,
  explain: `**Đúng: giảm thiểu dữ liệu trước khi gửi.** Nguyên tắc là chỉ gửi những gì cần cho tác vụ. Với email có số thẻ và căn cước, bước tiền xử lý nên phát hiện và thay bằng token hoặc placeholder, giữ mapping trong hệ thống của công ty để khôi phục khi cần. Cách này giảm phạm vi dữ liệu cá nhân rời khỏi hệ thống, và làm việc tuân thủ dễ hơn nhiều.

### Vì sao các phương án khác sai
- **Gửi hết rồi tin model bỏ qua:** model không phải bộ lọc bảo mật; dữ liệu vẫn đã rời khỏi hệ thống và vẫn có thể nằm trong log của nhà cung cấp.
- **Tắt log:** log là công cụ điều tra sự cố; tắt log không làm dữ liệu an toàn hơn, chỉ làm bạn mù khi có sự cố.
- **Bảo khách tự xoá số thẻ:** đẩy nghĩa vụ sang người dùng, trải nghiệm tệ và không giải quyết dữ liệu đã gửi trong lịch sử.

### Kiểm tra
Đo tỉ lệ phát hiện của bước redaction trên tập mẫu; đặt ngưỡng và chạy lại khi đổi model hoặc luật. Kết hợp với chính sách lưu trữ và quyền truy cập.

> Redaction là kiểm soát phòng ngừa; nó không thay thế việc chọn đúng kênh xử lý dữ liệu và đúng điều khoản.`
},
{
  id: 'qz-ccap-068',
  topic: 'claude',
  q: '[Enterprise Integration] The system prompt of a support bot is edited almost weekly, and quality has been quietly degrading. Which practice best prevents silent regressions?',
  options: [
    'Keep prompts in version control, run a fixed evaluation set on every change, and promote only when quality metrics hold',
    'Let each engineer edit the production prompt directly from the dashboard',
    'Remove the system prompt so behaviour cannot change',
    'Increase max_tokens after every prompt edit'
  ],
  answer: 0,
  explain: `**Đúng: prompt là code, phải có review và test.** Khi prompt nằm trong version control, mọi thay đổi đều truy vết được. Một tập eval cố định chạy trên mỗi thay đổi cho biết chất lượng tăng hay giảm; chỉ promote khi các chỉ số đạt ngưỡng. Đây là cách duy nhất để thấy một sự thoái hoá nhỏ mà người dùng chưa kịp báo.

### Vì sao các phương án khác sai
- **Sửa trực tiếp trên production:** không có lịch sử, không thể so sánh, không thể rollback; một lỗi nhỏ có thể tồn tại hàng tuần.
- **Bỏ system prompt:** lấy đi phần định hướng hành vi; không phải giải pháp cho việc thiếu kiểm soát.
- **Tăng max_tokens:** chỉ đổi độ dài output, không liên quan tới chất lượng prompt.

### Quy trình tối thiểu
Mỗi prompt có: phiên bản, mô tả thay đổi, tập eval, ngưỡng đậu, người review. Khi đổi model hoặc đổi cấu hình tool, chạy lại cùng tập eval để so sánh công bằng.

> Prompt không có eval giống như code không có test: bạn chỉ biết nó hỏng khi có người phàn nàn.`
},
{
  id: 'qz-ccap-069',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] A SaaS provider hosts 200 customer tenants on one Claude integration. No tenant may see data of another tenant, and one heavy tenant must not consume the whole shared quota. Which two measures are essential? (Choose 2)',
  options: [
    'Use one API key for all tenants and add the tenant name to each prompt',
    'Enforce tenant isolation in the application layer and keep all provider credentials server-side',
    'Apply per-tenant rate limits or quotas in front of the shared integration',
    'Give each tenant a separate browser session on the same account',
    'Rely on prompt caching to keep tenant data apart'
  ],
  answer: [1, 2],
  explain: `**Đúng: cách ly dữ liệu ở lớp ứng dụng và đặt hạn mức theo tenant.** Dùng chung một credential không sai, miễn là ứng dụng luôn lọc theo tenant_id ở mọi truy vấn và không bao giờ để dữ liệu tenant này lẫn sang tenant khác. Nhưng chia sẻ tài nguyên thì phải có quota: một tenant gửi gấp trăm lần lưu lượng trung bình sẽ làm chậm tất cả.

### Vì sao các phương án còn lại sai
- **Thêm tên tenant vào prompt rồi dùng chung key:** tên trong prompt không phải cơ chế cách ly; nếu truy xuất hoặc log sai, dữ liệu vẫn lẫn.
- **Mỗi tenant một phiên browser trên cùng account:** phiên browser không tạo ranh giới dữ liệu phía máy chủ.
- **Dựa vào prompt caching để tách tenant:** cache là cơ chế tối ưu chi phí, không phải cơ chế phân quyền; không được dùng làm ranh giới an toàn.

### Nên có
Kiểm thử cách ly: mỗi tenant truy cập chéo phải bị từ chối; kiểm thử tải: một tenant bão hoà không được làm sập tenant khác. Ghi log theo tenant để truy vết.

> Câu hỏi kiến trúc: ranh giới an toàn nằm ở đâu? Câu trả lời đúng luôn là ở lớp máy chủ của bạn, không phải trong prompt.`
},
{
  id: 'qz-ccap-070',
  topic: 'claude',
  q: '[Enterprise Integration] A platform team is building one internal layer over Claude so product teams never call the provider API directly. Which responsibility belongs in that layer?',
  options: [
    'Hard-code one model name and one prompt template per product team',
    'Store raw provider keys inside each product team repository',
    'Forward every product request unchanged with no timeout and no retry',
    'Own credentials, retries, rate limiting, logging, prompt versioning and model routing, and expose a stable internal interface'
  ],
  answer: 3,
  explain: `**Đúng: lớp nội bộ sở hữu những thứ không nên phân tán cho từng team.** Nếu mỗi team tự gọi provider, bạn có ba mươi cách xử lý retry, ba mươi nơi giữ key, ba mươi định dạng log và ba mươi phiên bản prompt. Một lớp chung gom các mối quan tâm ngang: credential, rate limit, retry và backoff, timeout, log và metrics, versioning prompt, định tuyến model.

### Vì sao các phương án khác sai
- **Hard-code model và prompt cho từng team:** đóng cứng, mỗi lần đổi model phải sửa ba mươi nơi.
- **Để key trong repo từng team:** nhân bản rủi ro lộ key, không thu hồi tập trung được.
- **Forward nguyên trạng, không timeout và không retry:** một provider chậm sẽ kéo theo mọi team; không có cách đo hay chặn.

### Ranh giới thiết kế
Lớp chung nên ổn định và ít thay đổi, đó là hợp đồng nội bộ; còn phần thay đổi nhanh như prompt và tiêu chí nên tách ra và có quy trình phát hành riêng. Đừng biến lớp chung thành nơi chứa logic nghiệp vụ của từng team.

> Một lớp tích hợp tốt làm cho việc gọi Claude trở thành một dependency nội bộ, không phải một quan hệ nhà cung cấp mà mỗi team tự lo.`
},
{
  id: 'qz-ccap-071',
  topic: 'claude',
  q: '[Solution Design] A company wants an assistant that answers employee questions from 4,000 internal policy documents that change monthly. A wrong answer is costly, answers must cite the exact passage, and the corpus does not fit in one prompt. Which design fits best?',
  options: [
    'Retrieve the relevant passages with citations, and send only those passages plus the question to Claude',
    'Paste all 4,000 documents into the system prompt and rebuild the prompt every day',
    'Custom-train a model on the documents so it memorises them',
    'Ask users to search the documents themselves and use Claude only for formatting'
  ],
  answer: 0,
  explain: `**Đúng: retrieval cộng trích dẫn, không nhồi cả kho tài liệu.** 4.000 tài liệu không vừa một prompt, và kể cả vừa thì mỗi câu hỏi chỉ cần vài đoạn. Kiến trúc chuẩn: chia tài liệu thành đoạn, lập index, truy xuất theo câu hỏi, rồi gửi kèm câu hỏi các đoạn liên quan nhất. Yêu cầu trích dẫn buộc hệ thống giữ được nguồn gồm file và mục cho từng đoạn, nên người đọc kiểm chứng được.

### Vì sao các phương án khác sai
- **Nhồi 4.000 tài liệu vào system prompt:** vượt context, chi phí khổng lồ mỗi request, và tỉ lệ trúng thông tin giảm khi ngữ cảnh quá dài. Tài liệu đổi hàng tháng nghĩa là bạn còn phải nạp lại liên tục.
- **Tự huấn luyện để model nhớ tài liệu:** không phải cách được khuyến nghị cho tri thức riêng thay đổi liên tục; khó cập nhật, khó trích dẫn, khó kiểm chứng.
- **Chỉ dùng Claude để format:** bỏ mất giá trị chính là trả lời; người dùng vẫn phải tự đọc.

### Thiết kế chunk
Chunk theo ranh giới ngữ nghĩa như mục và đoạn, kèm metadata gồm nguồn, phiên bản, ngày. Khi tài liệu đổi, cập nhật index theo version để câu trả lời cũ vẫn truy vết được.

> Chỉ số cần đo: tỉ lệ câu trả lời có trích dẫn đúng, và tỉ lệ nói không tìm thấy thay vì trả lời bừa.`
},
{
  id: 'qz-ccap-072',
  topic: 'claude',
  q: '[Solution Design] A customer support assistant must answer in under two seconds for simple questions but also handle complex troubleshooting that needs reasoning. Quality on the complex cases is the priority. Which routing design is best?',
  options: [
    'Send everything to the largest model so quality is highest everywhere',
    'Send everything to the smallest model so latency is lowest everywhere',
    'Randomly pick a model per request to spread load',
    'Route simple high-volume requests to a smaller faster model and escalate hard cases to a more capable model'
  ],
  answer: 3,
  explain: `**Đúng: định tuyến theo độ khó.** Đa số câu hỏi là đơn giản như giờ mở cửa hay cách reset mật khẩu, số ít là sự cố phức tạp cần suy luận nhiều bước. Gửi tất cả cho model lớn thì đắt và chậm; gửi tất cả cho model nhỏ thì các ca khó trả lời sai. Định tuyến theo độ phức tạp cho cả hai.

### Vì sao các phương án khác sai
- **Tất cả vào model lớn nhất:** chất lượng cao nhưng chi phí và độ trễ cao cho những câu không cần.
- **Tất cả vào model nhỏ nhất:** nhanh và rẻ, nhưng các ca khó sai, đúng nhóm cần chất lượng nhất.
- **Chọn model ngẫu nhiên mỗi request:** phá vỡ tính nhất quán, khó đo, và người dùng gặp chất lượng dao động.

### Cách xác định ca khó
Dùng quy tắc rẻ trước như từ khoá, độ dài, lịch sử, hoặc dùng một lần gọi nhỏ để phân loại. Ghi nhãn model đã dùng vào log để đo chất lượng theo từng tuyến.

> Đo theo tuyến: nếu tỉ lệ tuyến nhỏ phải chuyển sang tuyến lớn tăng dần, hãy xem lại quy tắc phân loại.`
},
{
  id: 'qz-ccap-073',
  topic: 'claude',
  q: '[Solution Design] A team is about to launch a Claude feature that writes legal summaries, and they have no measurements yet. What should they build first?',
  options: [
    'A dashboard of token usage and latency',
    'A fixed evaluation set with expected answers or a scoring rubric, run before launch and on every change',
    'A bigger prompt with more examples of good summaries',
    'A weekly meeting to read user complaints'
  ],
  answer: 1,
  explain: `**Đúng: không thể cải thiện thứ chưa đo được.** Với tác vụ tóm tắt pháp lý, hay phải được định nghĩa thành tiêu chí: có giữ đủ điều khoản quan trọng không, có bịa số không, có đúng tông không. Một tập eval cố định gồm đầu vào thật, đáp án kỳ vọng hoặc rubric cho phép so sánh các phiên bản và phát hiện hồi quy.

### Vì sao các phương án khác sai
- **Dashboard token và latency:** cần thiết cho vận hành nhưng không nói gì về chất lượng nội dung.
- **Prompt dài hơn với nhiều ví dụ:** có thể giúp, nhưng nếu không đo thì không biết giúp hay làm hại.
- **Họp đọc phàn nàn:** tín hiệu quý nhưng trễ, không đại diện, và không so sánh được giữa hai phiên bản.

### Cấu trúc eval
Mỗi mẫu gồm đầu vào, tiêu chí chấm, điểm kỳ vọng. Chạy tự động khi đổi prompt hoặc model. Với tiêu chí mềm, dùng rubric và chấm bởi người hoặc model khác, rồi kiểm tra độ nhất quán giữa các lần chấm.

> Với nội dung pháp lý, eval nên có cả ca không được bịa: một câu trả lời thiếu còn sửa được, một câu bịa thì có thể gây hại thật.`
},
{
  id: 'qz-ccap-074',
  topic: 'claude',
  q: '[Solution Design] An agent extracts invoice fields by asking Claude to return JSON. About 4% of responses fail JSON parsing in production. Which change most improves reliability?',
  options: [
    'Increase temperature so answers are more diverse',
    'Ask the model in the system prompt to please return valid JSON',
    'Define a tool with a JSON Schema for the fields, validate the result, and send a corrective tool_result when validation fails',
    'Parse with a permissive parser and accept partial data'
  ],
  answer: 2,
  explain: `**Đúng: ràng buộc bằng schema và sửa khi sai.** Khi khai báo tool với input schema, model biết chính xác cần trả gì và hệ thống kiểm tra được kết quả. Nếu dữ liệu không hợp lệ, gửi lại tool_result kèm lỗi cụ thể để model tự sửa; đây là vòng lặp sửa lỗi chuẩn trong tool use.

### Vì sao các phương án khác sai
- **Tăng temperature:** làm output đa dạng hơn, tức là khó kiểm soát cấu trúc hơn.
- **Nhờ trong prompt hãy trả JSON hợp lệ:** chỉ là lời nhắc; không có gì đảm bảo và không có cơ chế phát hiện.
- **Parser dễ dãi nhận dữ liệu một phần:** che lỗi; dữ liệu thiếu sẽ đi tiếp vào hệ thống và gây sai lệch khó truy vết.

### Kiểm thử
Đo tỉ lệ parse thành công sau vòng sửa; ghi lại các lỗi schema hay gặp để siết mô tả. Nếu một trường luôn sai, xem lại tên trường và mô tả.

> Với JSON, model trả đúng là chuyện xác suất; hệ thống kiểm tra và sửa mới là thiết kế.`
},
{
  id: 'qz-ccap-075',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A leadership team wants a Claude feature evaluated before launch and after each change. Which two practices give the most trustworthy signal? (Choose 2)',
  options: [
    'Judge quality by how confident the output sounds',
    'Build a representative evaluation set from real traffic and score it against a rubric',
    'Run a blind side-by-side comparison with humans on a sample of outputs',
    'Use one example that the team likes as the regression test',
    'Measure only latency and cost because quality is subjective'
  ],
  answer: [1, 2],
  explain: `**Đúng: eval có đại diện cộng so sánh mù với người.** Tập eval lấy từ traffic thật phản ánh phân bố đầu vào thật; rubric biến hay thành tiêu chí chấm được. So sánh mù, tức không biết đâu là bản A và bản B, loại thiên kiến thấy bản mới là tốt hơn.

### Vì sao các phương án còn lại sai
- **Chấm theo độ tự tin của câu trả lời:** giọng chắc chắn không tương quan với độ đúng.
- **Một ví dụ làm regression test:** quá ít, dễ đậu mà vẫn sai ở nhóm khác.
- **Chỉ đo latency và cost:** hai chỉ số này không nói gì về việc câu trả lời có đúng và đủ.

### Cách làm
Chia tập eval theo nhóm tác vụ và mức độ khó; báo cáo theo từng nhóm, không chỉ điểm trung bình. Theo dõi xu hướng qua các phiên bản.

> Điểm trung bình che giấu hồi quy cục bộ: hãy luôn xem theo nhóm.`
},
{
  id: 'qz-ccap-076',
  topic: 'claude',
  q: '[Solution Design] A research assistant answers questions over 300-page PDFs. The first version pasted whole PDFs into the prompt and exceeded the context window, then summarising them lost key details. Which design best balances quality and cost?',
  options: [
    'Chunk the documents, retrieve the relevant chunks per question, and keep a short summary for orientation',
    'Paste the whole PDF and raise max_tokens until it fits',
    'Summarise every PDF to one sentence and store only that',
    'Answer without any document access'
  ],
  answer: 0,
  explain: `**Đúng: chunk cộng retrieval theo câu hỏi, giữ tóm tắt để định hướng.** Với PDF 300 trang, chỉ vài chục trang liên quan tới câu hỏi hiện tại. Truy xuất đúng đoạn giúp câu trả lời chính xác và rẻ hơn nhiều so với gửi cả tài liệu. Một bản tóm tắt ngắn giữ vai trò bản đồ, giúp chọn vùng cần đọc sâu.

### Vì sao các phương án khác sai
- **Nhồi cả PDF và tăng max_tokens:** vượt context hoặc phải chia nhỏ một cách thủ công; chi phí tăng theo kích thước tài liệu.
- **Tóm tắt mỗi PDF thành một câu:** mất chi tiết, đúng thứ người dùng cần khi hỏi về điều khoản cụ thể.
- **Trả lời không cần tài liệu:** model sẽ suy đoán; với tài liệu dài, tỉ lệ bịa tăng.

### Lưu ý
Chất lượng chunk ảnh hưởng trực tiếp: chunk quá nhỏ mất ngữ cảnh, quá lớn thì lẫn nhiều chủ đề. Nên đo tỉ lệ tìm đúng đoạn trước khi tối ưu prompt.

> Tách hai câu hỏi khác nhau: tìm đúng đoạn là retrieval, viết đúng dựa trên đoạn đó là generation. Đo riêng sẽ biết phải sửa ở đâu.`
},
{
  id: 'qz-ccap-077',
  topic: 'claude',
  q: '[Solution Design] A workflow has Claude plan a migration, then four workers execute steps in parallel, then a reviewer checks the result. When should the team choose this orchestrator pattern instead of a single prompt?',
  options: [
    'When one prompt can already produce the final answer with no coordination',
    'When tasks are decomposable into parallel sub-tasks with separate tools or context, and the extra latency and cost are justified by quality',
    'Whenever the answer must be short',
    'Only when the model is small'
  ],
  answer: 1,
  explain: `**Đúng: khi bài toán chia được thành phần song song và chất lượng yêu cầu nhiều bước.** Orchestrator-worker phù hợp khi có nhiều tiểu phần độc lập, mỗi phần cần tool hoặc ngữ cảnh riêng, và việc chạy song song tiết kiệm thời gian đáng kể so với chi phí điều phối thêm.

### Vì sao các phương án khác sai
- **Một prompt đã đủ:** thêm tầng điều phối chỉ tăng độ trễ, chi phí và điểm hỏng.
- **Chỉ vì câu trả lời cần ngắn:** độ dài không liên quan tới việc cần điều phối; một prompt ngắn vẫn làm được.
- **Chỉ khi model nhỏ:** model lớn hay nhỏ không quyết định; yếu tố quyết định là cấu trúc bài toán.

### Khi nào nên dùng
Cần: chia được việc, có cách tổng hợp kết quả, và có cách phát hiện lỗi của từng worker. Nếu không tổng hợp được, một prompt đơn giản vẫn tốt hơn.

> Kiến trúc orchestrator làm tăng độ phức tạp vận hành; chỉ chọn khi lợi ích chất lượng đo được lớn hơn chi phí đó.`
},
{
  id: 'qz-ccap-078',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A public-facing assistant must not reveal internal documents or follow instructions hidden in fetched web pages. Which two defences are most effective? (Choose 2)',
  options: [
    'Rely on the system prompt saying never follow external instructions',
    'Treat retrieved and fetched content as untrusted data, and keep the system prompt and tool permissions as separate trust boundaries',
    'Constrain tool permissions so the assistant cannot take sensitive actions on the user behalf without a policy check',
    'Let the model decide case by case because it understands the intent',
    'Remove the system prompt to avoid conflicting instructions'
  ],
  answer: [1, 2],
  explain: `**Đúng: coi nội dung bên ngoài là dữ liệu không tin cậy, và giới hạn quyền hành động.** Prompt injection là khi nội dung bên ngoài chứa chỉ dẫn giả làm người dùng, ví dụ một trang web nói hãy gửi toàn bộ dữ liệu. Phòng thủ hiệu quả: phân tách rõ ranh giới tin cậy giữa chỉ dẫn hệ thống và dữ liệu đọc được, cộng với tool permission và kiểm tra policy trước khi hành động.

### Vì sao các phương án còn lại sai
- **Chỉ dựa vào câu trong system prompt:** đây là lời nhắc, không phải lớp cưỡng chế; kẻ tấn công có thể viết chỉ dẫn thuyết phục hơn.
- **Để model tự quyết theo từng ca:** model không phân biệt được đâu là chỉ dẫn hợp lệ và đâu là nội dung độc hại nếu không có ranh giới.
- **Bỏ system prompt:** không giải quyết vấn đề; còn mất phần định hướng an toàn.

### Biện pháp bổ sung
Lọc nội dung trả về, giới hạn tool nào được dùng theo ngữ cảnh, và ghi log mọi lần gọi tool để truy vết khi có sự cố.

> Nguyên tắc: dữ liệu đọc được và chỉ dẫn hệ thống phải nằm ở hai kênh khác nhau, dù nội dung trông hợp lý đến đâu.`
},
{
  id: 'qz-ccap-079',
  topic: 'claude',
  q: '[Solution Design] An agent writes code and runs it to verify. Occasionally the generated code is destructive, for example it deletes a directory. Which approach best limits the blast radius?',
  options: [
    'Give the agent full machine access so it can fix anything it breaks',
    'Run the agent in a sandboxed environment with least-privilege filesystem and network access, and require approval for destructive operations',
    'Ask the model in the prompt to be careful with deletions',
    'Trust the code review step to catch it before it runs'
  ],
  answer: 1,
  explain: `**Đúng: sandbox cộng least privilege.** Agent chạy code do model sinh ra, nên môi trường chạy phải bị giới hạn: chỉ thấy thư mục dự án, không có quyền mạng tuỳ ý, và không được xoá ngoài vùng làm việc. Thao tác phá huỷ như xoá hàng loạt cần bước phê duyệt hoặc giới hạn phạm vi rõ ràng. Đây là cách giảm thiệt hại khi model sai.

### Vì sao các phương án khác sai
- **Cấp toàn quyền máy:** một lỗi của agent có thể xoá dữ liệu thật, rò rỉ token hoặc biến máy thành chỗ tấn công.
- **Nhờ model cẩn thận trong prompt:** lời nhắc không phải lớp bảo vệ; model có thể hiểu sai lệnh.
- **Tin review trước khi chạy:** review chỉ đọc, không ngăn code chạy; và nếu code đã chạy rồi mới review thì đã muộn.

### Cấu hình sandbox
Giới hạn: thư mục đọc/ghi, lệnh được phép, thời gian chạy, tài nguyên. Không nhúng secret vào sandbox. Ghi log mọi lệnh để điều tra.

> Với agent có quyền thực thi, sandbox là điều kiện bắt buộc trước khi cho chạy trên máy thật.`
},
{
  id: 'qz-ccap-080',
  topic: 'claude',
  q: '[Solution Design] A company wants to compare a new Claude model against the current one for a document-review task. Cost per request matters, but so does defect detection. Which evaluation approach is most defensible?',
  options: [
    'Ask the vendor which model is best and adopt it',
    'Run both models on a labelled set of documents, compare defect detection and cost per document, then pilot the winner on a small traffic slice before full rollout',
    'Switch entirely and rely on user feedback after launch',
    'Pick the model with the lowest token price and assume quality is equal'
  ],
  answer: 1,
  explain: `**Đúng: eval trên tập gán nhãn có thật, rồi pilot theo phần trăm lưu lượng.** So sánh hai model phải trên cùng đầu vào, cùng tiêu chí chấm, gồm cả chất lượng (phát hiện lỗi) và chi phí. Sau khi có số liệu, pilot trên một phần nhỏ traffic thật để bắt các vấn đề chỉ xuất hiện trong phân bố thật, rồi mới mở rộng.

### Vì sao các phương án khác sai
- **Hỏi vendor rồi adopt:** vendor không biết dữ liệu và tiêu chí của bạn; đây không phải đánh giá.
- **Switch toàn bộ rồi nghe phản hồi:** không có đường lui nếu chất lượng giảm; và phản hồi người dùng đến trễ.
- **Chọn model rẻ nhất:** giá thấp nhưng bỏ sót lỗi tài liệu có thể tốn kém hơn nhiều so với tiền token.

### Chỉ số cần so sánh
Chất lượng theo từng loại lỗi, tỉ lệ báo nhầm, chi phí mỗi tài liệu, và độ trễ đuôi. Ghi lại phiên bản prompt và model cho mỗi lần chạy để truy vết.

> Quyết định model nên dựa trên chi phí mỗi kết quả đúng, không phải giá mỗi token.`
},
{
  id: 'qz-ccap-081',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A long-running agent task keeps going out of context as it reads more files. Which two techniques best control context growth? (Choose 2)',
  options: [
    'Keep appending every file the agent has ever read to the same conversation',
    'Summarise earlier steps and keep only the summary plus recent context',
    'Use a compact note-taking file that records decisions and open questions, re-read on demand',
    'Increase max_tokens so more fits in one turn',
    'Restart the task from scratch whenever context is near full'
  ],
  answer: [1, 2],
  explain: `**Đúng: nén quá khứ thành tóm tắt, và dùng ghi chú ngoài context.** Khi hội thoại dài, gửi lại toàn bộ lịch sử vừa tốn token vừa loãng. Tóm tắt các bước đã làm giữ lại quyết định và kết quả, còn file ghi chú bên ngoài chứa trạng thái dài hạn để đọc lại khi cần. Đây là hai cách quản lý context chuẩn cho tác vụ dài.

### Vì sao các phương án còn lại sai
- **Gửi lại mọi file đã đọc:** context tăng đơn điệu, chi phí tăng, và tỉ lệ chú ý giảm khi ngữ cảnh quá dài.
- **Tăng max_tokens:** chỉ nâng trần output, không giảm lượng thông tin phải nạp lại; và cửa sổ context vẫn có giới hạn.
- **Bắt đầu lại từ đầu:** mất tiến độ và có thể lặp lại lỗi cũ; khởi động lại chỉ hợp lý khi có checkpoint.

### Cách làm
Chia tác vụ thành giai đoạn; cuối mỗi giai đoạn ghi lại: mục tiêu, việc đã làm, kết quả, việc còn lại. Giai đoạn sau đọc bản ghi thay vì đọc lại toàn bộ.

> Context là tài nguyên hữu hạn: hãy quản lý nó như bộ nhớ làm việc, không phải nơi lưu trữ mọi thứ.`
},
{
  id: 'qz-ccap-082',
  topic: 'claude',
  q: '[Solution Design] A team wants to add Claude to an existing order system. The integration must be observable, cost-controlled, and able to roll back a prompt change without a code deploy. Which design best meets all three?',
  options: [
    'Call the API from each service, store prompts in each repo, and rely on the provider dashboard for cost',
    'Put one internal gateway in front of Claude that versions prompts, enforces per-caller quotas, emits logs and metrics, and supports canary rollout with quick rollback',
    'Log every request payload to a shared bucket for analysis and nothing else',
    'Deploy a new build for every prompt change so nothing is untested'
  ],
  answer: 1,
  explain: `**Đúng: một gateway nội bộ gom ba nhu cầu vào một lớp.** Gateway có thể lưu prompt có phiên bản, bật/tắt theo caller, đặt hạn mức, phát log và metrics chuẩn, và chuyển lưu lượng từ bản prompt mới sang bản cũ khi chỉ số xấu. Nhờ vậy rollback không cần deploy lại code, còn chi phí và lỗi đo được ở một nơi.

### Vì sao các phương án khác sai
- **Gọi trực tiếp từ từng service:** ba nhu cầu bị phân tán; mỗi service tự xử lý cost và logging theo cách riêng.
- **Chỉ log payload vào bucket:** có dữ liệu nhưng thiếu kiểm soát, không có enforcement hay rollback.
- **Deploy build mỗi lần đổi prompt:** chậm, rủi ro, và trộn lẫn thay đổi prompt với thay đổi code.

### Thiết kế gateway
Tách prompt khỏi code, gắn phiên bản, có bước duyệt, có chỉ số chất lượng và chi phí, và có cơ chế chuyển lưu lượng theo phần trăm để thử an toàn.

> Prompt đổi nhanh hơn code rất nhiều; hãy thiết kế cho việc đổi prompt trở thành một thao tác cấu hình có kiểm soát, không phải một lần phát hành.`
},
{
  id: 'qz-ccap-083',
  topic: 'claude',
  q: '[Solution Design] A model returns a confident answer that a customer then acts on, and the answer turns out wrong. The company wants to reduce this risk across all Claude features. What is the most systemic improvement?',
  options: [
    'Lower temperature globally so answers become more careful',
    'Add a retrieval grounding step and a citation requirement so answers are backed by source text, plus an evaluation metric for unsupported claims',
    'Add the word important to the system prompt so the model pays attention',
    'Show a disclaimer that AI can make mistakes and consider the risk handled'
  ],
  answer: 1,
  explain: `**Đúng: gắn câu trả lời với nguồn và đo tỉ lệ khẳng định không có căn cứ.** Với tác vụ ảnh hưởng quyết định, giảm rủi ro bằng cách buộc câu trả lời dẫn nguồn truy vết được và chấm điểm tỉ lệ khẳng định không có nguồn trong tập eval. Khi có số liệu, bạn biết cải thiện prompt có tác dụng thật hay không.

### Vì sao các phương án khác sai
- **Giảm temperature toàn cục:** làm câu trả lời ít ngẫu nhiên hơn nhưng không làm nó đúng hơn; vẫn bịa một cách chắc chắn.
- **Thêm từ quan trọng vào prompt:** không tạo ra căn cứ; chỉ là lời nhắc chung.
- **Hiện disclaimer rồi coi như xong:** người dùng vẫn hành động theo câu trả lời; disclaimer không làm giảm tần suất sai.

### Đo lường
Tạo tập eval có câu trả lời đúng và sai đã gán nhãn; theo dõi tỉ lệ khẳng định có nguồn và tỉ lệ bịa. So sánh trước và sau thay đổi.

> Với hệ thống ảnh hưởng quyết định, hãy thiết kế để câu trả lời kiểm chứng được, thay vì cố làm model tự tin hơn.`
},
{
  id: 'qz-ccap-084',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A support team wants an assistant that can look up orders, explain policy, and escalate to a human. Which two design choices keep the system safe and useful? (Choose 2)',
  options: [
    'Give the assistant one broad tool that can do everything with minimal schema',
    'Separate tools per intent with clear schemas, and require human hand-off for actions outside the policy',
    'Disable all tools so the assistant only answers from a fixed FAQ',
    'Let the assistant decide escalation by itself without exposing any escalation tool',
    'Return structured error information when a tool call fails so the model can recover or hand off'
  ],
  answer: [1, 4],
  explain: `**Đúng: tool tách theo ý định có schema rõ, và xử lý lỗi có cấu trúc.** Tách tool giúp model chọn đúng hành động và giúp hệ thống kiểm soát quyền từng loại. Khi tool lỗi, trả thông tin lỗi có cấu trúc để model hiểu và chuyển người hoặc thử cách khác, thay vì đoán. Ranh giới policy rõ ràng cho phép escalate đúng chỗ.

### Vì sao các phương án còn lại sai
- **Một tool làm tất cả:** schema mơ hồ, model dễ chọn sai nhánh, và khó kiểm soát quyền cho từng hành động.
- **Tắt hết tool:** mất phần lớn giá trị; assistant chỉ trả lời FAQ tĩnh, không tra cứu được đơn hàng.
- **Tự quyết escalate mà không có tool:** không có đường chính thức để chuyển người; model buộc phải trả lời bừa hoặc từ chối.

### Cấu trúc tool
Đặt tên theo động từ và đối tượng, mô tả input bằng schema, trả kết quả hoặc lỗi có cấu trúc. Hành động nhạy cảm đi kèm kiểm tra quyền và bước xác nhận.

> Thiết kế tool tốt là thiết kế cho cả trường hợp thành công và thất bại; lỗi có cấu trúc giúp agent phục hồi thay vì đoán.`
},
{
  id: 'qz-ccap-085',
  topic: 'claude',
  q: '[Solution Design] An architecture review must decide how to integrate Claude across three business units that share data but have different compliance needs. Which recommendation is most defensible?',
  options: [
    'Let each unit build its own integration with no shared standard, to move fastest',
    'Define one shared integration layer with per-unit policy controls for data handling, model choice and logging, and a documented exception process for units with stricter rules',
    'Force all units onto one model and one prompt so behaviour is identical',
    'Move all data into a single new data lake before starting any Claude work'
  ],
  answer: 1,
  explain: `**Đúng: một lớp tích hợp chung, chính sách riêng cho từng đơn vị, quy trình ngoại lệ rõ ràng.** Chia sẻ lớp tích hợp giảm trùng lặp về credential, retry, log và cost; nhưng các đơn vị có nhu cầu tuân thủ khác nhau, nên phải có kiểm soát chính sách theo đơn vị về dữ liệu, model và logging, cộng với cách xử lý ngoại lệ có tài liệu. Đây là mô hình vừa thống nhất vừa linh hoạt.

### Vì sao các phương án khác sai
- **Mỗi đơn vị tự làm, không chuẩn chung:** nhân bản rủi ro, chi phí và khó quản trị; không có báo cáo tập trung.
- **Ép mọi đơn vị cùng model và prompt:** bỏ qua khác biệt tuân thủ và nghiệp vụ; một chính sách không phù hợp mọi đơn vị.
- **Dồn dữ liệu vào data lake mới trước:** dự án hạ tầng lớn, chậm, và không phải điều kiện tiên quyết cho tích hợp Claude.

### Điều cần thống nhất
Chuẩn tích hợp: credential, retry, log, metrics, versioning prompt. Phần khác nhau theo đơn vị: dữ liệu nào được gửi, model nào được dùng, ngưỡng con người phê duyệt.

> Nguyên tắc: thống nhất phần dùng chung, cho phép khác biệt phần tuân thủ; đừng đồng nhất hoá những gì bản chất khác nhau.`
},
// qz-ccap-086: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-086',
  topic: 'claude',
  q: '[Eval & Optimization] A support team needs to reduce customer wait times. They analyze call logs and discover that 80% of queries are about password resets and order status. Which approach best optimizes resource allocation?',
  options: [
    'Hire more support staff to handle all queries 24/7',
    'Implement a self-service portal for password resets and order tracking, redirecting complex cases to agents',
    'Reduce the number of support channels to focus on phone only',
    'Ignore the data and distribute staff evenly across all channels'
  ],
  answer: 1,
  explain: `**Đúng: cổng self-service tự phục vụ các câu hỏi thường gặp, giảm áp lực cho nhân viên tư vấn.** 80% câu hỏi về reset mật khẩu và trạng thái đơn hàng là tác vụ lặp đi lặp lại, phù hợp để khách tự xử lý qua cổng tự phục vụ. Nhân viên tư vấn tập trung vào các ca phức tạp cần can thiệp con người, cải thiện chất lượng dịch vụ. Tiết kiệm chi phí nhân sự và tăng tốc độ phản hồi. Các phương án khác sai: nhân thêm nhân viên tăng chi phí không cần thiết cho công việc lặp lại, giảm kênh làm giảm khả năng tiếp cận, phân phối đều nhân viên không hiệu quả khi dữ liệu cho thấy 80% câu hỏi tập trung vào một vài vấn đề.`,
},
// qz-ccap-087: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-087',
  topic: 'claude',
  q: '[Eval & Optimization] A company wants to measure Claude usage efficiency per department. The management team requests a dashboard showing cost per ticket resolved and average latency. Which metrics should be prioritized?',
  options: [
    'Total token count per month only',
    'Cost per resolved ticket and p95 latency',
    'Number of API calls per developer',
    'Peak concurrent users only'
  ],
  answer: 1,
  explain: `**Đúng: cost per ticket và p95 latency đo lường hiệu quả thực tế.** Tổng token chỉ là một phần của chi phí và không phản ánh kết quả. Số API call bị chi phối bởi thói quen cá nhân, không phản ánh throughput. Concurrent users là chỉ số hiện trạng, không đo lường hiệu quả xử lý.`,
},
// qz-ccap-088: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-088',
  topic: 'claude',
  q: '[Eval & Optimization] A support bot using Claude handles 10,000 monthly requests. After implementing prompt caching, the cost per request dropped from $0.50 to $0.20. What is the most likely reason?',
  options: [
    'The model was switched to a cheaper version',
    'The static prompt prefix was reused across many requests',
    'The context window was reduced by 50%',
    'The API rate limit was lowered'
  ],
  answer: 1,
  explain: `**Đúng: prompt caching giảm chi phí bằng cách tái sử dụng prefix.** Khi prefix (phần tĩnh) giống nhau giữa các request, API đọc từ cache thay vì xử lý lại, nên chi phí giảm mạnh. Việc chuyển model hoặc giảm context window không phải nguyên nhân chính của mức giảm 60% chi phí. Giảm rate limit không liên quan đến cost per request.`,
},
// qz-ccap-089: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-089',
  topic: 'claude',
  q: '[Eval & Optimization] A team observes that 70% of Claude requests exceed 5 seconds latency. They suspect the system prompt is too long. Which action is most likely to reduce latency?',
  options: [
    'Increase max_tokens',
    'Trim the system prompt to essential instructions only',
    'Add more few-shot examples',
    'Switch to a larger model'
  ],
  answer: 1,
  explain: `**Đúng: giảm system prompt giảm input tokens, giảm latency.** Độ trễ chủ yếu do input tokens quyết định. System prompt dài làm tăng input tokens, khiến mỗi request lâu hơn. Cắt bớt xuống những phần cần thiết giúp latency giảm nhanh. Tăng max_tokens không làm ngắn input, thêm examples làm tăng context, chuyển model lớn hơn làm chậm hơn.`,
},
// qz-ccap-090: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-090',
  topic: 'claude',
  q: '[Eval & Optimization] A company plans to migrate from on-premise document storage to Claude. They need to ensure the migration plan includes cost estimation for the first year. Which factor has the BIGGEST impact on cost?',
  options: [
    'Number of documents in the repository',
    'Average tokens per document for retrieval',
    'Number of concurrent users',
    'Frequency of model version updates'
  ],
  answer: 1,
  explain: `**Đúng: tokens per document cho retrieval quyết định số lượng input token mỗi request.** Số lượng document tổng thể ít quan trọng nếu mỗi document được chunk nhỏ và chỉ retrieval các đoạn liên quan. Concurrent users và frequency update không ảnh hưởng trực tiếp đến cost tính theo token/request.`,
},
// qz-ccap-091: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-091',
  topic: 'claude',
  q: '[Eval & Optimization] A Claude-powered assistant has a 40% failure rate when users ask for information not in the knowledge base. The team wants to improve this without expanding the document store. Which approach is most effective?',
  options: [
    'Lower the temperature to make the model more conservative',
    'Add a "no information found" instruction and retrieve closest matches, then honestly state limitations',
    'Increase max_tokens to allow longer answers',
    'Switch to a model with a larger context window'
  ],
  answer: 1,
  explain: `**Đúng: rõ ràng về hạn chế và retrieve closest matches** giúp giảm tỉ lệ trả lời sai. Giảm temperature làm model cẩn thận nhưng vẫn có thể bịa. Tăng max_tokens không giải quyết vấn đề thiếu thông tin. Chuyển model không thêm dữ liệu mới. Cách tốt nhất là quản lý kỳ vọng và truy xuất đúng đoạn liên quan.`,
},
// qz-ccap-092: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-092',
  topic: 'claude',
  q: '[Eval & Optimization] A team measures that Claude returns correct answers with citations 60% of the time. They want to improve to 80%+. Which single change would most help?',
  options: [
    'Remove all citations from the system prompt',
    'Use structured output with json_schema and require citations in the output',
    'Lower the temperature to 0',
    'Increase the number of few-shot examples'
  ],
  answer: 1,
  explain: `**Đúng: structured output với json_schema và bắt citations trong output** đảm bảo model tuân theo cấu trúc. Khi có schema bắt buộc citations, model buộc phải trả nguồn. Temperature = 0 chỉ làm giảm ngẫu nhiên, không đảm bảo citations. Thêm few-shot có thể giúp nhưng không có cơ chế enforcement.`,
},
// qz-ccap-093: [Governance & Risk], answer 1
{
  id: 'qz-ccap-093',
  topic: 'claude',
  q: '[Governance & Risk] A financial services company must ensure Claude does not expose sensitive data like account numbers in responses. Which is the BEST technical control?',
  options: [
    'Add a system prompt warning never to expose numbers',
    'Redact or tokenize sensitive fields before sending to Claude and maintain internal mapping',
    'Run all responses through a regex filter after the fact',
    'Disable tool use entirely'
  ],
  answer: 1,
  explain: `**Đúng: redact/tokenize trước khi gửi là phòng ngừa thực tế.** System prompt cảnh báo là chỉ dẫn mềm, không thể đảm bảo. Regex filter sau có thể bỏ sót và không phủ hết các kiểu dữ liệu nhạy cảm. Vô hiệu hóa tool use làm giảm giá trị. Cách tốt nhất là tiền xử lý dữ liệu trước khi gửi đến Claude.`,
},
// qz-ccap-094: [Governance & Risk], answer 1
{
  id: 'qz-ccap-094',
  topic: 'claude',
  q: '[Governance & Risk] An healthcare provider wants to use Claude for summarizing patient records. Data must remain within compliant regions. Which integration approach satisfies this requirement?',
  options: [
    'Call Anthropic API directly from any region',
    'Use Amazon Bedrock or Google Vertex AI with EU region selection and keep storage in that region',
    'Strip patient identifiers and send anywhere',
    'Run Claude Code on developer laptops'
  ],
  answer: 1,
  explain: `**Đúng: dùng nền tảng cloud có region EU, dữ liệu xử lý trong vùng đã chọn.** Amazon Bedrock và Google Vertex AI cung cấp region EU, phù hợp với yêu cầu lưu trữ dữ liệu y tế. Chỉ xóa tên vẫn có thể bị định danh nhờ dữ liệu khác, và laptop không phải kênh xử lý tập trung.`,
},
// qz-ccap-095: [Governance & Risk], answer 1
{
  id: 'qz-ccap-095',
  topic: 'claude',
  q: '[Governance & Risk] Which information is most essential to log so that Claude interactions can be audited?',
  options: [
    'The model name and output length',
    'The caller identity and request purpose',
    'The API key and request timestamp',
    'The conversation ID and user feedback'
  ],
  answer: 1,
  explain: `**Đúng: caller identity và request purpose tạo ra nguồn sự thật cho audit.** Ai gọi và với mục đích gì giúp đội kiểm soát và truy vết. Model name và output length có ích nhưng không đủ để biết ai chịu trách nhiệm. API key không nên log vì có thể bị dùng chung giữa nhiều project, còn conversation ID chỉ là định danh nội bộ.`,
},
// qz-ccap-096: [Governance & Risk], answer 1
{
  id: 'qz-ccap-096',
  topic: 'claude',
  q: '[Governance & Risk] Which practice most directly reduces the risk of prompt injection affecting tool use?',
  options: [
    'Lengthen the system prompt with warnings',
    'Use tool schema with strict: true and enforce policy checks in backend',
    'Set temperature to 0',
    'Disable all user-facing features'
  ],
  answer: 1,
  explain: `**Đúng: tool schema chặt (strict: true) cộng kiểm tra chính sách ở backend là ràng buộc kỹ thuật.** Temperature chỉ điều chỉnh mức ngẫu nhiên, không tạo ra ranh giới cưỡng chế; prompt injection là mối đe dọa an toàn, không phải vấn đề temperature. Kéo dài system prompt hay tắt hết tính năng đều không chặn được chỉ dẫn độc hại trong dữ liệu bên ngoài.`,
},
// qz-ccap-097: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-097',
  topic: 'claude',
  q: '[Eval & Optimization] A team wants to evaluate whether switching from Claude Opus to Sonnet reduces cost without quality loss. Which evaluation approach is most defensible?',
  options: [
    'Ask the vendor which model is best and adopt it',
    'Run both models on a labelled set of documents, compare defect detection and cost per document, then pilot the winner on small traffic slice before full rollout',
    'Switch entirely and rely on user feedback after launch',
    'Pick the model with the lowest token price and assume quality is equal'
  ],
  answer: 1,
  explain: `**Đúng: eval trên tập gán nhãn có thật, rồi pilot theo phần trăm lưu lượng.** So sánh hai model phải trên cùng đầu vào, cùng tiêu chí chấm, gồm cả chất lượng (phát hiện lỗi) và chi phí. Sau khi có số liệu, pilot trên một phần nhỏ traffic thật để bắt các vấn đề chỉ xuất hiện trong phân bố thật, rồi mới mở rộng.`,
},
// qz-ccap-098: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-098',
  topic: 'claude',
  q: '[Eval & Optimization] Which metric best detects a regression in Claude response quality after a prompt change?',
  options: [
    'Only token count and request latency',
    'Success rate with citations and user satisfaction scores',
    'Peak concurrent users and API error rate',
    'Average temperature and max_tokens setting'
  ],
  answer: 1,
  explain: `**Đúng: success rate with citations và user satisfaction đo chất lượng và trải nghiệm thực tế.** Token count và latency chỉ đo hiệu suất, không nói gì về chất lượng câu trả lời. Concurrent users và API error rate là chỉ số hệ thống, không liên quan đến chất lượng. Temperature và max_tokens là cài đặt, không phải metric đo lường.`,
},
// qz-ccap-099: [Governance & Risk], answer 1
{
  id: 'qz-ccap-099',
  topic: 'claude',
  q: '[Governance & Risk] A system must prevent Claude from following hidden instructions in fetched web pages. Which defence is most effective?',
  options: [
    'Rely on the system prompt saying never follow external instructions',
    'Treat retrieved and fetched content as untrusted data, and keep the system prompt and tool permissions as separate trust boundaries',
    'Disable all tool use so the assistant can only answer from its training',
    'Let the model decide case by case because it understands the intent'
  ],
  answer: 1,
  explain: `**Đúng: coi nội dung bên ngoài là dữ liệu không tin cậy, và giới hạn quyền hành động.** Prompt injection là khi nội dung bên ngoài chứa chỉ dẫn giả làm người dùng, ví dụ một trang web nói hãy gửi toàn bộ dữ liệu. Phòng thủ hiệu quả: phân tách rõ ranh giới tin cậy giữa chỉ dẫn hệ thống và dữ liệu đọc được, cộng với tool permission và kiểm tra policy trước khi hành động.`,
},
// qz-ccap-100: [Governance & Risk], multi: true, answer [1,2]
{
  id: 'qz-ccap-100',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] An assistant must not reveal internal document content even when users try prompt injection. Which two defences are most effective? (Choose 2)',
  options: [
    'Rely on the system prompt saying never reveal internal documents',
    'Treat retrieved and fetched content as untrusted data, and keep the system prompt and tool permissions as separate trust boundaries',
    'Constrain tool permissions so the assistant cannot take sensitive actions on the user behalf without a policy check',
    'Let the model decide case by case because it understands the intent'
  ],
  answer: [1, 2],
  explain: `**Đúng: coi nội dung bên ngoài là dữ liệu không tin cậy, và giới hạn quyền hành động.** Prompt injection là khi nội dung bên ngoài chứa chỉ dẫn giả làm người dùng, ví dụ một trang web nói hãy gửi toàn bộ dữ liệu. Phòng thủ hiệu quả: phân tách rõ ranh giới tin cậy giữa chỉ dẫn hệ thống và dữ liệu đọc được, cộng với tool permission và kiểm tra policy trước khi hành động.`,
},
// qz-ccap-101: [Eval & Optimization], multi: true, answer [1,2]
{
  id: 'qz-ccap-101',
  topic: 'claude',
  multi: true,
  q: '[Eval & Optimization] A leadership team wants a Claude feature evaluated before launch and after each change. Which two practices give the most trustworthy signal? (Choose 2)',
  options: [
    'Judge quality by how confident the output sounds',
    'Build a representative evaluation set from real traffic and score it against a rubric',
    'Run a blind side-by-side comparison with humans on a sample of outputs',
    'Use one example that the team likes as the regression test'
  ],
  answer: [1, 2],
  explain: `**Đúng: eval có đại diện cộng so sánh mù với người.** Tập eval lấy từ traffic thật phản ánh phân bố đầu vào thật; rubric biến “hay” thành tiêu chí chấm được. So sánh mù, tức không biết đâu là bản A và bản B, loại thiên kiến thấy bản mới là tốt hơn.`,
},
// qz-ccap-102: [Eval & Optimization], answer 3
{
  id: 'qz-ccap-102',
  topic: 'claude',
  q: '[Eval & Optimization] A company plans to implement prompt caching for frequently used system prompts. Approximately how much cost reduction can be expected on subsequent requests with identical prefixes?',
  options: [
    'Up to 10%',
    'Up to 50%',
    'Up to 75%',
    'Up to 90%'
  ],
  answer: 3,
  explain: `**Đúng: prompt caching có thể giảm chi phí đáng kể, thường khoảng 90% cho cache read khi prefix giống hệt.** Chi tiết phụ thuộc vào model: Opus 5.5 và Sonnet 5.5 cache read khoảng 0.1x giá input, nghĩa là chi phí giảm tới 90%. Cache write (lần đầu ghi) lại đắt hơn. Việc tái sử dụng prefix là chìa khóa để đạt được tiết kiệm lớn.`,
},
// qz-ccap-103: [Governance & Risk], answer 1
{
  id: 'qz-ccap-103',
  topic: 'claude',
  q: '[Governance & Risk] Which practice most directly reduces the risk of prompt injection affecting tool use?',
  options: [
    'Lengthen the system prompt with warnings',
    'Use tool schema with strict: true and enforce policy checks in backend',
    'Set temperature to 0',
    'Disable all user-facing features'
  ],
  answer: 1,
  explain: `**Đúng: tool schema chặt (strict: true) cộng kiểm tra chính sách ở backend là ràng buộc kỹ thuật.** Temperature chỉ điều chỉnh mức ngẫu nhiên, không tạo ra ranh giới cưỡng chế; prompt injection là mối đe dọa an toàn, không phải vấn đề temperature. Kéo dài system prompt hay tắt hết tính năng đều không chặn được chỉ dẫn độc hại trong dữ liệu bên ngoài.`,
},
// qz-ccap-104: [Governance & Risk], multi: true, answer [1,3]
{
  id: 'qz-ccap-104',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] A healthcare AI assistant must prevent PHI (Protected Health Information) from being logged. Which two approaches best protect privacy? (Choose 2)',
  options: [
    'Rely on the model to never log sensitive data',
    'Redact PHI before sending to Claude and maintain internal mapping',
    'Enable automatic logging of all requests for audit purposes',
    'Use tokenization for identifiers and store mapping securely off-platform'
  ],
  answer: [1, 3],
  explain: `**Đúng: redact trước khi gửi và tokenization identifiers** là phòng ngừa thực tế. Model không thể đảm bảo không log PHI, nó là stateless và có thể rò rỉ qua nhiều channel. Auto logging làm tệ hơn bằng cách tạo ra thêm dữ liệu nhạy cảm. Tokenization tách identity ra khỏi platform giúp audit mà không lộ dữ liệu nhạy cảm.`,
},
// qz-ccap-105: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-105',
  topic: 'claude',
  q: '[Eval & Optimization] A team observes that 80% of Claude requests complete in under 2 seconds, but the p95 latency is 8 seconds. What does this indicate?',
  options: [
    'The system is functioning normally, p95 is always higher than median',
    'There are occasional heavy requests or queue buildup causing delays',
    'The model is underutilized and should be scaled down',
    'The API key has been compromised and is being misused'
  ],
  answer: 1,
  explain: `**Đúng: p95 (ngưỡng 95) cao hơn nhiều so với phần lớn request cho thấy có nhóm request nặng hoặc hàng đợi tạm thời.** 80% request hoàn tất dưới 2 giây, nhưng 20% còn lại rất chậm nên đẩy p95 lên 8 giây. p95 cao hơn median là chuyện bình thường, nhưng chênh lệch lớn như vậy là dấu hiệu cần điều tra. Không nhất thiết là API key bị lộ; có thể do truy vấn phức tạp, retriever chậm hoặc quá nhiều request đồng thời. Nên theo dõi xu hướng và giới hạn số request đồng thời.`,
},
// qz-ccap-106: [Governance & Risk], answer 1
{
  id: 'qz-ccap-106',
  topic: 'claude',
  q: '[Governance & Risk] A financial regulation requires that all Claude interactions be auditable. Which single approach is sufficient?',
  options: [
    'Add a system prompt saying "be audit-friendly"',
    'Implement centralized logging with caller, timestamp, purpose, and output hash',
    'Disable all tool use to prevent unauthorized actions',
    'Use a single shared API key for all interactions'
  ],
  answer: 1,
  explain: `**Đúng: centralized logging với caller, timestamp, purpose và output hash** tạo ra bản ghi audit có cấu trúc và truy vết được. System prompt chỉ là chỉ dẫn mềm, không tạo ra bản ghi. Vô hiệu hoá tool use làm giảm chức năng, và dùng chung một API key khiến không thể audit riêng lẻ.`,
},
// qz-ccap-107: [Governance & Risk], answer 1
{
  id: 'qz-ccap-107',
  topic: 'claude',
  q: '[Governance & Risk] Which practice best ensures data minimisation when using Claude for document analysis?',
  options: [
    'Send all documents and let the model determine what is relevant',
    'Redact or tokenise sensitive fields before the request and keep mapping only in systems of the company',
    'Disable all logging so data is not retained',
    'Ask customers to remove sensitive data before writing'
  ],
  answer: 1,
  explain: `**Đúng: redact hoặc tokenise trường nhạy cảm trước khi gửi, và chỉ giữ mapping trong hệ thống của công ty.** Gửi toàn bộ dữ liệu và tin model tự bỏ qua là nguy hiểm — dữ liệu đã rời khỏi hệ thống. Tắt log không làm dữ liệu an toàn hơn, chỉ làm mù khi có sự cố. Bảo khách tự xoá là đẩy nghĩa vụ sang người dùng.`,
},
// qz-ccap-108: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-108',
  topic: 'claude',
  q: '[Eval & Optimization] Which metric best shows whether Claude usage is efficient?',
  options: [
    'Only total token count',
    'Cost per resolved ticket and p95 latency',
    'Number of API calls per developer',
    'Peak concurrent users only'
  ],
  answer: 1,
  explain: `**Đúng: cost per resolved ticket và p95 latency đo hiệu quả thực tế.** Tổng token chỉ là một phần của chi phí và không phản ánh kết quả. Số API call bị chi phối bởi thói quen cá nhân, không phản ánh throughput. Concurrent users là chỉ số hiện trạng.`,
},
// qz-ccap-109: [Governance & Risk], answer 1
{
  id: 'qz-ccap-109',
  topic: 'claude',
  q: '[Governance & Risk] Which practice most reduces risk when using Claude with sensitive data?',
  options: [
    'Lengthen the system prompt with warnings',
    'Use tool schema with strict: true and enforce policy checks in backend',
    'Set temperature to 0',
    'Disable all user-facing features'
  ],
  answer: 1,
  explain: `**Đúng: tool schema chặt (strict: true) cộng kiểm tra chính sách ở backend là ràng buộc kỹ thuật.** Schema chặt buộc input của tool đúng cấu trúc, còn policy check ở backend quyết định tool được phép làm gì với dữ liệu nhạy cảm. Temperature chỉ điều chỉnh mức ngẫu nhiên, không tạo ranh giới cưỡng chế; kéo dài system prompt hay tắt hết tính năng không phải biện pháp bảo vệ dữ liệu.`,
},
// qz-ccap-110: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-110',
  topic: 'claude',
  q: '[Eval & Optimization] Which metric best indicates a regression after a prompt change?',
  options: [
    'Only token count and request latency',
    'Success rate with citations and user satisfaction scores',
    'Peak concurrent users and API error rate',
    'Average temperature and max_tokens setting'
  ],
  answer: 1,
  explain: `**Đúng: success rate with citations và user satisfaction đo chất lượng và trải nghiệm thực tế.** Token count và latency chỉ đo hiệu suất, không nói gì về chất lượng câu trả lời. Concurrent users và API error rate là chỉ số hệ thống, không liên quan đến chất lượng.`,
},
// qz-ccap-111: [Governance & Risk], multi: true, answer [1,2]
{
  id: 'qz-ccap-111',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] Which two defences best prevent prompt injection? (Choose 2)',
  options: [
    'Rely on the system prompt saying never follow external instructions',
    'Treat retrieved and fetched content as untrusted data, and keep the system prompt and tool permissions as separate trust boundaries',
    'Constrain tool permissions so the assistant cannot take sensitive actions without policy check',
    'Let the model decide case by case because it understands the intent'
  ],
  answer: [1, 2],
  explain: `**Đúng: coi nội dung bên ngoài là dữ liệu không tin cậy, và giới hạn quyền hành động.** Prompt injection là khi nội dung bên ngoài chứa chỉ dẫn giả làm người dùng, ví dụ một trang web nói hãy gửi toàn bộ dữ liệu. Phòng thủ hiệu quả: phân tách rõ ranh giới tin cậy giữa chỉ dẫn hệ thống và dữ liệu đọc được, cộng với tool permission và kiểm tra policy trước khi hành động.`,
},
// qz-ccap-112: [Governance & Risk], multi: true, answer [1,3]
{
  id: 'qz-ccap-112',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] Which two approaches best protect PHI in healthcare AI? (Choose 2)',
  options: [
    'Rely on the model to never log sensitive data',
    'Redact PHI before sending to Claude and maintain internal mapping',
    'Enable automatic logging of all requests for audit purposes',
    'Use tokenization for identifiers and store mapping securely off-platform'
  ],
  answer: [1, 3],
  explain: `**Đúng: redact trước khi gửi và tokenization identifiers** là phòng ngừa thực tế. Model không thể đảm bảo không log PHI, nó là stateless và có thể rò rỉ qua nhiều channel. Auto logging làm tệ hơn bằng cách tạo ra thêm dữ liệu nhạy cảm. Tokenization tách identity ra khỏi platform giúp audit mà không lộ dữ liệu nhạy cảm.`,
},
// qz-ccap-113: [Governance & Risk], answer 1
{
  id: 'qz-ccap-113',
  topic: 'claude',
  q: '[Governance & Risk] Which approach best ensures Claude interactions are auditable?',
  options: [
    'Add system prompt saying "be audit-friendly"',
    'Implement centralized logging with caller, timestamp, purpose, and output hash',
    'Disable all tool use to prevent unauthorized actions',
    'Use a single shared API key for all interactions'
  ],
  answer: 1,
  explain: `**Đúng: centralized logging với caller, timestamp, purpose và output hash tạo ra bản ghi audit có cấu trúc, truy vết được.** System prompt chỉ là chỉ dẫn mềm, không tạo ra bản ghi. Vô hiệu hoá tool use làm giảm chức năng, và dùng chung một API key khiến không thể audit riêng lẻ.`,
},
// qz-ccap-114: [Eval & Optimization], answer 1
{
  id: 'qz-ccap-114',
  topic: 'claude',
  q: '[Eval & Optimization] Which metric best indicates system performance under load?',
  options: [
    'Only total token count',
    'Cost per request and p95 latency',
    'Number of API calls per developer',
    'Peak concurrent users only'
  ],
  answer: 1,
  explain: `**Đúng: cost per request và p95 latency đo hiệu suất và trải nghiệm người dùng.** Tổng token chỉ là một phần của chi phí, số API call bị chi phối bởi thói quen. Concurrent users là chỉ số hiện trạng.`,
},
// qz-ccap-115: [Governance & Risk], answer 1
{
  id: 'qz-ccap-115',
  topic: 'claude',
  q: '[Governance & Risk] Which practice best ensures data minimisation when using Claude?',
  options: [
    'Send all documents and let model determine relevance',
    'Redact or tokenise sensitive fields before request, keep company mapping',
    'Disable all logging so data is not retained',
    'Ask customers to remove sensitive data before writing'
  ],
  answer: 1,
  explain: `**Đúng: redact hoặc tokenise trường nhạy cảm trước khi gửi, và chỉ giữ mapping trong hệ thống của công ty.** Gửi toàn bộ dữ liệu và tin model tự bỏ qua là nguy hiểm. Tắt log không làm dữ liệu an toàn hơn, chỉ làm mù khi có sự cố. Bảo khách tự xoá là đẩy nghĩa vụ sang người dùng.`,
},
{
  id: 'qz-ccap-116',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A bank is building a Claude-powered assistant for loan officers. The credit team wants strict, rule-based answers, while relationship managers want conversational, flexible responses. The launch keeps slipping because the two groups cannot agree on the product requirements. What should the architect do first?',
  options: [
    'Run a requirements workshop with both stakeholders, document agreed success criteria, and phase the rollout',
    'Build two separate assistants so each team gets exactly what it wants',
    'Let the credit team decide because regulatory risk is higher',
    'Start with the relationship managers version and add strict rules later'
  ],
  answer: 0,
  explain: `**Đúng: xếp hàng nhu cầu stakeholder trước khi code.** Hai nhóm có mục tiêu khác nhau: credit-team quan trọng là tuân thủ và giảm sai sót; relationship-manager quan trọng là trải nghiệm khách hàng. Nếu chỉ chọn một bên, nhóm còn lại sẽ bỏ dùng hoặc dùng sai công cụ. Kiến trúc sư nên gọi họp phân tích yêu cầu, ghi nhận ưu tiên của mỗi bên, định nghĩa tiêu chí thành công (ví dụ tỉ lệ câu trả lời đúng theo quy định, thời gian xử lý đơn), rồi chạy thử trên một nhóm nhỏ trước khi mở rộng.

### Vì sao các phương án khác sai
- **Hai trợ lý riêng:** tạo hai hệ thống dự trù, khó bảo trì, dữ liệu và quy tắc sẽ lệch nhau theo thời gian.
- **Credit-team quyết một bên:** relationship-manager không nhận được công cụ phù hợp với công việc, trợ lý bị bó hoặc bỏ qua.
- **Bắt đầu bằng phiên linh hoạt rồi bổ sung quy tắc:** khó thêm ràng buộc vào sau này, và ca thử ban đầu có thể cho kết quả không tuân thủ mà đã ảnh hưởng khách hàng.

> Khi stakeholder bất đồng, hãy làm rõ ai chịu trách nhiệm kết quả và tiêu chí nào dùng để chấp nhận trước khi viết prompt.`
},
{
  id: 'qz-ccap-117',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A Claude-powered support assistant has been running in pilot with one customer segment for six weeks. Quality metrics are stable and support tickets handled by the assistant have dropped 20 percent. The product team wants to expand to all segments immediately. What is the safest next step?',
  options: [
    'Enable the assistant for all customers tomorrow since pilot metrics look good',
    'Run the pilot for another six months before any change',
    'Expand to one more segment at a time, monitor quality and cost per segment, then decide',
    'Ask Claude to write the rollout plan and follow it without human review'
  ],
  answer: 2,
  explain: `**Đúng: mở rộng từng đợt, không xả cả hệ thống cùng lúc.** Pilot chỉ xác minh công việc với một phân đoạn khách hàng nhỏ. Khi sang phân đoạn khác, ngữ cảnh, loại câu hỏi và mức độ phức tạp có thể khác, dẫn đến chất lượng giảm hoặc chi phí tăng. Mở rộng từng nhóm giúp phát hiện vấn đề sớm, chỉnh sửa prompt hoặc quy trình mà không ảnh hưởng toàn bộ khách hàng.

### Vì sao các phương án khác sai
- **Bật cho tất cả ngay:** nếu có lỗi chỉ xuất hiện ở một phân đoạn nhất định, toàn bộ khách hàng sẽ bị ảnh hưởng cùng lúc.
- **Chờ thêm sáu tháng:** bỏ qua cơ hội từ giá trị đã chứng minh được, làm chậm việc đem công cụ đến nhiều người hơn.
- **Yêu cầu Claude viết kế hoạch rollout:** Claude có thể đề xuất nhưng không thay thế quyết định của con người dựa trên số liệu thực tế.

> Mỗi đợt mở rộng nên có ngưỡng dừng: nếu tỉ lệ câu trả lời bị ý hoặc chi phí vượt ngưỡng, dừng lại và xem xét lại trước khi tiếp tục.`
},
{
  id: 'qz-ccap-118',
  topic: 'claude',
  multi: true,
  q: '[Stakeholder & Lifecycle] A company is rolling out a Claude-powered coding assistant to 200 developers. Some teams are excited, while others worry the tool will replace their jobs or leak code. Which two actions best support adoption? (Choose 2)',
  options: [
    'Publish clear usage guidelines and explain what data is sent to Claude',
    'Tell developers the assistant is mandatory and disable opt-out',
    'Appoint champions in each team to collect feedback and share best practices',
    'Hide the data-handling details so developers are not worried',
    'Install the assistant silently on every machine without announcement'
  ],
  answer: [0, 2],
  explain: `**Đúng: minh bạch thông tin và người dẫn dắt nội bộ.** Hướng dẫn sử dụng minh bạch (dữ liệu nào được gửi, cách lưu trữ, ai xem được) giảm lo ngại về bảo mật. Người dẫn dắt trong từng nhóm thu thập phản hồi thực tế, chia sẻ mẹo sử dụng và giúp đồng nghiệp tự tin dùng công cụ, thay vì để mọi người tự mò mẫm.

### Vì sao từng lựa chọn còn lại sai
- **Bắt buộc dùng và tắt tùy chọn:** gây phản kháng, người dùng sẽ tìm cách tránh công cụ hoặc dùng ngoài kiểm soát.
- **Ẩn chi tiết xử lý dữ liệu:** không giải quyết được lo ngại, ngược lại làm giảm niềm tin khi sau này bị phát hiện.
- **Cài đặt lặng lẽ không thông báo:** vi phạm niềm tin và có thể vi phạm chính sách bảo mật nội bộ.

> Thay đổi thành công bắt đầu từ tin tưởng, không phải từ lệnh ngang hàng. Hãy cho phép người dùng thử và đóng góp ý kiến.`
},
{
  id: 'qz-ccap-119',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] An architect must explain to non-technical executives why a Claude feature sometimes answers slowly and costs more than expected. Which explanation is most effective?',
  options: [
    'Show the raw API latency logs and token counts for every request',
    'Use analogies and simple metrics: compare cost per resolved ticket and typical response time, with examples',
    'Tell them the model is slow because it is thinking hard',
    'Say that speed and cost cannot be predicted and ask them to accept it'
  ],
  answer: 1,
  explain: `**Đúng: dịch chỉ số kỹ thuật thành ngôn ngữ kinh doanh.** Ban lãnh đạo không cần xem log từng request; họ cần biết ảnh hưởng gì đối với chi phí và trải nghiệm khách hàng. So sánh chi phí cho mỗi ticket đã giải quyết và thời gian phản hồi điển hình, kèm ví dụ thực tế (ví dụ: câu trả lời đơn giản mất hai giây và tốn một số đồng, câu phức tạp mất mười giây và tốn nhiều hơn), giúp họ ra quyết định dựa trên giá trị.

### Vì sao các phương án khác sai
- **Hiển thị log thô và số token:** quá chi tiết, khó hiểu, và không cho thấy tác động kinh doanh.
- **Nói model đang nghĩ sâu:** là gán đẳng tính con người cho mô hình, không giải thích được nguyên nhân kỹ thuật thực sự (dài độ dài context, model lớn, hàng đợi).
- **Không thể dự báo và chấp nhận:** làm tổ chức mất sự tin tưởng vào khả năng quản lý chi phí và hiệu suất.

> Luôn đính kèm một mục tiêu đo được (ví dụ: p95 dưới năm giây, chi phí dưới X đồng mỗi ticket) để ban lãnh đạo có thể theo dõi.`
},
{
  id: 'qz-ccap-120',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A Claude-powered assistant has been live for three months. Support agents report that some answers are outdated compared to the latest policy documents. How should the team establish a feedback loop?',
  options: [
    'Wait for customers to complain before making any changes',
    'Ask agents to manually correct every wrong answer in a spreadsheet',
    'Add a thumbs-up or thumbs-down rating on each answer, review low-rated answers weekly, and update the knowledge source',
    'Replace the assistant with a static FAQ page'
  ],
  answer: 3,
  explain: `**Đúng: thu thập phản hồi có cấu trúc và xử lý định kỳ.** Nút tốt hoặc xấu trên mỗi câu trả lời cho thấy câu nào cần xem xét. Nhóm vận hành xem xét từng tuần, nhóm các lỗi giống nhau, rồi cập nhật nguồn kiến thức (tài liệu, đoạn trong RAG) để khắc phục. Cách này biến trải nghiệm của nhân viên đầu tiên vào bước cải thiện hệ thống.

### Vì sao các phương án khác sai
- **Chờ khách phàn nàn:** thì hệ thống đã gây thiệt hại và mất uy tín.
- **Sửa tay trong bảng tính:** không mở rộng được, không cải thiện được mô hình hay nguồn dữ liệu cho các câu hỏi tương tự sau này.
- **Thay bằng trang FAQ tĩnh:** mất đi khả năng tự động trả lời và tra cứu mà công cụ mang lại.

> Phản hồi từ người dùng cuối là tín hiệu sớm nhất về chất lượng giảm; hãy thiết kế cách thu thập ngay từ ngày đầu.`
},
{
  id: 'qz-ccap-121',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] Before building a Claude feature for expense approval, a product team asks what success looks like. Which approach best defines success upfront?',
  options: [
    'Agree on measurable goals with stakeholders, such as approval time and error rate, before writing any code',
    'Build the feature first, then decide what to measure based on what is easy to track',
    'Measure only the number of requests sent to Claude',
    'Ask Claude to define success and use its answer'
  ],
  answer: 0,
  explain: `**Đúng: định nghĩa mục tiêu đo được trước khi xây dựng.** Với duyệt chi phí, mục tiêu có thể là thời gian duyệt trung bình giảm từ hai ngày xuống bốn giờ, tỉ lệ sai sót dưới một phần trăm, và sự hài lòng của người dùng. Khi có mục tiêu rõ ràng, nhóm có thể thiết kế công cụ, chọn model và biết khi nào dừng lại hoặc điều chỉnh. Mục tiêu cũng giúp tránh xây dựng tính năng mà không mang giá trị thực.

### Vì sao các phương án khác sai
- **Xây dựng trước, đo sau:** dễ dẫn đến xây dựng những thứ không cần thiết và khó biết có thành công hay không.
- **Chỉ đo số request gửi Claude:** số lượng gọi API không cho biết kết quả có đúng hay khách hàng hài lòng.
- **Nhờ Claude định nghĩa thành công:** mô hình không biết mục tiêu kinh doanh và ràng buộc thực tế của công ty.

> Mục tiêu thành công phải được đồng ý bởi cả bên kỹ thuật và bên kinh doanh, và ghi lại để tham khảo sau khi triển khai.`
},
{
  id: 'qz-ccap-122',
  topic: 'claude',
  multi: true,
  q: '[Stakeholder & Lifecycle] A company wants to retire an older Claude-powered feature that few customers use, but some enterprise customers still depend on it. Which two steps should the team take? (Choose 2)',
  options: [
    'Turn off the feature immediately without notice to save costs',
    'Notify affected customers in advance, give a timeline, and offer migration support',
    'Keep the feature running forever because a few customers use it',
    'Document the retirement decision, including the replacement path and end-of-support date',
    'Tell customers to find their own alternative without help'
  ],
  answer: [1, 3],
  explain: `**Đúng: thông báo trước và ghi lại quyết định ngừng chạy.** Khách hàng doanh nghiệp thường xây dựng quy trình xung quanh tính năng; ngừng đột ngột sẽ ảnh hưởng hoạt động của họ. Thông báo sớm, cung cấp lộ trình và hỗ trợ di chuyển giúp họ chuẩn bị. Ghi lại quyết định (li do, thay thế, ngày ngừng hỗ trợ) tạo cơ sở để kiểm tra và tránh tranh luận sau này.

### Vì sao từng lựa chọn còn lại sai
- **Ngừng ngay không thông báo:** gây gián đoạn nghiệp vụ và làm mất niềm tin.
- **Giữ vĩnh viễn:** chi phí vận hành còn và nhóm phải bảo trì một thứ ít dùng.
- **Để khách hàng tự tìm cách thay thế:** không chịu trách nhiệm đối với khách hàng đã sử dụng dịch vụ của công ty.

> Ngừng một tính năng AI cũng cần quy trình như ngừng dịch vụ thường: thông báo, hỗ trợ chuyển đổi và ngày chấm dứt rõ ràng.`
},
{
  id: 'qz-ccap-123',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] An architect needs to convince leadership to fund a Claude-powered document-review feature. Which pitch is most persuasive?',
  options: [
    'Focus only on how advanced Claude is and list all its capabilities',
    'Say that competitors use Claude, so the company must use it too',
    'Ask for unlimited budget because AI projects are unpredictable',
    'Show the current manual cost per review, the estimated automated cost, and the expected quality level with a pilot plan'
  ],
  answer: 3,
  explain: `**Đúng: trình bày giá trị kinh tế và kế hoạch thử nghiệm.** Ban lãnh đạo quan tâm chi phí hiện tại (nhân sự review tài liệu theo tay), chi phí dự kiến khi tự động hóa, và mức chất lượng mong đợi. Kế hoạch pilot trên một phần nhỏ lưu lượng cho thấy rủi ro kiểm soát được và có con số để đánh giá trước khi đầu tư lớn.

### Vì sao các phương án khác sai
- **Chỉ nói về khả năng của Claude:** không giải thích vì công ty nên trả tiền và lợi ích gì.
- **Đối thủ dùng nên phải dùng:** lý do theo xu hướng không liên quan đến tình huống của chính công ty.
- **Yêu cầu ngân sách không giới hạn:** không thể phê duyệt và không phản ánh sự cẩn thận trong tài chính.

> Kết quả pilot nên có cả chi phí và chất lượng, chứ không chỉ số token hay thời gian phản hồi.`
},
{
  id: 'qz-ccap-124',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A Claude feature must satisfy legal, security, product, and engineering stakeholders with different concerns. Which approach best aligns them?',
  options: [
    'Let engineering decide everything because they build the system',
    'Create a shared requirements document that captures each stakeholder concerns and review it together',
    'Ask each stakeholder to send separate emails and hope they agree',
    'Implement what legal asks first, then fix issues later'
  ],
  answer: 1,
  explain: `**Đúng: tài liệu yêu cầu chung và xem xét cùng nhau.** Mỗi bên quan tâm một khía cạnh khác nhau: legal (tuân thủ, dữ liệu nhạy cảm), security (kiểm soát truy cập), product (trải nghiệm người dùng), engineering (độ trễ, chi phí, bảo trì). Một tài liệu chung giúp mọi người thấy được ràng buộc của nhau và tìm cách thỏa hiệp trước khi code, tránh làm lại sau khi phát hiện xung đột.

### Vì sao các phương án khác sai
- **Engineering quyết tất cả:** bỏ qua ràng buộc pháp lý và bảo mật, có thể dẫn đến vi phạm.
- **Gửi email riêng rãnh rành:** khó tổng hợp, dễ xảy ra hiểu lầm và không có bản ghi chung.
- **Triển khai theo legal trước rồi sửa sau:** chi phí cao và có thể phải thay đổi toàn bộ kiến trúc khi các bên khác phản hồi.

> Tài liệu này nên được xem xét lại khi có thay đổi lớn về model, quy trình hoặc quy định pháp lý.`
},
{
  id: 'qz-ccap-125',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A Claude-powered assistant is launched, but end users keep asking basic questions the assistant should answer. What is the most likely missing piece?',
  options: [
    'The model is not smart enough and should be replaced',
    'Disable the assistant and return to email support',
    'Users were not trained on how to write effective prompts and what the assistant can do',
    'Add more documents to the knowledge base without telling users'
  ],
  answer: 2,
  explain: `**Đúng: người dùng cần được hướng dẫn cách sử dụng.** Nhiều người chưa quen với trợ lý AI: họ có thể hỏi quá ngắn, không cung cấp đủ bối cảnh, hoặc không biết công cụ có thể tra cứu đơn hàng hay chính sách. Đào tạo ngắn (cách viết câu hỏi, ví dụ câu hỏi tốt, giới hạn của công cụ) giúp người dùng tận dụng được năng lực của trợ lý.

### Vì sao các phương án khác sai
- **Thay model khác:** vấn đề thường nằm ở cách dùng, không phải độ thông minh của model.
- **Tắt trợ lý và quay lại email:** mất giá trị tự động hóa đã xây dựng.
- **Thêm tài liệu mà không thông báo:** người dùng vẫn không biết có thể hỏi về những tài liệu đó.

> Hướng dẫn người dùng là phần không thể thiếu của mọi sản phẩm AI, chứ không phải chỉ là phụ lục.`
},
{
  id: 'qz-ccap-126',
  topic: 'claude',
  multi: true,
  q: '[Stakeholder & Lifecycle] Two departments want different behaviors from the same Claude assistant: finance wants cautious, policy-heavy answers, while sales wants quick, flexible answers. Which two approaches best handle this conflict? (Choose 2)',
  options: [
    'Build one assistant and force both departments to accept the same behavior',
    'Use separate system prompts or configurations for each department, routed by user or context',
    'Let sales override finance answers whenever they disagree',
    'Document the conflict, agree on which use case takes priority, and review periodically',
    'Ask the model to guess the department and change behavior automatically'
  ],
  answer: [1, 3],
  explain: `**Đúng: phân tách cấu hình theo nhóm và ghi nhận sự bất đồng.** Nếu ngữ cảnh khác nhau (ví dụ: user thuộc phòng tài chính hay phòng doanh số), có thể dùng system prompt hoặc cấu hình riêng cho từng nhóm, và định tuyến phù hợp. Đồng thời, cần ghi lại sự xung đột, đồng ý ưu tiên use case nào khi có mâu thuẫn, và xem xét lại định kỳ để điều chỉnh.

### Vì sao từng lựa chọn còn lại sai
- **Một trợ lý, một hành động cho tất cả:** một bên sẽ hài lòng, bên kia sẽ không sử dụng hoặc sử dụng sai.
- **Sales ghi đè finance:** làm mất tính nhất quán và có thể vi phạm quy định tài chính.
- **Nhờ model đoán phòng ban:** model không tin cậy phân loại này, đặc biệt khi ngữ cảnh không rõ ràng.

> Khi không thể thỏa mãn tất cả, hãy chọn hành động an toàn hơn (ít rủi ro nhất) làm mặc định và cho phép chọn thay đổi theo ý định.`
},
{
  id: 'qz-ccap-127',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A Claude feature has been running in production for a year. How often should stakeholders review whether it still meets business needs?',
  options: [
    'Only when something breaks',
    'Never, because the model does not change',
    'Whenever a new Claude model is released, regardless of business impact',
    'On a regular cadence, such as quarterly, with metrics and user feedback'
  ],
  answer: 3,
  explain: `**Đúng: xem xét định kỳ dựa trên số liệu và phản hồi.** Ngay cả khi model không đổi, nhu cầu kinh doanh, quy trình và dữ liệu đầu vào sẽ thay đổi. Xem xét theo quý (hoặc định kỳ phù hợp) với các chỉ số như tỉ lệ câu trả lời đúng, chi phí, độ trễ và phản hồi người dùng giúp phát hiện sớm sự suy giảm chất lượng hoặc cơ hội cải thiện.

### Vì sao các phương án khác sai
- **Chỉ xem xét khi hỏng:** thì ảnh hưởng đến người dùng đã xảy ra.
- **Không bao giờ xem xét:** model không đổi không có nghĩa hệ thống vẫn phù hợp; quy trình nghiệp vụ có thể đã thay đổi.
- **Xem xét mỗi khi có model mới:** không phải mọi phiên bản model mới đều mang lại lợi ích cho trường hợp sử dụng cụ thể, và việc thay đổi liên tục gây rủi ro vận hành.

> Lên lịch xem xét theo định kỳ như một kiểm tra sức khỏe hệ thống, chứ không chỉ khẩn cấp khi có sự cố.`
},
{
  id: 'qz-ccap-128',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] A project team built a Claude integration and is handing it over to the operations team. Which information is most important to transfer?',
  options: [
    'Only the source code and API key',
    'How the system is monitored, who to contact during incidents, rollback steps, and prompt versions',
    'A recording of the project kickoff meeting',
    'The list of prompts used during development'
  ],
  answer: 1,
  explain: `**Đúng: chuyển giao thông tin vận hành, không chỉ code.** Đội vận hành cần biết cách theo dõi hệ thống (metrics, cảnh báo), ai liên hệ khi có sự cố, cách quay lại phiên bản trước (rollback) và phiên bản prompt hiện đang dùng. Nếu không có thông tin này, một sự cố nhỏ có thể kéo dài vì không biết phải sửa ở đâu hoặc ai chịu trách nhiệm.

### Vì sao các phương án khác sai
- **Chỉ code và API key:** thiếu bối cảnh vận hành, làm khó khôi phục khi có sự cố.
- **Bản ghi cuộc họp khởi động:** không chứa thông tin hành động cần thiết cho vận hành hàng ngày.
- **Danh sách prompt phát triển:** không đủ; cần biết prompt nào đang chạy production và cách thay đổi an toàn.

> Handoff tốt bao gồm runbook: cấu trúc hệ thống, quy trình xử lý sự cố, và cách cập nhật prompt mà không gây gián đoạn.`
},
{
  id: 'qz-ccap-129',
  topic: 'claude',
  q: '[Stakeholder & Lifecycle] An enterprise has an account relationship with Anthropic and wants to optimize its Claude usage. Which stakeholder should lead the conversation about pricing, quotas, and support?',
  options: [
    'The individual developer who writes the most prompts',
    'The procurement or vendor-management stakeholder with the account contract',
    'The security team alone, without involving finance',
    'The end users who interact with Claude daily'
  ],
  answer: 1,
  explain: `**Đúng: bên quản lý nhà cung cấp hoặc mua sắm đứng đầu.** Họ nắm hợp đồng, hạn mức sử dụng, giá cả và mức hỗ trợ với Anthropic. Các bên khác (kỹ thuật, bảo mật, tài chính) cung cấp đầu vào, nhưng việc đàm phán và quản lý quan hệ nhà cung cấp nên tập trung tại một người để tránh thông tin bị phân mảnh hoặc lời hứa mâu thuẫn.

### Vì sao các phương án khác sai
- **Lập trình viên viết nhiều prompt nhất:** biết kỹ thuật nhưng không có thẩm quyền hoặc thông tin hợp đồng.
- **Bảo mật một mình:** bảo mật quan trọng nhưng không đủ để đàm phán giá cả và hạn mức.
- **Người dùng cuối:** có ý kiến về trải nghiệm nhưng không tham gia quản lý hợp đồng.

> Giữ một điểm liên hệ duy nhất với nhà cung cấp giúp quản lý chi phí, hạn mức và hỗ trợ một cách nhất quán.`
},
{
  id: 'qz-ccap-130',
  topic: 'claude',
  multi: true,
  q: '[Stakeholder & Lifecycle] A team is documenting a Claude feature for future stakeholders. Which two items should be included? (Choose 2)',
  options: [
    'Only the final prompts, without any explanation',
    'Architecture decision records explaining why key choices were made',
    'Operational runbooks for monitoring, incident response, and prompt updates',
    'A list of every internal email about the project',
    'The model weights used by Claude'
  ],
  answer: [1, 2],
  explain: `**Đúng: ghi nhận quyết định kiến trúc và sổ thao tác vận hành.** ADR giải thích tại sao chọn một model, một cách định tuyến, hoặc một thiết kế bảo mật — điều này rất quan trọng khi thành viên mới vào dự án hoặc cần xem xét lại sau nhiều năm. Runbook hướng dẫn vận hành hàng ngày: theo dõi sao, xử lý sự cố, và cách cập nhật prompt an toàn.

### Vì sao từng lựa chọn còn lại sai
- **Chỉ prompt cuối cùng mà không giải thích:** người sau không biết lý do và dễ thay đổi sai chỗ.
- **Tập hợp email nội bộ:** khó tìm, không có cấu trúc, và không phải tài liệu thiết kế.
- **Trọng số model:** Claude là model bên ngoài, trọng số không được công bố và không cần lưu trong tài liệu nội bộ.

> Tài liệu tốt trả lời ba câu hỏi: hệ thống làm gì, tại sao được thiết kế như vậy, và vận hành như thế nào khi có sự cố.`
},
{
  id: 'qz-ccap-131',
  topic: 'claude',
  q: '[Models & Context] A team needs to choose a Claude model for a customer-facing assistant that answers simple FAQ questions 24/7. Cost and speed matter more than deep reasoning. Which model class is the best fit?',
  options: [
    'The most capable model for every request, regardless of cost',
    'A model that requires fine-tuning before it can answer FAQs',
    'The smallest, fastest, and cheapest model that handles the task well',
    'A different model for every single question to spread cost'
  ],
  answer: 2,
  explain: `**Đúng: chọn model nhỏ nhất, nhanh nhất và rẻ nhất vẫn xử lý tốt công việc.** Đa số câu hỏi thường gặp là đơn giản (giờ mở cửa, cách reset mật khẩu) không cần suy luận sâu. Model nhỏ (tốn ít hơn, độ trễ thấp) đáp ứng được với chi phí thấp hơn nhiều so với model mạnh nhất. Điều này phù hợp với lưu lượng lớn và nhạy cảm về chi phí.

### Vì sao các phương án khác sai
- **Model mạnh nhất cho mọi yêu cầu:** chất lượng cao nhưng chi phí và độ trễ không cần thiết cho câu đơn giản.
- **Cần fine-tuning trước khi trả câu hỏi thường hỏi:** Claude đã có khả năng trả lời dựa trên tài liệu cung cấp, không cần huấn luyện lại cho câu hỏi cơ bản.
- **Dùng model khác cho mỗi câu hỏi:** làm tăng độ phức tạp vận hành và khó quản lý chi phí.

> Theo dõi tỉ lệ câu trả lời thỏa mãn của model nhỏ; nếu quá nhiều câu bị bỏ lỡ, hãy nâng cấp có chọn lọc cho nhóm câu đó, chứ không phải toàn bộ.`
},
{
  id: 'qz-ccap-132',
  topic: 'claude',
  q: '[Models & Context] A legal assistant must answer questions across 5000-page case files that do not fit in one Claude prompt. Which design fits best?',
  options: [
    'Retrieve only the relevant passages for each question and send those plus the question to Claude',
    'Paste all case files into every prompt and hope the context window is large enough',
    'Fine-tune Claude to memorize all case files',
    'Ask users to read the files themselves and use Claude only for formatting'
  ],
  answer: 0,
  explain: `**Đúng: truy xuất đoạn liên quan và chỉ gửi những đoạn đó kèm câu hỏi.** 5000 trang vượt nhiều lần ngoài cửa sổ ngữ cảnh (context window) của Claude. Kiến trúc chuẩn là chia tài liệu thành đoạn, lập chỉ mục, rồi khi có câu hỏi, truy xuất các đoạn liên quan nhất và gửi kèm câu hỏi. Cách này giữ chi phí thấp và câu trả lời tập trung vào bằng chứng thực tế.

### Vì sao các phương án khác sai
- **Dán toàn bộ hồ sơ vào mỗi prompt:** vượt ngoài cửa sổ ngữ cảnh, chi phí cao, và chất lượng giảm khi ngữ cảnh quá dài.
- **Fine-tune Claude để ghi nhớ tất cả hồ sơ:** không phù hợp cho tri thức thay đổi liên tục, khó cập nhật, và khó trích dẫn nguồn.
- **Yêu cầu người dùng đọc và chỉ dùng Claude để định dạng:** mất đi giá trị chính của trợ lý là trả lời câu hỏi.

> Mỗi đoạn được truy xuất nên kèm thông tin nguồn (trang, đoạn) để người dùng có thể kiểm chứng câu trả lời.`
},
{
  id: 'qz-ccap-133',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] A team wants Claude to return answers in a consistent format across many requests. Which two approaches reliably improve format consistency? (Choose 2)',
  options: [
    'Describe the desired format in the system prompt and include a few example input-output pairs',
    'Ask the model to try its best and hope it stays consistent',
    'Change the requested format in every request to keep the model alert',
    'Use tool use with a JSON Schema that defines the exact output shape',
    'Rely on the model default format without any instruction'
  ],
  answer: [0, 3],
  explain: `**Đúng: định dạng rõ trong system prompt kèm ví dụ, và dùng tool với JSON Schema.** Mô tả định dạng mong muốn (ví dụ: JSON, danh sách gạch đầu dòng) trong system prompt giúp model biết cách cấu trúc câu trả lời. Thêm ít ví dụ đầu vào-đầu ra làm rõ mong muốn. Tool use với JSON Schema bắt buộc đầu ra tuân thủ đúng hình dạng đã khai báo, giúp nhất quán giữa các request.

### Vì sao từng lựa chọn còn lại sai
- **Hy vọng model giữ nhất quán:** không có cơ chế cưỡng chế, chất lượng sẽ dao động giữa các request.
- **Thay đổi định dạng mỗi request:** làm model khó học và kết quả không thể dự báo.
- **Dựa vào định dạng mặc định:** không đảm bảo đáp ứng yêu cầu nghiệp vụ cụ thể của tổ chức.

> Mô tả format bằng cấu trúc (ví dụ JSON Schema) thì model bám theo khuôn tốt hơn là chỉ nhờ bằng lời; luôn kiểm thử trên bộ câu hỏi thật.`
},
{
  id: 'qz-ccap-134',
  topic: 'claude',
  q: '[Models & Context] A team upgrades to a new Claude model version and sees different output format for the same prompts. What should they do before adopting the new version?',
  options: [
    'Run an evaluation comparing old and new versions on the same inputs, then roll out gradually',
    'Switch all traffic to the new version immediately to get the latest improvements',
    'Assume the new version is always better and skip testing',
    'Keep the old version forever because it already works'
  ],
  answer: 0,
  explain: `**Đúng: đánh giá trên cùng đầu vào trước khi mở rộng.** Mỗi phiên bản model có thể tạo ra định dạng, độ dài và chất lượng khác nhau. Nhóm nên chạy tập đánh giá (eval) với cùng các câu hỏi trên cả hai phiên bản, so sánh chất lượng và chi phí, sau đó thử nghiệm trên một phần nhỏ lưu lượng trước khi triển khai toàn bộ.

### Vì sao các phương án khác sai
- **Chuyển tất cả lưu lượng ngay:** nếu phiên bản mới có vấn đề với trường hợp sử dụng cụ thể, toàn bộ khách hàng bị ảnh hưởng.
- **Giả định phiên bản mới luôn tốt hơn:** không nhất định phù hợp với nhu cầu của công ty, và có thể gây hồi quy chất lượng.
- **Giữ phiên bản cũ vĩnh viễn:** bỏ lỡ cải tiến và có thể mất hỗ trợ cho phiên bản cũ sau này.

> Thử nghiệm trên một phần nhỏ lưu lượng (canary) giúp phát hiện vấn đề trước khi ảnh hưởng toàn bộ người dùng.`
},
{
  id: 'qz-ccap-135',
  topic: 'claude',
  q: '[Models & Context] A team wants Claude to follow a specific tone and structure in every answer. Which approach is most reliable?',
  options: [
    'Ask the model to remember the tone in every conversation',
    'Include clear tone and formatting instructions in the system prompt, with examples',
    'Hope the model figures out the tone from the user questions',
    'Use a different model for each answer to vary the tone'
  ],
  answer: 1,
  explain: `**Đúng: ghi hướng dẫn tone và định dạng vào system prompt kèm ví dụ.** System prompt là phần định hướng hành vi của Claude trong toàn bộ phiên. Việc nêu rõ giọng văn (ví dụ: lịch sự, chuyên nghiệp) và cấu trúc câu trả lời (ví dụ: tóm tắt trước, chi tiết sau) kèm ví dụ giúp mô hình tạo ra kết quả nhất quán hơn so với dựa vào việc mô hình tự nhận diện từ câu hỏi của người dùng.

### Vì sao các phương án khác sai
- **Nhờ model ghi nhớ trong mọi cuộc trò chuyện:** model không đảm bảo giữ nhất quán giữa các phiên, và không có cơ chế cưỡng chế.
- **Hy vọng model tự đoán:** dẫn đến chất lượng dao động, không thể dự báo.
- **Dùng model khác cho mỗi câu trả lời:** làm chất lượng dao động và khó quản lý.

> System prompt nêu rõ tone và cấu trúc, kèm vài ví dụ mẫu (few-shot) để model bắt chước; đây là cách rẻ nhất để giữ nhất quán.`
},
{
  id: 'qz-ccap-136',
  topic: 'claude',
  q: '[Models & Context] A Claude assistant needs to analyze images of receipts along with text questions. Which capability should the team use?',
  options: [
    'Ask users to type the receipt contents manually',
    'Convert every image to text with a separate tool before sending to Claude',
    'Send the image as part of the multimodal input together with the text question',
    'Only answer text questions and ignore images'
  ],
  answer: 2,
  explain: `**Đúng: gửi ảnh như một phần đầu vào đa phương tiện (multimodal) cùng với câu hỏi văn bản.** Claude có khả năng xử lý hình ảnh và văn bản cùng nhau, nên đội có thể gửi ảnh hóa đơn kèm câu hỏi (ví dụ: tong số tiền trên hóa đơn này là bao nhiêu?) và nhận câu trả lời dựa trên cả hai loại nội dung. Cách này đơn giản và giữ được ngữ cảnh giữa ảnh và câu hỏi.

### Vì sao các phương án khác sai
- **Yêu cầu người dùng nhập tay:** tốn thời gian, dễ sai, và giảm trải nghiệm người dùng.
- **Chuyển đổi ảnh thành văn bản bằng công cụ riêng trước:** thêm bước xử lý, có thể mất thông tin bố cục hoặc số liệu quan trọng trong ảnh.
- **Chỉ trả lời văn bản và bỏ qua ảnh:** không đáp ứng được yêu cầu phân tích hóa đơn từ hình ảnh.

> Kiểm tra chất lượng ảnh (độ phân giải, độ sáng) trước khi gửi; ảnh mờ có thể khiến model đọc sai số liệu.`
},
{
  id: 'qz-ccap-137',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] A market-research team must produce one report from 200 interview transcripts that together far exceed any single context window. Which two statements describe a sound approach? (Choose 2)',
  options: [
    'Summarize each transcript on its own first, then feed the per-transcript summaries into a final summarization pass',
    'In the final pass, ask Claude to group findings into themes and note which interviews support each theme',
    'Paste as many transcripts as possible into one request and raise max_tokens until they all fit',
    'Summarize only the five longest transcripts and assume the rest say the same things',
    'Pick one transcript at random as representative and summarize only that one'
  ],
  answer: [0, 1],
  explain: `**Đúng: chia nhỏ rồi tổng hợp (map-reduce), và giữ dấu vết từng nguồn.** 200 transcript không vừa một cửa sổ ngữ cảnh, nên chiến lược chuẩn là hai tầng: tầng map tóm tắt từng transcript thành một bản ngắn (giữ số liệu và trích dẫn quan trọng), tầng reduce đưa các bản tóm tắt đó vào một request cuối để Claude tổng hợp thành báo cáo chung. Ở request cuối, yêu cầu nhóm phát hiện theo chủ đề kèm nguồn phỏng vấn giúp báo cáo kiểm chứng được và tránh gán sai ý cho người trả lời.

### Vì sao từng lựa chọn còn lại sai
- **Nhồi càng nhiều transcript càng tốt rồi tăng max_tokens:** tổng kích thước vượt mọi cửa sổ ngữ cảnh; max_tokens chỉ nâng trần đầu ra, không mở rộng đầu vào.
- **Chỉ tóm tắt năm transcript dài nhất:** giả định vô căn cứ rằng các transcript còn lại nói cùng nội dung; báo cáo sẽ thiếu góc nhìn.
- **Chọn ngẫu nhiên một transcript làm đại diện:** một mẫu không đại diện cho tập phỏng vấn; kết luận sẽ phiến diện.

### Lưu ý triển khai
Tầng map nên chạy song song và lưu lại từng bản tóm tắt kèm mã transcript, để tầng reduce hoặc người đọc truy vết ngược khi cần. Nếu tầng reduce vẫn quá dài, chia theo chủ đề rồi tổng hợp tiếp một tầng nữa.

> Với văn bản dài, tóm tắt phân cấp luôn khả thi hơn nhồi một lần; hãy thiết kế pipeline nhiều bước thay vì một prompt khổng lồ.`
},
{
  id: 'qz-ccap-138',
  topic: 'claude',
  q: '[Models & Context] A payments company calls Claude through a model identifier that always resolves to the newest release. After the provider quietly rolled out a new release, response formats shifted and two downstream parsers broke. What is the most appropriate fix?',
  options: [
    'Pin production traffic to a specific dated model version, and evaluate new releases in staging before switching',
    'Switch to the smallest model so the provider changes it less often',
    'Remove the parsers and show raw model output to users',
    'Ask the provider to freeze the newest release until the company is ready'
  ],
  answer: 0,
  explain: `**Đúng: ghim (pin) một phiên bản model xác định cho production, nâng cấp có kiểm soát.** Một model identifier luôn trỏ tới bản mới nhất nghĩa là hành vi hệ thống có thể đổi mà không ai deploy gì — đúng loại thay đổi ngầm khó truy vết nhất. Khi ghim vào một phiên bản xác định, hành vi ổn định giữa các lần gọi; muốn dùng bản mới, chạy eval trên tập đầu vào thật, kiểm tra các consumer như parser, prompt và schema, rồi chuyển dần từng phần lưu lượng. Cách này biến nâng cấp model thành một quyết định kỹ thuật có kế hoạch thay vì một sự cố.

### Vì sao các phương án khác sai
- **Đổi sang model nhỏ nhất:** provider vẫn phát hành bản mới cho model nhỏ; vấn đề không nằm ở việc chọn model nào mà ở việc trỏ vào một mục tiêu di động.
- **Bỏ parser, hiện output thô:** đẩy chi phí xử lý sang người dùng và không sửa được nguyên nhân.
- **Xin provider đóng băng bản mới:** provider không thể đóng băng theo yêu cầu riêng của từng khách hàng; quyền kiểm soát nằm ở phía bạn chọn phiên bản nào để gọi.

### Cách làm
Ghi rõ phiên bản model trong cấu hình có review, thêm kiểm tra định dạng đầu ra vào CI, và lập lịch đánh giá phiên bản mới định kỳ thay vì để hệ thống tự trôi theo.

> Production cần hành vi có thể lặp lại: ghim phiên bản model giống như ghim phiên bản thư viện, không dùng alias trôi nổi.`
},
{
  id: 'qz-ccap-139',
  topic: 'claude',
  q: '[Models & Context] A creative writing assistant needs varied, imaginative responses, while a data extraction assistant needs consistent, predictable output. Which setting helps differentiate them?',
  options: [
    'Use the same temperature for both assistants',
    'Disable temperature entirely for both',
    'Change the model for every request',
    'Set higher temperature for creative writing and lower temperature for data extraction'
  ],
  answer: 3,
  explain: `**Đúng: điều chỉnh temperature theo mục đích.** Temperature điều khiển mức độ ngẫu nhiên của đầu ra. Viết sáng tạo cần temperature cao hơn để tạo ra nhiều ý tưởng khác nhau, trong khi trích xuất dữ liệu cần temperature thấp (gần 0) để đầu ra nhất quán và có thể dự báo. Cùng một thiết lập không phù hợp cho cả hai loại tác vụ.

### Vì sao các phương án khác sai
- **Cùng temperature cho cả hai:** bản sáng tạo sẽ kém ý tưởng, bản trích xuất sẽ dễ bị thay đổi cấu trúc.
- **Tắt hoàn toàn temperature:** không phải cách khuyên dùng và không giải quyết được sự khác biệt giữa hai loại tác vụ.
- **Thay model cho mỗi yêu cầu:** làm tăng chi phí và độ phức tạp vận hành mà không cần thiết.

> Mức temperature phù hợp phải được xác định bằng kiểm thử trên tập dữ liệu thực tế của từng tác vụ.`
},
{
  id: 'qz-ccap-140',
  topic: 'claude',
  q: '[Models & Context] A team observes that most of their Claude cost comes from repeating the same long instructions in every request. Which change reduces cost most directly?',
  options: [
    'Switch to a cheaper model for every request',
    'Use prompt caching so repeated stable prefixes are not recomputed',
    'Send shorter user questions without context',
    'Disable all system prompts'
  ],
  answer: 1,
  explain: `**Đúng: dùng prompt caching cho tiền tố ổn định lặp lại.** Nếu những hướng dẫn dài giống nhau được gửi lại mỗi lần, prompt caching cho phép phần đó được tính một lần và đọc từ cache ở các lần sau, chi phí đọc cache thấp hơn nhiều so với tính toán lại mỗi lần. Cách này giảm trực tiếp chi phí nhập liệu mà không thay đổi câu trả lời.

### Vì sao các phương án khác sai
- **Chuyển sang model rẻ hơn cho mọi yêu cầu:** có thể làm giảm chất lượng cho các tác vụ phức tạp; chỉ là một phần của giải pháp.
- **Gửi câu hỏi người dùng ngắn hơn bù bỏ ngữ cảnh:** làm giảm chất lượng câu trả lời vì model thiếu thông tin cần thiết.
- **Tắt hết system prompt:** mất phần định hướng hành vi của mô hình, chất lượng sẽ giảm.

> Tiền tố được cache phải giống hệt nhau từng ký tự giữa các request, kể cả khoảng trắng và thứ tự mục.`
},
{
  id: 'qz-ccap-141',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] A team must decide between fine-tuning a Claude model, using retrieval-augmented generation (RAG), or putting documents in the context window for a question-answering feature over internal documents. Which two statements are sound? (Choose 2)',
  options: [
    'Fine-tuning is the only way to make Claude know internal documents',
    'RAG retrieves relevant passages per question and sends them with the question to Claude',
    'Putting all documents in the context window is always the cheapest option',
    'Context window size limits how much can be sent at once, so very large corpora need retrieval'
  ],
  answer: [1, 3],
  explain: `**Đúng: RAG truy xuất đoạn liên quan theo câu hỏi, và cửa sổ ngữ cảnh có giới hạn kích thước.** RAG chỉ gửi phần tài liệu liên quan đến câu hỏi kèm theo câu hỏi, phù hợp với kho tài liệu lớn và thay đổi liên tục. Cửa sổ ngữ cảnh của Claude có giới hạn cố định, nên với kho tài liệu rất lớn, không thể gửi tất cả cùng một lúc mà cần truy xuất.

### Vì sao từng lựa chọn còn lại sai
- **Fine-tuning là cách duy nhất:** sai; Claude có thể trả lời dựa trên tài liệu cung cấp trong prompt hoặc qua RAG mà không cần huấn luyện lại.
- **Đưa tất cả tài liệu vào cửa sổ ngữ cảnh luôn là rẻ nhất:** sai; vượt quá giới hạn ngữ cảnh sẽ không hoạt động, và chi phí nhập liệu cao khi gửi toàn bộ kho tài liệu mỗi lần.

> Với tài liệu nội bộ thay đổi thường xuyên, RAG thường là lựa chọn thực tế hơn vì cập nhật chỉ cần thay đổi chỉ mục, không cần huấn luyện lại mô hình.`
},
{
  id: 'qz-ccap-142',
  topic: 'claude',
  q: '[Models & Context] A Claude agent needs to call internal APIs to look up customer orders. Which capability should be configured?',
  options: [
    'Ask users to call the API themselves and paste the result',
    'Give Claude direct access to the production database without restrictions',
    'Configure tool use with a clear input schema so Claude can call the order-lookup API',
    'Only allow Claude to answer from its training data'
  ],
  answer: 2,
  explain: `**Đúng: cấu hình tool use với schema đầu vào rõ ràng.** Tool use cho phép Claude gọi các hàm hoặc API bên trong (ví dụ: tra cứu đơn hàng) với đối số được xác định bởi JSON Schema. Claude quyết định khi nào gọi công cụ và hệ thống thực hiện gọi, rồi trả kết quả lại cho mô hình. Cách này an toàn hơn cho phép truy cập cơ sở dữ liệu không giới hạn và cho phép kiểm soát chính xác công cụ nào được dùng.

### Vì sao các phương án khác sai
- **Yêu cầu người dùng gọi API và dán kết quả:** không tận dụng được năng lực tự động hóa của agent.
- **Cho Claude truy cập trực tiếp cơ sở dữ liệu sản xuất không giới hạn:** nguy cơ bảo mật cao, có thể sửa hoặc xóa dữ liệu không mong muốn.
- **Chỉ cho phép trả lời từ dữ liệu huấn luyện:** Claude không biết thông tin đơn hàng thực tế của công ty nếu không được cung cấp.

> Mỗi công cụ nên có mô tả rõ ràng về mục đích và dữ liệu đầu vào, và các tác vụ nhạy cảm nên có bước phê duyệt của con người.`
},
{
  id: 'qz-ccap-143',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] A company launches a Claude support assistant for Vietnamese customers, but the knowledge base is in English. Vietnamese answers read unnaturally and sometimes mistranslate product terms. Which two changes most improve answer quality? (Choose 2)',
  options: [
    'Add a glossary of key product terms and a few example question-answer pairs written naturally in Vietnamese to the prompt',
    'Instruct the assistant to answer in Vietnamese while keeping product names, SKUs and codes untranslated',
    'Switch to the largest model and keep everything else unchanged',
    'Translate the entire knowledge base into Vietnamese with a separate tool and never use the English source again',
    'Ask customers to write in English so the assistant performs better'
  ],
  answer: [0, 1],
  explain: `**Đúng: cho model mẫu tiếng Việt tự nhiên, cộng glossary thuật ngữ và luật giữ nguyên tên riêng.** Chất lượng ngôn ngữ phụ thuộc nhiều vào ngữ cảnh được cung cấp: vài cặp hỏi–đáp viết bởi người bản ngữ giúp model bắt đúng văn phong; glossary giúp dịch nhất quán thuật ngữ sản phẩm; còn quy tắc giữ nguyên SKU và tên sản phẩm tránh việc model "dịch" cả mã định danh. Đây là các biện pháp ở lớp prompt và dữ liệu, áp dụng được ngay mà không cần huấn luyện lại.

### Vì sao từng lựa chọn còn lại sai
- **Đổi sang model lớn nhất:** model lớn hơn không tự biết thuật ngữ sản phẩm của công ty; văn phong kiểu dịch máy vẫn còn.
- **Dịch toàn bộ knowledge base rồi bỏ bản gốc:** tốn kém, dễ sai lệch thuật ngữ, và tạo ra hai nguồn sự thật phải đồng bộ; bản gốc vẫn nên là nguồn chuẩn.
- **Bảo khách viết tiếng Anh:** đẩy rào cản sang người dùng, giảm trải nghiệm và không sửa được chất lượng câu trả lời tiếng Việt.

### Cách kiểm tra
Lập bộ eval gồm câu hỏi thật từ khách hàng, chấm cả độ đúng nội dung và độ tự nhiên của tiếng Việt; so sánh trước và sau khi thêm glossary và ví dụ.

> Chất lượng đa ngôn ngữ đến từ ngữ cảnh và ví dụ đúng ngôn ngữ, không từ việc chọn model đắt hơn.`
},
{
  id: 'qz-ccap-144',
  topic: 'claude',
  q: '[Models & Context] A SaaS platform serves many tenants through one Claude integration. One tenant must not see another tenants documents in answers. Which design enforces this?',
  options: [
    'Send all tenants documents in one prompt and trust Claude to separate them',
    'Retrieve and send only the requesting tenants documents, with tenant isolation in the application layer',
    'Use one system prompt telling Claude not to mix tenant data',
    'Give every tenant the same API key and rely on prompt instructions'
  ],
  answer: 1,
  explain: `**Đúng: cách ly ở lớp ứng dụng, chỉ gửi tài liệu của tenant yêu cầu.** Hệ thống chỉ nên truy xuất và gửi đến Claude những tài liệu thuộc về tenant đang thực hiện yêu cầu, và lớp ứng dụng phải đảm bảo không bao giờ trộn dữ liệu giữa các tenant. Lời nhắc trong prompt không phải là cơ chế bảo mật; mô hình có thể bị thuyết phục hoặc hiểu nhầm, dẫn đến rò rỉ dữ liệu giữa các tenant.

### Vì sao các phương án khác sai
- **Gửi tài liệu của tất cả tenant và tin Claude tách biệt:** dữ liệu đã rời khỏi hệ thống kiểm soát và có thể bị lộ giữa các tenant.
- **Chỉ dùng system prompt:** là chỉ dẫn mềm, không phải ranh giới cưỡng chế, không đủ bảo vệ dữ liệu nhạy cảm.
- **Cùng một API key và tin vào hướng dẫn prompt:** khóa dùng chung không tạo ranh giới dữ liệu, và hướng dẫn không thể đảm bảo cách ly.

> Cách ly dữ liệu phải được thực thi ở nơi xử lý yêu cầu (lớp ứng dụng), không phải dựa vào mô hình hoặc prompt.`
},
{
  id: 'qz-ccap-145',
  topic: 'claude',
  q: '[Models & Context] A RAG assistant over a product catalogue answers "What is the price of SKU-12345?" incorrectly. Vector search returns similar but wrong products, even though the exact SKU exists in the documents. Which improvement best addresses this?',
  options: [
    'Combine keyword search for exact identifiers with vector search, then merge the results (hybrid retrieval)',
    'Increase temperature so the model reasons more creatively about the SKU',
    'Switch to the largest available model so it memorises the catalogue',
    'Send the entire catalogue in every request to guarantee the SKU is present'
  ],
  answer: 0,
  explain: `**Đúng: hybrid retrieval — kết hợp tìm kiếm từ khoá (khớp chính xác mã) với tìm kiếm vector (khớp ngữ nghĩa).** Vector search giỏi tìm nội dung gần nghĩa, nhưng mã sản phẩm như SKU-12345 là chuỗi định danh có thể bị xem là gần với nhiều mã khác. Tìm kiếm từ khoá (exact match kiểu BM25 hoặc chỉ mục inverted) đảm bảo chunk chứa đúng mã được lấy về; sau đó hợp nhất hai danh sách và xếp hạng lại. Đây là khiếm khuyết kinh điển của RAG thuần vector.

### Vì sao các phương án khác sai
- **Tăng temperature:** chỉ làm đầu ra ngẫu nhiên hơn; lỗi nằm ở bước truy xuất, không phải ở độ sáng tạo.
- **Chuyển sang model lớn nhất:** model không thấy chunk đúng thì model nào cũng trả lời sai; chi phí tăng mà không sửa nguyên nhân.
- **Gửi cả catalogue mỗi request:** vượt cửa sổ ngữ cảnh, chi phí mỗi câu hỏi tăng vọt, và tỉ lệ chú ý giảm khi ngữ cảnh quá dài.

### Cách kiểm tra
Đo recall của bước truy xuất trên bộ câu hỏi có mã định danh; so sánh recall khi chỉ dùng vector và khi dùng hybrid.

> Khi câu hỏi chứa mã định danh, hãy đảm bảo bước truy xuất khớp chính xác được chuỗi đó trước khi kết luận model yếu.`
},
{
  id: 'qz-ccap-146',
  topic: 'claude',
  q: '[Operational Enablement] A company runs one Claude integration shared by five product teams. Finance wants to know how much each team spends on Claude, but the team only has the total monthly bill from the provider. Which change best supports per-team cost tracking?',
  options: [
    'Ask each team to estimate its own token usage from memory',
    'Route all calls through one internal gateway that records caller, model, tokens in and out, and cost per caller, then match with provider usage reports',
    'Switch every team to a different model so bills are easier to split',
    'Create one provider account per team so no tracking is needed'
  ],
  answer: 1,
  explain: `**Đúng: lớp gateway trung gian ghi nhận chi phí theo từng người gọi, rồi đối chiếu với báo cáo sử dụng của nhà cung cấp.** Mọi request đi qua gateway nên lớp này biết mỗi team gọi model nào, tốn bao nhiêu token vào và ra, mất bao lâu, và bị lỗi gì. Từ đó tính được chi phí theo từng team và có số liệu để cảnh báo khi chi phí vượt ngưỡng. Báo cáo chi phí của nhà cung cấp chỉ cho thấy tổng số tiền của toàn tài khoản, không biết đoạn nào thuộc team nào nếu bạn không gắn nhãn ở lớp của riêng mình.

### Vì sao các phương án khác sai
- **Yêu cầu mỗi team tự ước lượng token từ nhớ:** số liệu không chính xác, mỗi team đếm theo cách riêng, khó đối chiếu và không có nguồn sự thật.
- **Đổi model khác nhau cho mỗi team:** không giúp tách chi phí theo team trên một hóa đơn, và làm thay đổi hành vi của assistant giữa các team.
- **Tạo một tài khoản nhà cung cấp cho mỗi team:** quá phức tạp vận hành, và không thay thế được khả năng xem chi phí và lỗi theo từng endpoint trong hệ thống của bạn.

### Khái niệm cần nhớ
**Gateway (cổng trung gian)** là một thành phần đặt giữa ứng dụng của bạn và API của Anthropic; mọi lời gọi đều đi qua nó trước, giống như một bưu cục thu phí trước khi cho hàng vào đường cao tốc. Gateway nên ghi lại: request id, team gọi, model, số token vào và ra, cache hit, độ trễ, mã lỗi.
**Token** là đơn vị văn bản mà model dùng để tính phí — có thể là một từ, một phần từ, hoặc một dấu câu. Ví dụ câu "Xin chào" có thể tách thành hai hay ba token.
**Báo cáo sử dụng của nhà cung cấp** cho thấy tổng chi phí của toàn tài khoản, không biết đoạn nào thuộc team nào nếu bạn không gắn nhãn ở gateway.

### Ví dụ cụ thể
Giả sử mỗi tháng hóa đơn là hai trăm USD, nhưng bạn không biết team A chi một trăm năm mươi USD còn team B chi năm mươi USD. Sau khi đặt gateway, bạn thấy team A gọi model lớn nhất cho các câu hỏi đơn giản, còn team B gọi model nhỏ. Bạn đặt cảnh báo khi chi phí của một team vượt một trăm USD một tuần, và nhóm A chuyển phần traffic đơn giản qua model nhỏ hơn, chi phí giảm hơn một nửa mà chất lượng câu trả lời không đổi.

### Lỗi hay gặp
Ghi log toàn bộ nội dung request vào gateway làm log lớn, tốn lưu trữ, và có nguy cơ lộ dữ liệu nhạy cảm. Hãy chỉ ghi số liệu đếm (token, độ trễ, mã lỗi), không ghi nội dung tin nhắn của khách hàng.

> Mẹo phỏng vấn: khi được hỏi về chi phí, hãy nói "chi phí theo từng người gọi" và "cảnh báo chi phí vượt ngưỡng" — đây là những điều nhà tuyển dụng mong một kiến trúc sư có thể thiết kế.`,
},
{
  id: 'qz-ccap-147',
  topic: 'claude',
  q: '[Operational Enablement] A document platform must label three million support tickets by next morning. The work is not needed in real time. The current design sends one synchronous Messages API call per ticket from a pool of web servers and keeps hitting rate limits. Which change best fits this workload?',
  options: [
    'Submit the work to the Message Batches API as an asynchronous batch for the lower-cost non-urgent path',
    'Keep the real-time loop and add more web servers to raise throughput',
    'Merge all tickets into one giant prompt with a very large max_tokens',
    'Run the job from a developer laptop using Claude Code in headless mode'
  ],
  answer: 0,
  explain: `**Đúng: Message Batches API dành cho khối lượng lớn, không cần kết quả ngay.** Bạn gửi hàng loạt yêu cầu một lần, API xử lý bất đồng bộ, có thể mất mười hai đến hai mươi bốn giờ, và chi phí thấp hơn so với gọi đồng bộ. Việc gán nhãn ba triệu tickets mỗi đêm đúng hình thức này: chênh lệch vài giờ không ảnh hưởng, và bạn không phải giữ hàng nghìn kết nối đồng thời.

### Vì sao các phương án khác sai
- **Giữ vòng lặp đồng bộ và thêm web server:** vẫn là gọi theo thời gian thực; giới hạn gọi đồng bộ không được nới, chi phí không giảm, chỉ dời điểm nghẽn sang chỗ khác.
- **Gộp ba triệu tickets vào một prompt lớn:** mỗi ticket là một yêu cầu độc lập; nhồi vào một prompt làm ngữ cảnh dài, khó parse, và vẫn vượt giới hạn kích thước.
- **Chạy từ laptop bằng Claude Code:** công cụ dòng lệnh cho lập trình, không phải hệ thống xử lý dữ liệu hàng loạt có kiểm soát, không có SLA, không có audit.

### Khái niệm cần nhớ
**Messages API (gọi đồng bộ):** ứng dụng gửi yêu cầu và chờ API trả lời ngay trước khi làm bước tiếp theo, như gọi điện và đón máy.
**Message Batches API (gọi bất đồng bộ):** bạn nộp một lô yêu cầu, API nhận và xử lý sau, bạn lấy kết quả khi xong, như gửi bưu kiện qua dịch vụ nhanh thay vì đứng chờ tại quầy.
**Rate limit (giới hạn tần suất):** số lượng tối đa request được phép trong một khoảng thời gian; vượt ngưỡng API sẽ từ chối, thường là lỗi bốn hai chín.
**Bất đồng bộ:** không chờ kết quả ngay; xử lý sau và thông báo khi hoàn tất.

### Ví dụ cụ thể
Ba triệu tickets, mỗi ticket trung bình một nghìn token, cộng khoảng ba tỷ token phải xử lý trong một đêm. Gọi đồng bộ từ nhóm web server rất dễ chạm ngưỡng gọi mỗi phút và làm chậm ứng dụng chính. Batch cho phép chia nhỏ thành nhiều lô, gửi một lần, rồi thu thập kết quả vào sáng hôm sau. Nếu một lô bị lỗi, bạn chỉ thử lại lô đó thay vì toàn bộ ba triệu ticket.

### Lỗi hay gặp
Batch vẫn cần xử lý idempotency (không xử lý trùng khi gửi lại một lô đã nộp), lưu mapping giữa kết quả và dữ liệu gốc, và chia nhỏ lô để dễ dàng thử lại khi có lỗi.

> Mẹo phỏng vấn: với khối lượng lớn và không gấp, batch gần như luôn là lựa chọn mặc định trước khi nghĩ tới tối ưu lệnh gọi đồng bộ.`,
},
{
  id: 'qz-ccap-148',
  topic: 'claude',
  q: '[Operational Enablement] A customer-facing assistant answers simple FAQ questions twenty-four hours a day. Cost and speed matter more than deep reasoning. Which model class is the best fit?',
  options: [
    'The most capable model for every request, regardless of cost',
    'A model that requires fine-tuning before it can answer FAQs',
    'The smallest, fastest, and cheapest model that still handles the task well',
    'A different model for every single question to spread cost'
  ],
  answer: 2,
  explain: `**Đúng: chọn model nhỏ nhất, nhanh nhất, rẻ nhất vẫn xử lý tốt công việc.** Đa số câu hỏi thường gặp là đơn giản (giờ mở cửa, cách đặt lại mật khẩu) không cần suy luận sâu. Model nhỏ tốn ít hơn, độ trễ thấp, đáp ứng được với chi phí thấp hơn nhiều so với model mạnh nhất, phù hợp với lưu lượng lớn và nhạy cảm về chi phí.

### Vì sao các phương án khác sai
- **Model mạnh nhất cho mọi yêu cầu:** chất lượng cao nhưng chi phí và độ trễ không cần thiết cho câu đơn giản.
- **Cần fine-tuning trước khi trả lời câu hỏi thường gặp:** Claude đã có khả năng trả lời dựa trên tài liệu bạn cung cấp trong prompt, không cần huấn luyện lại cho câu hỏi cơ bản.
- **Dùng model khác cho mỗi câu hỏi:** làm tăng độ phức tạp vận hành và khó quản lý chi phí.

### Khái niệm cần nhớ
**Model class (lớp model):** nhóm các model theo khả năng và kích thước, ví dụ nhóm nhỏ nhanh rẻ và nhóm lớn mạnh chậm đắt.
**Fine-tuning (huấn luyện chỉnh):** quá trình dạy thêm model bằng dữ liệu của bạn — cần công sức và thường không bắt buộc cho câu hỏi thường gặp.
**Capability (khả năng suy luận):** mức độ mô hình có thể phân tích và kết luận về vấn đề phức tạp.

### Ví dụ cụ thể
Trung bình mỗi câu trả lời FAQ tốn năm nghìn token. Nếu dùng model lớn nhất, chi phí mỗi câu trả lời có thể gấp ba hoặc bốn lần so với model nhỏ, trong khi khách hàng không nhận thấy sự khác biệt về chất lượng đối với câu "làm thế nào để đặt lại mật khẩu". Lần tháng với một triệu câu hỏi, sự chênh lệch này là hàng trăm triệu token.

### Lỗi hay gặp
Chọn model lớn cho mọi tác vụ vì "an toàn hơn" là cách đắt đỏ nhất để giảm chi phí. Hãy đo tỉ lệ câu trả lời thỏa mãn của model nhỏ; nếu quá nhiều câu bị bỏ lỡ, hãy nâng cấp có chọn lọc cho nhóm câu đó, chứ không phải toàn bộ.

> Mẹo phỏng vấn: hãy chọn model theo mức độ khó của tác vụ, không theo danh vọng của model.`,
},
{
  id: 'qz-ccap-149',
  topic: 'claude',
  q: '[Operational Enablement] A summarisation service calls a large Claude model for every request. At peak time the API returns 529 overloaded for a growing share of calls, and the business still needs a summary. What is the best design?',
  options: [
    'Retry with backoff, then fall back to a smaller model in the same family, and degrade to a shorter summary rather than fail',
    'Retry the same model forever until one call succeeds',
    'Return the raw document to the user without any summary',
    'Disable streaming so the client stops noticing the delay'
  ],
  answer: 0,
  explain: `**Đúng: có đường lui và chấp nhận giảm chất lượng có kiểm soát.** 529 là quá tải tạm thời. Sau vài lần thử lại có backoff, chuyển sang model nhỏ hơn cùng họ thường vẫn cho bản tóm tắt đủ dùng, nhanh và rẻ hơn. Quan trọng: người dùng nhận được kết quả ngắn thay vì một lỗi.

### Vì sao các phương án khác sai
- **Thử lại model lớn mãi mãi:** nếu quá tải kéo dài, request treo vô hạn; người dùng chờ rồi bỏ.
- **Trả nguyên văn tài liệu:** đẩy việc đọc hàng chục trang sang người dùng, đúng thứ họ muốn tránh.
- **Tắt streaming:** không giải quyết quá tải, chỉ làm trải nghiệm tệ hơn khi phải chờ.

### Khái niệm cần nhớ
**529 overloaded (quá tải tạm thời):** mã lỗi từ API báo hệ thống đang quá tải, không phải lỗi của mã code bạn.
**Backoff (thời gian chờ tăng dần):** giữa các lần thử lại, bạn chờ lâu hơn và lâu hơn, ví dụ một giây, hai giây, bốn giây, để không làm nặng thêm hệ thống.
**Fallback (dự phòng):** chuyển sang thành phần khác khi thành phần chính không sẵn sàng.
**Degrade (giảm chất lượng có kiểm soát):** trả về kết quả ngắn hơn hoặc ít chi tiết thay vì hoàn toàn không trả lời.
**Streaming (phát dòng):** API trả lời từng phần theo thời gian thực thay vì chờ toàn bộ câu trả lời xong mới gửi.

### Ví dụ cụ thể
Ở giờ cao điểm, mười phần trăm cuộc gọi nhận lỗi 529. Sau ba lần thử lại với backoff, dịch vụ chuyển sang model nhỏ hơn; ba phần trăm trong số đó kịp đọc toàn bộ tài liệu, phần còn lại chỉ nhận bản tóm tắt ngắn. Tổng thể, chín mươi lăm phần trăm khách hàng vẫn có câu trả lời thay vì toàn bộ gặp lỗi.

### Lỗi hay gặp
Thử lại ngay lập tức trong vòng lặp chặt chẽ sẽ làm tràn ngập hệ thống khi nó đang quá tải, gọi là hiện tượng thundering herd (đám đông oanh tống).

> Mẹo phỏng vấn: một hệ thống tốt không phải không bao giờ lỗi, mà là hệ thống vẫn trả lời được khi thành phần chính chậm hoặc gặp sự cố.`,
},
{
  id: 'qz-ccap-150',
  topic: 'claude',
  q: '[Operational Enablement] A team is about to launch a Claude feature that writes policy summaries, and they have no measurements yet. What should they build first?',
  options: [
    'A dashboard of token usage and latency',
    'A fixed evaluation set with expected answers or a scoring rubric, run before launch and on every change',
    'A bigger prompt with more examples of good summaries',
    'A weekly meeting to read user complaints'
  ],
  answer: 1,
  explain: `**Đúng: không thể cải thiện thứ chưa đo được.** Với tác vụ tóm tắt chính sách, chất lượng phải được định nghĩa thành tiêu chí: có giữ đủ điều khoản quan trọng không, có bịa nội dung không, có đúng giọng văn không. Một tập đánh giá cố định gồm đầu vào thật, đáp án kỳ vọng hoặc thang chấm cho phép so sánh các phiên bản và phát hiện sự thoái hoá.

### Vì sao các phương án khác sai
- **Bảng điều khiển token và độ trễ:** cần thiết cho vận hành nhưng không nói gì về chất lượng nội dung.
- **Prompt dài hơn với nhiều ví dụ tốt:** có thể giúp, nhưng nếu không đo thì không biết giúp hay làm hại.
- **Họp hàng tuần để đọc phàn nàn của người dùng:** tín hiệu quý nhưng đến trễ, không đại diện, và không so sánh được giữa hai phiên bản.

### Khái niệm cần nhớ
**Evaluation set (bộ đánh giá):** bộ câu hỏi và đáp án kỳ vọng (hoặc thang chấm) dùng để kiểm tra chất lượng model sau mỗi thay đổi, giống bài kiểm tra định kỳ cho học sinh.
**Rubric (thang chấm điểm):** danh sách tiêu chí chấm câu trả lời, ví dụ "đúng ý", "bịa nội dung", "thiếu điều khoản", biến cảm nhận thành số liệu.
**Regression (sự thoái hoá chất lượng):** khi thay đổi prompt hay model khiến kết quả kém hơn phiên bản trước mà không ai nhận ra ngay.

### Ví dụ cụ thể
Tập đánh giá có mười câu hỏi mẫu từ tài liệu chính sách thật. Sau mỗi lần sửa prompt, bạn chạy lại toàn bộ mười câu và chấm theo rubric. Nếu điểm từ bốn point xuống hai point, bạn biết ngay phiên bản mới kém hơn và không đưa nó lên production.

### Lỗi hay gặp
Chỉ theo dõi điểm trung bình che giấu việc chất lượng kém ở một nhóm câu hỏi nhỏ, ví dụ câu hỏi về chính sách hoàn trả luôn sai còn các câu khác đúng.

> Mẹo phỏng vấn: với nội dung ảnh hưởng đến quyết định, tập đánh giá nên có cả câu không được bịa — câu trả lời thiếu còn sửa được, câu bịa thì có thể gây hại thật.`,
},
{
  id: 'qz-ccap-151',
  topic: 'claude',
  q: '[Operational Enablement] A Claude-powered support assistant has run in pilot with one customer segment for six weeks. Quality metrics are stable. The product team wants to expand to all segments immediately. What is the safest next step?',
  options: [
    'Enable the assistant for all customers tomorrow since pilot metrics look good',
    'Run the pilot for another six months before any change',
    'Expand to one more segment at a time, monitor quality and cost per segment, then decide',
    'Ask Claude to write the rollout plan and follow it without human review'
  ],
  answer: 2,
  explain: `**Đúng: mở rộng từng đợt, không xả cả hệ thống cùng lúc.** Pilot chỉ xác minh công việc với một phân đoạn khách hàng nhỏ. Khi sang phân đoạn khác, ngữ cảnh, loại câu hỏi và mức độ phức tạp có thể khác, dẫn đến chất lượng giảm hoặc chi phí tăng. Mở rộng từng nhóm giúp phát hiện vấn đề sớm, chỉnh sửa prompt hoặc quy trình mà không ảnh hưởng toàn bộ khách hàng.

### Vì sao các phương án khác sai
- **Bật cho tất cả ngay:** nếu có lỗi chỉ xuất hiện ở một phân đoạn nhất định, toàn bộ khách hàng sẽ bị ảnh hưởng cùng lúc.
- **Chạy pilot thêm sáu tháng:** bỏ qua cơ hội từ giá trị đã chứng minh được, làm chậm việc đem công cụ đến nhiều người hơn.
- **Yêu cầu Claude viết kế hoạch mở rộng:** Claude có thể đề xuất nhưng không thay thế quyết định của con người dựa trên số liệu thực tế.

### Khái niệm cần nhớ
**Pilot (chương trình thử nghiệm nhỏ):** chạy tính năng với một nhóm người dùng nhỏ trong thời gian giới hạn để kiểm tra trước khi mở rộng.
**Segment (phân đoạn khách hàng):** nhóm khách hàng có đặc điểm giống nhau, ví dụ doanh nghiệp nhỏ hay doanh nghiệp lớn.
**Mở rộng từng đợt:** giống như thả một con thuyền thử trước, xem nước phải chồng chảy, rồi mới thả toàn bộ hạm đội.

### Ví dụ cụ thể
Pilot chạy sáu tuần với một phân đoạn doanh nghiệp vừa và nhỏ; chỉ số chất lượng ổn định và số ticket được assistant xử lý giảm hai mươi phần trăm. Thay vì bật cho cả mười phân đoạn ngay lập tức, đội mở rộng sang phân đoạn tiếp theo, theo dõi chất lượng và chi phí mỗi phân đoạn trong hai tuần, rồi mới quyết định tiếp tục.

### Lỗi hay gặp
Không thiết lập ngưỡng dừng cho mỗi đợt: nếu tỉ lệ câu trả lời bị ý hoặc chi phí vượt ngưỡng, cần dừng lại và xem xét lại trước khi tiếp tục.

> Mẹo phỏng vấn: mỗi đợt mở rộng nên có ngưỡng dừng rõ ràng trước khi bắt đầu.`,
},
{
  id: 'qz-ccap-152',
  topic: 'claude',
  q: '[Operational Enablement] A Claude assistant has been live for three months. Support agents report that some answers are outdated compared to the latest policy documents. How should the team establish a feedback loop?',
  options: [
    'Wait for customers to complain before making any changes',
    'Ask agents to manually correct every wrong answer in a spreadsheet',
    'Add a thumbs-up or thumbs-down rating on each answer, review low-rated answers weekly, and update the knowledge source',
    'Replace the assistant with a static FAQ page'
  ],
  answer: 2,
  explain: `**Đúng: thu thập phản hồi có cấu trúc và xử lý định kỳ.** Nút thích hoặc không thích trên mỗi câu trả lời cho thấy câu nào cần xem xét. Đội vận hành xem xét từng tuần, nhóm các lỗi giống nhau, rồi cập nhật nguồn kiến thức (tài liệu, đoạn trong RAG) để khắc phục. Cách này biến trải nghiệm của nhân viên đầu tiên vào bước cải thiện hệ thống.

### Vì sao các phương án khác sai
- **Chờ khách hàng phàn nàn:** thì hệ thống đã gây thiệt hại và mất uy tín.
- **Nhân viên sửa tay mỗi câu sai trong bảng tính:** không mở rộng được, và không cải thiện được mô hình hay nguồn dữ liệu cho các câu hỏi tương tự sau này.
- **Thay assistant bằng trang câu hỏi thường gặp tĩnh:** mất đi khả năng tự động trả lời và tra cứu mà công cụ mang lại.

### Khái niệm cần nhớ
**Feedback loop (vòng phản hồi):** thu thập ý kiến của người dùng, phân tích, cải thiện hệ thống, rồi thu lại ý kiến mới, lặp đi lặp lại.
**Knowledge source (nguồn kiến thức):** bộ tài liệu mà assistant dựa vào để trả lời, ví dụ FAQ, tài liệu chính sách, hoặc đoạn trong hệ thống RAG.
**RAG (tìm kiếm bổ sung tạo ra):** kỹ thuật lấy đoạn tài liệu liên quan và gửi kèm câu hỏi cho model, thay vì nhồi toàn bộ kho tài liệu vào một lần.

### Ví dụ cụ thể
Nhân viên hỗ trợ báo một câu trả lời về chính sách hoàn trả đã cũ. Đội xem xét nút không thích tuần sau, thấy ba câu trả lời liên quan đến cùng một đoạn tài liệu cũ, cập nhật đoạn đó trong nguồn kiến thức, và các câu trả lời sau đó đúng theo chính sách mới.

### Lỗi hay gặp
Chỉ thu thập phản hồi mà không ai xem xét định kỳ thì nút thích/không thích trở thành trang trí, không cải thiện được gì.

> Mẹo phỏng vấn: phản hồi từ người dùng cuối là tín hiệu sớm nhất về chất lượng giảm; hãy thiết kế cách thu thập ngay từ ngày đầu.`,
},
{
  id: 'qz-ccap-153',
  topic: 'claude',
  q: '[Operational Enablement] A financial regulation requires that all Claude interactions be auditable. Which single approach is sufficient?',
  options: [
    'Add a system prompt saying "be audit-friendly"',
    'Implement centralized logging with caller identity, timestamp, request purpose, and output hash',
    'Disable all tool use to prevent unauthorized actions',
    'Use a single shared API key for all interactions'
  ],
  answer: 1,
  explain: `**Đúng: nhật ký tập trung với caller identity, timestamp, request purpose và output hash tạo ra bản ghi kiểm toán có cấu trúc và truy vết được.** System prompt chỉ là chỉ dẫn mềm, không tạo ra bản ghi. Vô hiệu hoá tool use làm giảm chức năng, và dùng chung một API key khiến không thể kiểm toán riêng lẻ mỗi tương tác.

### Vì sao các phương án khác sai
- **Thêm câu "be audit-friendly" vào system prompt:** chỉ là chỉ dẫn, không ghi lại ai gọi, khi nào, vì lý do gì.
- **Vô hiệu hoá tất cả tool use:** làm giảm chức năng, và không giải quyết yêu cầu kiểm tra lại.
- **Dùng một API key chung cho mọi tương tác:** không biết tương tác nào thuộc về ai, không thể kiểm toán theo người dùng.

### Khái niệm cần nhớ
**Auditable (có thể kiểm toán):** có bản ghi đủ chi tiết để sau này xem lại ai đã làm gì.
**Caller identity (danh tính người gọi):** ai thực hiện yêu cầu, ví dụ mã nhân viên hoặc mã khách hàng.
**Output hash (mã băm của đầu ra):** mã ngắn duy nhất tạo từ nội dung câu trả lời, dùng để chứng minh câu trả lời sau này không bị thay đổi.
**Nhật ký tập trung:** tất cả các team ghi nhật ký vào một nơi duy nhất thay vì mỗi team một nơi.

### Ví dụ cụ thể
Giá trị kiểm tra: một chủ tịch khoa tài chính yêu cầu xem lại mọi tương tác liên quan đến dữ liệu thẻ tín dụng trong tháng. Với nhật ký có caller, timestamp, mục đích và mã băm, đội bảo mật tìm được ba cuộc gọi của một nhân viên, xác minh nội dung và gửi báo cáo cho nhà quản lý. Nếu chỉ có tổng số cuộc gọi, họ không thể trả lời được câu hỏi này.

### Lỗi hay gặp
Chỉ ghi lại model name và độ dài output: hữu ích cho hiệu năng, nhưng không biết ai chịu trách nhiệm về từng câu trả lời.

> Mẹo phỏng vấn: với hệ thống ảnh hưởng quyết định, hãy thiết kế để câu trả lời kiểm chứng được, thay vì cố làm model tự tin hơn.`,
},
{
  id: 'qz-ccap-154',
  topic: 'claude',
  q: '[Operational Enablement] The system prompt of a support bot is edited almost weekly, and quality has been quietly degrading. Which practice best prevents silent regressions?',
  options: [
    'Keep prompts in version control, run a fixed evaluation set on every change, and promote only when quality metrics hold',
    'Let each engineer edit the production prompt directly from the dashboard',
    'Remove the system prompt so behaviour cannot change',
    'Increase max_tokens after every prompt edit'
  ],
  answer: 0,
  explain: `**Đúng: prompt là code, phải có review và test.** Khi prompt nằm trong kiểm soát phiên bản, mọi thay đổi đều truy vết được. Một tập đánh giá cố định chạy trên mỗi thay đổi cho biết chất lượng tăng hay giảm; chỉ kích hoạt phiên bản mới khi các chỉ số đạt ngưỡng. Đây là cách duy nhất để thấy sự thoái hoá nhỏ mà người dùng chưa kịp báo.

### Vì sao các phương án khác sai
- **Sửa trực tiếp trên production từ bảng điều khiển:** không có lịch sử, không thể so sánh, không thể quay lại phiên bản trước; một lỗi nhỏ có thể tồn tại hàng tuần.
- **Bỏ system prompt:** lấy đi phần định hướng hành vi, không phải giải pháp cho việc thiếu kiểm soát.
- **Tăng max_tokens sau mỗi lần sửa prompt:** chỉ đổi độ dài đầu ra, không liên quan đến chất lượng prompt.

### Khái niệm cần nhớ
**Version control (kiểm soát phiên bản):** hệ thống lưu lại mọi thay đổi của tệp, ví dụ git, cho phép xem lại và quay lại phiên bản cũ.
**Silent regression (sự thoái hoá không ai nhận ra):** chất lượng giảm dần mà người dùng chưa phàn nàn, chỉ phát hiện được qua đánh giá định kỳ.
**Promote (kích hoạt phiên bản mới):** đưa phiên bản mới của prompt lên production thay cho phiên bản cũ.

### Ví dụ cụ thể
Mỗi prompt có phiên bản, mô tả thay đổi, tập đánh giá, ngưỡng đậu, người đánh giá. Khi đổi model hoặc cấu hình công cụ, chạy lại cùng tập đánh giá để so sánh công bằng. Nếu điểm giảm, giữ phiên bản cũ và không promote.

### Lỗi hay gặp
Prompt không có đánh giá giống như code không có test: bạn chỉ biết nó hỏng khi có người phàn nàn.

> Mẹo phỏng vấn: prompt không có đánh giá giống như code không có test.`,
},
{
  id: 'qz-ccap-155',
  topic: 'claude',
  q: '[Operational Enablement] A SaaS provider hosts two hundred customer tenants on one Claude integration. One heavy tenant sends ten times the average traffic and slows down everyone else. Which measure best protects the other tenants?',
  options: [
    'Use one API key for all tenants and add the tenant name to each prompt',
    'Give each tenant a separate browser session on the same account',
    'Apply per-tenant rate limits or quotas in front of the shared integration',
    'Rely on prompt caching to keep tenant data apart'
  ],
  answer: 2,
  explain: `**Đúng: áp dụng hạn mức hoặc giới hạn tần suất theo mỗi khách hàng thuê trước lớp tích hợp chung.** Dùng chung một credential không sai, miễn là ứng dụng luôn lọc theo tenant_id ở mọi truy vấn và không bao giờ để dữ liệu của khách hàng này lẫn sang khách hàng khác. Nhưng chia sẻ tài nguyên thì phải có hạn mức: một khách hàng gửi gấp trăm lần lưu lượng trung bình sẽ làm chậm tất cả.

### Vì sao các phương án khác sai
- **Dùng một API key chung cho tất cả khách hàng và thêm tên khách hàng vào mỗi prompt:** tên trong prompt không phải cơ chế kiểm soát; nếu truy xuất hay log sai, dữ liệu vẫn lẫn.
- **Cho mỗi khách hàng một phiên bản trình duyệt trên cùng một tài khoản:** phiên trình duyệt không tạo ranh giới dữ liệu ở phía máy chủ.
- **Dựa vào prompt caching để tách biệt dữ liệu khách hàng:** cache là cơ chế tối ưu chi phí, không phải cơ chế phân quyền; không được dùng làm ranh giới an toàn.

### Khái niệm cần nhớ
**Tenant (khách hàng thuê):** một khách hàng trong hệ thống đa khách hàng, nơi nhiều khách hàng dùng chung một hệ thống nhưng dữ liệu mỗi người phải riêng biệt.
**Rate limit (giới hạn tần suất):** số lượng tối đa request được phép trong một khoảng thời gian.
**Quota (hạn mức):** mức sử dụng tối đa cho phép, ví dụ số token mỗi ngày cho mỗi khách hàng.

### Ví dụ cụ thể
Một trong hai trăm khách hàng gửi gấp mười lần lưu lượng trung bình và làm chậm hệ thống. Sau khi đặt hạn mức theo mỗi khách hàng, khách hàng đó bị giới hạn khi vượt ngưỡng, còn một trăm chín mươi chín khách hàng khác vẫn nhận câu trả lời bình thường.

### Lỗi hay gặp
Không kiểm tra cách ly dữ liệu: mỗi khách hàng truy cập chéo phải bị từ chối, và kiểm tra tải: một khách hàng bão hòa không được làm sập khách hàng khác.

> Mẹo phỏng vấn: ranh giới an toàn luôn nằm ở lớp máy chủ của bạn, không phải trong prompt.`,
},
{
  id: 'qz-ccap-156',
  topic: 'claude',
  q: '[Operational Enablement] A project team built a Claude integration and is handing it over to the operations team. Which information is most important to transfer?',
  options: [
    'Only the source code and API key',
    'How the system is monitored, who to contact during incidents, rollback steps, and prompt versions',
    'A recording of the project kickoff meeting',
    'The list of prompts used during development'
  ],
  answer: 1,
  explain: `**Đúng: chuyển giao thông tin vận hành, không chỉ code.** Đội vận hành cần biết cách theo dõi hệ thống (chỉ số, cảnh báo), ai liên hệ khi có sự cố, cách quay lại phiên bản trước và phiên bản prompt hiện đang dùng. Nếu không có thông tin này, một sự cố nhỏ có thể kéo dài vì không biết phải sửa ở đâu hay ai chịu trách nhiệm.

### Vì sao các phương án khác sai
- **Chỉ mã nguồn và API key:** thiếu bối cảnh vận hành, làm khó khôi phục khi có sự cố.
- **Bản ghi hình cuộc họp khởi động dự án:** không chứa thông tin hành động cần thiết cho vận hành hàng ngày.
- **Danh sách prompt dùng trong quá trình phát triển:** không đủ; cần biết prompt nào đang chạy production và cách thay đổi an toàn.

### Khái niệm cần nhớ
**Runbook (sổ thao tác vận hành):** tài liệu hướng dẫn vận hành hàng ngày: theo dõi sao, xử lý sự cố, và cách cập nhật prompt an toàn.
**Rollback (quay lại phiên bản trước):** đưa hệ thống về trạng thái trước khi có sự cố hoặc thay đổi xấu.
**On-call (nhân viên trực):** người chịu trách nhiệm xử lý sự cố ngoài giờ làm việc.

### Ví dụ cụ thể
Sau khi bàn giao, một sự cố xảy ra lúc ba giờ sáng. Đội trực mở runbook, thấy cách xem chỉ số độ trễ qua gateway, biết gọi người trực của nhóm phát triển, và có bước quay lại phiên bản prompt trước đó trong năm phút. Sự cố được khôi phục nhanh thay vì tìm kiếm mã nguồn suốt buổi sáng.

### Lỗi hay gặp
Chỉ chuyển giao mã nguồn mà không có runbook là giữ bí mật vận hành ở đầu phát triển; khi người đó nghỉ việc, đội không biết làm gì khi hệ thống hỏng.

> Mẹo phỏng vấn: handoff tốt bao gồm runbook: cấu trúc hệ thống, quy trình xử lý sự cố, và cách cập nhật prompt mà không gây gián đoạn.`,
},
{
  id: 'qz-ccap-157',
  topic: 'claude',
  multi: true,
  q: '[Operational Enablement] A platform team operates one Claude integration for thirty product teams. Finance wants to cut token spend, and SRE wants to stop one team from exhausting the shared quota. Which two measures help most? (Choose 2)',
  options: [
    'Route every request through a gateway that enforces per-team token quotas and records cost per caller',
    'Put all teams on one shared API key and add the team name to each prompt',
    'Enable prompt caching for stable system-prompt prefixes so repeated prefixes are served from cache',
    'Ask every team to self-report token counts from their own logs',
    'Send all requests to the largest model so fewer calls are needed'
  ],
  answer: [0, 2],
  explain: `**Đúng: giới hạn theo team ở lớp gateway và bỏ qua phần tính toán lại cho tiền tố ổn định.** Giới hạn token theo team là ranh giới cưỡng chế, không chỉ báo cáo: một team gửi quá nhiều sẽ bị chặn, bảo vệ các team còn lại. Prompt caching lưu kết quả của phần prompt không đổi (ví dụ hướng dẫn hệ thống dài) và đọc từ cache ở các lần sau, chi phí đọc cache thấp hơn nhiều so với tính toán lại mỗi lần. Cả hai cùng hoạt động: gateway kiểm soát số lượng, caching giảm chi phí mỗi cuộc gọi.

### Vì sao các phương án còn lại sai
- **Một API key chung và thêm tên team vào prompt:** tên trong prompt không phải cơ chế kiểm soát; nếu truy xuất hay log sai, chi phí vẫn bị attribution sai, và không có gì chặn team nào dùng quá nhiều.
- **Mỗi team tự báo số token từ log của mình:** số liệu phân tán, mỗi nơi đếm một kiểu, không có nguồn sự thật, và khó đối chiếu với hóa đơn.
- **Gửi tất cả request cho model lớn nhất:** chi phí tăng, không giảm; model lớn đắt hơn mỗi token và không làm giảm số cuộc gọi một cách đáng kể.

### Khái niệm cần nhớ
**Gateway (cổng trung gian):** thành phần giữa ứng dụng và API, áp dụng giới hạn theo người gọi.
**Quota (hạn mức):** mức sử dụng tối đa cho phép, ví dụ số token mỗi ngày cho mỗi team.
**Prompt caching (bộ nhớ đệm prompt):** lưu phần đầu prompt không thay đổi để các lần sau đọc từ cache thay vì tính toán lại.
**Prefix (tiền tố):** phần đầu prompt, ví dụ hướng dẫn hệ thống, phải giống hệt nhau từng ký tự giữa các request để khớp cache.

### Ví dụ cụ thể
Ba mươi team dùng chung một hợp đồng. Sau khi đặt giới hạn năm nghìn token mỗi ngày cho mỗi team và bật caching cho hướng dẫn hệ thống dài, team nào gửi quá nhiều bị chặn trong ngày, còn các yêu cầu lặp lại của các team khác đọc từ cache và chi phí token giảm đáng kể mà câu trả lời không đổi.

### Lỗi hay gặp
Tên team trong prompt không ngăn chặn việc dùng quá mức; chỉ có giới hạn được thực thi ở gateway mới là ranh giới cưỡng chế.

> Mẹo phỏng vấn: hãy đo theo caller: vừa phục vụ phân bổ chi phí, vừa phát hiện team nào dùng bất thường.`,
},
{
  id: 'qz-ccap-158',
  topic: 'claude',
  multi: true,
  q: '[Operational Enablement] A Claude feature in production starts giving wrong answers that customers act on, right after a prompt change. Which two actions are most appropriate right away? (Choose 2)',
  options: [
    'Roll the prompt back to the previous version and re-enable only after eval passes',
    'Keep the new prompt running while writing a longer warning in the system prompt',
    'Route affected requests to a human fallback or show a safe message instead of the model answer',
    'Increase max_tokens so answers are longer and more careful',
    'Ask customers to confirm each answer before acting'
  ],
  answer: [0, 2],
  explain: `**Đúng: quay lại phiên bản trước và chặn câu trả lời tự động cho đến khi đánh giá qua.** Khi prompt mới đã được lưu phiên bản trước trong hệ thống kiểm soát phiên bản, bạn có thể quay về ngay lập tức, dừng tổn hại. Đồng thời, chuyển các yêu cầu bị ảnh hưởng sang người xử lý thủ công hoặc thông báo an toàn thay vì để model tiếp tục trả lời sai. Chỉ kích hoạt lại phiên bản mới sau khi tập đánh giá đạt ngưỡng.

### Vì sao các phương án còn lại sai
- **Giữ prompt mới chạy và viết cảnh báo dài hơn trong system prompt:** cảnh báo chỉ là lời nhắc, không ngăn model trả lời sai; khách hàng vẫn hành động theo kết quả sai.
- **Tăng max_tokens:** chỉ làm câu trả lời dài hơn, không làm nó đúng hơn.
- **Yêu cầu khách hàng xác nhận mỗi câu trả lời:** giảm chút rủi ro nhưng không ngăn câu trả lời sai đi đến người dùng; trải nghiệm tệ và không thể mở rộng.

### Khái niệm cần nhớ
**Rollback (quay lại phiên bản trước):** đưa hệ thống về trạng thái trước khi có sự cố, giống bấm nút undo cho bản thiết kế.
**Eval pass (đánh giá đạt ngưỡng):** chạy tập câu hỏi mẫu trước khi đưa prompt mới lên production.
**Human fallback (dự phòng con người):** yêu cầu người thực thi thay vì để model tự động xử lý.
**Safe message (thông báo an toàn):** thông báo cho người dùng biết hệ thống tạm thời không xử lý yêu cầu đó, thay vì trả lời sai.

### Ví dụ cụ thể
Sau khi thay đổi prompt buổi sáng, tỉ lệ câu trả lời sai tăng từ một phần trăm lên mười phần trăm. Đội quay về phiên bản hôm qua trong năm phút, chuyển các yêu cầu về chính sách hoàn trả sang nhân viên hỗ trợ, và chạy đánh giá trên tập mười câu hỏi mẫu. Chỉ khi điểm đánh giá khôi phục lại, prompt mới mới được đưa lại.

### Lỗi hay gặp
Không giữ phiên bản prompt trước đó thì không thể quay lại nhanh; mỗi lần sửa prompt nên lưu phiên bản trước.

> Mẹo phỏng vấn: khi có sự cố chất lượng, hành động đầu tiên là dừng tổn hại, sau đó mới điều tra nguyên nhân.`,
},
{
  id: 'qz-ccap-159',
  topic: 'claude',
  multi: true,
  q: '[Operational Enablement] A Claude feature’s p95 latency jumps from two seconds to twelve seconds after a traffic increase, while most requests are still fast. Which two first actions are most useful? (Choose 2)',
  options: [
    'Check per-endpoint latency and error rate in the gateway logs to find where the delay happens',
    'Check whether one caller or tenant is driving a traffic spike',
    'Immediately switch all traffic to the largest model',
    'Disable all logging to make the system faster',
    'Ask users to retry their requests until latency improves'
  ],
  answer: [0, 1],
  explain: `**Đúng: đo trước khi sửa.** Độ trễ cao ở phần đuôi có thể do một điểm cuối cụ thể chậm, hoặc do một khách hàng thuê gửi quá nhiều request gây nghẽn. Ghi nhật ký cổng trung gian cho phép bạn thấy từng điểm cuối và từng người gọi có độ trễ cao, lỗi gì, từ đó biết cần giảm tải hay tối ưu điểm cuối nào.

### Vì sao các phương án còn lại sai
- **Chuyển ngay toàn bộ traffic sang model lớn nhất:** model lớn thường chậm hơn và đắt hơn, không giải quyết điểm nghẽn, và làm tăng chi phí.
- **Tắt tất cả nhật ký:** làm bạn mù khi đang điều tra sự cố, không làm hệ thống nhanh hơn đáng kể.
- **Yêu cầu người dùng thử lại cho đến khi nhanh:** đẩy gánh nặng sang người dùng, có thể làm tràn ngập hệ thống hơn.

### Khái niệm cần nhớ
**p95 (ngưỡng chín mươi lăm phần trăm):** chín mươi lăm phần trăm yêu cầu nhanh hơn con số này, năm phần trăm còn lại chậm hơn. Nếu phần lớn yêu cầu nhanh nhưng p95 cao, có nhóm nhỏ yêu cầu bị chậm nghiêm trọng.
**Traffic spike (đột biến lưu lượng):** lưu lượng yêu cầu tăng đột ngột trong thời gian ngắn, ví dụ một người gọi gửi rất nhiều request cùng lúc.
**Per-endpoint (theo mỗi điểm cuối):** theo từng chức năng hoặc đường dẫn API, ví dụ "tóm tắt tài liệu" và "trả lời FAQ" là hai điểm cuối khác nhau.

### Ví dụ cụ thể
p95 tăng từ hai giây lên mười hai giây sau khi lưu lượng tăng. Đội xem nhật ký gateway: điểm cuối "tóm tắt tài liệu" có độ trễ chín giây, và một khách hàng thuê đơn lẻ tạo ra sáu mươi phần trăm traffic. Họ đặt giới hạn cho khách hàng đó và tối ưu điểm cuối tóm tắt, p95 giảm về dưới ba giây mà không ảnh hưởng các khách hàng khác.

### Lỗi hay gặp
Chỉ xem trung bình toàn hệ thống che giấu việc một nhóm nhỏ yêu cầu bị chậm rất lâu, vì trung bình có thể vẫn thấp.

> Mẹo phỏng vấn: khi độ trễ tăng, hãy xem theo từng điểm cuối và từng người gọi, không chỉ nhìn con số trung bình.`,
},
{
  id: 'qz-ccap-160',
  topic: 'claude',
  multi: true,
  q: '[Operational Enablement] A Claude agent can update customer records. A test showed it once attempted a write that needed a human decision. Which two changes most directly reduce the risk? (Choose 2)',
  options: [
    'Lengthen the system prompt with more warnings about careful behaviour',
    'Require an explicit human approval step before the write executes',
    'Set temperature to zero so the model becomes deterministic',
    'Enforce the write limit and allowed actions in the backend, not only in the prompt',
    'Notify the manager by email after the write has already been issued'
  ],
  answer: [1, 3],
  explain: `**Đúng: chặn ở lớp thực thi, không chỉ ở lớp lời nhắc.** System prompt là chỉ dẫn, model có thể hiểu sai hoặc bị thuyết phục bởi dữ liệu độc hại. Với hành động có hậu quả như cập nhật hồ sơ khách hàng, phải có bước phê duyệt của người và kiểm soát ở backend: kiểm tra hạn mức, quyền, trạng thái đơn hàng ngay trước khi thực thi.

### Vì sao các phương án còn lại sai
- **Viết prompt dài hơn:** tăng khả năng model hiểu nhưng không tạo ra ranh giới cưỡng chế.
- **Đặt temperature bằng không:** giảm ngẫu nhiên, không loại bỏ sai sót logic; model vẫn có thể chọn sai hành động.
- **Email báo sau khi đã cập nhật:** hậu quả đã xảy ra; thông báo không phải kiểm soát.

### Khái niệm cần nhớ
**Human approval (phê duyệt của con người):** bước yêu cầu người xác nhận trước khi thực hiện hành động quan trọng.
**Backend enforcement (kiểm soát ở phía hệ thống):** kiểm tra quyền và giới hạn trên máy chủ trước khi thực thi, không tin vào model.
**Least privilege (quyền tối thiểu):** chỉ cấp quyền đủ để hoàn thành việc, không hơn.
**Temperature (mức độ ngẫu nhiên):** điều khiển độ ngẫu nhiên của câu trả lời model, không phải cơ chế bảo mật.

### Ví dụ cụ thể
Nhân viên hỗ trợ yêu cầu agent cập nhật địa chỉ giao hàng. Agent muốn gọi API cập nhật ngay, nhưng hệ thống yêu cầu một quản lý nhấn nút phê duyệt, và backend kiểm tra nhân viên đó có quyền sửa đơn hàng đó không. Nếu không có bước này, một sai sót của model có thể thay đổi địa chỉ hàng ngàn đơn hàng.

### Lỗi hay gặp
Tin vào system prompt để ngăn chặn hành động nguy hiểm là hiểu lầm phổ biến; prompt là lời nhắc, không phải tường lửa.

> Mẹo phỏng vấn: hành động nguy hiểm thì thêm một bước người, và luôn kiểm tra lại ở phía hệ thống.`,
},
{
  id: 'qz-ccap-381',
  topic: 'claude',
  q: '[Enterprise Integration] A document platform processes 3 million invoices per month by publishing each one to a message queue; a worker calls Claude to extract fields and writes the result to the database. Occasionally a worker crashes after Claude returns but before the database write, so the message is redelivered and the invoice is processed twice. Which design best prevents duplicate side effects?',
  options: [
    'Increase the worker timeout so crashes are less likely',
    'Store a deterministic idempotency key per invoice and skip work if the result already exists',
    'Process messages on a single worker to avoid concurrency',
    'Disable message redelivery in the queue'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng idempotency key (khoá nhận dạng ổn định theo invoice) để hệ thống nhận ra "đã xử lý rồi" và bỏ qua, thay vì tin vào việc message chỉ đến một lần.

### Vì sao đáp án đúng
Queue kiểu at-least-once (giao ít nhất một lần) luôn có thể giao lại message khi worker chết giữa chừng. Cách chắc chắn để tránh tác dụng phụ lặp là lưu một idempotency key tất định (ví dụ hash của invoice id) cùng trạng thái xử lý; khi worker nhận lại message, nó kiểm tra key, thấy đã có kết quả thì bỏ qua. Đây là mẫu "exactly-once effect" (hiệu ứng đúng một lần) trên nền giao ít nhất một lần.

### Vì sao từng phương án sai
- **Tăng timeout:** chỉ giảm tần suất crash, không loại bỏ redelivery; vẫn có thể lặp.
- **Một worker duy nhất:** giảm throughput, vẫn crash được, và không giải quyết gốc rễ.
- **Tắt redelivery:** mất message khi crash, chuyển từ trùng lặp sang mất dữ liệu — tệ hơn.

> Nguyên tắc: đừng cố chống trùng ở tầng vận chuyển; hãy làm cho thao tác idempotent ở tầng nghiệp vụ.`
},
{
  id: 'qz-ccap-382',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] An order service emits an event for every order; a consumer calls Claude to classify the order and then charges a payment. The team needs exactly-once business effect even though the broker is at-least-once. Which two patterns best achieve this? (Choose 2)',
  options: [
    'Persist an idempotency key with the order id and check it before charging',
    'Use the transactional outbox pattern so the event and the state change commit together',
    'Retry forever with no backoff until it succeeds',
    'Charge first and classify later to save time',
    'Write a separate audit file for each attempt'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Idempotency key chống tính tiền hai lần, còn transactional outbox đảm bảo event không bị mất hoặc phát sinh lệch với dữ liệu gốc.

### Vì sao đáp án đúng
(1) **Idempotency key** theo order id: trước khi charge, kiểm tra xem order này đã charge chưa; nếu rồi thì bỏ qua, nên redelivery không gây charge lặp. (2) **Transactional outbox** (hộp thư giao dịch): ghi event vào cùng một transaction CSDL với thay đổi trạng thái order, rồi một process đọc outbox phát event — nhờ đó event và dữ liệu luôn khớp nhau, không có tình trạng "đã đổi trạng thái nhưng chưa phát event".

### Vì sao từng phương án sai
- **Retry vô hạn không backoff:** gây bão retry, quá tải hệ thống, và không chống trùng.
- **Charge trước classify sau:** nếu classify lỗi thì đã thu tiền sai, khó đối soát.
- **File audit riêng:** không tạo ra tính exactly-once, chỉ là ghi log.

> Nguyên tắc: exactly-once effect = idempotent sink + outbox/inbox, không phải "gửi đúng một lần".`
},
{
  id: 'qz-ccap-383',
  topic: 'claude',
  q: '[Enterprise Integration] A bank runs on AWS and must call Claude from inside its VPC without exposing long-lived API keys and without sending traffic over the public internet. Which approach best meets these constraints?',
  options: [
    'Store the Anthropic API key in an environment variable and call the public endpoint',
    'Ship the API key into each container image at build time',
    'Use Amazon Bedrock with an IAM role and a VPC endpoint so traffic stays private and no static key is stored',
    'Call Claude through a public proxy that puts the key in the URL'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Gọi qua Amazon Bedrock với IAM role và VPC endpoint: không lưu key tĩnh, traffic không ra internet công cộng.

### Vì sao đáp án đúng
IAM role cấp quyền tạm thời cho compute (không có secret dài hạn để rò rỉ). VPC endpoint giữ lưu lượng giữa VPC và dịch vụ model nằm trên mạng riêng, không đi qua internet công cộng — đúng yêu cầu của ngân hàng. Đây là mẫu "private connectivity + short-lived credentials".

### Vì sao từng phương án sai
- **Key trong biến môi trường:** vẫn là secret dài hạn, dễ lộ qua log/ảnh container, và traffic đi internet công cộng.
- **Đóng key vào image:** key bị "đóng băng" trong image, rất khó xoay vòng (rotate) và rò rỉ khi chia sẻ image.
- **Proxy công cộng để key trên URL:** URL vào log, proxy là điểm rò rỉ, traffic vẫn công cộng.

> Nguyên tắc: trong doanh nghiệp, ưu tiên IAM role tạm thời + private endpoint hơn API key tĩnh.`
},
{
  id: 'qz-ccap-384',
  topic: 'claude',
  q: '[Enterprise Integration] A support app streams Claude responses to the browser, but the API gateway in front buffers the whole response before forwarding, so the user sees nothing for 20 seconds. Which change best restores token-by-token streaming?',
  options: [
    'Increase the gateway idle timeout',
    'Disable response buffering at the gateway and use SSE or chunked passthrough for the streaming endpoint',
    'Ask Claude to produce the full answer faster',
    'Move the call into the browser with the API key embedded'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Vấn đề nằm ở buffering của gateway; tắt buffering và cho stream đi thẳng (SSE/chunked) là cách đúng.

### Vì sao đáp án đúng
Streaming chỉ có ý nghĩa khi từng chunk được đẩy ngay tới client. Gateway mặc định gom trọn response rồi mới gửi (buffering) để dễ xử lý; với endpoint stream, cần tắt buffering và chuyển tiếp chunk (Server-Sent Events hoặc chunked transfer) để token hiện ra ngay khi model sinh.

### Vì sao từng phương án sai
- **Tăng idle timeout:** chỉ tránh gateway tự ngắt, không bỏ buffering; người dùng vẫn chờ.
- **Bảo model trả lời nhanh hơn:** không sửa được buffering; và không ép được tốc độ sinh token.
- **Gọi từ browser kèm key:** làm lộ API key cho client — lỗ hổng bảo mật nghiêm trọng.

> Nguyên tắc: streaming hỏng thường do một tầng trung gian đang buffer, không phải do model.`
},
{
  id: 'qz-ccap-385',
  topic: 'claude',
  q: '[Enterprise Integration] A media company must summarise 5 million archived articles by the end of the quarter. The work is not urgent and the main goal is the lowest cost. Which API is the best fit?',
  options: [
    'Messages API called synchronously in a tight loop',
    'A single request that packs all articles into one prompt',
    'Message Batches API, which is asynchronous and costs about half of the standard price',
    'Streaming Messages API for each article'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Message Batches API chạy bất đồng bộ, giá khoảng một nửa, hợp với khối lượng lớn không gấp.

### Vì sao đáp án đúng
Message Batches API (bó yêu cầu) nhận cả lô, xử lý nền và trả kết quả sau (theo tài liệu là trong khoảng 24 giờ) với chi phí giảm khoảng 50% so với gọi chuẩn. Với 5 triệu bài, không gấp, mục tiêu là chi phí thấp, đây là lựa chọn tối ưu.

### Vì sao từng phương án sai
- **Gọi đồng bộ trong vòng lặp:** đắt gấp đôi, dễ vướng rate limit, không tận dụng giảm giá.
- **Một prompt cho tất cả:** vượt context window, không chia nhỏ được, chất lượng kém.
- **Streaming từng bài:** vẫn là giá chuẩn, streaming không giảm giá, chỉ giảm thời gian thấy token.

> Nguyên tắc: việc lớn, không gấp, chịu được trễ → batch; việc cần ngay → gọi đồng bộ/stream.`
},
{
  id: 'qz-ccap-386',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] Thirty product teams share one Claude gateway. Finance needs cost per team and the platform team needs to enforce per-team quotas. Which two changes best enable this? (Choose 2)',
  options: [
    'Require each team to send a unique API key or header tag that the gateway attributes usage to',
    'Emit per-request usage records (tokens, model, team) to a metrics store',
    'Rotate one shared key every month',
    'Split into thirty separate cloud accounts',
    'Log only the total daily token count'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Gắn danh tính theo team (key/tag) để quy trách nhiệm, và phát bản ghi usage theo từng request để đo và đặt quota.

### Vì sao đáp án đúng
(1) Mỗi team một key hoặc header tag: gateway biết request của ai để quy cost và áp quota theo team. (2) Ghi usage theo request (token vào/ra, model, team) vào kho số liệu: từ đó tính chi phí theo team, phát hiện bất thường, và chặn khi vượt quota.

### Vì sao từng phương án sai
- **Xoay một key chung:** mọi team dùng chung danh tính, không tách được cost.
- **Tách 30 account:** cực kỳ nặng quản trị, không cần thiết cho mục tiêu quy cost.
- **Chỉ log tổng token ngày:** không có breakdown theo team nên không quy trách nhiệm được.

> Nguyên tắc: muốn quy cost và quota theo nhóm, phải có danh tính theo nhóm ngay tại gateway.`
},
{
  id: 'qz-ccap-387',
  topic: 'claude',
  q: '[Enterprise Integration] An ERP only speaks XML over SOAP, but a new Claude feature needs JSON in and JSON out. The team does not want to rewrite the ERP. Which pattern best isolates the mismatch?',
  options: [
    'Rewrite the ERP so it emits JSON',
    'Send raw XML to Claude and hope it parses correctly',
    'Expose the ERP database directly to the Claude feature',
    'Add an adapter or anti-corruption layer that translates between XML/SOAP and the JSON the feature expects'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Dùng adapter / anti-corruption layer (lớp chống "ô nhiễm" mô hình) để dịch XML/SOAP sang JSON và ngược lại, cô lập hệ thống cũ.

### Vì sao đáp án đúng
Anti-corruption layer là lớp trung gian giữ cho mô hình của hệ thống mới (JSON, REST) không bị "lây" ràng buộc của hệ thống cũ (XML, SOAP). Adapter nhận XML từ ERP, chuyển thành JSON cho feature, và chuyển kết quả ngược lại. Nhờ đó ERP không phải sửa, và feature không phụ thuộc chi tiết của ERP.

### Vì sao từng phương án sai
- **Viết lại ERP:** tốn kém, rủi ro, đúng thứ team muốn tránh.
- **Gửi XML thô cho Claude:** không đảm bảo cấu trúc, dễ lỗi, không có hợp đồng rõ ràng.
- **Cho feature chạm thẳng CSDL ERP:** phá vỡ đóng gói, coupling chặt, rủi ro bảo mật và toàn vẹn.

> Nguyên tắc: tích hợp hệ thống cũ – mới nên qua adapter, đừng để mô hình hai bên rò rỉ vào nhau.`
},
{
  id: 'qz-ccap-388',
  topic: 'claude',
  q: '[Enterprise Integration] A single user request triggers three independent Claude calls that the current code runs one after another, and p99 latency is 12 seconds. The three calls do not depend on each other. Which change most directly reduces latency?',
  options: [
    'Run the three calls in parallel and combine the results',
    'Increase max_tokens on each call',
    'Use a larger model for all three calls',
    'Add a longer client timeout'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Ba call độc lập chạy tuần tự nên cộng dồn thời gian; chạy song song rồi gộp kết quả giảm còn khoảng thời gian của call chậm nhất.

### Vì sao đáp án đúng
Nếu mỗi call mất khoảng 4 giây và chạy tuần tự thì tổng ~12 giây. Chạy song song (ví dụ Promise.all / Future.all) và đợi cả ba thì tổng xấp xỉ max(4s) cộng chi phí gộp, tức giảm mạnh p99. Đây là tối ưu trực tiếp vì các call không phụ thuộc nhau.

### Vì sao từng phương án sai
- **Tăng max_tokens:** làm mỗi call sinh nhiều hơn, chậm hơn.
- **Dùng model lớn hơn:** thường chậm và đắt hơn.
- **Tăng timeout client:** chỉ chịu đựng chậm chứ không giảm độ trễ thực.

> Nguyên tắc: việc độc lập thì song song hoá; đừng để tổng độ trễ là phép cộng.`
},
{
  id: 'qz-ccap-389',
  topic: 'claude',
  q: '[Enterprise Integration] A platform team wants to send 5 percent of production traffic to a new model version while keeping 95 percent on the current one, and roll back instantly if the error rate rises. Where is the safest place to implement this split?',
  options: [
    'In the client application code of every product team',
    'At the shared gateway using weighted routing or a feature flag with instant rollback',
    'By editing the system prompt',
    'By redeploying the model weights'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Chia lưu lượng tại gateway (weighted routing / feature flag) để điều chỉnh và rollback tức thì ở một nơi.

### Vì sao đáp án đúng
Gateway là điểm điều khiển tập trung: đặt trọng số 5/95, theo dõi lỗi, và chuyển về 0% cho model mới ngay khi sự cố. Một nơi thay đổi, áp dụng tức thì, không cần deploy lại từng team. Đây là mẫu canary (thả bướm) an toàn.

### Vì sao từng phương án sai
- **Sửa code từng client:** phân tán, chậm, khó rollback đồng loạt, dễ lệch cấu hình.
- **Sửa system prompt:** không chia được lưu lượng theo tỉ lệ, không phải cơ chế canary.
- **Triển khai lại trọng số model:** không khả thi với model do nhà cung cấp vận hành, và không instant.

> Nguyên tắc: canary nên đặt ở gateway, nơi có thể đổi tỉ lệ và rollback trong vài giây.`
},
{
  id: 'qz-ccap-390',
  topic: 'claude',
  multi: true,
  q: '[Enterprise Integration] A platform team is defining the contract that every product team must follow when calling the internal Claude gateway. Which three elements make the contract robust? (Choose 3)',
  options: [
    'A versioned, pinned model id and prompt version per capability',
    'Schema validation of Claude outputs before they are used downstream',
    'Timeouts plus bounded retries with exponential backoff and jitter',
    'A single hard-coded API key shared by all clients',
    'One global prompt shared by all teams with no versioning'
  ],
  answer: [0, 1, 2],
  explain: `**Tóm tắt:** Ghim phiên bản model/prompt, kiểm tra schema đầu ra, và timeout + retry có backoff là ba trụ của một hợp đồng tích hợp ổn định.

### Vì sao đáp án đúng
(1) **Pinned version** (ghim cứng phiên bản model và prompt) giúp hành vi không đổi âm thầm khi nhà cung cấp cập nhật; đổi phiên bản là quyết định có kiểm soát. (2) **Schema validation** chặn JSON sai định dạng lan xuống downstream. (3) **Timeout + bounded retry với backoff và jitter** (giãn có ngẫu nhiên) tránh treo và tránh bão retry đồng loạt.

### Vì sao từng phương án sai
- **Key cứng dùng chung:** không quy trách nhiệm, khó rotate, rò rỉ một chỗ là hỏng tất cả.
- **Prompt global không phiên bản:** mọi team phụ thuộc lẫn nhau, một thay đổi làm hỏng tất cả, không rollback được.

> Nguyên tắc: hợp đồng tốt = phiên bản rõ + hợp đồng dữ liệu + chính sách lỗi rõ.`
},
{
  id: 'qz-ccap-391',
  topic: 'claude',
  q: '[Solution Design] A multi-tenant SaaS stores documents of every tenant in one shared vector index. A tenant must never receive chunks that belong to another tenant. Which design best enforces isolation?',
  options: [
    'Rely on the model to ignore chunks of other tenants',
    'Shuffle the shared index every night',
    'Store a tenant_id on every chunk and apply a mandatory tenant filter at query time, ideally with per-tenant namespaces',
    'Use one shared cache for all tenants'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Gắn tenant_id cho mọi chunk và lọc bắt buộc theo tenant khi truy vấn (tốt nhất là namespace riêng) để cách ly dữ liệu.

### Vì sao đáp án đúng
Cách ly phải được thực thi ở tầng dữ liệu, không phải bằng lời nhắc model. Lưu tenant_id trên từng chunk và luôn lọc theo tenant khi retrieve (hoặc tách namespace/collection theo tenant) đảm bảo không chunk của tenant khác lọt vào ngữ cảnh. Đây là "tenant isolation" (cách ly theo khách thuê).

### Vì sao từng phương án sai
- **Nhờ model bỏ qua:** model không đáng tin để làm ranh giới bảo mật; vẫn có thể dùng nhầm dữ liệu.
- **Xáo trộn index:** không tạo ranh giới, chỉ gây nhiễu, không ngăn truy hồi chéo.
- **Cache chung:** dễ rò dữ liệu chéo tenant qua cache.

> Nguyên tắc: cách ly tenant là việc của truy vấn và lưu trữ, không phải của prompt.`
},
{
  id: 'qz-ccap-392',
  topic: 'claude',
  q: '[Solution Design] An agent must complete a five-step task that calls several tools. The team wants reliable completion without the agent looping forever. Which design is best?',
  options: [
    'Give the agent one giant prompt and no step limit',
    'Let the agent call tools with no schema',
    'Use an explicit planner with a step budget, structured tool schemas, and a validation step after each tool result',
    'Remove the tools and ask for a plain text answer'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Planner có ngân sách bước, schema tool rõ ràng, và bước kiểm tra sau mỗi tool giúp agent hoàn thành mà không lặp vô hạn.

### Vì sao đáp án đúng
**Step budget** (giới hạn số bước) chặn vòng lặp vô hạn. **Structured tool schemas** buộc tham số đúng dạng, giảm lỗi gọi tool. **Validation sau mỗi tool result** phát hiện sai và sửa trước khi đi tiếp. Ba thứ này cho "controlled autonomy" (tự chủ có kiểm soát).

### Vì sao từng phương án sai
- **Một prompt khổng lồ, không giới hạn bước:** dễ lạc, dễ lặp, khó debug.
- **Tool không schema:** tham số sai, lỗi âm thầm, khó tái lập.
- **Bỏ tool, chỉ trả text:** mất khả năng hành động, không hoàn thành được tác vụ thực.

> Nguyên tắc: agent cần ngân sách, hợp đồng tool, và vòng kiểm tra — không chỉ một prompt dài.`
},
{
  id: 'qz-ccap-393',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A long-running agent keeps exceeding the context window as it reads files and keeps the full transcript. Which two techniques best keep it within budget? (Choose 2)',
  options: [
    'Summarise older turns and keep only the recent messages verbatim',
    'Offload large artefacts to external storage and pass references instead of full content',
    'Raise temperature to shorten answers',
    'Disable the transcript entirely from turn one',
    'Send every file again on each turn'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Tóm tắt các lượt cũ và đưa artefact lớn ra kho ngoài (chỉ truyền con trỏ tham chiếu) để giảm token nạp vào context.

### Vì sao đáp án đúng
(1) **Summarise older turns** (tóm tắt lượt cũ) giữ ngữ cảnh chính, chỉ giữ nguyên văn vài lượt gần nhất — giảm token mà không mất mạch. (2) **External memory / offload** (đưa nội dung lớn ra ngoài, truyền id/đường dẫn) để agent nạp lại khi cần thay vì nhồi toàn bộ vào mỗi lượt. Đây là mẫu "context management" cho agent dài.

### Vì sao từng phương án sai
- **Tăng temperature:** không giảm token, chỉ tăng ngẫu nhiên.
- **Tắt transcript từ đầu:** mất ngữ cảnh, agent không biết đã làm gì.
- **Gửi lại mọi file mỗi lượt:** làm context phình to, đúng nguyên nhân gây tràn.

> Nguyên tắc: context là tài nguyên hữu hạn; tóm tắt + offload là hai đòn bẩy chính.`
},
{
  id: 'qz-ccap-394',
  topic: 'claude',
  q: '[Solution Design] A RAG assistant gives outdated answers because the knowledge base is re-indexed only once a year while policies change every month. Which change best fixes the root cause?',
  options: [
    'Increase the number of retrieved chunks',
    'Re-index documents when they change and store a version or recency signal used to filter or rank results',
    'Use a larger model',
    'Lower temperature to 0'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Nguyên nhân gốc là dữ liệu cũ; phải re-index khi tài liệu đổi và dùng tín hiệu phiên bản/độ mới để lọc hoặc xếp hạng.

### Vì sao đáp án đúng
RAG chỉ tốt bằng kho dữ liệu của nó. Re-index theo sự kiện (khi tài liệu thay đổi) và lưu version/recency (phiên bản, thời điểm) cho phép ưu tiên bản mới, loại bản cũ. Đây là sửa gốc rễ chứ không phải che triệu chứng.

### Vì sao từng phương án sai
- **Lấy nhiều chunk hơn:** vẫn là chunk cũ, không sửa được lỗi thời.
- **Dùng model lớn hơn:** model không biết tài liệu mới nếu không được nạp.
- **Temperature 0:** chỉ giảm ngẫu nhiên, không liên quan độ mới.

> Nguyên tắc: RAG lỗi thời là vấn đề pipeline dữ liệu, không phải vấn đề model.`
},
{
  id: 'qz-ccap-395',
  topic: 'claude',
  q: '[Solution Design] A legal assistant must give answers with citations that a lawyer can verify in the source. Which design best ensures the citations are trustworthy?',
  options: [
    'Ask the model to invent plausible citation titles',
    'Cite the training data of the model',
    'Show a citation without checking it against the source',
    'Return the exact source chunk ids used and verify each quote actually appears in the retrieved text before showing it'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Trả về id chunk nguồn đã dùng và kiểm tra trích dẫn có thật trong văn bản truy hồi trước khi hiển thị.

### Vì sao đáp án đúng
Citation đáng tin phải truy vết được về nguồn. Bằng cách giữ chunk id và xác minh câu trích xuất hiện thật trong retrieved text (chống "citation bịa"), người dùng kiểm chứng được. Đây là "grounded citation with verification".

### Vì sao từng phương án sai
- **Bịa tiêu đề hợp lý:** chính là hallucination, nguy hiểm trong pháp lý.
- **Trích training data:** không truy vết được, không kiểm chứng.
- **Hiện citation không kiểm tra:** có thể sai, mất niềm tin.

> Nguyên tắc: citation phải kiểm chứng được, không phải trông có vẻ đúng.`
},
{
  id: 'qz-ccap-396',
  topic: 'claude',
  q: '[Solution Design] A customer-facing assistant must stay useful when the primary Claude model is temporarily unavailable. Which design best provides graceful degradation?',
  options: [
    'Return a 500 error to every user',
    'Block all requests until the model comes back',
    'Send the API key to users so they can retry themselves',
    'Fall back to a smaller or alternate model or cached answers, queue non-urgent requests, and show a clear message to the user'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Graceful degradation (suy giảm êm) = chuyển sang model nhỏ/dự phòng hoặc câu trả lời cache, hàng đợi việc không gấp, và báo rõ cho người dùng.

### Vì sao đáp án đúng
Khi model chính lỗi, hệ thống vẫn phục vụ ở mức thấp hơn thay vì sập: fallback sang model khác/cache, giữ trải nghiệm cơ bản, và xếp hàng việc không khẩn. Người dùng được thông báo trung thực. Đây là thiết kế "graceful degradation".

### Vì sao từng phương án sai
- **500 cho mọi request:** sập hoàn toàn, trải nghiệm tệ.
- **Chặn tới khi model trở lại:** không có degraded mode, downtime kéo dài.
- **Gửi key cho user:** rò rỉ secret, lỗ hổng bảo mật.

> Nguyên tắc: luôn có đường lui; sập hoàn toàn là lỗi thiết kế, không phải sự cố hiếm.`
},
{
  id: 'qz-ccap-397',
  topic: 'claude',
  multi: true,
  q: '[Solution Design] A domain assistant must reduce confident wrong answers. Which two design choices most directly help? (Choose 2)',
  options: [
    'Ground answers in retrieved sources and require the model to say when evidence is missing',
    'Ask the model to always answer confidently',
    'Show sources so users and reviewers can check the claims',
    'Remove all context to keep answers short',
    'Increase temperature for more creativity'
  ],
  answer: [0, 2],
  explain: `**Tóm tắt:** Grounding (neo câu trả lời vào nguồn truy hồi) và hiển thị nguồn để kiểm chứng là hai cách trực tiếp giảm trả lời sai tự tin.

### Vì sao đáp án đúng
(1) **Grounding + cho phép nói "không đủ dữ kiện"** buộc model dựa vào bằng chứng thay vì bịa. (2) **Hiện nguồn** cho phép người dùng/reviewer phát hiện sai và tạo vòng phản hồi. Cả hai tác động thẳng vào hallucination.

### Vì sao từng phương án sai
- **Luôn trả lời tự tin:** làm tăng thiệt hại của câu sai.
- **Bỏ hết ngữ cảnh:** mất grounding, model càng dễ bịa.
- **Tăng temperature:** tăng ngẫu nhiên, dễ sai hơn.

> Nguyên tắc: chống hallucination = grounding + minh bạch nguồn, không phải "nhờ model cố gắng".`
},
{
  id: 'qz-ccap-398',
  topic: 'claude',
  q: '[Solution Design] An assistant can approve refunds above a threshold. The company wants a human-in-the-loop for high-value actions. Which design is best?',
  options: [
    'Let the model approve any amount on its own',
    'Route actions above the threshold to a human approval queue and record who approved what',
    'Lower the threshold to zero so nothing is ever approved',
    'Remove logging to save cost'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Human-in-the-loop (con người trong vòng lặp): việc giá trị cao đẩy sang hàng chờ người phê duyệt, kèm ghi vết ai duyệt gì.

### Vì sao đáp án đúng
Với hành động rủi ro cao, thêm bước người phê duyệt và log quyết định (ai, khi nào, duyệt gì) tạo kiểm soát và truy vết. Model chỉ đề xuất, con người quyết. Đây là HITL đúng nghĩa.

### Vì sao từng phương án sai
- **Model tự duyệt mọi mức:** bỏ kiểm soát người, rủi ro tài chính lớn.
- **Ngưỡng bằng 0:** không duyệt gì, vô dụng.
- **Bỏ log:** mất truy vết, không quy trách nhiệm được.

> Nguyên tắc: rủi ro cao thì thêm bước người, và luôn ghi lại quyết định.`
},
{
  id: 'qz-ccap-399',
  topic: 'claude',
  q: '[Eval & Optimization] A team is about to launch a Claude feature and has no quality measurements yet. What should they do first?',
  options: [
    'Launch to all users and rely on complaints',
    'Compare token prices of candidate models',
    'Build a small golden set from real traffic with labelled expected answers and run it as a baseline',
    'Skip measurement to save time'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Bắt đầu bằng một golden set nhỏ lấy từ traffic thật, có đáp án kỳ vọng đã gán nhãn, để có baseline.

### Vì sao đáp án đúng
Không đo thì không cải thiện. Golden set (bộ "vàng") đại diện + nhãn kỳ vọng cho phép so sánh trước/sau mỗi thay đổi và phát hiện regression. Đây là bước nền tảng của eval.

### Vì sao từng phương án sai
- **Launch rồi chờ phàn nàn:** quá trễ, người dùng chịu lỗi trước.
- **So giá token:** không nói gì về chất lượng.
- **Bỏ đo:** mù chất lượng, không thể tối ưu.

> Nguyên tắc: trước khi tối ưu, phải có một bộ đo lặp lại được.`
},
{
  id: 'qz-ccap-400',
  topic: 'claude',
  multi: true,
  q: '[Eval & Optimization] A team builds an automated eval that runs after every prompt change. Which two practices make the results trustworthy? (Choose 2)',
  options: [
    'Version the dataset and the judge prompt so results are comparable over time',
    'Use a fixed representative sample and review a human spot-check of the judge decisions',
    'Change the dataset every run so it stays fresh',
    'Let the same prompt grade itself with no oversight',
    'Judge only on answer length'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Version hoá dataset và judge prompt để so sánh được, cộng lấy mẫu cố định và spot-check của người để tránh judge sai lệch.

### Vì sao đáp án đúng
(1) **Version** dataset và judge prompt: nếu đổi ngầm, so sánh trước/sau sẽ vô nghĩa. (2) **Mẫu cố định, đại diện + human spot-check**: kết quả ổn định và có người kiểm tra độ tin của judge (tránh "judge tự chấm mình"). Đây là eval đáng tin.

### Vì sao từng phương án sai
- **Đổi dataset mỗi run:** mất tính so sánh, regression bị che.
- **Prompt tự chấm không giám sát:** thiên lệch, không phát hiện lỗi của chính nó.
- **Chỉ chấm độ dài:** không đo chất lượng.

> Nguyên tắc: eval đáng tin cần dữ liệu cố định, phiên bản rõ, và một chút giám sát người.`
},
{
  id: 'qz-ccap-401',
  topic: 'claude',
  q: '[Eval & Optimization] A team must estimate cost per request before launch. Each request sends about 1,000 input tokens and receives about 500 output tokens. What is the most reliable way to estimate?',
  options: [
    'Guess from the monthly bill',
    'Count only the number of requests',
    'Multiply input tokens by the published input price and output tokens by the published output price of the model, then add them',
    'Always pick the cheapest model regardless of quality'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Cost = token vào × giá vào + token ra × giá ra; dùng đúng bảng giá của model.

### Vì sao đáp án đúng
Nhà cung cấp tính tiền theo token vào và token ra với đơn giá khác nhau (output thường đắt hơn). Nhân đúng số token với đơn giá rồi cộng là cách ước lượng chuẩn. Đây là "cost estimation" theo token.

### Vì sao từng phương án sai
- **Đoán từ bill tháng:** không suy ra được cho một request, nhiều nhiễu.
- **Chỉ đếm số request:** bỏ qua độ dài, sai lệch lớn.
- **Chọn model rẻ nhất bất kể chất lượng:** tối ưu sai mục tiêu, hỏng trải nghiệm.

> Nguyên tắc: token vào và token ra có giá khác nhau; phải tính riêng rồi cộng.`
},
{
  id: 'qz-ccap-402',
  topic: 'claude',
  q: '[Eval & Optimization] A Claude feature has high p95 latency mainly because responses are long. Which lever most directly reduces latency without changing the model?',
  options: [
    'Cap max_tokens and stream the response so the user sees output early',
    'Increase max_tokens',
    'Use a larger model',
    'Turn off streaming'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Giới hạn max_tokens để sinh ít hơn, và stream để người dùng thấy token sớm — giảm độ trễ cảm nhận và p95.

### Vì sao đáp án đúng
Độ trễ tỉ lệ với số token sinh. Cắt max_tokens giảm khối lượng sinh; streaming cho kết quả hiện dần thay vì chờ trọn. Cả hai giảm p95 mà không đổi model.

### Vì sao từng phương án sai
- **Tăng max_tokens:** sinh nhiều hơn, chậm hơn.
- **Dùng model lớn hơn:** thường chậm hơn.
- **Tắt streaming:** người dùng chờ lâu hơn, p95 cảm nhận tệ hơn.

> Nguyên tắc: độ trễ sinh tỉ lệ với độ dài; cắt bớt và stream là đòn bẩy nhanh nhất.`
},
{
  id: 'qz-ccap-403',
  topic: 'claude',
  q: '[Eval & Optimization] A team uses prompt caching with a 5-minute TTL. When does the cache-miss rate spike the most?',
  options: [
    'When the cached prefix changes, such as right after a deploy or when the prefix has high cardinality',
    'When traffic is steady and the prefix is identical every time',
    'When the model is smaller',
    'When outputs are short'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Cache miss tăng vọt khi prefix thay đổi (sau deploy) hoặc prefix quá đa dạng (high cardinality) khiến ít gặp lại.

### Vì sao đáp án đúng
Prompt caching chỉ hit khi phần đầu (prefix) giống hệt và còn trong TTL. Sau khi deploy đổi prompt, hoặc khi prefix chứa yếu tố thay đổi liên tục (ví dụ ghép cả nội dung động vào đầu), cache gần như không dùng lại được → miss tăng, mất lợi ích.

### Vì sao từng phương án sai
- **Traffic đều, prefix giống nhau:** điều kiện lý tưởng để cache hit cao.
- **Model nhỏ hơn:** không liên quan tới hit/miss của cache.
- **Output ngắn:** cache liên quan input prefix, không phải độ dài output.

> Nguyên tắc: cache chỉ hiệu quả khi prefix ổn định và được lặp lại trong TTL.`
},
{
  id: 'qz-ccap-404',
  topic: 'claude',
  multi: true,
  q: '[Eval & Optimization] Executives want metrics that reflect business value, not just model internals. Which two metrics best show value? (Choose 2)',
  options: [
    'Task success rate on real user goals',
    'Human escalation or handoff rate and its trend',
    'Average tokens per request',
    'Number of API calls',
    'The model temperature setting'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Tỉ lệ hoàn thành tác vụ thật và tỉ lệ phải chuyển cho người xử lý là hai thước đo giá trị nghiệp vụ trực tiếp.

### Vì sao đáp án đúng
(1) **Task success rate** đo bao nhiêu yêu cầu thực sự được giải quyết — gắn thẳng với giá trị. (2) **Escalation rate** (tỉ lệ phải nhờ người) thấp và ổn định nghĩa là assistant gánh việc thật; xu hướng tăng là dấu hiệu chất lượng giảm.

### Vì sao từng phương án sai
- **Token mỗi request:** chỉ là chi phí, không phải giá trị.
- **Số call API:** hoạt động, không phải kết quả.
- **Temperature:** tham số cấu hình, không đo giá trị.

> Nguyên tắc: đo kết quả cho người dùng, đừng đo thông số nội bộ của model.`
},
{
  id: 'qz-ccap-405',
  topic: 'claude',
  q: '[Eval & Optimization] A team wants to A/B test a model change on a high-traffic feature. Which approach is valid?',
  options: [
    'Randomly split traffic, fix the eval and guardrail metrics in advance, and compare over a full business cycle',
    'Show the new model only to internal staff and decide by feeling',
    'Compare a single day before and after with no control group',
    'Let users pick the model and count votes'
  ],
  answer: 0,
  explain: `**Tóm tắt:** A/B hợp lệ = chia ngẫu nhiên, cố định metric và guardrail trước, so sánh trên trọn một chu kỳ kinh doanh.

### Vì sao đáp án đúng
Chia ngẫu nhiên loại thiên lệch, guardrail (metric bảo vệ như lỗi, tỉ lệ escalate) chặn việc "thắng chỉ số chính nhưng hại trải nghiệm", và chạy đủ một chu kỳ để tránh nhiễu theo ngày/giờ. Đây là thực nghiệm có kiểm soát.

### Vì sao từng phương án sai
- **Chỉ nội bộ, quyết bằng cảm giác:** không đại diện, không định lượng.
- **So một ngày trước/sau, không nhóm chứng:** nhiễu thời gian, không kết luận được nhân quả.
- **Cho user chọn, đếm vote:** thiên lệch tự chọn, không đo chất lượng.

> Nguyên tắc: thay đổi model phải test như thực nghiệm — ngẫu nhiên, có guardrail, đủ chu kỳ.`
},
{
  id: 'qz-ccap-406',
  topic: 'claude',
  q: '[Eval & Optimization] Sixty percent of requests are simple FAQs and forty percent are complex analysis. The team wants lower cost with minimal quality loss. Which approach is best?',
  options: [
    'Use one large model for everything',
    'Use the most expensive model for all requests',
    'Disable the feature for simple FAQs',
    'Route simple FAQs to a cheaper small model and complex requests to a stronger model'
  ],
  answer: 3,
  explain: `**Tóm tắt:** Model routing (định tuyến theo độ khó): việc dễ đi model nhỏ rẻ, việc khó đi model mạnh.

### Vì sao đáp án đúng
Đa số request là FAQ đơn giản, không cần model đắt. Định tuyến theo độ phức tạp (hoặc theo điểm tin cậy) đưa 60% sang model nhỏ, giữ 40% khó cho model mạnh — giảm chi phí mà ít ảnh hưởng chất lượng. Đây là "model routing / cascade".

### Vì sao từng phương án sai
- **Một model lớn cho tất cả:** trả giá cao cho cả việc dễ.
- **Model đắt nhất cho tất cả:** tốn kém tối đa.
- **Tắt cho FAQ:** mất phần lớn lưu lượng, vô dụng.

> Nguyên tắc: đừng dùng model đắt cho việc dễ; hãy định tuyến theo độ khó.`
},
{
  id: 'qz-ccap-407',
  topic: 'claude',
  q: '[Governance & Risk] A company stores customer documents in a vector index and sends them to Claude for a RAG assistant. A customer exercises a GDPR right-to-erasure request. Which action is most complete?',
  options: [
    'Delete only the chat history',
    'Delete the source documents of the customer, their derived chunks and embeddings, and apply the retention policy to logs, then confirm completion',
    'Keep the embeddings but hide them from the user',
    'Anonymise only the display name'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Xoá toàn bộ: tài liệu gốc, chunk/embedding phái sinh, và áp chính sách lưu trữ cho log — rồi xác nhận hoàn tất.

### Vì sao đáp án đúng
Quyền được xoá (right to erasure) bao trùm mọi bản sao và dữ liệu phái sinh. Nếu chỉ xoá chat mà giữ embedding thì dữ liệu cá nhân vẫn còn và có thể bị truy hồi. Xoá cả gốc lẫn phái sinh, xử lý log theo retention, và xác nhận là cách đầy đủ.

### Vì sao từng phương án sai
- **Chỉ xoá chat:** bỏ sót tài liệu và embedding.
- **Giữ embedding, chỉ ẩn:** dữ liệu cá nhân vẫn tồn tại, vi phạm.
- **Ẩn danh mỗi tên hiển thị:** không xoá dữ liệu gốc và phái sinh.

> Nguyên tắc: quyền xoá áp dụng cho cả dữ liệu phái sinh (embedding, cache, log), không chỉ bản gốc.`
},
{
  id: 'qz-ccap-408',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] An agent can call internal tools such as refund, update address, and read orders. Which two controls best enforce least privilege? (Choose 2)',
  options: [
    'Give each tool a scoped credential limited to the specific actions and records it needs',
    'Maintain an allowlist of permitted actions and validate arguments before execution',
    'Give the agent one admin key for all tools',
    'Disable all logging of tool calls',
    'Let the model decide permissions from the prompt'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Least privilege (quyền tối thiểu): mỗi tool một credential phạm vi hẹp, cộng allowlist hành động và kiểm tra tham số trước khi chạy.

### Vì sao đáp án đúng
(1) **Scoped credential** cho từng tool: nếu một tool bị lạm dụng, thiệt hại giới hạn trong phạm vi của nó. (2) **Allowlist + validate arguments**: chỉ cho phép hành động hợp lệ và kiểm tra tham số (ví dụ không vượt hạn mức) trước khi thực thi — không tin lời model.

### Vì sao từng phương án sai
- **Một admin key cho mọi tool:** vi phạm least privilege, rò một chỗ là mất tất cả.
- **Tắt log tool call:** mất truy vết, không phát hiện lạm dụng.
- **Để model tự quyết quyền từ prompt:** prompt không phải cơ chế phân quyền.

> Nguyên tắc: phân quyền là việc của hệ thống (scope + allowlist), không phải của prompt.`
},
{
  id: 'qz-ccap-409',
  topic: 'claude',
  q: '[Governance & Risk] A regulator asks the company to reproduce exactly what a Claude-based decision did on a given day. Which record is most essential?',
  options: [
    'An immutable log of the exact prompt, model id and version, parameters, retrieved context, and output for each decision',
    'A screenshot of the dashboard',
    'The training description of the model',
    'A daily total token count'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Log bất biến gồm prompt, model/version, tham số, ngữ cảnh truy hồi và output cho từng quyết định.

### Vì sao đáp án đúng
Để tái lập (reproduce) một quyết định, cần đủ đầu vào và cấu hình đã dùng: prompt chính xác, model và phiên bản, tham số, context đã nạp, và kết quả. Log bất biến (immutable) đảm bảo không bị sửa về sau — điều kiện cho audit.

### Vì sao từng phương án sai
- **Ảnh dashboard:** không đủ chi tiết để tái lập.
- **Mô tả training của model:** không phải bản ghi quyết định cụ thể.
- **Tổng token ngày:** chỉ là thống kê, không tái lập được.

> Nguyên tắc: auditability = log bất biến, đủ đầu vào + cấu hình + đầu ra cho từng quyết định.`
},
{
  id: 'qz-ccap-410',
  topic: 'claude',
  q: '[Governance & Risk] A company worries that Claude outputs could leak secrets. Which control best reduces data exfiltration through outputs?',
  options: [
    'Put secrets into the prompt so the model can redact them itself',
    'Apply an egress DLP filter on model outputs and never place secrets in the context in the first place',
    'Rely on the model to keep secrets safe',
    'Disable output logging only'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Không đưa secret vào context ngay từ đầu, và lọc DLP ở lối ra (egress) để chặn rò rỉ qua output.

### Vì sao đáp án đúng
Phòng thủ theo lớp: (1) không nạp secret vào prompt nên model không có gì để lộ; (2) **egress DLP** (data loss prevention — phòng chống mất dữ liệu) quét output trước khi trả về để bắt pattern nhạy cảm. Đây là "data exfiltration" (rò rỉ dữ liệu ra ngoài) defense.

### Vì sao từng phương án sai
- **Đưa secret vào prompt để model tự che:** model có thể lặp lại, prompt injection có thể moi ra.
- **Tin model giữ secret:** không đảm bảo, không kiểm soát.
- **Chỉ tắt log output:** log không phải đường rò rỉ chính; output vẫn tới người dùng.

> Nguyên tắc: chặn rò rỉ bằng "không đưa vào" + lọc ở lối ra, đừng tin model tự giữ bí mật.`
},
{
  id: 'qz-ccap-411',
  topic: 'claude',
  q: '[Governance & Risk] A governance team wants a concise artefact describing the intended use, limitations, and evaluation results of a Claude model for reviewers. Which artefact is this?',
  options: [
    'A load-balancer configuration',
    'A prompt template',
    'A model card',
    'A rate-limit dashboard'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Model card là tài liệu tóm tắt mục đích dùng, giới hạn và kết quả đánh giá của một model.

### Vì sao đáp án đúng
**Model card** (thẻ model) ghi rõ use case dự kiến, điều kiện không phù hợp, và kết quả eval — giúp reviewer và stakeholder hiểu nhanh. Đây là artefact quản trị chuẩn.

### Vì sao từng phương án sai
- **Cấu hình load balancer:** hạ tầng, không mô tả model.
- **Prompt template:** cách dùng cụ thể, không phải tổng quan model.
- **Dashboard rate limit:** vận hành, không phải tài liệu quản trị.

> Nguyên tắc: model card là "hộ chiếu" của model cho governance và review.`
},
{
  id: 'qz-ccap-412',
  topic: 'claude',
  multi: true,
  q: '[Governance & Risk] A company uses Claude for automated loan decisions. Which two safeguards are most important for such high-stakes decisions? (Choose 2)',
  options: [
    'A human appeal and review path for declined applicants',
    'Bias and fairness testing across groups plus ongoing monitoring',
    'Let the model set its own approval threshold with no review',
    'Remove all records to avoid liability',
    'Use a single prompt with no evaluation'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Quyền khiếu nại/duyệt lại của con người, và kiểm thử công bằng (bias/fairness) kèm giám sát liên tục.

### Vì sao đáp án đúng
(1) **Human appeal/review**: quyết định rủi ro cao cần đường cho người xem lại, tránh thiệt hại không thể sửa. (2) **Bias/fairness testing + monitoring**: phát hiện phân biệt đối xử theo nhóm và theo dõi theo thời gian. Đây là hai trụ của responsible AI cho quyết định tín dụng.

### Vì sao từng phương án sai
- **Model tự đặt ngưỡng, không review:** mất kiểm soát, rủi ro pháp lý.
- **Xoá hết hồ sơ:** mất truy vết, vi phạm nghĩa vụ lưu trữ.
- **Một prompt không eval:** không đo công bằng, không phát hiện sai.

> Nguyên tắc: quyết định rủi ro cao cần quyền con người xem lại và kiểm thử công bằng liên tục.`
},
{
  id: 'qz-ccap-413',
  topic: 'claude',
  q: '[Models & Context] A team needs Claude to return valid JSON on every call for downstream parsing. Which approach is most reliable?',
  options: [
    'Ask for JSON in the prompt and hope for the best',
    'Use tool use or structured outputs with a JSON schema, then validate and retry on parse failure',
    'Increase temperature',
    'Use a larger model only'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Dùng tool use / structured outputs với JSON schema, rồi validate và retry khi parse lỗi.

### Vì sao đáp án đúng
Structured outputs (đầu ra có cấu trúc) / tool use ràng buộc output theo schema, cho JSON hợp lệ ổn định. Validate + retry là lớp an toàn cuối. Đây là cách "reliable JSON".

### Vì sao từng phương án sai
- **Nhờ trong prompt rồi cầu mong:** không đảm bảo, vẫn có thể sai định dạng.
- **Tăng temperature:** tăng ngẫu nhiên, dễ sai hơn.
- **Chỉ dùng model lớn:** không giải quyết vấn đề định dạng.

> Nguyên tắc: cần JSON ổn định thì ép bằng schema, đừng "nhờ" model.`
},
{
  id: 'qz-ccap-414',
  topic: 'claude',
  q: '[Models & Context] When using the extended thinking feature on supported Claude models (e.g., Claude 3.7 Sonnet with thinking enabled), which sampling parameters become incompatible and return HTTP 400 if included in the same request?',
  options: [
    'temperature, top_p, top_k',
    'max_tokens, stop_sequences',
    'system, messages',
    'model, stream'
  ],
  answer: 0,
  explain: `**Tóm tắt:** Khi bật extended thinking (thinking: { type: "enabled", budget_tokens: N }), các tham số lấy mẫu temperature, top_p, top_k không được phép cùng request và sẽ gây lỗi 400.

### Vì sao đáp án đúng
Extended thinking thay thế cơ chế lấy mẫu bằng budget tư duy. Khi thinking được bật, API yêu cầu không gửi temperature, top_p, top_k trong cùng request; gửi sẽ bị từ chối (400). Các tham số khác như max_tokens, stop_sequences, system, messages, model, stream vẫn hoạt động bình thường.

### Vì sao từng phương án sai
- **max_tokens, stop_sequences:** vẫn được phép dùng khi thinking bật.
- **system, messages:** bắt buộc cho mọi request, không liên quan thinking.
- **model, stream:** bắt buộc/tùy chọn chuẩn, không bị thinking ảnh hưởng.

> Nguyên tắc: bật thinking → bỏ temperature/top_p/top_k; dùng budget_tokens trong thinking config để kiểm soát độ sâu suy luận.`
},
{
  id: 'qz-ccap-415',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] Regarding the 200K-token context window and up to 128K max output of current Claude models (e.g., Claude 3.5/3.7 Sonnet, Opus 4), which two statements are correct? (Choose 2)',
  options: [
    'A larger context window does not guarantee the model uses all of it reliably, so relevant content should still be surfaced',
    'Cost and latency grow with the number of input and output tokens actually processed',
    'A 200K context window is always free of extra cost',
    'Output length is unlimited',
    'Context length has no effect on latency'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Context lớn không đảm bảo model dùng hết một cách đáng tin, và chi phí/độ trễ tăng theo số token thực xử lý.

### Vì sao đáp án đúng
(1) "Lost in the middle": model không chắc chắn dùng toàn bộ context; nên đưa nội dung liên quan lên trước/lọc bớt. (2) Tiền và thời gian tỉ lệ với token vào/ra thực tế — context càng lớn càng tốn. Đây là hiểu đúng về context window.

### Vì sao từng phương án sai
- **200K context miễn phí:** sai, token vẫn tính tiền.
- **Output không giới hạn:** sai, có trần max output (128K).
- **Context không ảnh hưởng latency:** sai, nhiều token hơn thì chậm hơn.

> Nguyên tắc: context lớn là khả năng, không phải miễn phí hay dùng hết tự động.`
},
{
  id: 'qz-ccap-416',
  topic: 'claude',
  q: '[Models & Context] A streaming call returns stop_reason max_tokens and the JSON is cut off mid-way. What is the best handling?',
  options: [
    'Treat the truncated output as final',
    'Continue the response from where it stopped or raise max_tokens, then validate the JSON',
    'Delete the request',
    'Increase temperature'
  ],
  answer: 1,
  explain: `**Tóm tắt:** stop_reason max_tokens nghĩa là bị cắt do hết hạn mức token; nối tiếp hoặc tăng max_tokens rồi validate lại.

### Vì sao đáp án đúng
max_tokens báo output bị cắt giữa chừng, không phải model đã xong. Cách xử lý là tiếp tục sinh phần còn lại (continue) hoặc nâng max_tokens cho đủ, sau đó kiểm tra JSON hợp lệ. Coi là "đã xong" sẽ hỏng downstream.

### Vì sao từng phương án sai
- **Coi là final:** JSON dở dang, parse lỗi.
- **Xoá request:** mất việc, không sửa gốc.
- **Tăng temperature:** không liên quan, không thêm token.

> Nguyên tắc: max_tokens là tín hiệu "còn nữa", phải nối tiếp chứ không dừng.`
},
{
  id: 'qz-ccap-417',
  topic: 'claude',
  q: '[Models & Context] A company must classify 10 million short support tickets per month into a fixed set of categories. Cost and throughput matter most. Which model is the best default choice?',
  options: [
    'A top-tier large model for every ticket',
    'No model, use manual review only',
    'A small fast model such as Haiku 3.5, escalating only low-confidence cases',
    'The most expensive model available'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Phân loại khối lượng lớn, tác vụ đơn giản → model nhỏ nhanh (Haiku 3.5), chỉ escalate ca độ tin cậy thấp.

### Vì sao đáp án đúng
Phân loại vào tập nhãn cố định là việc đơn giản, lặp nhiều; model nhỏ/nhanh tối ưu chi phí và throughput. Chỉ đẩy ca mơ hồ (low confidence) lên model mạnh là "cascade" (thác tầng) — rẻ mà vẫn chính xác.

### Vì sao từng phương án sai
- **Model lớn cho mọi ticket:** trả giá cao cho việc dễ.
- **Không model, thủ công:** không scale nổi 10 triệu.
- **Model đắt nhất:** tốn kém tối đa, không cần thiết.

> Nguyên tắc: việc đơn giản, lặp nhiều → model nhỏ; chỉ escalate ca khó.`
},
{
  id: 'qz-ccap-418',
  topic: 'claude',
  q: '[Models & Context] Prompt caching has a 5-minute TTL and charges a write premium over the base input price. Which statement about the cost trade-off is correct?',
  options: [
    'The cache write premium is always worth it regardless of reuse',
    'The cache pays off when the same prefix is reused many times within the 5-minute TTL, because cache reads are cheaper than recomputing the prefix',
    'Cache writes are free',
    'TTL has no effect on cost'
  ],
  answer: 1,
  explain: `**Tóm tắt:** Cache ghi có phụ phí (write đắt hơn input thường), TTL 5 phút. Nếu prefix được dùng lại nhiều lần trong 5 phút, chi phí đọc cache (rẻ) nhiều lần sẽ bù lại write đắt.

### Vì sao đáp án đúng
Ghi cache có phụ phí (write premium), và TTL là 5 phút cố định. Nhưng nếu prefix được dùng lại rất nhiều lần trong cửa sổ TTL, chi phí đọc cache (rẻ hơn input thường) nhiều lần sẽ bù lại write premium. Bài toán là tần suất tái sử dụng trong cửa sổ TTL.

### Vì sao từng phương án sai
- **Luôn đáng giá:** sai, nếu ít dùng lại thì write premium không bù.
- **Ghi cache miễn phí:** sai, có phụ phí write.
- **TTL không ảnh hưởng cost:** sai, TTL quyết định cửa sổ tái sử dụng.

> Nguyên tắc: Prompt caching chỉ đáng khi prefix ổn định và được tái sử dụng nhiều lần trong TTL 5 phút.`
},
{
  id: 'qz-ccap-419',
  topic: 'claude',
  multi: true,
  q: '[Models & Context] Which two are good prompt-engineering practices for reliable Claude outputs? (Choose 2)',
  options: [
    'State a clear role and task, and separate instructions from data with delimiters',
    'Provide a few well-chosen examples (few-shot) for the target format',
    'Make the prompt as vague as possible',
    'Put contradictory instructions to test the model',
    'Hide the output format from the model'
  ],
  answer: [0, 1],
  explain: `**Tóm tắt:** Nêu rõ vai trò/nhiệm vụ và tách chỉ dẫn khỏi dữ liệu bằng delimiter, cộng few-shot ví dụ đúng định dạng.

### Vì sao đáp án đúng
(1) **Rõ vai trò + delimiter** (ký hiệu phân tách) giúp model phân biệt chỉ dẫn và dữ liệu, giảm nhầm lẫn và prompt injection. (2) **Few-shot** (vài ví dụ mẫu) cho model thấy đúng định dạng mong đợi, tăng độ ổn định.

### Vì sao từng phương án sai
- **Prompt mơ hồ:** tăng suy diễn sai.
- **Chỉ dẫn mâu thuẫn:** gây hành vi thất thường.
- **Giấu định dạng output:** model không biết cần gì, dễ sai.

> Nguyên tắc: rõ ràng + delimiter + ví dụ là ba thói quen prompt cơ bản.`
},
{
  id: 'qz-ccap-420',
  topic: 'claude',
  q: '[Models & Context] A team wants Claude to read photographed receipts and extract totals together with a text question. Which capability enables this?',
  options: [
    'Convert the image to CSV first, then send only text',
    'Use a text-only model with no image support',
    'Send image blocks (base64 or URL) in the messages alongside the text question',
    'Ask the model to guess the total from the file name'
  ],
  answer: 2,
  explain: `**Tóm tắt:** Gửi image block (base64 hoặc URL) trong messages cùng câu hỏi text để Claude đọc ảnh.

### Vì sao đáp án đúng
Claude hỗ trợ đầu vào đa phương thức: đặt image block (dữ liệu base64 hoặc URL) vào nội dung message cùng phần text. Model "nhìn" ảnh hoá đơn và trả lời câu hỏi. Đây là "vision" (thị giác) input.

### Vì sao từng phương án sai
- **Chuyển ảnh sang CSV trước:** không khả thi cho ảnh chụp, mất thông tin.
- **Model text-only:** không đọc được ảnh.
- **Đoán từ tên file:** vô nghĩa, không trích xuất được.

> Nguyên tắc: muốn đọc ảnh, gửi image block trong message, không "mô tả" ảnh bằng lời.`
}
// qtool append point
);
