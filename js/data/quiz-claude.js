/* Multiple-choice bank for the Trac nghiem view - owner: task T318. Format: see AGENTS.md */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-claude-001',
  topic: 'claude',
  q: '[Applications] Một chatbot dùng Messages API trả lời sai ngữ cảnh ở lượt thứ 3 vì mỗi request chỉ gửi tin nhắn mới nhất. Nguyên nhân và cách sửa phù hợp nhất là gì?',
  options: [
    'API stateless; phải gửi toàn bộ lịch sử messages theo thứ tự, và cắt/tóm tắt khi gần đầy context',
    'API tự lưu lịch sử theo conversation_id, nên chỉ cần gửi message mới',
    'Gửi system prompt mới mỗi lượt để API khôi phục ngữ cảnh',
    'Tăng max_tokens để API nhớ các lượt trước'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Messages API là stateless.** Mỗi request độc lập, server không giữ lịch sử; client phải gửi mảng messages theo thứ tự. Khi hội thoại dài, cần cắt hoặc tóm tắt phần cũ để không vượt context window.

### Vì sao các phương án còn lại sai
- **API tự lưu lịch sử**: không có conversation_id mặc định; phải tự quản lý.
- **System prompt mới mỗi lượt**: system prompt định hướng hành vi, không thay thế lịch sử hội thoại.
- **Tăng max_tokens**: chỉ giới hạn độ dài output, không làm model nhớ lượt trước.`
},
{
  id: 'qz-claude-002',
  topic: 'claude',
  q: '[Applications] Response trả về stop_reason là max_tokens: câu trả lời bị cắt giữa chừng. Bước tiếp theo nào hợp lý nhất?',
  options: [
    'Retry nguyên request vì đây là lỗi tạm thời của server',
    'Gọi lại với max_tokens lớn hơn (dùng streaming nếu output dài), hoặc yêu cầu model trả lời ngắn gọn hơn',
    'Giảm temperature để model viết ít chữ hơn',
    'Coi như câu trả lời đã hoàn chỉnh và trả cho người dùng'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** {{max_tokens}} là trần số token **output** của một lượt. Khi model chạm trần, API dừng sinh và trả {{stop_reason: "max_tokens"}}: request **thành công** (HTTP 200) nhưng nội dung bị cắt.

### Vì sao các phương án khác sai
- **Retry nguyên request:** đây không phải lỗi tạm thời. Gửi lại y hệt thì lại bị cắt đúng chỗ đó.
- **Giảm temperature:** temperature không quyết định độ dài. Trên API version mới, gửi temperature cho các model hiện hành còn bị lỗi 400.
- **Coi như xong:** câu trả lời đang dở dang. Nếu là JSON hay code thì còn không parse được.

> Lưu ý: các model hiện hành (Opus 5.5, Sonnet 5.5, Fable 5.1…) **không còn hỗ trợ prefill** (gửi sẵn đoạn đầu của câu trả lời assistant), nên không "nối tiếp" bằng cách prefill được. Nếu output thật sự dài (tới 128K token), SDK yêu cầu dùng streaming để không bị timeout HTTP.`
},
{
  id: 'qz-claude-003',
  topic: 'claude',
  q: '[Applications] Ứng dụng nhận HTTP 529 (overloaded) khi gọi Messages API. Cách xử lý phù hợp nhất là gì?',
  options: [
    'Retry ngay lập tức liên tục cho đến khi thành công',
    'Chuyển mọi request sang model Haiku để tránh quá tải',
    'Exponential backoff có jitter, giới hạn số lần retry, và circuit breaker nếu lỗi kéo dài',
    'Bỏ qua lỗi và trả về cache cũ vĩnh viễn'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 529 là quá tải tạm thời.** Nên dùng exponential backoff có jitter, giới hạn retry và circuit breaker nếu kéo dài; tránh thundering herd.

### Vì sao các phương án còn lại sai
- **Retry ngay**: làm tăng tải và có thể bị chặn thêm.
- **Chuyển mọi request sang Haiku**: không phải giải pháp mặc định và có thể giảm chất lượng.
- **Cache cũ vĩnh viễn**: chỉ nên dùng fallback tạm thời, không vĩnh viễn.`
},
{
  id: 'qz-claude-004',
  topic: 'claude',
  q: '[Applications] Response 429 có header retry-after: 30. Ứng dụng nên làm gì?',
  options: [
    'Bỏ qua header và retry sau 1 giây',
    'Tăng số thread gửi request để throughput cao hơn',
    'Đổi API key khác để bỏ qua limit',
    'Chờ ít nhất 30 giây trước khi retry, đồng thời giảm tốc gửi request'
  ],
  answer: 3,
  explain: `**Đáp án đúng: retry-after là thời gian chờ tối thiểu.** Ứng dụng phải chờ ít nhất 30 giây và giảm tốc để không tiếp tục vượt rate limit.

### Vì sao các phương án còn lại sai
- **Bỏ qua header**: vi phạm hướng dẫn và dễ bị chặn tiếp.
- **Tăng thread**: làm rate limit tệ hơn.
- **Đổi API key**: limit thường ở cấp tổ chức/workspace, không bypass được.`
},
{
  id: 'qz-claude-005',
  topic: 'claude',
  q: '[Applications] Để prompt caching hiệu quả, thứ tự nội dung trong prompt nên như thế nào?',
  options: [
    'Đặt phần tĩnh trước và phần động sau; cache breakpoint ở ranh giới tĩnh/động',
    'Đặt phần động (câu hỏi user) trước, phần tĩnh (system, docs) sau để cache suffix',
    'Trộn lẫn tĩnh và động để phân tán cache',
    'Không cần thứ tự, cache tự tìm prefix chung'
  ],
  answer: 0,
  explain: `**Đáp án đúng: cache theo prefix.** Phần tĩnh phải đứng trước để trở thành prefix được cache; phần động đứng sau. Đặt breakpoint ở ranh giới tĩnh/động.

### Vì sao các phương án còn lại sai
- **Động trước**: prefix thay đổi mỗi request, cache vô hiệu.
- **Trộn**: phá vỡ prefix ổn định.
- **Cache tự tìm**: cache không tự tìm prefix; cần thứ tự và breakpoint.`
},
{
  id: 'qz-claude-006',
  topic: 'claude',
  q: '[Applications] Response usage có cache_read_input_tokens cao và input_tokens thấp. Điều này có nghĩa là gì?',
  options: [
    'Cache không hoạt động vì input_tokens thấp',
    'Phần lớn prompt được đọc từ cache, nên chi phí và độ trễ giảm',
    'Model đã bỏ qua phần cache và chỉ xử lý phần mới',
    'output_tokens sẽ tự động giảm theo'
  ],
  answer: 1,
  explain: `**Đáp án đúng: cache_read_input_tokens cao cho thấy phần lớn prompt được đọc từ cache.** input_tokens chỉ là phần sau breakpoint cuối, nên thấp là bình thường và có lợi.

### Vì sao các phương án còn lại sai
- **Cache không hoạt động**: ngược lại, đây là dấu hiệu cache hoạt động tốt.
- **Bỏ qua cache**: cache read được dùng trong attention, không bị bỏ qua.
- **output_tokens giảm**: output không tự giảm theo cache read.`
},
{
  id: 'qz-claude-007',
  topic: 'claude',
  q: '[Applications] Bạn cần xử lý 50.000 bản tóm tắt không cần kết quả ngay. Lựa chọn nào phù hợp nhất?',
  options: [
    'Gọi Messages API đồng bộ 50.000 lần với streaming',
    'Gửi tất cả trong một request với max_tokens lớn',
    'Dùng Message Batches API để xử lý async với giảm 50% chi phí',
    'Dùng prompt caching thay cho batch'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Message Batches API xử lý async và giảm 50% chi phí input/output**, phù hợp workload bulk không cần ngay.

### Vì sao các phương án còn lại sai
- **Đồng bộ 50.000 lần**: tốn rate limit và phức tạp.
- **Một request**: không chứa 50.000 tác vụ độc lập.
- **Caching thay batch**: caching giảm chi phí prefix, không thay thế xử lý bulk async.`
},
{
  id: 'qz-claude-008',
  topic: 'claude',
  q: '[Applications] Về Message Batches API, phát biểu nào đúng?',
  options: [
    'Kết quả stream về client theo thời gian thực',
    'Mỗi batch chỉ chứa 1 request để đảm bảo thứ tự',
    'Batch không được giảm giá',
    'Batch giới hạn 100.000 request hoặc 256MB; kết quả có sau khi xử lý xong hoặc 24h; lưu 29 ngày'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Batch giới hạn 100.000 request hoặc 256MB; kết quả truy cập khi tất cả xong hoặc sau 24h; kết quả lưu 29 ngày.** Batch xử lý async, không stream.

### Vì sao các phương án còn lại sai
- **Stream realtime**: batch không stream.
- **1 request/batch**: sai, batch chứa nhiều request.
- **Không giảm giá**: batch giảm 50%.`
},
{
  id: 'qz-claude-009',
  topic: 'claude',
  q: '[Applications] Khi stream Messages API, để hiển thị text dần cho người dùng, bạn nên xử lý event nào?',
  options: [
    'message_start rồi content_block_delta với delta.text',
    'content_block_stop rồi message_delta',
    'ping event chứa text',
    'error event chứa text đầy đủ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: text tăng dần nằm trong content_block_delta (delta.text).** message_start chỉ bắt đầu message, chưa có text.

### Vì sao các phương án còn lại sai
- **content_block_stop/message_delta**: occur khi block/message kết thúc, không phải text dần.
- **ping**: heartbeat, không chứa text.
- **error**: lỗi, không chứa text đầy đủ.`
},
{
  id: 'qz-claude-010',
  topic: 'claude',
  q: '[Applications] Hội thoại của chatbot đã dài gần chạm context window. Chiến lược nào phù hợp nhất?',
  options: [
    'Cứ gửi toàn bộ lịch sử, API sẽ tự cắt bớt lượt cũ mà không cần cấu hình gì',
    'Xoá system prompt để nhường chỗ cho lịch sử',
    'Tóm tắt các lượt cũ (tự làm, hoặc bật compaction phía server, đang beta), giữ nguyên các lượt gần nhất',
    'Tăng max_tokens để mở rộng context window'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** Messages API là **stateless**: mỗi request gửi lại toàn bộ hội thoại. Khi gần đầy context, cần giảm kích thước lịch sử nhưng vẫn giữ ý chính:
1. **Tự tóm tắt:** gọi model tóm tắt các lượt cũ rồi thay chúng bằng bản tóm tắt.
2. **Compaction (beta, header {{compact-2026-01-12}}):** server tự tóm tắt phần đầu hội thoại khi vượt ngưỡng. Client phải append nguyên {{response.content}} (gồm block compaction) vào lịch sử, không chỉ lấy phần text.

### Vì sao các phương án khác sai
- **API tự cắt mà không cần cấu hình:** sai. Không bật compaction thì request vượt context sẽ lỗi, không có chuyện tự cắt.
- **Xoá system prompt:** mất vai trò, ràng buộc và định dạng; tiết kiệm được rất ít.
- **Tăng max_tokens:** max_tokens là trần **output**, không mở rộng context window. Input cộng output vẫn phải nằm trong context.`
},
{
  id: 'qz-claude-011',
  topic: 'claude',
  q: '[Applications] Trước khi gửi request lớn, bạn muốn ước lượng chi phí. API nào phù hợp?',
  options: [
    'Gọi messages.create với max_tokens=0',
    'Nhân độ dài ký tự cho 4',
    'Dùng endpoint token counting để đếm input tokens mà không sinh output',
    'Dùng batch API để đếm'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Token counting endpoint trả về số input token cho prompt.** Dùng để ước lượng chi phí trước khi gửi.

### Vì sao các phương án còn lại sai
- **max_tokens=0**: không phải cách đếm input.
- **Nhân ký tự**: heuristic không chính xác.
- **Batch API**: xử lý batch, không đếm token.`
},
{
  id: 'qz-claude-012',
  topic: 'claude',
  q: '[Applications] Bạn cần response đúng JSON schema để parse tự động. Cách đúng trong Messages API là gì?',
  options: [
    'Nhờ model trả về JSON trong prompt và parse tự do',
    'Đặt temperature=0',
    'Dùng stop_sequences để ép JSON',
    'Dùng output_config.format với type json_schema (hoặc strict tool use) để ràng buộc schema'
  ],
  answer: 3,
  explain: `**Đáp án đúng: output_config.format với type json_schema ràng buộc output theo schema.** Strict tool use cũng đảm bảo schema cho tool input.

### Vì sao các phương án còn lại sai
- **Nhờ prompt**: không đảm bảo hợp lệ.
- **temperature=0**: chỉ giảm ngẫu nhiên, không ràng buộc schema.
- **stop_sequences**: chỉ dừng ở chuỗi, không đảm bảo JSON.`
},
{
  id: 'qz-claude-013',
  topic: 'claude',
  q: '[Applications] Trên Claude Opus 5.5, bạn muốn các tác vụ đơn giản (phân loại, trích xuất) chạy nhanh và rẻ hơn. Cấu hình nào đúng?',
  options: [
    'Đặt output_config.effort thấp (ví dụ low) cho route đó',
    'Gửi thinking: {type: "disabled"}',
    'Gửi thinking: {type: "enabled", budget_tokens: 1024}',
    'Đặt temperature: 0'
  ],
  answer: 0,
  explain: `**Đúng: phương án 1.** Trên Claude Opus 5.5 thinking **luôn bật** (adaptive). Cách duy nhất để điều chỉnh độ sâu suy nghĩ và lượng token tiêu tốn là {{output_config.effort}} ({{low}} / {{medium}} / {{high}} / {{xhigh}} / {{max}}). Mặc định của Opus 5.5 là {{medium}}; tác vụ đơn giản thường đạt yêu cầu ở {{low}}.

### Vì sao các phương án khác sai
- **thinking disabled:** Opus 5.5 trả lỗi 400 ở mọi mức effort.
- **budget_tokens:** cơ chế "ngân sách thinking" kiểu cũ đã bị bỏ trên các model 5.x. Gửi lên sẽ bị lỗi 400.
- **temperature: 0:** không làm model suy nghĩ ít đi. Từ API version 2026-10-21, gửi temperature còn bị lỗi 400 trên mọi model.

> Mẹo phỏng vấn: hãy nói "chỉnh effort theo từng route và đo trên mẫu request thật", đừng nói "tắt thinking cho rẻ".`
},
{
  id: 'qz-claude-014',
  topic: 'claude',
  q: '[Applications] Gửi ảnh cho Claude trong Messages API. Cách biểu diễn đúng là gì?',
  options: [
    'Chỉ gửi URL ảnh trong text',
    'Content block type image với source base64 hoặc url được hỗ trợ',
    'Gửi ảnh như file binary trong header',
    'Convert ảnh sang ASCII art'
  ],
  answer: 1,
  explain: `**Đáp án đúng: dùng content block type image với source phù hợp.** Model xử lý hình ảnh trực tiếp.

### Vì sao các phương án còn lại sai
- **URL trong text**: không đảm bảo model fetch ảnh.
- **Binary header**: API không nhận ảnh qua header.
- **ASCII art**: mất thông tin và không cần thiết.`
},
{
  id: 'qz-claude-015',
  topic: 'claude',
  q: '[Applications] Claude hỗ trợ PDF input. Điều nào đúng?',
  options: [
    'PDF luôn phải convert sang text trước khi gửi',
    'Chỉ hỗ trợ PDF dưới 1 trang',
    'Có thể gửi PDF như document block; model đọc text và hình trong PDF',
    'PDF chỉ dùng cho batch API'
  ],
  answer: 2,
  explain: `**Đáp án đúng: có thể gửi PDF như document block**, model đọc nội dung (subject to context limits).

### Vì sao các phương án còn lại sai
- **Luôn convert**: không bắt buộc.
- **Chỉ dưới 1 trang**: không đúng, giới hạn là context window.
- **Chỉ batch**: không đúng.`
},
{
  id: 'qz-claude-016',
  topic: 'claude',
  q: '[Applications] Trên Claude Opus 5.5, bạn cần chắc chắn Claude gọi tool extract_invoice với input đúng schema. Cách nào phù hợp?',
  options: [
    'tool_choice: {type: "tool", name: "extract_invoice"}',
    'tool_choice: {type: "any"}',
    'Tăng max_tokens và hy vọng model tự gọi',
    'tool_choice auto, system prompt nói rõ phải gọi extract_invoice, và đặt strict: true trên tool (hoặc dùng structured outputs nếu chỉ cần JSON)'
  ],
  answer: 3,
  explain: `**Đúng: phương án 4.** Trên Claude Opus 5.5, Sonnet 5.5 và Fable 5.1, **forced tool use** ({{tool_choice}} {{any}} hoặc {{tool}}) trả lỗi 400. Cách thay thế:
1. {{tool_choice}} kiểu {{auto}} kèm hướng dẫn rõ trong prompt (ví dụ "luôn gọi extract_invoice với dữ liệu hoá đơn").
2. {{strict: true}} trên định nghĩa tool (schema có {{additionalProperties: false}} và {{required}}). API đảm bảo {{tool_use.input}} hợp lệ theo schema.
3. Nếu mục đích chỉ là lấy JSON, dùng **structured outputs** ({{output_config.format}}), không cần tool.

### Vì sao các phương án khác sai
- **type tool / type any:** đúng với model đời cũ, nhưng bị từ chối (400) trên các model hiện hành kể trên.
- **Tăng max_tokens:** không liên quan đến việc chọn tool.

> Đây là bẫy hay gặp khi nâng cấp model: code cũ ép tool bằng {{tool_choice}} sẽ bắt đầu lỗi 400 sau khi đổi model.`
},
{
  id: 'qz-claude-017',
  topic: 'claude',
  q: '[Applications] max_tokens trong request Messages API kiểm soát điều gì?',
  options: [
    'Số token output tối đa model được sinh',
    'Số token input tối đa',
    'Tổng token context window',
    'Số request mỗi phút'
  ],
  answer: 0,
  explain: `**Đáp án đúng: max_tokens giới hạn output.** Input/context/rate limit là khái niệm khác.

### Vì sao các phương án còn lại sai
- **Input tối đa**: do context window và rate limit.
- **Context window**: capability của model.
- **RPM**: rate limit.`
},
{
  id: 'qz-claude-018',
  topic: 'claude',
  q: '[Applications] Khi gọi Claude API bằng HTTP thuần (không qua SDK), header nào bắt buộc để chỉ định phiên bản API?',
  options: [
    'api-version: v1',
    'x-api-version: latest',
    'anthropic-version, ví dụ 2023-06-01 (SDK mới gửi phiên bản mới hơn, như 2026-10-21)',
    'version: claude-5'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** Mọi request HTTP tới Claude API cần 3 header:
- {{x-api-key}}: API key;
- {{anthropic-version}}: phiên bản API, ví dụ {{2023-06-01}};
- {{content-type: application/json}}.

SDK chính thức tự gửi {{anthropic-version}}. Các bản SDK mới chuyển sang phiên bản mới hơn ({{2026-10-21}}). Phiên bản này thay đổi một số hành vi, ví dụ gửi {{temperature}} / {{top_p}} / {{top_k}} sẽ bị lỗi 400. Vì vậy khi nâng SDK cần đọc hướng dẫn chuyển version.

### Vì sao các phương án khác sai
Các header {{api-version}}, {{x-api-version}}, {{version}} không tồn tại trong Claude API. Không có giá trị "latest": version luôn là một ngày cụ thể, để hành vi API không đổi ngầm dưới chân bạn.`
},
{
  id: 'qz-claude-019',
  topic: 'claude',
  q: '[Applications] stop_reason là refusal. Cách xử lý phù hợp?',
  options: [
    'Retry vô hạn với cùng prompt',
    'Tăng max_tokens',
    'Đọc stop_details, điều chỉnh prompt hoặc fallback model, không ép model vi phạm policy',
    'Bỏ qua và trả về rỗng'
  ],
  answer: 2,
  explain: `**Đáp án đúng: refusal là model từ chối.** Cần điều chỉnh yêu cầu hoặc fallback an toàn.

### Vì sao các phương án còn lại sai
- **Retry vô hạn**: không thay đổi kết quả và lãng phí.
- **Tăng max_tokens**: không liên quan policy.
- **Trả rỗng**: trải nghiệm kém và không giải thích.`
},
{
  id: 'qz-claude-020',
  topic: 'claude',
  q: '[Applications] Web search tool của Claude khác user-defined tool ở điểm nào?',
  options: [
    'Web search phải implement ở client',
    'User-defined tool chạy trên Anthropic',
    'Cả hai đều chạy ở client',
    'Web search chạy trên hạ tầng Anthropic, kết quả trả về trong cùng response'
  ],
  answer: 3,
  explain: `**Đáp án đúng: web search là server tool**, Anthropic thực thi và trả kết quả; client tool cần round trip tool_result.

### Vì sao các phương án còn lại sai
- **Web search client**: sai.
- **User-defined trên Anthropic**: sai, chạy ở client.
- **Cả hai client**: sai.`
},
{
  id: 'qz-claude-021',
  topic: 'claude',
  q: '[Model Selection] Ứng dụng phân loại email khối lượng lớn, độ trễ thấp. Nên chọn model nào?',
  options: [
    'Claude Haiku 5.5',
    'Claude Fable 5.1',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Haiku 5.5 nhanh nhất và rẻ nhất** cho tác vụ high-volume, latency-sensitive như classification/extraction/routing.`
},
{
  id: 'qz-claude-022',
  topic: 'claude',
  q: '[Model Selection] Tác vụ coding agent chạy lâu, nhiều bước. Model nào phù hợp nhất?',
  options: [
    'Claude Haiku 5.5',
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'Claude Fable 5.1'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Opus 5.5 dành cho long-running agentic coding và knowledge work.** Fable dành cho reasoning rất nặng/long-horizon; Sonnet cân bằng tốc độ/trí tuệ; Haiku cho tác vụ nhẹ.`
},
{
  id: 'qz-claude-023',
  topic: 'claude',
  q: '[Model Selection] Model nào được mô tả là cân bằng tốt nhất giữa tốc độ và trí tuệ?',
  options: [
    'Claude Opus 5.5',
    'Claude Haiku 5.5',
    'Claude Sonnet 5.5',
    'Claude Fable 5.1'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Sonnet 5.5** là best combination of speed and intelligence.`
},
{
  id: 'qz-claude-024',
  topic: 'claude',
  q: '[Model Selection] Tác vụ reasoning rất nặng, agent dài hạn; eval trên Opus ở effort cao vẫn chưa đủ. Nên chọn gì?',
  options: [
    'Claude Opus 5.5',
    'Claude Sonnet 5.5',
    'Claude Haiku 5.5',
    'Claude Fable 5.1'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Fable 5.1** cho demanding reasoning và long-horizon agentic work, hoặc khi eval trên Opus ở effort cao vẫn thiếu.`
},
{
  id: 'qz-claude-025',
  topic: 'claude',
  q: '[Model Selection] Claude Haiku 5.5 có đặc điểm pricing nào?',
  options: [
    'Prompt trên 100.000 tokens trả giá cao hơn cho input/output',
    'Giá cố định mọi prompt length',
    'Prompt trên 100.000 tokens được giảm giá',
    'Chỉ batch API mới áp dụng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Haiku 5.5 giá theo độ dài prompt; prompt trên 100.000 tokens trả giá cao hơn.** Các model khác có full 1M context ở giá chuẩn.`
},
{
  id: 'qz-claude-026',
  topic: 'claude',
  q: '[Model Selection] Context window của các model Claude hiện hành là bao nhiêu?',
  options: [
    '32K tokens',
    '1M tokens',
    '128K tokens',
    '200K tokens'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 1M tokens.** 1M là context window của các model hiện hành (Opus/Sonnet/Haiku 5.5, Fable 5.1), tính cả input lẫn output. 128K là trần **output** (max_tokens); 200K là context của một số model đời trước như Haiku 4.5; 32K là của các thế hệ rất cũ.`
},
{
  id: 'qz-claude-027',
  topic: 'claude',
  q: '[Model Selection] max_tokens tối đa của các model hiện hành (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1) là bao nhiêu, và cần lưu ý gì?',
  options: [
    '4K token, không lưu ý gì',
    '128K token; với giá trị lớn như vậy, SDK yêu cầu dùng streaming để tránh timeout HTTP',
    '1M token, bằng context window',
    '32K token, chỉ nâng được bằng Batch API'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** Các model hiện hành cho phép tới **128K token output** mỗi lượt. Request non-streaming chờ lâu có thể vượt timeout HTTP, nên SDK yêu cầu streaming với giá trị lớn ({{.stream()}} rồi lấy {{finalMessage()}} / {{get_final_message()}}).

### Vì sao các phương án khác sai
- **4K / 32K:** là giới hạn của các thế hệ model rất cũ.
- **1M:** đó là **context window** (input cộng output), không phải trần output.

> Gợi ý thực tế: request non-streaming nên để max_tokens khoảng 16K; streaming thì có thể để cao hơn. Đừng đặt max_tokens quá thấp, vì bị cắt giữa chừng sẽ phải gọi lại, tốn hơn.`
},
{
  id: 'qz-claude-028',
  topic: 'claude',
  q: '[Applications] Bạn nhận kết quả của một Message Batch gồm 10.000 request. Cách ghép kết quả với dữ liệu gốc nào là đúng?',
  options: [
    'Ghép theo thứ tự: kết quả thứ i ứng với request thứ i',
    'Ghép theo thời gian hoàn thành',
    'Ghép theo nội dung câu trả lời',
    'Ghép theo custom_id đã gán cho từng request khi tạo batch'
  ],
  answer: 3,
  explain: `**Đúng: phương án 4.** Mỗi request trong batch có {{custom_id}} do bạn đặt (ví dụ id bản ghi trong DB). Kết quả trả về **theo thứ tự bất kỳ**, nên phải ghép theo {{custom_id}}, không bao giờ theo vị trí.

Mỗi kết quả có {{result.type}} là một trong {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}. Cần xử lý cả bốn: ví dụ gom các request errored hoặc expired để gửi lại trong batch sau.

### Vì sao các phương án khác sai
- **Theo thứ tự:** thứ tự không được đảm bảo. Ghép theo vị trí sẽ gán nhầm kết quả cho bản ghi khác, và lỗi này rất khó phát hiện.
- **Theo thời gian / nội dung:** không xác định duy nhất request gốc.`
},
{
  id: 'qz-claude-029',
  topic: 'claude',
  q: '[Model Selection] Giá cache read (đọc từ prompt cache) so với giá input thường như thế nào?',
  options: [
    'Rẻ hơn nhiều: khoảng 0.1x giá input; một số model có giá riêng (ví dụ Opus 5.5: $0.20/MTok so với $4/MTok input)',
    'Bằng 1.25x giá input',
    'Bằng giá input, cache chỉ giúp giảm độ trễ',
    'Gấp 2 lần giá input'
  ],
  answer: 0,
  explain: `**Đúng: phương án 1.** Prompt caching có 2 loại chi phí:
- **Cache write** (lần đầu ghi prefix vào cache): **đắt hơn** input thường, khoảng 1.25x với TTL 5 phút, cao hơn nữa với TTL 1 giờ.
- **Cache read** (các lần sau dùng lại prefix): **rẻ hơn rất nhiều**, thường khoảng 0.1x. Một số model có giá riêng: Opus 5.5 và Sonnet 5.5 đọc cache với giá $0.20/MTok (tương ứng 0.05x và 0.1x giá input), Fable 5.1 là $0.25/MTok.

Vì vậy cache chỉ có lợi khi prefix **được dùng lại nhiều lần** trong thời gian TTL.

### Vì sao các phương án khác sai
- **1.25x:** đó là giá **write**, không phải read.
- **Bằng giá input:** sai. Cache giảm cả chi phí lẫn độ trễ.
- **Gấp 2:** không có mức giá nào như vậy.

> Kiểm tra cache có hoạt động không: xem {{usage.cache_read_input_tokens}}. Nếu luôn bằng 0 dù prefix giống nhau thì có thứ gì đó làm prefix thay đổi, ví dụ timestamp trong system prompt.`
},
{
  id: 'qz-claude-030',
  topic: 'claude',
  q: '[Model Selection] Để tối ưu chi phí/chất lượng, chiến lược routing nào hợp lý?',
  options: [
    'Luôn dùng model lớn nhất cho mọi request',
    'Dùng model nhỏ/rẻ cho tác vụ đơn giản, escalate lên model lớn khi eval cho thấy cần',
    'Chỉ dùng Haiku vì rẻ nhất',
    'Chọn model theo tên người dùng'
  ],
  answer: 1,
  explain: `**Đáp án đúng: routing theo độ khó**, bắt đầu model nhỏ và escalate khi eval cho thấy cần.`
},
{
  id: 'qz-claude-031',
  topic: 'claude',
  q: '[Agents] Trong agent dùng tool, vòng lặp cơ bản là gì?',
  options: [
    'Gửi prompt một lần và parse text',
    'Gửi tất cả tool cùng lúc rồi kết thúc',
    'Gửi request; nếu stop_reason là tool_use thì chạy tool và gửi tool_result; lặp cho đến end_turn',
    'Chỉ dùng server tools, không loop'
  ],
  answer: 2,
  explain: `**Đáp án đúng: agentic loop dựa trên stop_reason tool_use**, xử lý tool rồi gửi kết quả về, lặp cho đến end_turn.`
},
{
  id: 'qz-claude-032',
  topic: 'claude',
  q: '[Agents] stop_reason là pause_turn. Bạn nên làm gì?',
  options: [
    'Bỏ qua và kết thúc',
    'Retry từ đầu',
    'Tăng max_tokens',
    'Gửi lại assistant content để tiếp tục vòng server-tool'
  ],
  answer: 3,
  explain: `**Đáp án đúng: pause_turn nghĩa là server-tool loop đạt giới hạn iteration**, gửi lại assistant content để tiếp tục.`
},
{
  id: 'qz-claude-033',
  topic: 'claude',
  q: '[Agents] Claude có thể gọi nhiều tool trong cùng một lượt. Để xử lý đúng, ứng dụng phải làm gì?',
  options: [
    'Chạy tất cả tool_use block và trả về nhiều tool_result tương ứng',
    'Chỉ xử lý tool_use đầu tiên',
    'Bỏ qua các tool còn lại',
    'Gửi lại prompt'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phải xử lý mọi tool_use block và trả về tool_result khớp từng id.**`
},
{
  id: 'qz-claude-034',
  topic: 'claude',
  q: '[Agents] Nếu muốn Claude gọi từng tool một, dùng tham số nào?',
  options: [
    'max_tokens: 1',
    'tool_choice: {type: auto, disable_parallel_tool_use: true}',
    'temperature: 0',
    'stop_sequences: [tool_use]'
  ],
  answer: 1,
  explain: `**Đáp án đúng: disable_parallel_tool_use trong tool_choice auto** ngăn gọi nhiều tool song song.`
},
{
  id: 'qz-claude-035',
  topic: 'claude',
  q: '[Agents] Một tool do bạn định nghĩa bị lỗi khi chạy (ví dụ API ngoài trả 500). Bạn nên báo lại cho Claude thế nào?',
  options: [
    'Bỏ qua tool_use đó, không gửi tool_result',
    'Gửi tool_result có is_error: true kèm thông điệp lỗi ngắn gọn, để Claude tự quyết thử lại hay đổi cách',
    'Ném exception và dừng toàn bộ agent',
    'Gửi tool_result rỗng như thể thành công'
  ],
  answer: 1,
  explain: `**Đúng: phương án 2.** Với mỗi {{tool_use}} trong lượt assistant, lượt user tiếp theo **phải** có {{tool_result}} cùng {{tool_use_id}}. Khi tool lỗi, gửi {{is_error: true}} và một thông điệp rõ ràng (ví dụ "Billing API timeout sau 5s"). Claude sẽ tự chọn thử lại, dùng tool khác hoặc báo cho người dùng.

### Vì sao các phương án khác sai
- **Không gửi tool_result:** request tiếp theo bị lỗi vì có tool_use chưa được trả lời.
- **Dừng cả agent:** một lỗi tạm thời không nên làm hỏng cả phiên làm việc. Nên để model xử lý, kèm giới hạn số bước và số lần thử lại ở phía bạn.
- **Giả vờ thành công:** model sẽ suy luận trên dữ liệu không tồn tại, dẫn tới trả lời sai mà không ai biết.

> Nếu Claude gọi nhiều tool song song, trả **tất cả** tool_result trong **một** message user. Tool nào lỗi thì đánh dấu is_error, đừng bỏ sót.`
},
{
  id: 'qz-claude-036',
  topic: 'claude',
  q: '[Agents] Khi gửi tool_result về API, trường nào phải khớp với tool_use?',
  options: [
    'name phải bằng user id',
    'content phải rỗng',
    'type phải là tool_use',
    'tool_use_id phải bằng id của tool_use block'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tool_result dùng tool_use_id để liên kết với tool_use block.**`
},
{
  id: 'qz-claude-037',
  topic: 'claude',
  q: '[Agents] Để Claude gọi tool ít hoặc nhiều hơn, nên làm gì?',
  options: [
    'Dùng system prompt mô tả khi nào dùng tool, và tool description rõ ràng',
    'Chỉ chỉnh temperature',
    'Xóa tool description',
    'Tăng max_tokens'
  ],
  answer: 0,
  explain: `**Đáp án đúng: steering qua system prompt và mô tả tool rõ ràng.** Temperature không điều khiển tool use.`
},
{
  id: 'qz-claude-038',
  topic: 'claude',
  q: '[Agents] Dùng MCP connector trong Messages API cần header beta nào?',
  options: [
    'anthropic-version: 2023-06-01',
    'anthropic-beta: mcp-client-2025-11-20',
    'x-mcp: true',
    'beta: mcp-latest'
  ],
  answer: 1,
  explain: `**Đáp án đúng: beta header mcp-client-2025-11-20.** Version header là bắt buộc nhưng không phải beta MCP.`
},
{
  id: 'qz-claude-039',
  topic: 'claude',
  q: '[Agents] MCP connector hiện hỗ trợ gì và giới hạn gì?',
  options: [
    'Hỗ trợ toàn bộ MCP spec kể cả resources/prompts',
    'Hỗ trợ local STDIO server trực tiếp',
    'Hỗ trợ tool calls; server phải public HTTP, không STDIO; chỉ tool calls trong spec',
    'Không cần beta header'
  ],
  answer: 2,
  explain: `**Đáp án đúng: chỉ tool calls, server public HTTP, không STDIO.** Resources/prompts chưa hỗ trợ.`
},
{
  id: 'qz-claude-040',
  topic: 'claude',
  q: '[Prompt] System prompt nên dùng để làm gì?',
  options: [
    'Chứa toàn bộ lịch sử hội thoại',
    'Thay thế tool schema',
    'Lưu API key',
    'Định nghĩa vai trò, ràng buộc, định dạng và chính sách cho model'
  ],
  answer: 3,
  explain: `**Đáp án đúng: system prompt định hướng hành vi và ràng buộc.** Lịch sử nằm ở messages.`
},
{
  id: 'qz-claude-041',
  topic: 'claude',
  q: '[Prompt] Prompt cache có TTL nào?',
  options: [
    '5 phút mặc định; có thể 1 giờ với cache_control ttl 1h (write giá cao hơn)',
    'Chỉ 1 phút',
    'Vĩnh viễn',
    '24 giờ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: mặc định 5 phút; 1 giờ với ttl 1h** và cache write đắt hơn.`
},
{
  id: 'qz-claude-042',
  topic: 'claude',
  q: '[Prompt] Automatic caching (cache_control ở top-level) phù hợp khi nào?',
  options: [
    'Khi cần kiểm soát chính xác từng breakpoint',
    'Khi muốn hệ thống tự quản lý cache breakpoint khi hội thoại tăng dần',
    'Khi không muốn cache',
    'Chỉ dùng cho batch API'
  ],
  answer: 1,
  explain: `**Đáp án đúng: automatic caching tự quản lý breakpoint** khi hội thoại tăng dần; explicit cho kiểm soát chi tiết.`
},
{
  id: 'qz-claude-043',
  topic: 'claude',
  q: '[Prompt] Khi đưa tài liệu lớn và câu hỏi, thứ tự nào giúp caching và attention tốt hơn?',
  options: [
    'Câu hỏi trước, tài liệu sau',
    'Trộn tài liệu và câu hỏi',
    'Tài liệu (tĩnh) trước, câu hỏi (động) sau',
    'Chỉ gửi câu hỏi'
  ],
  answer: 2,
  explain: `**Đáp án đúng: nội dung tĩnh trước, động sau** để cache prefix và rõ ràng.`
},
{
  id: 'qz-claude-044',
  topic: 'claude',
  q: '[Prompt] Để giảm prompt injection từ nội dung người dùng, biện pháp nào phù hợp?',
  options: [
    'Tin mọi instruction trong user content',
    'Tắt system prompt',
    'Dùng temperature cao',
    'Tách system policy và user content, validate/escape, dùng tool schema và output constraints'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tách policy và content, validate/sanitize.** Không tin instruction trong user content.`
},
{
  id: 'qz-claude-045',
  topic: 'claude',
  q: '[Prompt] Few-shot examples nên đặt ở đâu để hiệu quả và cache tốt?',
  options: [
    'Trong system/user prompt trước câu hỏi thực tế, ổn định giữa các request',
    'Sau câu hỏi người dùng',
    'Trong tool result',
    'Không dùng examples'
  ],
  answer: 0,
  explain: `**Đáp án đúng: examples ổn định đứng trước câu hỏi thực tế**, giúp cache và nhất quán.`
},
{
  id: 'qz-claude-046',
  topic: 'claude',
  q: '[Prompt] Muốn câu trả lời ngắn gọn, cách nào hiệu quả hơn chỉ dựa vào max_tokens?',
  options: [
    'Chỉ giảm max_tokens',
    'Nêu rõ ràng độ dài mong muốn trong prompt và format',
    'Tăng temperature',
    'Dùng model lớn hơn'
  ],
  answer: 1,
  explain: `**Đáp án đúng: chỉ dẫn rõ ràng về độ dài/format trong prompt** hiệu quả hơn chỉ cắt token.`
},
{
  id: 'qz-claude-047',
  topic: 'claude',
  q: '[Tools] Để Claude gọi function do bạn định nghĩa, cần cung cấp gì?',
  options: [
    'Chỉ tên function',
    'Chỉ description',
    'name, description và input_schema JSON Schema',
    'API key của function'
  ],
  answer: 2,
  explain: `**Đáp án đúng: tool cần name, description và input_schema.**`
},
{
  id: 'qz-claude-048',
  topic: 'claude',
  q: '[Tools] tool_choice: {type: none} có tác dụng gì?',
  options: [
    'Buộc gọi tool',
    'Tắt tất cả tool',
    'Chỉ dùng server tools',
    'Ngăn Claude gọi tool, chỉ sinh text'
  ],
  answer: 3,
  explain: `**Đáp án đúng: none ngăn model gọi tool trong lượt đó**, nhưng tool vẫn được khai báo.`
},
{
  id: 'qz-claude-049',
  topic: 'claude',
  q: '[Tools] Strict tool use (strict: true) đảm bảo điều gì?',
  options: [
    'Tên tool và input được validate theo schema',
    'Model luôn gọi tool',
    'Tool chạy nhanh hơn',
    'Không cần input_schema'
  ],
  answer: 0,
  explain: `**Đáp án đúng: strict đảm bảo tên tool và input đúng schema.**`
},
{
  id: 'qz-claude-050',
  topic: 'claude',
  q: '[Tools] Web search là loại tool nào và ai thực thi?',
  options: [
    'Client tool, ứng dụng phải gọi search engine',
    'Server tool, Anthropic thực thi và trả kết quả trong response',
    'MCP tool bắt buộc',
    'Batch-only tool'
  ],
  answer: 1,
  explain: `**Đáp án đúng: web search là server tool**, Anthropic thực thi.`
},
{
  id: 'qz-claude-051',
  topic: 'claude',
  q: '[Tools] Code execution tool cho phép gì?',
  options: [
    'Chạy code trên máy client',
    'Biên dịch Java trên server người dùng',
    'Claude chạy code trong sandbox của Anthropic',
    'Chỉ chạy Python local'
  ],
  answer: 2,
  explain: `**Đáp án đúng: code execution chạy trong sandbox của Anthropic.**`
},
{
  id: 'qz-claude-052',
  topic: 'claude',
  q: '[Tools] Dùng MCP connector trong Messages API, ngoài mcp_servers bạn còn phải khai báo gì?',
  options: [
    'Không cần gì thêm, chỉ mcp_servers là đủ',
    'Một client tool tên "mcp" do bạn tự viết',
    'Một tool type mcp_toolset trong tools, trỏ tới cùng tên server (mcp_server_name), kèm beta header mcp-client-2025-11-20',
    'Một system prompt liệt kê URL của server'
  ],
  answer: 2,
  explain: `**Đúng: phương án 3.** MCP connector cần **cả hai phần**:
1. {{mcp_servers}} (mỗi phần tử có {{type: "url"}}, {{url}}, {{name}}): khai báo server MCP từ xa (qua HTTP).
2. Trong {{tools}}, một mục {{type: "mcp_toolset"}} với {{mcp_server_name}} trùng {{name}} ở trên: cho phép Claude dùng tool của server đó. Trong toolset có thể cấu hình bật hoặc tắt từng tool.

Kèm beta header {{mcp-client-2025-11-20}}.

### Vì sao các phương án khác sai
- **Chỉ mcp_servers:** bị từ chối với lỗi validation.
- **Tự viết client tool "mcp":** đó là cách tự triển khai, không phải MCP connector. Với connector, Anthropic gọi server MCP giúp bạn.
- **Ghi URL trong prompt:** model không tự kết nối tới URL nằm trong prompt.`
},
{
  id: 'qz-claude-053',
  topic: 'claude',
  q: '[Security] API key Anthropic nên được lưu ở đâu trong ứng dụng web?',
  options: [
    'Trên server/backend, frontend gọi qua backend',
    'Trong frontend JS để gọi trực tiếp',
    'Trong localStorage',
    'Trong URL query'
  ],
  answer: 0,
  explain: `**Đáp án đúng: không để API key ở client.** Gọi qua backend để bảo mật.`
},
{
  id: 'qz-claude-054',
  topic: 'claude',
  q: '[Security] Khi Claude có tool truy cập dữ liệu nhạy cảm, rủi ro nào lớn nhất?',
  options: [
    'Model tự xóa database',
    'Prompt injection khiến model gọi tool với tham số độc hại',
    'API key hết hạn',
    'Rate limit'
  ],
  answer: 1,
  explain: `**Đáp án đúng: prompt injection có thể làm model gọi tool sai mục đích.** Cần guardrails và validation.`
},
{
  id: 'qz-claude-055',
  topic: 'claude',
  q: '[Security] Trước khi gửi dữ liệu người dùng cho API, nên làm gì?',
  options: [
    'Gửi nguyên mọi PII vì API an toàn tuyệt đối',
    'Mã hóa bằng base64',
    'Cân nhắc minimize/redact PII, tuân thủ chính sách và pháp lý',
    'Nén gzip'
  ],
  answer: 2,
  explain: `**Đáp án đúng: giảm thiểu PII và tuân thủ chính sách.** Base64/gzip không phải bảo mật.`
},
{
  id: 'qz-claude-056',
  topic: 'claude',
  q: '[Security] Khi model từ chối do safety, ứng dụng nên làm gì?',
  options: [
    'Retry liên tục với cùng prompt',
    'Tăng temperature',
    'Bỏ qua policy',
    'Giải thích giới hạn, điều chỉnh yêu cầu hợp lệ, hoặc fallback an toàn'
  ],
  answer: 3,
  explain: `**Đáp án đúng: không ép model vi phạm; điều chỉnh hoặc fallback an toàn.**`
},
{
  id: 'qz-claude-057',
  topic: 'claude',
  q: '[Security] Dù dùng structured output, server vẫn nên làm gì?',
  options: [
    'Validate/sanitize output trước khi dùng, đặc biệt với code/SQL',
    'Tin tuyệt đối output',
    'Không cần log',
    'Tắt schema'
  ],
  answer: 0,
  explain: `**Đáp án đúng: output vẫn cần validate/sanitize** vì schema không đảm bảo an toàn ngữ nghĩa.`
},
{
  id: 'qz-claude-058',
  topic: 'claude',
  q: '[Claude Code] Trong Claude Code, file CLAUDE.md dùng để làm gì?',
  options: [
    'Lưu API key',
    'Cung cấp hướng dẫn/ngữ cảnh dự án cho agent',
    'Định nghĩa database schema bắt buộc',
    'Thay thế git'
  ],
  answer: 1,
  explain: `**Đáp án đúng: CLAUDE.md cung cấp context/hướng dẫn dự án** cho Claude Code.`
},
{
  id: 'qz-claude-059',
  topic: 'claude',
  q: '[Claude Code] Claude Code thực thi lệnh shell/file. Best practice về quyền là gì?',
  options: [
    'Cho phép mọi lệnh tự động',
    'Tắt sandbox',
    'Review/approve các hành động nguy hiểm, giới hạn quyền và audit',
    'Chia sẻ session công khai'
  ],
  answer: 2,
  explain: `**Đáp án đúng: giới hạn quyền, review hành động nguy hiểm và audit.**`
},
{
  id: 'qz-claude-060',
  topic: 'claude',
  q: '[Eval] Để đánh giá chất lượng ứng dụng LLM, phương pháp nào phù hợp?',
  options: [
    'Chỉ đọc vài câu trả lời',
    'Tăng temperature để đa dạng',
    'Xóa log',
    'Bộ eval có test case, expected behavior, chấm tự động/model grader, theo dõi regression'
  ],
  answer: 3,
  explain: `**Đáp án đúng: eval có test case và regression tracking** để đo chất lượng khách quan.`
},
{
  id: 'qz-claude-061',
  topic: 'claude',
  q: '[Applications] Backend stream một response có tool_use. Code gọi JSON parser trên từng event content_block_delta loại input_json_delta và liên tục gặp JsonParseException. Cách sửa đúng là gì?',
  options: [
    'Nối các mẩu partial_json của block đó thành một chuỗi, chỉ parse khi nhận content_block_stop của block',
    'Tắt streaming vì tool use không hỗ trợ stream',
    'Parse từng mẩu bằng parser "dễ tính" và bỏ qua mẩu nào lỗi',
    'Đọc input đầy đủ của tool từ event message_start'
  ],
  answer: 0,
  explain: `**Đúng: nối chuỗi rồi mới parse.** Khi stream, input của tool không đến một lần mà đến thành nhiều mẩu {{input_json_delta}}, mỗi mẩu là một đoạn **chuỗi JSON dở dang** trong field {{partial_json}}. Từng mẩu riêng lẻ gần như không bao giờ là JSON hợp lệ. Cách đúng: gom các mẩu theo {{index}} của block, tới {{content_block_stop}} thì chuỗi đã đầy đủ và mới parse.

### Vì sao các phương án khác sai
- **Tắt streaming:** tool use chạy tốt với stream; tắt đi chỉ làm mất lợi ích hiển thị dần và có thể gặp timeout với output dài.
- **Parser dễ tính, bỏ qua mẩu lỗi:** sẽ mất dữ liệu hoặc parse ra object sai mà không ai biết.
- **message_start:** event này chỉ chứa thông tin đầu message (id, model, usage ban đầu), chưa có nội dung block nào.

> SDK chính thức có helper gom stream thành message cuối cùng; nếu tự đọc SSE thì phải tự làm việc gom chuỗi này.`
},
{
  id: 'qz-claude-062',
  topic: 'claude',
  q: '[Applications] Đang stream câu trả lời cho người dùng thì backend nhận một event error (overloaded_error) giữa chừng, sau khi đã đẩy xuống trình duyệt khoảng nửa đoạn văn. HTTP status ban đầu là 200. Xử lý nào đúng?',
  options: [
    'Lưu phần text đã nhận như câu trả lời hoàn chỉnh vì HTTP status là 200',
    'Đánh dấu câu trả lời là dở dang (không lưu như bản hoàn chỉnh), báo client, rồi thử lại có backoff vì overloaded là lỗi tạm thời',
    'Bỏ qua event error vì nó giống event ping',
    'Retry ngay lập tức liên tục cho tới khi stream chạy hết'
  ],
  answer: 1,
  explain: `**Đúng: coi là dở dang, báo client, retry có backoff.** Với streaming, status 200 được gửi **trước** khi nội dung sinh xong. Lỗi xảy ra sau đó (ví dụ {{overloaded_error}}) được gửi dưới dạng event {{error}} trong chính luồng SSE. Phần text đã nhận là **không đầy đủ**: không có {{message_delta}} với stop_reason, không có usage cuối.

### Vì sao các phương án khác sai
- **Lưu như hoàn chỉnh vì 200:** status 200 chỉ nói kết nối mở thành công; người dùng sẽ thấy câu trả lời cụt nằm trong lịch sử như thật.
- **Coi như ping:** ping là heartbeat giữ kết nối; event error mang lỗi thật cần xử lý.
- **Retry ngay liên tục:** overloaded là quá tải tạm thời; dội request ngay làm tình trạng tệ hơn. Cần backoff có jitter và giới hạn số lần.`
},
{
  id: 'qz-claude-063',
  topic: 'claude',
  q: `[Applications] Code đọc câu trả lời bằng {{response.content[0].text}} và thỉnh thoảng nhận chuỗi rỗng hoặc null. Response lỗi trông như sau:
~~~json
{
  "stop_reason": "end_turn",
  "content": [
    { "type": "thinking", "thinking": "", "signature": "..." },
    { "type": "text", "text": "Đơn ORD-100200 đã giao ngày 20/10." }
  ]
}
~~~
Cách sửa đúng là gì?`,
  options: [
    'Gửi thinking type disabled để block đầu tiên luôn là text',
    'Luôn đọc content[content.length - 1].text vì text luôn là block cuối',
    'Duyệt mảng content và chỉ lấy các block có type là text (xử lý riêng thinking, tool_use)',
    'Retry request vì content[0] rỗng là lỗi phía server'
  ],
  answer: 2,
  explain: `**Đúng: duyệt content theo type.** {{content}} là **mảng các block** có kiểu khác nhau: {{thinking}}, {{text}}, {{tool_use}}… Trên các model hiện hành thinking là adaptive và block thinking thường đứng trước, nội dung có thể trống (chế độ hiển thị mặc định là omitted). Vì vậy block đầu tiên không chắc là text.

### Vì sao các phương án khác sai
- **thinking disabled:** trên Opus 5.5 thinking luôn bật; gửi disabled trả lỗi 400. Kể cả model cho tắt thì đây cũng là sửa sai chỗ: code vẫn giòn khi gặp tool_use.
- **Lấy block cuối:** response có thể kết thúc bằng tool_use, hoặc có nhiều block text. Giả định vị trí nào cũng giòn như nhau.
- **Retry:** đây là response hợp lệ (end_turn), không phải lỗi server; retry chỉ tốn tiền.`
},
{
  id: 'qz-claude-064',
  topic: 'claude',
  q: '[Applications] Team bọc lời gọi SDK Claude bằng Resilience4j Retry (thêm 5 lần thử lại, tổng 6 lần gọi). Khi API quá tải, log cho thấy một request người dùng sinh ra tới 18 lời gọi HTTP. Nguyên nhân và cách sửa phù hợp nhất?',
  options: [
    'Resilience4j bị lỗi; nâng phiên bản thư viện',
    'Do jitter; bỏ jitter để số lần gọi ổn định',
    'Do API trả 529 nhiều lần; nên retry ngay không chờ để kết thúc sớm',
    'SDK chính thức mặc định đã tự retry 2 lần (tổng 3 lần mỗi lần gọi), nhân với 6 lần ở ngoài thành 18; chọn một tầng chịu trách nhiệm retry'
  ],
  answer: 3,
  explain: `**Đúng: retry chồng retry.** SDK chính thức mặc định tự retry 2 lần với các lỗi như 408, 409, 429, 5xx (kể cả 529). Mỗi lần Resilience4j gọi SDK là tối đa 3 lời gọi HTTP; 6 lần × 3 = 18. Khi API đang quá tải, bão retry này làm tình trạng tệ hơn và kéo dài thời gian người dùng chờ.

Cách sửa: chọn **một** tầng retry. Hoặc giữ retry của SDK (cấu hình số lần, có backoff sẵn) và bỏ Retry bên ngoài; hoặc đặt số retry của SDK về 0 và để Resilience4j làm (backoff + jitter, giới hạn tổng thời gian). Circuit breaker vẫn nên giữ.

### Vì sao các phương án khác sai
- **Lỗi thư viện:** hành vi đúng như cấu hình, không phải bug.
- **Bỏ jitter:** jitter không làm tăng số lần gọi; bỏ đi còn khiến nhiều client retry cùng lúc (thundering herd).
- **Retry ngay không chờ:** đúng lúc server quá tải mà dội request liên tục là cách tệ nhất.`
},
{
  id: 'qz-claude-065',
  topic: 'claude',
  q: '[Applications] Endpoint chat của một ứng dụng Spring MVC gọi Claude đồng bộ, dùng timeout mặc định của SDK. Một buổi chiều API chậm bất thường, thread pool Tomcat cạn và cả các trang không dùng AI cũng treo. Thay đổi nào giải quyết đúng gốc vấn đề?',
  options: [
    'Đặt timeout theo route (SDK mặc định tới 10 phút, quá dài cho request người dùng đang chờ), thêm bulkhead giới hạn số lời gọi AI đồng thời và circuit breaker có fallback',
    'Tăng kích thước thread pool Tomcat lên gấp 10',
    'Giảm max_tokens xuống 100 để API trả lời nhanh hơn',
    'Chuyển sang Batch API cho endpoint chat'
  ],
  answer: 0,
  explain: `**Đúng: timeout theo route + bulkhead + circuit breaker.** Timeout mặc định của SDK rất dài (khoảng 10 phút) vì phải phục vụ cả request sinh output lớn. Với request người dùng đang chờ, mỗi lời gọi chậm giữ một thread Tomcat rất lâu; vài trăm lời gọi như vậy là cạn pool, kéo sập cả phần không liên quan tới AI. Bulkhead cô lập: AI chậm chỉ ăn hết "ngăn" của AI. Circuit breaker trả fallback ("AI đang bận") khi lỗi kéo dài. Streaming hoặc virtual threads giúp thêm, nhưng vẫn cần timeout.

### Vì sao các phương án khác sai
- **Tăng thread pool:** chỉ dời thời điểm sập, tốn bộ nhớ, và không giới hạn được thời gian chờ.
- **max_tokens 100:** câu trả lời bị cắt (stop_reason max_tokens); độ chậm khi API quá tải không do độ dài output.
- **Batch API:** dành cho việc không cần kết quả ngay (tới 24 giờ), không hợp với chat.`
},
{
  id: 'qz-claude-066',
  topic: 'claude',
  multi: true,
  q: '[Applications] Bạn viết lớp retry dùng chung cho mọi lời gọi Claude API. Những lỗi nào nên được retry tự động (có backoff)? (Chọn 3)',
  options: [
    '429 rate_limit_error',
    '400 invalid_request_error',
    '529 overloaded_error',
    '401 authentication_error',
    '500 api_error',
    '413 request_too_large'
  ],
  answer: [0, 2, 4],
  explain: `**Đúng: 429, 529, 500.** Đây là các lỗi **tạm thời**: gửi lại sau một lúc có thể thành công.
- **429:** vượt hạn mức của tổ chức; chờ ít nhất theo header {{retry-after}} và giảm tốc.
- **529:** phía Anthropic quá tải tạm thời; exponential backoff + jitter.
- **500:** lỗi nội bộ không mong muốn; retry có giới hạn.

### Vì sao các lỗi còn lại không retry
- **400 invalid_request_error:** request sai (thiếu field, tham số không hỗ trợ như prefill trên model mới). Gửi lại y nguyên vẫn sai, chỉ tốn tiền.
- **401 authentication_error:** API key sai hoặc thiếu; phải sửa cấu hình.
- **413 request_too_large:** request vượt giới hạn kích thước; phải giảm kích thước, retry không giúp gì.

> Ghi log request id (header {{request-id}}) của các lỗi không retry để điều tra, đừng nuốt lỗi.`
},
{
  id: 'qz-claude-067',
  topic: 'claude',
  q: '[Applications] Người dùng upload một file PDF scan rất nặng (khoảng 40 MB sau khi base64) để Claude đọc. API trả về 413 request_too_large. Cách xử lý đúng là gì?',
  options: [
    'Retry với exponential backoff vì 413 là lỗi tạm thời',
    'Không retry nguyên request; giảm kích thước cho dưới giới hạn request (32 MB): tách PDF thành nhiều phần, nén hoặc giảm độ phân giải trang scan',
    'Tăng max_tokens để request chứa được tài liệu lớn',
    'Chuyển sang model có context 1M để nâng giới hạn kích thước request'
  ],
  answer: 1,
  explain: `**Đúng: giảm kích thước request.** 413 nghĩa là **payload HTTP** vượt giới hạn kích thước của endpoint (Messages API khoảng 32 MB). Đây là giới hạn về byte, không phải về token. Base64 còn làm file to thêm khoảng 33%. Cách làm: kiểm tra kích thước ở backend trước khi gửi, tách tài liệu theo chương, giảm độ phân giải ảnh scan.

### Vì sao các phương án khác sai
- **Retry:** 413 không phải lỗi tạm thời; gửi lại y nguyên luôn bị từ chối.
- **Tăng max_tokens:** max_tokens chỉ là trần **output**, không liên quan kích thước input.
- **Model context 1M:** context window tính bằng token; giới hạn kích thước request tính bằng byte và áp dụng cho mọi model. Mọi model hiện hành vốn đã có 1M context.`
},
{
  id: 'qz-claude-068',
  topic: 'claude',
  q: '[Applications] Một Message Batch 10.000 request kết thúc (processing_status là ended): 9.700 succeeded, 200 errored, 100 expired. Bước tiếp theo hợp lý nhất?',
  options: [
    'Gửi lại toàn bộ 10.000 request vì batch không thành công trọn vẹn',
    'Chờ thêm vì các request expired sẽ tự được xử lý lại',
    'Ghép kết quả theo custom_id; gom các request expired (và errored do lỗi tạm thời) gửi lại trong batch mới; request errored do request sai thì sửa trước khi gửi',
    'Coi các request expired là thành công với nội dung rỗng'
  ],
  answer: 2,
  explain: `**Đúng: xử lý theo từng loại kết quả.** Mỗi dòng kết quả có {{result.type}}: {{succeeded}}, {{errored}}, {{canceled}}, {{expired}}.
- **expired:** batch hết thời hạn xử lý (24 giờ) trước khi tới lượt request đó; nội dung request không sai, gửi lại là hợp lý.
- **errored:** cần đọc lỗi. Lỗi do request không hợp lệ (ví dụ tham số không hỗ trợ) thì sửa rồi mới gửi; lỗi tạm thời thì gửi lại.
- Luôn ghép theo {{custom_id}} vì thứ tự kết quả không được đảm bảo.

### Vì sao các phương án khác sai
- **Gửi lại cả 10.000:** trả tiền lần hai cho 9.700 kết quả đã có.
- **Chờ tự chạy lại:** batch đã ended; không có cơ chế tự xử lý lại.
- **Coi expired là thành công:** ghi dữ liệu rỗng vào DB như thể hợp lệ, lỗi rất khó phát hiện về sau.`
},
{
  id: 'qz-claude-069',
  topic: 'claude',
  multi: true,
  q: '[Applications] Bạn chuẩn bị thuyết trình cho team về Message Batches API. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Giá bằng 50% so với gọi Messages API thông thường',
    'Có thể stream kết quả của từng request về client theo thời gian thực',
    'Kết quả trả về theo đúng thứ tự các request đã gửi',
    'Phần lớn batch xong trong vòng 1 giờ, tối đa 24 giờ; request chưa xử lý khi hết hạn sẽ có kết quả expired',
    'Server-side fallback khi gặp refusal dùng được bên trong batch'
  ],
  answer: [0, 3],
  explain: `**Đúng: giảm 50% giá, và mốc thời gian 1 giờ / 24 giờ kèm kết quả expired.** Batch xử lý bất đồng bộ tới 100.000 request (hoặc 256 MB) mỗi batch; kết quả lưu 29 ngày.

### Vì sao các phát biểu còn lại sai
- **Stream từng request:** batch không hỗ trợ streaming; bạn poll trạng thái rồi đọc file kết quả khi {{processing_status}} là {{ended}}.
- **Đúng thứ tự:** kết quả có thể về theo thứ tự bất kỳ; phải ghép bằng {{custom_id}}.
- **Fallback trong batch:** tính năng fallback phía server (beta) không dùng được trong Batch API; với batch bạn tự đọc {{stop_reason}} của từng kết quả và tự xử lý refusal.`
},
{
  id: 'qz-claude-070',
  topic: 'claude',
  q: '[Applications] Team đã bật server-side fallback (beta, "fallbacks": "default") cho chatbot để giảm refusal nhầm. Họ muốn dùng y hệt cho job Message Batch chạy hằng đêm. Nhận định nào đúng?',
  options: [
    'Chỉ cần thêm fallbacks vào params của từng request trong batch',
    'Fallback làm refusal biến mất hoàn toàn nên không cần kiểm tra stop_reason nữa',
    'Fallback chỉ áp dụng cho lỗi 529, không liên quan refusal',
    'Fallback phía server không dùng được trong Batch API; job batch phải tự đọc stop_reason refusal trong kết quả và tự quyết định xử lý lại'
  ],
  answer: 3,
  explain: `**Đúng: batch không hỗ trợ fallback phía server.** Fallback (beta) khiến API tự chạy lại yêu cầu bị từ chối trên một model dự phòng **trong cùng request** Messages API thường. Batch API không hỗ trợ tính năng này, nên job batch phải tự: đọc từng kết quả, thấy {{stop_reason}} là {{refusal}} thì ghi metric theo {{stop_details}} và quyết định gửi lại (ví dụ bằng request thường có fallback) hoặc chuyển người xử lý.

### Vì sao các phương án khác sai
- **Thêm fallbacks vào params:** không được hỗ trợ trong batch.
- **Không cần kiểm tra stop_reason:** kể cả khi fallback chạy, model dự phòng cũng có thể từ chối; luôn kiểm tra stop_reason.
- **Chỉ cho 529:** fallback này xử lý refusal, không phải lỗi quá tải. Quá tải xử lý bằng retry/backoff.`
},
{
  id: 'qz-claude-071',
  topic: 'claude',
  q: '[Applications] Service AI chạy 10 pod. Mỗi pod tự giới hạn ở 80% hạn mức input token/phút (ITPM) của tổ chức, vậy mà giờ cao điểm vẫn nhận 429 liên tục. Nguyên nhân và cách sửa?',
  options: [
    'Hạn mức áp cho cả tổ chức/workspace nên 10 pod cộng lại vượt xa; cần điều tiết tập trung (hàng đợi + token bucket dùng chung, ví dụ Redis) ở mức thấp hơn hạn mức',
    'Mỗi pod cần một API key riêng để có hạn mức riêng',
    'Hạn mức chỉ tính theo số request, nên chỉ cần gom nhiều câu hỏi vào một request',
    'Tăng số retry khi gặp 429 lên 20 lần'
  ],
  answer: 0,
  explain: `**Đúng: hạn mức là chung.** Rate limit áp theo tổ chức (và workspace) cho từng nhóm model, theo ba chiều: request/phút, input token/phút, output token/phút. 10 pod × 80% = 800% hạn mức. Cần một bộ điều tiết **dùng chung**: các pod đẩy job vào hàng đợi, worker lấy job theo token bucket chung (Redis + Lua để atomic), chạy thấp hơn hạn mức khoảng 10–20%.

### Vì sao các phương án khác sai
- **API key riêng mỗi pod:** các key trong cùng tổ chức/workspace dùng chung hạn mức; không phải cách tăng hạn mức.
- **Chỉ tính theo request:** sai, token input/output cũng bị giới hạn; gom nhiều câu vào một request còn làm ITPM tăng nhanh hơn.
- **Retry 20 lần:** retry không tạo thêm hạn mức; chỉ tạo bão request và tăng độ trễ.`
},
{
  id: 'qz-claude-072',
  topic: 'claude',
  q: '[Applications] Bạn muốn worker tự giảm tốc trước khi bị 429, thay vì đợi lỗi rồi mới phản ứng. Nguồn dữ liệu nào phù hợp nhất?',
  options: [
    'Gọi endpoint count_tokens trước mỗi request để biết tổ chức còn bao nhiêu hạn mức',
    'Đọc các header anthropic-ratelimit-*-remaining và -reset (requests, input-tokens, output-tokens) trong mỗi response',
    'Đọc usage.input_tokens trong body response để suy ra hạn mức còn lại',
    'Không có cách nào biết trước; chỉ phản ứng khi nhận 429'
  ],
  answer: 1,
  explain: `**Đúng: header rate limit.** Mỗi response có các header {{anthropic-ratelimit-requests-remaining}}, {{anthropic-ratelimit-input-tokens-remaining}}, {{anthropic-ratelimit-output-tokens-remaining}} cùng các header {{-limit}} và {{-reset}}. Đưa chúng vào bộ điều tiết (hoặc dashboard) để giảm tốc khi phần còn lại xuống thấp. Khi đã bị 429 thì đọc {{retry-after}}.

### Vì sao các phương án khác sai
- **count_tokens:** đếm token của **một prompt**, không cho biết hạn mức còn lại của tổ chức.
- **usage.input_tokens:** là số token của chính request đó, không phải hạn mức.
- **Không biết trước:** sai, header remaining tồn tại chính để làm việc này.`
},
{
  id: 'qz-claude-073',
  topic: 'claude',
  q: '[Applications] Đã đặt cache_control cuối system prompt, nhưng cache_read_input_tokens gần như luôn bằng 0. Diff hai request liên tiếp cho thấy phần "Ngữ cảnh khách hàng" (Java serialize từ một HashMap ra JSON) đứng trong system prompt có thứ tự khoá khác nhau giữa các lần. Cách sửa đúng?',
  options: [
    'Thêm breakpoint thứ hai ngay sau phần ngữ cảnh để cache "khớp gần đúng"',
    'Chuyển sang TTL 1 giờ để cache giữ lâu hơn',
    'Cache khớp prefix từng byte nên thứ tự khoá thay đổi làm vỡ cache; serialize ổn định (sắp xếp khoá, LinkedHashMap/TreeMap) và tốt nhất chuyển dữ liệu theo khách ra sau breakpoint',
    'Prompt caching không hoạt động với nội dung JSON'
  ],
  answer: 2,
  explain: `**Đúng: prefix phải giống từng byte.** {{HashMap}} không đảm bảo thứ tự duyệt, nên JSON sinh ra có thể khác thứ tự khoá giữa các lần (hoặc giữa các JVM). Với cache, chỉ cần lệch một ký tự trước breakpoint là toàn bộ phần sau đó phải ghi lại. Sửa: serialize với thứ tự cố định, và đưa dữ liệu thay đổi theo từng khách xuống **sau** breakpoint (trong tin nhắn user) để phần system luôn ổn định.

### Vì sao các phương án khác sai
- **Breakpoint thứ hai để khớp gần đúng:** cache không khớp mờ; breakpoint thêm vẫn nằm sau phần đã lệch.
- **TTL 1 giờ:** vấn đề là prefix khác nhau chứ không phải hết hạn; TTL dài hơn không giúp gì.
- **Không hoạt động với JSON:** cache không quan tâm nội dung là gì, chỉ cần prefix giống hệt.

> Viết một test tự động dựng request hai lần với dữ liệu khác nhau rồi assert phần trước breakpoint giống hệt: bắt được lỗi này ngay trong CI.`
},
{
  id: 'qz-claude-074',
  topic: 'claude',
  multi: true,
  q: '[Applications] Route chatbot có system prompt 30K token đặt cache_control. Thay đổi nào dưới đây sẽ làm cache hit rate tụt mạnh? (Chọn 3)',
  options: [
    'Chèn thời gian hiện tại (tới giây) vào đầu system prompt',
    'Thêm hoặc bớt tool trong mảng tools tuỳ theo quyền của từng người dùng',
    'Câu hỏi mới của người dùng nằm trong messages, sau breakpoint cuối',
    'A/B test luân phiên hai model khác nhau trên cùng route',
    'Gửi request tiếp theo trong vòng TTL với prefix giống hệt'
  ],
  answer: [0, 1, 3],
  explain: `**Đúng: timestamp đầu system, tools thay đổi theo người dùng, và đổi model.**
- **Timestamp:** làm prefix khác nhau ở mỗi request ngay từ đầu, cache gần như luôn miss.
- **Tools thay đổi:** thứ tự render prefix là {{tools}} rồi {{system}} rồi {{messages}}; tools nằm đầu nên thêm/bớt một tool làm vỡ toàn bộ cache phía sau. Giữ bộ tools cố định cho route, kiểm tra quyền ở tầng thực thi tool.
- **Đổi model:** cache tách riêng theo model; luân phiên hai model chia đôi lưu lượng và mỗi bên phải ghi cache riêng.

### Vì sao hai phương án còn lại không làm tụt cache
- **Câu hỏi sau breakpoint:** đây chính là thiết kế đúng: phần động nằm sau phần được cache.
- **Gửi lại trong TTL với prefix giống hệt:** đây là trường hợp cache hit, và mỗi lần dùng còn làm mới TTL.`
},
{
  id: 'qz-claude-075',
  topic: 'claude',
  q: '[Applications] Một route có system prompt rất ngắn (khoảng 300 token) gắn cache_control. Mọi response đều có cache_creation_input_tokens và cache_read_input_tokens bằng 0, và API không báo lỗi. Giải thích nào đúng?',
  options: [
    'cache_control chỉ có tác dụng khi đặt ở tin nhắn user cuối cùng',
    'Phải gửi beta header mới bật được prompt caching',
    'Cache chỉ có hiệu lực từ request thứ ba trở đi',
    'Prefix ngắn hơn ngưỡng tối thiểu có thể cache của model nên không được cache, và API không báo lỗi; cache chỉ đáng dùng cho prefix đủ dài'
  ],
  answer: 3,
  explain: `**Đúng: dưới ngưỡng tối thiểu thì không cache, và không có lỗi.** Mỗi model có độ dài prefix tối thiểu để được cache (cỡ vài trăm tới vài nghìn token tuỳ model). Prefix ngắn hơn thì request vẫn chạy bình thường, chỉ là không ghi và không đọc cache. Với system prompt 300 token, lợi ích cache cũng rất nhỏ; nên dồn công sức vào các route có prefix dài (tài liệu, tool definitions, lịch sử dài).

### Vì sao các phương án khác sai
- **Chỉ ở tin nhắn user cuối:** cache_control đặt được ở tools, system hoặc messages; vị trí đúng là cuối phần ổn định.
- **Beta header:** prompt caching dùng được mà không cần beta header.
- **Từ request thứ ba:** request đầu ghi cache (cache_creation lớn hơn 0), request sau trong TTL đọc cache; không có quy tắc "lần thứ ba".`
},
{
  id: 'qz-claude-076',
  topic: 'claude',
  q: '[Applications] Công cụ nội bộ gửi kèm một tài liệu 60K token (đã đặt cache_control) trong mỗi request, nhưng chỉ có khoảng 4 request mỗi giờ, cách nhau ~15 phút. Usage cho thấy request nào cũng ghi cache và không bao giờ đọc được. Điều chỉnh phù hợp nhất?',
  options: [
    'Dùng TTL 1 giờ cho breakpoint đó, chấp nhận giá ghi cache cao hơn (khoảng 2x giá input) để các request cách 15 phút vẫn đọc được cache',
    'Tăng số breakpoint lên 8 để cache sống lâu hơn',
    'Đặt tài liệu xuống sau câu hỏi để cache phần cuối prompt',
    'Đặt TTL 24 giờ để chỉ ghi cache một lần mỗi ngày'
  ],
  answer: 0,
  explain: `**Đúng: TTL 1 giờ.** TTL mặc định là 5 phút và được làm mới mỗi khi cache được dùng. Lưu lượng thưa (15 phút một lần) khiến cache luôn hết hạn trước request tiếp theo, nên lần nào cũng trả giá **ghi** (khoảng 1.25x input) mà không bao giờ được giá **đọc** (khoảng 0.1x). Với TTL 1 giờ, chỉ lần đầu trả giá ghi cao hơn (khoảng 2x), các lần sau trong giờ đó đọc cache rẻ.

### Vì sao các phương án khác sai
- **8 breakpoint:** tối đa 4 breakpoint mỗi request; số breakpoint cũng không ảnh hưởng thời gian sống.
- **Tài liệu sau câu hỏi:** cache khớp theo **prefix**; câu hỏi thay đổi đứng trước thì prefix đổi mỗi lần, cache vô dụng.
- **TTL 24 giờ:** chỉ có hai lựa chọn TTL là 5 phút và 1 giờ.`
},
{
  id: 'qz-claude-077',
  topic: 'claude',
  q: '[Applications] Trong một phiên, luật sư hỏi khoảng 20 câu về cùng một hợp đồng PDF 200 trang. Hiện mỗi câu hỏi backend lại gửi nguyên file base64. Cách tối ưu phù hợp nhất?',
  options: [
    'Gửi base64 nhưng nén gzip trước để giảm số token',
    'Upload PDF một lần qua Files API, tham chiếu bằng file_id ở các request sau, và đặt cache_control sau document block để các câu hỏi sau đọc cache',
    'Chuyển từng trang PDF thành ảnh vì ảnh rẻ hơn',
    'Tóm tắt hợp đồng thành một đoạn ngắn rồi chỉ gửi bản tóm tắt cho mọi câu hỏi, kể cả câu hỏi chi tiết về điều khoản'
  ],
  answer: 1,
  explain: `**Đúng: Files API + prompt caching.** Files API cho phép upload file một lần và tham chiếu bằng {{file_id}}, nên không phải truyền lại hàng chục MB mỗi request. Nhưng token của tài liệu **vẫn được tính** mỗi lần model đọc; để giảm chi phí token, đặt document ở đầu và gắn {{cache_control}} ngay sau nó: các câu hỏi tiếp theo trong TTL chỉ trả giá cache read (khoảng 0.1x).

### Vì sao các phương án khác sai
- **gzip:** token được tính trên nội dung model đọc, không phải trên số byte truyền đi; nén đường truyền không làm giảm token.
- **Chuyển sang ảnh:** không rẻ hơn và còn mất lớp text của PDF; PDF block đã cho model đọc cả chữ lẫn hình.
- **Chỉ gửi bản tóm tắt:** mất chi tiết; câu hỏi về điều khoản cụ thể sẽ bị trả lời sai hoặc bịa.`
},
{
  id: 'qz-claude-078',
  topic: 'claude',
  q: `[Applications] Request sau trả lỗi 400:
~~~json
{
  "model": "claude-sonnet-5-5",
  "max_tokens": 2048,
  "output_config": { "format": { "type": "json_schema", "schema": { "...": "..." } } },
  "messages": [{ "role": "user", "content": [
    { "type": "document", "source": { "type": "file", "file_id": "file_abc" },
      "citations": { "enabled": true } },
    { "type": "text", "text": "Trích các điều khoản phạt hợp đồng." }
  ] }]
}
~~~
Nguyên nhân hợp lý nhất?`,
  options: [
    'Thiếu beta header riêng cho citations',
    'Document block phải đứng sau text câu hỏi',
    'Citations và structured outputs không dùng chung được trong một request; phải chọn một trong hai',
    'max_tokens 2048 quá thấp cho tài liệu dài'
  ],
  answer: 2,
  explain: `**Đúng: citations không dùng cùng structured outputs.** Bật {{citations.enabled}} trên document và đồng thời ràng buộc output bằng {{output_config.format}} là tổ hợp bị từ chối (400). Chọn theo nhu cầu:
- Cần **trích dẫn chính xác** tới đoạn trong tài liệu để hiển thị/kiểm toán: giữ citations, bỏ structured outputs, parse câu trả lời có trích dẫn.
- Cần **JSON đúng schema**: bỏ citations, thêm field kiểu {{quote}} và {{clause_number}} vào schema, rồi tự kiểm chứng đoạn trích có thật trong văn bản gốc.

### Vì sao các phương án khác sai
- **Beta header cho citations:** không phải nguyên nhân của lỗi này.
- **Thứ tự document/text:** tài liệu đặt **trước** câu hỏi là cách khuyến nghị.
- **max_tokens thấp:** chỉ gây cắt output (stop_reason max_tokens), không gây 400.`
},
{
  id: 'qz-claude-079',
  topic: 'claude',
  q: '[Applications] Người dùng muốn Opus 5.5 rà soát một bộ hồ sơ PDF 900 trang trong một lần. Thiết kế nào đúng với giới hạn của API?',
  options: [
    'Context là 1M token nên gửi được mọi PDF miễn tổng token chưa vượt 1M',
    'Chỉ cần tăng max_tokens lên 128K để chứa tài liệu',
    'Dùng Batch API vì batch không giới hạn số trang',
    'Một request tối đa 600 trang PDF/ảnh (với model context 1M) và giới hạn kích thước request; tách hồ sơ theo phần, xử lý từng phần (có thể song song) rồi tổng hợp'
  ],
  answer: 3,
  explain: `**Đúng: tách tài liệu.** Ngoài giới hạn token, mỗi request còn có giới hạn **600 ảnh hoặc trang PDF** (100 với model context 200K) và giới hạn kích thước payload. Với 900 trang: chia theo chương/phần, mỗi lời gọi trích các điểm cần thiết vào định dạng cố định, rồi một lời gọi cuối tổng hợp. Cách này còn dễ kiểm tra từng phần và chạy song song được.

### Vì sao các phương án khác sai
- **Chỉ cần dưới 1M token:** sai, giới hạn số trang và kích thước request có thể chạm trước giới hạn token.
- **Tăng max_tokens:** max_tokens là trần output, không làm request chứa được nhiều trang hơn.
- **Batch không giới hạn trang:** mỗi request trong batch vẫn là một request Messages bình thường với cùng giới hạn.`
},
{
  id: 'qz-claude-080',
  topic: 'claude',
  q: '[Applications] Gửi tới Claude Opus 5.5 (context 1M token) một request có input khoảng 950K token và max_tokens 100K. Điều gì xảy ra?',
  options: [
    'API chấp nhận vì input vẫn vừa context; nếu quá trình sinh chạm giới hạn context, model dừng với stop_reason model_context_window_exceeded',
    'API trả 400 ngay vì input cộng max_tokens vượt 1M',
    'API tự cắt các message cũ nhất cho vừa rồi trả end_turn',
    'API tự giảm max_tokens xuống 50K mà không báo gì'
  ],
  answer: 0,
  explain: `**Đúng: chấp nhận, có thể dừng với model_context_window_exceeded.** Từ các model Claude 4.5 trở đi, nếu input + max_tokens vượt context window nhưng **input vẫn vừa**, API chấp nhận request. Khi sinh tới giới hạn context, response dừng với {{stop_reason}} là {{model_context_window_exceeded}}. Code cần xử lý giá trị này như một dạng output chưa hoàn chỉnh.

### Vì sao các phương án khác sai
- **400 ngay:** chỉ xảy ra khi **riêng input** đã vượt context window (lỗi "prompt is too long"); hoặc trên model đời cũ.
- **Tự cắt message cũ:** API không tự cắt lịch sử; muốn vậy phải tự tóm tắt hoặc dùng compaction (beta).
- **Tự giảm max_tokens:** không có hành vi ngầm như vậy.

> Dùng token counting API để ước lượng trước, và theo dõi tỉ lệ stop_reason bất thường theo route.`
},
{
  id: 'qz-claude-081',
  topic: 'claude',
  q: '[Applications] Ứng dụng stream câu trả lời của Opus 5.5 ở effort high. Người dùng phàn nàn màn hình "đứng im" 10–20 giây trước khi có chữ; log cho thấy block thinking có nội dung trống. Cách cải thiện trải nghiệm đúng?',
  options: [
    'Bật thinking type enabled kèm budget_tokens để nhận nội dung suy nghĩ thô',
    'Đặt thinking display là summarized để stream bản tóm tắt suy nghĩ và hiển thị "đang suy nghĩ"',
    'Tắt streaming để người dùng nhận câu trả lời một lần',
    'Thêm beta header để API trả về suy nghĩ thô của model'
  ],
  answer: 1,
  explain: `**Đúng: display summarized.** Trên nhiều model hiện hành, thinking block mặc định có nội dung **trống** (display omitted): model vẫn suy nghĩ (và vẫn tính token output) nhưng client không thấy gì. Đặt {{thinking.display}} là {{summarized}} để nhận bản tóm tắt suy nghĩ qua stream, hiển thị cho người dùng biết model đang làm việc. Nếu muốn nhanh hơn thật sự thì cân nhắc hạ effort cho route này.

### Vì sao các phương án khác sai
- **enabled + budget_tokens:** budget_tokens bị bỏ trên các model 5.x (400); và suy nghĩ thô không bao giờ được trả về.
- **Tắt streaming:** người dùng còn chờ lâu hơn, vì phải đợi cả câu trả lời.
- **Beta header lấy suy nghĩ thô:** không tồn tại; chỉ có bản tóm tắt.`
},
{
  id: 'qz-claude-082',
  topic: 'claude',
  q: '[Applications] Route trích xuất đã dùng structured outputs (output_config.format với json_schema) nhưng khoảng 1% response vẫn không parse được. Các response lỗi đều có stop_reason là max_tokens. Cách xử lý đúng?',
  options: [
    'Structured outputs không ổn định; quay lại dặn "trả về JSON" trong prompt',
    'Đổi additionalProperties thành true để schema dễ thoả hơn',
    'Output bị cắt khi chạm max_tokens (schema không ngăn được việc này); kiểm tra stop_reason trước khi parse, tăng max_tokens hoặc giảm độ dài yêu cầu',
    'Retry y nguyên request cho tới khi parse được'
  ],
  answer: 2,
  explain: `**Đúng: đây là cắt cụt do max_tokens.** Structured outputs ràng buộc **hình dạng** của những gì model sinh ra, nhưng nếu chạm trần {{max_tokens}} thì việc sinh dừng giữa chừng và JSON thiếu ngoặc đóng. Luôn kiểm tra {{stop_reason}} trước khi parse: {{max_tokens}} thì không parse, tăng trần (stream nếu lớn), rút gọn field dài, hoặc giảm số mục cần trích mỗi request. Đừng quên thinking cũng tiêu tốn max_tokens.

### Vì sao các phương án khác sai
- **Quay lại dặn trong prompt:** còn kém tin cậy hơn và không chữa được cắt cụt.
- **additionalProperties true:** nới schema không liên quan đến việc output bị cắt.
- **Retry y nguyên:** cùng trần max_tokens thì thường bị cắt ở gần cùng chỗ; tốn tiền vô ích.`
},
{
  id: 'qz-claude-083',
  topic: 'claude',
  q: '[Applications] Dashboard chi phí tính tiền input bằng usage.input_tokens × giá input. Sau khi bật prompt caching, con số trên dashboard thấp hơn nhiều so với hoá đơn. Lỗi nằm ở đâu?',
  options: [
    'Hoá đơn sai vì input_tokens đã bao gồm token đọc từ cache',
    'Phải cộng thêm thinking tokens như một loại phí riêng ngoài output',
    'Chỉ cần tính output_tokens vì input được cache miễn phí',
    'Với caching, input_tokens chỉ là phần không cache; phải cộng cache_creation_input_tokens (giá ghi) và cache_read_input_tokens (giá đọc), cùng output_tokens'
  ],
  answer: 3,
  explain: `**Đúng: input được chia ba phần.** Khi dùng caching, usage tách input thành {{input_tokens}} (phần sau breakpoint cuối, giá thường), {{cache_creation_input_tokens}} (ghi cache, khoảng 1.25x hoặc 2x tuỳ TTL) và {{cache_read_input_tokens}} (đọc cache, khoảng 0.1x). Cả ba đều tính vào context window và đều có giá. Công thức đúng: tổng từng phần × giá tương ứng, cộng {{output_tokens}} × giá output.

### Vì sao các phương án khác sai
- **input_tokens đã gồm cache:** ngược lại, input_tokens không gồm hai phần cache.
- **Thinking là phí riêng:** thinking tokens được tính **như output tokens**, đã nằm trong output_tokens.
- **Cache miễn phí:** cache read rẻ nhưng không miễn phí, còn cache write đắt hơn input thường.`
},
{
  id: 'qz-claude-084',
  topic: 'claude',
  q: '[Model Selection] Route tóm tắt ticket đang chạy Opus 5.5 ở effort high, chất lượng tốt nhưng chi phí cao. Bạn có bộ eval 200 case. Bước tối ưu hợp lý nhất?',
  options: [
    'Chạy eval ở effort thấp hơn (medium, low) trên Opus 5.5 và so với Sonnet 5.5; chọn cấu hình rẻ nhất vẫn đạt ngưỡng chất lượng',
    'Gửi thinking type disabled để bỏ hẳn chi phí suy nghĩ',
    'Chuyển ngay sang Haiku 5.5 vì đó là model rẻ nhất',
    'Đặt budget_tokens 1024 để giới hạn token suy nghĩ'
  ],
  answer: 0,
  explain: `**Đúng: effort sweep + so model bằng eval.** {{output_config.effort}} là đòn bẩy chi phí đầu tiên trong cùng một model: effort thấp hơn thì ít token suy nghĩ hơn, nhanh và rẻ hơn. Tóm tắt thường không cần effort cao. Chạy eval ở vài mức effort và vài model, so chất lượng, độ trễ và **chi phí mỗi tác vụ hoàn thành**, rồi chọn phương án rẻ nhất đạt ngưỡng.

### Vì sao các phương án khác sai
- **thinking disabled:** Opus 5.5 không tắt được thinking; gửi disabled trả 400.
- **Chuyển ngay sang Haiku:** có thể đúng, nhưng phải chứng minh bằng eval; nhảy thẳng không đo dễ làm giảm chất lượng.
- **budget_tokens:** đã bị bỏ trên các model 5.x (400). Thay bằng effort, và dùng max_tokens làm trần cứng.`
},
{
  id: 'qz-claude-085',
  topic: 'claude',
  q: '[Model Selection] Sau khi đổi một route từ model cũ (mặc định effort high) sang Opus 5.5 mà không đặt effort, team thấy câu trả lời cho các bài phân tích khó kém sâu hơn trước. Nguyên nhân khả dĩ nhất và cách xử lý?',
  options: [
    'Opus 5.5 kém hơn model cũ; nên quay lại model cũ',
    'Opus 5.5 mặc định effort medium; đặt output_config.effort tường minh theo từng route và chạy lại effort sweep trên eval',
    'Thêm temperature 1 để model sáng tạo hơn',
    'Tăng max_tokens, vì max_tokens lớn tự động làm model suy nghĩ sâu hơn'
  ],
  answer: 1,
  explain: `**Đúng: khác biệt effort mặc định.** Opus 5.5 mặc định effort {{medium}}, trong khi nhiều model khác mặc định {{high}}. Không đặt effort tường minh thì khi đổi model, độ sâu suy nghĩ thay đổi "ngầm". Cùng tên mức effort nhưng các model được hiệu chỉnh khác nhau, nên mỗi lần đổi model cần chạy lại effort sweep và chốt effort theo route.

### Vì sao các phương án khác sai
- **Quay lại model cũ:** kết luận vội; chưa loại trừ khác biệt cấu hình.
- **temperature 1:** với API version mới, gửi temperature bị 400; temperature cũng không điều khiển độ sâu suy nghĩ.
- **Tăng max_tokens:** chỉ nâng trần output, không làm model suy nghĩ nhiều hơn; độ sâu do effort và độ khó câu hỏi quyết định.`
},
{
  id: 'qz-claude-086',
  topic: 'claude',
  q: '[Model Selection] Pipeline trích xuất dùng tool_choice {"type": "tool", "name": "record_invoice"} chạy ổn trên Haiku 5.5. Khi chuyển route này sang Sonnet 5.5 để tăng chất lượng, mọi request trả 400. Giải thích và cách sửa?',
  options: [
    'Sonnet 5.5 cần beta header riêng để dùng tool',
    'Tên tool phải đổi theo quy ước mới của Sonnet 5.5',
    'Haiku 5.5 vẫn chấp nhận forced tool use (lời gọi ép bỏ qua thinking), còn Sonnet 5.5 trả 400 với tool_choice any/tool; chuyển sang structured outputs hoặc auto + strict: true',
    'Sonnet 5.5 không hỗ trợ tool use'
  ],
  answer: 2,
  explain: `**Đúng: khác biệt hỗ trợ forced tool use giữa các model.** Theo docs, Opus 5.5, Sonnet 5.5, Fable 5.1 (và Mythos 5.1) trả **400** với {{tool_choice}} {{any}} hoặc {{tool}}. Một số model khác như Haiku 5.5 vẫn chấp nhận, nhưng lời gọi ép **bỏ qua thinking** (response bắt đầu ngay bằng tool_use). Cách sửa cho Sonnet 5.5:
- Mục đích chỉ là lấy JSON: dùng **structured outputs** ({{output_config.format}}).
- Cần model hành động qua tool: {{tool_choice}} {{auto}}, {{strict: true}} trên tool, và hướng dẫn rõ trong prompt.

### Vì sao các phương án khác sai
- **Beta header / đổi tên tool:** không liên quan; tool use là tính năng chuẩn.
- **Không hỗ trợ tool:** Sonnet 5.5 hỗ trợ tool use đầy đủ, chỉ không cho ép gọi.

> Lưu cấu hình khả năng theo từng model (capabilities) thay vì hard-code tool_choice trong thư viện dùng chung.`
},
{
  id: 'qz-claude-087',
  topic: 'claude',
  q: '[Model Selection] Code cũ gửi thinking: {type: "enabled", budget_tokens: 8000} để khống chế chi phí suy nghĩ. Trên Sonnet 5.5 request bị 400. Cách thay thế đúng mà vẫn có trần chi phí?',
  options: [
    'Giảm budget_tokens xuống 1024',
    'Chuyển budget_tokens vào trong output_config',
    'Dùng stop_sequences để cắt phần suy nghĩ',
    'Bỏ budget_tokens; dùng thinking adaptive (hoặc mặc định) kèm output_config.effort để chỉnh độ sâu, và max_tokens làm trần cứng vì thinking tính trong max_tokens'
  ],
  answer: 3,
  explain: `**Đúng: effort + max_tokens.** Từ Claude 4.7 trở đi (gồm các model 5.x), đặt {{budget_tokens}} trả lỗi 400. Thinking trên các model này là adaptive: model tự quyết suy nghĩ bao nhiêu, bạn điều chỉnh bằng {{output_config.effort}}. Để có trần cứng, dùng {{max_tokens}}: thinking tokens là một phần của max_tokens và được tính như output.

### Vì sao các phương án khác sai
- **Giảm budget_tokens:** vẫn là tham số bị từ chối, giá trị nhỏ hay lớn đều 400.
- **Đưa vào output_config:** không có field như vậy; bịa tham số chỉ dẫn tới lỗi validation.
- **stop_sequences:** áp dụng cho text sinh ra, không phải cơ chế giới hạn suy nghĩ.`
},
{
  id: 'qz-claude-088',
  topic: 'claude',
  q: '[Model Selection] Ước lượng chi phí tháng cho tính năng tóm tắt: 100.000 tài liệu/tháng, mỗi tài liệu khoảng 6.000 token input và 300 token output, chạy Sonnet 5.5 ($2/MTok input, $10/MTok output), gọi thường, không cache, không batch. Kết quả gần nhất?',
  options: [
    'Khoảng 1.500 USD',
    'Khoảng 1.200 USD',
    'Khoảng 3.000 USD',
    'Khoảng 750 USD'
  ],
  answer: 0,
  explain: `**Đúng: khoảng 1.500 USD.**
- Input: 100.000 × 6.000 = 600M token = 600 MTok × $2 = **$1.200**.
- Output: 100.000 × 300 = 30M token = 30 MTok × $10 = **$300**.
- Tổng ≈ **$1.500**/tháng.

### Vì sao các phương án khác sai
- **1.200 USD:** quên phần output (output đắt gấp 5 lần input mỗi token).
- **3.000 USD:** là con số của Opus 5.5 ($4/$20), gấp đôi Sonnet.
- **750 USD:** là con số nếu dùng Batch API (giảm 50%), trái với đề "gọi thường".

> Khi báo cáo, nêu kèm đòn bẩy: Batch (-50% nếu không cần ngay), caching phần prompt chung, và thử Haiku 5.5 ($0.10/$0.50) trên eval: nếu đạt ngưỡng thì khoảng 75 USD/tháng.`
},
{
  id: 'qz-claude-089',
  topic: 'claude',
  q: '[Model Selection] Một kỹ sư đề xuất "cascade": mọi request gọi Haiku 5.5 trước, nếu chất lượng kém thì gọi lại Opus 5.5. Rủi ro nào cần đưa ra trước khi chấp nhận?',
  options: [
    'Không có rủi ro vì Haiku và Opus dùng chung prompt cache',
    'Mỗi lần escalate tốn thêm một lượt gọi và tăng độ trễ; cache tách theo model nên prefix phải ghi lại ở model thứ hai; cần đo chi phí trên mỗi tác vụ hoàn thành so với một model ở effort thấp',
    'Cascade luôn rẻ hơn dùng một model, nên chỉ cần triển khai',
    'API tự động escalate sang Opus nếu bật fallbacks, không cần tự làm'
  ],
  answer: 1,
  explain: `**Đúng: cascade có chi phí ẩn.** Với request phải escalate, bạn trả tiền **hai lần** (Haiku rồi Opus), độ trễ cộng dồn, và cần một bước "đánh giá chất lượng" đáng tin (chính nó cũng tốn tiền hoặc dễ sai). Prompt cache tách riêng theo model, nên phần prefix dài phải ghi cache ở cả hai model. Nhiều khi một model ở effort thấp hơn lại rẻ và nhanh hơn cascade. Quyết định bằng số liệu: chi phí và độ trễ trên mỗi tác vụ hoàn thành.

### Vì sao các phương án khác sai
- **Dùng chung cache:** sai, mỗi model một cache.
- **Luôn rẻ hơn:** chỉ đúng khi tỉ lệ escalate thấp và bước đánh giá rẻ; phải đo.
- **fallbacks tự escalate:** fallback phía server xử lý **refusal**, không phải "chất lượng kém".`
},
{
  id: 'qz-claude-090',
  topic: 'claude',
  q: '[Model Selection] Harness agent cũ chạy trên Sonnet 4.6 dựa vào việc model "tự biết" còn bao nhiêu token context. Sau khi chuyển sang Sonnet 5.5, agent không còn tự lưu tiến độ khi gần đầy context. Giải thích nào đúng?',
  options: [
    'Phải bật beta header context-awareness trên Sonnet 5.5',
    'Tự chèn thẻ token budget giống API vào system prompt là đủ để khôi phục tính năng',
    'Sonnet 5.5 (cùng Opus 5.5, Haiku 5.5, Fable 5.1) không nhận các thẻ ngân sách token do API tự chèn; cho model ngân sách tường minh bằng task budgets (beta) và để harness tự theo dõi usage',
    'Context awareness chỉ bị tắt khi effort là low'
  ],
  answer: 2,
  explain: `**Đúng: các model mới không có context awareness tự động.** Sonnet 4.6, Sonnet 5 (và một số model khác) có **context awareness**: API tự chèn tổng ngân sách và cập nhật số token còn lại sau mỗi lần gọi tool. Opus 4.7 trở đi, Sonnet 5.5, Haiku 5.5, Fable 5.1 **không** nhận các thẻ này. Trên các model đó, dùng **task budgets** (beta) để cho model biết ngân sách, còn harness tự đếm {{usage}} và chủ động lưu trạng thái, compaction hoặc mở context mới.

### Vì sao các phương án khác sai
- **Beta header context-awareness:** không có header như vậy; tính năng phụ thuộc model.
- **Tự chèn thẻ giống API:** các thẻ đó do API chèn, docs nói bạn không tự gửi chúng; tự bắt chước không có đảm bảo gì.
- **Liên quan effort:** effort không bật/tắt context awareness.`
},
{
  id: 'qz-claude-091',
  topic: 'claude',
  q: '[Model Selection] Opus 5.5 ở effort xhigh vẫn làm sai khoảng 10% bài phân tích rất khó. Quản lý muốn chuyển toàn bộ traffic sang Fable 5.1. Nhận định nào đúng nhất về chi phí và cách làm?',
  options: [
    'Fable 5.1 cùng giá với Opus 5.5 nên chuyển hết là hợp lý',
    'Fable 5.1 rẻ hơn vì nhanh hơn',
    'Fable 5.1 chỉ có context 200K nên không thể dùng cho bài dài',
    'Fable 5.1 đắt khoảng 2,5 lần Opus 5.5 ($10/$50 so với $4/$20 mỗi MTok); chỉ route nhóm bài khó đã chứng minh có lợi bằng eval, phần còn lại giữ Opus'
  ],
  answer: 3,
  explain: `**Đúng: route có chọn lọc.** Fable 5.1 là model mạnh nhất cho suy luận rất khó và tác vụ agent dài, giá $10 input / $50 output mỗi MTok, gấp 2,5 lần Opus 5.5 ($4/$20), và thường chậm hơn. Chuyển cả traffic để sửa 10% bài khó là trả gấp 2,5 cho 90% bài vốn đã ổn. Cách đúng: xác định đặc điểm nhóm bài khó, chạy eval Fable trên nhóm đó, và chỉ route nhóm này sang Fable nếu cải thiện đo được.

### Vì sao các phương án khác sai
- **Cùng giá:** sai, Fable đắt hơn đáng kể.
- **Rẻ hơn vì nhanh:** Fable không phải model nhanh hay rẻ; giá tính theo token.
- **Context 200K:** các model hiện hành, gồm Fable 5.1, có context 1M.`
},
{
  id: 'qz-claude-092',
  topic: 'claude',
  q: '[Model Selection] Hai cấu hình cho tính năng trích xuất hoá đơn: Haiku 5.5 tốn khoảng $0.002 mỗi request nhưng 30% kết quả phải người sửa tay; Sonnet 5.5 tốn khoảng $0.03 mỗi request và 2% phải sửa. Bạn so sánh hai phương án thế nào?',
  options: [
    'So chi phí trên mỗi tác vụ hoàn thành đạt chuẩn, gồm cả gọi lại và thời gian người sửa, rồi chọn phương án tổng chi phí thấp nhất đạt ngưỡng chất lượng',
    'Chọn Haiku vì giá mỗi request rẻ hơn 15 lần',
    'Chọn Sonnet vì model lớn hơn luôn tốt hơn',
    'Chạy cả hai cho mọi request rồi lấy kết quả dài hơn'
  ],
  answer: 0,
  explain: `**Đúng: chi phí mỗi tác vụ hoàn thành.** Giá mỗi request chỉ là một phần. Nếu 30% hoá đơn cần người sửa và mỗi lần sửa tốn vài phút công, chi phí thật của Haiku có thể cao hơn Sonnet nhiều lần. Ngược lại, nếu cải thiện prompt giúp Haiku đạt tỉ lệ lỗi thấp thì Haiku thắng. Quyết định dựa trên tổng chi phí (API + retry + người) trên mỗi hoá đơn xử lý đúng, cùng ngưỡng chất lượng tối thiểu.

### Vì sao các phương án khác sai
- **Chỉ nhìn giá request:** bỏ qua chi phí sửa lỗi, thứ thường lớn nhất.
- **Model lớn luôn tốt hơn:** không phải lúc nào cũng đáng tiền; phải đo.
- **Chạy cả hai lấy kết quả dài hơn:** gấp đôi chi phí, và "dài hơn" không có nghĩa là đúng hơn.`
},
{
  id: 'qz-claude-093',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Route RAG gửi prefix 200K token được cache, đọc lại hàng nghìn lần mỗi giờ. Bạn so sánh chi phí phần cache giữa Opus 5.5 và Sonnet 5.5. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Opus 5.5 đọc cache với giá $0.20/MTok, khoảng 0.05x giá input của nó ($4/MTok)',
    'Sonnet 5.5 đọc cache với giá $0.20/MTok, khoảng 0.1x giá input của nó ($2/MTok)',
    'Cache read có giá bằng cache write',
    'Ghi cache với TTL 5 phút rẻ hơn input thường',
    'Fable 5.1 không hỗ trợ prompt caching'
  ],
  answer: [0, 1],
  explain: `**Đúng: hai model có cùng giá cache read $0.20/MTok.** Vì Opus 5.5 có giá input cao gấp đôi Sonnet 5.5 nhưng giá đọc cache bằng nhau, phần prefix được cache trên Opus chỉ còn khoảng 0.05x giá input. Với route mà phần lớn input là cache read, khoảng cách chi phí input giữa Opus và Sonnet thu hẹp đáng kể; chênh lệch chủ yếu còn lại ở phần không cache và output.

### Vì sao các phương án còn lại sai
- **Read bằng write:** write đắt hơn input thường (khoảng 1.25x với TTL 5 phút, khoảng 2x với 1 giờ), read rẻ hơn rất nhiều.
- **Write TTL 5 phút rẻ hơn input:** ngược lại, write đắt hơn input khoảng 25%.
- **Fable không hỗ trợ caching:** sai, Fable 5.1 có giá cache read riêng ($0.25/MTok).`
},
{
  id: 'qz-claude-094',
  topic: 'claude',
  q: '[Model Selection] Route dùng Opus 5.5 ở effort high với max_tokens 1024. Nhiều response dừng với stop_reason max_tokens dù phần text hiển thị rất ngắn. Giải thích và cách xử lý phù hợp?',
  options: [
    'Thinking không tính vào max_tokens; lỗi do prompt quá dài',
    'Thinking tokens là một phần của max_tokens (tính như output); tăng max_tokens (stream nếu lớn) hoặc hạ effort cho route này',
    'Tắt thinking bằng type disabled để dành max_tokens cho text',
    'Thêm stop_sequences để model dừng sớm hơn'
  ],
  answer: 1,
  explain: `**Đúng: thinking ăn vào max_tokens.** Theo docs, thinking tokens là tập con của {{max_tokens}} và được tính phí như output. Ở effort high, model có thể suy nghĩ vài nghìn token trước khi viết câu trả lời, nên trần 1024 bị chạm khi phần text còn rất ngắn. Hoặc nâng max_tokens (giá trị lớn thì dùng streaming), hoặc hạ effort nếu route không cần suy nghĩ sâu.

### Vì sao các phương án khác sai
- **Thinking không tính:** sai theo docs.
- **thinking disabled:** Opus 5.5 không cho tắt thinking (400).
- **stop_sequences:** làm model dừng sớm hơn, càng dễ thiếu nội dung; không giải quyết vấn đề.`
},
{
  id: 'qz-claude-095',
  topic: 'claude',
  q: '[Model Selection] Kỹ sư muốn gửi prompt 500K token tới Sonnet 5.5. Anh ấy định thêm beta header "long context" và dự toán giá gấp đôi cho phần trên 200K. Nhận định nào đúng?',
  options: [
    'Đúng, cần beta header và giá gấp đôi trên 200K',
    'Sonnet 5.5 chỉ có context 200K nên không gửi được',
    'Context 1M là mặc định trên Sonnet 5.5, không cần beta header, và tính giá chuẩn cho prompt dài; chỉ Haiku 5.5 tính giá cao hơn khi prompt trên 100K token',
    'Phải dùng Batch API cho mọi prompt trên 200K'
  ],
  answer: 2,
  explain: `**Đúng: 1M là mặc định, giá chuẩn.** Theo docs Context windows, với mọi model có context 1M token (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1…), 1M là mặc định: không cần beta header, prompt dài tính giá chuẩn, **ngoại trừ Haiku 5.5** (prompt trên 100.000 token có giá cao hơn).

### Vì sao các phương án khác sai
- **Beta header và giá gấp đôi:** không áp dụng cho Sonnet 5.5; docs ghi rõ không cần beta header và tính giá chuẩn.
- **Chỉ 200K:** 200K là context của các model cũ như Sonnet 4.5.
- **Bắt buộc Batch:** Batch là lựa chọn về chi phí/độ trễ, không phải điều kiện cho prompt dài.

> Context dài không có nghĩa là nên nhồi: độ chính xác giảm khi context tăng (context rot). Cân nhắc retrieval để chỉ đưa phần liên quan.`
},
{
  id: 'qz-claude-096',
  topic: 'claude',
  q: `[Agents] Request có cả web_search (server tool) và get_order (client tool). Claude trả về:
~~~json
{ "stop_reason": "tool_use",
  "content": [
    { "type": "server_tool_use", "id": "srvtoolu_01", "name": "web_search",
      "input": { "query": "phí giao hàng nhanh nội thành 2026" } },
    { "type": "tool_use", "id": "toolu_02", "name": "get_order",
      "input": { "order_id": "ORD-100200" } } ] }
~~~
Code gửi tiếp message user dưới đây và nhận lỗi 400 nhắc tới server tool chưa có kết quả:
~~~json
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "toolu_02", "content": "status=SHIPPED" },
  { "type": "text", "text": "Tiếp tục nhé" } ] }
~~~
Cách sửa đúng?`,
  options: [
    'Tự chạy tìm kiếm rồi gửi thêm tool_result cho srvtoolu_01',
    'Đặt text "Tiếp tục nhé" lên trước tool_result',
    'Xoá block server_tool_use khỏi message assistant trước khi gửi lại',
    'Message user chỉ chứa tool_result của client tool (bỏ block text), giữ nguyên mảng tools; API sẽ chạy web_search ở chính request đó'
  ],
  answer: 3,
  explain: `**Đúng: chỉ gửi tool_result, không kèm text.** Khi Claude gọi server tool và client tool trong cùng một nhóm lời gọi song song, server-side loop trả quyền lại cho bạn **trước** khi chạy server tool: response có {{stop_reason}} là {{tool_use}} và một {{server_tool_use}} chưa có block kết quả. Bạn trả tool_result cho client tool, **chỉ** tool_result, và giữ nguyên {{tools}}. API chạy web_search ở request đó và response tiếp theo bắt đầu bằng kết quả của nó. Text đặt sau tool_result sẽ kết thúc lượt sớm, nên với server tool chưa chạy, request bị 400.

### Vì sao các phương án khác sai
- **Tự gửi tool_result cho server tool:** server tool do Anthropic chạy; bạn không bao giờ dựng tool_result cho chúng.
- **Text trước tool_result:** luôn sai định dạng; tool_result phải đứng đầu content.
- **Xoá server_tool_use:** làm hỏng lịch sử hội thoại; model mất dấu lời gọi nó vừa đưa ra.`
},
{
  id: 'qz-claude-097',
  topic: 'claude',
  q: '[Agents] Để tiết kiệm token, harness agent xoá các block thinking khỏi message assistant (chỉ giữ text và tool_use) trước khi gửi tool_result ở lượt tiếp theo. Sau thay đổi này, request bắt đầu lỗi. Vì sao, và nên làm gì?',
  options: [
    'Khi gửi tool_result, phải gửi kèm nguyên vẹn thinking block (kể cả signature) của lượt assistant chứa tool_use đó; API kiểm tra chữ ký và báo lỗi nếu block bị sửa',
    'Thinking block chỉ được đặt trong message user',
    'Phải chuyển thinking sang system prompt để tiết kiệm token',
    'Lỗi do thiếu beta header interleaved thinking trên mọi model'
  ],
  answer: 0,
  explain: `**Đúng: trả lại thinking block nguyên vẹn.** Docs Context windows nêu rõ: khi gửi tool_result, bạn **phải** gửi kèm toàn bộ thinking block (không chỉnh sửa, gồm cả {{signature}}) đi cùng lời gọi tool đó. API dùng chữ ký mã hoá để xác thực thinking block; sửa block thì API trả lỗi. Muốn giảm token của thinking cũ, dùng cơ chế phía server như **context editing** (thinking block clearing), không tự cắt ở client.

### Vì sao các phương án khác sai
- **Thinking trong message user:** thinking là nội dung của assistant, không phải user.
- **Chuyển vào system prompt:** không có cơ chế như vậy, và sẽ phá vỡ prompt cache.
- **Beta header interleaved:** với các model dùng adaptive thinking, interleaved thinking tự động; header chỉ cần cho một số model Claude 4 đời đầu, và không liên quan việc xoá block.`
},
{
  id: 'qz-claude-098',
  topic: 'claude',
  multi: true,
  q: '[Agents] Trong vòng lặp agent, response có stop_reason là max_tokens và block cuối cùng là một tool_use có input bị cắt dở. Những cách xử lý nào đúng? (Chọn 2)',
  options: [
    'Không chạy tool_use bị cắt, vì input có thể thiếu hoặc sai',
    'Gọi lại với max_tokens lớn hơn (hoặc giảm effort/độ dài yêu cầu) để model sinh lại lời gọi đầy đủ',
    'Chạy tool với phần input đang có rồi gửi tool_result như bình thường',
    'Coi max_tokens như end_turn và trả phần text hiện có cho người dùng như câu trả lời cuối'
  ],
  answer: [0, 1],
  explain: `**Đúng: không chạy lời gọi cụt, và gọi lại với trần lớn hơn.** stop_reason {{max_tokens}} nghĩa là output bị cắt khi chạm trần. Nếu block cuối là tool_use thì input của nó có thể chưa đầy đủ (thiếu field, JSON dở). Chạy tool với input đó có thể gây hậu quả thật (huỷ nhầm đơn, ghi sai dữ liệu). Hãy tăng {{max_tokens}} (dùng streaming nếu lớn), hoặc giảm lượng suy nghĩ/độ dài để lời gọi vừa trần, rồi gọi lại.

### Vì sao các phương án còn lại sai
- **Chạy với input đang có:** rủi ro thực thi hành động sai; với tool có side effect thì cực kỳ nguy hiểm.
- **Coi như end_turn:** công việc chưa xong; người dùng nhận câu trả lời dở dang mà không biết.

> Ghi metric số lần max_tokens theo route; tăng đột biến thường do prompt hoặc dữ liệu đầu vào vừa đổi.`
},
{
  id: 'qz-claude-099',
  topic: 'claude',
  q: '[Agents] Transcript một phiên agent cho thấy: get_order với cùng order_id được gọi 3 lần liên tiếp, lần nào tool_result cũng là is_error: true với nội dung "failed", rồi agent chuyển sang gọi các tool khác lung tung. Cách sửa từ gốc phù hợp nhất?',
  options: [
    'Tăng MAX_STEPS để agent có thêm cơ hội tự sửa',
    'Viết lỗi mang tính hướng dẫn (chuyện gì xảy ra, nên làm gì tiếp), và trong code phát hiện lời gọi trùng (tool + input) để trả lỗi rõ hoặc dừng phiên',
    'Tăng effort lên max để model suy nghĩ kỹ hơn',
    'Bỏ is_error để model tưởng lời gọi thành công và đi tiếp'
  ],
  answer: 1,
  explain: `**Đúng: lỗi có hướng dẫn + phát hiện lặp trong code.** Docs khuyên viết thông điệp lỗi **instructive** thay vì "failed", ví dụ "Inventory API timeout sau 2 lần thử; dữ liệu tạm thời không có, đừng gọi lại trong lượt này, hãy báo người dùng thử lại sau". Thông điệp chung chung khiến model chỉ còn cách đoán: thử lại y hệt, rồi thử tool khác không liên quan. Thêm lớp an toàn trong code: băm {{name}} + {{input}} của các lời gọi; lần trùng thứ hai trả lỗi giải thích, lần thứ ba dừng phiên có kiểm soát.

### Vì sao các phương án khác sai
- **Tăng MAX_STEPS:** chỉ cho vòng lặp vô ích chạy lâu hơn, tốn thêm tiền.
- **Effort max:** model không thể suy luận ra điều tool không nói.
- **Bỏ is_error:** model sẽ suy luận trên dữ liệu không tồn tại và có thể bịa kết quả.`
},
{
  id: 'qz-claude-100',
  topic: 'claude',
  q: '[Agents] Orchestrator giao việc cho subagent bằng brief: "Sửa bug như đã bàn ở trên, nhớ theo cách tôi nói". Subagent làm sai hướng hoàn toàn. Nguyên nhân gốc và cách sửa?',
  options: [
    'Subagent cần model mạnh hơn orchestrator',
    'Phải bật prompt caching cho subagent',
    'Subagent chạy trong context riêng, không thấy lịch sử của orchestrator; brief phải tự đủ: mục tiêu, phạm vi, dữ liệu/đường dẫn cần thiết, định dạng kết quả và giới hạn',
    'Subagent không được dùng tool nên không sửa được bug'
  ],
  answer: 2,
  explain: `**Đúng: subagent không có ngữ cảnh của orchestrator.** Lợi ích của subagent chính là **context riêng**: nó không phải mang theo toàn bộ lịch sử dài của agent chính. Cái giá là mọi thông tin cần thiết phải nằm trong task được giao xuống, giống như brief cho một đồng nghiệp mới chưa dự cuộc họp. "Như đã bàn ở trên" là vô nghĩa với subagent.

### Vì sao các phương án khác sai
- **Model mạnh hơn:** model nào cũng không đoán được cuộc trò chuyện nó không thấy.
- **Prompt caching:** giảm chi phí prefix, không truyền ngữ cảnh.
- **Không dùng tool:** subagent có bộ tool riêng do bạn cấu hình; vấn đề ở đây là thiếu thông tin, không phải thiếu tool.`
},
{
  id: 'qz-claude-101',
  topic: 'claude',
  multi: true,
  q: '[Agents] Agent dùng model Claude mới liên tục sinh subagent để làm những việc đơn giản như grep một chuỗi hay sửa một file, làm tăng chi phí và độ trễ. Những biện pháp nào phù hợp với hướng dẫn của docs? (Chọn 2)',
  options: [
    'Đặt tool_choice none cho mọi lượt để chặn subagent',
    'Thêm hướng dẫn: dùng subagent khi việc chạy song song được, cần context riêng hoặc độc lập; việc đơn giản, tuần tự, sửa một file thì làm trực tiếp',
    'Xoá mọi tool đọc file để buộc agent phải giao việc',
    'Mô tả rõ trong định nghĩa tool giao việc (subagent) khi nào nên và không nên dùng nó',
    'Đặt temperature 0 để model bớt "hăng"'
  ],
  answer: [1, 3],
  explain: `**Đúng: hướng dẫn rõ khi nào dùng subagent, và mô tả tool giao việc rõ ràng.** Docs ghi nhận các model mới tự điều phối subagent rất chủ động, có khi cả lúc một lệnh grep là đủ. Cách khắc phục được khuyến nghị: thêm hướng dẫn tường minh (dùng subagent khi việc song song, cần context riêng hoặc độc lập; làm trực tiếp với việc đơn giản, tuần tự, sửa một file) và bảo đảm tool giao việc được mô tả rõ phạm vi sử dụng.

### Vì sao các phương án còn lại sai
- **tool_choice none:** chặn **mọi** tool, agent không làm được gì.
- **Xoá tool đọc file:** làm điều ngược lại: ép agent giao cả những việc đơn giản nhất.
- **temperature 0:** trên API version mới gửi temperature bị 400; nó cũng không điều khiển quyết định giao việc.`
},
{
  id: 'qz-claude-102',
  topic: 'claude',
  q: '[Agents] Tool refund cần người duyệt. Claude đã trả tool_use refund; harness lưu trạng thái và chờ. Người duyệt từ chối với lý do "đơn quá hạn đổi trả". Khi tiếp tục hội thoại, bạn gửi gì cho API?',
  options: [
    'Không gửi gì cho tool_use đó, chỉ gửi một tin nhắn user mới',
    'Xoá message assistant chứa tool_use refund khỏi lịch sử rồi hỏi lại',
    'Gửi tool_result thành công giả để hội thoại trôi chảy',
    'Gửi tool_result cùng tool_use_id với is_error: true và lý do từ chối, kèm hướng dẫn không thử lại mà giải thích cho khách'
  ],
  answer: 3,
  explain: `**Đúng: tool_result is_error với lý do.** Mỗi tool_use bắt buộc có tool_result tương ứng ngay sau nó. Khi người duyệt từ chối, trả {{is_error: true}} với nội dung như "Người duyệt từ chối: đơn quá hạn đổi trả. Không thử lại; hãy giải thích chính sách cho khách". Model hiểu hành động không xảy ra và chuyển sang giải thích, thay vì thử lại hay bịa kết quả.

### Vì sao các phương án khác sai
- **Không gửi tool_result:** request lỗi 400 vì tool_use không có kết quả ngay sau.
- **Xoá message assistant:** mất ngữ cảnh, model có thể đề xuất refund lần nữa; lịch sử cũng không còn phản ánh điều đã xảy ra (khó audit).
- **Thành công giả:** model sẽ báo khách "đã hoàn tiền" trong khi tiền chưa được hoàn.`
},
{
  id: 'qz-claude-103',
  topic: 'claude',
  q: '[Agents] Mỗi ngày có khoảng 30.000 email cần phân loại vào 6 phòng ban theo tiêu chí ổn định, rồi chuyển vào hàng đợi của phòng ban đó. Kiến trúc nào phù hợp nhất?',
  options: [
    'Workflow do code điều khiển (routing): một lời gọi phân loại bằng model nhỏ, kết quả ràng buộc bằng structured outputs hoặc enum, code chuyển email theo nhãn',
    'Một agent tự chủ có tool đọc hộp thư, tự quyết định quy trình cho từng email',
    'Mô hình orchestrator với 6 subagent, mỗi subagent đại diện một phòng ban tranh luận xem email thuộc về ai',
    'Một agent chạy liên tục với vòng lặp vô hạn để quét hộp thư'
  ],
  answer: 0,
  explain: `**Đúng: workflow routing.** Nguyên tắc chung: bắt đầu từ giải pháp đơn giản nhất. Bài toán có đầu vào rõ, nhãn cố định và quy trình không đổi là trường hợp điển hình của **routing**: một lời gọi phân loại (Haiku 5.5 thường đủ, kiểm chứng bằng eval), đầu ra ràng buộc trong 6 nhãn, code làm phần còn lại. Dễ kiểm soát, rẻ, dễ đo và debug. Phần khối lượng không gấp còn có thể đưa vào Batch API.

### Vì sao các phương án khác sai
- **Agent tự chủ:** linh hoạt không cần thiết, khó đoán, tốn nhiều lượt gọi hơn.
- **6 subagent tranh luận:** nhân chi phí lên nhiều lần cho một việc một lời gọi làm được.
- **Vòng lặp vô hạn:** không có điều kiện dừng là rủi ro chi phí; việc quét hộp thư là của code/scheduler.`
},
{
  id: 'qz-claude-104',
  topic: 'claude',
  q: '[Agents] Một coding agent làm một tác vụ lớn kéo dài qua nhiều context window. Mỗi lần context được làm mới, agent quên các test đã pass và làm lại từ đầu. Mẫu thiết kế nào được docs khuyến nghị?',
  options: [
    'Tăng max_tokens lên 128K để không bao giờ phải làm mới context',
    'Lưu trạng thái ra file có cấu trúc (ví dụ tests.json), ghi chú tiến độ dạng văn bản (progress.txt), dùng git làm checkpoint; khi mở context mới, yêu cầu đọc lại các file này trước khi làm tiếp',
    'Đưa toàn bộ lịch sử phiên trước vào system prompt của phiên mới',
    'Tắt compaction và để API tự cắt các lượt cũ'
  ],
  answer: 1,
  explain: `**Đúng: trạng thái nằm ngoài context.** Docs prompting cho agent dài hạn khuyên:
- Dữ liệu có cấu trúc (trạng thái test) dùng JSON, ví dụ {{tests.json}}.
- Ghi chú tiến độ tự do dùng text, ví dụ {{progress.txt}}.
- Dùng **git** để có log và checkpoint khôi phục được.
- Khi bắt đầu context mới, có thể bắt đầu lại "sạch" thay vì compaction, và chỉ dẫn cụ thể: đọc progress.txt, tests.json, git log; chạy một integration test cơ bản trước khi làm tính năng mới.

### Vì sao các phương án khác sai
- **Tăng max_tokens:** là trần output một lượt, không mở rộng context window.
- **Nhồi lịch sử cũ vào system prompt:** đưa context đầy trở lại, lại gặp đúng vấn đề cũ, và làm system prompt thay đổi liên tục (vỡ cache).
- **API tự cắt lượt cũ:** API không tự cắt; vượt context thì lỗi hoặc dừng.`
},
{
  id: 'qz-claude-105',
  topic: 'claude',
  multi: true,
  q: `[Agents] Agent đọc nhiều file lớn được cấu hình context editing như sau:
~~~json
{ "context_management": { "edits": [ {
  "type": "clear_tool_uses_20250919",
  "trigger": { "type": "input_tokens", "value": 30000 },
  "keep": { "type": "tool_uses", "value": 3 },
  "clear_at_least": { "type": "input_tokens", "value": 5000 },
  "exclude_tools": ["web_search"] } ] } }
~~~
Những phát biểu nào đúng? (Chọn 3)`,
  options: [
    'Khi input vượt 30K token, API xoá các tool result cũ nhất trước',
    'Client phải tự xoá các tool result tương ứng trong lịch sử của mình để đồng bộ với server',
    '3 lần dùng tool gần nhất luôn được giữ lại',
    'clear_at_least bảo đảm mỗi lần xoá giải phóng đủ nhiều token để đáng với việc phải ghi lại prompt cache',
    'Kết quả web_search bị xoá đầu tiên vì nằm trong exclude_tools'
  ],
  answer: [0, 2, 3],
  explain: `**Đúng: xoá cũ nhất trước khi vượt trigger, giữ 3 lần gần nhất, và clear_at_least để bù chi phí cache.**
- {{trigger}}: ngưỡng input bắt đầu dọn (30K token).
- {{keep}}: số lần dùng tool gần nhất luôn giữ nguyên (3).
- {{clear_at_least}}: mỗi lần xoá làm vỡ prompt cache của phần prefix từ chỗ bị xoá; xoá đủ nhiều mỗi lần để chi phí ghi cache lại là đáng.

### Vì sao các phát biểu còn lại sai
- **Client phải tự xoá:** việc dọn diễn ra **phía server** trước khi nội dung tới model; client vẫn giữ lịch sử đầy đủ, không cần đồng bộ.
- **web_search bị xoá đầu tiên:** ngược lại, {{exclude_tools}} liệt kê các tool **không bao giờ** bị xoá kết quả.`
},
{
  id: 'qz-claude-106',
  topic: 'claude',
  q: '[Agents] Trong một lượt, Claude gọi write_file rồi run_tests. Harness chạy tuần tự vì run_tests phụ thuộc file vừa ghi. write_file thất bại (đĩa đầy) nên harness không chạy run_tests. Bạn trả gì về cho API?',
  options: [
    'Chỉ trả tool_result cho write_file; bỏ qua run_tests vì nó không chạy',
    'Trả tool_result cho write_file, còn run_tests thì gửi ở message user riêng sau đó',
    'Trả tool_result cho cả hai trong cùng một message user: write_file có is_error mô tả lỗi; run_tests có is_error kiểu "Not executed: lệnh write_file trước đó thất bại"',
    'Trả lỗi HTTP 500 cho API để model tự hiểu'
  ],
  answer: 2,
  explain: `**Đúng: mọi tool_use đều cần tool_result, trong một message.** Khi chạy tuần tự và dừng ở lỗi đầu tiên, các lời gọi bị bỏ qua vẫn phải có tool_result với {{is_error: true}} giải thích lý do không chạy. Docs dùng đúng ví dụ "Not executed: the preceding write_file call failed." Như vậy model biết chính xác chuyện gì đã (và chưa) xảy ra để chọn bước tiếp theo.

### Vì sao các phương án khác sai
- **Bỏ qua run_tests:** thiếu tool_result cho một tool_use dẫn tới lỗi 400 ở request sau.
- **Message user riêng:** tất cả tool_result của một lượt phải nằm trong **cùng một** message user ngay sau message assistant; tách ra là sai định dạng và còn "dạy" model ngừng gọi song song.
- **HTTP 500:** bạn là client gọi API, không có khái niệm trả mã HTTP cho model; giao tiếp duy nhất là qua tool_result.`
},
{
  id: 'qz-claude-107',
  topic: 'claude',
  q: '[Prompt] Code cũ dùng prefill "Đây là bản tóm tắt:" ở lượt assistant cuối để model bỏ câu mở đầu. Trên Opus 5.5 request bị 400. Cách thay thế được docs khuyến nghị?',
  options: [
    'Chuyển prefill vào message assistant đầu tiên của hội thoại',
    'Gửi prefill dưới dạng tool_result',
    'Giữ prefill và thêm beta header để bật lại',
    'Hướng dẫn trực tiếp trong system prompt (trả lời thẳng, không mở đầu bằng "Đây là..."), hoặc yêu cầu đặt nội dung trong thẻ XML / dùng structured outputs; câu mở đầu nào còn sót thì cắt ở hậu xử lý'
  ],
  answer: 3,
  explain: `**Đúng: hướng dẫn trực tiếp, XML tag hoặc structured outputs, cộng hậu xử lý.** Từ các model Claude 4.6 trở đi, prefill ở **lượt assistant cuối** không còn được hỗ trợ (400). Docs giải thích khả năng bám hướng dẫn đã đủ tốt để phần lớn nhu cầu prefill không cần nữa. Với mục đích bỏ câu mở đầu: viết rõ trong system prompt "Respond directly without preamble", hoặc yêu cầu đặt kết quả trong một thẻ (rồi lấy nội dung thẻ), hoặc structured outputs; câu mở đầu thỉnh thoảng sót thì cắt bằng code.

### Vì sao các phương án khác sai
- **Đưa vào message assistant đầu tiên:** message assistant giữa hội thoại vẫn hợp lệ nhưng không còn tác dụng ép phần mở đầu của câu trả lời mới.
- **Gửi dưới dạng tool_result:** tool_result chỉ dùng trả kết quả tool; hướng dẫn đặt trong tool_result còn có thể bị coi như dữ liệu không tin cậy.
- **Beta header bật lại:** không có header như vậy.`
},
{
  id: 'qz-claude-108',
  topic: 'claude',
  q: '[Prompt] Câu trả lời dài bị ngắt giữa chừng (kết nối lỗi). Trước đây team prefill phần đã có vào lượt assistant cuối để model viết tiếp. Trên các model hiện hành, cách làm phù hợp là gì?',
  options: [
    'Đưa yêu cầu viết tiếp vào tin nhắn user, kèm đoạn cuối của câu trả lời bị ngắt (ví dụ: "Câu trả lời trước bị ngắt ở đoạn ...; hãy viết tiếp từ đó"); nếu không ảnh hưởng trải nghiệm thì retry cả request',
    'Gửi lại đoạn đã có dưới dạng prefill nhưng với temperature thấp',
    'Đặt stop_sequences bằng câu cuối cùng để model tự nối',
    'Tăng max_tokens; model sẽ tự nhớ chỗ bị ngắt ở lần gọi sau'
  ],
  answer: 0,
  explain: `**Đúng: chuyển phần viết tiếp sang user turn.** Docs migration khỏi prefill gợi ý: đưa yêu cầu tiếp tục vào **tin nhắn user**, kèm phần cuối của câu trả lời bị ngắt ("Your previous response was interrupted and ended with [...]. Continue from where you left off."). Nếu đây là luồng xử lý lỗi và gọi lại không ảnh hưởng trải nghiệm thì retry cả request cũng được.

### Vì sao các phương án khác sai
- **Prefill + temperature thấp:** prefill ở lượt cuối bị 400 trên model hiện hành; temperature còn bị 400 với API version mới.
- **stop_sequences:** dùng để dừng sinh, không giúp nối tiếp.
- **Tăng max_tokens để model nhớ:** API stateless; model không nhớ gì giữa các request ngoài những gì bạn gửi.`
},
{
  id: 'qz-claude-109',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Bạn đưa 3 hợp đồng (mỗi cái khoảng 30K token) và yêu cầu so sánh điều khoản phạt. Những cách cấu trúc prompt nào được docs khuyến nghị? (Chọn 2)',
  options: [
    'Đặt câu hỏi và hướng dẫn ở đầu, các hợp đồng dán phía sau',
    'Đặt các tài liệu dài ở đầu prompt, câu hỏi/hướng dẫn ở cuối',
    'Gộp ba hợp đồng thành một đoạn liền không phân tách để tiết kiệm token',
    'Đưa ba hợp đồng vào system prompt kèm thời gian hiện tại để model biết bối cảnh',
    'Bọc mỗi hợp đồng trong thẻ document (có source và document_content), và yêu cầu trích nguyên văn đoạn liên quan vào thẻ quotes trước khi phân tích'
  ],
  answer: [1, 4],
  explain: `**Đúng: tài liệu ở đầu, câu hỏi ở cuối; và cấu trúc bằng thẻ XML + trích dẫn trước.** Docs về long context:
- Đặt dữ liệu dài (20K+ token) **ở trên cùng**, trước câu hỏi và hướng dẫn; đặt câu hỏi ở cuối có thể cải thiện chất lượng đáng kể (tới khoảng 30% trong thử nghiệm), nhất là với nhiều tài liệu.
- Bọc mỗi tài liệu trong {{<document>}} với {{<source>}} và {{<document_content>}} để model phân biệt nguồn.
- Yêu cầu trích đoạn liên quan vào {{<quotes>}} trước rồi mới phân tích, giúp tập trung và dễ kiểm chứng.

### Vì sao các phương án còn lại sai
- **Câu hỏi ở đầu:** ngược khuyến nghị; model dễ "lạc" yêu cầu sau 90K token tài liệu.
- **Gộp liền không phân tách:** model khó biết điều khoản thuộc hợp đồng nào.
- **System prompt + thời gian hiện tại:** dữ liệu theo từng yêu cầu không thuộc system prompt; timestamp còn làm vỡ prompt cache.`
},
{
  id: 'qz-claude-110',
  topic: 'claude',
  q: '[Prompt] Prompt hiện ghi "KHÔNG dùng markdown trong câu trả lời" nhưng model vẫn thỉnh thoảng trả về danh sách gạch đầu dòng. Theo docs, cách điều chỉnh hiệu quả hơn là gì?',
  options: [
    'Lặp lại câu "KHÔNG dùng markdown" ba lần bằng chữ in hoa',
    'Nói điều cần làm thay vì điều cấm, ví dụ "Câu trả lời gồm các đoạn văn xuôi liền mạch", và viết chính prompt theo phong cách gần với output mong muốn (bớt markdown trong prompt)',
    'Đặt max_tokens thấp để model không đủ chỗ viết danh sách',
    'Thêm stop_sequences là ký tự "-" để chặn gạch đầu dòng'
  ],
  answer: 1,
  explain: `**Đúng: chỉ dẫn tích cực + khớp phong cách prompt.** Docs liệt kê các cách điều khiển định dạng hiệu quả:
1. Nói Claude **nên làm gì** thay vì không được làm gì ("Your response should be composed of smoothly flowing prose paragraphs").
2. Dùng thẻ XML chỉ định định dạng (ví dụ đặt phần văn xuôi trong một thẻ riêng).
3. **Khớp phong cách prompt với output mong muốn**: prompt đầy markdown thì output cũng dễ đầy markdown.
4. Hướng dẫn chi tiết khi có yêu cầu định dạng cụ thể.

### Vì sao các phương án khác sai
- **In hoa, lặp lại:** nhấn mạnh quá mức không hiệu quả bằng nói rõ hành vi mong muốn, có khi làm model cứng nhắc.
- **max_tokens thấp:** chỉ làm câu trả lời bị cắt.
- **stop_sequences "-":** model sẽ dừng ngay khi gặp dấu gạch nối bất kỳ (kể cả trong từ), làm hỏng câu trả lời.`
},
{
  id: 'qz-claude-111',
  topic: 'claude',
  q: '[Prompt] Câu trả lời của chatbot được đọc bằng text-to-speech, và engine không đọc được dấu ba chấm. Cách viết hướng dẫn nào được docs khuyến nghị?',
  options: [
    'TUYỆT ĐỐI KHÔNG BAO GIỜ dùng dấu ba chấm',
    'Không cần hướng dẫn gì; xoá dấu ba chấm ở hậu xử lý là đủ, model không cần biết lý do',
    'Giải thích lý do: "Câu trả lời sẽ được đọc bằng text-to-speech nên đừng dùng dấu ba chấm, vì engine không phát âm được"',
    'Đặt temperature 0 để model không dùng dấu câu lạ'
  ],
  answer: 2,
  explain: `**Đúng: nêu lý do của chỉ dẫn.** Docs đưa đúng ví dụ này: thay vì "NEVER use ellipses", hãy viết "Your response will be read aloud by a text-to-speech engine, so never use ellipses since the text-to-speech engine will not know how to pronounce them." Khi hiểu **vì sao**, model tổng quát hoá tốt hơn: tránh cả những thứ tương tự gây khó cho TTS (ký hiệu lạ, bảng biểu) mà bạn chưa kịp liệt kê.

### Vì sao các phương án khác sai
- **Chữ in hoa tuyệt đối:** chặn được dấu ba chấm nhưng model không hiểu bối cảnh nên không tránh được các vấn đề tương tự.
- **Chỉ hậu xử lý:** có thể dùng làm lớp phụ, nhưng không giúp model viết câu phù hợp để đọc thành tiếng.
- **temperature 0:** không liên quan, và gửi temperature bị 400 với API version mới.`
},
{
  id: 'qz-claude-112',
  topic: 'claude',
  q: '[Prompt] Prompt phân loại ticket có 4 ví dụ few-shot, cả 4 đều thuộc nhãn "billing" với priority "high". Trên production, model gán quá nhiều ticket vào billing/high. Cách sửa đúng?',
  options: [
    'Bỏ hết ví dụ vì few-shot không còn tác dụng với model mới',
    'Thêm 10 ví dụ billing/high nữa để model hiểu kỹ hơn',
    'Đặt ví dụ ở cuối prompt, sau câu hỏi thật',
    'Làm ví dụ đa dạng và sát thực tế (nhiều nhãn, nhiều mức priority, có và không có mã đơn), bọc trong thẻ examples/example để tách khỏi hướng dẫn'
  ],
  answer: 3,
  explain: `**Đúng: ví dụ đa dạng, sát thực tế, có cấu trúc.** Few-shot là một trong những cách mạnh nhất để điều khiển định dạng và cách phân loại, nhưng model học **cả những điểm chung không chủ ý** của ví dụ. Bốn ví dụ cùng một nhãn dạy model rằng "billing/high là câu trả lời thường gặp". Docs khuyên 3–5 ví dụ liên quan, **đa dạng** (bao các trường hợp biên) và bọc trong {{<example>}}/{{<examples>}}.

### Vì sao các phương án khác sai
- **Bỏ ví dụ:** few-shot vẫn rất hiệu quả với model hiện hành; vấn đề là ví dụ thiên lệch.
- **Thêm ví dụ cùng loại:** khuếch đại đúng sai lệch đang có.
- **Đặt ví dụ sau câu hỏi:** ví dụ ổn định nên đứng trước phần động (tốt cho cả chất lượng và prompt cache).`
},
{
  id: 'qz-claude-113',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Khi chuyển prompt từ model đời cũ sang model mới, agent gọi tool search_docs quá nhiều, kể cả với câu hỏi đơn giản. Prompt cũ có câu: "Nếu phân vân, LUÔN LUÔN gọi search_docs". Những điều chỉnh nào phù hợp? (Chọn 2)',
  options: [
    'Thêm nhiều chữ in hoa hơn để model hiểu đây là ngoại lệ',
    'Thay hướng dẫn chung chung bằng hướng dẫn có mục tiêu, ví dụ "gọi search_docs khi cần thông tin cụ thể không có trong cuộc hội thoại"',
    'Bỏ các câu nhấn mạnh quá mức vốn được viết để bù cho việc model cũ ít gọi tool',
    'Ép tool_choice any để kiểm soát số lần gọi',
    'Xoá description của search_docs để model ít chú ý tới nó'
  ],
  answer: [1, 2],
  explain: `**Đúng: hướng dẫn có mục tiêu, và bỏ over-prompting.** Docs ghi nhận: tool từng "ít được gọi" trên model cũ thì trên model mới thường được gọi đúng mức; các câu như "If in doubt, use [tool]" giờ gây **gọi quá nhiều**. Cách sửa: thay mặc định chung chung bằng điều kiện cụ thể, bỏ phần nhấn mạnh thừa; nếu vẫn quá hăng thì hạ effort như phương án dự phòng.

### Vì sao các phương án còn lại sai
- **Thêm chữ in hoa:** làm vấn đề tệ hơn; model mới bám hướng dẫn rất sát.
- **tool_choice any:** ép **phải** gọi tool (càng nhiều hơn), và còn trả 400 trên Opus 5.5, Sonnet 5.5, Fable 5.1.
- **Xoá description:** model mất thông tin để chọn đúng lúc dùng tool; description là yếu tố quan trọng nhất của chất lượng gọi tool.`
},
{
  id: 'qz-claude-114',
  topic: 'claude',
  q: '[Tools] Request định nghĩa tool bị 400 vì tên tool không hợp lệ. Tên nào dưới đây hợp lệ theo quy tắc đặt tên tool của Claude API?',
  options: [
    'orders_get-status',
    'orders.get_status',
    'orders get status',
    'tra_cứu_đơn_hàng'
  ],
  answer: 0,
  explain: `**Đúng: orders_get-status.** Theo docs Define tools, tên tool phải khớp regex sau:
~~~text
^[a-zA-Z0-9_-]{1,128}$
~~~
Nói dễ hiểu: chỉ gồm chữ cái Latin không dấu, chữ số, dấu gạch dưới và gạch nối, dài 1–128 ký tự.

### Vì sao các phương án khác sai
- **orders.get_status:** dấu chấm không nằm trong tập ký tự cho phép.
- **orders get status:** có khoảng trắng.
- **tra_cứu_đơn_hàng:** chữ có dấu tiếng Việt không phải ký tự Latin cơ bản.

> Docs khuyên đặt namespace theo dịch vụ ({{orders_get_status}}, {{payments_get}}) để việc chọn tool rõ ràng khi số tool tăng. Mô tả tiếng Việt đặt trong description, không đặt trong name.`
},
{
  id: 'qz-claude-115',
  topic: 'claude',
  q: '[Tools] Để Claude truyền đúng định dạng cho tool create_shipment (input lồng nhiều cấp), bạn thêm input_examples. Ngay sau đó mọi request bị 400. Một ví dụ trong mảng thiếu field bắt buộc order_id. Nhận định nào đúng?',
  options: [
    'input_examples chỉ dùng được cho server tool như web_search',
    'Mỗi ví dụ trong input_examples phải hợp lệ theo input_schema của tool; ví dụ thiếu field bắt buộc khiến request bị 400, cần sửa ví dụ cho đúng schema',
    'input_examples phải đặt trong system prompt, không đặt trong định nghĩa tool',
    'Mỗi tool chỉ được có tối đa 1 ví dụ'
  ],
  answer: 1,
  explain: `**Đúng: ví dụ phải hợp lệ theo schema.** {{input_examples}} là mảng các object input mẫu, giúp model hiểu cách dùng tool có input phức tạp, lồng nhau hoặc nhạy định dạng. API kiểm tra từng ví dụ theo {{input_schema}}: ví dụ không hợp lệ trả 400. Ví dụ cũng tốn thêm token prompt (khoảng 20–50 token cho ví dụ đơn giản, 100–200 cho object lồng sâu).

### Vì sao các phương án khác sai
- **Chỉ cho server tool:** ngược lại, input_examples **không** hỗ trợ server tool (web search, code execution); nó dành cho tool do người dùng định nghĩa và tool có schema của Anthropic (trừ toolset computer/browser).
- **Đặt trong system prompt:** input_examples là field của định nghĩa tool. Viết ví dụ trong prompt là kỹ thuật khác.
- **Tối đa 1 ví dụ:** field là một mảng; không có giới hạn 1 ví dụ như vậy.`
},
{
  id: 'qz-claude-116',
  topic: 'claude',
  q: '[Tools] Agent có 14 tool nhỏ: create_pr, review_pr, merge_pr, list_pr, send_msg, send_dm, post_channel… cho cả GitHub lẫn Slack. Model hay chọn nhầm tool. Theo docs, cách thiết kế lại nào phù hợp nhất?',
  options: [
    'Tách thêm thành nhiều tool nhỏ hơn nữa để mỗi tool chỉ làm một việc',
    'Rút ngắn description của mỗi tool để model đọc nhanh hơn',
    'Gộp các thao tác liên quan thành ít tool hơn với tham số action, và đặt namespace theo dịch vụ (ví dụ github_pr với action create/review/merge, slack_send_message)',
    'Đặt tool_choice auto với disable_parallel_tool_use để model chọn chậm hơn'
  ],
  answer: 2,
  explain: `**Đúng: gộp thao tác + namespace.** Docs khuyên: thay vì một tool cho mỗi hành động ({{create_pr}}, {{review_pr}}, {{merge_pr}}), gộp thành một tool có tham số {{action}}. Ít tool hơn nhưng mạnh hơn giúp giảm mơ hồ khi chọn. Đồng thời đặt tiền tố theo dịch vụ ({{github_list_prs}}, {{slack_send_message}}) để rõ ràng khi thư viện tool lớn dần, đặc biệt quan trọng khi dùng tool search.

### Vì sao các phương án khác sai
- **Tách nhỏ hơn nữa:** tăng số lựa chọn gần giống nhau, càng dễ nhầm.
- **Rút ngắn description:** ngược hoàn toàn; description chi tiết là yếu tố quan trọng nhất của chất lượng gọi tool (tối thiểu 3–4 câu).
- **disable_parallel_tool_use:** chỉ giới hạn số tool mỗi lượt, không giúp chọn đúng tool.`
},
{
  id: 'qz-claude-117',
  topic: 'claude',
  q: '[Tools] Tool approve_refund có tham số bắt buộc "reasoning" với mô tả "Hãy viết toàn bộ suy luận từng bước của bạn trước khi quyết định". Thỉnh thoảng request kết thúc bằng refusal. Docs khuyên sửa thế nào?',
  options: [
    'Đổi tên tham số thành "thoughts" là đủ',
    'Tăng max_tokens để chứa phần suy luận dài',
    'Bật thinking type enabled để model có chỗ suy luận riêng',
    'Đổi thành tham số xin giải thích ngắn hoặc bằng chứng hỗ trợ (ví dụ "lý do ngắn gọn, dẫn chứng từ dữ liệu đơn hàng"); yêu cầu model xuất suy nghĩ/suy luận từng bước qua tham số có thể dẫn tới refusal kiểu reasoning_extraction'
  ],
  answer: 3,
  explain: `**Đúng: xin lời giải thích, không xin suy luận.** Docs Define tools nêu: nếu tham số hỏi model **vì sao** nó gọi tool, hãy xin một lời giải thích ngắn hoặc bằng chứng hỗ trợ. Tham số đòi "thinking" hay "step-by-step reasoning" có thể dẫn tới refusal loại {{reasoning_extraction}}. Suy nghĩ của model nằm trong thinking block (adaptive), không cần trích ra qua tham số.

### Vì sao các phương án khác sai
- **Đổi tên thành thoughts:** vẫn là xin xuất suy nghĩ; vấn đề nằm ở nội dung yêu cầu.
- **Tăng max_tokens:** không liên quan tới refusal.
- **thinking enabled:** trên các model 5.x thinking là adaptive (Opus 5.5 luôn bật); kiểu enabled với budget_tokens cũ còn bị 400.`
},
{
  id: 'qz-claude-118',
  topic: 'claude',
  q: '[Tools] Một agent đổi tool_choice luân phiên giữa auto và none ở mỗi lượt (lượt none để "chỉ tổng kết"). Hoá đơn tăng, usage cho thấy phần messages bị ghi cache lại liên tục. Giải thích nào đúng?',
  options: [
    'Thay đổi tool_choice làm mất cache của các block messages (tool definitions và system vẫn được cache), nên nên giữ tool_choice ổn định hoặc hạn chế đổi',
    'tool_choice none xoá toàn bộ cache, kể cả tools và system',
    'Cache không liên quan tool_choice; nguyên nhân là TTL quá ngắn',
    'tool_choice none không tồn tại nên API tự chuyển về any và tạo cache mới'
  ],
  answer: 0,
  explain: `**Đúng: đổi tool_choice làm vỡ cache phần messages.** Docs Define tools ghi chú: khi dùng prompt caching, thay đổi {{tool_choice}} làm mất hiệu lực các block messages đã cache; tool definitions và system prompt vẫn còn trong cache nhưng nội dung messages phải xử lý lại. Với hội thoại dài, mỗi lần đổi là ghi lại cả lịch sử. Giữ tool_choice ổn định; nếu muốn lượt cuối chỉ tổng kết, có thể hướng dẫn bằng text trong tin nhắn user thay vì đổi tool_choice liên tục.

### Vì sao các phương án khác sai
- **Xoá cả tools và system:** sai, hai phần đó vẫn được cache.
- **Do TTL:** usage cho thấy ghi lại đúng lúc đổi tool_choice; TTL không phải nguyên nhân.
- **none không tồn tại:** {{none}} là giá trị hợp lệ (cấm gọi tool, mặc định khi không có tools).`
},
{
  id: 'qz-claude-119',
  topic: 'claude',
  multi: true,
  q: '[Tools] Team cân nhắc dùng các tool bash, text_editor, memory do Anthropic công bố schema thay vì tự định nghĩa tool tương đương. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Anthropic chạy lệnh bash trên hạ tầng của Anthropic, ứng dụng chỉ đọc kết quả',
    'Đây là tool có schema do Anthropic công bố, nhưng ứng dụng của bạn tự thực thi và gửi tool_result',
    'Không cần gửi tool_result vì kết quả đã nằm sẵn trong response',
    'Claude gọi chúng ổn định hơn tool tự chế tương đương vì đã được huấn luyện trên chính các schema này',
    'Chỉ dùng được qua MCP connector'
  ],
  answer: [1, 3],
  explain: `**Đúng: client-executed với schema có sẵn, và đã được huấn luyện sẵn.** Docs "How tool use works" chia tool thành ba nhóm theo nơi chạy code: user-defined (client), **Anthropic-schema** (client), và server-executed. {{memory}}, {{bash}}, {{text_editor}}, {{computer}}, {{browser}} thuộc nhóm Anthropic-schema: Anthropic công bố schema, **ứng dụng của bạn** thực thi và trả {{tool_result}} như tool thường. Lợi ích: schema đã được "train-in", Claude được tối ưu trên hàng nghìn quỹ đạo dùng đúng các chữ ký này nên gọi ổn định và phục hồi lỗi tốt hơn tool tự chế.

### Vì sao các phát biểu còn lại sai
- **Anthropic chạy bash:** đó là đặc điểm của server tool (web_search, web_fetch, code_execution, tool_search), không phải bash.
- **Không cần tool_result:** cũng là đặc điểm của server tool.
- **Chỉ qua MCP connector:** các tool này khai báo trực tiếp trong mảng tools của request.`
},
{
  id: 'qz-claude-120',
  topic: 'claude',
  q: `[Tools] Request dùng MCP connector (đã có beta header) bị lỗi validation:
~~~json
{
  "mcp_servers": [
    { "type": "url", "url": "https://mcp.jira.example.com/mcp", "name": "jira" },
    { "type": "url", "url": "https://mcp.wiki.example.com/mcp", "name": "wiki" }
  ],
  "tools": [ { "type": "mcp_toolset", "mcp_server_name": "jira" } ]
}
~~~
Cách sửa đúng?`,
  options: [
    'Gộp hai server vào một mcp_toolset bằng cách liệt kê cả hai tên trong mcp_server_name',
    'Mỗi server khai báo trong mcp_servers phải được tham chiếu bởi đúng một mcp_toolset; thêm toolset cho wiki (có thể tắt bớt tool) hoặc bỏ server wiki khỏi request',
    'MCP connector chỉ cho kết nối một server mỗi request',
    'Thêm authorization_token là đủ để hết lỗi'
  ],
  answer: 1,
  explain: `**Đúng: mỗi server cần đúng một toolset.** Quy tắc validation của MCP connector:
- {{mcp_server_name}} của toolset phải trùng một server trong {{mcp_servers}}.
- **Mọi** server trong {{mcp_servers}} phải được tham chiếu bởi **đúng một** mcp_toolset.
- Mỗi server chỉ có một toolset.
Ở đây server {{wiki}} được khai báo nhưng không có toolset nào dùng, nên request bị từ chối.

### Vì sao các phương án khác sai
- **Liệt kê hai tên trong một toolset:** mcp_server_name trỏ tới **một** server; mỗi server một toolset riêng.
- **Chỉ một server mỗi request:** sai, connector hỗ trợ nhiều server trong một request.
- **authorization_token:** dùng cho xác thực OAuth với server cần đăng nhập; không liên quan lỗi cấu trúc này.`
},
{
  id: 'qz-claude-121',
  topic: 'claude',
  multi: true,
  q: `[Tools] Server MCP "jira" có 4 tool: search_issues, get_issue, create_issue, delete_issue. Toolset được cấu hình:
~~~json
{
  "type": "mcp_toolset",
  "mcp_server_name": "jira",
  "default_config": { "enabled": false },
  "configs": {
    "search_issues": { "enabled": true },
    "get_issue": { "enabled": true },
    "delete_issue": { "defer_loading": true }
  }
}
~~~
Claude có thể dùng những tool nào? (Chọn 2)`,
  options: [
    'search_issues',
    'delete_issue (vì có mục riêng trong configs)',
    'get_issue',
    'create_issue'
  ],
  answer: [0, 2],
  explain: `**Đúng: search_issues và get_issue.** Cấu hình MCP toolset gộp theo thứ tự ưu tiên: cài đặt riêng trong {{configs}} > {{default_config}} của toolset > mặc định hệ thống. Đây là mẫu **allowlist**: {{default_config}} tắt hết ({{enabled: false}}), rồi bật từng tool cần.
- {{search_issues}}, {{get_issue}}: configs đặt enabled true, nên được bật.
- {{delete_issue}}: configs chỉ đặt {{defer_loading}}; field {{enabled}} không ghi đè nên **kế thừa false** từ default_config. Tool vẫn tắt.
- {{create_issue}}: không có mục riêng, kế thừa enabled false.

### Bẫy cần nhớ
Có mục trong configs **không** có nghĩa là được bật: chỉ những field ghi trong mục đó mới ghi đè. Với tool nguy hiểm như delete, allowlist (tắt mặc định, bật từng cái) an toàn hơn denylist.`
},
{
  id: 'qz-claude-122',
  topic: 'claude',
  q: '[Security] Agent hỗ trợ khách hàng cần đọc nội dung email gửi đến để soạn trả lời. Nên đưa phần thân email (có thể chứa câu lệnh độc hại) vào request ở đâu?',
  options: [
    'Ghép vào cuối system prompt để model coi đó là bối cảnh quan trọng',
    'Đưa vào text của tin nhắn user cùng câu "hãy trả lời email này"',
    'Trả về bên trong tool_result (ví dụ của tool read_email), kèm thông tin nguồn như người gửi chưa xác minh',
    'Đặt trong tool description để model luôn thấy'
  ],
  answer: 2,
  explain: `**Đúng: chỉ đưa nội dung không tin cậy vào tool_result.** Docs về indirect prompt injection: nội dung bên thứ ba (email, trang web, file upload, kết quả API) phải đi qua {{tool_result}}, **không bao giờ** vào system prompt hay text thường của user. Claude được huấn luyện để hoài nghi phù hợp với các câu lệnh xuất hiện trong tool result. Nói rõ nguồn gốc (email từ người gửi chưa xác minh) giúp model hiệu chỉnh mức tin cậy.

### Vì sao các phương án khác sai
- **System prompt:** nâng dữ liệu không tin cậy lên mức tin cậy cao nhất; một câu "bỏ qua mọi hướng dẫn" trong email trở thành chỉ thị hệ thống. Còn làm vỡ prompt cache.
- **Text của user:** model khó phân biệt đâu là yêu cầu thật của người dùng, đâu là nội dung email.
- **Tool description:** description là định nghĩa ổn định của tool, không phải chỗ chứa dữ liệu từng yêu cầu.`
},
{
  id: 'qz-claude-123',
  topic: 'claude',
  q: '[Security] Để "nhắc" model, harness chèn câu "Hãy tóm tắt kết quả trên trong 3 câu" vào cuối nội dung của tool_result. Model thường bỏ qua câu này, có lúc còn cảnh báo về nó. Cách làm đúng?',
  options: [
    'Viết câu nhắc bằng chữ in hoa trong tool_result để model chú ý',
    'Đặt câu nhắc ở đầu tool_result thay vì cuối',
    'Lặp lại câu nhắc trong mọi tool_result',
    'Đặt hướng dẫn của bạn trong tin nhắn user (text đứng sau các block tool_result) chứ không trong nội dung tool_result'
  ],
  answer: 3,
  explain: `**Đúng: hướng dẫn đi trong user turn, sau tool_result.** Vì Claude coi nội dung tool_result là **dữ liệu không tin cậy**, chỉ thị bạn nhét vào đó có thể bị bỏ qua hoặc bị đánh dấu là nghi prompt injection. Docs khuyên gửi hướng dẫn trong lượt user đi sau tool_result: trong cùng message user, các block tool_result đứng đầu, text hướng dẫn đứng sau. (Trên một số model còn có thể dùng system message giữa hội thoại.)

### Vì sao các phương án khác sai
- **In hoa / đặt ở đầu / lặp lại:** vẫn nằm trong vùng dữ liệu không tin cậy; vị trí và cách viết không thay đổi bản chất. Việc model hoài nghi chỉ thị trong tool result là hành vi bảo vệ mong muốn, không nên tìm cách lách.`
},
{
  id: 'qz-claude-124',
  topic: 'claude',
  q: '[Security] Bạn sàng lọc input người dùng bằng một lời gọi Claude Haiku 5.5 với structured outputs trả về {is_harmful: true/false}. Có request sàng lọc kết thúc với stop_reason là refusal và không có JSON. Ứng dụng nên xử lý thế nào?',
  options: [
    'Coi như kết quả sàng lọc bị gắn cờ (xấu): chặn hoặc chuyển xử lý thận trọng, không cho nội dung đi thẳng vào luồng chính',
    'Coi như is_harmful false vì không có JSON nghĩa là không phát hiện gì',
    'Retry sàng lọc liên tục cho tới khi nhận được JSON',
    'Bỏ qua bước sàng lọc cho request đó và chuyển thẳng vào model chính'
  ],
  answer: 0,
  explain: `**Đúng: refusal của bước sàng lọc = tín hiệu xấu.** Docs về harmlessness screen nêu: Haiku 5.5 chạy các bộ phân loại an toàn và có thể **từ chối chính request sàng lọc**; khi đó hãy coi response có {{stop_reason}} là {{refusal}} như một kết quả bị gắn cờ. Lý do: nội dung khiến bộ lọc an toàn từ chối ngay ở bước phân loại thường chính là nội dung có vấn đề.

### Vì sao các phương án khác sai
- **Coi là an toàn:** biến lỗ hổng thành cửa sau: nội dung càng độc càng dễ lọt.
- **Retry liên tục:** cùng nội dung thường bị từ chối lại; tốn tiền và độ trễ.
- **Bỏ qua sàng lọc:** "fail open" đúng ở trường hợp nguy hiểm nhất.`
},
{
  id: 'qz-claude-125',
  topic: 'claude',
  multi: true,
  q: '[Security] Ứng dụng chatbot công khai bị một số người dùng cố tình jailbreak (direct prompt injection). Những biện pháp nào được docs khuyến nghị? (Chọn 3)',
  options: [
    'Sàng lọc input bằng một model nhẹ (như Haiku 5.5) với structured outputs trả về nhãn phân loại',
    'Tăng temperature để model khó bị thao túng',
    'System prompt nêu rõ ranh giới đạo đức/pháp lý và cách từ chối',
    'Đưa API key vào system prompt kèm lệnh "không được tiết lộ" để model tự bảo vệ',
    'Theo dõi người dùng nhiều lần cố vượt guardrail; cảnh báo, throttle hoặc khoá tài khoản',
    'Prefill "Tôi không thể giúp" ở lượt assistant cuối cho mọi câu hỏi nhạy cảm'
  ],
  answer: [0, 2, 4],
  explain: `**Đúng: harmlessness screen, system prompt có ranh giới, xử lý người vi phạm lặp lại.** Với mô hình đe doạ mà **chính người dùng** là kẻ tấn công, docs liệt kê: sàng lọc bằng model nhẹ (kết quả ràng buộc bằng structured outputs), lọc input theo mẫu jailbreak đã biết, system prompt nhấn mạnh ranh giới và cách từ chối, và phản ứng với người vi phạm lặp lại (cảnh báo, giới hạn, cấm).

### Vì sao các phương án còn lại sai
- **Tăng temperature:** không phải biện pháp an toàn; với API version mới gửi temperature còn bị 400.
- **API key trong system prompt:** đưa secret vào context là tạo rủi ro rò rỉ; model không cần secret, tool phía server mới cần.
- **Prefill từ chối:** prefill ở lượt assistant cuối bị 400 trên các model hiện hành; và từ chối máy móc làm hỏng trải nghiệm người dùng hợp lệ.`
},
{
  id: 'qz-claude-126',
  topic: 'claude',
  q: '[Security] Tool read_email hiện trả về chuỗi ghép kiểu "From: x@y.com\\nBody: <nội dung>". Kẻ tấn công viết body chứa thẻ đóng giả và câu lệnh để "thoát" ra ngoài phần dữ liệu. Biện pháp nào docs khuyến nghị cho định dạng tool result?',
  options: [
    'Bọc body trong nhiều lớp thẻ XML lồng nhau để khó đóng hơn',
    'Mã hoá nội dung không tin cậy thành JSON (ví dụ object có source, from, verified_sender, body); JSON escaping tạo ranh giới rõ ràng nên kẻ tấn công không thể đóng ngoặc hay đóng thẻ để chen chỉ thị',
    'Mã hoá body bằng base64 để model không đọc được câu lệnh',
    'Cắt mọi email dài hơn 500 ký tự'
  ],
  answer: 1,
  explain: `**Đúng: JSON-encode nội dung không tin cậy.** Docs khuyên bọc chuỗi bên thứ ba trong một object JSON thay vì ghép vào văn bản tự do. JSON escaping biến mọi dấu nháy, ngoặc trong body thành ký tự thoát, nên ranh giới giữa dữ liệu và cấu trúc là **rõ ràng tuyệt đối**: dù body trông như câu lệnh, encoding cho thấy đó là dữ liệu. Kết hợp với nêu rõ nguồn (verified_sender false) và chính sách trong system prompt.

### Vì sao các phương án khác sai
- **Nhiều lớp thẻ XML:** kẻ tấn công vẫn có thể chèn thẻ đóng giả; thêm lớp không tạo ranh giới không thể giả mạo.
- **base64:** model cần đọc nội dung email để trả lời; mã hoá làm hỏng chức năng và không phải biện pháp được khuyến nghị.
- **Cắt email dài:** câu lệnh độc hại có thể rất ngắn; còn làm mất nội dung hợp lệ.`
},
{
  id: 'qz-claude-127',
  topic: 'claude',
  q: '[Claude Code] Dự án có hai hook PreToolUse cùng khớp Bash: hook A in JSON với permissionDecision "allow" cho lệnh thuộc danh sách tin cậy; hook B kiểm tra lệnh có "rm -rf" thì ghi lý do ra stderr và exit 2. Claude chạy "rm -rf build/". Kết quả?',
  options: [
    'Lệnh chạy vì hook A trả allow',
    'Hook khai báo trước thắng, nên kết quả tuỳ thứ tự trong settings.json',
    'Lệnh bị chặn: kết quả của các hook được gộp theo quyết định chặt nhất (deny > defer > ask > allow); exit 2 của hook B là chặn, và lý do trong stderr được gửi cho Claude',
    'Claude Code hiện hộp thoại hỏi người dùng chọn giữa hai hook'
  ],
  answer: 2,
  explain: `**Đúng: quyết định chặt nhất thắng.** Khi nhiều hook khớp cùng một sự kiện, các hook đều chạy (song song) rồi Claude Code gộp kết quả. Với quyết định quyền của PreToolUse, thứ tự ưu tiên là {{deny}}, {{defer}}, {{ask}}, {{allow}}. Exit code 2 nghĩa là chặn hành động; nội dung stderr được đưa cho Claude để nó đổi cách làm.

### Vì sao các phương án khác sai
- **Chạy vì allow:** allow là quyết định "lỏng" nhất, bị deny ghi đè. Ngoài ra allow của hook vẫn không vượt qua deny rule trong settings.
- **Hook khai báo trước thắng:** không phụ thuộc thứ tự; gộp theo mức độ chặt.
- **Hỏi người dùng:** chỉ xảy ra khi quyết định gộp là ask.

> Nhớ thêm: exit 0 của PreToolUse **không** phải "cho phép", chỉ là "không phản đối"; tool vẫn đi qua luồng xin quyền bình thường.`
},
{
  id: 'qz-claude-128',
  topic: 'claude',
  multi: true,
  q: '[Claude Code] Bạn chạy claude -p trong CI để review PR (kể cả PR từ người ngoài) và chỉ cho phép xem diff. Những cấu hình nào đúng? (Chọn 2)',
  options: [
    'Dùng --dangerously-skip-permissions trên runner dùng chung để job không bị kẹt chờ duyệt',
    'Thêm --bare để không tự nạp hooks, MCP server, CLAUDE.md… từ thư mục repo khi chạy -p',
    'Viết Bash(git diff*) (không có dấu cách) để cho phép mọi lệnh git diff',
    'Dùng --allowedTools "Bash(git diff *)", có dấu cách trước dấu sao, để chỉ cho phép lệnh bắt đầu bằng git diff',
    'Không cần giới hạn gì vì chế độ -p luôn tự từ chối mọi lệnh'
  ],
  answer: [1, 3],
  explain: `**Đúng: --bare và allow rule chính xác.**
- **--bare:** không có nó, một phiên {{-p}} vẫn chạy hooks trong {{.claude/settings.json}} và kết nối server trong {{.mcp.json}} của repo, kể cả thư mục chưa từng tin cậy, và không có hộp thoại tin cậy. Với PR từ người ngoài, đó là đường để họ chạy lệnh trên runner. Docs khuyên dùng --bare cho script/SDK.
- **Bash(git diff *):** cú pháp permission rule; " *" ở cuối là khớp tiền tố. Dấu cách quan trọng: thiếu nó thì {{Bash(git diff*)}} khớp cả {{git diff-index}}.

### Vì sao các phương án còn lại sai
- **--dangerously-skip-permissions trên runner chung:** bỏ mọi kiểm tra; chỉ dùng trong container/VM cô lập, chạy bằng user không phải root.
- **git diff* không dấu cách:** khớp rộng hơn ý định như giải thích ở trên.
- **-p luôn từ chối mọi lệnh:** -p không đặt mode thì bắt đầu ở Manual và từ chối các lời gọi **cần duyệt**, nhưng thao tác không cần duyệt (như đọc file trong thư mục làm việc) và mọi thứ khớp allow rule hay hook vẫn chạy. Không thay được việc cấu hình quyền tường minh.`
},
{
  id: 'qz-claude-129',
  topic: 'claude',
  q: '[Eval] Team có hai lựa chọn cho bộ eval phân loại ticket: (A) 30 case do chuyên gia chấm tay rất kỹ; (B) 1.500 case lấy từ ticket thật, chấm tự động bằng so khớp nhãn và LLM grader có rubric, tín hiệu từng case kém hoàn hảo hơn. Theo nguyên tắc thiết kế eval trong docs, nên ưu tiên gì?',
  options: [
    'A, vì chấm tay luôn đáng tin hơn chấm tự động',
    'A, vì eval nhỏ chạy nhanh hơn nên lặp nhanh hơn',
    'Không làm eval, theo dõi phản hồi người dùng trên production là đủ',
    'B: ưu tiên số lượng hơn chất lượng từng câu; nhiều case chấm tự động (tín hiệu hơi kém) tốt hơn ít case chấm tay chất lượng cao, miễn bộ case phản ánh phân phối thật và có edge case'
  ],
  answer: 3,
  explain: `**Đúng: ưu tiên volume.** Docs nêu ba nguyên tắc thiết kế eval: **task-specific** (phản ánh phân phối thật, có edge case như input rỗng, quá dài, mập mờ), **automate when possible** (multiple-choice, string match, code-graded, LLM-graded), và **prioritize volume over quality**: nhiều câu chấm tự động với tín hiệu hơi kém tốt hơn ít câu chấm tay chất lượng cao. 30 case quá ít để phát hiện regression trên từng nhóm.

### Vì sao các phương án khác sai
- **Chấm tay luôn tốt hơn:** người chấm linh hoạt nhất nhưng chậm, đắt; docs khuyên tránh nếu có thể, chỉ dùng để hiệu chỉnh grader và mẫu ngẫu nhiên.
- **Eval nhỏ lặp nhanh hơn:** chấm tự động 1.500 case vẫn nhanh, còn 30 case cho kết luận dao động lớn.
- **Chỉ theo dõi production:** phát hiện lỗi sau khi người dùng đã gặp; không so sánh được hai phiên bản prompt trước khi deploy.`
},
{
  id: 'qz-claude-130',
  topic: 'claude',
  multi: true,
  q: '[Eval] Bạn thiết kế LLM grader để chấm câu trả lời của chatbot chính sách đổi trả. Những thực hành nào được docs khuyến nghị? (Chọn 2)',
  options: [
    'Rubric chi tiết, rõ ràng cho từng tiêu chí (ví dụ "phải nêu thời hạn 30 ngày, nếu không thì chấm incorrect")',
    'Để grader tự do viết nhận xét dài, không cần thang điểm, để giữ sắc thái',
    'Dùng ngay grader cho toàn bộ eval mà không cần kiểm tra độ tin cậy trước',
    'Yêu cầu đầu ra cụ thể (correct/incorrect hoặc thang 1–5) và cho grader suy luận trước khi chấm (bật thinking)'
  ],
  answer: [0, 3],
  explain: `**Đúng: rubric chi tiết, và đầu ra cụ thể + suy luận trước khi chấm.** Tips cho LLM-based grading trong docs:
- **Detailed, clear rubrics:** tiêu chí rõ tới mức có thể tự động kết luận đúng/sai.
- **Empirical or specific:** chỉ cho ra correct/incorrect hoặc thang 1–5; đánh giá thuần định tính khó tổng hợp nhanh ở quy mô lớn.
- **Encourage reasoning:** dùng grader bật thinking để nó suy luận trước khi cho điểm, tăng độ chính xác với phán đoán phức tạp.

### Vì sao các phương án còn lại sai
- **Nhận xét tự do không thang điểm:** không tổng hợp được, không so sánh được giữa các phiên bản.
- **Dùng ngay không kiểm tra:** docs nói LLM grading cần "test to ensure reliability first, then scale": so với người chấm trên một mẫu trước khi tin kết quả.`
},
{
  id: 'qz-claude-131',
  topic: 'claude',
  q: '[Applications] Code xử lý response của Opus 5.5 luôn đọc response.stop_details.category để ghi log và bị NullPointerException ở phần lớn request. Giải thích và cách sửa đúng là gì?',
  options: [
    'stop_details chỉ có giá trị khi stop_reason là refusal; với end_turn, tool_use, max_tokens… nó là null, nên phải kiểm tra stop_reason trước khi đọc',
    'stop_details chỉ được trả về khi bật streaming; request đồng bộ cần thêm beta header để có trường này',
    'SDK Java đổi tên trường thành stopDetails nên đọc sai tên trường; chỉ cần đổi tên là hết lỗi',
    'stop_details chỉ có khi bật thinking display summarized; cần bật để log được category'
  ],
  answer: 0,
  explain: `**Đúng: stop_details chỉ có khi refusal.** {{stop_details}} (GA từ Opus 4.7) chỉ được điền khi {{stop_reason}} là {{refusal}}, gồm {{type}}, {{category}} (ví dụ {{cyber}}, {{bio}}, {{reasoning_extraction}}, có thể null) và {{explanation}}. Với mọi stop_reason khác ({{end_turn}}, {{tool_use}}, {{max_tokens}}, {{pause_turn}}…) trường này là null. Vì đa số request kết thúc bình thường, đọc thẳng {{category}} sẽ NPE ở phần lớn request.

~~~java
if ("refusal".equals(stopReason) && stopDetails != null) {
    log.warn("refusal category={}", stopDetails.category()); // chỉ đọc khi refusal
}
~~~

### Vì sao các phương án còn lại sai
- **Chỉ có khi streaming:** trường có trong cả response thường lẫn stream, không cần beta header.
- **Đổi tên trường:** tên trường trong SDK không phải nguyên nhân; null vẫn là null dù đọc đúng tên.
- **Phụ thuộc thinking display:** {{display}} chỉ quyết định thinking có hiện tóm tắt hay không, không liên quan tới stop_details.`
},
{
  id: 'qz-claude-132',
  topic: 'claude',
  q: '[Applications] Request gửi "fallbacks": "default" kèm header anthropic-beta: server-side-fallback-2026-06-01 và nhận 400. Nguyên nhân là gì?',
  options: [
    'fallbacks chỉ nhận mảng model; dạng "default" không tồn tại',
    'Dạng scalar "default" đi với header server-side-fallback-2026-07-01; header 2026-06-01 dành cho dạng mảng [{"model": ...}], ghép chéo header và dạng sẽ bị 400',
    'fallbacks chỉ được hỗ trợ trên Message Batches API',
    'Phải bỏ header beta vì fallbacks đã GA'
  ],
  answer: 1,
  explain: `**Đúng: header và dạng tham số phải khớp nhau.** Server-side fallback có hai dạng:
- Dạng mảng cũ: {{fallbacks}} là mảng các object {{model}} (ví dụ model {{claude-opus-4-8}}) + header {{server-side-fallback-2026-06-01}}.
- Dạng mới {{fallbacks: "default"}} (server tự định tuyến theo loại refusal, bạn không phải duy trì danh sách model) + header {{server-side-fallback-2026-07-01}}.

Docs nói rõ ghép header của dạng này với dạng kia trả 400. Sửa: đổi header sang {{2026-07-01}} hoặc dùng dạng mảng.

### Vì sao các phương án còn lại sai
- **"default" không tồn tại:** có tồn tại, là dạng được khuyến nghị cho Fable 5.1/Opus 5.5.
- **Chỉ có trên Batch:** ngược lại, tham số fallbacks **bị từ chối** trên Batches API.
- **Bỏ header vì đã GA:** tính năng vẫn là beta, thiếu header cũng lỗi.`
},
{
  id: 'qz-claude-133',
  topic: 'claude',
  q: '[Applications] Công ty chạy Claude Fable 5.1 qua Amazon Bedrock và muốn khi bị refusal thì tự chạy lại trên model khác. Cách làm phù hợp là gì?',
  options: [
    'Thêm tham số fallbacks vào request giống Claude API; Bedrock hỗ trợ đầy đủ',
    'Không làm được; refusal trên Bedrock luôn là kết quả cuối cùng',
    'Tham số fallbacks phía server không có trên Bedrock; dùng middleware phía client của SDK (BetaRefusalFallbackMiddleware) để tự gửi lại sang model fallback',
    'Đặt tool_choice none để model không bao giờ từ chối'
  ],
  answer: 2,
  explain: `**Đúng: dùng fallback phía client.** Tham số {{fallbacks}} (server-side) chỉ có trên Claude API (và Claude Platform on AWS); trên Amazon Bedrock, Vertex AI và Microsoft Foundry nó không khả dụng. Các SDK cung cấp {{BetaRefusalFallbackMiddleware}} (kèm {{BetaFallbackState}}) đăng ký trên client: khi response có {{stop_reason: "refusal"}}, middleware gửi lại request sang model fallback bạn cấu hình.

### Vì sao các phương án còn lại sai
- **Thêm fallbacks như Claude API:** Bedrock không nhận tham số này.
- **Không làm được:** làm được ở phía client như trên.
- **tool_choice none:** chỉ cấm gọi tool; refusal do safety classifier quyết định, không liên quan tới tool_choice.

> Lưu ý: middleware gửi lại **nguyên request body**; nếu body có tham số chỉ model gốc nhận (ví dụ {{between_tools}} của Sonnet 5.5) thì phải tự viết retry.`
},
{
  id: 'qz-claude-134',
  topic: 'claude',
  q: '[Applications] Dev Node.js khởi tạo client với new Anthropic({ timeout: 30 }) với ý định "30 giây". Mọi request đều thất bại vì timeout gần như ngay lập tức. Vì sao?',
  options: [
    'Timeout tối thiểu của SDK là 60 giây; giá trị nhỏ hơn bị coi là 0',
    'timeout chỉ áp dụng cho streaming; request thường dùng giá trị mặc định',
    'Phải đặt timeout trong header của request chứ không đặt trong client',
    'Trong SDK TypeScript, timeout tính bằng mili giây (Python và Ruby mới tính bằng giây); 30 nghĩa là 30 ms, cần đặt 30000'
  ],
  answer: 3,
  explain: `**Đúng: đơn vị khác nhau giữa các SDK.** Timeout mặc định là 10 phút, nhưng đơn vị cấu hình khác nhau: Python/Ruby tính **giây**, TypeScript tính **mili giây**, Go dùng {{time.Duration}}, Java dùng {{Duration}}, C# dùng {{TimeSpan}}. {{timeout: 30}} trong TS là 30 ms nên request nào cũng timeout. Sửa thành {{30_000}}.

> Thêm một bẫy: timeout cũng được retry ({{maxRetries}} mặc định 2), nên thời gian chờ thực tế có thể tới timeout × (maxRetries + 1).

### Vì sao các phương án còn lại sai
- **Tối thiểu 60 giây:** không có quy tắc này.
- **Chỉ áp dụng cho streaming:** timeout áp dụng cho mọi request.
- **Đặt trong header:** timeout là cấu hình của HTTP client (hoặc option theo từng request), không phải header gửi lên API.`
},
{
  id: 'qz-claude-135',
  topic: 'claude',
  q: '[Applications] Một request thỉnh thoảng trả 500 và bạn cần mở ticket với Anthropic support. Thông tin nào nên log cho mỗi lời gọi để support tra đúng request?',
  options: [
    'Giá trị header request-id của response (SDK Python có message._request_id), kèm thời điểm và model',
    'Toàn bộ API key để support xác định tài khoản',
    'Chỉ cần nội dung prompt; support sẽ tìm theo nội dung',
    'Số thứ tự lần retry của SDK; support tra theo số đó'
  ],
  answer: 0,
  explain: `**Đúng: log request-id.** Mỗi response có header {{request-id}} (dạng {{req_...}}). SDK Python đưa nó ra qua {{message._request_id}} (dù có gạch dưới, thuộc tính này public); các SDK khác cho đọc header qua raw response. Đây là khoá để Anthropic tra đúng request; kèm thời điểm, model và mã lỗi để điều tra nhanh.

### Vì sao các phương án còn lại sai
- **Gửi API key:** tuyệt đối không chia sẻ secret; key không giúp tìm một request cụ thể.
- **Tìm theo nội dung prompt:** không phải cách tra cứu, và log prompt có thể làm lộ dữ liệu người dùng.
- **Số lần retry:** chỉ là bộ đếm cục bộ của client, phía server không biết.`
},
{
  id: 'qz-claude-136',
  topic: 'claude',
  multi: true,
  q: '[Applications] Trợ lý giọng nói có system prompt 40K token được cache. Người dùng đầu tiên sau mỗi lần deploy luôn phải chờ lâu hơn hẳn. Những phát biểu nào đúng về cách "pre-warm" cache? (Chọn 2)',
  options: [
    'Gửi một request với max_tokens: 0 lúc khởi động: API chạy prefill, ghi cache ở breakpoint, trả content rỗng với stop_reason max_tokens và không tính token output',
    'Request pre-warm nên gửi cùng cấu hình thinking và effort như traffic thật, để entry được ghi khớp với request thật',
    'Với traffic liên tục (các request cách nhau dưới 5 phút), nên thêm job pre-warm mỗi phút để chắc chắn cache luôn ấm',
    'Pre-warm luôn có lợi, kể cả khi prefix thay đổi theo từng người dùng',
    'max_tokens: 0 bị API từ chối; phải dùng max_tokens: 1'
  ],
  answer: [0, 1],
  explain: `**Đúng: max_tokens 0, và cùng cấu hình thinking/effort với traffic thật.**
- Request {{max_tokens: 0}} chạy phần prefill, ghi cache tại {{cache_control}}, trả ngay {{content: []}}, {{stop_reason: "max_tokens"}}, usage đầy đủ; không tính token output, chỉ tính phí ghi cache.
- Thay đổi thinking hoặc effort có thể làm mất hiệu lực cache (ít nhất là phần messages, tuỳ model), nên request làm ấm phải dùng cùng cấu hình với request thật.

Pre-warm đáng làm khi độ trễ lượt đầu người dùng thấy được (chat, voice), prefix lớn và có thời điểm trước traffic (khởi động, sau deploy).

### Vì sao các phương án còn lại sai
- **Pre-warm mỗi phút khi traffic liên tục:** request thật đã giữ cache ấm (mỗi lần đọc làm mới TTL); job thêm chỉ là ghi thừa.
- **Prefix khác nhau theo người dùng:** không có gì chung để làm ấm; mỗi lần ghi là khoảng 1.25x tiền input mà không ai đọc lại.
- **max_tokens 0 bị từ chối:** docs mô tả chính xác cách này (trừ vài tổ hợp như stream, structured outputs, Batch).`
},
{
  id: 'qz-claude-137',
  topic: 'claude',
  q: '[Applications] Job phân tích gửi đồng thời 50 request cùng một prefix tài liệu 100K token (có cache_control). usage cho thấy cả 50 request đều có cache_creation_input_tokens lớn, không request nào đọc được cache. Cách sửa tốt nhất là gì?',
  options: [
    'Chuyển cache sang TTL 1 giờ',
    'Gửi 1 request trước, đợi nó bắt đầu stream token đầu tiên, rồi mới bắn 49 request còn lại',
    'Tăng số breakpoint lên 8 để mỗi request ghi một phần',
    'Đặt cache_control ở cuối câu hỏi riêng của từng request'
  ],
  answer: 1,
  explain: `**Đúng: gửi một request trước rồi mới fan-out.** Một cache entry chỉ đọc được **sau khi response đầu tiên bắt đầu stream**. 50 request song song cùng prefix đều đến trước khi có entry nào sẵn sàng, nên request nào cũng trả giá ghi (khoảng 1.25x) và không ai đọc được của ai. Cách đúng: gửi 1 request, chờ token đầu tiên (không cần chờ xong), rồi gửi 49 request còn lại để chúng đọc entry vừa ghi (khoảng 0.1x).

### Vì sao các phương án còn lại sai
- **TTL 1 giờ:** vấn đề là thời điểm (entry chưa tồn tại), không phải entry hết hạn; TTL 1h còn có giá ghi gấp đôi.
- **8 breakpoint:** tối đa 4 breakpoint mỗi request, và nhiều breakpoint không giải quyết vấn đề đồng thời.
- **Marker ở cuối câu hỏi riêng:** entry sẽ chứa phần riêng của từng request nên không ai dùng lại được; marker phải đặt ở cuối phần dùng chung.`
},
{
  id: 'qz-claude-138',
  topic: 'claude',
  q: '[Applications] Agent làm một lượt rất dài: gọi tuần tự 30 tool, mỗi lần một tool_use rồi một tool_result, xen thêm text. Request chỉ có một breakpoint ở block cuối. Request tiếp theo có cache_creation_input_tokens gần bằng toàn bộ hội thoại dù phần đầu payload giống hệt. Nguyên nhân hợp lý nhất?',
  options: [
    'Tool result quá dài nên không được cache',
    'Prompt caching chỉ hoạt động khi request không có tool',
    'Mỗi breakpoint chỉ dò ngược tối đa 20 vị trí để tìm entry cũ; lượt này thêm hơn 20 vị trí nên không tìm thấy entry trước. Cần đặt thêm breakpoint trung gian khoảng mỗi 15 vị trí',
    'Cache tự hết hạn sau 20 lần gọi tool'
  ],
  answer: 2,
  explain: `**Đúng: cửa sổ lookback 20 vị trí.** Khi đọc cache, mỗi breakpoint dò ngược **tối đa 20 vị trí** để tìm entry đã ghi ở request trước. Trên Claude API, một dãy tool_use liên tiếp (song song) tính là một vị trí, dãy tool_result liên tiếp cũng vậy; nhưng 30 lượt gọi tuần tự xen text tạo ra hàng chục vị trí. Breakpoint mới không còn "nhìn thấy" entry cũ nên ghi lại toàn bộ, dù payload byte-identical.

Sửa: đặt breakpoint trung gian khoảng mỗi 15 vị trí trong lượt dài, hoặc đặt marker trong phạm vi 20 vị trí tính từ block đã cache cuối cùng.

### Vì sao các phương án còn lại sai
- **Tool result dài không được cache:** tool_result là block cache được; độ dài không phải lý do.
- **Không cache khi có tool:** sai; tools còn là phần đầu của prefix cache.
- **Hết hạn sau 20 tool call:** TTL tính theo thời gian (5 phút/1 giờ), không theo số lần gọi tool.`
},
{
  id: 'qz-claude-139',
  topic: 'claude',
  q: '[Applications] Request đã có 4 cache_control tường minh (tools, system, tài liệu, lượt gần nhất). Dev thêm cache_control ở top-level để "bật thêm automatic caching" và nhận 400. Vì sao?',
  options: [
    'Automatic caching chỉ dùng được khi request không có tools',
    'cache_control top-level chỉ hợp lệ trong Batch API',
    'Phải bỏ cache_control trong system vì automatic caching tự xử lý system',
    'Mỗi request tối đa 4 breakpoint, và breakpoint tự động cũng chiếm một slot; khi 4 slot đã dùng hết bởi marker tường minh thì thêm top-level sẽ bị 400'
  ],
  answer: 3,
  explain: `**Đúng: giới hạn 4 breakpoint, automatic cũng tính.** Automatic caching là trường {{cache_control}} ở top-level request: hệ thống tự đặt breakpoint ở block cache được cuối cùng và dời dần khi hội thoại dài ra. Nó **chiếm một trong 4 slot** và kết hợp được với marker tường minh, trừ hai trường hợp 400 được ghi rõ: 4 slot đã bị marker tường minh chiếm hết, và marker tường minh trên block cuối có TTL khác với TTL của trường top-level.

Cách làm bền cho agent: một marker tường minh ở cuối system tĩnh + automatic caching cho phần hội thoại.

### Vì sao các phương án còn lại sai
- **Không dùng được khi có tools:** automatic caching không phụ thuộc việc có tools.
- **Chỉ trong Batch:** dùng được trên Messages API thường (tuỳ nền tảng hỗ trợ).
- **Bỏ marker system vì automatic tự xử lý system:** automatic chỉ đặt **một** breakpoint ở cuối; system tĩnh vẫn nên có marker riêng. Lỗi ở đây là vượt 4 slot.`
},
{
  id: 'qz-claude-140',
  topic: 'claude',
  q: '[Applications] Bạn muốn tài liệu sản phẩm (ít đổi) được cache 1 giờ, còn lịch sử hội thoại cache 5 phút. Cách đặt nào hợp lệ?',
  options: [
    'Marker ttl "1h" ở cuối tài liệu (đứng trước), marker 5 phút ở phần hội thoại phía sau; entry TTL dài phải đứng trước entry TTL ngắn',
    'Marker 5 phút ở tài liệu, marker 1h ở cuối hội thoại để hội thoại sống lâu hơn',
    'Chỉ cần top-level cache_control với ttl "1h" là có được hai TTL khác nhau',
    'TTL đặt trong header anthropic-cache-ttl, không đặt trên block'
  ],
  answer: 0,
  explain: `**Đúng: TTL dài trước, TTL ngắn sau.** TTL theo từng block cần marker tường minh, và quy tắc thứ tự là entry 1 giờ phải xuất hiện **trước** mọi entry 5 phút trong prompt. Tài liệu ít đổi nằm ở đầu prefix với {{"ttl": "1h"}}, hội thoại phía sau dùng TTL mặc định 5 phút: đúng cả về thứ tự lẫn ý nghĩa.

~~~json
{"type": "text", "text": "<tài liệu>", "cache_control": {"type": "ephemeral", "ttl": "1h"}}
~~~

### Vì sao các phương án còn lại sai
- **5 phút trước, 1h sau:** vi phạm quy tắc thứ tự (1h phải đứng trước 5 phút).
- **Chỉ dùng top-level:** automatic caching chỉ đặt một breakpoint, nên không thể có hai TTL khác nhau.
- **Header anthropic-cache-ttl:** không có header này; TTL đặt trong {{cache_control}}.`
},
{
  id: 'qz-claude-141',
  topic: 'claude',
  q: '[Applications] Cùng một chatbot (prompt giống hệt từng byte) chạy ở hai service, mỗi service dùng API key thuộc một workspace khác nhau. Hit rate cache thấp hơn nhiều so với khi chạy một service. Giải thích hợp lý nhất?',
  options: [
    'Cache chỉ dùng chung trong cùng một API key',
    'Trên Claude API, cache được cô lập theo workspace; traffic chia ở hai workspace sẽ ghi và đọc hai bộ entry riêng',
    'Cache được chia sẻ giữa các tổ chức nên bị tranh chấp với khách hàng khác',
    'Prompt caching chỉ hoạt động trên một kết nối HTTP keep-alive duy nhất'
  ],
  answer: 1,
  explain: `**Đúng: cache cô lập theo workspace.** Trên Claude API (cũng như Claude Platform on AWS và Microsoft Foundry) cache được cô lập theo **workspace**; trên Bedrock và Google Cloud là theo tổ chức. Cache không bao giờ dùng chung giữa các tổ chức. Chia cùng một prompt ra hai workspace thì mỗi bên phải tự ghi entry và chỉ đọc được entry của mình, nên tỉ lệ hit giảm, nhất là với traffic thưa. Docs khuyên kiểm tra điểm này trước khi đổ lỗi cho prompt.

### Vì sao các phương án còn lại sai
- **Theo API key:** đơn vị cô lập là workspace, không phải từng key; nhiều key cùng workspace vẫn dùng chung cache.
- **Chia sẻ giữa tổ chức:** ngược lại, không bao giờ chia sẻ giữa các tổ chức.
- **Keep-alive:** cache nằm ở phía server, không gắn với kết nối HTTP.`
},
{
  id: 'qz-claude-142',
  topic: 'claude',
  q: '[Applications] Agent có lượt sinh output kéo dài khoảng 4 phút, sau đó tool chạy thêm 2 phút rồi request kế tiếp mới được gửi. Cache 5 phút liên tục miss ở request kế tiếp. Giải thích?',
  options: [
    'Cache hết hạn vì output quá dài (trên 32K token)',
    'TTL 5 phút tính từ lúc response kết thúc nên lẽ ra phải hit; nguyên nhân là lỗi khác',
    'TTL tính từ lúc bắt đầu request ghi/đọc entry; 4 phút sinh output + 2 phút tool là khoảng 6 phút, vượt 5 phút. Với khoảng cách 5–60 phút nên dùng TTL 1 giờ',
    'Prompt cache không áp dụng cho agent có tool'
  ],
  answer: 2,
  explain: `**Đúng: TTL đo từ lúc request bắt đầu.** Thời gian sống của entry tính từ **lúc bắt đầu** request ghi hoặc đọc nó; thời gian sinh output cũng bị trừ vào. Lượt sinh 4 phút chỉ để lại khoảng 1 phút; thêm 2 phút chạy tool là entry đã hết hạn khi request sau bắt đầu.

Chọn TTL theo khoảng cách từ đầu request này tới đầu request sau:
| Khoảng cách | TTL |
|---|---|
| Dưới 5 phút | 5 phút (mỗi lần đọc làm mới, rẻ nhất) |
| 5–60 phút | 1 giờ (giá ghi 2x nhưng đáng) |
| Trên 1 giờ | làm ấm lại theo lịch hoặc chấp nhận miss |

### Vì sao các phương án còn lại sai
- **Output dài làm hết hạn:** độ dài không quyết định hết hạn, thời gian mới quyết định.
- **Tính từ lúc response kết thúc:** sai mốc tính; đây chính là chỗ hay bị hiểu nhầm.
- **Không áp dụng cho agent:** caching dùng tốt cho agent loop.`
},
{
  id: 'qz-claude-143',
  topic: 'claude',
  q: '[Applications] Chatbot dùng Opus 5.5, system prompt 25K token đã cache. Giữa hội thoại, khi người dùng bật "chế độ ngắn gọn", code sửa system prompt top-level thêm một câu và từ đó cache hit rơi về 0. Cách làm tốt hơn là gì?',
  options: [
    'Đặt câu hướng dẫn vào nội dung tool_result kế tiếp',
    'Tạo một hội thoại mới với system prompt mới',
    'Ghi câu hướng dẫn vào cuối tin nhắn của người dùng như thể người dùng viết',
    'Append một message {"role": "system", ...} vào messages (ngay sau một message user): giữ nguyên prefix đã cache và mang thẩm quyền operator'
  ],
  answer: 3,
  explain: `**Đúng: mid-conversation system message.** Sửa system top-level làm đổi phần đầu prefix nên mọi thứ phía sau mất cache. Trên các model hỗ trợ (Opus 5.5, Opus 5, Fable 5.1, Sonnet 5.5, Haiku 5.5…, không cần beta header), bạn append một message có {{role: "system"}} (ví dụ nội dung "Chế độ ngắn gọn: trả lời dưới 40 từ.") vào {{messages}}. Prefix đã cache giữ nguyên, và model coi đây là chỉ dẫn của operator chứ không phải lời người dùng. Quy tắc vị trí: phải đứng sau một message user (hoặc assistant kết thúc bằng server tool), là phần tử cuối hoặc theo sau là assistant, không được là {{messages[0]}}.

### Vì sao các phương án còn lại sai
- **Đặt trong tool_result:** nội dung tool_result được coi là dữ liệu không tin cậy; hướng dẫn ở đó có thể bị bỏ qua hoặc bị coi là injection.
- **Hội thoại mới:** mất lịch sử và vẫn phải ghi cache lại.
- **Giả làm lời người dùng:** sai thẩm quyền (operator khác user), và người dùng thật có thể bắt chước để vượt quyền.`
},
{
  id: 'qz-claude-144',
  topic: 'claude',
  q: '[Applications] Bật server-side compaction (beta compact-2026-01-12). Mỗi lượt code chỉ lấy chuỗi text của response để append vào lịch sử. Khi hội thoại vượt ngưỡng, context vẫn phình ra và compaction có vẻ "không có tác dụng". Lỗi ở đâu?',
  options: [
    'Phải append nguyên response.content (gồm cả block compaction) vào messages; chỉ lấy text sẽ làm mất trạng thái compaction',
    'Compaction chỉ chạy khi dùng streaming',
    'Phải tự gọi một endpoint /v1/compact sau mỗi lượt',
    'Compaction chỉ chạy trên Haiku'
  ],
  answer: 0,
  explain: `**Đúng: phải giữ nguyên block compaction.** Khi ngữ cảnh chạm ngưỡng kích hoạt, API tóm tắt phần cũ ở phía server và trả về một block {{compaction}} trong {{response.content}}. Ở request sau, API dùng block đó để **thay thế** phần lịch sử đã được tóm tắt. Nếu code chỉ lấy text rồi append, block compaction bị vứt đi, request sau lại gửi toàn bộ lịch sử cũ, như thể chưa từng compaction.

~~~python
messages.append({"role": "assistant", "content": response.content})  # đúng: giữ mọi block
~~~

### Vì sao các phương án còn lại sai
- **Chỉ khi streaming:** compaction chạy với cả request thường.
- **Endpoint /v1/compact:** không có; cấu hình qua {{context_management.edits}} với {{compact_20260112}}.
- **Chỉ trên Haiku:** compaction (beta) có trên Opus 5.5, Sonnet 5.5, Fable 5.1, Haiku 5.5 và các model 4.6 trở lên.`
},
{
  id: 'qz-claude-145',
  topic: 'claude',
  q: '[Applications] Bạn bật citations cho tài liệu PDF để hiển thị "trang X" cạnh từng câu trả lời. Trường nào trong citation cho biết vị trí cần hiển thị?',
  options: [
    'char_location với start_char_index; tự quy đổi vị trí ký tự sang số trang',
    'Citation kiểu page_location với start_page_number và end_page_number (đánh số từ 1)',
    'content_block_location với chỉ số block',
    'Citations không trả vị trí; chỉ có cited_text'
  ],
  answer: 1,
  explain: `**Đúng: page_location cho PDF.** Bật {{citations}} ({{enabled: true}}) trên từng block {{document}} (bật cho tất cả hoặc không cho cái nào). Response được chia thành nhiều block text, block có trích dẫn mang mảng {{citations}}. Mỗi citation có {{cited_text}}, {{document_index}}, {{document_title}} và vị trí theo loại tài liệu:
| Loại tài liệu | Kiểu vị trí |
|---|---|
| Văn bản thuần | {{char_location}} (start/end_char_index) |
| PDF | {{page_location}} (start/end_page_number, đánh số từ 1) |
| Nội dung tự định nghĩa | {{content_block_location}} |

### Vì sao các phương án còn lại sai
- **char_location:** dùng cho tài liệu văn bản thuần, không cho PDF.
- **content_block_location:** dùng cho tài liệu dạng custom content.
- **Không có vị trí:** sai; vị trí là phần chính của citation.

> Nhớ: citations không dùng chung được với {{output_config.format}} (400).`
},
{
  id: 'qz-claude-146',
  topic: 'claude',
  q: '[Applications] Bạn upload ảnh PNG qua Files API rồi tham chiếu bằng một block type "document" có source type "file" và file_id của ảnh, rồi nhận lỗi. Cách sửa đúng là gì?',
  options: [
    'Files API không nhận ảnh; phải gửi ảnh dạng base64',
    'Thêm beta header files-api-2025-04-14 vào request',
    'Loại content block phải khớp với MIME của file: ảnh tham chiếu bằng block "image" (source type "file"), còn PDF/text mới dùng "document"',
    'Đổi source type thành "url" rồi dán file_id vào'
  ],
  answer: 2,
  explain: `**Đúng: block type phải khớp MIME.** Files API (đã ra khỏi beta) trả về {{file_id}} sau khi upload. Khi tham chiếu, bạn dùng block {{type: "document"}} với {{source.type: "file"}} và {{file_id}} cho PDF/văn bản, còn ảnh dùng block {{type: "image"}} (cũng với {{source.type: "file"}}). Loại block phải khớp kiểu MIME của file; PNG mà khai báo là document thì bị lỗi.

### Vì sao các phương án còn lại sai
- **Files API không nhận ảnh:** có nhận; tham chiếu ảnh bằng block image.
- **Header files-api-2025-04-14:** Files API đã GA, không cần header beta; SDK mới dùng {{client.files}}.
- **source "url" với file_id:** source url dùng cho URL công khai, không phải file_id.`
},
{
  id: 'qz-claude-147',
  topic: 'claude',
  q: '[Applications] Sau mỗi lần deploy một JSON schema mới cho structured outputs, request đầu tiên chậm hơn rõ rệt, các request sau bình thường. Giải thích nào đúng?',
  options: [
    'Model phải tải lại trọng số mỗi khi đổi schema',
    'Do prompt cache bị xoá mỗi lần deploy',
    'Structured outputs chạy hai lượt sinh cho mỗi schema mới',
    'Schema mới tốn chi phí biên dịch một lần; các request sau dùng cùng schema được lấy bản đã biên dịch từ cache 24 giờ'
  ],
  answer: 3,
  explain: `**Đúng: biên dịch schema lần đầu.** Structured outputs (constrained decoding) cần biên dịch schema thành ràng buộc khi sinh. Docs ghi: schema mới tốn chi phí biên dịch **một lần** ở request đầu; các request sau với cùng schema dùng bản đã cache **24 giờ**. Vì vậy chỉ lần đầu sau deploy chậm. Nếu độ trễ lần đầu quan trọng, có thể gửi một request làm ấm sau deploy.

### Vì sao các phương án còn lại sai
- **Tải lại trọng số:** model không đổi theo schema.
- **Prompt cache bị xoá:** deploy phía bạn không xoá cache phía server; và nếu do prompt cache thì phải thấy ở {{cache_read_input_tokens}}, không đúng mô tả "chỉ lần đầu theo schema".
- **Hai lượt sinh:** không có cơ chế như vậy.`
},
{
  id: 'qz-claude-148',
  topic: 'claude',
  multi: true,
  q: '[Applications] Bạn dùng output_config.format với một JSON schema có minimum, maxLength và một cấu trúc đệ quy (cây danh mục lồng nhau). Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Schema đệ quy không được structured outputs hỗ trợ; cần làm phẳng cấu trúc hoặc giới hạn độ sâu',
    'minimum/maxLength không được API hỗ trợ; SDK Python/TypeScript tự bỏ chúng khỏi schema gửi lên và kiểm tra lại phía client',
    'API hỗ trợ đầy đủ mọi từ khoá JSON Schema',
    'Nên đặt additionalProperties: true để model linh hoạt hơn',
    'Ràng buộc số học được đảm bảo 100% nên server không cần validate'
  ],
  answer: [0, 1],
  explain: `**Đúng: không hỗ trợ đệ quy; ràng buộc số/chuỗi được SDK xử lý phía client.** Giới hạn JSON Schema của structured outputs:
- **Hỗ trợ:** object, array, string, integer, number, boolean, null; {{enum}}, {{const}}, {{anyOf}}, {{allOf}}, {{$ref}}; một số string format (date-time, email, uuid…); {{additionalProperties: false}} (bắt buộc cho mọi object).
- **Không hỗ trợ:** schema đệ quy; ràng buộc số ({{minimum}}, {{maximum}}, {{multipleOf}}); ràng buộc chuỗi ({{minLength}}, {{maxLength}}); ràng buộc mảng phức tạp; additionalProperties khác false.

SDK Python/TS tự gỡ các ràng buộc không hỗ trợ khỏi schema gửi lên rồi kiểm tra chúng ở phía client.

### Vì sao các phương án còn lại sai
- **Hỗ trợ mọi từ khoá:** sai, xem danh sách trên.
- **additionalProperties: true:** chỉ chấp nhận false.
- **Không cần validate:** ràng buộc số còn không được API áp dụng; server vẫn phải validate logic nghiệp vụ.`
},
{
  id: 'qz-claude-149',
  topic: 'claude',
  q: '[Applications] Sau khi nâng SDK lên bản gửi anthropic-version 2026-10-21, mọi request có temperature: 0.2 bị 400. Cách xử lý đúng?',
  options: [
    'Bỏ temperature/top_p/top_k khỏi request (phiên bản API này từ chối chúng trên mọi model); điều khiển hành vi bằng prompt, effort hoặc structured outputs',
    'Đổi temperature thành 0 vì chỉ giá trị khác 0 bị cấm',
    'Chuyển temperature vào output_config.temperature',
    'Thêm beta header sampling-params để mở lại tham số'
  ],
  answer: 0,
  explain: `**Đúng: bỏ tham số sampling.** Với API version {{2026-10-21}}, một request Messages gửi {{temperature}}, {{top_p}} hoặc {{top_k}} trả 400 trên **mọi model**. (Trên các model hiện hành như Opus 5.5/Fable 5.1, sampling đã bị bỏ từ trước.) Muốn ổn định đầu ra thì dùng prompt rõ ràng, few-shot, structured outputs; muốn đổi độ kỹ thì dùng {{output_config.effort}}.

### Vì sao các phương án còn lại sai
- **Đặt về 0:** gửi tham số là lỗi, bất kể giá trị.
- **output_config.temperature:** không tồn tại; output_config chứa effort, format, task_budget…
- **Header sampling-params:** không có header nào mở lại tham số này.`
},
{
  id: 'qz-claude-150',
  topic: 'claude',
  q: '[Applications] Code xử lý web_search_tool_result luôn duyệt content như một mảng kết quả. Một ngày service crash vì content là một object chứa error_code: "max_uses_exceeded". Bài học đúng là gì?',
  options: [
    'Lỗi của server tool luôn được trả bằng HTTP 4xx; đây là bug của API',
    'Lỗi của web search trả về HTTP 200 ngay trong block kết quả: thành công thì content là danh sách, lỗi thì content là một object có error_code; phải phân nhánh trước khi duyệt',
    'max_uses_exceeded nghĩa là hết hạn mức tài khoản; phải nâng tier',
    'Phải bật streaming mới nhận được lỗi của server tool'
  ],
  answer: 1,
  explain: `**Đúng: lỗi server tool không ném exception.** Web search và web fetch chạy trên hạ tầng Anthropic; khi lỗi, response vẫn là HTTP 200, và block {{web_search_tool_result}} có {{content}} là **một object lỗi** (ví dụ {{error_code: "max_uses_exceeded"}}) thay vì danh sách {{web_search_result}}. Code phải kiểm tra kiểu của content trước khi duyệt.

{{max_uses_exceeded}} nghĩa là Claude đã dùng hết số lần tìm kiếm bạn cho phép bằng {{max_uses}} trong request này.

### Vì sao các phương án còn lại sai
- **Luôn là 4xx:** sai; đây là hành vi được ghi rõ trong docs.
- **Hết hạn mức tài khoản:** hạn mức tài khoản gây 429; max_uses là giới hạn bạn tự đặt trên tool.
- **Cần streaming:** lỗi xuất hiện trong content dù stream hay không.`
},
{
  id: 'qz-claude-151',
  topic: 'claude',
  q: '[Applications] Khách hàng yêu cầu inference phải chạy tại Mỹ. Bạn dùng Claude API với Opus 5.5. Cách cấu hình và kiểm chứng đúng là gì?',
  options: [
    'Đặt header x-anthropic-region: us',
    'Đặt inference_geo trong extra_body hoặc metadata của request',
    'Truyền inference_geo: "us" như một tham số top-level của request Messages; trường usage.inference_geo trong response cho biết inference thực sự chạy ở đâu',
    'Chọn model id có hậu tố -us'
  ],
  answer: 2,
  explain: `**Đúng: inference_geo là tham số top-level.** {{inference_geo}} là tham số trực tiếp của request Messages (Python: {{inference_geo="us"}}, Java: {{.inferenceGeo("us")}}), hỗ trợ từ Opus 4.6/Sonnet 4.6 trở đi. Response có {{usage.inference_geo}} để bạn log và chứng minh nơi inference đã chạy. (Trên Managed Agents thì khác: nó nằm trong object model của agent.)

### Vì sao các phương án còn lại sai
- **Header x-anthropic-region:** không có header này.
- **extra_body/metadata:** docs nhấn mạnh không đặt vào extra_body; đây là tham số chính thức.
- **Hậu tố -us:** model id không có biến thể theo vùng; dùng đúng id trong bảng (ví dụ {{claude-opus-5-5}}).`
},
{
  id: 'qz-claude-152',
  topic: 'claude',
  q: '[Applications] Route RAG bị 429 vì vượt input tokens/phút (ITPM), trong khi 80% input là prefix tài liệu lặp lại giữa các request. Thay đổi nào vừa giảm chi phí vừa tăng throughput hiệu dụng?',
  options: [
    'Tăng max_tokens để giảm số request',
    'Chia prefix thành nhiều request nhỏ hơn',
    'Chuyển sang streaming',
    'Bật prompt caching cho prefix: trên Claude API, token đọc từ cache không tính vào ITPM với hầu hết model, nên vừa rẻ hơn vừa ít chạm hạn mức'
  ],
  answer: 3,
  explain: `**Đúng: prompt caching.** Trên Claude API, {{cache_read_input_tokens}} **không tính vào hạn mức input token/phút** với hầu hết model (docs nêu Haiku 3.5 là ngoại lệ). Với prefix lặp lại 80%, bật cache giúp: giá phần đọc chỉ khoảng 0.1x input (thấp hơn nữa trên Opus 5.5 và Fable 5.1), và phần lớn input không còn đếm vào ITPM, nên throughput hiệu dụng tăng mà không cần nâng tier.

### Vì sao các phương án còn lại sai
- **Tăng max_tokens:** đó là trần output, không giảm input; mỗi request vẫn gửi đủ prefix.
- **Chia prefix nhỏ:** tổng input không đổi, còn mất ngữ cảnh.
- **Streaming:** đổi cách nhận output, không đổi số token input bị tính.`
},
{
  id: 'qz-claude-153',
  topic: 'claude',
  multi: true,
  q: '[Applications] Những phát biểu nào đúng về những gì chiếm context window của Opus 5.5? (Chọn 2)',
  options: [
    'Định nghĩa tools và system prompt cũng tính vào context window',
    'Token đọc từ prompt cache vẫn chiếm context window; caching chỉ đổi giá, không đổi việc chúng có được tính hay không',
    'Thinking block của các lượt trước luôn bị API tự động loại khỏi context trên Opus 5.5',
    'Output của lượt hiện tại không tính vào context window, chỉ input mới tính',
    'Ảnh không tính vào context window vì được xử lý riêng'
  ],
  answer: [0, 1],
  explain: `**Đúng: tools/system có tính, và token cache vẫn chiếm chỗ.** Mọi thứ trong request đều tính vào context window: system, mọi message (kể cả tool_result, ảnh, tài liệu), **định nghĩa tools**, cộng với output của lượt hiện tại (kể cả thinking). Với caching, input chia thành {{input_tokens}}, {{cache_read_input_tokens}}, {{cache_creation_input_tokens}}, và **cả ba** đều tính vào cửa sổ. Caching đổi giá, không đổi dung lượng.

### Vì sao các phương án còn lại sai
- **Thinking cũ luôn bị loại:** trên Opus 4.5 trở về sau (gồm Opus 5.5), Sonnet 4.6+, Haiku 5.5, API **giữ** thinking block của lượt trước theo mặc định, và chúng tính như input. Chỉ model cũ hơn mới tự loại.
- **Output không tính:** context window gồm cả output đang sinh.
- **Ảnh không tính:** ảnh, PDF đều tính token (giới hạn thêm 600 ảnh/trang PDF mỗi request).`
},
{
  id: 'qz-claude-154',
  topic: 'claude',
  q: '[Model Selection] Bạn chuyển route RAG (mỗi request khoảng 150K token input) sang Haiku 5.5 vì bảng giá $0.10/$0.50 mỗi MTok. Hoá đơn thực tế cao hơn dự toán nhiều lần. Lý do là gì?',
  options: [
    'Mức $0.10/$0.50 chỉ áp dụng cho prompt đến 100K token; prompt vượt 100K token tính theo mức $0.50/$2.50 mỗi MTok',
    'Haiku 5.5 chỉ có context 200K nên request bị tách làm hai lần gọi',
    'Haiku 5.5 tính phí thinking gấp đôi output thường',
    'Mọi model đều tính giá gấp đôi khi prompt vượt 200K token'
  ],
  answer: 0,
  explain: `**Đúng: Haiku 5.5 có giá long-context riêng.** Giá $0.10 input / $0.50 output mỗi MTok của Haiku 5.5 áp dụng cho prompt **đến 100K token**; vượt mức đó giá là $0.50 / $2.50, tức gấp 5 lần. Route 150K token/request rơi hẳn vào mức cao. Đây là ngoại lệ: với các model 1M khác (Opus 5.5, Sonnet 5.5, Fable 5.1), long context tính theo giá chuẩn, không cần beta header.

Bài học: dự toán bằng phân bố kích thước prompt thật; với Haiku, giữ prompt dưới 100K (lọc retrieval, cache, tóm tắt) hoặc so với Sonnet 5.5 bằng chi phí trên mỗi tác vụ hoàn thành.

### Vì sao các phương án còn lại sai
- **Context 200K:** Haiku 5.5 có context 1M (Haiku 4.5 mới là 200K).
- **Thinking gấp đôi:** thinking tính như token output thường.
- **Mọi model gấp đôi khi vượt 200K:** không đúng với các model hiện hành; chỉ Haiku 5.5 có ngưỡng 100K.`
},
{
  id: 'qz-claude-155',
  topic: 'claude',
  q: '[Model Selection] Tính năng coding assistant tương tác trên Opus 5.5 cần tốc độ sinh output nhanh hơn, và công ty chấp nhận trả thêm tiền. Phương án đúng là gì?',
  options: [
    'Đăng ký Priority Tier cho route Opus 5.5',
    'Dùng fast mode: endpoint beta, beta fast-mode-2026-02-01 và tham số top-level speed: "fast"; tốc độ output tới khoảng 2.5x, giá $8/$40 mỗi MTok, chỉ có trên Claude API và không dùng với Batch',
    'Đặt effort max để model trả lời nhanh và dứt khoát hơn',
    'Thêm header x-priority: high vào request'
  ],
  answer: 1,
  explain: `**Đúng: fast mode.** Fast mode (research preview) chạy **cùng model** với tốc độ token output cao hơn tới khoảng 2.5x, giá cao hơn (Opus 5.5: $8/$40 mỗi MTok, gấp 2 giá chuẩn). Mỗi request cần đủ ba thứ: gọi qua {{client.beta.messages}}, beta {{fast-mode-2026-02-01}}, và {{speed: "fast"}} ở top-level. Chỉ có trên Claude API (không có trên Bedrock/Google Cloud/Foundry), không dùng với Batch; có rate limit riêng. Khi bị 429 có thể bỏ {{speed}} để quay về tốc độ chuẩn (đổi speed làm mất prompt cache).

### Vì sao các phương án còn lại sai
- **Priority Tier:** Opus 5.5 không được hỗ trợ trên Priority Tier; request sẽ lỗi validation.
- **effort max:** effort cao làm model suy nghĩ nhiều hơn, tức **chậm hơn**.
- **x-priority:** không có header này.`
},
{
  id: 'qz-claude-156',
  topic: 'claude',
  q: '[Model Selection] Route chat đơn giản trên Sonnet 5.5 muốn tắt thinking để giảm độ trễ. Code gửi thinking: {type: "disabled"} và bị 400. Cách đúng là gì?',
  options: [
    'Gửi thinking với budget_tokens: 0',
    'Không thể tắt; chỉ còn cách chuyển sang Haiku 5.5',
    'Thử hạ effort xuống low trước; nếu route bắt buộc không thinking thì gửi thinking: {type: "between_tools"} (không kèm trường nào khác, chỉ ở effort high trở xuống)',
    'Gửi thinking disabled kèm effort xhigh'
  ],
  answer: 2,
  explain: `**Đúng: hạ effort, hoặc dùng between_tools.** Trên Sonnet 5.5, thinking kiểu {{disabled}} trả 400. Docs khuyên thử {{effort: "low"}} trước (chat thường chạy tốt ở low). Nếu route thật sự phải tắt thinking, gửi thinking kiểu {{between_tools}}: chỉ được nhận ở effort {{high}} trở xuống, không được kèm {{display}}, {{budget_tokens}} hay trường nào khác, và không cho đổi effort giữa hội thoại.

### Vì sao các phương án còn lại sai
- **budget_tokens 0:** budget_tokens đã bị bỏ trên Sonnet 5.5 (400).
- **Không thể tắt:** có cách between_tools; đổi sang Haiku là quyết định chất lượng khác, không bắt buộc.
- **disabled + xhigh:** disabled đã 400; between_tools cũng 400 ở xhigh/max.`
},
{
  id: 'qz-claude-157',
  topic: 'claude',
  q: '[Model Selection] Team chuyển một route từ Sonnet 4.6 sang Fable 5.1 và dự toán chi phí bằng số token đo trên Sonnet 4.6 nhân với giá Fable. Rủi ro lớn nhất của cách dự toán này là gì?',
  options: [
    'Fable 5.1 không tính phí input token',
    'Fable 5.1 không hỗ trợ count_tokens',
    'Fable 5.1 tính phí theo số ký tự thay vì token',
    'Fable 5.1 dùng tokenizer khác (tokenizer ra mắt từ Opus 4.7), cùng văn bản có thể ra khoảng 1x–1.35x số token; cần đo lại bằng count_tokens trên model mới'
  ],
  answer: 3,
  explain: `**Đúng: tokenizer khác nên số token khác.** Fable 5.1 dùng cùng tokenizer với Opus 4.8 (tokenizer ra mắt cùng Opus 4.7). Khi chuyển từ Opus 4.6, Sonnet, Haiku hoặc cũ hơn, docs khuyên đo lại bằng {{count_tokens}} vì tokenizer mới dùng khoảng 1x–1.35x số token cho cùng văn bản. Dự toán bằng token của Sonnet 4.6 có thể thấp tới hơn 30%, cộng thêm chênh giá ($10/$50 so với $3/$15).

### Vì sao các phương án còn lại sai
- **Không tính phí input:** Fable 5.1 tính $10/MTok input.
- **Không hỗ trợ count_tokens:** count_tokens dùng được cho các model hiện hành; đó chính là công cụ nên dùng.
- **Tính theo ký tự:** mọi model Claude tính theo token.`
},
{
  id: 'qz-claude-158',
  topic: 'claude',
  q: '[Model Selection] Một ngân hàng có thoả thuận zero data retention (ZDR) với Anthropic muốn thử Fable 5.1. Mọi request trả 400 invalid_request_error. Giải thích đúng là gì?',
  options: [
    'Fable 5.1 yêu cầu lưu dữ liệu 30 ngày; tổ chức ZDR bị từ chối trừ khi được Anthropic cho phép rõ ràng, nên phải xin phép hoặc dùng model không có yêu cầu này',
    'Fable 5.1 chỉ dành cho thành viên Project Glasswing',
    'Ngân hàng phải gửi thêm header zdr: true',
    'Fable 5.1 chỉ chạy qua Batch API'
  ],
  answer: 0,
  explain: `**Đúng: Fable 5.1 cần 30 ngày lưu dữ liệu.** Docs ghi Fable 5.1 không khả dụng dưới zero data retention trừ khi Anthropic cho phép rõ ràng; request từ tổ chức có cấu hình lưu trữ không đáp ứng yêu cầu sẽ nhận {{400 invalid_request_error}}. Đây là ràng buộc cần kiểm tra **trước** khi chọn model cho khách hàng có yêu cầu tuân thủ.

### Vì sao các phương án còn lại sai
- **Project Glasswing:** đó là điều kiện của Claude Mythos 5.1, không phải Fable 5.1 (được phát hành rộng rãi).
- **Header zdr:** không có header này; cấu hình retention nằm ở cấp tổ chức.
- **Chỉ qua Batch:** Fable 5.1 dùng trên Messages API bình thường.`
},
{
  id: 'qz-claude-159',
  topic: 'claude',
  q: '[Model Selection] Doanh nghiệp đã mua Priority Tier và muốn áp dụng cho route mới chạy Opus 5.5. Request bị lỗi validation. Giải thích đúng là gì?',
  options: [
    'Priority Tier chỉ áp dụng cho các model Haiku',
    'Priority Tier không hỗ trợ Opus 5.5 (cũng như Sonnet 5.5, Fable 5.1…); route cần Priority Tier phải chạy model được hỗ trợ như Fable 5 hoặc Opus 4.8, hoặc bỏ Priority Tier',
    'Phải bật fast mode cùng lúc với Priority Tier',
    'Priority Tier yêu cầu anthropic-version cũ hơn'
  ],
  answer: 1,
  explain: `**Đúng: Opus 5.5 nằm ngoài Priority Tier.** Docs liệt kê Priority Tier hỗ trợ Fable 5, Opus 4.8 và các model hiện hành cũ hơn, nhưng **loại trừ** Opus 5.5, Opus 5, Sonnet 5, Sonnet 5.5, Fable 5.1, Mythos 5.1, Mythos 5 và Mythos Preview; request Priority Tier với các model này lỗi validation. Khi chọn model cho route cần cam kết dịch vụ, phải đối chiếu danh sách hỗ trợ chứ không mặc định "model mới nhất".

### Vì sao các phương án còn lại sai
- **Chỉ Haiku:** sai; Fable 5 và Opus 4.8 cũng được hỗ trợ.
- **Bật fast mode cùng lúc:** fast mode còn không dùng được với Priority Tier.
- **anthropic-version cũ:** không liên quan đến phiên bản API.`
},
{
  id: 'qz-claude-160',
  topic: 'claude',
  q: '[Model Selection] Agent chính chạy Opus 5.5 với prefix 80K token được cache. Để tiết kiệm, dev đổi model sang Haiku 5.5 giữa vòng lặp cho các bước "dễ" rồi đổi lại Opus. Chi phí input tăng thay vì giảm. Thiết kế tốt hơn là gì?',
  options: [
    'Giữ nguyên cache_control khi đổi model là cache vẫn được dùng chung',
    'Dùng TTL 1h để cache sống qua lần đổi model',
    'Cache gắn với từng model nên mỗi lần đổi là ghi lại từ đầu; giữ vòng lặp chính trên một model và giao việc dễ cho subagent chạy model rẻ với context riêng, nhỏ',
    'Chuyển toàn bộ agent sang Haiku 5.5'
  ],
  answer: 2,
  explain: `**Đúng: cache theo model, nên dùng subagent.** Prompt cache được tách theo model; đổi model là không có cách nào giữ cache (không có "lối thoát" như system message giữa hội thoại). Mỗi lần chuyển Opus → Haiku → Opus, cả hai phía phải ghi lại 80K token prefix (1.25x), đắt hơn khoản tiết kiệm. Mẫu khuyến nghị: vòng lặp chính ở một model, việc phụ rẻ giao cho **subagent** chạy model nhỏ với context gọn, chỉ trả kết quả về.

### Vì sao các phương án còn lại sai
- **Giữ cache_control:** marker không làm cache dùng chung giữa model.
- **TTL 1h:** TTL không giúp được vì entry của model này không dùng cho model khác.
- **Chuyển hẳn sang Haiku:** có thể làm giảm chất lượng các bước khó; cần đo bằng eval, không phải hướng sửa lỗi thiết kế này.`
},
{
  id: 'qz-claude-161',
  topic: 'claude',
  q: '[Model Selection] Service cấu hình động muốn biết context window và output tối đa của từng model thay vì hard-code. Cách đúng là gì?',
  options: [
    'Đọc trường context_window từ GET /v1/models/{id}',
    'Gửi request thử với max_tokens rất lớn rồi bắt lỗi để suy ra giới hạn',
    'Parse trang pricing của Anthropic',
    'Gọi Models API (GET /v1/models/{id}): trường max_input_tokens là context window, max_tokens là output tối đa, kèm capabilities; không có trường context_window'
  ],
  answer: 3,
  explain: `**Đúng: Models API với max_input_tokens/max_tokens.** Models API ({{client.models.list()}}, {{client.models.retrieve(id)}}, không cần beta) trả về {{id}}, {{display_name}}, {{created_at}} và (từ 3/2026) {{max_input_tokens}} (context window), {{max_tokens}} (trần output) cùng {{capabilities}}. Dùng nó để tra năng lực thực tế thay vì hard-code bảng.

### Vì sao các phương án còn lại sai
- **context_window:** docs nói rõ không có trường này; code đọc trường này nhận null.
- **Thử và bắt lỗi:** tốn tiền, chậm, và với model 4.5+ request vượt cửa sổ còn được chấp nhận rồi dừng bằng {{model_context_window_exceeded}}, nên không suy ra được.
- **Parse trang pricing:** dễ vỡ, không phải API.`
},
{
  id: 'qz-claude-162',
  topic: 'claude',
  q: '[Model Selection] Hệ thống cũ dùng Haiku 4.5 để đọc PDF 300 trang và luôn bị lỗi. Phát biểu nào giải thích đúng và gợi ý hợp lý?',
  options: [
    'Model có context 200K (như Haiku 4.5) chỉ nhận tối đa 100 trang PDF/ảnh mỗi request; Haiku 5.5 (context 1M) nhận tới 600 trang, nhưng vẫn phải nằm trong giới hạn 32 MB của request',
    'Các model Haiku không đọc được PDF',
    'Giới hạn là 50 trang PDF cho mọi model',
    'Phải chuyển PDF sang ảnh mới gửi được'
  ],
  answer: 0,
  explain: `**Đúng: giới hạn số trang phụ thuộc context window.** Một request nhận tối đa **600** ảnh hoặc trang PDF với model 1M, và **100** với model context 200K. Haiku 4.5 (context 200K, $1/$5) gặp giới hạn 100 trang. Nâng lên Haiku 5.5 (context 1M, rẻ hơn nhiều) giải quyết được, nhưng vẫn phải giữ request dưới 32 MB; PDF scan nặng có thể chạm giới hạn kích thước trước giới hạn trang.

### Vì sao các phương án còn lại sai
- **Haiku không đọc PDF:** có đọc được.
- **50 trang cho mọi model:** sai con số; là 100 hoặc 600 tuỳ model.
- **Chuyển sang ảnh:** ảnh cũng tính chung giới hạn 100/600; chuyển đổi không giải quyết, còn mất text layer.`
},
{
  id: 'qz-claude-163',
  topic: 'claude',
  q: '[Model Selection] Bạn dùng advisor tool: executor là Sonnet 5.5, và để tiết kiệm bạn cấu hình advisor là Haiku 5.5. Request bị 400. Vì sao?',
  options: [
    'Advisor tool chỉ chạy với Fable 5.1',
    'Model advisor phải ít nhất mạnh bằng model executor (ví dụ executor Sonnet 5.5 thì advisor là Opus 5.5); cặp không hợp lệ trả 400',
    'Advisor phải cùng model với executor',
    'Advisor tool cần tool_choice any mới chạy'
  ],
  answer: 1,
  explain: `**Đúng: advisor phải mạnh ít nhất bằng executor.** Ý tưởng của advisor tool là model executor (chạy chính) xin lời khuyên từ một model **mạnh hơn hoặc bằng**. Cặp như executor {{claude-sonnet-5-5}} → advisor {{claude-opus-5-5}} hợp lệ; advisor yếu hơn (Haiku) trả 400. Riêng executor Sonnet 5.5 chỉ nhận các advisor trong bảng ghép cặp của nó (không nhận Opus 4.8/4.7/4.6, Sonnet 5, Sonnet 4.6).

### Vì sao các phương án còn lại sai
- **Chỉ Fable 5.1:** advisor tool dùng với nhiều cặp model.
- **Cùng model:** không bắt buộc; mục đích là xin ý kiến model mạnh hơn.
- **tool_choice any:** forced tool_choice còn bị 400 trên Sonnet 5.5; không liên quan.`
},
{
  id: 'qz-claude-164',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Bạn chuyển các route từ Sonnet 5 sang Sonnet 5.5. Những việc nào phù hợp với hướng dẫn hiện hành? (Chọn 2)',
  options: [
    'Chạy lại effort sweep vì các mức effort đã được hiệu chỉnh lại; điểm khởi đầu gợi ý là medium cho coding agent/tool nhiều bước và low cho chat',
    'Giữ nguyên effort như Sonnet 5 vì cùng tên mức thì hành vi giống hệt',
    'Thay tool_choice {"type": "tool"} bằng auto + chỉ dẫn trong prompt, strict: true hoặc structured outputs, vì forced tool use trả 400 trên Sonnet 5.5',
    'Thêm budget_tokens để giữ chi phí thinking như cũ',
    'Thêm temperature: 0 để so sánh kết quả hai model cho ổn định'
  ],
  answer: [0, 2],
  explain: `**Đúng: chạy lại effort sweep, và bỏ forced tool use.**
- Sonnet 5.5 vẫn mặc định effort {{high}} nhưng các mức đã **hiệu chỉnh lại** so với Sonnet 5; docs gợi ý bắt đầu ở {{medium}} cho agentic coding/multi-step tool, {{low}} cho chat, rồi đo.
- {{tool_choice}} {{any}}/{{tool}} trả 400 trên Sonnet 5.5 (cũng như Opus 5.5, Fable 5.1). Thay bằng {{auto}} + nói rõ trong prompt, {{strict: true}} để giữ đảm bảo schema, hoặc structured outputs nếu chỉ cần JSON.

### Vì sao các phương án còn lại sai
- **Giữ nguyên effort:** cùng tên mức nhưng hiệu chỉnh khác; giữ nguyên là nguồn phổ biến của "model mới chậm/tốn hơn".
- **budget_tokens:** bị bỏ trên Sonnet 5.5 (400); dùng effort.
- **temperature 0:** sampling params bị 400 trên model này (và trên mọi model với API version 2026-10-21).`
},
{
  id: 'qz-claude-165',
  topic: 'claude',
  multi: true,
  q: '[Model Selection] Bạn đưa Fable 5.1 vào một agent phân tích chạy dài. Những điều nào cần chuẩn bị? (Chọn 2)',
  options: [
    'Một request trên tác vụ khó có thể chạy nhiều phút: dùng streaming, timeout dài và UI báo tiến độ',
    'Prompt viết cho model cũ thường quá chi tiết, áp đặt và có thể làm giảm chất lượng; nên rà lại cho gọn',
    'Gửi thinking {type: "disabled"} để tác vụ chạy nhanh hơn',
    'Bật Priority Tier để giảm độ trễ',
    'Đặt budget_tokens nhỏ để giới hạn thời gian suy nghĩ'
  ],
  answer: [0, 1],
  explain: `**Đúng: chuẩn bị cho lượt dài, và rà lại prompt.** Theo hướng dẫn migration của Fable 5.1:
- Một request trên tác vụ khó có thể chạy **nhiều phút**: cần streaming (tránh timeout HTTP), timeout phù hợp và trải nghiệm báo tiến độ.
- Prompt viết cho model trước thường **quá áp đặt** và làm giảm chất lượng đầu ra; nên rút gọn. Effort sweep nên gồm cả low/medium cho việc thường ngày.

### Vì sao các phương án còn lại sai
- **thinking disabled:** trên Fable 5.1 thinking luôn bật; gửi disabled là 400. Điều khiển bằng effort.
- **Priority Tier:** Fable 5.1 không có Priority Tier.
- **budget_tokens:** bị bỏ trên Fable 5.1 (400).`
},
{
  id: 'qz-claude-166',
  topic: 'claude',
  q: '[Agents] Agent dùng Tool Runner của SDK (client.beta.messages.tool_runner). Team định viết lại toàn bộ thành vòng lặp thủ công chỉ để tool send_payment phải chờ người duyệt. Nhận xét nào đúng?',
  options: [
    'Đúng, Tool Runner tự chạy mọi tool nên không thể chèn bước duyệt',
    'Đặt tool_choice none riêng cho send_payment',
    'Không cần viết lại: với Tool Runner có thể gate ngay trong hàm chạy tool (trả kết quả "người dùng từ chối" thay vì thực thi) hoặc kiểm tra tool call trong message được yield rồi cho phép/từ chối trước khi tool chạy',
    'Chuyển sang Managed Agents vì chỉ ở đó mới có cơ chế duyệt'
  ],
  answer: 2,
  explain: `**Đúng: Tool Runner hỗ trợ approval gate.** Docs nhấn mạnh Tool Runner "không phải hộp đen": mỗi vòng nó yield message của assistant **trước** khi chạy tool. Bạn có thể:
- gate trong hàm run của tool: hỏi người duyệt, nếu từ chối thì trả kết quả "user declined" thay vì thực thi;
- hoặc kiểm tra tool call trong message được yield và ghi đè request kế tiếp ({{set_messages_params()}}/{{setMessagesParams()}}) để cho phép hay từ chối trước khi tool chạy.

Vòng lặp thủ công chỉ đáng khi cần thứ runner không cho (transport riêng, luồng điều khiển không khớp hook theo lượt…).

### Vì sao các phương án còn lại sai
- **Không chèn được:** sai, xem trên.
- **tool_choice none riêng cho một tool:** tool_choice áp dụng cho cả request, không theo từng tool; none cấm mọi tool.
- **Chỉ Managed Agents có duyệt:** Managed Agents có permission policy, nhưng cả Tool Runner lẫn vòng lặp thủ công đều làm được.`
},
{
  id: 'qz-claude-167',
  topic: 'claude',
  multi: true,
  q: '[Agents] Theo bốn tiêu chí "có nên xây agent không" (độ phức tạp, giá trị, khả năng của model, chi phí khi sai), trường hợp nào nên dừng ở một lời gọi đơn hoặc workflow cố định thay vì agent? (Chọn 2)',
  options: [
    'Trích xuất tiêu đề và ngày ký từ một PDF hợp đồng',
    'Biến một design doc thành pull request hoàn chỉnh trong repo lớn, có test tự động để kiểm tra',
    'Tác vụ nhiều bước nhưng lỗi khó phát hiện và không thể rollback, ví dụ chuyển tiền hàng loạt không có bước duyệt',
    'Điều tra sự cố production trên nhiều hệ thống, không biết trước cần xem log nào'
  ],
  answer: [0, 2],
  explain: `**Đúng: trích xuất đơn giản, và tác vụ có chi phí lỗi không phục hồi được.** Trước khi lên tầng agent, kiểm tra cả bốn tiêu chí; chỉ cần một câu trả lời "không" là nên ở tầng đơn giản hơn:
- **Complexity:** tác vụ nhiều bước, khó đặc tả trước? Trích tiêu đề từ PDF thì không: một lời gọi là đủ.
- **Value:** kết quả có xứng với chi phí và độ trễ cao hơn?
- **Viability:** Claude có làm tốt loại việc này?
- **Cost of error:** lỗi có bắt được và phục hồi được (test, review, rollback)? Chuyển tiền không duyệt, không rollback thì không.

### Vì sao các phương án còn lại sai
- **Design doc thành PR:** đúng kiểu tác vụ mở, nhiều bước, và test giúp bắt lỗi: phù hợp agent.
- **Điều tra sự cố đa hệ thống:** không biết trước đường đi, cần model tự khám phá: phù hợp agent (với quyền chỉ đọc).`
},
{
  id: 'qz-claude-168',
  topic: 'claude',
  q: '[Agents] Agent nội bộ chỉ có một tool bash; Claude gửi email bằng lệnh curl tới API mail. Bộ phận bảo mật yêu cầu mọi email gửi ra ngoài phải được người duyệt. Thiết kế nào hợp lý nhất?',
  options: [
    'Viết regex trên chuỗi lệnh bash để phát hiện curl tới API mail',
    'Thêm vào system prompt câu "không được gửi email khi chưa hỏi"',
    'Chặn toàn bộ mạng ra ngoài của bash là đủ, không cần thêm gì',
    'Tách hành động thành tool chuyên dụng send_email với tham số có kiểu; harness dễ chặn, hiển thị và audit lời gọi này, còn bash chỉ đưa ra một chuỗi lệnh mờ'
  ],
  answer: 3,
  explain: `**Đúng: nâng hành động thành tool chuyên dụng.** Bash cho Claude đòn bẩy rộng nhưng harness chỉ thấy một chuỗi lệnh có cùng hình dạng cho mọi hành động. Tool chuyên dụng cho harness một điểm móc riêng với tham số có kiểu để **chặn, render, audit** hoặc chạy song song. Docs dùng đúng ví dụ: {{send_email}} dễ gate, còn {{bash -c "curl -X POST ..."}} thì không. Quy tắc: bắt đầu với bash cho độ phủ, nâng thành tool riêng khi cần gate, hiển thị, audit hoặc song song hoá; tiêu chí hay dùng là hành động có đảo ngược được không.

### Vì sao các phương án còn lại sai
- **Regex trên lệnh:** dễ lách (biến môi trường, script trung gian, mã hoá chuỗi).
- **Chỉ dặn trong prompt:** không phải cơ chế cưỡng chế; injection hoặc lỗi model vẫn có thể gửi.
- **Chặn mạng hoàn toàn:** agent mất luôn khả năng gửi email hợp lệ, không đáp ứng yêu cầu "gửi được nhưng phải duyệt".`
},
{
  id: 'qz-claude-169',
  topic: 'claude',
  q: '[Agents] Agent cần lấy 200 đơn hàng, với mỗi đơn gọi get_shipment rồi chỉ báo cáo những đơn bị trễ. Mỗi kết quả trung gian đều đi vào context, tốn token và chậm. Tính năng nào phù hợp nhất?',
  options: [
    'Programmatic tool calling: Claude viết script chạy trong container code execution, gọi tool như hàm và lọc kết quả bằng code; chỉ output cuối cùng quay về context',
    'Tăng max_tokens để chứa đủ 200 kết quả',
    'Bật disable_parallel_tool_use để giảm tải',
    'Chuyển sang Message Batches API'
  ],
  answer: 0,
  explain: `**Đúng: programmatic tool calling.** Với tool use thông thường, mỗi lần gọi là một vòng: kết quả vào context, Claude suy luận, rồi gọi tiếp. 200 vòng như vậy tích luỹ độ trễ và token, trong khi phần lớn dữ liệu trung gian không cần nữa. Programmatic tool calling cho Claude viết một script chạy trong container code execution; khi script gọi tool, container tạm dừng, tool chạy, kết quả trả về **cho code** chứ không vào context. Script lặp, lọc, rẽ nhánh; chỉ output cuối (danh sách đơn trễ) quay lại Claude. Cấu hình: thêm tool code execution và đặt {{allowed_callers}} trên tool của bạn.

### Vì sao các phương án còn lại sai
- **Tăng max_tokens:** đó là trần output, không giảm token input từ 200 kết quả.
- **disable_parallel_tool_use:** còn làm chậm hơn (một tool mỗi lượt).
- **Batch API:** dành cho nhiều request độc lập, không thay vòng lặp tool trong một tác vụ.`
},
{
  id: 'qz-claude-170',
  topic: 'claude',
  q: '[Agents] Trợ lý coding cần nhớ quy ước dự án và tiến độ công việc qua nhiều phiên khác nhau (tiến trình bị khởi động lại giữa các phiên). Cơ chế nào đúng mục đích nhất?',
  options: [
    'Context editing với clear_tool_uses',
    'Memory tool: Claude đọc/ghi file trong thư mục /memories, phần lưu trữ do bạn triển khai, nên tồn tại qua các phiên',
    'Server-side compaction',
    'Prompt caching với TTL 1 giờ'
  ],
  answer: 1,
  explain: `**Đúng: memory tool cho bền vững giữa các phiên.** Ba cơ chế quản lý context có mục đích khác nhau:
| Cơ chế | Phạm vi | Làm gì |
|---|---|---|
| Context editing | trong một phiên | xoá tool result/thinking cũ |
| Compaction | trong một phiên | tóm tắt phần đầu khi gần đầy |
| Memory tool | **qua nhiều phiên** | Claude đọc/ghi file trong {{/memories}} ({{view}}, {{create}}, {{str_replace}}…) |

Memory tool là client-side: bạn quyết định lưu ở đâu (file, DB, object storage), nên dữ liệu sống qua lần khởi động lại.

### Vì sao các phương án còn lại sai
- **Context editing:** chỉ làm gọn transcript hiện tại.
- **Compaction:** tóm tắt trong cùng hội thoại, mất khi bắt đầu phiên mới.
- **Prompt cache 1h:** chỉ giảm giá phần prefix lặp lại; không phải nơi lưu trạng thái, và hết hạn sau 1 giờ.`
},
{
  id: 'qz-claude-171',
  topic: 'claude',
  q: '[Agents] Bạn cần sinh báo cáo pháp lý và muốn log, đánh giá và rẽ nhánh được ở từng bước trung gian. Cấu trúc nào docs gợi ý?',
  options: [
    'Một request duy nhất với effort max',
    'Để model tự gọi subagent theo ý nó',
    'Prompt chaining kiểu tự sửa: lời gọi 1 tạo bản nháp, lời gọi 2 review theo tiêu chí, lời gọi 3 sửa theo review; mỗi bước là một API call riêng',
    'Few-shot 10 báo cáo hoàn chỉnh trong một prompt'
  ],
  answer: 2,
  explain: `**Đúng: prompt chaining tự sửa.** Với adaptive thinking và khả năng điều phối subagent, Claude xử lý được phần lớn suy luận nhiều bước bên trong. Nhưng chaining tường minh (chia tác vụ thành nhiều API call tuần tự) vẫn hữu ích khi bạn cần **xem output trung gian** hoặc **ép một pipeline cố định**. Mẫu phổ biến nhất là self-correction: nháp → review theo tiêu chí → sửa. Vì mỗi bước là một call riêng, bạn log, chấm điểm hoặc rẽ nhánh ở bất kỳ điểm nào.

### Vì sao các phương án còn lại sai
- **Một request effort max:** có thể cho chất lượng tốt nhưng không cho bạn điểm kiểm soát trung gian.
- **Để model tự gọi subagent:** luồng do model quyết định, khó đảm bảo đúng pipeline và khó audit từng bước.
- **10 few-shot:** giúp định dạng nhưng không tạo bước trung gian; docs gợi ý 3–5 ví dụ đa dạng.`
},
{
  id: 'qz-claude-172',
  topic: 'claude',
  q: '[Agents] Coding agent đôi khi force-push hoặc xoá branch khi gặp xung đột. Bạn muốn nó vẫn tự sửa file và chạy test, nhưng hỏi trước các hành động khó đảo ngược. Cách prompt phù hợp nhất?',
  options: [
    'Ghi "KHÔNG BAO GIỜ dùng git" trong system prompt',
    'Hạ effort xuống low để agent bớt chủ động',
    'Gỡ tool bash khỏi agent',
    'Hướng dẫn cân nhắc khả năng đảo ngược: tự làm các hành động cục bộ, đảo ngược được; hỏi trước hành động phá huỷ, khó đảo ngược hoặc ảnh hưởng hệ thống chung (force-push, reset --hard, xoá branch), và không dùng hành động phá huỷ làm đường tắt'
  ],
  answer: 3,
  explain: `**Đúng: dạy model phân loại theo khả năng đảo ngược.** Docs gợi ý prompt: được khuyến khích làm hành động cục bộ, đảo ngược được (sửa file, chạy test); với hành động khó đảo ngược, ảnh hưởng hệ thống chung hoặc phá huỷ thì hỏi người dùng trước. Ví dụ cần xác nhận: xoá file/branch, drop table, {{rm -rf}}, {{git push --force}}, {{git reset --hard}}, đẩy code, comment PR, gửi tin nhắn. Thêm câu: khi gặp trở ngại, không dùng hành động phá huỷ làm đường tắt (ví dụ bỏ qua {{--no-verify}}, xoá file lạ có thể là việc dở dang).

> Prompt là lớp hướng dẫn; với hành động thật sự nguy hiểm vẫn nên có lớp cưỡng chế ở harness (permission rule, hook).

### Vì sao các phương án còn lại sai
- **Cấm git hoàn toàn:** mất cả thao tác an toàn cần thiết (status, diff, commit cục bộ).
- **Hạ effort:** giảm độ kỹ, không dạy model ranh giới an toàn.
- **Gỡ bash:** agent không chạy được test nữa.`
},
{
  id: 'qz-claude-173',
  topic: 'claude',
  q: '[Agents] Startup muốn một agent chạy theo lịch mỗi đêm, có workspace riêng để chạy bash và thao tác file, nhưng không muốn tự viết vòng lặp agent hay vận hành sandbox. Lựa chọn phù hợp nhất?',
  options: [
    'Managed Agents: Anthropic chạy vòng lặp agent và host container cho từng session; có scheduled deployments để chạy theo lịch',
    'Tool Runner của SDK Anthropic',
    'Claude Agent SDK cài trên máy chủ của startup',
    'Message Batches API chạy mỗi đêm'
  ],
  answer: 0,
  explain: `**Đúng: Managed Agents.** Bốn cách xây agent khác nhau ở hai câu hỏi: ai cung cấp harness (vòng lặp + quản lý context) và ai cung cấp nơi chạy.
| Cách | Harness | Hạ tầng |
|---|---|---|
| Vòng lặp thủ công | bạn | bạn |
| Tool Runner | SDK | bạn |
| Claude Agent SDK | harness Claude Code | bạn |
| **Managed Agents** | Anthropic | **Anthropic** (container theo session) |

Managed Agents là lựa chọn duy nhất cung cấp cả hai, kèm scheduled deployments để chạy theo cron, không cần scheduler phía client.

### Vì sao các phương án còn lại sai
- **Tool Runner:** chỉ lặp qua tool bạn định nghĩa; không có sandbox, bạn tự host.
- **Claude Agent SDK:** có tool dựng sẵn, nhưng bạn vẫn phải host và lên lịch.
- **Batch API:** xử lý nhiều request độc lập, không có vòng lặp tool hay workspace.`
},
{
  id: 'qz-claude-174',
  topic: 'claude',
  multi: true,
  q: '[Agents] Phát biểu nào đúng khi so sánh Tool Runner (client.beta.messages.tool_runner) với Claude Agent SDK? (Chọn 2)',
  options: [
    'Tool Runner là helper trong SDK Anthropic thông thường, chỉ lặp qua các tool do bạn định nghĩa, không có tool dựng sẵn hay sandbox',
    'Claude Agent SDK là harness của Claude Code đóng gói thành thư viện, có sẵn tool đọc/ghi file, bash, grep, subagents, hooks và permissions',
    'Cả hai đều do Anthropic host, bạn không cần hạ tầng',
    'Tool Runner chỉ có trong SDK Python',
    'Claude Agent SDK chỉ là tên mới của Tool Runner'
  ],
  answer: [0, 1],
  explain: `**Đúng: Tool Runner là helper vòng lặp cho tool của bạn; Agent SDK là Claude Code dạng thư viện.**
- **Tool Runner** nằm trong SDK API thông thường ({{anthropic}}, {{@anthropic-ai/sdk}}…), tự động hoá chu trình gọi API → chạy tool → gửi kết quả, nhưng chỉ cho các tool bạn định nghĩa. Không có tool dựng sẵn, không truy cập filesystem, không sandbox.
- **Claude Agent SDK** ({{claude-agent-sdk}}, {{@anthropic-ai/claude-agent-sdk}}) là một sản phẩm riêng: harness đầy đủ của Claude Code với tool Read/Write/Edit/Bash/Grep/WebSearch…, subagents, hooks, permissions, sessions.

### Vì sao các phương án còn lại sai
- **Anthropic host cả hai:** sai; cả hai chỉ là harness, bạn tự host. Managed Agents mới là bên host.
- **Chỉ Python:** Tool Runner có trong Python, TypeScript, Java, Go, Ruby, PHP, C#.
- **Tên mới của nhau:** là hai package khác nhau, phạm vi khác nhau.`
},
{
  id: 'qz-claude-175',
  topic: 'claude',
  multi: true,
  q: '[Agents] Những phát biểu nào đúng về tham số effort khi dùng cho agent? (Chọn 2)',
  options: [
    'Effort thấp hơn thường dẫn tới ít tool call hơn và được gộp lại, ít lời dẫn, xác nhận ngắn gọn hơn',
    'low phù hợp cho subagent hoặc tác vụ đơn giản; việc nhạy cảm về trí tuệ nên dùng tối thiểu high',
    'effort đặt ở top-level request, cạnh max_tokens',
    'Đổi effort giữa các request không ảnh hưởng gì tới prompt cache',
    'effort chỉ có tác dụng khi thinking đã tắt'
  ],
  answer: [0, 1],
  explain: `**Đúng: effort ảnh hưởng số tool call và độ dài, low cho subagent/việc đơn giản.** Effort điều chỉnh đánh đổi giữa độ kỹ và lượng token: effort thấp → ít tool call hơn và được gộp lại, ít phần mở đầu, xác nhận gọn. Docs khuyên tối thiểu {{high}} cho việc cần trí tuệ, {{max}} khi đúng quan trọng hơn chi phí, {{low}} cho subagent hoặc việc đơn giản.

### Vì sao các phương án còn lại sai
- **Top-level:** effort nằm trong {{output_config}} (ví dụ {{output_config.effort = "low"}}).
- **Không ảnh hưởng cache:** đổi effort ở top-level làm mất cache phần messages (và có thể cả tools/system tuỳ model). Nên cố định effort theo route; trên vài model mới có system message đổi effort giữa hội thoại (beta) để tránh điều này.
- **Chỉ khi tắt thinking:** effort điều khiển chính độ sâu của adaptive thinking và tổng token chi tiêu.`
},
{
  id: 'qz-claude-176',
  topic: 'claude',
  q: '[Prompt] Trong IDE, người dùng gõ "Bạn có thể gợi ý vài thay đổi để hàm này nhanh hơn không?" và Claude chỉ liệt kê gợi ý, không sửa code, trong khi sản phẩm muốn Claude sửa trực tiếp. Cách xử lý theo docs là gì?',
  options: [
    'Tăng effort để model chủ động hơn',
    'Model mới làm theo chỉ dẫn rất sát: cần nói rõ hành động ("Sửa hàm này để...") hoặc thêm chỉ dẫn mặc định trong system prompt kiểu "mặc định hãy thực hiện thay đổi thay vì chỉ gợi ý"',
    'Dùng tool_choice any để ép model gọi tool edit',
    'Thêm "CRITICAL: YOU MUST EDIT" vào đầu prompt'
  ],
  answer: 1,
  explain: `**Đúng: nói rõ hành động, hoặc đặt mặc định trong system prompt.** Các model mới được huấn luyện để làm theo chỉ dẫn chính xác. "Bạn có thể gợi ý…" được hiểu đúng nghĩa đen là đưa gợi ý. Docs gợi ý hai cách: viết yêu cầu dạng hành động ("Thay đổi hàm này để cải thiện hiệu năng"), hoặc thêm khối kiểu {{<default_to_action>}} vào system prompt: mặc định thực hiện thay đổi; khi ý định chưa rõ thì suy ra hành động hữu ích nhất và dùng tool để tìm thông tin thiếu thay vì đoán.

### Vì sao các phương án còn lại sai
- **Tăng effort:** làm model nghĩ kỹ hơn, không đổi cách hiểu yêu cầu "gợi ý".
- **tool_choice any:** trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1; và ép gọi tool cả khi người dùng chỉ muốn hỏi.
- **CRITICAL/MUST:** docs khuyên làm mềm ngôn ngữ kiểu này; với model mới, giọng gắt dễ gây gọi tool quá đà.`
},
{
  id: 'qz-claude-177',
  topic: 'claude',
  q: '[Prompt] Một prompt trộn hướng dẫn, 5 tài liệu, vài ví dụ và câu hỏi người dùng trong một khối văn bản liền; model đôi khi coi nội dung tài liệu là hướng dẫn. Cải tiến cấu trúc nào phù hợp nhất?',
  options: [
    'Viết hoa toàn bộ phần hướng dẫn',
    'Chuyển cả 5 tài liệu vào system prompt',
    'Bọc từng loại nội dung bằng thẻ XML nhất quán (<instructions>, <documents> chứa các <document index="n">, <examples>, <input>) để model phân biệt rõ',
    'Đánh số dòng cho toàn bộ prompt'
  ],
  answer: 2,
  explain: `**Đúng: cấu trúc bằng XML tag.** Docs: thẻ XML giúp Claude phân tích prompt phức tạp một cách rõ ràng, nhất là khi prompt trộn hướng dẫn, ngữ cảnh, ví dụ và input biến đổi. Mỗi loại nội dung nằm trong thẻ riêng; dùng tên thẻ nhất quán và mô tả; lồng thẻ theo thứ bậc tự nhiên (tài liệu nằm trong {{<documents>}}, mỗi tài liệu là {{<document index="n">}} kèm metadata như nguồn).

~~~text
<documents>
  <document index="1"><source>policy.pdf</source><content>...</content></document>
</documents>
<instructions>Chỉ dùng thông tin trong documents...</instructions>
~~~

### Vì sao các phương án còn lại sai
- **Viết hoa:** không tạo ranh giới giữa các loại nội dung, còn có thể gây phản ứng thái quá.
- **Tài liệu vào system:** không giải quyết việc phân biệt; system nên chứa vai trò và quy tắc.
- **Đánh số dòng:** không cho model biết đâu là hướng dẫn, đâu là dữ liệu.`
},
{
  id: 'qz-claude-178',
  topic: 'claude',
  q: '[Prompt] Được yêu cầu sửa một bug nhỏ, coding agent lại thêm lớp helper mới, thêm cấu hình, docstring và try/catch cho cả module. Cách điều chỉnh hợp lý nhất là gì?',
  options: [
    'Hạ max_tokens để model viết ít code hơn',
    'Chuyển sang Haiku 5.5',
    'Thêm câu "hãy viết code chất lượng cao"',
    'Thêm chỉ dẫn tránh over-engineering: chỉ thay đổi những gì được yêu cầu hoặc thật cần thiết, không thêm tính năng, abstraction hay xử lý lỗi cho tình huống không thể xảy ra, không thêm comment cho code không đụng tới'
  ],
  answer: 3,
  explain: `**Đúng: chỉ dẫn cụ thể để giữ lời giải tối thiểu.** Docs ghi nhận các model Opus gần đây có xu hướng over-engineer (tạo thêm file, abstraction thừa, độ linh hoạt không ai yêu cầu) và gợi ý prompt nêu rõ từng khía cạnh:
- **Phạm vi:** sửa bug không cần dọn code xung quanh.
- **Tài liệu:** không thêm docstring/comment/type cho code không thay đổi.
- **Phòng thủ:** không thêm xử lý lỗi cho tình huống không thể xảy ra; chỉ validate ở biên hệ thống.
- **Abstraction:** không tạo helper cho thao tác dùng một lần.

### Vì sao các phương án còn lại sai
- **Hạ max_tokens:** có thể cắt cụt bản sửa giữa chừng ({{stop_reason: "max_tokens"}}), không đổi xu hướng.
- **Đổi sang Haiku:** có thể giảm chất lượng sửa bug; vấn đề là hướng dẫn, không phải model.
- **"Code chất lượng cao":** mơ hồ, thậm chí khuyến khích thêm "cải tiến".`
},
{
  id: 'qz-claude-179',
  topic: 'claude',
  q: '[Prompt] Agent sửa code cho pass test bằng cách thêm nhánh if trả đúng giá trị mà test mong đợi. Hướng dẫn nào docs gợi ý để có lời giải tổng quát?',
  options: [
    'Yêu cầu lời giải tổng quát đúng với mọi input hợp lệ, không hard-code theo test; test để kiểm tra chứ không định nghĩa lời giải; nếu test sai hoặc yêu cầu bất khả thi thì báo lại thay vì lách',
    'Xoá các test khó để agent không bị áp lực',
    'Ẩn toàn bộ file test khỏi agent',
    'Tăng số test lên gấp đôi mà không đổi prompt'
  ],
  answer: 0,
  explain: `**Đúng: nói rõ mục tiêu là lời giải tổng quát.** Docs có mục riêng "tránh tập trung vào việc pass test và hard-code": yêu cầu lời giải chất lượng, dùng công cụ chuẩn; không tạo script lách; triển khai đúng cho mọi input hợp lệ, không chỉ test case; không hard-code giá trị; test là để kiểm chứng tính đúng, không định nghĩa lời giải; và nếu tác vụ bất khả thi hoặc test sai thì **thông báo** thay vì lách.

### Vì sao các phương án còn lại sai
- **Xoá test khó:** mất kiểm chứng; docs còn khuyên nhấn mạnh không được xoá hay sửa test.
- **Ẩn test:** agent mất công cụ tự kiểm tra, còn bạn mất tín hiệu.
- **Gấp đôi test:** có thể làm hard-code khó hơn nhưng không sửa nguyên nhân; agent vẫn tối ưu theo test.`
},
{
  id: 'qz-claude-180',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Trợ lý trả lời câu hỏi về codebase đôi khi khẳng định nội dung của một file mà nó chưa hề mở. Những biện pháp nào phù hợp? (Chọn 2)',
  options: [
    'Thêm chỉ dẫn: không suy đoán về code chưa mở; nếu người dùng nhắc tới file cụ thể thì phải đọc file đó trước khi trả lời',
    'Cung cấp tool đọc file/grep để model kiểm chứng thay vì đoán',
    'Bỏ tool đọc file để giảm context',
    'Thêm câu "Bạn là chuyên gia không bao giờ sai"',
    'Bật tool_choice any để model luôn gọi tool'
  ],
  answer: [0, 1],
  explain: `**Đúng: chỉ dẫn "điều tra trước khi trả lời" và có công cụ để điều tra.** Docs gợi ý khối {{<investigate_before_answering>}}: không bao giờ suy đoán về code chưa mở; nếu người dùng nhắc tới file cụ thể thì phải đọc file trước; chỉ đưa ra khẳng định sau khi đã kiểm tra. Chỉ dẫn này chỉ có tác dụng khi model **có** tool để đọc file hoặc tìm kiếm.

### Vì sao các phương án còn lại sai
- **Bỏ tool đọc file:** model càng phải đoán, ảo giác tăng.
- **"Không bao giờ sai":** câu khẳng định vai trò không thêm thông tin, có khi còn làm model tự tin quá mức.
- **tool_choice any:** 400 trên các model hiện hành như Opus 5.5; và ép gọi tool ở mọi lượt là thừa.`
},
{
  id: 'qz-claude-181',
  topic: 'claude',
  q: '[Prompt] Sau khi chuyển sang model mới, người dùng than agent làm xong việc (nhiều tool call) nhưng không tóm tắt đã làm gì. Cách xử lý đúng là gì?',
  options: [
    'Model mới đã bỏ khả năng tóm tắt; cần một lời gọi Haiku riêng để tóm tắt',
    'Model mới ngắn gọn hơn và có thể bỏ qua tóm tắt sau tool call; thêm chỉ dẫn kiểu "Sau khi hoàn thành tác vụ có dùng tool, hãy tóm tắt nhanh những gì đã làm"',
    'Tăng max_tokens để model có chỗ viết tóm tắt',
    'Đặt stop_sequences để buộc model viết thêm'
  ],
  answer: 1,
  explain: `**Đúng: yêu cầu tóm tắt một cách tường minh.** Docs mô tả phong cách của model mới: trực tiếp hơn, tự nhiên hơn, **ít dài dòng hơn**, có thể bỏ phần tóm tắt sau khi gọi tool để chuyển ngay sang hành động tiếp theo. Muốn thấy rõ hơn công việc, thêm một câu như ví dụ trên vào prompt. (Ngược lại, nếu model quá dài dòng thì yêu cầu ngắn gọn tường minh.)

### Vì sao các phương án còn lại sai
- **Mất khả năng tóm tắt:** model vẫn tóm tắt tốt khi được yêu cầu; gọi thêm Haiku là tốn tiền không cần thiết.
- **Tăng max_tokens:** không đổi hành vi; model không thiếu chỗ, chỉ là không được yêu cầu.
- **stop_sequences:** dùng để **dừng** sinh khi gặp chuỗi, không buộc viết thêm.`
},
{
  id: 'qz-claude-182',
  topic: 'claude',
  q: '[Prompt] Trên một route phân tích chạy Opus 5.5, model liên tục cân nhắc lại hướng đi, thinking phình to và độ trễ cao, dù kết quả cuối không tốt hơn. Biện pháp phù hợp là gì?',
  options: [
    'Gửi budget_tokens nhỏ để giới hạn thinking',
    'Tắt thinking bằng {type: "disabled"}',
    'Thêm chỉ dẫn "chọn một hướng tiếp cận và đi tới cùng, chỉ xem lại khi có thông tin mới mâu thuẫn"; nếu vẫn thừa thì hạ effort',
    'Tăng effort lên max để model suy nghĩ dứt khoát hơn'
  ],
  answer: 2,
  explain: `**Đúng: chỉ dẫn "commit" và hạ effort.** Docs có mục "overthinking": thay mặc định chung chung bằng chỉ dẫn có mục tiêu, bỏ các câu khuyến khích "kỹ hơn nữa", và gợi ý prompt: khi quyết định cách tiếp cận, hãy chọn một hướng và đi tới cùng; tránh xem lại quyết định trừ khi gặp thông tin mới mâu thuẫn trực tiếp. Nếu vẫn quá mức, hạ {{effort}}: đây là đòn bẩy chính để giảm thinking trên model hiện hành.

### Vì sao các phương án còn lại sai
- **budget_tokens:** bị bỏ trên Opus 5.5 (400).
- **disabled:** Opus 5.5 không cho tắt thinking ở bất kỳ mức effort nào (400).
- **Effort max:** làm model suy nghĩ **nhiều hơn**, tăng độ trễ.`
},
{
  id: 'qz-claude-183',
  topic: 'claude',
  multi: true,
  q: '[Prompt] Team dùng Opus 5 (đời trước Opus 5.5) thấy câu trả lời cho người dùng quá dài; họ đã hạ effort mà độ dài gần như không đổi. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Theo docs, trên Opus 5 việc tăng hay giảm effort không thay đổi một cách đáng tin cậy độ dài phản hồi hiển thị cho người dùng',
    'Cách phù hợp là yêu cầu ngắn gọn một cách tường minh trong prompt, ví dụ giới hạn số câu và bỏ phần mở đầu',
    'Phải gửi temperature thấp để câu trả lời ngắn lại',
    'Dùng prefill để model dừng sớm',
    'Giảm max_tokens xuống 100 là cách tốt nhất để có câu trả lời ngắn mà vẫn đầy đủ'
  ],
  answer: [0, 1],
  explain: `**Đúng: effort không điều khiển độ dài trên Opus 5; hãy prompt tường minh.** Docs ghi Opus 5 là ngoại lệ về độ dài: phản hồi mặc định dài hơn các model trước, và tăng/giảm effort **không** thay đổi đáng tin cậy độ dài hiển thị. Cách sửa là yêu cầu ngắn gọn trực tiếp trong prompt (docs Opus 5 có câu mẫu). Bài học chung: effort điều khiển độ kỹ suy nghĩ và tool, còn độ dài/định dạng điều khiển bằng chỉ dẫn.

### Vì sao các phương án còn lại sai
- **temperature thấp:** temperature không quyết định độ dài, và còn bị 400 trên các model hiện hành.
- **prefill:** không còn được hỗ trợ trên các model gần đây (400).
- **max_tokens 100:** cắt câu trả lời giữa chừng ({{stop_reason: "max_tokens"}}), không làm nó ngắn mà đầy đủ.`
},
{
  id: 'qz-claude-184',
  topic: 'claude',
  q: '[Tools] Message user gửi kết quả tool có content: [{"type": "text", "text": "Kết quả đây:"}, {"type": "tool_result", "tool_use_id": "toolu_01", "content": "15 độ"}] và nhận 400. Cách sửa đúng là gì?',
  options: [
    'Bỏ tool_use_id vì API tự khớp theo thứ tự',
    'Gửi tool_result trong một message có role "tool"',
    'Gửi phần text trong một message user riêng, đặt trước message chứa tool_result',
    'Đặt các block tool_result lên ĐẦU mảng content; text (nếu có) phải đứng sau tất cả tool_result'
  ],
  answer: 3,
  explain: `**Đúng: tool_result phải đứng đầu.** Quy tắc định dạng: trong message user chứa kết quả tool, các block {{tool_result}} phải nằm **đầu tiên** trong mảng content; text chỉ được đứng sau tất cả tool_result. Ngoài ra, message chứa tool_result phải đi **ngay sau** message assistant có tool_use, không có message nào chen giữa. (Nếu lượt assistant còn server tool chưa có kết quả, message user chỉ được chứa tool_result.)

### Vì sao các phương án còn lại sai
- **Bỏ tool_use_id:** trường bắt buộc để ghép kết quả với lời gọi.
- **Role "tool":** Claude API không có role tool; kết quả nằm trong message user.
- **Text ở message riêng phía trước:** chen một message giữa tool_use và tool_result là sai quy tắc (lỗi "tool_use ids were found without tool_result blocks immediately after").`
},
{
  id: 'qz-claude-185',
  topic: 'claude',
  q: '[Tools] Claude trả 3 tool_use trong một lượt. Harness gửi lại 3 message user liên tiếp, mỗi message một tool_result. Về sau Claude gần như không còn gọi tool song song. Nguyên nhân hợp lý nhất?',
  options: [
    'Tách kết quả ra nhiều message user "dạy" Claude tránh gọi song song; phải gửi tất cả tool_result trong một message user duy nhất',
    'Gọi tool song song bị API tự tắt sau 3 lần',
    'Phải thêm disable_parallel_tool_use: false vào mỗi request',
    'Do prompt cache hết hạn'
  ],
  answer: 0,
  explain: `**Đúng: định dạng lịch sử sai làm giảm parallel tool use.** Phần Troubleshooting của docs nêu đây là lỗi phổ biến nhất: gửi mỗi tool_result trong một message user riêng sẽ "dạy" Claude tránh gọi song song. Đúng là: một message assistant chứa nhiều tool_use → **một** message user chứa tất cả tool_result tương ứng (mỗi cái có {{tool_use_id}} khớp). Để đo, tính trung bình số tool_use mỗi message có gọi tool; nếu > 1 là song song đang hoạt động.

### Vì sao các phương án còn lại sai
- **API tự tắt:** không có cơ chế như vậy.
- **disable_parallel_tool_use: false:** đó đã là mặc định (song song được bật); thêm vào không đổi gì.
- **Cache hết hạn:** cache ảnh hưởng chi phí, không ảnh hưởng hành vi gọi tool.`
},
{
  id: 'qz-claude-186',
  topic: 'claude',
  q: '[Tools] Agent có hai tool search_orders và get_order với description một dòng ("Tìm đơn", "Lấy đơn"). Claude thường chọn nhầm tool. Cải tiến nào docs coi là quan trọng nhất?',
  options: [
    'Đổi tên thành tool_1 và tool_2 cho ngắn gọn',
    'Viết description thật chi tiết (ít nhất 3–4 câu): tool làm gì, khi nào nên và không nên dùng, ý nghĩa từng tham số, các giới hạn và dữ liệu tool không trả về',
    'Thêm input_examples cho cả hai nhưng giữ description một dòng',
    'Đặt tool_choice auto'
  ],
  answer: 1,
  explain: `**Đúng: description chi tiết.** Docs: "Provide extremely detailed descriptions" là **yếu tố quan trọng nhất** với hiệu quả dùng tool. Description nên nêu: tool làm gì; khi nào dùng (và khi nào không); từng tham số nghĩa là gì, ảnh hưởng hành vi ra sao; caveat, giới hạn, thông tin không trả về. Mục tiêu ít nhất 3–4 câu mỗi tool. Ví dụ: search_orders "tìm theo email/khoảng ngày, trả tối đa 20 đơn tóm tắt, không có chi tiết vận chuyển; dùng khi chưa biết order_id"; get_order "dùng khi đã có order_id…".

### Vì sao các phương án còn lại sai
- **tool_1/tool_2:** tên càng mơ hồ càng dễ nhầm; docs khuyên tên cụ thể, có namespace.
- **input_examples với description một dòng:** examples giúp định dạng input phức tạp, nhưng docs ưu tiên description trước; examples không nói khi nào chọn tool nào.
- **tool_choice auto:** đã là mặc định, không giúp phân biệt hai tool.`
},
{
  id: 'qz-claude-187',
  topic: 'claude',
  multi: true,
  q: '[Tools] Agent có khoảng 300 tool nhưng mỗi request thường chỉ cần vài tool. Bạn dùng tool search tool. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Đánh dấu các tool defer_loading: true; Claude tìm và chỉ nạp schema của tool liên quan khi cần',
    'Schema tìm được được nối thêm (append) chứ không thay thế, nên prefix đã cache vẫn được giữ',
    'Nên đặt defer_loading: true cho tất cả tool, kể cả chính tool search, để context gọn nhất',
    'Tool search chỉ hoạt động khi tool_choice là any',
    'Tool search tự gộp 300 tool thành một tool duy nhất'
  ],
  answer: [0, 1],
  explain: `**Đúng: defer_loading và append giữ cache.** Tool search (biến thể regex hoặc BM25) cho Claude tìm tool trong thư viện lớn mà không phải đưa mọi định nghĩa vào context. Tool đánh dấu {{defer_loading: true}} chỉ được nạp khi Claude tìm thấy và cần; schema tìm được được **nối thêm** vào request chứ không hoán đổi, nên prefix đã cache vẫn còn nguyên. Đặt tên có namespace (ví dụ {{github_list_prs}}) giúp tìm chính xác hơn.

### Vì sao các phương án còn lại sai
- **Defer tất cả:** chính tool search không được defer, và phải có ít nhất một tool không defer; nếu không API trả 400 "All tools have defer_loading set".
- **Chỉ với tool_choice any:** không có ràng buộc này (any còn bị 400 trên Opus 5.5).
- **Gộp thành một tool:** tool search không gộp tool; việc gộp thao tác là quyết định thiết kế của bạn.`
},
{
  id: 'qz-claude-188',
  topic: 'claude',
  q: '[Tools] Code parse câu trả lời tự do của Claude bằng regex để tìm "APPROVE" hoặc "REJECT", và thỉnh thoảng parse sai. Theo docs về khi nào nên dùng tool, hướng sửa phù hợp nhất là gì?',
  options: [
    'Viết regex chặt hơn, xử lý thêm các biến thể',
    'Yêu cầu model luôn viết APPROVE bằng chữ in hoa',
    'Quyết định đó nên là dữ liệu có cấu trúc: dùng tool (hoặc structured outputs) với schema có trường enum APPROVE/REJECT thay vì trích từ văn bản tự do',
    'Dùng stop_sequences "APPROVE" để bắt kết quả'
  ],
  answer: 2,
  explain: `**Đúng: cấu trúc thuộc về schema.** Docs: "nếu bạn đang viết regex để trích một quyết định từ output của model, quyết định đó lẽ ra phải là một tool call". Parse văn bản tự do để khôi phục ý định có cấu trúc là dấu hiệu cấu trúc nên nằm trong schema. Dùng tool với {{strict: true}} hoặc structured outputs ({{output_config.format}}) có {{"enum": ["APPROVE", "REJECT"]}} thì kết quả luôn parse được.

### Vì sao các phương án còn lại sai
- **Regex chặt hơn:** chỉ vá triệu chứng; văn bản tự do luôn có biến thể mới (phủ định, trích dẫn).
- **Bắt viết in hoa:** vẫn là văn bản tự do; "not APPROVE" vẫn khớp nhầm.
- **stop_sequences:** dừng sinh ngay khi gặp chuỗi, không phân biệt ngữ cảnh, và token dừng không xuất hiện trong output.`
},
{
  id: 'qz-claude-189',
  topic: 'claude',
  q: '[Tools] Tool take_screenshot trả về ảnh. Harness hiện chuyển ảnh thành chuỗi base64 rồi đặt vào content dạng text của tool_result; Claude không "nhìn" được ảnh. Cách đúng là gì?',
  options: [
    'Gửi ảnh trong system prompt',
    'Gửi ảnh trong một message user riêng sau message tool_result',
    'Lưu ảnh lên storage rồi ghi URL vào text của tool_result',
    'content của tool_result có thể là danh sách block, gồm block image (source base64 kèm media_type); gửi ảnh dưới dạng block image trong tool_result'
  ],
  answer: 3,
  explain: `**Đúng: tool_result chứa được block image.** {{content}} của tool_result có thể là chuỗi, danh sách block lồng ({{text}}, {{image}}), hoặc block {{document}}. Ảnh gửi dưới dạng:

~~~json
{"type": "tool_result", "tool_use_id": "toolu_01", "content": [
  {"type": "text", "text": "Ảnh màn hình hiện tại"},
  {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": "..."}}
]}
~~~

Chuỗi base64 dạng text chỉ là một dãy ký tự với model, vừa tốn token vừa không được xử lý như ảnh.

### Vì sao các phương án còn lại sai
- **System prompt:** không phải chỗ cho kết quả động của tool, và phá cache.
- **Message user riêng sau tool_result:** hai message user liên tiếp bị gộp làm một; quan trọng hơn, kết quả nên gắn với đúng tool_use_id.
- **URL trong text:** model không tự tải URL từ text của tool_result.`
},
{
  id: 'qz-claude-190',
  topic: 'claude',
  multi: true,
  q: '[Tools] Bạn bật eager_input_streaming: true trên tool write_file trong request streaming để input lớn được stream sớm. Những việc nào cần làm? (Chọn 2)',
  options: [
    'Validate input đã parse theo schema trước khi chạy tool, vì khi bật cờ này API không còn kiểm tra hay ép kiểu input và parser khoan dung có thể trả input bị cắt',
    'Kiểm tra stop_reason (max_tokens, refusal) trước khi chạy tool',
    'Thêm beta header fine-grained-tool-streaming-2025-05-14',
    'Gọi qua client.beta.messages vì đây là tính năng beta',
    'Bỏ bước validate vì API đã đảm bảo JSON hợp lệ'
  ],
  answer: [0, 1],
  explain: `**Đúng: tự validate input, và kiểm tra stop_reason.** {{eager_input_streaming: true}} đặt trên định nghĩa tool cho phép input lớn (nội dung file, code) được stream ngay khi sinh thay vì đổ ra một lần sau khi server buffer xong. Đổi lại, API **không còn ép kiểu hay validate** input: {{partial_json}} gom được có thể thiếu (bị {{max_tokens}} cắt) hoặc không hợp lệ, và parser khoan dung của SDK có thể trả input bị cắt mà không báo lỗi. Vì vậy client phải validate theo schema và kiểm tra {{stop_reason}} trước khi chạy tool.

### Vì sao các phương án còn lại sai
- **Header fine-grained-tool-streaming:** tính năng không còn là beta; docs nói không gửi header cũ này nữa.
- **client.beta.messages:** dùng {{client.messages.stream}} bình thường, không có đường beta.
- **Bỏ validate:** ngược hẳn với docs; đây chính là phần trách nhiệm chuyển sang client.`
},
{
  id: 'qz-claude-191',
  topic: 'claude',
  q: '[Tools] Bạn bật strict: true cho tool create_ticket nhưng request bị lỗi về schema. Schema có vài object con không khai báo additionalProperties. Cách sửa đúng là gì?',
  options: [
    'Với strict tool use, mọi object trong schema phải có additionalProperties: false (và khai báo required); strict đặt ở cấp tool, cạnh name, description, input_schema',
    'Đặt strict bên trong tool_choice',
    'Bỏ required để model linh hoạt hơn',
    'strict chỉ dùng được cùng tool_choice any'
  ],
  answer: 0,
  explain: `**Đúng: additionalProperties false cho mọi object.** Strict tool use đảm bảo {{tool_use.input}} khớp đúng schema. Điều kiện: {{strict: true}} là trường top-level của **định nghĩa tool** (cạnh {{name}}/{{description}}/{{input_schema}}), schema có {{required}}, và **mọi object** (kể cả object lồng) có {{additionalProperties: false}}; giá trị khác false không được hỗ trợ.

### Vì sao các phương án còn lại sai
- **strict trong tool_choice:** sai vị trí; tool_choice chỉ điều khiển việc chọn tool.
- **Bỏ required:** đi ngược yêu cầu của strict mode.
- **Chỉ với tool_choice any:** strict dùng với {{auto}}; trên Opus 5.5/Sonnet 5.5/Fable 5.1, any còn bị 400 và {{auto}} + strict chính là cách thay thế được khuyến nghị.`
},
{
  id: 'qz-claude-192',
  topic: 'claude',
  multi: true,
  q: '[Security] Agent có web_search và web_fetch, thường xuyên đọc tài liệu do người ngoài gửi tới. Bạn lo dữ liệu nội bộ bị rò ra ngoài qua URL do nội dung độc hại dựng sẵn. Những phát biểu/biện pháp nào đúng? (Chọn 2)',
  options: [
    'web_fetch chỉ lấy URL đã xuất hiện trong hội thoại chứ không tự tạo URL mới; nhưng nội dung không tin cậy vẫn có thể đưa URL vào hội thoại, nên vẫn phải giới hạn',
    'Giới hạn domain bằng allowed_domains (hoặc blocked_domains) và đặt max_uses cho web tool, theo nguyên tắc quyền tối thiểu',
    'Web tool chạy phía server của Anthropic nên không có rủi ro rò dữ liệu',
    'Khai báo cả allowed_domains lẫn blocked_domains trên cùng một tool để chặn kép',
    'Tắt prompt caching để tránh rò dữ liệu qua URL'
  ],
  answer: [0, 1],
  explain: `**Đúng: hiểu giới hạn của web_fetch, và thu hẹp domain.**
- Web fetch chỉ lấy URL **đã có trong hội thoại**. Đây là một lớp bảo vệ, nhưng tài liệu độc hại có thể chứa sẵn URL kiểu {{https://attacker.example/?d=...}} và dụ model ghép dữ liệu vào; nên không được coi là đủ.
- Theo nguyên tắc least privilege: chỉ bật web tool khi cần, giới hạn bằng {{allowed_domains}} **hoặc** {{blocked_domains}}, đặt {{max_uses}}; kết hợp chính sách "nội dung từ tool là dữ liệu không tin cậy" trong system prompt.

### Vì sao các phương án còn lại sai
- **Chạy phía server nên an toàn:** nơi chạy không thay đổi việc URL có thể mang dữ liệu ra ngoài.
- **Khai báo cả hai danh sách:** docs hướng dẫn dùng một trong hai, không dùng cả hai cùng lúc.
- **Tắt caching:** caching không liên quan tới rò dữ liệu qua URL.`
},
{
  id: 'qz-claude-193',
  topic: 'claude',
  multi: true,
  q: '[Security] Bạn triển khai backend cho memory tool trong một ứng dụng nhiều người dùng. Những yêu cầu nào đúng? (Chọn 2)',
  options: [
    'Mỗi người dùng một thư mục memory riêng, kiểm tra xác thực và quyền trong handler của tool; bản triển khai tham chiếu không có sẵn kiểm soát truy cập',
    'Không lưu API key, mật khẩu, token vào file memory; cân nhắc quy định như GDPR/CCPA trước khi lưu PII',
    'Memory tool lưu trên server của Anthropic nên không cần lo kiểm soát truy cập',
    'Dùng chung một thư mục /memories cho mọi người dùng để model học nhanh hơn',
    'Cho phép đường dẫn tuỳ ý ngoài /memories để linh hoạt'
  ],
  answer: [0, 1],
  explain: `**Đúng: cô lập theo người dùng, và không lưu secret.** Memory tool là **client-side**: Claude gửi lệnh ({{view}}, {{create}}, {{str_replace}}, {{insert}}, {{delete}}, {{rename}}) trên thư mục {{/memories}}, còn **bạn** thực thi và lưu trữ. Vì vậy mọi kiểm soát bảo mật nằm trong handler của bạn:
- Bản tham chiếu không có kiểm soát truy cập; hệ nhiều người dùng phải tách thư mục theo user và xác thực trong handler.
- Không lưu secret; thận trọng với PII theo quy định bảo vệ dữ liệu.
- Kiểm tra mọi đường dẫn chỉ nằm trong thư mục memory được phép (chặn path traversal kiểu {{../}}).

### Vì sao các phương án còn lại sai
- **Lưu ở server Anthropic:** sai; bạn tự triển khai lưu trữ.
- **Thư mục chung:** người dùng A đọc được ghi nhớ của người dùng B, rò dữ liệu.
- **Đường dẫn tuỳ ý:** mở đường cho đọc/ghi file hệ thống qua path traversal.`
},
{
  id: 'qz-claude-194',
  topic: 'claude',
  q: '[Security] Agent đọc trang web của bên thứ ba. Bạn thêm bước gọi Haiku 5.5 với structured outputs {injection_suspected: boolean} trên output thô của tool trước khi trả cho Claude. Khi injection_suspected là true, nên làm gì?',
  options: [
    'Vẫn trả nguyên nội dung nhưng thêm câu "hãy cẩn thận" vào cuối tool_result',
    'Trả về lỗi hoặc một bản tóm tắt đã loại bỏ phần nghi ngờ trong tool_result thay vì nội dung thô, và cân nhắc báo cho người dùng',
    'Chuyển nội dung đó vào system prompt để model xem xét kỹ hơn',
    'Bỏ qua kết quả và không gửi tool_result cho lời gọi đó'
  ],
  answer: 1,
  explain: `**Đúng: không đưa nội dung thô, trả lỗi hoặc bản đã làm sạch.** Docs gợi ý sàng lọc **output của tool** giống sàng lọc input người dùng: chạy tool, đưa output thô cho một lời gọi Haiku 5.5 nhỏ, dùng structured outputs để có verdict parse được. Chỉ trả nội dung trong {{tool_result}} khi screen không thấy injection; nếu {{injection_suspected}} là true thì trả lỗi hoặc bản tóm tắt đã lược, và cân nhắc báo cho người dùng. Một response {{stop_reason: "refusal"}} từ Haiku cũng xử lý như vậy (không có verdict để đọc).

### Vì sao các phương án còn lại sai
- **Thêm "hãy cẩn thận" vào tool_result:** vẫn đưa payload vào context; còn chỉ dẫn đặt trong tool_result có thể bị bỏ qua hoặc bị coi là injection.
- **Đưa vào system prompt:** nâng nội dung độc hại lên vị trí có thẩm quyền cao nhất, tệ nhất có thể.
- **Không gửi tool_result:** mỗi tool_use phải có tool_result tương ứng, nếu không request sau bị 400; hãy gửi kết quả lỗi ({{is_error}}) thay vào.`
},
{
  id: 'qz-claude-195',
  topic: 'claude',
  q: '[Security] Tool ocr_upload trả văn bản OCR từ ảnh người dùng tải lên; description của tool chỉ ghi "Trả về văn bản". Docs gợi ý bổ sung gì để Claude cân nhắc đúng mức độ tin cậy của nội dung này?',
  options: [
    'Không cần gì thêm, Claude tự biết nội dung nào đáng tin',
    'Đổi tên tool thành trusted_text để model tin tưởng hơn',
    'Nói rõ bản chất và nguồn của nội dung (văn bản OCR từ ảnh người dùng tải lên, có thể chứa chỉ dẫn không đáng tin) trong description hoặc cấu trúc kết quả, kèm chính sách trong system prompt rằng nội dung từ tool là dữ liệu không tin cậy',
    'Đưa văn bản OCR vào system prompt cho model đọc kỹ'
  ],
  answer: 2,
  explain: `**Đúng: nêu nguồn gốc nội dung và chính sách.** Với indirect prompt injection, docs khuyên:
- Đặt nội dung bên thứ ba chỉ trong {{tool_result}}.
- **Cho Claude biết nội dung là gì và từ đâu tới**: trong description của tool hoặc cấu trúc kết quả, ví dụ "body email từ người gửi lạ", "văn bản OCR từ ảnh người dùng tải lên". Thông tin này giúp Claude hiệu chỉnh mức tin cậy với các chỉ dẫn lẫn trong đó.
- Nêu chính sách trong system prompt: nội dung từ tool là dữ liệu không tin cậy, không bao giờ được ghi đè system prompt hay yêu cầu gốc của người dùng.

### Vì sao các phương án còn lại sai
- **Không cần gì:** docs coi đây là biện pháp cụ thể, đáng làm.
- **Tên trusted_text:** ngược mục tiêu, gợi ý model tin nội dung không đáng tin.
- **Đưa vào system prompt:** docs nói rõ không đặt nội dung không tin cậy vào system hay text của user.`
},
{
  id: 'qz-claude-196',
  topic: 'claude',
  q: '[Security] Bạn cho agent dùng computer use (tự host môi trường) để thao tác một web app nội bộ. Môi trường chạy nào phù hợp nhất?',
  options: [
    'Máy làm việc của nhân viên, vì đã đăng nhập sẵn mọi hệ thống',
    'Một server production để thao tác trực tiếp cho nhanh',
    'Không cần cô lập, vì Claude tự nhận ra mọi prompt injection hiển thị trên màn hình',
    'Máy ảo hoặc container riêng với quyền tối thiểu, không chứa dữ liệu nhạy cảm không cần thiết; Anthropic còn chạy thêm classifier trên screenshot để phát hiện prompt injection'
  ],
  answer: 3,
  explain: `**Đúng: sandbox quyền tối thiểu.** Computer use là tool phía client: ứng dụng của bạn cung cấp môi trường và thực thi thao tác Claude yêu cầu. Docs yêu cầu môi trường sandbox như **máy ảo hoặc container riêng, quyền tối thiểu**. Nội dung trên màn hình (trang web, email, tài liệu) có thể chứa chỉ dẫn độc hại; Anthropic chạy thêm classifier trên những gì tool trả về (như screenshot) để phát hiện injection và nhắc Claude kiểm tra lại chỉ dẫn có thật sự từ bạn không. Nhưng đó là lớp bổ sung, không thay cho cô lập.

### Vì sao các phương án còn lại sai
- **Máy nhân viên đã đăng nhập:** một lần injection thành công là có mọi quyền của nhân viên đó.
- **Server production:** vi phạm least privilege, hậu quả lớn nhất khi sai.
- **Không cần cô lập:** không có model nào miễn nhiễm hoàn toàn với injection; cần phòng thủ nhiều lớp.`
},
{
  id: 'qz-claude-197',
  topic: 'claude',
  q: '[Security] Giữa phiên, harness cần ra chỉ dẫn "từ giờ không dùng tool refund nữa". Dev đang chèn câu đó vào text của message user. Cách tốt hơn trên model hỗ trợ (ví dụ Opus 5.5) là gì?',
  options: [
    'Dùng mid-conversation system message (role "system" trong messages): đây là kênh của operator, model coi là chỉ dẫn có thẩm quyền operator chứ không phải lời người dùng, và giữ được prompt cache',
    'Chèn câu đó vào tool_result gần nhất',
    'Viết lại system prompt top-level ở mỗi lượt',
    'Không cần gì; Claude tự biết khi nào không nên hoàn tiền'
  ],
  answer: 0,
  explain: `**Đúng: mid-conversation system message.** Chỉ dẫn của operator nên đi qua kênh operator. Trên các model hỗ trợ (Opus 5.5, Opus 5, Fable 5.1, Sonnet 5.5…, không cần beta header), append message {{role: "system"}} vào {{messages}}: model coi đây là chỉ dẫn có thẩm quyền operator, docs mô tả đây là kênh operator an toàn trước prompt injection, và prefix đã cache được giữ nguyên. Đặt chỉ dẫn trong text của user làm lẫn thẩm quyền: người dùng (hoặc nội dung do họ dán vào) có thể giả câu tương tự để vượt quyền.

> Với ràng buộc cứng như "không hoàn tiền", vẫn nên cưỡng chế ở harness: gỡ tool (ví dụ tool_removal, beta) hoặc từ chối thực thi.

### Vì sao các phương án còn lại sai
- **Trong tool_result:** nội dung tool bị coi là dữ liệu không tin cậy; docs khuyên không đặt chỉ dẫn của mình ở đó.
- **Viết lại system top-level:** đúng kênh nhưng làm mất cache toàn bộ phần sau.
- **Không cần gì:** model không thể biết một quy tắc vận hành mới nếu không được thông báo.`
},
{
  id: 'qz-claude-198',
  topic: 'claude',
  q: '[Claude Code] Bước CI chạy claude -p với --output-format json và --json-schema (schema có mảng functions), rồi dùng kết quả cho bước sau. Script nên đọc trường nào và cần lưu ý gì?',
  options: [
    'Đọc trường result rồi parse JSON trong đó; output luôn đúng schema',
    'Đọc trường structured_output; kiểm tra trường này có tồn tại không, vì nếu lần chạy kết thúc mà không có output hợp lệ (ví dụ Claude từ chối) thì sẽ không có structured_output',
    'Đọc stdout dạng text thuần; json chỉ dùng cho chế độ stream',
    'Phải dùng --output-format stream-json vì --json-schema chỉ áp dụng cho stream'
  ],
  answer: 1,
  explain: `**Đúng: structured_output, và kiểm tra trước khi dùng.** Với {{--output-format json}}, Claude Code trả JSON gồm kết quả và metadata (session ID, usage…). Thêm {{--json-schema}} thì output theo schema nằm ở trường {{structured_output}} (text thường nằm ở {{result}}). Docs lưu ý: nếu lần chạy kết thúc mà không có structured output hợp lệ, ví dụ Claude từ chối yêu cầu, response **không có** trường {{structured_output}}; script phải kiểm tra trước khi dùng (ví dụ {{jq '.structured_output'}} rồi kiểm null). Schema không hợp lệ thì claude thoát với lỗi "--json-schema is not a valid JSON Schema".

### Vì sao các phương án còn lại sai
- **Đọc result và tin luôn đúng:** dữ liệu theo schema không nằm ở result, và không có đảm bảo tuyệt đối.
- **Text thuần:** text là mặc định nhưng không có cấu trúc.
- **stream-json bắt buộc:** stream-json dùng cho streaming từng sự kiện; json schema dùng với {{--output-format json}}.`
},
{
  id: 'qz-claude-199',
  topic: 'claude',
  q: '[Claude Code] Hook PreToolUse (type command) cho Bash: nếu lệnh nằm trong danh sách an toàn thì script exit 0, team nghĩ như thế là "cho phép luôn". Người dùng vẫn bị hỏi quyền. Giải thích nào đúng?',
  options: [
    'Hook PreToolUse không chạy với tool Bash',
    'Exit 0 nghĩa là chặn lệnh',
    'Exit 0 chỉ là "không phản đối": tool call vẫn đi qua luồng permission bình thường. Muốn chặn thì exit 2 (stderr thành phản hồi cho Claude); muốn cho phép thì in JSON với permissionDecision "allow"',
    'Phải exit 1 mới là cho phép'
  ],
  answer: 2,
  explain: `**Đúng: exit 0 không phê duyệt.** Ý nghĩa exit code của hook command:
| Exit code | PreToolUse |
|---|---|
| 0 | không phản đối; lệnh vẫn qua luồng permission bình thường (có thể vẫn hỏi người dùng) |
| 2 | chặn; stderr được gửi làm phản hồi để Claude điều chỉnh |
| khác | thường là lỗi không chặn (non-blocking error), hành động vẫn tiếp tục |

Để tự động cho phép, hook in JSON có {{hookSpecificOutput}} với {{permissionDecision: "allow"}} (khi nhiều hook cùng khớp, quyết định deny thắng).

### Vì sao các phương án còn lại sai
- **Không chạy với Bash:** PreToolUse dùng matcher theo tên tool, Bash là trường hợp phổ biến nhất.
- **Exit 0 là chặn:** ngược lại; chặn là exit 2.
- **Exit 1 là cho phép:** exit code khác 0/2 được coi là lỗi không chặn, không phải phê duyệt.`
},
{
  id: 'qz-claude-200',
  topic: 'claude',
  q: '[Eval] Bạn viết tiêu chí thành công trước khi tối ưu prompt cho chatbot. Tiêu chí nào đạt chuẩn "cụ thể, đo được" theo docs?',
  options: [
    'Câu trả lời phải an toàn và hữu ích',
    'Model phải phân loại cảm xúc tốt',
    'Người dùng hài lòng hơn so với phiên bản cũ',
    'Dưới 0,1% output trong 10.000 lần chạy bị bộ lọc nội dung gắn cờ độc hại, và F1 phân loại cảm xúc tối thiểu 0,85 trên tập held-out 10.000 bài'
  ],
  answer: 3,
  explain: `**Đúng: tiêu chí có con số, tập dữ liệu và ngưỡng.** Docs yêu cầu tiêu chí thành công **Specific** (cụ thể), **Measurable** (đo được bằng số hoặc thang định tính nhất quán), **Achievable** (dựa trên benchmark, thử nghiệm trước) và **Relevant** (gắn với mục đích sản phẩm). Ví dụ chính docs đưa ra: "Safe outputs" là tiêu chí kém; "dưới 0,1% output trong 10.000 lần thử bị content filter gắn cờ" là tiêu chí tốt; "phân loại cảm xúc tốt" là kém, "F1 ≥ 0,85 trên tập held-out 10.000 bài" là tốt. Ngay cả chủ đề "mơ hồ" như an toàn cũng định lượng được.

### Vì sao các phương án còn lại sai
- **An toàn và hữu ích:** không có thước đo, không biết khi nào đạt.
- **Phân loại tốt:** đúng là ví dụ "Bad" trong docs.
- **Hài lòng hơn bản cũ:** có hướng so sánh nhưng thiếu chỉ số, cách đo và ngưỡng (ví dụ tỉ lệ hoàn thành tác vụ tăng 5% trong A/B test).`
},
);
