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
// qtool append point
);