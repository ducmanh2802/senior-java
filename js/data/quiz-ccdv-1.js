/* CCDV-F (Claude Certified Developer – Foundations) practice questions, pool 2 (topic claude, tag "[Domain]" = domains of exam "claude" in js/data/exams.js): task T2299. Format: AGENTS.md muc 4 (QUIZ). */
(window.QUIZ = window.QUIZ || []).push(
// qtool append point
{
  id: 'qz-ccdv-001',
  topic: 'claude',
  q: '[Applications] A Java backend calls the Claude Messages API, but Claude ignores the long system instruction on every turn. The system text is placed inside a user message instead of the top-level system field. What is the cause and the fix?',
  options: [
    'The API key lacks permission to read system instructions; request a new key from Anthropic Console.',
    'Messages API is stateless: the system field must be sent as a top-level field in every request, not inside the messages array.',
    'System instructions only work with Claude Opus 5.5; switch the model.',
    'The system text is too long; shorten it below 1000 tokens.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Messages API là stateless: mỗi request độc lập, và hướng dẫn hệ thống phải đi trong trường system ở cấp cao nhất (top-level) của request, gửi lại mỗi lượt. Nếu đặt system vào một message (ví dụ role user), Claude coi đó là nội dung của người dùng, không phải lệnh hệ thống.

### Vì sao các phương án còn lại sai
- **API key không có quyền:** lỗi phân quyền thường hiện diện dưới dạng 401 hoặc 403, không phải là bỏ qua system.
- **Chỉ Opus 5.5:** trường system hoạt động trên các model hiện hành, không giới hạn ở Opus.
- **Rút ngắn dưới 1000 token:** vấn đề ở đây là vị trí gửi, không phải do độ dài; hệ thống không có giới hạn cứng 1000 token cho system (dù prompt quá dài vẫn có thể bị cắt theo context window).

> Mẹo senior: Với system prompt dài dùng lại nhiều lần, hãy gắn trường cache_control kiểu ephemeral vào phần system để đọc cache sau này với chi phí thấp hơn.`
},
{
  id: 'qz-ccdv-002',
  topic: 'claude',
  multi: true,
  q: '[Applications] A coding assistant must call a function whenever the user asks about code, and must never reply with plain text. Which tool_choice values require Claude to call at least one tool? (Choose 2)',
  options: [
    'auto — Claude decides whether to use a tool or answer directly.',
    'required — Claude must call at least one tool before answering.',
    'any — Claude must use tools, with freedom in how many and which ones.',
    'none — no tools are allowed.'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phương án 2 và 3.** required và any đều buộc Claude gọi ít nhất một công cụ trước khi trả lời, phù hợp trợ lý lập trình không được phép trả lời văn bản thuần khi người dùng hỏi về code. auto (mặc định) để Claude tự quyết định dùng công cụ hay không, và none tắt hoàn toàn công cụ.

### Vì sao các phương án còn lại sai
- **auto:** không bắt buộc gọi công cụ; Claude có thể trả lời trực tiếp.
- **none:** cấm gọi công cụ, trái với yêu cầu.`
},
{
  id: 'qz-ccdv-003',
  topic: 'claude',
  q: '[Applications] You define a tool named extract_invoice with an input_schema in JSON Schema. Which practice helps Claude call the tool correctly and produce fewer malformed arguments?',
  options: [
    'Write long free-text descriptions for every argument and mark all fields as required.',
    'Put example JSON inputs inside each field description.',
    'Use a clear name and description, typed properties in input_schema, and list only truly required fields in required; keep descriptions short.',
    'Use long sentence-like argument names so Claude understands them better.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Định nghĩa công cụ nên có tên ngắn gọn, mô tả mục đích, kiểu dữ liệu cho từng trường trong input_schema, và chỉ những trường thực sự bắt buộc trong mảng required. Mô tả ngắn và rõ ràng giúp Claude chọn đúng công cụ và truyền đối số chính xác; đánh dấu tất cả bắt buộc hay nhét ví dụ JSON vào mô tả dễ gây nhầm lẫn.

### Vì sao các phương án còn lại sai
- **Mô tả dài và required tất cả:** giảm sự linh hoạt, bắt Claude truyền trường dù không có dữ liệu.
- **Ví dụ JSON trong mô tả:** mô tả dùng để giải thích ý nghĩa trường, không phải để chứa mẫu dữ liệu.
- **Tên trường dài kiểu câu:** nên dùng tên ngắn, viết theo quy ước (camelCase), dễ đọc.`
},
{
  id: 'qz-ccdv-004',
  topic: 'claude',
  multi: true,
  q: '[Applications] You stream a Messages API response and show text to the user as it is generated. Which stream events appear during a normal text response? (Choose 2)',
  options: [
    'message_start — opens the response and carries initial message metadata.',
    'content_block_delta with type text_delta — carries the next piece of generated text.',
    'An email is sent to the API key owner with the result.',
    'A database commit is made after each token.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** Trong dòng sự kiện (server-sent events), message_start mở đầu phản hồi, và content_block_delta kiểu text_delta mang đoạn văn bản vừa sinh để client hiển thị dần dần. message_delta chứa lý do dừng và thống kê token, còn content_block_stop đóng một khối nội dung.

### Vì sao các phương án còn lại sai
- **Email đến chủ sở hữu API key:** API không gửi email cho mỗi phản hồi.
- **Commit cơ sở dữ liệu sau mỗi token:** đây là việc phía client tự quyết định lưu trữ, không phải sự kiện của API.`
},
{
  id: 'qz-ccdv-005',
  topic: 'claude',
  q: '[Applications] When Claude uses thinking mode, what appears in the stream before the final answer?',
  options: [
    'Only the final answer; thinking is completely hidden.',
    'The thinking trace is sent to the email of the API key owner.',
    'content_block_delta with type thinking_delta carrying reasoning tokens.',
    'Thinking is delivered in a separate HTTP response.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Khi bật tư duy (thinking), dòng sự kiện chứa content_block_delta kiểu thinking_delta trước đáp án cuối cùng. Các token tư duy cũng được tính vào đầu ra và bị tính phí theo taux đầu ra; chúng không được gửi qua email hay trong phản hồi HTTP riêng.`
},
{
  id: 'qz-ccdv-006',
  topic: 'claude',
  q: '[Applications] Before enabling prompt caching, you want to estimate how many tokens a long document will consume. Which API endpoint should you call?',
  options: [
    'POST /v1/messages with stream set to true.',
    'GET /v1/models to list model context limits.',
    'GET /v1/usage to check account-level token usage.',
    'POST /v1/count_tokens with the document text.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Endpoint count_tokens cho phép ước lượng số token đầu vào của văn bản trước khi gửi request thật, hữu ích để tính chi phí lưu đệm (prompt caching). /v1/messages gửi một request thật, /v1/models liệt kê model, và /v1/usage chỉ thống kê mức sử dụng của tài khoản, không phải đếm văn bản cụ thể.`
},
{
  id: 'qz-ccdv-007',
  topic: 'claude',
  q: '[Applications] A legal app sends the same 100-page contract plus different questions in each turn. How does prompt caching reduce cost and latency?',
  options: [
    'The shared prefix (the contract) is cached once with cache_control type ephemeral; later turns read it at the cheaper cache_read_input_tokens rate.',
    'Only the first turn is cached; later turns are billed at full price.',
    'Caching is automatic for every request; no code change is needed.',
    'Cached prompts never expire, so the contract stays in cache forever.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Phần dùng chung (hợp đồng) được gắn cache_control kiểu ephemeral để Claude lưu tiền tố vào bộ nhớ đệm; các lượt sau đọc từ cache với giá cache_read_input_tokens rẻ hơn cache_creation_input_tokens và trả về nhanh hơn. Cần thiết kế prompt để phần dùng chung đứng trước, và cache có thời gian hết hạn (khoảng 5 phút, gia hạn khi dùng), không giữ vĩnh viễn.

### Vì sao các phương án còn lại sai
- **Chỉ lượt đầu được lưu:** sai, các lượt sau đọc cache rẻ hơn.
- **Tự động cho mọi request:** không tự động; phải thiết kế tiền tố dùng chung và gắn cache_control.
- **Không bao giờ hết hạn:** bộ nhớ đệm bị xóa sau khoảng thời gian không hoạt động, không vĩnh viễn.`
},
{
  id: 'qz-ccdv-008',
  topic: 'claude',
  multi: true,
  q: '[Applications] You need to summarize 50000 documents and do not need results immediately. Which statements about the Batch API are true? (Choose 2)',
  options: [
    'It is about 50 percent cheaper than the regular Messages API.',
    'Results arrive in real time, faster than streaming.',
    'Each request in the JSONL file can carry a custom_id to match results to documents.',
    'There are no rate limits for batch requests.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** Batch API cho phép tải lên một file JSONL chứa nhiều request (mỗi request có custom_id để ánh xạ kết quả về tài liệu), xử lý lượng lớn ngoài giờ cao điểm với mức giá thấp hơn khoảng 50% so với Messages API thông thường; phù hợp tác vụ không cần kết quả ngay.

### Vì sao các phương án còn lại sai
- **Kết quả real-time nhanh hơn streaming:** Batch xử lý bất đồng bộ, kết quả đến sau một khoảng thời gian, không phải ngay lập tức.
- **Không có giới hạn tốc độ:** Batch vẫn bị giới hạn tốc độ (rate limit) của tài khoản.`
},
{
  id: 'qz-ccdv-009',
  topic: 'claude',
  q: '[Applications] The app receives HTTP 429 with header retry-after: 60. What should the Java client do?',
  options: [
    'Retry immediately in a tight loop until the request succeeds.',
    'Switch to a different API key to bypass the limit.',
    'Wait at least 60 seconds before retrying, slow down the sending rate, and use exponential backoff with jitter.',
    'Ignore the header and return a cached response forever.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** HTTP 429 có nghĩa là vượt giới hạn tốc độ (rate limit), và header retry-after cho thời gian chờ tối thiểu tính bằng giây. Khách hàng Java phải chờ, giảm tốc độ gửi, và dùng backoff lũy thừa có jitter để tránh hiện tượng thundering herd (nhiều client cùng gọi lại cùng lúc).

### Vì sao các phương án còn lại sai
- **Gọi lại ngay lập tức trong vòng lặp chặt:** làm tăng tải và có thể bị chặn thêm.
- **Đổi API key:** không phải giải pháp bền vững và vi phạm quy định sử dụng.
- **Bỏ qua header và dùng cache vĩnh viễn:** cache chỉ nên là thay thế tạm thời, không phải vĩnh viễn.`
},
{
  id: 'qz-ccdv-010',
  topic: 'claude',
  q: '[Applications] A request returns HTTP 400 with message unknown parameter: temperature. What is the likely reason on the newest Claude models?',
  options: [
    'The API key is expired; renew it in Anthropic Console.',
    'The request body is too large; compress the messages.',
    'The model name is wrong; use Claude 3 instead.',
    'Newer models reject sampling parameters such as temperature, top_p, and top_k; remove them.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Trên các model mới, gửi các tham số lấy mẫu (sampling parameters) như temperature, top_p, top_k thường gây lỗi 400 unknown parameter. Cách sửa là xoá các tham số đó và để API dùng giá trị mặc định, hoặc dùng thinking để kiểm soát hành vi. Lỗi 400 này không phải do khóa API (thường là 401), kích thước request (413), hay tên model sai (404).`
},
{
  id: 'qz-ccdv-011',
  topic: 'claude',
  q: '[Applications] A Messages API request works locally but fails in production with max_tokens is required. What does max_tokens control?',
  options: [
    'The maximum number of output tokens Claude may generate in one response.',
    'The maximum number of input tokens from the user.',
    'The total token limit of the whole conversation.',
    'The number of tokens cached for prompt caching.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** max_tokens là trường bắt buộc trong Messages API, kiểm soát trần số token đầu ra của một phản hồi. Nếu Claude chạm trần, phản hồi dừng lại giữa chừng với stop_reason là max_tokens, trong khi HTTP vẫn là 200 (request thành công nhưng nội dung bị cắt). Nó không giới hạn input, tổng hội thoại, hay số token lưu đệm (caching dùng cache_control riêng).`
},
{
  id: 'qz-ccdv-012',
  topic: 'claude',
  multi: true,
  q: '[Applications] You send images to Claude in the Messages API. Which image media types are supported? (Choose 2)',
  options: [
    'image/png',
    'image/jpeg',
    'image/bmp',
    'image/webp'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: phương án 1 và 4.** Hình ảnh được mã hóa base64, đặt vào trường source.data cùng media_type (image/png, image/jpeg, image/gif, image/webp), không kèm tiền tố data:URL. Claude không tự tải hình ảnh từ URL bên ngoài.

### Vì sao các phương án còn lại sai
- **image/bmp:** không phải loại nội dung hình ảnh được liệt kê trong tài liệu Messages API.
- **URL bên ngoài và văn bản mô tả:** Claude không tự fetch URL, và không nhận ảnh dưới dạng văn bản mô tả thay cho dữ liệu nhị phân.`
},
{
  id: 'qz-ccdv-013',
  topic: 'claude',
  q: '[Applications] You need Claude to read a multi-page PDF file. What is the supported way?',
  options: [
    'Upload the PDF to a public website and give Claude the URL.',
    'Convert every page to plain text yourself and paste it into the prompt.',
    'Send the PDF as base64 in source.data with media_type application/pdf; Claude processes each page.',
    'Claude does not support PDF input at all.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Claude hỗ trợ tài liệu (ví dụ PDF) dưới dạng base64 trong trường source.data với media_type application/pdf, và mô hình xử lý từng trang. Không dùng URL công khai (mô hình không tự tải URL), không bắt buộc chuyển sang văn bản trước, và PDF là một định dạng được hỗ trợ.`
},
{
  id: 'qz-ccdv-014',
  topic: 'claude',
  q: '[Applications] You want Claude to cite sources when answering from documents or tool results. What should you enable?',
  options: [
    'thinking with type enabled to force reasoning before answering.',
    'citations with enabled set to true, so Claude returns citation markers linked to sources.',
    'stream set to true to receive citations faster.',
    'tool_choice set to required to force source lookup.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Bật tùy chọn citations (enabled: true) giúp Claude trích dẫn nguồn bằng các dấu đánh dấu dẫn đến đoạn hoặc trang nguồn khi câu trả lời dựa trên tài liệu hoặc kết quả công cụ. thinking dùng để suy luận, stream chỉ thay đổi cách nhận phản hồi, và tool_choice buộc gọi công cụ chứ không tạo trích dẫn tự động.`
},
{
  id: 'qz-ccdv-015',
  topic: 'claude',
  q: '[Applications] You run a multi-tenant Java service and want rate-limit attribution per end user. Which Messages API field helps?',
  options: [
    'Add the user name inside every user message text.',
    'Use a different API key per tenant.',
    'Set the system prompt to the user ID.',
    'Use metadata with client_id and user_id to tag requests for tracking and rate-limit attribution.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Trường metadata (client_id, user_id) gắn thẻ request giúp theo dõi và phân bổ giới hạn tốc độ theo người dùng cuối mà không ảnh hưởng nội dung mô hình.

### Vì sao các phương án còn lại sai
- **Tên người dùng trong tin nhắn:** làm ô nhầm prompt và không dùng cho phân bổ giới hạn tốc độ.
- **API key khác cho từng khách hàng:** khó quản lý và giới hạn được tính theo tài khoản, không phải theo từng khóa do khách hàng tự tạo.
- **System prompt là mã người dùng:** system dùng để định hướng hành vi mô hình, không dùng để gắn mã định danh người dùng.`
},
{
  id: 'qz-ccdv-016',
  topic: 'claude',
  q: '[Model Selection] A startup needs to classify thousands of short support tickets per hour at the lowest cost. Which Claude model is typically the cheapest per token?',
  options: [
    'Haiku 5.5 — fastest and cheapest, suited for simple high-volume tasks.',
    'Opus 5.5 — best for complex reasoning, higher price.',
    'Sonnet 5.5 — balanced for coding and general tasks.',
    'Fable 5.2 — most capable, highest price.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Theo mức giá hiện tại (tính theo triệu token, MTok), Haiku 5.5 là rẻ nhất ($0.10 MTok đầu vào, $0.50 MTok đầu ra) và nhanh nhất, phù hợp tác vụ đơn giản có lượng lớn như phân loại vé hỗ trợ. Opus, Sonnet và Fable đắt hơn và dành cho các tác vụ phức tạp hơn. Quy tắc là chọn model rẻ nhất vẫn đáp ứng yêu cầu chất lượng.`
},
{
  id: 'qz-ccdv-017',
  topic: 'claude',
  q: '[Model Selection] According to current Anthropic pricing, which model is the newest and most capable but also the most expensive per token?',
  options: [
    'Haiku 5.5 at $0.10 input and $0.50 output per MTok.',
    'Sonnet 5.5 at $2 input and $10 output per MTok.',
    'Opus 5.5 at $4 input and $20 output per MTok.',
    'Fable 5.2 at $8 input and $40 output per MTok.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Fable 5.2 là model mới nhất và mạnh nhất trong họ model hiện hành, với mức giá cao nhất ($8 MTok đầu vào, $40 MTok đầu ra). Haiku rẻ nhất, Opus và Sonnet nằm giữa. Model đắt nhất không phải lúc nào cũng là lựa chọn tốt nhất; hãy khớp độ khó của tác vụ với model.`
},
{
  id: 'qz-ccdv-018',
  topic: 'claude',
  q: '[Model Selection] A chatbot must reply within milliseconds to simple greetings and FAQ questions. Which model fits best?',
  options: [
    'Opus 5.5 — strongest reasoning but slower and costlier.',
    'Haiku 5.5 — fastest, cheapest, for simple low-latency tasks.',
    'Sonnet 5.5 — balanced general model.',
    'Fable 5.2 — for the hardest reasoning, highest cost.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Trả lời chào hỏi và câu hỏi thường gặp là tác vụ đơn giản cần độ trễ thấp và chi phí thấp, nên chọn Haiku 5.5. Opus và Fable dành cho lý luận phức tạp, Sonnet cân bằng cho tác vụ chung; dùng chúng cho câu chào hỏi là tốn kém không cần thiết.`
},
{
  id: 'qz-ccdv-019',
  topic: 'claude',
  q: '[Model Selection] You need Claude to solve a hard multi-step math problem. Which thinking configuration should you use?',
  options: [
    'Disable thinking to answer faster.',
    'thinking with type enabled and a suitable budget_tokens for reasoning.',
    'Set temperature to 0 to force correct math.',
    'Use streaming only; thinking is not available via the API.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Bài toán khó, nhiều bước cần tư duy sâu: bật thinking kiểu enabled và gán budget_tokens đủ lớn để Claude suy luận từng bước trước khi trả lời. Token tư duy cũng tính vào đầu ra và bị tính phí. Tắt thinking làm kém hơn bài khó, temperature không làm toán đúng hơn, và thinking có sẵn qua API (không chỉ riêng streaming).`
},
{
  id: 'qz-ccdv-020',
  topic: 'claude',
  q: '[Model Selection] You do not know whether a query needs deep reasoning. What does thinking with type adaptive do?',
  options: [
    'Always uses the maximum thinking budget for every request.',
    'Lets Claude decide automatically whether and how much to think based on the query.',
    'Disables thinking and answers instantly.',
    'Returns only the thinking trace, never the final answer.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** adaptive để Claude tự quyết định mức suy luận phù hợp cho mỗi câu hỏi, cân bằng giữa chất lượng, độ trễ và chi phí. Nó không nhất thiết dùng ngân sách tối đa mọi lúc, cũng không tắt hoàn toàn hay chỉ trả về dấu vết tư duy.`
},
{
  id: 'qz-ccdv-021',
  topic: 'claude',
  q: '[Model Selection] You want deterministic outputs for extracting invoice fields. Which temperature setting is appropriate?',
  options: [
    'temperature 1 (default) for maximum creativity.',
    'temperature above 1 to extract more fields.',
    'Temperature has no effect on extraction quality.',
    'temperature close to 0 for more deterministic, repeatable outputs.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Temperature điều khiển mức độ ngẫu nhiên khi chọn từ; giá trị gần 0 tạo ra đầu ra xác định, lặp lại nhiều lần với cùng input, phù hợp trích xuất và phân loại. Mặc định là 1 (văn bản sáng tạo hơn). Temperature không tạo thêm trường dữ liệu, và không phải hoàn toàn không có hiệu ứng. Lưu ý: một số model mới từ chối tham số temperature (lỗi 400), cần kiểm tra tài liệu model hiện hành.`
},
{
  id: 'qz-ccdv-022',
  topic: 'claude',
  q: '[Model Selection] What do top_p and top_k control during token sampling?',
  options: [
    'The maximum number of tokens in the output; use max_tokens instead.',
    'The randomness and diversity of word choice: top_k limits the candidate pool, and top_p limits by cumulative probability.',
    'The price per million tokens.',
    'Whether Claude uses tools or not.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** top_k giới hạn số lượng từ ứng cử chọn hàng đầu; top_p chọn nhóm nhỏ nhất các từ mà xác suất tích lũy đạt ngưỡng p; cùng nhau chúng điều khiển độ đa dạng và ngẫu nhiên của từ được chọn tiếp theo. Chúng không giới hạn số lượng token đầu ra (dùng max_tokens), không ảnh hưởng giá, và không liên quan đến việc dùng công cụ.`
},
{
  id: 'qz-ccdv-023',
  topic: 'claude',
  q: '[Model Selection] You try to prefill Claude\'s answer by sending an assistant message with the first sentence, but the API returns HTTP 400. What is the reason on newer models?',
  options: [
    'Your API key lacks prefill permission.',
    'The assistant message must come before all user messages.',
    'Prefill only works with streaming enabled.',
    'Prefill is not supported on newer models; remove prefill and use a user turn or thinking instead.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** Trên các model mới, prefill (gửi trước phần đầu câu trả lời của assistant) bị lỗi 400. Cách xử lý là xoá phần prefill, cấu lại thành tin nhắn người dùng, hoặc dùng thinking. Không phải do quyền khóa API, thứ tự tin nhắn, hay bật streaming.`
},
{
  id: 'qz-ccdv-024',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Claude\'s answer is cut off mid-sentence with stop_reason max_tokens. What is true? (Choose 2)',
  options: [
    'The request succeeded with HTTP 200, but the content is truncated.',
    'Increase max_tokens within the model limit, or ask for a shorter answer.',
    'Retrying the same request will complete the sentence automatically.',
    'Reducing temperature makes Claude write fewer words and avoids truncation.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** max_tokens là trần số token đầu ra. Khi chạm trần, API dừng sinh và trả stop_reason là max_tokens, trong đó HTTP vẫn là 200 (request thành công nhưng nội dung bị cắt). Cách khắc phục: tăng max_tokens trong giới hạn của model, hoặc yêu cầu câu trả lời ngắn gọn hơn.

### Vì sao các phương án còn lại sai
- **Gọi lại cùng request:** request đó không phải lỗi tạm thời; gọi lại y hệt sẽ bị cắt lại ở cùng chỗ.
- **Giảm temperature:** temperature kiểm soát ngẫu nhiên, không kiểm soát độ dài, nên không ngăn bị cắt do max_tokens.`
},
{
  id: 'qz-ccdv-025',
  topic: 'claude',
  q: '[Model Selection] Your app processes both simple FAQ and complex legal analysis. What is a good cost-control strategy?',
  options: [
    'Use Opus 5.5 for every request to guarantee quality.',
    'Route simple FAQ to Haiku 5.5 and complex legal analysis to Opus 5.5 or Fable 5.2 with thinking when needed.',
    'Enable thinking with the maximum budget on every request.',
    'Always use the most expensive model; price does not affect latency.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Phân loại tác vụ rồi chọn model phù hợp (triage): Haiku cho câu hỏi thường gặp đơn giản, nhanh và rẻ; Opus hoặc Fable kèm thinking cho phân tích pháp lý phức tạp. Dùng model đắt nhất cho mọi yêu cầu gây tốn chi phí và độ trễ không cần thiết; bật thinking tối đa mọi lúc cũng tốn kém và chậm.`
},
{
  id: 'qz-ccdv-026',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Your users upload images and PDFs alongside text. Which input types do current Claude models support? (Choose 2)',
  options: [
    'Text and images.',
    'PDF documents as base64.',
    'Excel spreadsheets as native tables.',
    'Audio files.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** Các model Claude hiện hành hỗ trợ nhập văn bản, hình ảnh (mã hóa base64 với media_type như image/png, image/jpeg) và tài liệu (ví dụ PDF với media_type application/pdf). Chúng không nhận bảng Excel gốc hay tệp âm thanh qua Messages API.`
},
{
  id: 'qz-ccdv-027',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Which statements about thinking tokens are true? (Choose 2)',
  options: [
    'Thinking tokens count toward the output token total.',
    'Thinking is billed at the output token rate.',
    'Thinking is completely free.',
    'Thinking costs twice the input rate.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** Token dành cho tư duy (thinking tokens) được tính vào tổng token đầu ra và bị tính phí theo mức giá đầu ra, chứ không phải miễn phí hay tính theo gấp đôi mức giá đầu vào. Nếu không thiết lập budget_tokens, điều đó không có nghĩa là miễn phí; đó là cách quy định ngân sách tư duy khi bạn chọn kiểu enabled.`
},
{
  id: 'qz-ccdv-028',
  topic: 'claude',
  q: '[Model Selection] You estimate 10 million input tokens and 2 million output tokens on Haiku 5.5. What is the approximate cost?',
  options: [
    '10 x 0.10 + 2 x 0.50 = 2.00 USD.',
    '2000 USD.',
    '0.20 USD.',
    'Free for the first month.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Haiku 5.5 giá $0.10 triệu token đầu vào và $0.50 triệu token đầu ra. Tính: 10 × 0.10 = 1.00 USD cho đầu vào, 2 × 0.50 = 1.00 USD cho đầu ra, tổng khoảng 2.00 USD. Đây là ước lượng trước thuế và giảm giá (ví dụ Batch API rẻ hơn khoảng 50%).`
},
{
  id: 'qz-ccdv-029',
  topic: 'claude',
  q: '[Model Selection] You want Claude to stop generating as soon as it prints a JSON code-fence closing marker. Which parameter controls this?',
  options: [
    'max_tokens, which limits total output length only.',
    'temperature, which controls randomness, not stop points.',
    'tool_choice, which controls tool usage, not text stopping.',
    'stop_sequences, a list of strings that stop generation when encountered.'
  ],
  answer: 3,
  explain: `**Đáp án đúng: phương án 4.** stop_sequences nhận một mảng các chuỗi; Claude dừng sinh ngay khi gặp một chuỗi trong danh sách, và chuỗi đó không xuất hiện trong kết quả trả về. max_tokens chỉ trần độ dài, temperature điều khiển ngẫu nhiên, và tool_choice điều khiển việc gọi công cụ.`
},
{
  id: 'qz-ccdv-030',
  topic: 'claude',
  q: '[Model Selection] A production Java integration pins a specific model ID (for example claude-<name>-<date>). What happens when Anthropic retires that model version?',
  options: [
    'Claude automatically switches to the newest model without changes.',
    'Requests to the retired model ID fail; update to a supported model ID and retest.',
    'The API key is disabled until you contact support.',
    'Old model IDs keep working forever at the same price.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi một phiên bản model bị ngừng hỗ trợ, các request dùng ID đó sẽ lỗi (thường là 404). Nhóm phát triển cần cập nhật sang ID model được hỗ trợ mới và retest, vì hành vi, giá và giới hạn có thể thay đổi. API không tự chuyển model, không khóa khóa API, và ID cũ không giữ vĩnh viễn.`
},
{
  id: 'qz-ccdv-031',
  topic: 'claude',
  q: '[Applications] Your Java backend streams a Messages API response that includes a tool_use block. The stream parser receives a content_block_start event with type tool_use. What must the backend do next?',
  options: [
    'Immediately send the tool result in the same HTTP request.',
    'Execute the named tool, then send a new request with the tool_result in a user message.',
    'Ignore the tool_use and wait for the final text delta.',
    'Close the stream and retry the request without tools.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi streaming và nhận content_block_start kiểu tool_use, backend phải thực thi công cụ được yêu cầu, sau đó gửi một request Messages API mới (không phải cùng request) chứa tin nhắn role user với nội dung tool_result (có tool_use_id khớp) để tiếp tục vòng lặp. Tool result không gửi trong cùng request streaming, và không được bỏ qua hay đóng stream.`
},
{
  id: 'qz-ccdv-032',
  topic: 'claude',
  q: '[Applications] You enable server-side fallback by adding the beta header "fallbacks": "default" to your Messages API request. What does this do?',
  options: [
    'Automatically retries the request on a different model if the primary model returns an error.',
    'Allows Claude to use a simpler model for easy sub-tasks without additional code.',
    'Falls back to a cached response if the same prompt was seen before.',
    'Enables automatic retry with exponential backoff inside the API.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Header beta "fallbacks": "default" bật tính năng server-side fallback: nếu model chính (ví dụ Opus) trả về lỗi tạm thời (overloaded, rate limit), API tự động chuyển sang model dự phòng (thường là Sonnet hoặc Haiku) và trả về phản hồi từ model đó. Điều này giảm lỗi 529/429 seen by client mà không cần code retry phía client. Không liên quan đến cached response, sub-tasks đơn giản, hay retry lũy thừa nội bộ.`
},
{
  id: 'qz-ccdv-033',
  topic: 'claude',
  multi: true,
  q: '[Applications] Which statements about the Count Tokens endpoint (POST /v1/count_tokens) are true? (Choose 2)',
  options: [
    'It returns the exact token count for a given text using the tokenizer of the specified model.',
    'It charges the same rate as a Messages API call with the same input.',
    'It helps estimate prompt caching costs before sending the full request.',
    'It requires an API key with admin permissions.'
  ],
  answer: [0, 2],
explain: `**Đáp án đúng: phương án 1 và 3.** Count Tokens endpoint đếm chính xác token theo tokenizer của model được chỉ định, giúp ước lượng chi phí (kể cả chi phí prompt caching với cache_creation_input_tokens) trước khi gọi Messages API tốn kém. Nó không tính phí như một lời gọi Messages API (thường miễn phí hoặc rất rẻ), và không yêu cầu khóa API admin — khóa thông thường có quyền truy cập là đủ.

### Vì sao các phương án còn lại sai
- **Tính phí như Messages API:** endpoint đếm token thường không tính phí hoặc giá cực thấp, không phải mức giá đầy đủ.
- **Yêu cầu khóa admin:** không cần quyền đặc biệt; bất kỳ khóa API hợp lệ nào cũng gọi được.`
},
{
  id: 'qz-ccdv-034',
  topic: 'claude',
  q: '[Applications] A Message Batch with 10,000 requests finishes with processing_status "ended". How do you retrieve the results?',
  options: [
    'Poll GET /v1/message_batches/{id} until status is succeeded, then download the results file from the results_url.',
    'Results are automatically emailed to the API key owner.',
    'Each result is pushed to a webhook URL you provided in the batch request.',
    'Results appear in the same response as the batch creation call.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Sau khi tạo batch, bạn poll GET /v1/message_batches/{id} cho đến khi processing_status là ended (hoặc succeeded). Khi đã xong, trường results_url trong response cung cấp liên kết tải file JSONL kết quả (mỗi dòng có custom_id khớp với request gốc). Kết quả không gửi qua email, webhook, hay trong response tạo batch.`
},
{
  id: 'qz-ccdv-035',
  topic: 'claude',
  multi: true,
  q: '[Applications] A user uploads a 40 MB scanned PDF (about 500 pages). What should your Java service do before sending to Messages API? (Choose 2)',
  options: [
    'Split the PDF into smaller chunks under the size limit and send multiple requests.',
    'Reject the upload with a clear error message about the file size limit.',
    'Compress the PDF to reduce base64 size, then send as a single document.',
    'Upload the PDF to a public URL and send the URL instead of base64.'
  ],
  answer: [0, 1],
explain: `**Đáp án đúng: phương án 1 và 2.** Messages API giới hạn kích thước tài liệu (khoảng 32 MB cho base64 sau mã hóa, tùy model). Với file 40 MB, bạn phải từ chối hoặc chia nhỏ (ví dụ tách trang, nén, hoặc dùng OCR trích xuất văn bản) để phù hợp giới hạn. Nén PDF có thể không đủ giảm kích thước base64 (base64 làm tăng ~33%), và Claude không tự tải PDF từ URL công khai — phải gửi dữ liệu nhị phân base64.

### Vì sao các phương án còn lại sai
- **Nén rồi gửi một lần:** base64 làm tăng dung lượng; nén PDF không đảm bảo đưa về dưới ngưỡng.
- **Gửi URL công khai:** Claude không fetch URL; phải gửi base64 trong source.data.`
},
{
  id: 'qz-ccdv-036',
  topic: 'claude',
  q: '[Applications] You attach cache_control: {type: "ephemeral"} to the end of a long system prompt (30K tokens). Later requests in the same session change only the user message. Why might cache_read_input_tokens stay zero?',
  options: [
    'The cache TTL expired (about 5 minutes of inactivity).',
    'The system prompt must be at the very beginning of the messages array, not at the end.',
    'Ephemeral cache only works for user messages, not system.',
    'You need to add cache_control to every user message as well.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Prompt cache có TTL khoảng 5 phút không hoạt động; nếu session im lặng lâu hơn, cache bị xóa và lượt sau sẽ là cache_creation_input_tokens. Vị trí system prompt ở cuối hay đầu messages không quan trọng miễn là nó là tiền tố dùng chung của toàn bộ request; ephemeral cache hoạt động cho system prompt; không cần gắn cache_control cho user message.`
},
{
  id: 'qz-ccdv-037',
  topic: 'claude',
  q: '[Applications] A legal team asks 20 questions about the same 100-page contract in one session. You set cache_control on the contract document. What happens on the 2nd through 20th turns?',
  options: [
    'Each turn incurs full input token cost because the contract is re-sent.',
    'The contract prefix is read from cache at the cheaper cache_read_input_tokens rate; only the new question incurs full input cost.',
    'Only the first turn is cached; subsequent turns are billed at double rate.',
    'The cache is invalidated after the first turn because the user message changed.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Phần dùng chung (hợp đồng) được lưu đệm một lần (cache_creation_input_tokens). Các lượt sau đọc tiền tố đó từ cache với giá cache_read_input_tokens rẻ hơn đáng kể; chỉ câu hỏi mới bị tính phí input đầy đủ. Cache không bị vô hiệu hóa chỉ vì user message thay đổi — đó chính là mục đích của prompt caching.`
},
{
  id: 'qz-ccdv-038',
  topic: 'claude',
  multi: true,
  q: '[Applications] Which statements about Web Search (server tool) vs. user-defined tools are true? (Choose 2)',
  options: [
    'Web Search is executed by Anthropic servers; user-defined tools are executed by your application.',
    'Both tool types require you to send tool_result back to the API.',
    'Web Search does not count toward your tool use rate limits.',
    'User-defined tools can return structured data; Web Search returns only unstructured text.'
  ],
  answer: [0, 2],
explain: `**Đáp án đúng: phương án 1 và 3.** Web Search là server-side tool: Anthropic thực thi tìm kiếm và trả kết quả ngay trong response (không cần bạn gửi tool_result). User-defined tools (client-side) yêu cầu ứng dụng của bạn thực thi và gửi tool_result qua request tiếp theo. Web Search có giới hạn riêng, không chia sẻ rate limit tool use của bạn. Cả hai loại đều có thể trả dữ liệu có cấu trúc (Web Search trả citation và kết quả có schema).

### Vì sao các phương án còn lại sai
- **Cả hai cần tool_result:** Web Search không cần; kết quả đã có trong response.
- **Web Search chỉ trả văn bản:** kết quả tìm kiếm có cấu trúc (title, url, snippet, citations).`
},
{
  id: 'qz-ccdv-039',
  topic: 'claude',
  q: '[Applications] You want Claude to stop generating exactly after it outputs a closing JSON brace "}". Which parameter achieves this?',
  options: [
    'max_tokens with a very small value.',
    'stop_sequences: ["}"]',
    'tool_choice: {"type": "none"}',
    'temperature: 0'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** stop_sequences nhận mảng chuỗi; khi gặp chuỗi nào trong mảng, Claude dừng sinh ngay lập tức và chuỗi dừng đó không xuất hiện trong kết quả. Dùng ["}"] để cắt ngay sau JSON. max_tokens chỉ trần độ dài, tool_choice tắt công cụ, temperature kiểm soát ngẫu nhiên — không làm dừng ở ký tự cụ thể.`
},
{
  id: 'qz-ccdv-040',
  topic: 'claude',
  q: '[Applications] Your multi-tenant Java service uses a single Anthropic API key. To attribute rate limits per end user, which request field should you populate?',
  options: [
    'system prompt with the user ID.',
    'metadata: {user_id: "...", client_id: "..."}',
    'The first user message text.',
    'A custom HTTP header X-User-ID.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Trường metadata (client_id, user_id) trong request Messages API gắn thẻ cho Anthropic theo dõi sử dụng và phân bổ giới hạn tốc độ theo người dùng cuối, mà không làm nhiễu prompt. System prompt dùng cho hành vi mô hình, user message là nội dung hội thoại, và header HTTP tùy chỉnh không được API dùng để phân bổ rate limit.`
},
{
  id: 'qz-ccdv-041',
  topic: 'claude',
  q: '[Applications] You enable citations: {enabled: true} for a document Q&A feature. What appears in the response when Claude answers from the document?',
  options: [
    'A separate citations array at the top level of the response.',
    'Citation markers (e.g., [doc_0]) inline in the text, plus a citations array in the content block.',
    'Only a footnote section at the end of the answer.',
    'A boolean flag cited: true with no source locations.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi bật citations, Claude chèn các dấu trích dẫn dạng [doc_0], [doc_1]... ngay trong văn bản trả lời (inline), và khối content block chứa mảng citations chi tiết (document index, trang, đoạn văn bản được trích dẫn). Không phải mảng riêng ở cấp cao nhất, không chỉ footnote cuối, và không chỉ cờ boolean.`
},
{
  id: 'qz-ccdv-042',
  topic: 'claude',
  multi: true,
  q: '[Applications] Which statements about thinking tokens are true? (Choose 2)',
  options: [
    'Thinking tokens are counted as output tokens and billed at the output rate.',
    'Thinking tokens are free when you use thinking: {type: "adaptive"}.',
    'You can set a budget_tokens limit to control maximum thinking cost.',
    'Thinking tokens do not appear in the usage field of the response.'
  ],
  answer: [0, 2],
explain: `**Đáp án đúng: phương án 1 và 3.** Token tư duy (thinking tokens) được tính vào tổng output tokens và tính phí theo mức giá đầu ra (không miễn phí dù dùng adaptive). Bạn kiểm soát chi phí bằng budget_tokens trong cấu hình thinking (enabled hoặc adaptive). Token tư duy xuất hiện trong usage.output_tokens (và usage.cache_creation_input_tokens nếu có caching).

### Vì sao các phương án còn lại sai
- **Miễn phí với adaptive:** adaptive chỉ để mô hình tự quyết định mức suy luận; token vẫn tính phí.
- **Không xuất hiện trong usage:** thinking tokens có trong usage.output_tokens.`
},
{
  id: 'qz-ccdv-043',
  topic: 'claude',
  q: '[Applications] Your Java client receives HTTP 429 with header retry-after: 45. What is the correct retry strategy?',
  options: [
    'Retry immediately in a loop until success.',
    'Wait 45 seconds, then retry with exponential backoff and jitter for subsequent retries.',
    'Switch to a different API key and retry immediately.',
    'Return a cached response and never retry.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Header retry-after cho biết thời gian chờ tối thiểu (giây). Client phải chờ ít nhất thời gian đó, sau đó retry với backoff lũy thừa (exponential backoff) có thêm jitter (ngẫu nhiên nhỏ) để tránh thundering herd. Retry ngay lập tức làm tràn rate limit hơn; đổi key vi phạm chính sách; không retry vĩnh viễn làm mất tính năng.`
},
{
  id: 'qz-ccdv-044',
  topic: 'claude',
  q: '[Applications] You prefill Claude\'s response by adding an assistant message with the first few words, but the API returns HTTP 400 "unknown parameter" or similar error on newer models. What is the fix?',
  options: [
    'Add a beta header to enable prefill.',
    'Move the assistant message before all user messages.',
    'Remove the prefill and restructure as a user instruction or use thinking instead.',
    'Enable streaming; prefill only works with stream=true.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Trên các model Claude mới (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.2), prefill (gửi tin nhắn assistant với nội dung đầu) không được hỗ trợ và gây lỗi 400. Cách khắc phục: xoá prefill, viết lại thành hướng dẫn trong tin nhắn user, hoặc dùng thinking để định dạng đầu ra. Không có beta header, thứ tự tin nhắn, hay streaming nào bật được prefill trên model mới.`
},
{
  id: 'qz-ccdv-045',
  topic: 'claude',
  q: '[Applications] You send an image to Claude via Messages API. What is the correct format for the image block?',
  options: [
    '{"type": "image", "source": {"type": "url", "url": "https://example.com/img.png"}}',
    '{"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "iVBORw0K..."}}',
    '{"type": "image", "source": {"type": "file", "file_path": "/tmp/img.png"}}',
    '{"type": "image", "url": "https://example.com/img.png"}'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Hình ảnh phải mã hóa base64, đặt trong source.data cùng media_type (image/png, image/jpeg, image/gif, image/webp) và type: "base64". Claude không tải ảnh từ URL (không hỗ trợ source.type: "url"), không đọc đường dẫn file local, và không nhận URL trực tiếp ở cấp cao nhất.`
},
{
  id: 'qz-ccdv-046',
  topic: 'claude',
  q: '[Applications] Your production code pins model ID "claude-opus-5-5-20251022". Six months later, requests start failing with 404. What happened and what should you do?',
  options: [
    'The API key expired; generate a new key.',
    'That model version was retired; update to a supported model ID and retest.',
    'Your account was downgraded; contact sales to restore access.',
    'The model name format changed; use "opus-5.5" without date.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Anthropic định kỳ ngừng hỗ trợ các phiên bản model có ngày (dated model IDs). Khi phiên bản bị retire, request đến ID đó trả 404. Cần cập nhật sang ID model được hỗ trợ hiện tại (có thể là bản mới hơn có ngày mới, hoặc alias như "claude-opus-5-5-latest") và chạy lại test suite vì hành vi, giá, context window có thể thay đổi. Không phải do key hết hạn, hạ cấp tài khoản, hay đổi format tên.`
},
{
  id: 'qz-ccdv-047',
  topic: 'claude',
  q: '[Agents] In a basic agent loop using the Messages API, what is the correct sequence after Claude returns a tool_use block?',
  options: [
    'Send tool_result in the same HTTP response stream.',
    'Execute the tool locally, then send a new Messages request with a user message containing tool_result.',
    'Call the tool via a separate Anthropic endpoint, then continue the stream.',
    'Ignore the tool_use and ask the user to clarify.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Vòng lặp agent cơ bản: (1) Gửi request với tools định nghĩa. (2) Nhận response có tool_use. (3) Ứng dụng thực thi công cụ cục bộ. (4) Gửi request MỚI (không phải cùng stream) với role user chứa tool_result (có tool_use_id khớp). (5) Lặp lại cho đến khi stop_reason là end_turn hoặc max_tokens. Tool result không gửi trong stream cũ, không có endpoint riêng cho tool, và không bỏ qua.`
},
{
  id: 'qz-ccdv-048',
  topic: 'claude',
  q: '[Agents] The agent response has stop_reason "pause_turn". What should your application do?',
  options: [
    'Treat it as an error and retry the request.',
    'Execute any pending tool_use blocks, send tool_result in a new request, and continue the loop.',
    'Stop the agent loop immediately; the task is complete.',
    'Send an empty user message to resume.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** pause_turn có nghĩa là Claude đã dùng xong ngân sách token hoặc thời gian cho lượt hiện tại nhưng còn tool_use chưa hoàn tất. Ứng dụng phải thực thi các tool_use đang chờ, gửi tool_result qua request mới (role user), và tiếp tục vòng lặp. Đây không phải lỗi, không phải kết thúc, và không gửi tin nhắn rỗng.`
},
{
  id: 'qz-ccdv-049',
  topic: 'claude',
  multi: true,
  q: '[Agents] Claude returns multiple tool_use blocks in a single response. Which statements are correct? (Choose 2)',
  options: [
    'Your application must execute all tool_use blocks before sending the next request.',
    'You can choose to execute only the first tool_use and ignore the rest.',
    'Each tool_use requires a separate tool_result with matching tool_use_id in the next user message.',
    'Multiple tool_use blocks are only possible with tool_choice: {"type": "any"}'
  ],
  answer: [0, 2],
explain: `**Đáp án đúng: phương án 1 và 3.** Khi Claude trả nhiều tool_use trong một lượt, ứng dụng nên thực thi tất cả (song song hoặc lần lượt), sau đó gửi một request user chứa nhiều tool_result (mỗi tool_result có tool_use_id khớp với tool_use tương ứng). Không được bỏ qua tool_use nào (Claude mong đợi kết quả cho tất cả). Multiple tool_use hoạt động với tool_choice auto (mặc định), required, any — không độc quyền cho any.

### Vì sao các phương án còn lại sai
- **Chỉ thực thi cái đầu:** làm treo agent vì Claude chờ kết quả các tool còn lại.
- **Chỉ any mới cho nhiều tool_use:** auto và required cũng có thể trả nhiều tool_use.`
},
{
  id: 'qz-ccdv-050',
  topic: 'claude',
  q: '[Agents] You want Claude to call exactly one tool per turn, never multiple. Which tool_choice setting enforces this?',
  options: [
    'tool_choice: {"type": "auto"}',
    'tool_choice: {"type": "any"}',
    'tool_choice: {"type": "tool", "name": "my_tool"}',
    'tool_choice: {"type": "required"}'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** tool_choice: {"type": "tool", "name": "my_tool"} buộc Claude gọi chính xác công cụ được chỉ định (một lần) trong lượt đó. auto cho phép gọi 0 hoặc nhiều; any buộc dùng công cụ nhưng có thể nhiều; required buộc dùng ít nhất một công cụ nhưng không giới hạn số lượng.`
},
{
  id: 'qz-ccdv-051',
  topic: 'claude',
  q: '[Agents] A user-defined tool (your code) returns HTTP 500 from an external API. What should your agent do?',
  options: [
    'Retry the same tool call immediately in a loop.',
    'Send a tool_result with is_error: true and the error details, letting Claude decide how to recover.',
    'Stop the agent loop and show the 500 error to the user.',
    'Omit the tool_result and continue with a new user message.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi tool thất bại, gửi tool_result với is_error: true và nội dung lỗi (mô tả, mã trạng thái). Claude nhận biết lỗi qua is_error và có thể thử lại, gọi tool khác, hoặc yêu cầu người dùng can thiệp. Retry ngay lập tức có thể làm tràn rate limit của API bên ngoài; dừng hẳn mất khả năng tự phục hồi; bỏ qua tool_result làm Claude mất ngữ cảnh.`
},
{
  id: 'qz-ccdv-052',
  topic: 'claude',
  q: '[Agents] When sending tool_result back to the Messages API, which field must match the original tool_use?',
  options: [
    'tool_name',
    'tool_use_id',
    'input',
    'cache_control'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Mỗi tool_result bắt buộc có tool_use_id khớp chính xác với tool_use_id trong tool_use mà Claude đã yêu cầu. Đây là khóa để Claude ghép kết quả với lời gọi đúng. tool_name không bắt buộc trong tool_result (dù có thể thêm để debug), input là tham số đầu vào của tool_use (không phải tool_result), và cache_control không liên quan.`
},
{
  id: 'qz-ccdv-053',
  topic: 'claude',
  q: '[Agents] You want to encourage Claude to use tools more aggressively for a coding agent. Which approach helps?',
  options: [
    'Set temperature to 1.5.',
    'Add more detailed tool descriptions and examples in the system prompt.',
    'Disable all tools and rely on text output.',
    'Use tool_choice: {"type": "none"} for the first turn.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Mô tả công cụ rõ ràng, cụ thể (name, description, input_schema với kiểu dữ liệu, required fields) trong system prompt và định nghĩa tool giúp Claude hiểu đúng lúc nào và cách dùng từng tool. Temperature cao làm tăng ngẫu nhiên, không làm tăng việc dùng tool; tắt tool thì không dùng được; tool_choice none cấm dùng tool.`
},
{
  id: 'qz-ccdv-054',
  topic: 'claude',
  q: '[Agents] To use an MCP connector in the Messages API, which beta header is required?',
  options: [
    'anthropic-beta: mcp-2025-06-18',
    'anthropic-beta: prompt-caching-2024-07-31',
    'anthropic-beta: messages-2023-12-15',
    'anthropic-beta: tools-2024-04-04'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Kết nối MCP (Model Context Protocol) qua Messages API yêu cầu header beta "anthropic-beta: mcp-2025-06-18" (hoặc phiên bản mới hơn theo tài liệu). Các beta header khác: prompt-caching cho caching, messages cho API phiên bản, tools cho công cụ — không bật MCP.`
},
{
  id: 'qz-ccdv-055',
  topic: 'claude',
  multi: true,
  q: '[Agents] Which statements about MCP connectors in the Messages API are true? (Choose 2)',
  options: [
    'MCP connectors let Claude call external tools hosted on MCP servers without your application implementing each tool.',
    'You must still define each MCP tool in the tools array of the request.',
    'MCP connectors support reading resources and prompting templates from the MCP server.',
    'MCP connectors work without any beta header.'
  ],
  answer: [0, 2],
explain: `**Đáp án đúng: phương án 1 và 3.** MCP connector cho phép Claude truy cập công cụ, tài nguyên (resources) và mẫu prompt (prompts) từ MCP server bên ngoài, mà ứng dụng không cần tự triển khai từng tool. Bạn KHÔNG định nghĩa tool MCP trong mảng tools của request (chỉ cần mcp_servers config). MCP connector bắt buộc header beta mcp-2025-06-18.

### Vì sao các phương án còn lại sai
- **Phải định nghĩa tool trong tools array:** tool MCP do server cung cấp, không khai báo trong request.
- **Không cần beta header:** bắt buộc header anthropic-beta: mcp-2025-06-18.`
},
{
  id: 'qz-ccdv-056',
  topic: 'claude',
  q: '[Agents] You use structured outputs (output_config.format: "json_schema") for a data extraction agent. What is a key requirement?',
  options: [
    'The schema must be a valid JSON Schema Draft 2020-12, and the model will always output valid JSON matching it.',
    'You must disable streaming; structured output only works with non-streaming responses.',
    'The schema can be any JSON object; Claude will infer the structure.',
    'Structured output replaces the need for tool definitions.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** output_config.format: "json_schema" yêu cầu schema tuân thủ JSON Schema Draft 2020-12. Khi bật, Claude đảm bảo đầu ra là JSON hợp lệ khớp schema (nếu không sẽ lỗi hoặc retry nội bộ). Structured output hoạt động cả với streaming (trả về các delta JSON). Schema không thể tùy ý — phải chuẩn JSON Schema. Structured output dùng cho đầu ra cuối cùng, không thay thế tool definitions (dùng cho gọi công cụ).`
},
{
  id: 'qz-ccdv-057',
  topic: 'claude',
  q: '[Agents] In an agent transcript, you notice get_order with the same order_id is called three times in a row. What is a likely cause and fix?',
  options: [
    'The model is hallucinating; increase temperature.',
    'The tool result did not contain the expected data, so Claude retries; ensure tool returns complete data and add a description hint.',
    'The API key has a bug; rotate the key.',
    'This is normal behavior for idempotent tools; no action needed.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Gọi lại cùng tool với cùng tham số thường do kết quả tool trước không thỏa mãn (thiếu trường, lỗi, hoặc dữ liệu không như mong đợi), khiến Claude thử lại. Sửa bằng cách: (1) Đảm bảo tool trả về đầy đủ dữ liệu mong đợi. (2) Thêm mô tả/hint trong tool definition hoặc system prompt về định dạng kết quả. Temperature cao làm trầm trọng hơn; không phải bug API key; không phải hành vi bình thường cho tool bất biến (idempotent) trừ khi có lý do.`
},
{
  id: 'qz-ccdv-058',
  topic: 'claude',
  q: '[Agents] An orchestrator delegates a task to a sub-agent by sending a brief: "Fix the bug discussed in the previous turn." What is a best practice for the brief?',
  options: [
    'Keep it extremely short; the sub-agent has full context.',
    'Include the specific file paths, error messages, and the exact change needed — treat it like a ticket.',
    'Omit the brief and let the sub-agent figure it out from the conversation history.',
    'Send the entire conversation history as the brief.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Brief cho sub-agent nên đầy đủ, cụ thể (file path, lỗi, thay đổi mong đợi) như một ticket rõ ràng. Sub-agent không tự động có toàn bộ ngữ cảnh (context window riêng, tách biệt); brief quá ngắn gây mơ hồ; không gửi brief thì sub-agent không biết nhiệm vụ; gửi toàn bộ lịch sử lãng phí token và làm nhiễu.`
},
{
  id: 'qz-ccdv-059',
  topic: 'claude',
  multi: true,
  q: '[Agents] A single request includes both a server tool (web_search) and a client tool (get_order). Which statements are true? (Choose 2)',
  options: [
    'Claude can call both tool types in the same turn.',
    'Web Search results are returned directly in the response; get_order requires a tool_result in the next request.',
    'Both tools require your application to send tool_result back.',
    'You cannot mix server and client tools in one request.'
  ],
  answer: [0, 1],
explain: `**Đáp án đúng: phương án 1 và 2.** Một request có thể định nghĩa cả server tool (web_search, code_execution) và client tool (do bạn triển khai). Trong một lượt, Claude có thể gọi cả hai loại. Kết quả Web Search đến ngay trong response (không cần tool_result); client tool cần ứng dụng thực thi và gửi tool_result qua request tiếp theo. Không bị cấm trộn hai loại.

### Vì sao các phương án còn lại sai
- **Cả hai cần tool_result:** server tool không cần.
- **Không được trộn:** hoàn toàn được phép và phổ biến trong agent phức tạp.`
},
{
  id: 'qz-ccdv-060',
  topic: 'claude',
  q: '[Agents] Your agent loop receives a response with stop_reason "max_tokens" and the last content block is a tool_use (incomplete). What should you do?',
  options: [
    'Treat the tool_use as complete and execute it.',
    'Send a new request with the same messages plus a user message asking Claude to continue.',
    'Discard the incomplete tool_use, increase max_tokens, and retry the whole turn from the last user message.',
    'Send tool_result with is_error: true for the incomplete tool_use.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Khi stop_reason là max_tokens và khối cuối là tool_use bị cắt giữa chừng, tool_use đó KHÔNG hợp lệ (thiếu input, thiếu id, hoặc JSON không đầy đủ). Không được thực thi hay gửi tool_result cho nó. Cách xử lý: tăng max_tokens trong request tiếp theo, và retry từ tin nhắn user cuối cùng (loại bỏ response bị cắt). Hỏi Claude "tiếp tục" không khôi phục tool_use bị hỏng; gửi tool_result lỗi cho tool không tồn tại cũng sai.`
},
{
  id: 'qz-ccdv-061',
  topic: 'claude',
  q: '[Applications] You enable prompt caching on a 50K-token system prompt. After 10 minutes of inactivity, the next request shows cache_creation_input_tokens instead of cache_read_input_tokens. Why?',
  options: [
    'The cache TTL expired (approximately 5 minutes of inactivity).',
    'The system prompt was modified by a single character.',
    'Cache only works for user messages, not system prompts.',
    'The API key was rotated during the idle period.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Prompt cache có thời gian sống (TTL) khoảng 5 phút không hoạt động. Sau 10 phút im lặng, cache bị xóa và request tiếp theo phải tạo lại (cache_creation_input_tokens). Thay đổi nội dung prompt cũng làm mất cache, nhưng trong tình huống này prompt không đổi — chỉ là hết TTL. Cache hoạt động cho system prompt, và xoay khóa API không xóa cache (cache gắn với nội dung prompt, không phải khóa).`
},
{
  id: 'qz-ccdv-062',
  topic: 'claude',
  q: '[Applications] A Java service sends a Messages API request with a 100-page PDF (base64, application/pdf) and receives HTTP 413 Payload Too Large. What is the immediate fix?',
  options: [
    'Compress the PDF with gzip before base64 encoding.',
    'Split the PDF into smaller chunks under the size limit and send multiple requests.',
    'Upload the PDF to S3 and send the presigned URL instead.',
    'Switch to a model with a larger context window.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Messages API giới hạn kích thước request (khoảng 32 MB cho base64 sau mã hóa). Base64 làm tăng dung lượng ~33%, nén gzip trước khi base64 không giúp vì API nhận base64 thô. Claude không tải file từ URL (S3 hay bất kỳ đâu). Phải chia nhỏ PDF (tách trang, OCR trích xuất văn bản, hoặc tóm tắt trước) để từng request nằm dưới ngưỡng. Context window lớn hơn không giải quyết giới hạn payload HTTP.`
},
{
  id: 'qz-ccdv-063',
  topic: 'claude',
  multi: true,
  q: '[Applications] Which statements about the Count Tokens endpoint are correct? (Choose 2)',
  options: [
    'It uses the exact tokenizer of the specified model.',
    'It incurs the same cost as a Messages API call with the same input.',
    'It can count tokens for a list of messages including images and documents.',
    'It requires an admin API key.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** Count Tokens endpoint dùng tokenizer chính xác của model được chỉ định (trả về input_tokens), hỗ trợ đếm cho messages chứa text, images, documents. Endpoint này thường miễn phí hoặc giá cực thấp, không tính phí như Messages API. Không cần khóa admin — khóa API thông thường có quyền truy cập là đủ.`
},
{
  id: 'qz-ccdv-064',
  topic: 'claude',
  q: '[Applications] You want to use the Messages API beta header for prompt caching. Which header value is correct?',
  options: [
    'anthropic-beta: prompt-caching-2024-07-31',
    'anthropic-beta: cache-2024-01-01',
    'anthropic-beta: messages-2023-12-15',
    'anthropic-beta: tools-2024-04-04'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Prompt caching (éphemeral cache) yêu cầu beta header "anthropic-beta: prompt-caching-2024-07-31" (hoặc phiên bản mới hơn theo tài liệu). Header messages là cho API cơ bản, tools cho công cụ, và cache-2024-01-01 không phải giá trị chuẩn.`
},
{
  id: 'qz-ccdv-065',
  topic: 'claude',
  q: '[Applications] Your app uses the Batch API to process 50,000 summarization requests. The batch finishes with processing_status "ended". You download the results file. What format is each line?',
  options: [
    'A JSON object with custom_id, result (containing type, message, or error), and no other fields.',
    'A CSV row with custom_id, status, and output_text.',
    'A plain text line with the summary only.',
    'An XML fragment wrapping the response.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** File kết quả Batch API là JSONL (mỗi dòng một JSON object). Mỗi dòng chứa custom_id (khớp request gốc) và result (object với type: "succeeded"|"errored"|"canceled", và message hoặc error). Không phải CSV, plain text, hay XML.`
},
{
  id: 'qz-ccdv-066',
  topic: 'claude',
  multi: true,
  q: '[Applications] You stream a Messages API response with citations enabled. Which event types can appear in the stream? (Choose 2)',
  options: [
    'content_block_delta with type text_delta',
    'content_block_delta with type citation_delta',
    'message_start with a citations array at the top level',
    'A separate HTTP response for citations after the stream ends'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** Khi bật citations, dòng sự kiện (SSE) chứa content_block_delta kiểu text_delta cho văn bản, và content_block_delta kiểu citation_delta cho các dấu trích dẫn (doc index, vị trí). Citation không xuất hiện ở message_start cấp cao nhất, và không có phản hồi HTTP riêng cho citations.`
},
{
  id: 'qz-ccdv-067',
  topic: 'claude',
  q: '[Applications] A Java client receives HTTP 400 with error message "messages.0: content block 0 is too large". What is the likely cause?',
  options: [
    'The API key has insufficient permissions.',
    'A single content block (e.g., a large image or document) exceeds the per-block size limit.',
    'The total request body exceeds the HTTP server limit.',
    'The model context window is full.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Lỗi "content block X is too large" có nghĩa là một khối nội dung đơn lẻ (ảnh base64 lớn, PDF lớn) vượt quá giới hạn kích thước cho mỗi block (khác với giới hạn tổng request hay context window). Cách khắc phục: chia nhỏ tài liệu, nén ảnh, hoặc dùng định dạng nhẹ hơn. Không liên quan đến quyền khóa API, tổng body request, hay context window.`
},
{
  id: 'qz-ccdv-068',
  topic: 'claude',
  q: '[Applications] You send a request with metadata: {user_id: "user_123", client_id: "app_456"}. Where does this metadata appear for monitoring?',
  options: [
    'In the response usage field.',
    'In the Anthropic Console usage dashboard and logs for rate-limit attribution.',
    'In the message content as a hidden field.',
    'It is ignored by the API.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Trường metadata (user_id, client_id) được Anthropic ghi nhận trong bảng điều khiển (Console) và log để phân bổ giới hạn tốc độ (rate-limit attribution) và theo dõi sử dụng theo người dùng cuối. Metadata không xuất hiện trong response usage, không chèn vào nội dung tin nhắn, và không bị bỏ qua.`
},
{
  id: 'qz-ccdv-069',
  topic: 'claude',
  multi: true,
  q: '[Applications] Which statements about image input in Messages API are true? (Choose 2)',
  options: [
    'Images must be base64-encoded with media_type image/png, image/jpeg, image/gif, or image/webp.',
    'You can provide a public HTTPS URL and Claude will fetch the image.',
    'The source.type must be "base64" and source.data contains the base64 string.',
    'Images are limited to 1 MB each after base64 encoding.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** Hình ảnh phải mã hóa base64, đặt trong source.data với media_type là image/png, image/jpeg, image/gif, hoặc image/webp, và source.type: "base64". Claude KHÔNG tải ảnh từ URL (không hỗ trợ source.type: "url"). Giới hạn kích thước ảnh là khoảng 5 MB (trước base64) hoặc 20 MP pixel, không phải 1 MB sau base64.`
},
{
  id: 'qz-ccdv-070',
  topic: 'claude',
  q: '[Applications] Your production code uses model alias "claude-sonnet-5-5-latest". What happens when Anthropic releases a new Sonnet 5.5 point release?',
  options: [
    'Requests automatically use the new point release without code changes.',
    'Requests fail with 404 until you update the model ID.',
    'The alias is frozen to the version at the time of first use.',
    'You receive an email and have 30 days to migrate.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Alias "latest" (ví dụ claude-sonnet-5-5-latest) luôn trỏ đến bản phát hành điểm (point release) mới nhất của dòng model đó. Khi Anthropic phát hành bản mới, request dùng alias này tự động dùng bản mới mà không cần đổi code. Lưu ý: hành vi, giá, context có thể thay đổi nhẹ — nên test trước khi đưa alias "latest" vào production quan trọng.`
},
{
  id: 'qz-ccdv-071',
  topic: 'claude',
  q: '[Applications] You set stop_sequences: ["\n\nHuman:", "\n\nAssistant:"] in a chat completion request. When does Claude stop generating?',
  options: [
    'When it generates either of the exact strings in the array.',
    'When it generates any word from the stop sequences.',
    'Only at the end of a complete sentence.',
    'After max_tokens is reached, regardless of stop sequences.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** stop_sequences là mảng chuỗi; Claude dừng sinh NGAY LẬP TỨC khi gặp bất kỳ chuỗi nào trong mảng (khớp chính xác, phân biệt chữ hoa/thường). Chuỗi dừng KHÔNG xuất hiện trong kết quả trả về. Không dừng ở từ đơn lẻ, không chờ hết câu, và ưu tiên dừng theo stop_sequences trước max_tokens.`
},
{
  id: 'qz-ccdv-072',
  topic: 'claude',
  multi: true,
  q: '[Applications] A request returns HTTP 529 (Overloaded). Which retry strategies are appropriate? (Choose 2)',
  options: [
    'Retry immediately in a tight loop.',
    'Wait with exponential backoff and jitter, respecting any retry-after header.',
    'Switch to a different model via the fallbacks beta header on subsequent requests.',
    'Abort and show a permanent error to the user.'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phương án 2 và 3.** HTTP 529 có nghĩa là hệ thống quá tải (tạm thời). Chiến lược đúng: (1) Chờ với backoff lũy thừa có jitter, tuân thủ header retry-after nếu có. (2) Sử dụng beta header fallbacks ("anthropic-beta: fallbacks") để API tự chuyển sang model dự phòng. Retry ngay lập tức làm tràn hơn; abort vĩnh viễn mất tính năng có thể phục hồi.`
},
{
  id: 'qz-ccdv-073',
  topic: 'claude',
  q: '[Applications] You want to estimate the cost of a 200K-token document before enabling prompt caching. Which API call gives the exact token count for that document?',
  options: [
    'POST /v1/messages with max_tokens: 1',
    'POST /v1/count_tokens with the document content',
    'GET /v1/models/{model_id}',
    'GET /v1/usage'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Endpoint POST /v1/count_tokens nhận nội dung (text, images, documents) và trả về input_tokens chính xác theo tokenizer của model. Dùng để ước lượng chi phí prompt caching (cache_creation_input_tokens, cache_read_input_tokens) trước khi gửi request thật. /v1/messages gửi request thật tốn tiền; /v1/models chỉ trả metadata model; /v1/usage chỉ thống kê mức sử dụng tài khoản.`
},
{
  id: 'qz-ccdv-074',
  topic: 'claude',
  q: '[Applications] A user uploads a 10 MB PNG image. You base64-encode it and send via Messages API. The request fails with HTTP 400 "image too large". What is the limit?',
  options: [
    '5 MB before base64 encoding (approximately 6.7 MB after base64).',
    '10 MB before base64 encoding.',
    '20 MB after base64 encoding.',
    'No limit; the error is a bug.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Giới hạn ảnh đơn lẻ là khoảng 5 MB (trước base64) hoặc 20 triệu pixel. Base64 làm tăng ~33%, nên 5 MB thành ~6.7 MB. Ảnh 10 MB vượt ngưỡng. Cách sửa: nén ảnh, giảm độ phân giải, hoặc chuyển sang JPEG/WebP nhẹ hơn.`
},
{
  id: 'qz-ccdv-075',
  topic: 'claude',
  q: '[Applications] You use the Web Search server tool. The response contains citations with type "web_search_result". What information does each citation include?',
  options: [
    'Only the URL of the source.',
    'Title, URL, encrypted index, and the cited text snippet.',
    'The full HTML of the page.',
    'A summary generated by Haiku.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi bật citations với Web Search, mỗi citation chứa: title (tiêu đề trang), url, cited_text (đoạn văn bản được trích dẫn), và encrypted_index (chỉ số nội bộ). Không trả về full HTML hay tóm tắt do Haiku sinh.`
},
{
  id: 'qz-ccdv-076',
  topic: 'claude',
  q: '[Agents] Your agent uses the Code Execution server tool (anthropic-beta: code-execution-2025-06-18). What environment does the tool run in?',
  options: [
    'A sandboxed Python environment on Anthropic servers.',
    'Your local Java process via JNI.',
    'A Docker container you host and expose via MCP.',
    'The browser JavaScript engine of the end user.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Code Execution (server tool) chạy Python trong môi trường sandbox trên máy chủ Anthropic. Không chạy cục bộ trên máy của bạn, không qua Docker của bạn, và không chạy trên trình duyệt người dùng. Cần beta header code-execution-2025-06-18.`
},
{
  id: 'qz-ccdv-077',
  topic: 'claude',
  multi: true,
  q: '[Agents] Which statements about the Code Execution tool are true? (Choose 2)',
  options: [
    'It can install Python packages via pip in the sandbox.',
    'It has persistent filesystem state across tool calls within the same conversation.',
    'It returns stdout, stderr, and a base64-encoded PNG if matplotlib generates a plot.',
    'It can make outbound network requests to the internet.'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phương án 2 và 3.** Code Execution tool: (1) Có hệ thống tệp bền vững (persistent filesystem) trong suốt hội thoại — file tạo ra ở lượt trước đọc được ở lượt sau. (2) Trả về stdout, stderr, và nếu code vẽ biểu đồ (matplotlib), trả về ảnh PNG base64. Không cho cài đặt pip (môi trường chỉ có thư viện chuẩn), và không có truy cập mạng ra ngoài.`
},
{
  id: 'qz-ccdv-078',
  topic: 'claude',
  q: '[Agents] An agent delegates a task to a sub-agent via a brief. The sub-agent returns a result. How should the parent agent incorporate this result?',
  options: [
    'Append the sub-agent\'s full transcript as a user message.',
    'Send a user message with tool_result containing the sub-agent\'s summary and any artifacts.',
    'Replace the parent agent\'s system prompt with the sub-agent\'s output.',
    'Ignore the result and ask the user to verify.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Kết quả sub-agent nên đóng gói thành một tool_result (hoặc user message với tóm tắt + artifact) gửi cho agent cha. Không nên nhét toàn bộ transcript (lãng phí token, nhiễu). System prompt không thay thế cho kết quả task. Bỏ qua kết quả khiến agent cha mất thông tin.`
},
{
  id: 'qz-ccdv-079',
  topic: 'claude',
  q: '[Agents] You define a tool with strict: true in its input_schema. What does this guarantee?',
  options: [
    'Claude will always call this tool exactly once per turn.',
    'The tool arguments will strictly conform to the JSON Schema (no extra properties, required fields present).',
    'The tool will execute on Anthropic servers instead of your application.',
    'The tool is cached and never re-validated.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** strict: true trong input_schema yêu cầu Claude tuân thủ chặt chẽ JSON Schema: không thuộc tính thừa, các trường required phải có, kiểu dữ liệu khớp. Giúp giảm lỗi malformed arguments. Không liên quan đến số lần gọi, không chạy trên server Anthropic (vẫn do app thực thi), và không cache validation.`
},
{
  id: 'qz-ccdv-080',
  topic: 'claude',
  multi: true,
  q: '[Agents] Your agent has 300 tools but only 10-15 are relevant per request. Which strategies help Claude pick the right tools? (Choose 2)',
  options: [
    'Put all 300 tools in the tools array; Claude handles large tool sets well.',
    'Use a tool router: dynamically select relevant tools per request based on user intent.',
    'Group tools into MCP servers by domain and use MCP connectors.',
    'Disable tool_choice and let Claude decide from all 300.'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phương án 2 và 3.** Với nhiều tool (300), đưa tất cả vào một request làm giảm độ chính xác chọn tool và tốn token. Giải pháp: (1) Tool router — code của bạn lọc ra 10-15 tool liên quan theo ý định người dùng. (2) MCP servers — nhóm tool theo miền (domain) trên các MCP server riêng, dùng MCP connector để Claude truy cập khi cần. Đưa 300 tool cùng lúc làm Claude nhầm lẫn; tắt tool_choice không giúp chọn đúng hơn.`
},
{
  id: 'qz-ccdv-081',
  topic: 'claude',
  q: '[Agents] The agent receives a tool_result with is_error: true. What should the agent loop do next?',
  options: [
    'Immediately retry the same tool with the same arguments.',
    'Send the error to Claude (via the tool_result) and let Claude decide: retry, use another tool, or ask the user.',
    'Stop the agent and escalate to a human.',
    'Remove the tool from the tools array and continue.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi tool thất bại, gửi tool_result có is_error: true và chi tiết lỗi. Claude nhận biết lỗi và có thể: thử lại với tham số sửa, gọi tool khác, hoặc hỏi người dùng. Retry ngay lập tức có thể lặp lỗi; dừng hẳn mất tự phục hồi; xóa tool khỏi mảng làm Claude không biết tool đó tồn tại.`
},
{
  id: 'qz-ccdv-082',
  topic: 'claude',
  q: '[Agents] You use structured output (output_config.format: "json_schema") for an agent that must return a fixed schema. The agent also uses tools. What is the correct request structure?',
  options: [
    'Include both tools array and output_config in the same request.',
    'Structured output and tools cannot be used together.',
    'Use output_config only; remove the tools array.',
    'Use tools only; validate JSON in your application after.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Bạn CÓ THỂ dùng cả tools và output_config trong cùng một request. Tools dùng cho vòng lặp agent (gọi công cụ trung gian); output_config ép buộc đầu ra CUỐI CÙNG (khi stop_reason là end_turn) tuân thủ JSON Schema. Hai cơ chế bổ trợ nhau, không xung đột.`
},
{
  id: 'qz-ccdv-083',
  topic: 'claude',
  multi: true,
  q: '[Agents] Which statements about the Computer Use (beta) capability are true? (Choose 2)',
  options: [
    'It lets Claude control a virtual desktop (mouse, keyboard, screenshot) via a tool you host.',
    'It runs entirely on Anthropic servers without any infrastructure from you.',
    'You provide a containerized environment (Docker) with the computer_use tool exposed.',
    'It is enabled by adding "computer_use" to the tools array without any beta header.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** Computer Use (beta): bạn tự host môi trường ảo (container Docker) với tool computer_use cho phép Claude thao tác chuột, bàn phím, chụp màn hình. Không chạy trên server Anthropic. Cần beta header computer-use-2025-06-18 (hoặc mới hơn) và định nghĩa tool computer_use trong mảng tools.`
},
{
  id: 'qz-ccdv-084',
  topic: 'claude',
  q: '[Agents] In a long-running agent (hours), the context window fills up. What is a recommended strategy to continue?',
  options: [
    'Increase max_tokens to the model maximum.',
    'Summarize the conversation history periodically and replace old messages with the summary.',
    'Switch to a model with a larger context window and continue.',
    'Restart the agent from scratch with the original prompt.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi context window gần đầy, chiến lược phổ biến: tóm tắt lịch sử hội thoại cũ (dùng một request riêng hoặc Haiku rẻ) và thay thế các tin nhắn cũ bằng bản tóm tắt, giữ lại các tin nhắn gần đây và system prompt. Tăng max_tokens không mở rộng context window (đó là giới hạn input+output). Đổi model lớn hơn tốn kém và chỉ trì hoãn vấn đề. Khởi động lại mất ngữ cảnh quan trọng.`
},
{
  id: 'qz-ccdv-085',
  topic: 'claude',
  q: '[Agents] Your agent uses a tool that returns a large JSON (50 KB). The next turn, Claude seems to ignore parts of it. What is a likely cause?',
  options: [
    'The tool_result exceeds the per-block size limit for tool results.',
    'The total conversation approaches the context window, causing earlier parts to be truncated.',
    'Claude cannot parse JSON larger than 10 KB.',
    'The tool_use_id was mismatched.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi hội thoại dài gần chạm context window (200K token cho model hiện hành), các token cũ (kể cả tool_result lớn) có thể bị cắt (truncation) để chừa chỗ cho input/output mới. Tool_result 50 KB base64/text thường vẫn trong giới hạn per-block; Claude parse JSON lớn tốt; mismatch tool_use_id sẽ gây lỗi rõ ràng khác. Cách khắc phục: tóm tắt tool_result, hoặc dùng strategy quản lý context (mục 84).`
},
{
  id: 'qz-ccdv-086',
  topic: 'claude',
  multi: true,
  q: '[Agents] You want to evaluate an agent that uses tools. Which evaluation practices are recommended? (Choose 2)',
  options: [
    'Measure only the final answer correctness; ignore the tool call sequence.',
    'Define success criteria before optimizing (e.g., task completion, tool accuracy, cost, latency).',
    'Use a held-out test set not seen during prompt tuning.',
    'Run each test case once; agents are deterministic.'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: phương án 2 và 3.** Đánh giá agent: (1) Xác định tiêu chí thành công TRƯỚC khi tối ưu (hoàn thành task, độ chính xác tool, chi phí, độ trễ). (2) Dùng tập test held-out (không dùng khi tinh chỉnh) để tránh overfitting. Agent KHÔNG deterministic (có ngẫu nhiên, sampling) — cần chạy nhiều lần. Chỉ đo đáp án cuối bỏ qua chất lượng quá trình (tool sai, loop vô tận, chi phí cao).`
},
{
  id: 'qz-ccdv-087',
  topic: 'claude',
  q: '[Agents] An agent calls a tool, but the tool takes 30 seconds to respond (external API latency). The Messages API request times out. What should you do?',
  options: [
    'Increase the HTTP client timeout to 60+ seconds for tool execution.',
    'Make the tool asynchronous: return a placeholder immediately, poll for result, and send tool_result in a later turn.',
    'Remove the tool and ask the user to call the external API manually.',
    'Switch to a faster model so the agent times out less.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Tool thực thi do ứng dụng của bạn chạy (client-side). Nếu tool chậm (>30s), đừng block request Messages API. Thay vào đó: tool trả về ngay placeholder (ví dụ "đang xử lý..."), nền tảng của bạn poll/await kết quả thực, khi xong gửi tool_result qua request agent mới. Tăng timeout HTTP client không giải quyết bản chất (API Anthropic có timeout riêng). Model nhanh hơn không làm tool ngoài nhanh hơn.`
},
{
  id: 'qz-ccdv-088',
  topic: 'claude',
  q: '[Agents] You use the thinking parameter with type "enabled" and budget_tokens: 10000 for a complex reasoning agent. The response shows thinking tokens in usage.output_tokens. Are you charged for these tokens?',
  options: [
    'No, thinking tokens are free when budget_tokens is set.',
    'Yes, thinking tokens are counted as output tokens and billed at the output rate.',
    'Only if the thinking trace exceeds budget_tokens.',
    'Only if you also enable streaming.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Token tư duy (thinking tokens) LUÔN được tính vào output_tokens và tính phí theo mức giá đầu ra — bất kể dùng enabled hay adaptive, có hay không budget_tokens. budget_tokens chỉ giới hạn tối đa token tư duy, không miễn phí. Streaming không thay đổi chính sách tính phí.`
},
{
  id: 'qz-ccdv-089',
  topic: 'claude',
  multi: true,
  q: '[Agents] Your agent must not take irreversible actions (delete, charge, send email) without explicit user confirmation. Which patterns enforce this? (Choose 2)',
  options: [
    'Define irreversible tools with descriptions saying "requires confirmation", but rely on Claude to obey.',
    'Split irreversible tools into two: a "preview" tool (read-only) and a "confirm" tool; require human approval between them.',
    'Use tool_choice: {"type": "none"} for all irreversible tools.',
    'In your application, intercept tool_use for irreversible actions, show confirmation UI, and only execute after user clicks confirm.'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: phương án 2 và 3.** An toàn cho hành động bất đảo: (1) Tách tool thành preview (xem trước tác động) và confirm (thực thi), yêu cầu duyệt người giữa hai bước. (2) Ứng dụng chặn tool_use bất đảo, hiện UI xác nhận, chỉ gửi tool_result sau khi user bấm đồng ý. Chỉ dùng mô tả tool không đủ an toàn (Claude có thể bỏ qua). tool_choice none vô hiệu hóa hoàn toàn, không phù hợp khi đôi khi cần thực thi.`
},
{
  id: 'qz-ccdv-090',
  topic: 'claude',
  q: '[Agents] A coding agent modifies a file, runs tests, and sees failures. It then modifies the same file again in a way that makes tests pass but introduces a logic bug (overfitting to tests). What evaluation practice catches this?',
  options: [
    'Run the test suite more times.',
    'Use a held-out test set (hidden tests) not visible to the agent during development.',
    'Increase the temperature so the agent explores more solutions.',
    'Disable the test-running tool.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Overfitting to tests (pass test nhưng logic sai) là rủi ro lớn của coding agent. Giải pháp: tập test held-out (ẩn) — agent không thấy khi chạy, chỉ dùng để chấm điểm cuối. Chạy test nhiều lần không phát hiện bug logic ẩn. Tăng temperature làm ngẫu nhiên hơn, không đảm bảo đúng. Tắt test-running tool mất phản hồi cần thiết.`
},
{
  id: 'qz-ccdv-091',
  topic: 'claude',
  q: '[Prompt] A legal team asks 15 questions about the same 80-page contract in one session. You set cache_control on the contract document. What happens on the 2nd through 15th turns?',
  options: [
    'Each turn incurs full input token cost because the contract is re-sent.',
    'The contract prefix is read from cache at the cheaper cache_read_input_tokens rate; only the new question incurs full input cost.',
    'Only the first turn is cached; subsequent turns are billed at double rate.',
    'The cache is invalidated after the first turn because the user message changed.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Phần dùng chung (hợp đồng) được lưu đệm một lần (cache_creation_input_tokens). Các lượt sau đọc tiền tố đó từ cache với giá cache_read_input_tokens rẻ hơn đáng kể; chỉ câu hỏi mới bị tính phí input đầy đủ. Cache không bị vô hiệu hóa chỉ vì user message thay đổi — đó chính là mục đích của prompt caching.`
},
{
  id: 'qz-ccdv-092',
  topic: 'claude',
  q: '[Prompt] You want to use few-shot examples to guide Claude\'s output format for invoice extraction. Where should you place the examples for best caching and attention?',
  options: [
    'At the very end of the user message, after the document.',
    'Inside the system prompt, before any cached prefix.',
    'In a separate user message before the document.',
    'As assistant messages in the conversation history.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Đặt few-shot examples trong system prompt (trước tiền tố được cache) giúp chúng được lưu đệm cùng với system prompt, và mô hình chú ý đến chúng trước khi xử lý tài liệu. Đặt cuối user message làm examples không được cache; tách thành user message riêng làm gián đoạn tiền tố cache; dùng assistant message trong lịch sử tốn token và không được cache.`
},
{
  id: 'qz-ccdv-093',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Which practices reduce the risk of prompt injection from untrusted user content? (Choose 2)',
  options: [
    'Put untrusted content in a separate user message after the system prompt and cached documents.',
    'Use XML tags (e.g., <document>...</document>) to delimit untrusted sections.',
    'Instruct Claude in the system prompt to ignore instructions inside user content.',
    'Disable tools entirely when processing untrusted input.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** (1) Tách nội dung không tin cậy vào user message riêng, sau system prompt và tài liệu đã cache, giúp Claude phân biệt hướng dẫn hệ thống vs dữ liệu đầu vào. (2) Dùng thẻ XML bao quanh phần không tin cậy tạo ranh giới rõ ràng. Chỉ nhờ system prompt "bỏ qua hướng dẫn" không đủ an toàn (Claude có thể bị lừa). Tắt tool hoàn toàn là thái độ cực đoan, không cần thiết nếu đã tách biệt đúng.`
},
{
  id: 'qz-ccdv-094',
  topic: 'claude',
  q: '[Prompt] Your system prompt is 25K tokens and you attach cache_control: {type: "ephemeral"} to it. After 6 minutes of inactivity, the next request shows cache_creation_input_tokens. Why?',
  options: [
    'The cache TTL expired (approximately 5 minutes of inactivity).',
    'The system prompt was modified by a single character.',
    'Ephemeral cache only works for user messages, not system.',
    'You need to add cache_control to every user message as well.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Prompt cache có thời gian sống (TTL) khoảng 5 phút không hoạt động. Sau 6 phút im lặng, cache bị xóa và request tiếp theo phải tạo lại (cache_creation_input_tokens). Thay đổi nội dung prompt cũng làm mất cache, nhưng tình huống này prompt không đổi — chỉ là hết TTL. Cache hoạt động cho system prompt, không cần gắn cache_control cho user message.`
},
{
  id: 'qz-ccdv-095',
  topic: 'claude',
  multi: true,
  q: '[Prompt] You send a long document (100K tokens) with cache_control at the start, followed by a short question. The response shows high cache_read_input_tokens but low input_tokens. What does this indicate? (Choose 2)',
  options: [
    'The document prefix was successfully read from cache.',
    'The question tokens are counted as input_tokens.',
    'The document was re-processed at full cost.',
    'Cache creation happened on this request.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** cache_read_input_tokens cao nghĩa là tiền tố tài liệu được đọc từ cache (rẻ). input_tokens thấp chỉ chứa token của câu hỏi ngắn (phần không được cache). Nếu tài liệu được xử lý lại toàn bộ, cache_creation_input_tokens sẽ cao. Cache creation chỉ xảy ra ở request đầu tiên hoặc sau khi cache hết hạn.`
},
{
  id: 'qz-ccdv-096',
  topic: 'claude',
  q: '[Prompt] You want Claude to answer concisely (under 50 words) for a FAQ bot. Which approach is most effective?',
  options: [
    'Set max_tokens: 50 and hope it stops in time.',
    'Add "Answer in 50 words or fewer" to the system prompt and use stop_sequences: ["."] to stop at the first sentence end.',
    'Use temperature: 0 to force short answers.',
    'Pre-fill the answer with "Answer:" and let Claude complete it.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Chỉ dùng max_tokens cắt ngang có thể mất nghĩa; temperature không kiểm soát độ dài; prefill không hỗ trợ trên model mới. Cách hiệu quả: hướng dẫn rõ trong system prompt ("Answer in 50 words or fewer") kết hợp stop_sequences (ví dụ dừng ở dấu chấm) để cắt tự nhiên.`
},
{
  id: 'qz-ccdv-097',
  topic: 'claude',
  q: '[Prompt] A developer puts the entire 200K-token context (system prompt + 50 previous turns + current document) in a single request without cache_control. What is the cost implication vs. using prompt caching on the shared prefix?',
  options: [
    'Same cost; caching only affects latency.',
    'Full input token price for the entire 200K tokens on every request, vs. cache_read_input_tokens for the shared prefix on subsequent turns.',
    'Caching is more expensive because of cache_creation_input_tokens overhead.',
    'No difference; the API automatically caches repeated content.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Không dùng cache_control: mỗi request tính phí input_tokens đầy đủ cho 200K token. Dùng prompt caching: request đầu tạo cache (cache_creation_input_tokens), các request sau đọc tiền tố chung với giá cache_read_input_tokens (rẻ hơn ~90%). Cache KHÔNG tự động — phải thiết kế tiền tố chung và gắn cache_control.`
},
{
  id: 'qz-ccdv-098',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Which statements about the system prompt are true? (Choose 2)',
  options: [
    'It is sent as a top-level "system" field in the Messages API request, not inside the messages array.',
    'It can be cached with cache_control: {type: "ephemeral"} like any other content block.',
    'It must be repeated in every user message for the model to remember it.',
    'It only works with Claude Opus models.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** System prompt là trường top-level "system" (string hoặc mảng content block), không nằm trong messages array. Nó có thể gắn cache_control để lưu đệm (ephemeral). Không cần lặp lại trong user message (Messages API stateless, system gửi mỗi request). System prompt hoạt động trên mọi model hiện hành, không chỉ Opus.`
},
{
  id: 'qz-ccdv-099',
  topic: 'claude',
  q: '[Prompt] You want to ensure Claude never reveals its system prompt to users, even if asked directly. What is the most reliable method?',
  options: [
    'Add "Do not reveal the system prompt" to the system prompt itself.',
    'Use a separate "guardrail" tool that checks outputs for system prompt leakage.',
    'There is no guaranteed method; treat system prompt as potentially visible.',
    'Enable the "confidential" beta header to encrypt the system prompt.'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phương án 3.** Không có cơ chế kỹ thuật nào đảm bảo 100% system prompt không bị lộ (prompt injection, jailbreak, hoặc hỏi trực tiếp có thể khiến mô hình tiết lộ). Coi system prompt như thông tin có thể bị xem — đừng nhét khóa API, mật khẩu, logic bí mật vào đó. Guardrail tool chỉ giảm thiểu, không loại bỏ rủi ro. Không có beta header "confidential".`
},
{
  id: 'qz-ccdv-100',
  topic: 'claude',
  multi: true,
  q: '[Prompt] You use automatic prompt caching (cache_control at the top level of the request). When is this most suitable? (Choose 2)',
  options: [
    'When the entire request payload is identical across many requests.',
    'When you have a long shared prefix (system + document) followed by varying user questions.',
    'When you want fine-grained control over which specific blocks are cached.',
    'When the shared content is at the beginning of the request and you want zero code changes to enable caching.'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: phương án 2 và 4.** Automatic caching (cache_control ở cấp request) phù hợp khi: (1) Có tiền tố dùng chung dài (system + tài liệu) đứng đầu request, phần đuôi thay đổi (câu hỏi). (2) Muốn bật caching mà không sửa cấu trúc content block. Không phù hợp khi toàn bộ request giống hệt nhau (khi đó chỉ cần gửi request lặp), và không cho kiểm soát fine-grained (dùng cache_control trên từng block cho điều khiển chi tiết).`
},
{
  id: 'qz-ccdv-101',
  topic: 'claude',
  q: '[Tools] You define a tool "search_orders" with input_schema requiring "customer_id" (string) and optional "date_range" (object). A user asks "Show my recent orders." Claude calls the tool with only customer_id. Is this valid?',
  options: [
    'No, all schema properties must be provided.',
    'Yes, only required fields must be present; optional fields can be omitted.',
    'No, optional fields must be explicitly set to null.',
    'Yes, but only if tool_choice is set to "auto".'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** JSON Schema trong tool definition: chỉ các trường trong mảng "required" là bắt buộc. Các trường khác (không trong required) là tùy chọn — có thể bỏ qua hoàn toàn, không cần set null. tool_choice không ảnh hưởng đến validation schema.`
},
{
  id: 'qz-ccdv-102',
  topic: 'claude',
  multi: true,
  q: '[Tools] Which statements about tool_choice are correct? (Choose 2)',
  options: [
    'tool_choice: {"type": "auto"} lets Claude decide whether to use tools (default behavior).',
    'tool_choice: {"type": "any"} forces Claude to use at least one tool, but allows multiple.',
    'tool_choice: {"type": "tool", "name": "X"} forces exactly one call to tool X.',
    'tool_choice: {"type": "required"} forces tool use but only allows one tool call per turn.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** auto (mặc định): Claude tự quyết định dùng tool hay không. any: bắt buộc dùng ít nhất một tool, có thể gọi nhiều tool. tool + name: buộc gọi chính xác tool đó (một lần). required: bắt buộc dùng ít nhất một tool, KHÔNG giới hạn số lượng (có thể gọi nhiều).`
},
{
  id: 'qz-ccdv-103',
  topic: 'claude',
  q: '[Tools] Your agent uses a client-side tool that calls an external payment API. The API returns HTTP 500. What should your agent loop do?',
  options: [
    'Retry the tool call immediately in a tight loop.',
    'Send tool_result with is_error: true and the error details, letting Claude decide recovery.',
    'Stop the agent and show the 500 error to the user.',
    'Omit the tool_result and continue with a new user message.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Khi tool thất bại, gửi tool_result có is_error: true và chi tiết lỗi. Claude nhận biết lỗi qua is_error và có thể: thử lại với tham số sửa, gọi tool khác, hoặc hỏi người dùng. Retry ngay lập tức có thể làm tràn rate limit API bên ngoài; dừng hẳn mất tự phục hồi; bỏ qua tool_result làm Claude mất ngữ cảnh.`
},
{
  id: 'qz-ccdv-104',
  topic: 'claude',
  q: '[Tools] When sending tool_result back to the Messages API, which field must match the original tool_use?',
  options: [
    'tool_name',
    'tool_use_id',
    'input',
    'cache_control'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Mỗi tool_result bắt buộc có tool_use_id khớp chính xác với tool_use_id trong tool_use mà Claude đã yêu cầu. Đây là khóa để Claude ghép kết quả với lời gọi đúng. tool_name không bắt buộc trong tool_result (dù có thể thêm để debug), input là tham số đầu vào của tool_use (không phải tool_result), và cache_control không liên quan.`
},
{
  id: 'qz-ccdv-105',
  topic: 'claude',
  q: '[Tools] You want to encourage Claude to use tools more aggressively for a coding agent. Which approach helps?',
  options: [
    'Set temperature to 1.5.',
    'Add detailed tool descriptions, clear names, typed input_schema, and only truly required fields in required.',
    'Disable all tools and rely on text output.',
    'Use tool_choice: {"type": "none"} for the first turn.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Mô tả công cụ rõ ràng, cụ thể (name ngắn gọn, description ý nghĩa, input_schema có kiểu dữ liệu, chỉ required field thực sự bắt buộc) giúp Claude hiểu đúng lúc nào và cách dùng từng tool. Temperature cao làm tăng ngẫu nhiên, không làm tăng việc dùng tool; tắt tool thì không dùng được; tool_choice none cấm dùng tool.`
},
{
  id: 'qz-ccdv-106',
  topic: 'claude',
  q: '[Tools] To use an MCP connector in the Messages API, which beta header is required?',
  options: [
    'anthropic-beta: mcp-2025-06-18',
    'anthropic-beta: prompt-caching-2024-07-31',
    'anthropic-beta: messages-2023-12-15',
    'anthropic-beta: tools-2024-04-04'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** Kết nối MCP (Model Context Protocol) qua Messages API yêu cầu header beta "anthropic-beta: mcp-2025-06-18" (hoặc phiên bản mới hơn theo tài liệu). Các beta header khác: prompt-caching cho caching, messages cho API phiên bản, tools cho công cụ — không bật MCP.`
},
{
  id: 'qz-ccdv-107',
  topic: 'claude',
  multi: true,
  q: '[Tools] Which statements about MCP connectors are true? (Choose 2)',
  options: [
    'MCP connectors let Claude call external tools hosted on MCP servers without your application implementing each tool.',
    'You must still define each MCP tool in the tools array of the request.',
    'MCP connectors support reading resources and prompting templates from the MCP server.',
    'MCP connectors work without any beta header.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** MCP connector cho phép Claude truy cập công cụ, tài nguyên (resources) và mẫu prompt (prompts) từ MCP server bên ngoài, mà ứng dụng không cần tự triển khai từng tool. Bạn KHÔNG định nghĩa tool MCP trong mảng tools của request (chỉ cần mcp_servers config). MCP connector bắt buộc header beta mcp-2025-06-18.`
},
{
  id: 'qz-ccdv-108',
  topic: 'claude',
  q: '[Tools] You use structured outputs (output_config.format: "json_schema") for a data extraction agent. What is a key requirement?',
  options: [
    'The schema must be a valid JSON Schema Draft 2020-12, and the model will always output valid JSON matching it.',
    'You must disable streaming; structured output only works with non-streaming responses.',
    'The schema can be any JSON object; Claude will infer the structure.',
    'Structured output replaces the need for tool definitions.'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phương án 1.** output_config.format: "json_schema" yêu cầu schema tuân thủ JSON Schema Draft 2020-12. Khi bật, Claude đảm bảo đầu ra là JSON hợp lệ khớp schema (nếu không sẽ lỗi hoặc retry nội bộ). Structured output hoạt động cả với streaming (trả về các delta JSON). Schema không thể tùy ý — phải chuẩn JSON Schema. Structured output dùng cho đầu ra cuối cùng, không thay thế tool definitions (dùng cho gọi công cụ).`
},
{
  id: 'qz-ccdv-109',
  topic: 'claude',
  multi: true,
  q: '[Tools] In an agent transcript, you notice get_order with the same order_id is called three times in a row. What is a likely cause and fix? (Choose 2)',
  options: [
    'The model is hallucinating; increase temperature.',
    'The tool result did not contain the expected data, so Claude retries; ensure tool returns complete data and add a description hint.',
    'The API key has a bug; rotate the key.',
    'Add a description to the tool or system prompt clarifying the expected return format.'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: phương án 2 và 4.** Gọi lại cùng tool với cùng tham số thường do kết quả tool trước không thỏa mãn (thiếu trường, lỗi, hoặc dữ liệu không như mong đợi), khiến Claude thử lại. Sửa bằng cách: (1) Đảm bảo tool trả về đầy đủ dữ liệu mong đợi. (2) Thêm mô tả/hint trong tool definition hoặc system prompt về định dạng kết quả. Temperature cao làm trầm trọng hơn; không phải bug API key.`
},
{
  id: 'qz-ccdv-110',
  topic: 'claude',
  q: '[Tools] An orchestrator delegates a task to a sub-agent by sending a brief. What is a best practice for the brief?',
  options: [
    'Keep it extremely short; the sub-agent has full context.',
    'Include the specific file paths, error messages, and the exact change needed — treat it like a ticket.',
    'Omit the brief and let the sub-agent figure it out from the conversation history.',
    'Send the entire conversation history as the brief.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Brief cho sub-agent nên đầy đủ, cụ thể (file path, lỗi, thay đổi mong đợi) như một ticket rõ ràng. Sub-agent không tự động có toàn bộ ngữ cảnh (context window riêng, tách biệt); brief quá ngắn gây mơ hồ; không gửi brief thì sub-agent không biết nhiệm vụ; gửi toàn bộ lịch sử lãng phí token và làm nhiễu.`
},
{
  id: 'qz-ccdv-111',
  topic: 'claude',
  q: '[Security] Where should you store the Anthropic API key in a production web application?',
  options: [
    'In the frontend JavaScript bundle for easy access.',
    'In environment variables on the backend server, never exposed to the client.',
    'In a public GitHub repository for team collaboration.',
    'In localStorage of the user\'s browser.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** API key phải lưu trong biến môi trường (environment variables) trên backend server, không bao giờ đưa vào frontend, bundle JS, localStorage, hay repo công khai. Frontend gọi API của riêng bạn (backend), backend mới dùng API key gọi Anthropic. Việc lộ key cho phép kẻ tấn công dùng hạn mức (quota) của bạn và truy cập dữ liệu.`
},
{
  id: 'qz-ccdv-112',
  topic: 'claude',
  multi: true,
  q: '[Security] When Claude has a tool that accesses sensitive data (e.g., customer PII), what are the biggest risks? (Choose 2)',
  options: [
    'Prompt injection could trick Claude into calling the tool with unauthorized parameters.',
    'The tool result containing PII is sent back to Anthropic servers in the next request.',
    'The tool definition itself leaks data schema to Anthropic.',
    'Users can directly call the tool bypassing Claude.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** (1) Prompt injection: nội dung người dùng độc hại có thể khiến Claude gọi tool nhạy cảm với tham số trái phép (ví dụ user_id của người khác). (2) Tool result chứa PII sẽ được gửi lên Anthropic trong request tiếp theo (messages array) — dữ liệu nhạy cảm rời khỏi hạ tầng của bạn. Tool definition chỉ mô tả schema, không leak dữ liệu thực. User không gọi tool trực tiếp — chỉ Claude quyết định gọi.`
},
{
  id: 'qz-ccdv-113',
  topic: 'claude',
  q: '[Security] Before sending user data to the Anthropic API, what should you do?',
  options: [
    'Send it directly; Anthropic does not train on API data by default.',
    'Strip or pseudonymize PII (emails, names, IDs) unless strictly needed for the task.',
    'Encrypt the data with your own key before sending.',
    'Compress the data to reduce token usage.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Nguyên tắc tối thiểu (data minimization): chỉ gửi dữ liệu thực sự cần thiết cho task. Loại bỏ hoặc giấu danh tính (pseudonymize) PII như email, tên, ID trừ khi task bắt buộc (ví dụ trích xuất hóa đơn cần tên khách). Anthropic không train trên dữ liệu API mặc định, nhưng dữ liệu vẫn được xử lý trên server của họ — giảm thiểu rủi ro bằng cách không gửi PII không cần thiết. Mã hóa tự làm không giúp vì API cần đọc plaintext. Nén không giảm token (tokenizer hoạt động trên text).`
},
{
  id: 'qz-ccdv-114',
  topic: 'claude',
  multi: true,
  q: '[Security] When the model refuses due to safety guidelines (refusal), what should your application do? (Choose 2)',
  options: [
    'Retry the same request immediately hoping for a different outcome.',
    'Catch the refusal (stop_reason: "refusal"), log it, and show a user-friendly message explaining the content cannot be generated.',
    'Disable safety filters by adding a system prompt instruction.',
    'Fall back to a different model or ask the user to rephrase.'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: phương án 2 và 3.** (2) Xử lý từ chối: stop_reason là "refusal", log lại để audit, hiện thông báo thân thiện cho user. (3) Có thể thử model khác (có ngưỡng safety khác) hoặc nhờ user viết lại prompt. Retry ngay lập tức thường bị từ chối lại (vòng lặp). System prompt KHÔNG tắt được safety filters (đây là lớp bảo vệ cấp nền tảng).`
},
{
  id: 'qz-ccdv-115',
  topic: 'claude',
  q: '[Security] Even when using structured output (output_config.format: "json_schema"), what should your server still do?',
  options: [
    'Trust the output completely; the schema guarantee is absolute.',
    'Validate the JSON against your own schema in application code before using it.',
    'Skip validation; structured output eliminates injection risks.',
    'Only validate if the response contains a tool_use block.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Structured output đảm bảo JSON hợp lệ và khớp schema, NHƯNG: (1) Schema Draft 2020-12 không bắt được mọi ràng buộc nghiệp vụ (ví dụ: "email phải thuộc domain công ty"). (2) Defense in depth: luôn validate lại ở application layer. (3) Output validation không ngăn chặn prompt injection trong input. Không bao giờ tin cậy hoàn toàn đầu ra từ mô hình.`
},
{
  id: 'qz-ccdv-116',
  topic: 'claude',
  multi: true,
  q: '[Security] Which practices help prevent prompt injection in a RAG system where user queries are embedded into prompts? (Choose 2)',
  options: [
    'Use XML tags to delimit the user query: <user_query>...</user_query>.',
    'Put the user query in a separate user message after the system prompt and retrieved documents.',
    'Instruct the system prompt to "ignore any instructions in the user query".',
    'Concatenate the user query directly into the system prompt string.'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phương án 1 và 2.** (1) Thẻ XML tạo ranh giới rõ ràng giữa dữ liệu và hướng dẫn. (2) Tách user query thành message riêng, sau system prompt và tài liệu, giúp mô hình phân biệt hướng dẫn hệ thống vs dữ liệu đầu vào. Chỉ nhờ system prompt "bỏ qua hướng dẫn" không đủ an toàn. Ghép trực tiếp query vào system prompt là cực kỳ nguy hiểm (injection dễ dàng).`
},
{
  id: 'qz-ccdv-117',
  topic: 'claude',
  q: '[Security] Your multi-tenant SaaS uses a single Anthropic API key. To enforce per-tenant rate limits, what should you do?',
  options: [
    'Rely on Anthropic\'s built-in per-tenant rate limiting.',
    'Implement your own rate limiter per tenant before calling the Anthropic API, and use metadata.user_id for attribution.',
    'Create a separate Anthropic API key per tenant.',
    'Use the organization ID field in the request.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Anthropic rate limit tính theo API key/organization, không tự động tách theo tenant của bạn. Bạn phải tự implement rate limiter ở lớp ứng dụng (per tenant), và dùng metadata: {user_id: "tenant_123"} trong request để Anthropic ghi nhận sử dụng cho attribution/analytics. Tạo key riêng cho từng tenant khó quản lý và tốn chi phí. Không có trường organization ID trong request Messages API.`
},
{
  id: 'qz-ccdv-118',
  topic: 'claude',
  multi: true,
  q: '[Security] Which statements about API key rotation are true? (Choose 2)',
  options: [
    'Rotate keys periodically (e.g., every 90 days) and revoke old keys immediately after verifying the new one works.',
    'Store the current key in plaintext in the application config file for easy access.',
    'Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) to store and rotate keys without code changes.',
    'Share the same API key across development, staging, and production for consistency.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** (1) Quay vòng key định kỳ (90 ngày), thu hồi key cũ ngay sau khi key mới hoạt động. (3) Dùng secrets manager: lưu key an toàn, tự động quay vòng, ứng dụng đọc từ secret manager (không hardcode). Không lưu plaintext trong config file. Môi trường dev/staging/prod phải dùng key riêng để tách biệt quota, audit, và giảm thiểu tác động khi key bị lộ.`
},
{
  id: 'qz-ccdv-119',
  topic: 'claude',
  q: '[Security] A user uploads a document containing credit card numbers. You send it to Claude for summarization. What is the compliance risk?',
  options: [
    'No risk; Anthropic does not store API data.',
    'Credit card data (PCI DSS) is sent to Anthropic servers, potentially violating data residency and compliance requirements unless you have a BAA/DPAddendum and tokenize the data first.',
    'Only the summary is sent to Anthropic; the document stays on your server.',
    'The risk is minimal because the API uses TLS encryption.'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phương án 2.** Dữ liệu thẻ tín dụng (PCI DSS) gửi lên Anthropic = dữ liệu nhạy cảm rời khỏi hạ tầng bạn. Cần: (1) Tokenize/mask số thẻ trước khi gửi (chỉ gửi bản đã làm mờ). (2) Kiểm tra BAA (Business Associate Agreement) / Data Processing Addendum với Anthropic nếu xử lý PII/PCI/HIPAA. (3) Data residency: server Anthropic có thể ở region khác. TLS chỉ bảo vệ truyền tải, không giải quyết compliance lưu trữ/xử lý.`
},
{
  id: 'qz-ccdv-120',
  topic: 'claude',
  multi: true,
  q: '[Security] You build a coding agent that can read/write files and run shell commands via tools. Which safety measures are essential? (Choose 2)',
  options: [
    'Run the agent in a sandboxed container with no network access and read-only access to non-project directories.',
    'Give the agent full root access to the host for maximum flexibility.',
    'Require human approval (confirmation UI) before any write or shell command executes.',
    'Disable all tools and let the agent only output code snippets.'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: phương án 1 và 3.** (1) Sandbox container: cô lập filesystem, không internet, giới hạn quyền — hạn chế thiệt hại nếu agent bị prompt injection hoặc lỗi logic. (2) Human-in-the-loop: bắt buộc xác nhận trước hành động ghi file/chạy lệnh (irreversible actions). Root access (2) cực kỳ nguy hiểm. Tắt tool (4) làm mất tính năng agent. Cả sandbox và approval đều cần thiết (defense in depth).`
}
);