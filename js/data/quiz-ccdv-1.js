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
}
);