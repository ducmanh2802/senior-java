/* Topic: claude — Claude Certified Developer – Foundations (owner: T316/T317). Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'claude-001',
  topic: 'claude',
  level: 'mid',
  q: 'Giải thích cấu trúc một request và response của Claude Messages API. Vì sao nói API này "stateless", và điều đó ảnh hưởng thế nào tới cách bạn viết chatbot?',
  a: `**Tóm tắt:** Mọi thứ đi qua một endpoint {{POST /v1/messages}}: request gồm {{model}}, {{max_tokens}}, {{system}} (tuỳ chọn) và mảng {{messages}} xen kẽ user/assistant; response trả về mảng {{content}} gồm các block (text, tool_use, thinking…), {{stop_reason}} và {{usage}}. API **không nhớ gì giữa các request**, nên client phải tự gửi lại toàn bộ lịch sử mỗi lượt.

### Hiểu nhanh
Hãy tưởng tượng bạn gọi tổng đài mà mỗi lần gọi lại gặp một nhân viên mới hoàn toàn: muốn họ hiểu, bạn phải đọc lại cả biên bản cuộc gọi trước. Claude API cũng vậy: mỗi request là một "cuộc gọi mới", và mảng {{messages}} chính là biên bản bạn đọc lại.

### Thuật ngữ
- **Token**: đơn vị văn bản model xử lý (khoảng một mẩu từ). Giá và giới hạn đều tính theo token.
- **Content block**: một phần của tin nhắn, có {{type}} riêng: {{text}}, {{image}}, {{document}}, {{tool_use}}, {{tool_result}}, {{thinking}}…
- **Context window**: tổng số token tối đa model "nhìn thấy" trong một request (input + output). Các model hiện hành là 1M token.
- **stop_reason**: lý do model dừng sinh ({{end_turn}}, {{max_tokens}}, {{tool_use}}, {{pause_turn}}, {{refusal}}, {{stop_sequence}}).

### Request và response trông thế nào
~~~json
POST https://api.anthropic.com/v1/messages
x-api-key: <key>
anthropic-version: 2023-06-01
content-type: application/json

{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": "Bạn là trợ lý hỗ trợ khách hàng của shop X. Trả lời ngắn gọn.",
  "messages": [
    { "role": "user", "content": "Đơn 123 của tôi đâu rồi?" },
    { "role": "assistant", "content": "Đơn 123 đang được giao, dự kiến mai tới." },
    { "role": "user", "content": "Đổi địa chỉ được không?" }
  ]
}
~~~
~~~json
{
  "id": "msg_01...",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-5-5",
  "content": [ { "type": "text", "text": "Được, bạn gửi giúp mình địa chỉ mới nhé." } ],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 85, "output_tokens": 18 }
}
~~~

### Từng bước khi viết chatbot
1. Lưu lịch sử hội thoại **ở phía bạn** (DB, Redis, session) theo conversation id. API không có khái niệm conversation id.
2. Mỗi lượt: append tin nhắn user mới vào lịch sử, gửi **cả mảng** lên API.
3. Đọc {{content}} của response: lặp qua từng block, chỉ lấy {{text}} khi {{type}} là text. Đừng giả định block đầu tiên luôn là text, vì có thể có thinking hoặc tool_use.
4. Append **nguyên nội dung assistant** vào lịch sử để lượt sau gửi lại.
5. Khi lịch sử dài gần chạm context window: tóm tắt các lượt cũ, hoặc dùng compaction phía server (beta).

### Lỗi hay gặp
- **Chỉ gửi tin nhắn mới nhất** → model "quên" ngữ cảnh, trả lời lạc đề ở lượt 2–3.
- **Chỉ lưu phần text của assistant** khi có tool_use/thinking/compaction → lượt sau lỗi hoặc mất trạng thái. Hãy lưu nguyên mảng content.
- **Đặt max_tokens quá thấp** → câu trả lời bị cắt, {{stop_reason}} là {{max_tokens}}.
- **Mảng messages bắt đầu bằng assistant** → không hợp lệ; tin nhắn đầu phải là user.

### Trả lời miệng 1 phút
"Messages API là một endpoint duy nhất, nhận model, max_tokens, system prompt và mảng messages user/assistant, trả về các content block cùng stop_reason và usage. Điểm quan trọng nhất là nó stateless: server không giữ hội thoại, nên tôi lưu lịch sử ở backend và gửi lại toàn bộ mỗi lượt. Hệ quả là chi phí input tăng theo độ dài hội thoại, nên tôi dùng prompt caching cho phần đầu ổn định và tóm tắt lịch sử khi gần đầy context. Khi parse response tôi luôn kiểm tra type của từng block và stop_reason, không giả định chỉ có text."

> Senior tip: log {{usage}} (input, output, cache read/write) của **mọi** request theo user và tính năng ngay từ ngày đầu. Đó là dữ liệu duy nhất giúp bạn trả lời câu "tính năng này tốn bao nhiêu tiền" khi hoá đơn tăng.`,
  follow: ['Nếu hội thoại có tool_use, bạn lưu lịch sử thế nào để lượt sau không lỗi?', 'Chi phí input tăng theo số lượt — bạn giảm nó bằng cách nào?'],
  tags: ['Messages API', 'stateless', 'content block', 'usage']
},
{
  id: 'claude-002',
  topic: 'claude',
  level: 'mid',
  q: 'Có những giá trị stop_reason nào trong Claude Messages API? Với mỗi giá trị, code backend của bạn nên xử lý ra sao?',
  a: `**Tóm tắt:** {{stop_reason}} cho biết **vì sao** model dừng: {{end_turn}} (xong tự nhiên), {{max_tokens}} (chạm trần output, bị cắt), {{stop_sequence}} (gặp chuỗi dừng bạn đặt), {{tool_use}} (muốn gọi tool), {{pause_turn}} (tạm dừng giữa vòng server tool, cần gửi tiếp) và {{refusal}} (từ chối vì an toàn). Code đúng là **luôn kiểm tra stop_reason trước khi dùng content**.

### Hiểu nhanh
Giống đèn báo trên bảng điều khiển ô tô: xe dừng có thể vì tới nơi (end_turn), hết xăng (max_tokens), cần đổ thêm thứ gì đó rồi đi tiếp (tool_use, pause_turn) hay vì bị chặn đường (refusal). Mỗi đèn cần một hành động khác nhau.

### Thuật ngữ
- **Stop sequence**: chuỗi bạn truyền trong {{stop_sequences}}; khi model sinh ra chuỗi đó thì dừng.
- **Server tool**: tool chạy trên hạ tầng Anthropic (web search, web fetch, code execution).
- **stop_details**: object kèm theo khi {{stop_reason}} là {{refusal}}, có {{category}} và {{explanation}}.

### Xử lý từng trường hợp
| stop_reason | Ý nghĩa | Backend nên làm |
|---|---|---|
| end_turn | Model trả lời xong | Dùng content bình thường |
| max_tokens | Bị cắt giữa chừng | Không coi là hoàn chỉnh; gọi lại với max_tokens lớn hơn (stream nếu dài) hoặc yêu cầu ngắn hơn; với JSON thì đừng parse |
| stop_sequence | Gặp chuỗi dừng | Đọc field {{stop_sequence}} để biết chuỗi nào, xử lý theo quy ước của bạn |
| tool_use | Muốn gọi tool của bạn | Chạy tool, gửi tool_result, gọi tiếp API (vòng lặp agent) |
| pause_turn | Server tool tạm dừng | Gửi lại nguyên content assistant để API tiếp tục |
| refusal | Từ chối vì an toàn | Đọc stop_details, báo người dùng thân thiện, có thể bật fallback model |

### Ví dụ code (Java, giả lập)
~~~java
switch (resp.stopReason()) {
  case "end_turn", "stop_sequence" -> render(resp.text());
  case "tool_use" -> loop.runToolsAndContinue(resp);       // xem vòng lặp agent
  case "pause_turn" -> loop.resend(resp.content());       // gửi lại để server tool chạy tiếp
  case "max_tokens" -> {                                   // đừng parse JSON dở dang
      metrics.counter("claude.truncated").increment();
      retryWithLargerBudgetOrAskShorter(req);
  }
  case "refusal" -> showPolicyMessage(resp.stopDetails()); // không retry vô hạn
  default -> throw new IllegalStateException("stop_reason lạ: " + resp.stopReason());
}
~~~

### Lỗi hay gặp
- **Chỉ đọc content[0].text** mà không xem stop_reason → hiển thị câu trả lời cụt, hoặc parse JSON dở dang rồi lỗi.
- **Retry cùng request khi max_tokens** → bị cắt y hệt lần trước.
- **Retry vô hạn khi refusal** → tốn tiền và vẫn bị từ chối.
- **Coi pause_turn là lỗi** → mất kết quả web search hay code execution đang chạy dở.

### Trả lời miệng 1 phút
"Tôi luôn switch theo stop_reason trước khi dùng content. end_turn thì dùng bình thường. max_tokens nghĩa là output bị cắt nên tôi không parse, mà gọi lại với trần lớn hơn hoặc yêu cầu ngắn lại, và có metric đếm số lần bị cắt. tool_use là tín hiệu chạy vòng lặp agent: thực thi tool, gửi tool_result với đúng tool_use_id rồi gọi tiếp. pause_turn là server tool tạm dừng, chỉ cần gửi lại content để chạy tiếp. Còn refusal thì đọc stop_details, báo người dùng và có thể bật fallback, tuyệt đối không retry mù quáng."

> Senior tip: đặt alert khi tỉ lệ {{max_tokens}} vượt khoảng 1–2% request của một route: đó thường là dấu hiệu prompt đổi hoặc dữ liệu đầu vào to lên, và người dùng đang nhận câu trả lời cụt mà không ai biết.`,
  follow: ['Nếu output là JSON mà bị max_tokens thì bạn xử lý thế nào để không vỡ hệ thống?', 'Khác nhau giữa tool_use và pause_turn là gì?'],
  tags: ['stop_reason', 'max_tokens', 'refusal', 'pause_turn']
},
{
  id: 'claude-003',
  topic: 'claude',
  level: 'senior',
  q: 'Bạn cần hiển thị câu trả lời của Claude "chạy chữ" như ChatGPT. Streaming của Messages API hoạt động thế nào, gồm những event gì, và bạn xử lý ở backend Java ra sao?',
  a: `**Tóm tắt:** Đặt {{"stream": true}}, API trả về **Server-Sent Events (SSE)** theo thứ tự: {{message_start}} → với mỗi block {{content_block_start}} → nhiều {{content_block_delta}} → {{content_block_stop}} → {{message_delta}} (có stop_reason, usage) → {{message_stop}}; xen kẽ có {{ping}}, và có thể có {{error}} giữa chừng. Backend đọc từng event, đẩy {{delta.text}} xuống trình duyệt ngay.

### Hiểu nhanh
Không streaming giống chờ in xong cả cuốn sách mới đưa bạn. Streaming là đưa từng trang ngay khi in xong: người dùng thấy chữ sau vài trăm mili giây thay vì chờ 20 giây cho câu trả lời dài.

### Thuật ngữ
- **SSE (Server-Sent Events)**: HTTP response giữ kết nối mở, server gửi nhiều dòng dạng {{event: …}} + {{data: …}}.
- **Delta**: phần thay đổi nhỏ. Với text là {{text_delta}}; với input của tool là {{input_json_delta}} (một mẩu chuỗi JSON); với thinking là {{thinking_delta}}.
- **TTFT (time to first token)**: thời gian tới token đầu tiên, chỉ số cảm nhận tốc độ quan trọng nhất của chat.

### Luồng event
~~~text
event: message_start        -> id, model, usage ban đầu
event: content_block_start  -> index 0, type text
event: content_block_delta  -> {"type":"text_delta","text":"Xin "}
event: content_block_delta  -> {"type":"text_delta","text":"chào"}
event: ping                 -> giữ kết nối, bỏ qua
event: content_block_stop   -> index 0 xong
event: message_delta        -> stop_reason: end_turn, usage.output_tokens
event: message_stop         -> kết thúc
~~~

### Xử lý ở backend Spring (ý tưởng)
1. Backend gọi Claude với stream (qua SDK Java chính thức, hoặc HTTP client đọc từng dòng SSE).
2. Mở một kênh tới trình duyệt: {{SseEmitter}} (Spring MVC) hoặc {{Flux}} (WebFlux).
3. Mỗi {{content_block_delta}} kiểu text → gửi ngay xuống client.
4. Gom toàn bộ text để lưu lịch sử khi xong; đọc stop_reason và usage ở {{message_delta}}.
5. Nếu nhận event {{error}} giữa chừng (ví dụ overloaded): báo client, **không** lưu câu trả lời dở như thể hoàn chỉnh.
~~~java
// Spring MVC: chuyển tiếp từng mẩu text tới trình duyệt
@GetMapping("/chat/stream")
public SseEmitter stream(@RequestParam String q) {
    SseEmitter emitter = new SseEmitter(120_000L);       // timeout 2 phút
    executor.submit(() -> {
        StringBuilder full = new StringBuilder();
        try {
            claude.stream(buildRequest(q), event -> {     // callback cho từng SSE event
                if (event.isTextDelta()) {
                    full.append(event.text());
                    emitter.send(event.text());           // đẩy ngay, không đợi hết
                }
            });
            history.save(q, full.toString());
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);                 // đừng lưu câu trả lời dở
        }
    });
    return emitter;
}
~~~
(Lớp {{claude.stream}} ở đây là wrapper của bạn; khi dùng SDK chính thức hãy xem tài liệu SDK Java cho đúng tên method.)

### Khi nào nên stream
- Chat, trợ lý viết: luôn nên, vì cải thiện cảm nhận tốc độ rất nhiều.
- **Output dài hoặc max_tokens lớn**: nên stream để tránh timeout HTTP (SDK yêu cầu stream với max_tokens rất lớn).
- Job nền cần JSON hoàn chỉnh: không cần stream, hoặc stream rồi lấy message cuối.

### Lỗi hay gặp
- **Proxy/Nginx buffer response** → người dùng vẫn thấy chữ hiện một lần. Cần tắt buffering (ví dụ header {{X-Accel-Buffering: no}}).
- **Parse input_json_delta từng mẩu như JSON hoàn chỉnh** → lỗi; phải nối chuỗi tới khi block stop rồi mới parse.
- **Không xử lý event error giữa chừng** → lưu câu trả lời cụt vào DB.
- **Giữ thread chờ quá lâu** trên server servlet → cạn thread pool khi đông người dùng; cân nhắc WebFlux hoặc virtual threads.

### Trả lời miệng 1 phút
"Tôi bật stream true, API trả SSE với thứ tự message_start, rồi content_block_start, nhiều content_block_delta, content_block_stop, rồi message_delta chứa stop_reason và usage, cuối cùng message_stop. Backend Spring mở SseEmitter hoặc Flux tới trình duyệt và đẩy từng text_delta ngay khi nhận, đồng thời gom text để lưu khi xong. Tôi xử lý cả event error giữa chừng và không lưu câu trả lời dở. Với tool, input đến dạng input_json_delta nên tôi nối chuỗi rồi mới parse. Ngoài ra phải tắt buffering ở proxy, nếu không streaming vô nghĩa."

> Senior tip: đo **TTFT** và **thời gian tới token cuối** riêng biệt trên dashboard. Người dùng phàn nàn "chậm" thường là do TTFT (prompt quá dài, không cache), còn tổng thời gian dài là do output dài.`,
  follow: ['Làm sao hiển thị tiến trình khi Claude đang gọi tool trong lúc stream?', 'Với 5.000 người dùng stream đồng thời, bạn chọn Spring MVC hay WebFlux, vì sao?'],
  tags: ['streaming', 'SSE', 'content_block_delta', 'Spring']
},
{
  id: 'claude-004',
  topic: 'claude',
  level: 'senior',
  q: 'Ứng dụng của bạn thỉnh thoảng nhận lỗi 429 và 529 từ Claude API. Hai lỗi này khác nhau thế nào và bạn thiết kế retry ra sao cho an toàn?',
  a: `**Tóm tắt:** **429 rate_limit_error** nghĩa là **bạn** vượt hạn mức của tổ chức (request/phút hoặc token/phút) — có header {{retry-after}}; **529 overloaded_error** nghĩa là **phía Anthropic** đang quá tải tạm thời. Cả hai đều retry được, bằng **exponential backoff + jitter**, có giới hạn số lần và tổng thời gian; còn 400/401/403/404 thì **không** retry.

### Hiểu nhanh
429 giống quán ăn nói "bàn của anh đã gọi đủ món trong giờ này, chờ 30 giây nữa". 529 giống "bếp đang quá đông, chờ chút". Cả hai đều là "chờ rồi thử lại", nhưng 429 là do bạn gọi nhiều quá (cần tự giảm tốc), còn 529 không phải lỗi của bạn.

### Thuật ngữ
- **Exponential backoff**: mỗi lần thử lại chờ lâu gấp đôi: 1s, 2s, 4s, 8s…
- **Jitter**: cộng một khoảng ngẫu nhiên vào thời gian chờ để hàng nghìn client không thử lại **cùng lúc** (thundering herd).
- **Circuit breaker**: "cầu dao". Lỗi liên tục quá ngưỡng thì ngắt, không gọi nữa trong một khoảng, trả fallback ngay.
- **Idempotent**: gọi lại nhiều lần cho cùng kết quả, không gây tác dụng phụ lặp.

### Bảng mã lỗi chính
| HTTP | error.type | Retry? |
|---|---|---|
| 400 | invalid_request_error | Không: sửa request |
| 401 | authentication_error | Không: key sai |
| 403 | permission_error | Không |
| 404 | not_found_error | Không: model/endpoint sai |
| 413 | request_too_large | Không: giảm kích thước |
| 429 | rate_limit_error | Có: theo retry-after |
| 500 | api_error | Có: backoff |
| 529 | overloaded_error | Có: backoff |

Body lỗi có dạng:
~~~json
{ "type": "error", "error": { "type": "rate_limit_error", "message": "..." } }
~~~

### Thiết kế retry từng bước
1. Phân loại lỗi như bảng trên; chỉ retry 429, 5xx, 529 và lỗi kết nối/timeout.
2. Với 429: chờ **ít nhất** {{retry-after}} giây.
3. Với 5xx/529: backoff {{min(cap, base × 2^attempt)}} cộng jitter ngẫu nhiên.
4. Giới hạn: tối đa 3–5 lần **và** tổng thời gian (ví dụ 60s cho request người dùng đang chờ).
5. Bọc ngoài bằng circuit breaker: lỗi quá 50% trong 1 phút thì mở mạch, trả thông báo "AI đang bận" hoặc chuyển sang model/nhà cung cấp dự phòng.
6. Hết lượt retry: trả lỗi thân thiện cho người dùng, log request id ({{request-id}} header) để báo Anthropic nếu cần.

~~~java
// Resilience4j: retry có backoff + jitter, chỉ cho lỗi retry được
RetryConfig cfg = RetryConfig.custom()
    .maxAttempts(4)
    .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(1000, 2.0, 0.5)) // 1s, 2s, 4s ± 50%
    .retryOnException(e -> e instanceof ClaudeHttpException ex
        && (ex.status() == 429 || ex.status() >= 500))   // 529 cũng >= 500
    .build();
Retry retry = Retry.of("claude", cfg);
CircuitBreaker cb = CircuitBreaker.ofDefaults("claude");
Supplier<Answer> call = Retry.decorateSupplier(retry,
        CircuitBreaker.decorateSupplier(cb, () -> claude.ask(req)));
~~~

### Lỗi hay gặp
- **Retry ngay lập tức, không jitter** → hàng loạt client dội lại cùng giây, 429/529 kéo dài hơn.
- **Retry cả 400** → tốn tiền vô ích, lỗi vẫn y nguyên.
- **Retry chồng retry**: SDK mặc định đã retry 2 lần (408/409/429/5xx), bạn lại bọc thêm 5 lần → 18 lần gọi cho một request. Hãy chọn một tầng chịu trách nhiệm retry.
- **Nhiều instance cùng tiêu chung một hạn mức** mà không có hàng đợi chung → 429 liên tục khi tải cao.

### Trả lời miệng 1 phút
"429 là tôi vượt hạn mức của tổ chức, server trả retry-after nên tôi chờ đúng thời gian đó và giảm tốc gửi. 529 là Anthropic quá tải tạm thời, không phải lỗi của tôi. Cả hai tôi retry bằng exponential backoff có jitter, tối đa vài lần và có trần tổng thời gian; 400, 401, 404 thì không bao giờ retry. Bên ngoài có circuit breaker để khi lỗi kéo dài thì trả thông báo hoặc chuyển model dự phòng thay vì treo request. Tôi cũng chú ý SDK đã tự retry 2 lần nên không bọc thêm nhiều tầng."

> Senior tip: khi tải cao, **xếp hàng phía bạn** (queue + worker giới hạn concurrency theo hạn mức token/phút) rẻ và ổn định hơn nhiều so với để 429 xảy ra rồi retry. Retry chỉ là lưới an toàn, không phải cơ chế điều tiết lưu lượng.`,
  follow: ['Làm sao biết mình sắp chạm rate limit trước khi bị 429?', 'Request đang stream thì bị lỗi overloaded giữa chừng, bạn làm gì?'],
  tags: ['429', '529', 'retry', 'backoff', 'circuit breaker']
},
{
  id: 'claude-005',
  topic: 'claude',
  level: 'senior',
  q: 'Rate limit của Claude API được tính theo những chiều nào? Bạn thiết kế hệ thống nhiều instance để không bị 429 khi lượng người dùng tăng gấp 10 lần thế nào?',
  a: `**Tóm tắt:** Hạn mức áp theo tổ chức/workspace và theo nhóm model, gồm **số request mỗi phút (RPM)**, **input token mỗi phút (ITPM)** và **output token mỗi phút (OTPM)**; vượt chiều nào cũng bị 429. Response có các header {{anthropic-ratelimit-*}} cho biết còn bao nhiêu. Để chịu tải gấp 10, cần **hàng đợi + điều tiết tập trung** theo token, giảm token bằng caching, và đẩy việc không gấp sang Batch API.

### Hiểu nhanh
Giống thẻ đi xe buýt giới hạn "tối đa 50 lượt và 2.000 km mỗi giờ": hết lượt hay hết km đều bị chặn. Với Claude, "lượt" là request, còn "km" là token input/output. Hệ thống tốt là có người điều phối xếp hàng, không để mọi người chen lên cùng lúc rồi bị đuổi xuống.

### Thuật ngữ
- **RPM / ITPM / OTPM**: requests / input tokens / output tokens per minute.
- **Token bucket**: thuật toán điều tiết: cái xô được rót token đều đặn, mỗi request lấy bớt token; xô rỗng thì phải chờ.
- **Workspace**: nhóm API key trong tổ chức, có thể đặt hạn mức riêng.

### Header cần đọc
~~~text
anthropic-ratelimit-requests-limit / -remaining / -reset
anthropic-ratelimit-input-tokens-limit / -remaining / -reset
anthropic-ratelimit-output-tokens-limit / -remaining / -reset
retry-after   (khi bị 429)
~~~
Ghi chú: với đa số model hiện hành, token đọc từ prompt cache **không tính** vào ITPM. Đây là một lý do nữa để cache phần prompt cố định (kiểm tra lại trang Rate limits cho model bạn dùng).

### Thiết kế cho tải gấp 10
1. **Đo trước:** mỗi request trung bình bao nhiêu input/output token, theo route. Nhân với QPS dự kiến để so với hạn mức.
2. **Hàng đợi tập trung:** các instance không gọi Claude trực tiếp mà đẩy job vào queue (Redis/SQS/Kafka); một nhóm worker lấy job theo **token bucket dùng chung** (ví dụ Redis + Lua) với tốc độ thấp hơn hạn mức khoảng 10–20%.
3. **Ưu tiên:** request người dùng đang chờ (chat) có hàng ưu tiên cao; job nền (tóm tắt, phân loại hàng loạt) chuyển sang **Message Batches API** (bất đồng bộ, rẻ hơn 50%).
4. **Giảm token:** prompt caching cho system prompt/tài liệu; cắt lịch sử; giới hạn max_tokens hợp lý.
5. **Chọn model theo route:** việc đơn giản dùng Haiku/Sonnet; mỗi nhóm model có hạn mức riêng.
6. **Phản hồi khi đầy:** khi hàng đợi quá dài, trả "đang bận, thử lại sau" sớm thay vì để request treo rồi timeout.
7. **Nâng hạn mức:** hạn mức tăng theo tier sử dụng; với tải lớn ổn định, liên hệ Anthropic.

~~~text
[API instances] --enqueue--> [Queue: high | low] --> [Workers]
                                                     |  token bucket dùng chung (Redis)
                                                     v
                                               Claude Messages API
[Job nền hàng loạt] ------------------------------> Message Batches API
~~~

### Lỗi hay gặp
- **Mỗi instance tự giới hạn riêng**: 10 instance × "an toàn" = vượt hạn mức chung.
- **Chỉ đếm request, quên token**: vài request với tài liệu 200K token đủ ăn hết ITPM.
- **max_tokens đặt rất lớn "cho chắc"**: một số cách tính hạn mức dựa trên ước lượng output; hãy để max_tokens sát nhu cầu thực.
- **Retry đồng loạt khi 429** mà không có jitter → bão retry.

### Trả lời miệng 1 phút
"Hạn mức tính theo ba chiều là request, input token và output token mỗi phút, vượt chiều nào cũng 429, và response có header ratelimit remaining để theo dõi. Khi tải tăng gấp 10, tôi không để từng instance gọi thẳng mà đưa qua hàng đợi với token bucket dùng chung trong Redis, chạy thấp hơn hạn mức một chút. Việc không gấp tôi chuyển sang Batch API, rẻ hơn một nửa. Tôi giảm token bằng prompt caching, cắt lịch sử và chọn model nhỏ cho route đơn giản. Khi hàng đợi quá dài thì trả lỗi bận sớm thay vì để timeout."

> Senior tip: vẽ dashboard **remaining tokens / limit** theo thời gian, lấy từ header response. Nó báo trước 429 vài phút và là bằng chứng số liệu tốt nhất khi xin tăng hạn mức.`,
  follow: ['Token bucket trong Redis bạn cài thế nào để atomic giữa nhiều worker?', 'Khi nào chuyển một tính năng sang Batch API?'],
  tags: ['rate limit', 'ITPM', 'queue', 'token bucket']
},
{
  id: 'claude-006',
  topic: 'claude',
  level: 'senior',
  q: 'Prompt caching của Claude hoạt động thế nào? Bạn đặt cache_control ở đâu cho một chatbot có system prompt dài 20K token và tài liệu sản phẩm 50K token?',
  a: `**Tóm tắt:** Prompt caching lưu lại phần **đầu (prefix)** của prompt đã xử lý. Request sau có prefix **giống từng byte** sẽ đọc từ cache: rẻ khoảng 10 lần và nhanh hơn. Thứ tự render là {{tools}} → {{system}} → {{messages}}; đánh dấu {{cache_control}} (kiểu {{ephemeral}}) ở **cuối phần ổn định** (tối đa 4 breakpoint); TTL mặc định 5 phút (có tuỳ chọn 1 giờ), mỗi lần dùng lại thì TTL được làm mới.

### Hiểu nhanh
Giống bạn chuẩn bị bài thuyết trình: phần giới thiệu công ty (dài, lần nào cũng giống) đã in sẵn, chỉ phần trả lời câu hỏi là viết mới. Cache là "bản in sẵn". Nhưng chỉ cần sửa **một chữ** ở trang đầu là phải in lại từ đầu, vì cache khớp theo prefix.

### Thuật ngữ
- **Prefix**: đoạn đầu của prompt tính từ token đầu tiên tới breakpoint.
- **Breakpoint**: vị trí đặt {{cache_control}}; mọi thứ **trước** nó được cache.
- **Cache write / cache read**: lần đầu ghi (đắt hơn input thường khoảng 1.25x với TTL 5 phút, khoảng 2x với TTL 1 giờ) / các lần sau đọc (khoảng 0.1x, tuỳ model).
- **TTL**: thời gian sống của cache nếu không ai dùng.

### Đặt breakpoint cho ví dụ
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "system": [
    { "type": "text", "text": "<system prompt 20K token: vai trò, chính sách...>" },
    { "type": "text", "text": "<tài liệu sản phẩm 50K token>",
      "cache_control": { "type": "ephemeral" } }
  ],
  "messages": [
    { "role": "user", "content": "Máy lọc X có bảo hành bao lâu?" }
  ]
}
~~~
1. Phần tĩnh (system + tài liệu = 70K token) đặt **trước**, breakpoint ở block cuối của phần tĩnh.
2. Câu hỏi người dùng (thay đổi mỗi lần) nằm **sau** breakpoint.
3. Với hội thoại nhiều lượt, có thể thêm breakpoint thứ hai ở tin nhắn gần cuối, để cả lịch sử cũ cũng được cache khi hội thoại dài dần. Cách đơn giản hơn là dùng **automatic caching**: đặt {{cache_control}} ở top-level request, API tự đặt breakpoint vào block cuối cùng có thể cache.

### Tính thử tiền
Giả sử 1.000 câu hỏi/giờ, 70K token tĩnh, giá input $2/MTok (Sonnet 5.5), cache read $0.20/MTok:
- **Không cache:** 1.000 × 70K = 70M token × $2 = **$140/giờ**.
- **Có cache** (được làm mới liên tục, bỏ qua vài lần write): 70M × $0.20 = **$14/giờ**, cộng chi phí write nhỏ.

Đó là lý do caching là "free win" đầu tiên khi tối ưu chi phí.

### Cách kiểm tra
Xem {{usage}} của response:
- {{cache_creation_input_tokens}}: token vừa được ghi vào cache.
- {{cache_read_input_tokens}}: token đọc từ cache (con số này phải lớn ở các request sau).
- {{input_tokens}}: phần không cache (câu hỏi mới).

### Lỗi hay gặp
- **Prefix quá ngắn**: dưới ngưỡng tối thiểu (tuỳ model, khoảng 512–4096 token) thì **không cache, và không báo lỗi**.
- **Đặt câu hỏi người dùng trước tài liệu** → prefix thay đổi mỗi request, cache vô dụng.
- **Nhét timestamp hoặc id request vào system prompt** → prefix đổi từng byte, cache hit bằng 0.
- **Đổi danh sách tools hoặc thứ tự tools** giữa các request → tools nằm đầu prefix nên làm vỡ toàn bộ cache.

### Trả lời miệng 1 phút
"Prompt caching lưu prefix của prompt; request sau có prefix giống hệt sẽ đọc từ cache với giá khoảng một phần mười và độ trễ thấp hơn. Thứ tự render là tools, system rồi messages, nên tôi đặt mọi thứ ổn định như system prompt và tài liệu lên trước, gắn cache_control ở block cuối phần ổn định, còn câu hỏi người dùng nằm sau. TTL mặc định 5 phút và được làm mới mỗi lần dùng, có thể chọn 1 giờ nếu lưu lượng thưa. Tôi kiểm chứng bằng cache_read_input_tokens trong usage, và cảnh giác các thứ làm vỡ prefix như timestamp hay thay đổi thứ tự tools."

> Senior tip: theo dõi **tỉ lệ cache hit** = cache_read / (cache_read + cache_creation + input) theo route. Khi tỉ lệ đột ngột giảm sau một lần deploy, gần như chắc chắn có ai đó vừa đưa dữ liệu động vào system prompt.`,
  follow: ['Khi nào nên dùng TTL 1 giờ thay vì 5 phút?', 'Hội thoại nhiều lượt thì đặt breakpoint thế nào để cache cả lịch sử?'],
  tags: ['prompt caching', 'cache_control', 'TTL', 'chi phí']
},
{
  id: 'claude-007',
  topic: 'claude',
  level: 'senior',
  q: 'Sau khi bật prompt caching, dashboard cho thấy cache_read_input_tokens gần như luôn bằng 0. Bạn điều tra nguyên nhân thế nào?',
  a: `**Tóm tắt:** Cache khớp theo **prefix từng byte**, nên hit bằng 0 nghĩa là prefix thay đổi giữa các request, hoặc prefix chưa đủ dài, hoặc cache hết hạn trước khi được dùng lại. Điều tra bằng cách **diff body của hai request liên tiếp**, kiểm tra độ dài prefix so với ngưỡng tối thiểu, kiểm tra khoảng cách thời gian giữa các request so với TTL, và kiểm tra model, tools và tham số có cố định không.

### Hiểu nhanh
Cache giống ổ khoá chỉ mở bằng đúng chìa. Chìa lệch một răng (một ký tự, một dấu cách, thứ tự trường JSON khác) là không mở được. Việc điều tra là đặt hai chìa cạnh nhau tìm răng lệch.

### Thuật ngữ
- **Silent invalidator**: thứ làm vỡ cache mà không gây lỗi nào, như timestamp, UUID hay JSON không sắp xếp khoá.
- **Cache namespace**: cache tách riêng theo model (và workspace). Đổi model là cache khác.

### Checklist điều tra theo thứ tự
1. **Log body request** (đã che dữ liệu nhạy cảm) của 2 request liên tiếp trên cùng route, rồi diff phần trước breakpoint.
2. **Dữ liệu động trong system**: "Hôm nay là 28/10 14:03:22", id người dùng, số dư tài khoản… Hãy chuyển xuống sau breakpoint hoặc vào tin nhắn user.
3. **Serialize không ổn định**: đổ map/object ra JSON mà không cố định thứ tự khoá (HashMap trong Java!) → thứ tự đổi giữa các lần. Dùng {{LinkedHashMap}}/{{TreeMap}} hoặc cấu hình ObjectMapper sắp xếp khoá.
4. **Danh sách tools thay đổi**: thêm hoặc bớt tool theo quyền người dùng, hay đổi thứ tự. Tools nằm **đầu** prefix nên vỡ toàn bộ. Giải pháp là giữ một bộ tools cố định, kiểm soát quyền ở tầng thực thi.
5. **Prefix dưới ngưỡng tối thiểu** của model: không cache và không báo lỗi.
6. **Khoảng cách giữa các request > TTL** (mặc định 5 phút): lưu lượng thưa nên cache hết hạn. Hãy dùng TTL 1 giờ, hoặc chấp nhận không cache cho route này.
7. **Đổi model / tham số giữa các request** (ví dụ A/B test nhiều model): mỗi model một cache.
8. **Breakpoint đặt sai chỗ**: đặt ở tin nhắn cuối mà nội dung đó luôn mới, nên không có gì để đọc lại.

~~~java
// Bẫy kinh điển: HashMap → thứ tự khoá JSON không cố định
Map<String, Object> ctx = new HashMap<>(user.attributes());   // xấu
String sys = BASE_PROMPT + mapper.writeValueAsString(ctx);    // prefix đổi giữa các JVM/lần chạy

// Sửa: dữ liệu theo user đi SAU breakpoint, trong tin nhắn user
List<Block> system = List.of(text(BASE_PROMPT).cached());     // ổn định tuyệt đối
String userMsg = "Ngữ cảnh: " + sortedJson(ctx) + "\nCâu hỏi: " + question;
~~~

### Lỗi hay gặp
- **Nghĩ rằng "gần giống" là đủ**: cache không khớp mờ.
- **Chỉ nhìn tổng chi phí**: hãy nhìn tỉ lệ cache read theo từng route để thấy route nào đang vỡ.
- **Đặt quá 4 breakpoint**: tối đa 4 mỗi request.

### Trả lời miệng 1 phút
"Cache khớp theo prefix từng byte nên hit bằng 0 nghĩa là prefix đang thay đổi. Tôi log hai request liên tiếp rồi diff phần trước breakpoint; thủ phạm thường là timestamp hay dữ liệu người dùng trong system prompt, JSON serialize với thứ tự khoá không cố định, hoặc danh sách tools thay đổi theo người dùng. Sau đó tôi kiểm tra prefix có vượt ngưỡng tối thiểu không và lưu lượng có thưa hơn TTL 5 phút không; nếu thưa thì cân nhắc TTL 1 giờ. Cuối cùng xác nhận model không đổi giữa các request, vì cache tách riêng theo model."

> Senior tip: viết một **test tự động** dựng request hai lần với dữ liệu người dùng khác nhau rồi assert phần trước breakpoint giống hệt nhau. Nó bắt được 90% lỗi vỡ cache ngay trong CI, trước khi lên hoá đơn.`,
  follow: ['Bạn kiểm soát quyền dùng tool thế nào mà vẫn giữ bộ tools cố định để cache?', 'A/B test hai model có ảnh hưởng chi phí cache không?'],
  tags: ['prompt caching', 'debug', 'silent invalidator']
},
{
  id: 'claude-008',
  topic: 'claude',
  level: 'mid',
  q: 'Khi nào bạn dùng Message Batches API thay vì gọi Messages API bình thường? Mô tả luồng xử lý và các giới hạn cần biết.',
  a: `**Tóm tắt:** Batch API dành cho việc **không cần kết quả ngay**: gửi tới 100.000 request (hoặc 256 MB) trong một batch, xử lý **bất đồng bộ**, phần lớn xong trong vòng 1 giờ, tối đa 24 giờ, với **giá bằng 50%**. Bạn tạo batch, poll tới khi {{processing_status}} là {{ended}}, rồi đọc kết quả và **ghép theo {{custom_id}}** (kết quả không theo thứ tự). Kết quả được giữ 29 ngày.

### Hiểu nhanh
Gọi thường giống đi taxi: tới ngay nhưng đắt. Batch giống gửi hàng chuyển phát tiết kiệm: gom cả xe hàng gửi một lần, rẻ một nửa, nhận trong ngày. Chỉ dùng khi không ai đứng chờ kết quả.

### Thuật ngữ
- **custom_id**: id bạn tự đặt cho từng request trong batch (ví dụ id bản ghi trong DB) để ghép kết quả.
- **processing_status**: trạng thái của batch: {{in_progress}}, {{canceling}}, {{ended}}.
- **result.type**: kết quả từng request: {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}.

### Ví dụ: phân loại 50.000 ticket hỗ trợ mỗi đêm
~~~json
POST /v1/messages/batches
{
  "requests": [
    { "custom_id": "ticket-1001",
      "params": { "model": "claude-haiku-5-5", "max_tokens": 200,
                  "messages": [ { "role": "user", "content": "Phân loại ticket: ..." } ] } },
    { "custom_id": "ticket-1002", "params": { "...": "..." } }
  ]
}
~~~
1. Chia 50.000 ticket thành batch (≤ 100.000 request, ≤ 256 MB), mỗi request có custom_id = id ticket.
2. Lưu batch id vào DB; một job định kỳ (ví dụ mỗi 5 phút) poll trạng thái.
3. Khi {{ended}}: đọc file kết quả (JSONL), với mỗi dòng ghép theo custom_id rồi cập nhật DB.
4. Gom các dòng {{errored}}/{{expired}} để gửi lại trong batch sau, phân biệt lỗi do request sai (không gửi lại) với lỗi tạm thời.

### So sánh
| | Messages API | Batch API |
|---|---|---|
| Thời gian | Giây | Phần lớn trong 1 giờ, tối đa 24 giờ |
| Giá | 100% | 50% |
| Phù hợp | Chat, API người dùng chờ | Phân loại/tóm tắt hàng loạt, eval, sinh dữ liệu |
| Streaming | Có | Không |

### Lỗi hay gặp
- **Ghép kết quả theo vị trí** → gán nhầm kết quả cho bản ghi khác. Luôn dùng custom_id.
- **Không xử lý expired**: batch quá 24 giờ thì các request chưa xong bị expired.
- **Dùng batch cho tác vụ người dùng đang chờ** → trải nghiệm tệ.
- **Quên lưu batch id** → mất dấu batch khi worker restart.
- Một số tính năng không hỗ trợ trong batch (ví dụ fallbacks phía server). Kiểm tra tài liệu cho từng tính năng.

### Trả lời miệng 1 phút
"Tôi dùng Batch API cho việc không cần kết quả ngay như phân loại hay tóm tắt hàng loạt, vì giá chỉ bằng một nửa. Một batch chứa tới 100 nghìn request hoặc 256 MB, phần lớn xong trong một giờ, tối đa 24 giờ. Mỗi request có custom_id, tôi lưu batch id, poll tới khi trạng thái ended, rồi đọc kết quả và ghép theo custom_id vì thứ tự không được đảm bảo. Request errored hoặc expired thì gom lại gửi batch sau, kết quả được giữ 29 ngày."

> Senior tip: kết hợp Batch với **prompt caching** cho phần prompt chung của mọi request (hướng dẫn phân loại dài): hai mức giảm giá cộng dồn, đặc biệt hiệu quả cho job eval chạy hàng nghìn test case.`,
  follow: ['Làm sao để job đọc kết quả batch idempotent nếu bị chạy lại?', 'Bạn chọn kích thước batch thế nào?'],
  tags: ['Batch API', 'custom_id', 'chi phí', 'async']
},
{
  id: 'claude-009',
  topic: 'claude',
  level: 'senior',
  q: 'Backend của bạn cần Claude trả về JSON đúng schema để lưu thẳng vào DB. Có những cách nào, ưu nhược điểm ra sao, và vì sao server vẫn phải validate?',
  a: `**Tóm tắt:** Có 3 cách, từ yếu tới mạnh: (1) **dặn trong prompt** "trả về JSON" rồi tự parse — dễ vỡ; (2) **strict tool use** ({{strict: true}} trên tool) — API đảm bảo {{tool_use.input}} hợp lệ theo schema; (3) **structured outputs** ({{output_config.format}} với {{type: "json_schema"}}) — ràng buộc chính câu trả lời theo schema. Dù vậy server **vẫn phải validate nghiệp vụ** (giá trị hợp lý, quyền, độ dài) vì schema chỉ bảo đảm **hình dạng**, không bảo đảm **đúng**.

### Hiểu nhanh
Schema giống mẫu đơn có ô trống: nó đảm bảo người ta điền đúng ô "ngày sinh" bằng ngày tháng, nhưng không đảm bảo ngày đó là thật. Bạn vẫn phải kiểm tra lại nội dung.

### Thuật ngữ
- **JSON Schema**: chuẩn mô tả cấu trúc JSON (kiểu dữ liệu, trường bắt buộc, enum…).
- **additionalProperties: false**: không cho phép trường lạ ngoài schema.
- **Structured outputs**: tính năng ép đầu ra khớp schema ngay lúc sinh. SDK có helper {{messages.parse()}} để parse và validate.

### Ví dụ structured outputs
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 1024,
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "invoice_no": { "type": "string" },
          "total": { "type": "number" },
          "currency": { "type": "string", "enum": ["VND", "USD"] }
        },
        "required": ["invoice_no", "total", "currency"],
        "additionalProperties": false
      }
    }
  },
  "messages": [ { "role": "user", "content": "Trích xuất hoá đơn: ..." } ]
}
~~~

### So sánh
| Cách | Đảm bảo hình dạng | Khi nào dùng |
|---|---|---|
| Dặn trong prompt | Không | Prototype nhanh |
| strict tool use | Có (input của tool) | Model cần **chọn** hành động/tool trong agent |
| Structured outputs | Có (toàn bộ câu trả lời) | Chỉ cần lấy dữ liệu có cấu trúc |

### Vì sao vẫn validate ở server (từng bước)
1. **Đúng hình dạng ≠ đúng giá trị**: total có thể âm, ngày có thể ở tương lai, invoice_no có thể bịa.
2. **Bị cắt**: nếu {{stop_reason}} là {{max_tokens}} thì JSON có thể dở dang, nên luôn kiểm tra stop_reason trước.
3. **Refusal**: {{stop_reason}} là {{refusal}} thì không có JSON hợp lệ.
4. **Bảo mật**: dữ liệu đi vào SQL/HTML/shell phải escape hoặc tham số hoá như mọi input không tin cậy.
5. Dùng Bean Validation ({{@NotBlank}}, {{@Positive}}…) trên DTO sau khi parse.

### Lỗi hay gặp
- **Parse JSON bằng regex trên text** → vỡ khi model thêm lời dẫn.
- **Ép tool bằng tool_choice type tool** để lấy JSON: trên các model hiện hành (Opus 5.5, Sonnet 5.5, Fable 5.1) cách này trả lỗi 400. Hãy dùng structured outputs hoặc tool_choice auto + strict.
- **Bật citations cùng structured outputs**: hai tính năng không dùng chung được (lỗi 400).
- **Schema quá phức tạp** (lồng sâu, nhiều anyOf): dễ lỗi và chậm; hãy giữ phẳng, rõ ràng.

### Trả lời miệng 1 phút
"Nếu chỉ cần dữ liệu có cấu trúc, tôi dùng structured outputs qua output_config.format với json_schema, schema phẳng, có required và additionalProperties false. Nếu model cần chọn hành động trong agent thì dùng tool với strict true để input luôn đúng schema. Dặn JSON trong prompt chỉ để prototype. Nhưng schema chỉ bảo đảm hình dạng, nên server vẫn kiểm tra stop_reason, validate giá trị nghiệp vụ bằng Bean Validation và coi dữ liệu là không tin cậy khi đưa vào SQL hay HTML."

> Senior tip: lưu **bản JSON gốc** model trả về cùng phiên bản prompt và model vào bảng audit. Khi phát hiện dữ liệu sai trong DB, bạn biết lỗi do model, do prompt hay do code mapping.`,
  follow: ['Khi nào chọn strict tool use thay vì structured outputs?', 'Schema thay đổi (thêm trường) thì bạn triển khai an toàn thế nào?'],
  tags: ['structured outputs', 'JSON schema', 'strict tool', 'validation']
},
{
  id: 'claude-010',
  topic: 'claude',
  level: 'mid',
  q: 'Sếp hỏi: "Tính năng tóm tắt tài liệu bằng Claude sẽ tốn bao nhiêu tiền mỗi tháng?". Bạn ước lượng thế nào?',
  a: `**Tóm tắt:** Chi phí = token input × giá input + token output × giá output (cộng cache write/read nếu có), **tính theo từng request rồi nhân với lưu lượng**. Đo token thật bằng endpoint **token counting** ({{POST /v1/messages/count_tokens}}) hoặc {{usage}} của vài chục request mẫu, rồi lập bảng theo kịch bản thấp / trung bình / cao, kèm các đòn bẩy giảm chi phí.

### Hiểu nhanh
Giống tính tiền điện: số kWh × đơn giá. Ở đây "kWh" là token. Input (tài liệu đưa vào) thường nhiều hơn output (bản tóm tắt), nhưng output đắt hơn mỗi token, nên phải tính cả hai.

### Thuật ngữ
- **MTok**: một triệu token; bảng giá ghi theo $/MTok.
- **count_tokens**: endpoint đếm số token input của một request mà không sinh output.
- **Tokenizer**: cách chia chữ thành token; mỗi thế hệ model có thể khác, nên đếm lại khi đổi model.

### Các bước ước lượng
1. **Lấy mẫu**: 30–50 tài liệu thật đại diện (ngắn, trung bình, dài).
2. **Đếm token input** bằng count_tokens với đúng model và prompt sẽ dùng (tiếng Việt thường tốn nhiều token hơn tiếng Anh cho cùng nội dung).
3. **Ước lượng output**: chạy thử, đọc {{usage.output_tokens}}; hoặc đặt mục tiêu (ví dụ tóm tắt khoảng 300 token).
4. **Nhân lưu lượng**: số tài liệu/tháng.
5. **Áp giá** theo model, rồi tính cho 2–3 model để sếp chọn.

### Ví dụ tính
Giả sử 100.000 tài liệu/tháng, mỗi tài liệu 6.000 token input (đã gồm prompt 1.000 token) và 300 token output.

| Model | Input ($/MTok) | Output ($/MTok) | Input/tháng | Output/tháng | Tổng |
|---|---|---|---|---|---|
| Haiku 5.5 | 0.10 | 0.50 | 600M → $60 | 30M → $15 | **~$75** |
| Sonnet 5.5 | 2 | 10 | 600M → $1.200 | 30M → $300 | **~$1.500** |
| Opus 5.5 | 4 | 20 | 600M → $2.400 | 30M → $600 | **~$3.000** |

(Giá theo bảng hiện hành; Haiku 5.5 có giá cao hơn khi prompt trên 100K token. Hãy kiểm tra trang Pricing trước khi báo cáo.)

### Đòn bẩy giảm chi phí cần nêu kèm
- **Batch API** nếu không cần kết quả ngay: giảm 50%.
- **Prompt caching** cho phần hướng dẫn chung (1.000 token × 100.000 lần).
- **Chọn model theo chất lượng đo được**: chạy eval trên mẫu, nếu Haiku đạt yêu cầu thì tiết kiệm 20 lần so với Sonnet.
- **Giới hạn max_tokens** và yêu cầu độ dài tóm tắt rõ ràng.
- **Effort thấp** cho tác vụ đơn giản.

### Lỗi hay gặp
- **Ước lượng bằng "số ký tự chia 4"**: sai nhiều với tiếng Việt và code. Hãy đếm bằng API.
- **Quên token của system prompt, lịch sử, tool definitions**: chúng tính vào input mỗi request.
- **Quên retry và request lỗi**: cộng thêm khoảng 5–10% dự phòng.
- **Không tách chi phí theo tính năng**: cuối tháng chỉ thấy một con số tổng, không biết tối ưu chỗ nào.

### Trả lời miệng 1 phút
"Tôi lấy mẫu vài chục tài liệu thật, đếm input bằng endpoint count_tokens với đúng prompt và model, chạy thử để biết output trung bình, rồi nhân với lưu lượng tháng và giá từng model. Ví dụ 100 nghìn tài liệu, mỗi cái 6 nghìn token vào và 300 ra, thì Haiku khoảng 75 đô, Sonnet khoảng 1.500, Opus khoảng 3.000 mỗi tháng. Tôi trình bày kèm đòn bẩy: Batch API giảm một nửa, caching phần prompt chung, và chọn model rẻ nhất đạt ngưỡng chất lượng trên bộ eval."

> Senior tip: báo cáo theo **chi phí trên mỗi tác vụ hoàn thành** (ví dụ $0.015/tài liệu), không theo chi phí/request. Một model rẻ mà phải gọi lại 3 lần vì sai thì không hề rẻ.`,
  follow: ['Nếu tài liệu dài hơn 100K token thì cách tính với Haiku 5.5 thay đổi thế nào?', 'Bạn chứng minh Haiku "đủ tốt" cho tác vụ này bằng cách nào?'],
  tags: ['chi phí', 'count_tokens', 'pricing', 'model selection']
},
{
  id: 'claude-011',
  topic: 'claude',
  level: 'senior',
  q: 'So sánh các model Claude hiện hành (Haiku 5.5, Sonnet 5.5, Opus 5.5, Fable 5.1). Bạn chọn model cho từng tính năng của một sản phẩm thế nào?',
  a: `**Tóm tắt:** Bốn tầng theo năng lực và giá:
- **Haiku 5.5**: rẻ, nhanh nhất ($0.10/$0.50 mỗi MTok khi prompt ≤ 100K token).
- **Sonnet 5.5**: cân bằng tốc độ và năng lực ($2/$10).
- **Opus 5.5**: mạnh cho việc khó và agent dài ($4/$20); đây là mặc định Anthropic khuyến nghị cho đa số việc.
- **Fable 5.1**: mạnh nhất cho suy luận cực khó, chạy lâu ($10/$50).

Tất cả có context 1M, output tối đa 128K. Chọn model bằng **eval trên dữ liệu thật**, không chọn theo cảm tính: bắt đầu từ model có khả năng đạt yêu cầu, rồi thử hạ xuống model rẻ hơn hoặc hạ **effort** xem chất lượng có giữ được không.

### Hiểu nhanh
Giống thuê người: thực tập sinh (Haiku) làm nhanh việc đơn giản như phân loại; kỹ sư (Sonnet) làm phần lớn công việc hằng ngày; senior (Opus) cho việc phức tạp nhiều bước; chuyên gia đầu ngành (Fable) cho bài toán khó nhất, đắt và chậm hơn. Không ai thuê chuyên gia để phân loại email.

### Thuật ngữ
- **Effort**: mức "cố gắng suy nghĩ" ({{low}} → {{max}}) trong cùng một model, đòn bẩy chi phí đầu tiên trước khi đổi model.
- **Eval**: bộ test case có đáp án hoặc tiêu chí chấm, dùng để đo chất lượng một cách khách quan.
- **Routing**: chọn model theo loại request.

### Bảng gợi ý theo tính năng
| Tính năng | Model khởi điểm | Lý do |
|---|---|---|
| Phân loại ticket, gắn nhãn, trích trường đơn giản | Haiku 5.5 | Khối lượng lớn, cần rẻ và nhanh |
| Chatbot hỗ trợ khách hàng, tóm tắt | Sonnet 5.5 | Cân bằng chất lượng và độ trễ |
| Coding agent, phân tích nhiều bước, tool use phức tạp | Opus 5.5 | Ổn định trên tác vụ dài |
| Nghiên cứu sâu, bài toán cực khó mà Opus effort cao vẫn chưa đạt | Fable 5.1 | Đắt và chậm hơn, chỉ dùng khi đo được lợi ích |

### Quy trình chọn từng bước
1. Xây eval 50–200 case cho tính năng, có tiêu chí chấm rõ.
2. Chạy trên 2–3 model hoặc mức effort; ghi điểm chất lượng, độ trễ p95, **chi phí mỗi tác vụ hoàn thành**.
3. Chọn phương án rẻ nhất đạt ngưỡng chất lượng; ghi lại kết quả để lần nâng model sau so sánh.
4. Với route hỗn hợp: router đơn giản (theo loại tính năng) thường đủ; router "thông minh" dùng model để chọn model chỉ khi đo được lợi ích.

### Lỗi hay gặp
- **Dùng model mạnh nhất cho mọi thứ** → hoá đơn gấp 10–40 lần mà người dùng không thấy khác biệt.
- **Dùng model rẻ nhất cho mọi thứ** → phải gọi lại, sửa tay, cuối cùng đắt hơn.
- **Chọn model mà không thử hạ effort trước**: model mạnh ở effort thấp nhiều khi tốt hơn model yếu ở effort cao.
- **Quên rằng cache tách theo model**: cascade nhiều model làm mất lợi ích caching.
- **Ghi ID model kèm hậu tố ngày tự đoán**: chỉ dùng đúng ID trong tài liệu (ví dụ {{claude-sonnet-5-5}}).

### Trả lời miệng 1 phút
"Có bốn tầng: Haiku 5.5 rẻ và nhanh cho phân loại hay trích xuất khối lượng lớn, Sonnet 5.5 cân bằng cho chatbot và tóm tắt, Opus 5.5 cho việc phức tạp và agent dài, Fable 5.1 cho bài toán khó nhất. Tất cả có context 1M. Tôi không chọn theo cảm tính mà xây eval từ dữ liệu thật, chạy vài model và mức effort, so chất lượng, độ trễ p95 và chi phí mỗi tác vụ hoàn thành, rồi chọn phương án rẻ nhất đạt ngưỡng. Thường tôi thử hạ effort trước khi đổi sang model nhỏ hơn."

> Senior tip: lưu {{model}} và phiên bản prompt cùng mỗi kết quả trong DB. Khi Anthropic ra model mới, bạn chạy lại đúng bộ eval cũ và có số liệu so sánh trong một buổi chiều, thay vì tranh luận cảm tính.`,
  follow: ['Router chọn model nên đặt ở đâu trong kiến trúc?', 'Khi nâng từ model cũ lên model mới bạn kiểm tra những gì?'],
  tags: ['model selection', 'Haiku', 'Sonnet', 'Opus', 'Fable', 'eval']
},
{
  id: 'claude-012',
  topic: 'claude',
  level: 'senior',
  q: 'Adaptive thinking và tham số effort trên các model Claude hiện hành là gì? Bạn cấu hình chúng thế nào cho tác vụ đơn giản và tác vụ khó?',
  a: `**Tóm tắt:** **Thinking** là phần model "suy nghĩ" trước khi trả lời. Trên các model hiện hành, thinking là **adaptive**: model tự quyết suy nghĩ bao nhiêu. Bạn điều khiển độ sâu bằng {{output_config.effort}} ({{low}}, {{medium}}, {{high}}, {{xhigh}}, {{max}}). Kiểu cũ "ngân sách thinking cố định" ({{budget_tokens}}) đã bị bỏ trên các model 5.x (gửi lên bị lỗi 400). Trên **Opus 5.5** thinking không tắt được và effort mặc định là {{medium}}.

### Hiểu nhanh
Effort giống dặn nhân viên "làm nhanh cho xong" hay "nghĩ thật kỹ rồi làm". Cùng một người (model), nghĩ kỹ thì tốn thời gian và tiền hơn nhưng ít sai hơn ở việc khó; với việc dễ thì nghĩ kỹ cũng không tốt hơn mà chỉ chậm hơn.

### Thuật ngữ
- **Thinking block**: block {{type: "thinking"}} trong content. Mặc định trên nhiều model hiện hành nó **trống** ({{display: "omitted"}}); đặt {{display: "summarized"}} để nhận bản tóm tắt suy nghĩ. Suy nghĩ thô không bao giờ được trả về.
- **Effort**: đòn bẩy chất lượng/chi phí trong một model, ảnh hưởng cả số token suy nghĩ lẫn số lần gọi tool.

### Cấu hình theo loại việc
| Loại việc | Effort gợi ý | Ghi chú |
|---|---|---|
| Phân loại, trích xuất, chat ngắn | low | Nhanh, rẻ, thường đủ |
| Tóm tắt, viết, hỏi đáp có lập luận | medium | Mặc định của Opus 5.5 và Haiku 5.5 |
| Coding, agent nhiều bước, phân tích khó | high hoặc xhigh | Đáng tiền ở tác vụ dài |
| Khi đúng quan trọng hơn chi phí | max | Chỉ khi đo được lợi ích |

~~~json
{
  "model": "claude-opus-5-5",
  "max_tokens": 16000,
  "thinking": { "type": "adaptive", "display": "summarized" },
  "output_config": { "effort": "high" },
  "messages": [ { "role": "user", "content": "Tìm nguyên nhân deadlock trong log sau..." } ]
}
~~~

### Từng bước khi tinh chỉnh
1. Bắt đầu ở effort mặc định của model; **đặt effort tường minh** để không bất ngờ khi đổi model (Opus 5.5 mặc định medium, nhiều model khác mặc định high).
2. Chạy eval ở 2–3 mức effort, đo chất lượng, độ trễ và token output.
3. Chọn mức thấp nhất đạt ngưỡng, **theo từng route** thay vì một giá trị cho cả hệ thống.
4. Nếu hiển thị "đang suy nghĩ" cho người dùng: dùng {{display: "summarized"}} khi stream, nếu không người dùng chỉ thấy một khoảng lặng dài.

### Lỗi hay gặp
- **Gửi thinking kiểu {{disabled}} cho Opus 5.5** → lỗi 400; hãy hạ effort thay vì tắt thinking.
- **Gửi budget_tokens** (cấu hình từ thời model 4.x) cho model 5.x → lỗi 400.
- **Gửi temperature/top_p** khi dùng API version mới (2026-10-21) → lỗi 400 trên mọi model.
- **Xoá hoặc sửa thinking block trong lịch sử**: hãy gửi lại nguyên vẹn các block assistant ở lượt sau. Sửa lịch sử có thể làm thinking block mất hiệu lực trên các model có "preserved thinking".

### Trả lời miệng 1 phút
"Trên các model hiện hành thinking là adaptive, model tự quyết nghĩ bao nhiêu, còn tôi điều khiển độ sâu bằng output_config.effort từ low tới max. Kiểu budget_tokens cũ đã bị bỏ trên model 5.x, và Opus 5.5 không cho tắt thinking, mặc định effort medium. Tôi đặt effort tường minh theo từng route: low cho phân loại và chat ngắn, medium cho tóm tắt, high hoặc xhigh cho coding và agent, và chọn bằng eval chứ không đoán. Khi stream cho người dùng thì bật display summarized để họ thấy model đang suy nghĩ."

> Senior tip: khi nâng model, **chạy lại effort sweep**. Cùng tên mức effort nhưng các model khác nhau được hiệu chỉnh khác nhau, và giữ nguyên cấu hình cũ là nguồn gốc phổ biến của việc "model mới chậm hơn / tốn hơn".`,
  follow: ['Vì sao không nên tắt thinking để tiết kiệm trên Opus 5.5?', 'Hiển thị tiến trình suy nghĩ cho người dùng thế nào khi stream?'],
  tags: ['thinking', 'effort', 'adaptive', 'Opus 5.5']
},
{
  id: 'claude-013',
  topic: 'claude',
  level: 'senior',
  q: 'Bạn tích hợp Claude vào một hệ thống Spring Boot cho hàng nghìn người dùng. Kiến trúc tích hợp an toàn và ổn định trông thế nào (API key, timeout, cô lập lỗi, quan sát)?',
  a: `**Tóm tắt:** Đặt một **lớp gateway nội bộ** (service hoặc module {{AiClient}}) là nơi duy nhất giữ API key và gọi Claude: frontend **không bao giờ** gọi thẳng. Lớp này lo timeout, retry có kiểm soát, circuit breaker, bulkhead (giới hạn concurrency), hạn mức theo người dùng, log usage và tracing; nghiệp vụ chỉ gọi interface của nó.

### Hiểu nhanh
Giống cả công ty chỉ có một phòng mua hàng được ký hợp đồng với nhà cung cấp: mọi phòng ban gửi yêu cầu qua đó. Phòng mua hàng nắm chìa khoá (API key), kiểm soát ngân sách, và nếu nhà cung cấp chậm giao thì không để cả công ty đứng chờ.

### Thuật ngữ
- **Bulkhead**: vách ngăn; giới hạn số lời gọi AI chạy đồng thời để AI chậm không ăn hết thread của cả app.
- **Secret manager**: nơi lưu bí mật (AWS Secrets Manager, Vault…) thay vì file cấu hình trong git.
- **Correlation id**: mã gắn xuyên suốt một yêu cầu để lần theo log.

### Kiến trúc
~~~text
Browser/Mobile --(JWT)--> Spring API --> AiClient (module/service nội bộ)
                                           |- quota theo user (Redis)
                                           |- bulkhead + timeout + circuit breaker
                                           |- retry (429/5xx, có jitter)
                                           |- log usage, cost, request-id, model
                                           v
                                     Claude API (key lấy từ secret manager)
~~~

### Từng bước triển khai
1. **API key**: lưu trong secret manager, inject qua biến môi trường; mỗi môi trường (dev/staging/prod) một key riêng, xoay vòng định kỳ; không log key.
2. **Timeout**: connect ngắn (khoảng 5s); read timeout theo route (chat stream có thể dài, job đồng bộ khoảng 60s). SDK mặc định timeout 10 phút, quá dài cho request người dùng đang chờ.
3. **Retry**: chọn **một** tầng retry (SDK mặc định retry 2 lần) cho 429/5xx/529, có backoff và jitter.
4. **Circuit breaker + bulkhead** (Resilience4j): AI lỗi kéo dài thì trả fallback như "tính năng AI tạm thời bận" thay vì treo.
5. **Quota theo người dùng**: chặn lạm dụng như một user spam 1.000 request/giờ; đây cũng là lớp bảo vệ chi phí.
6. **Dữ liệu**: giảm thiểu dữ liệu nhạy cảm gửi đi (che số thẻ, CCCD), theo chính sách dữ liệu của công ty.
7. **Quan sát**: log mỗi lời gọi gồm route, model, input/output/cache token, độ trễ, stop_reason, request-id; metric Micrometer; tracing (OpenTelemetry) để thấy lời gọi AI trong toàn bộ request.

~~~java
@Service
class AiClient {
  private final Bulkhead bulkhead = Bulkhead.of("claude",
      BulkheadConfig.custom().maxConcurrentCalls(50).build());   // tối đa 50 lời gọi đồng thời
  private final CircuitBreaker cb = CircuitBreaker.ofDefaults("claude");

  Answer ask(String userId, Prompt p) {
    quota.check(userId);                                         // 429 nội bộ nếu vượt hạn mức user
    Supplier<Answer> call = () -> claude.send(p, Duration.ofSeconds(60));
    Answer a = Decorators.ofSupplier(call)
        .withBulkhead(bulkhead).withCircuitBreaker(cb)
        .withFallback(List.of(CallNotPermittedException.class), e -> Answer.busy())
        .get();
    usageLog.record(userId, p.route(), a.usage(), a.model(), a.requestId());
    return a;
  }
}
~~~

### Lỗi hay gặp
- **Gọi Claude từ JavaScript phía trình duyệt kèm API key** → key lộ trong vài phút.
- **Không timeout** → khi AI chậm, thread pool Tomcat cạn, cả hệ thống (kể cả trang không dùng AI) sập theo.
- **Mỗi service tự gọi Claude theo kiểu riêng** → không ai biết tổng chi phí, mỗi nơi retry một kiểu.
- **Log nguyên prompt chứa dữ liệu cá nhân** → rủi ro tuân thủ; hãy log metadata, lưu nội dung có kiểm soát.

### Trả lời miệng 1 phút
"Tôi gom mọi lời gọi Claude vào một lớp AiClient nội bộ, là nơi duy nhất giữ API key lấy từ secret manager. Frontend chỉ gọi API của mình. Lớp đó có timeout theo route, một tầng retry cho 429 và 5xx, circuit breaker và bulkhead để AI chậm không kéo sập cả app, cùng quota theo người dùng để chặn lạm dụng và kiểm soát chi phí. Mỗi lời gọi được log route, model, token, độ trễ, stop_reason và request-id, có metric và tracing. Dữ liệu nhạy cảm được che trước khi gửi."

> Senior tip: thêm **feature flag** cho từng tính năng AI. Khi chi phí tăng đột biến hoặc nhà cung cấp gặp sự cố, bạn tắt riêng tính năng đó trong vài giây thay vì phải deploy lại.`,
  follow: ['Bạn đặt quota theo người dùng bằng Redis thế nào?', 'Làm sao test tích hợp Claude trong CI mà không tốn tiền?'],
  tags: ['Spring Boot', 'API key', 'Resilience4j', 'observability', 'kiến trúc']
},
{
  id: 'claude-014',
  topic: 'claude',
  level: 'mid',
  q: 'Người dùng muốn upload ảnh hoá đơn và file PDF hợp đồng để Claude đọc. Bạn gửi chúng qua Messages API thế nào, có giới hạn gì, và khi nào dùng Files API?',
  a: `**Tóm tắt:** Ảnh gửi bằng content block {{image}} với {{source}} là {{base64}} hoặc {{url}}; PDF gửi bằng block {{document}} (base64, có {{media_type: "application/pdf"}}). Model đọc cả chữ lẫn hình trong PDF. Giới hạn chính: request tối đa 32 MB, PDF tối đa 600 trang (100 trang với model context 200K). Nếu cùng một file dùng lại nhiều lần thì **upload một lần qua Files API** rồi tham chiếu bằng {{file_id}}.

### Hiểu nhanh
Gửi base64 giống photocopy tài liệu kèm theo mỗi lá thư. Files API giống gửi tài liệu vào kho lưu trữ một lần, các lá thư sau chỉ ghi "xem hồ sơ số X".

### Thuật ngữ
- **Base64**: cách mã hoá file nhị phân thành chuỗi ký tự để nhúng vào JSON (dài hơn file gốc khoảng 33%).
- **Files API**: endpoint upload file ({{POST /v1/files}}), trả về {{file_id}} dùng cho các request sau.
- **Citations**: tính năng để Claude trích dẫn chính xác đoạn nào trong tài liệu (bật {{citations.enabled}} trên document block).

### Ví dụ request
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 2048,
  "messages": [{
    "role": "user",
    "content": [
      { "type": "document",
        "source": { "type": "base64", "media_type": "application/pdf", "data": "<base64 không xuống dòng>" } },
      { "type": "image",
        "source": { "type": "base64", "media_type": "image/jpeg", "data": "<base64>" } },
      { "type": "text", "text": "Đối chiếu số tiền trên hoá đơn với điều khoản thanh toán trong hợp đồng." }
    ]
  }]
}
~~~
Đặt tài liệu/ảnh **trước** câu hỏi: tốt cho chất lượng, và tài liệu cố định ở đầu còn giúp cache.

### Từng bước ở backend
1. Nhận upload, kiểm tra loại file (theo magic bytes, không chỉ đuôi file), kích thước, số trang.
2. Ảnh quá lớn: resize trước khi gửi, vì ảnh to tốn nhiều token mà không chắc rõ hơn.
3. PDF dài hoặc dùng lại nhiều lần (hỏi nhiều câu trên cùng hợp đồng): upload Files API, lưu file_id; kết hợp prompt caching.
4. Cần dẫn chứng: bật citations để hiển thị đoạn trích kèm trang. Lưu ý citations không dùng chung với structured outputs.
5. Quét dữ liệu nhạy cảm theo chính sách trước khi gửi.

### Lỗi hay gặp
- **Base64 có ký tự xuống dòng** → lỗi request.
- **Khai báo media_type sai** (PNG ghi là jpeg) → lỗi hoặc đọc sai.
- **Gửi lại PDF 300 trang base64 mỗi câu hỏi** → tốn băng thông và token; dùng Files API cộng caching.
- **Tin số liệu đọc từ ảnh mờ** mà không cho người dùng xác nhận: OCR bằng AI vẫn có thể sai, cần bước xác nhận với dữ liệu tiền.

### Trả lời miệng 1 phút
"Ảnh tôi gửi bằng block image với source base64 hoặc url, PDF bằng block document base64 media type application/pdf; Claude đọc được cả chữ lẫn hình trong PDF. Giới hạn là 32 MB mỗi request và 600 trang PDF. Tôi đặt tài liệu trước câu hỏi. Nếu người dùng hỏi nhiều câu trên cùng một hợp đồng, tôi upload một lần qua Files API, tham chiếu bằng file_id và cache phần đó. Khi cần dẫn chứng thì bật citations. Backend vẫn kiểm tra loại file, kích thước và cho người dùng xác nhận các số liệu quan trọng."

> Senior tip: với luồng tài chính (hoá đơn, hợp đồng), thiết kế **human-in-the-loop**: AI trích xuất và đánh dấu độ tin cậy, người duyệt các trường quan trọng. Tỉ lệ người phải sửa là chỉ số chất lượng tốt nhất để theo dõi.`,
  follow: ['Bạn đánh giá độ chính xác trích xuất hoá đơn thế nào?', 'Citations giúp gì cho trải nghiệm và kiểm toán?'],
  tags: ['vision', 'PDF', 'Files API', 'citations']
},
{
  id: 'claude-015',
  topic: 'claude',
  level: 'senior',
  q: 'Response trả về stop_reason là "refusal". Điều này nghĩa là gì, và bạn xử lý thế nào trong sản phẩm (kể cả tính năng fallback model)?',
  a: `**Tóm tắt:** {{refusal}} nghĩa là bộ lọc an toàn đã từ chối yêu cầu (HTTP vẫn là 200). Response kèm {{stop_details}} có {{category}} (ví dụ {{cyber}}, {{bio}}…) và {{explanation}}. Xử lý: **luôn kiểm tra stop_reason trước khi đọc content**, hiển thị thông báo thân thiện, ghi metric theo category. Với một số model mới (Opus 5.5, Fable 5.1, Sonnet 5.5…) có thể bật **fallback phía server**: API tự chạy lại trên model dự phòng ngay trong cùng request.

### Hiểu nhanh
Giống quầy thuốc từ chối bán thuốc cần kê đơn: không phải lỗi hệ thống, mà là một quyết định. Bạn không nên "thử lại 10 lần ở cùng quầy", mà giải thích cho khách, và nếu yêu cầu hợp lệ thì chuyển sang kênh phù hợp.

### Thuật ngữ
- **Safety classifier**: bộ phân loại tự động kiểm tra yêu cầu/đầu ra theo chính sách sử dụng.
- **False positive**: từ chối nhầm một yêu cầu hợp lệ (ví dụ hỏi bảo mật cho hệ thống của chính mình).
- **Fallback**: model dự phòng chạy khi model chính từ chối.

### Ví dụ bật fallback (Claude API)
~~~json
POST /v1/messages
anthropic-beta: server-side-fallback-2026-07-01

{
  "model": "claude-opus-5-5",
  "max_tokens": 4096,
  "fallbacks": "default",
  "messages": [ { "role": "user", "content": "..." } ]
}
~~~
Với dạng {{"default"}}, API tự chọn model dự phòng theo loại từ chối. Tính năng này đang beta, cách dùng khác nhau theo nền tảng (Bedrock, Vertex dùng middleware phía SDK) và không dùng được trong Batch API. Hãy kiểm tra tài liệu Refusals and fallback trước khi bật.

### Từng bước xử lý trong sản phẩm
1. **Kiểm tra stop_reason trước**: refusal thì content có thể trống hoặc dở dang, không lưu như câu trả lời hợp lệ.
2. **Thông báo cho người dùng** bằng ngôn ngữ rõ ràng, gợi ý diễn đạt lại nếu yêu cầu hợp lệ.
3. **Không retry mù quáng** cùng prompt; chỉ thử lại khi bạn đã đổi điều kiện (fallback, ngữ cảnh rõ hơn).
4. **Đo**: metric refusal rate theo route và category. Tăng đột biến sau khi đổi prompt hoặc model là tín hiệu cần xem lại.
5. **Giảm false positive** bằng ngữ cảnh: system prompt nêu rõ bối cảnh hợp lệ (ví dụ "công cụ nội bộ của đội bảo mật, chỉ phân tích hệ thống của công ty").
6. **Kiểm tra stop_reason cả sau fallback**: model dự phòng cũng có thể từ chối.

### Lỗi hay gặp
- **Coi refusal là lỗi 5xx rồi retry** → tốn tiền, vẫn bị từ chối.
- **Đọc content[0].text không kiểm tra** → hiển thị chuỗi rỗng hoặc lỗi null.
- **Cố "lách" bộ lọc** bằng prompt mẹo → vi phạm chính sách sử dụng, có thể bị khoá tài khoản.
- **Không log category** → không phân biệt được người dùng thật sự lạm dụng với false positive của tính năng.

### Trả lời miệng 1 phút
"Refusal là bộ lọc an toàn từ chối, HTTP vẫn 200 nên tôi luôn kiểm tra stop_reason trước khi đọc content. stop_details cho biết category và lời giải thích. Tôi hiển thị thông báo thân thiện, không retry mù quáng, và ghi metric refusal rate theo route và category để phát hiện false positive. Trên các model mới như Opus 5.5 có thể bật fallback phía server, API tự chạy lại trên model dự phòng trong cùng request, nhưng đó là beta nên tôi kiểm tra tài liệu theo nền tảng và vẫn kiểm tra stop_reason sau fallback."

> Senior tip: với sản phẩm chuyên ngành dễ bị từ chối nhầm (bảo mật, y tế), dựng một **bộ eval false positive** gồm các câu hợp lệ điển hình của người dùng. Chạy mỗi lần đổi model hoặc prompt để biết refusal rate trước khi khách hàng phàn nàn.`,
  follow: ['Bạn giảm false positive cho một công cụ bảo mật nội bộ thế nào?', 'Fallback ảnh hưởng chi phí và độ trễ ra sao?'],
  tags: ['refusal', 'stop_details', 'fallback', 'safety']
},
{
  id: 'claude-016',
  topic: 'claude',
  level: 'lead',
  q: 'Hoá đơn Claude của team tăng gấp 3 trong một quý. Bạn làm gì để giảm chi phí mà không làm giảm chất lượng?',
  a: `**Tóm tắt:** Đi theo thứ tự **đo trước, rồi "free wins" (không ảnh hưởng chất lượng), rồi mới tới các đánh đổi**:
1. **Đo:** chi phí theo route/tính năng, từ {{usage}} hoặc Usage & Cost API.
2. **Free wins:**
   - prompt caching;
   - dọn token thừa (lịch sử dài, tool definitions không dùng, tài liệu thừa);
   - giới hạn output;
   - vòng lặp agent không gọi tool vô ích;
   - Batch API cho việc không gấp.
3. **Đánh đổi:** hạ effort, đổi model nhỏ hơn cho route đã chứng minh bằng eval.

Đánh giá bằng **chi phí trên mỗi tác vụ hoàn thành**, không phải chi phí mỗi request.

### Hiểu nhanh
Giống giảm tiền điện công ty: trước hết lắp đồng hồ cho từng tầng để biết tầng nào tốn; rồi tắt đèn phòng không người (free wins); cuối cùng mới tính chuyện đổi máy lạnh yếu hơn (đánh đổi), và phải đo xem nhân viên có chịu được không.

### Thuật ngữ
- **Free win**: tối ưu không đổi chất lượng đầu ra.
- **Chi phí mỗi tác vụ hoàn thành**: tổng chi phí (kể cả retry, gọi lại, vòng tool) chia cho số tác vụ đạt yêu cầu.
- **Token hygiene**: chỉ gửi đúng những gì model cần.

### Quy trình từng bước
1. **Lập bảng chi phí theo route** trong 2 tuần: input, output, cache write, cache read, số request, chi phí mỗi tác vụ. Thường 20% route chiếm 80% chi phí.
2. **Prompt caching**: cache system prompt, tài liệu, tool definitions; mục tiêu cache read chiếm phần lớn input ở route có prefix lặp lại.
3. **Dọn input**:
   - cắt hoặc tóm tắt lịch sử chat;
   - bỏ tool không dùng ở route đó (nhưng giữ cố định trong route để không vỡ cache);
   - chỉ đưa đoạn tài liệu liên quan (retrieval) thay vì cả kho.
4. **Dọn output**: yêu cầu độ dài rõ ràng, max_tokens sát nhu cầu, không bắt model "giải thích lại câu hỏi".
5. **Vòng agent**: giới hạn số bước, phát hiện vòng lặp gọi cùng tool lặp lại, trả kết quả tool gọn (không đổ nguyên 50KB log vào context).
6. **Batch API** cho job nền: giảm 50%.
7. **Đánh đổi có đo lường**: thử effort thấp hơn, rồi model nhỏ hơn, trên bộ eval; chỉ áp dụng khi chất lượng giữ ngưỡng.
8. **Chặn rò rỉ**: quota theo user/tenant, alert khi chi phí ngày vượt ngưỡng.

### Ví dụ số liệu điển hình
| Hành động | Tác động thường gặp |
|---|---|
| Cache system prompt 30K token ở route chat | Input của route giảm mạnh (cache read ~0.1x) |
| Batch cho job tóm tắt đêm | -50% route đó |
| Haiku thay Sonnet cho phân loại (eval giữ ngưỡng) | -95% route đó |
| Giới hạn lịch sử 20 lượt gần nhất + tóm tắt | Input chat giảm 40–70% với hội thoại dài |

### Lỗi hay gặp
- **Đổi sang model rẻ ngay mà không eval** → chất lượng giảm, người dùng hỏi lại nhiều lần, chi phí thực tế tăng.
- **Tối ưu route nhỏ** trong khi route lớn nhất chưa được đo.
- **Cascade nhiều model** "thử rẻ trước, sai thì gọi model đắt": mất cache, tăng độ trễ, nhiều khi đắt hơn một model ở effort thấp.
- **Không có chủ sở hữu chi phí**: mỗi tính năng cần người chịu trách nhiệm ngân sách.

### Trả lời miệng 1 phút
"Tôi đo trước: bảng chi phí theo route dựa trên usage, vì thường vài route chiếm phần lớn hoá đơn. Sau đó làm các free win không ảnh hưởng chất lượng: prompt caching cho phần lặp lại, dọn input như lịch sử dài, tool thừa và tài liệu thừa, giới hạn output, sửa vòng agent gọi tool vô ích, và chuyển job nền sang Batch API giảm một nửa. Chỉ sau đó mới đánh đổi: hạ effort hoặc đổi model nhỏ hơn, nhưng phải chạy eval và so chi phí trên mỗi tác vụ hoàn thành. Cuối cùng đặt quota và alert để không tái diễn."

> Senior tip: đưa **chi phí mỗi tác vụ** vào dashboard sản phẩm bên cạnh chỉ số chất lượng. Khi hai con số nằm cạnh nhau, các cuộc tranh luận "dùng model nào" trở thành quyết định dựa trên số liệu.`,
  follow: ['Bạn phát hiện một vòng agent đang lãng phí token bằng cách nào?', 'Làm sao thuyết phục product owner chấp nhận model rẻ hơn?'],
  tags: ['cost optimization', 'caching', 'batch', 'effort']
},
{
  id: 'claude-017',
  topic: 'claude',
  level: 'lead',
  q: 'Team bạn đang chạy production trên một model Claude đời cũ và muốn nâng lên Opus 5.5 hoặc Sonnet 5.5. Bạn lên kế hoạch migration thế nào, cần lường trước những thay đổi phá vỡ nào?',
  a: `**Tóm tắt:** Migration model là **thay đổi production** như nâng phiên bản thư viện lớn, cần đi qua 4 bước:
1. **Kiểm kê** code và prompt.
2. **Sửa các thay đổi phá vỡ API.**
3. **Chạy eval so sánh** chất lượng, chi phí, độ trễ.
4. **Rollout dần** (canary/feature flag) có đường lui.

Các bẫy phổ biến khi lên model 5.x:
- **forced tool_choice** ({{any}}/{{tool}}) trả lỗi 400 trên Opus 5.5, Sonnet 5.5, Fable 5.1;
- **prefill** (gửi sẵn đầu câu trả lời assistant) bị bỏ;
- **budget_tokens** bị bỏ, thay bằng **effort**;
- Opus 5.5 **không tắt được thinking** và effort mặc định là {{medium}};
- API version mới cấm {{temperature}}/{{top_p}}/{{top_k}}.

### Hiểu nhanh
Giống thay động cơ máy bay: động cơ mới mạnh và tiết kiệm hơn, nhưng chỗ bắt vít, cần điều khiển và thói quen của phi công đều thay đổi. Phải thử trên mặt đất (eval), bay thử ngắn (canary), rồi mới chở khách.

### Thuật ngữ
- **Breaking change**: thay đổi làm code cũ lỗi (thường là 400).
- **Canary**: chuyển một phần nhỏ traffic (1–5%) sang phiên bản mới để quan sát.
- **Prefill**: kỹ thuật cũ, đặt sẵn phần đầu câu trả lời của assistant để ép định dạng.

### Bảng thay đổi cần rà soát
| Code cũ | Trên model 5.x | Cách sửa |
|---|---|---|
| tool_choice any/tool để ép gọi tool | 400 (Opus 5.5, Sonnet 5.5, Fable 5.1) | tool_choice auto + hướng dẫn trong prompt + strict: true, hoặc structured outputs |
| Prefill assistant để ép JSON | 400 | structured outputs (output_config.format) hoặc hướng dẫn trong system |
| thinking enabled + budget_tokens | 400 | thinking adaptive (hoặc bỏ tham số) + output_config.effort |
| thinking disabled để tiết kiệm | 400 trên Opus 5.5 (và Sonnet 5.5) | hạ effort; Sonnet 5.5 có kiểu between_tools |
| temperature / top_p / top_k | 400 với API version 2026-10-21 | bỏ; kiểm soát bằng prompt và effort |
| Tokenizer cũ | Số token có thể khác | đếm lại bằng count_tokens, xem lại ngân sách |

### Kế hoạch từng bước
1. **Kiểm kê**: grep mọi chỗ gọi API (model id, tool_choice, thinking, temperature, prefill); liệt kê prompt theo route.
2. **Sửa breaking changes** ở nhánh riêng, test tự động bằng mock cho từng route.
3. **Eval song song**: chạy bộ eval cũ trên model cũ và model mới, ở 2–3 mức effort; so chất lượng, p95 latency, token và chi phí mỗi tác vụ.
4. **Điều chỉnh prompt**: prompt viết cho model cũ thường quá "ra lệnh" hoặc quá chi tiết; model mới có thể làm tốt hơn với hướng dẫn gọn. Sửa dựa trên lỗi thấy được trong eval, không sửa theo cảm tính.
5. **Rollout**: feature flag theo route, bắt đầu 5%, theo dõi refusal rate, tỉ lệ max_tokens, lỗi 400, chi phí; tăng dần.
6. **Đường lui**: giữ cấu hình model cũ chạy được trong vài tuần; ghi model + phiên bản prompt trong log để so sánh.

### Lỗi hay gặp
- **Chỉ đổi chuỗi model id rồi deploy** → lỗi 400 hàng loạt ở route dùng tool_choice hoặc prefill.
- **Giữ nguyên effort mặc định**: Opus 5.5 mặc định medium, có thể khác hành vi bạn quen.
- **Không đếm lại token**: ngân sách context và chi phí lệch.
- **Sửa lịch sử hội thoại có thinking block** (cắt, chỉnh) trong harness agent: với các model có preserved thinking, hãy giữ lịch sử append-only.

### Trả lời miệng 1 phút
"Tôi coi đổi model là thay đổi production. Đầu tiên kiểm kê mọi chỗ gọi API và prompt. Sau đó sửa breaking changes: forced tool_choice và prefill trả lỗi 400 trên Opus 5.5 nên tôi chuyển sang tool_choice auto với strict hoặc structured outputs, budget_tokens thay bằng effort, Opus 5.5 không tắt được thinking, và API version mới cấm temperature. Rồi tôi chạy bộ eval song song ở vài mức effort để so chất lượng, độ trễ và chi phí mỗi tác vụ, chỉnh prompt dựa trên lỗi thật, và rollout dần bằng feature flag từ 5% traffic, có đường lui về model cũ."

> Senior tip: tách **model id, effort và phiên bản prompt ra cấu hình** (không hard-code trong code), kèm bộ eval tự động. Lần migration tiếp theo chỉ còn là một thay đổi cấu hình cộng một lần chạy eval.`,
  follow: ['Bạn xây bộ eval cho migration từ log production thế nào mà không lộ dữ liệu người dùng?', 'Nếu model mới tốt hơn ở 80% case nhưng tệ hơn ở 20% thì sao?'],
  tags: ['migration', 'breaking change', 'tool_choice', 'effort', 'rollout']
},
{
  id: 'claude-018',
  topic: 'claude',
  level: 'lead',
  q: 'Một tập đoàn lớn (ví dụ quy mô như Samsung, hàng chục nghìn nhân viên, nhiều ngôn ngữ, tài liệu ở Confluence/SharePoint/Drive) muốn Claude trả lời đúng theo kiến thức nội bộ. Bạn thiết kế "knowledge" cho Claude thế nào?',
  a: `**Tóm tắt:** Không có một cách duy nhất. Chọn theo **kích thước, độ thay đổi và quyền truy cập** của tri thức:
- **Ít và ổn định** (quy trình, glossary, chính sách cốt lõi): đặt thẳng vào system prompt hoặc tài liệu cố định, kèm **prompt caching**.
- **Nhiều và thay đổi liên tục** (hàng triệu trang wiki): **RAG** (truy xuất đoạn liên quan rồi đưa vào prompt), tốt nhất là **hybrid search** (vector + từ khoá), có kiểm soát quyền theo người hỏi.
- **Dữ liệu sống trong hệ thống** (Jira, CRM, ERP): cho Claude **truy cập qua tool/MCP** thay vì sao chép.

Với người dùng cuối, các gói Claude cho doanh nghiệp còn có Projects (gắn tài liệu theo dự án) và connector tới công cụ làm việc. Kiểm tra tính năng theo gói đang dùng.

### Hiểu nhanh
Giống đào tạo nhân viên mới ở tập đoàn:
- "Sổ tay nhân viên" vài chục trang thì đưa luôn cho họ đọc (system prompt + cache).
- Kho tài liệu triệu trang thì dạy họ **cách tra cứu** đúng chỗ (RAG).
- Số liệu thay đổi từng phút (tồn kho, ticket) thì cấp **quyền truy cập hệ thống** (tool/MCP), không phát bản in vì in xong đã cũ.

### Thuật ngữ
- **RAG (Retrieval-Augmented Generation)**: truy xuất các đoạn tài liệu liên quan tới câu hỏi rồi đưa vào prompt để model trả lời dựa trên đó.
- **Embedding**: vector số biểu diễn ý nghĩa của đoạn văn để tìm "gần nghĩa". Anthropic không cung cấp model embedding riêng; thường dùng nhà cung cấp embedding chuyên biệt.
- **Hybrid search**: kết hợp tìm theo vector (ý nghĩa) và BM25 (từ khoá chính xác như mã sản phẩm "SM-S928").
- **Contextual retrieval**: kỹ thuật Anthropic mô tả: trước khi embed, thêm 1–2 câu ngữ cảnh vào mỗi đoạn (đoạn này thuộc tài liệu nào, nói về gì) để truy xuất chính xác hơn.
- **MCP (Model Context Protocol)**: chuẩn mở để kết nối model với công cụ và dữ liệu (Jira, Drive, DB nội bộ) qua một "server MCP".

### Kiến trúc đề xuất
~~~text
Nguồn: Confluence, SharePoint, Drive, PDF quy trình, Jira, ERP
   | (pipeline ingest: chuẩn hoá, chia đoạn, gắn metadata: phòng ban, ngôn ngữ, ACL, ngày cập nhật)
   v
Kho tri thức: vector index + BM25 index (+ ACL theo document)
   |
Câu hỏi --> [Auth: user, phòng ban] --> Retrieval (hybrid, lọc theo ACL) --> top 10–20 đoạn
                                                              |
         system prompt cố định (cache) + đoạn truy xuất + câu hỏi --> Claude
                                                              |
                         Câu trả lời + trích dẫn nguồn (link tài liệu, ngày cập nhật)
Dữ liệu sống (tồn kho, ticket) --> MCP server / tool có kiểm soát quyền
~~~

### Từng bước triển khai
1. **Phân loại tri thức**: cốt lõi ổn định (vài chục nghìn token) / kho lớn / dữ liệu sống. Mỗi loại một cơ chế như trên.
2. **Quyền truy cập là yêu cầu số 1**: lọc theo ACL **trước** khi đưa vào prompt. Model không được thấy tài liệu người hỏi không có quyền xem.
3. **Chất lượng dữ liệu**: loại bản trùng và bản cũ, gắn ngày cập nhật, chủ sở hữu tài liệu. RAG trên dữ liệu bẩn cho câu trả lời bẩn.
4. **Đa ngôn ngữ**: tài liệu tiếng Hàn, Anh, Việt, nên dùng embedding đa ngôn ngữ; Claude trả lời theo ngôn ngữ người hỏi, trích nguồn gốc.
5. **Bắt buộc trích dẫn**: yêu cầu model dẫn nguồn và nói "không tìm thấy trong tài liệu" khi không có, để giảm bịa.
6. **Eval**: bộ câu hỏi thật của từng phòng ban có đáp án; đo độ đúng, tỉ lệ trích đúng nguồn, tỉ lệ "không biết" hợp lý.
7. **Vận hành**: ingest gia tăng (chỉ tài liệu thay đổi), theo dõi câu hỏi không có đáp án để bổ sung tài liệu.

### Khi nào chọn gì
| Tình huống | Cách |
|---|---|
| Tri thức < khoảng vài trăm nghìn token, ít đổi | Đưa thẳng vào context + caching (context 1M) |
| Kho rất lớn, đổi liên tục, cần phân quyền | RAG hybrid + ACL |
| Số liệu thời gian thực, thao tác nghiệp vụ | Tool / MCP với quyền tối thiểu |
| Nhóm làm việc theo dự án trên ứng dụng Claude | Projects / connector của gói doanh nghiệp |

### Lỗi hay gặp
- **Đổ cả wiki vào vector DB không phân quyền** → nhân viên hỏi ra lương của người khác.
- **Chỉ dùng vector search** → trượt các truy vấn theo mã chính xác (mã model, mã lỗi).
- **Không có ngày cập nhật/nguồn** → người dùng không biết câu trả lời dựa trên quy trình cũ hay mới.
- **Fine-tune để "nhồi kiến thức"**: tốn kém, khó cập nhật, khó phân quyền. Với tri thức doanh nghiệp, retrieval gần như luôn là lựa chọn đúng.

### Trả lời miệng 1 phút
"Tôi chia tri thức thành ba loại. Phần cốt lõi ổn định như chính sách và glossary thì đưa thẳng vào system prompt và cache, vì context 1M cho phép. Kho tài liệu lớn thay đổi liên tục thì dùng RAG với hybrid search vector cộng từ khoá, contextual retrieval, và quan trọng nhất là lọc theo quyền của người hỏi trước khi đưa vào prompt. Dữ liệu sống như tồn kho hay ticket thì cho Claude truy cập qua tool hoặc MCP server với quyền tối thiểu. Câu trả lời luôn kèm trích dẫn nguồn và ngày cập nhật, có bộ eval theo phòng ban, và tôi theo dõi các câu hỏi không có đáp án để bổ sung tài liệu."

> Senior tip: ở tập đoàn lớn, phần khó nhất không phải model mà là **chủ sở hữu tri thức**. Hãy gắn mỗi bộ tài liệu với một phòng ban chịu trách nhiệm cập nhật, và hiển thị "tài liệu này do phòng X duy trì, cập nhật ngày Y" ngay trong câu trả lời.`,
  follow: ['Bạn đảm bảo Claude không trả lời từ tài liệu người dùng không có quyền xem bằng cách nào?', 'Khi nào đưa thẳng tài liệu vào context 1M thay vì RAG?'],
  tags: ['enterprise', 'RAG', 'knowledge', 'MCP', 'ACL', 'contextual retrieval']
},
{
  id: 'claude-019',
  topic: 'claude',
  level: 'lead',
  q: 'Agent Skills của Claude là gì? Trong một doanh nghiệp lớn, bạn xây và quản lý Skill (ví dụ "viết báo cáo chất lượng theo chuẩn công ty", "review code theo guideline nội bộ") thế nào?',
  a: `**Tóm tắt:** Một **Skill** là một **thư mục** chứa file {{SKILL.md}} (phần đầu có {{name}} và {{description}}, phần thân là hướng dẫn chi tiết), có thể kèm script, template, tài liệu tham khảo. Claude chỉ đọc **tên và mô tả** của mọi skill lúc đầu, rồi **chỉ nạp nội dung đầy đủ khi tác vụ cần**. Cơ chế này gọi là **progressive disclosure**: có thể cài nhiều skill mà không tốn context.

Skill dùng được trong ứng dụng Claude, Claude Code và qua API (kèm công cụ code execution). Với doanh nghiệp, Skill là cách **đóng gói quy trình và tiêu chuẩn của công ty** thành thứ tái sử dụng, có kiểm soát phiên bản.

### Hiểu nhanh
Skill giống bộ "SOP + mẫu biểu" đặt trên kệ. Nhân viên giỏi không học thuộc cả kệ, chỉ đọc nhãn gáy sách; khi gặp việc "làm báo cáo chất lượng" thì rút đúng cuốn đó ra đọc và làm theo, kể cả dùng mẫu Excel đi kèm.

### Thuật ngữ
- **SKILL.md**: file chính của skill; frontmatter YAML chứa {{name}} và {{description}}, thân là hướng dẫn.
- **Progressive disclosure**: chỉ nạp thông tin khi cần: tên/mô tả, rồi nội dung SKILL.md, rồi file phụ.
- **Description**: câu quyết định **khi nào** Claude dùng skill. Đây là phần quan trọng nhất để skill được kích hoạt đúng lúc.

### Cấu trúc một skill
~~~text
quality-report/
  SKILL.md              <- name, description + quy trình từng bước
  templates/report.docx <- mẫu báo cáo chuẩn công ty
  scripts/defect_stats.py  <- tính tỉ lệ lỗi từ file CSV
  reference/glossary.md    <- thuật ngữ chất lượng nội bộ
~~~
~~~yaml
---
name: quality-report
description: Viết báo cáo chất lượng sản phẩm theo chuẩn QA của công ty. Dùng khi người dùng yêu cầu báo cáo chất lượng, tổng hợp lỗi theo dây chuyền, hoặc báo cáo QA tuần/tháng.
---
# Quy trình
1. Đọc file dữ liệu lỗi (CSV) người dùng cung cấp; chạy scripts/defect_stats.py để tính tỉ lệ lỗi.
2. Điền templates/report.docx theo đúng thứ tự mục...
~~~

### Xây và quản lý skill ở doanh nghiệp, từng bước
1. **Chọn việc lặp lại và có chuẩn**: báo cáo định kỳ, review theo guideline, quy trình onboarding, soạn tài liệu theo mẫu. Đây là nơi skill tạo giá trị lớn nhất.
2. **Viết description thật cụ thể**: nói rõ "làm gì" và "dùng khi nào", có từ khoá người dùng hay nói. Description mơ hồ thì skill không bao giờ được gọi, hoặc bị gọi sai lúc.
3. **Giữ SKILL.md gọn, đẩy chi tiết ra file phụ**: tận dụng progressive disclosure; script cho phần tính toán cần chính xác (tính bằng code, không để model "nhẩm").
4. **Quản lý như code**: repo git, review, phiên bản, chủ sở hữu (phòng QA sở hữu skill QA), changelog.
5. **Test skill bằng eval**: các yêu cầu mẫu, kiểm tra skill có được kích hoạt và đầu ra đúng chuẩn.
6. **Phân phối có kiểm soát**: skill dùng chung toàn tổ chức (admin cấp phát, nếu gói đang dùng hỗ trợ), skill theo dự án (ví dụ thư mục skills trong repo cho Claude Code), skill cá nhân.
7. **Bảo mật**: skill có thể chứa script được thực thi, nên **chỉ dùng skill từ nguồn tin cậy**, review như review code, không nhúng secret vào skill.

### Skill khác gì các thứ khác
| | Dùng khi |
|---|---|
| System prompt / CLAUDE.md | Quy tắc **luôn** áp dụng cho mọi việc trong ngữ cảnh đó |
| Skill | Quy trình **chuyên biệt**, chỉ nạp khi cần, có thể kèm script và mẫu |
| Tool / MCP | Cần **truy cập hệ thống ngoài** hoặc thực hiện hành động (Jira, DB) |
| RAG | Tra cứu **kho tri thức lớn** |

### Lỗi hay gặp
- **Description chung chung** ("hỗ trợ báo cáo") → không kích hoạt đúng lúc.
- **Nhồi mọi thứ vào SKILL.md** → mất lợi ích progressive disclosure, tốn context.
- **Skill không có chủ sở hữu** → quy chuẩn công ty đổi mà skill vẫn dạy quy chuẩn cũ.
- **Dùng skill tải từ internet không review** → rủi ro script độc hại.

### Trả lời miệng 1 phút
"Skill là một thư mục có SKILL.md với name và description cộng hướng dẫn, kèm script, mẫu và tài liệu. Claude chỉ đọc tên và mô tả lúc đầu, khi việc cần mới nạp nội dung, nên có thể cài nhiều skill mà không tốn context. Ở doanh nghiệp, tôi dùng skill để đóng gói các quy trình lặp lại có chuẩn như báo cáo QA hay review theo guideline. Tôi viết description thật cụ thể vì nó quyết định khi nào skill được dùng, đặt phần tính toán vào script, quản lý skill như code có review, phiên bản và chủ sở hữu, test bằng eval, và chỉ dùng skill từ nguồn tin cậy vì chúng có thể chạy script."

> Senior tip: bắt đầu bằng **3–5 skill cho các quy trình tốn thời gian nhất** của một phòng ban thí điểm, đo thời gian làm trước và sau. Con số "báo cáo QA tuần từ 4 giờ xuống 30 phút" thuyết phục lãnh đạo hơn mọi bài thuyết trình về AI.`,
  follow: ['Khi nào bạn viết một skill thay vì một MCP server?', 'Bạn kiểm soát phiên bản và phân phối skill cho 20.000 nhân viên thế nào?'],
  tags: ['Agent Skills', 'SKILL.md', 'progressive disclosure', 'enterprise']
},
{
  id: 'claude-020',
  topic: 'claude',
  level: 'lead',
  q: 'Bạn là kiến trúc sư AI của một tập đoàn lớn. Thiết kế các "flow" dùng Claude (workflow cố định và agent) cùng khung quản trị (bảo mật, dữ liệu, chi phí, chất lượng) để triển khai cho nhiều phòng ban thế nào?',
  a: `**Tóm tắt:** Nguyên tắc là **bắt đầu đơn giản nhất có thể**: một lời gọi API, rồi **workflow** (luồng do code điều khiển: chuỗi bước, rẽ nhánh, song song), chỉ dùng **agent** (model tự quyết gọi tool nhiều bước) khi bài toán mở và lỗi có thể phát hiện, sửa được. Bao quanh là **nền tảng dùng chung**:
- gateway AI (key, quota, log, chi phí theo phòng ban);
- kho tri thức có phân quyền;
- thư viện skill, tool/MCP đã duyệt;
- bộ eval;
- chính sách dữ liệu (nền tảng triển khai, vùng xử lý, lưu trữ).

### Hiểu nhanh
Workflow giống dây chuyền lắp ráp: từng trạm làm đúng một việc theo thứ tự cố định, dễ kiểm soát. Agent giống kỹ thuật viên được giao "sửa máy này": tự chẩn đoán, tự chọn dụng cụ, linh hoạt hơn nhưng khó đoán hơn. Nhà máy tốt dùng dây chuyền cho việc lặp lại và chỉ cử kỹ thuật viên cho việc không lường trước.

### Thuật ngữ
- **Prompt chaining**: chuỗi bước, đầu ra bước trước là đầu vào bước sau (có thể kiểm tra giữa các bước).
- **Routing**: phân loại yêu cầu rồi chuyển tới luồng hoặc model phù hợp.
- **Parallelization**: chạy nhiều lời gọi song song rồi gộp (chia nhỏ việc, hoặc bỏ phiếu).
- **Orchestrator–workers**: một model điều phối chia việc cho nhiều worker.
- **Evaluator–optimizer**: một bước sinh, một bước chấm và góp ý, lặp tới khi đạt.
- **Human-in-the-loop**: người duyệt ở các bước rủi ro.

### Chọn flow cho từng bài toán
| Bài toán | Flow |
|---|---|
| Phân loại email/ticket rồi chuyển phòng ban | Routing (workflow) + Haiku |
| Dịch tài liệu kỹ thuật sang 10 ngôn ngữ rồi kiểm tra thuật ngữ | Chaining + parallelization + bước kiểm tra glossary |
| Soạn báo cáo QA tuần | Workflow + skill báo cáo + người duyệt |
| Trợ lý lập trình trong repo nội bộ | Agent (Claude Code) với quyền giới hạn |
| Điều tra sự cố từ log, metric, ticket | Agent có tool chỉ-đọc, người quyết định hành động |

### Khung quản trị, từng lớp
1. **Nền tảng & dữ liệu**:
   - Chọn kênh triển khai phù hợp chính sách: Claude API trực tiếp, hoặc qua nền tảng cloud công ty đang dùng (Amazon Bedrock, Google Cloud Vertex AI, Microsoft Foundry).
   - Xác định vùng xử lý dữ liệu, chính sách lưu trữ; phân loại dữ liệu nào được gửi (che PII, bí mật thương mại theo cấp độ).
2. **Danh tính & quyền**: SSO cho ứng dụng; tool và agent chạy với **quyền tối thiểu**; hành động ghi (gửi email, sửa dữ liệu, deploy) cần người xác nhận.
3. **Gateway AI dùng chung**: một điểm giữ key, quota và ngân sách **theo phòng ban/dự án** (workspace riêng), log usage, chặn lạm dụng.
4. **Danh mục dùng chung**: kho tri thức phân quyền, thư viện skill và MCP server đã được duyệt bảo mật. Phòng ban tái sử dụng, không tự dựng lại.
5. **Chất lượng**: mỗi flow có bộ eval và chỉ số (độ đúng, tỉ lệ người sửa, refusal rate); chạy lại khi đổi model hoặc prompt.
6. **An toàn**: phòng prompt injection (nội dung từ web, email, tài liệu không được coi là mệnh lệnh), giới hạn số bước agent, audit log mọi hành động của agent.
7. **Vận hành**: dashboard chi phí và chất lượng theo flow, feature flag để tắt nhanh, quy trình xử lý sự cố.

~~~text
               +---------------- Nền tảng AI dùng chung ----------------+
Phòng ban A -->| Gateway (SSO, quota/ngân sách, log, policy dữ liệu)     |--> Claude
Phòng ban B -->| Kho tri thức + ACL | Skill đã duyệt | MCP/tool đã duyệt  |    (API / Bedrock /
Phòng ban C -->| Eval & dashboard   | Audit log      | Feature flags      |     Vertex / Foundry)
               +--------------------------------------------------------+
~~~

### Lộ trình triển khai
1. **Thí điểm** 2–3 use case giá trị cao, rủi ro thấp (tóm tắt, phân loại, soạn thảo có người duyệt); đo trước và sau.
2. **Dựng nền tảng dùng chung** từ những gì thí điểm cần thật sự.
3. **Mở rộng** theo phòng ban với danh mục skill, tool có sẵn và hướng dẫn.
4. **Agent** cho các bài toán mở sau khi đã có eval, audit và quyền tối thiểu.

### Lỗi hay gặp
- **Bắt đầu bằng "agent tự động hoá mọi thứ"** → khó kiểm soát, lỗi khó tái hiện, mất niềm tin của lãnh đạo.
- **Mỗi phòng ban tự mua, tự tích hợp** → trùng lặp, không kiểm soát dữ liệu và chi phí.
- **Agent có quyền ghi rộng** (xoá, gửi, deploy) không cần xác nhận → một prompt injection trong email là đủ gây sự cố.
- **Không đo** → không chứng minh được ROI, dự án bị cắt.

### Trả lời miệng 1 phút
"Tôi theo nguyên tắc bắt đầu đơn giản: một lời gọi, rồi workflow do code điều khiển như chaining, routing, song song, và chỉ dùng agent cho bài toán mở mà lỗi phát hiện và sửa được. Bao quanh là nền tảng dùng chung: gateway giữ key, quota và ngân sách theo phòng ban; kho tri thức có phân quyền; thư viện skill và MCP đã duyệt; bộ eval cho từng flow. Về quản trị, tôi chọn kênh triển khai theo chính sách dữ liệu của tập đoàn, như API trực tiếp hoặc qua Bedrock, Vertex, Foundry, áp quyền tối thiểu cho tool, bắt người xác nhận hành động ghi, có audit log và phòng prompt injection. Lộ trình là thí điểm vài use case đo được ROI, rồi mới mở rộng."

> Senior tip: thước đo thành công ở tập đoàn không phải "số người dùng AI" mà là **số giờ công tiết kiệm được trên những quy trình cụ thể có chủ sở hữu**. Hãy thiết kế mọi flow sao cho con số đó đo được ngay từ ngày đầu.`,
  follow: ['Bạn phòng prompt injection cho một agent đọc email khách hàng thế nào?', 'Khi nào bạn chọn triển khai qua Bedrock/Vertex thay vì Claude API trực tiếp?', 'Làm sao chứng minh ROI của nền tảng AI cho ban lãnh đạo?'],
  tags: ['enterprise', 'workflow', 'agent', 'governance', 'kiến trúc']
}
);
