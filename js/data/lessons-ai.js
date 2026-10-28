(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-ai-001',
  track: 'ai',
  order: 1,
  title: 'AI Engineering Foundations: gọi LLM API, xử lý lỗi và đo chất lượng',
  level: 'senior',
  minutes: 45,
  goals: [
    'Giải thích được 3 thành phần cốt lõi của AI Engineering: prompt, API contract và measurement.',
    'Mô tả request/response của Chat Completions (OpenAI) và Messages API (Anthropic), gọi được bằng java.net.http.HttpClient.',
    'Phân loại lỗi HTTP từ provider và áp dụng retry có exponential backoff + cap, tôn trọng Retry-After.',
    'Tự tính precision@k, recall@k, MRR để đo chất lượng retrieval/gợi ý thay vì "thấy đúng".',
    'Nêu checklist đưa tính năng AI lên production: rate limit, retry, cache, logging, audit.',
  ],
  body: `**Tóm tắt:** AI Engineering không phải "viết prompt cho đẹp" mà là **lập trình hệ thống quanh một dịch vụ không tất định**: gửi request JSON đúng contract, xử lý lỗi và rate limit, kiểm tra output có cấu trúc, rồi **đo bằng số** để biết thay đổi prompt/model có làm hệ thống tốt lên hay không.

### 1. Ba thành phần cốt lõi
1. **Prompt**: đầu vào hội thoại gồm system prompt (vai trò, luật), các message {{user}}/{{assistant}} xen kẽ, và (tuỳ chọn) định nghĩa tools.
2. **API contract**: HTTP method, header xác thực, body JSON, timeout, mã lỗi, quota. Đây là phần dev Java quen thuộc nhất và cũng hay sai nhất.
3. **Measurement**: accuracy, precision@k, recall@k, tỉ lệ output sai schema, latency p95, chi phí theo token.

> Không bao giờ ghi API key, toàn bộ prompt hay transcript người dùng vào log. Log chỉ giữ method, endpoint, status, duration, model, số token và request id của provider.

### 2. Một cuộc gọi LLM trông như thế nào?
Hai kiểu API phổ biến nhất:

| | OpenAI Chat Completions | Anthropic Messages |
|---|---|---|
| Endpoint | {{POST /v1/chat/completions}} | {{POST /v1/messages}} |
| Xác thực | {{Authorization: Bearer <key>}} | {{x-api-key: <key>}} + {{anthropic-version: 2023-06-01}} |
| System prompt | message có {{role: "system"}} | field {{system}} ở top-level |
| Giới hạn output | {{max_tokens}} / {{max_completion_tokens}} (tuỳ chọn) | {{max_tokens}} (**bắt buộc**) |
| Nội dung trả về | {{choices[0].message.content}} | mảng {{content}} gồm các block, block text có {{type: "text"}} |
| Lý do dừng | {{finish_reason}} ({{stop}}, {{length}}, {{tool_calls}}) | {{stop_reason}} ({{end_turn}}, {{max_tokens}}, {{tool_use}}) |
| Đếm token | {{usage.prompt_tokens}} / {{completion_tokens}} | {{usage.input_tokens}} / {{output_tokens}} |

Gọi bằng JDK thuần (Java 11+), không cần SDK:

~~~java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5)).build();
String body = """
    {"model": "claude-sonnet-4-5", "max_tokens": 512,
     "system": "Bạn là interviewer Java senior.",
     "messages": [{"role": "user", "content": "Hỏi tôi 1 câu về HashMap"}]}
    """;
HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
        .timeout(Duration.ofSeconds(60))            // LLM chậm: timeout đọc dài hơn connect
        .header("x-api-key", System.getenv("ANTHROPIC_API_KEY")) // key từ env/secret manager
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() != 200) { /* phân loại lỗi, xem mục 3 */ }
// parse res.body() bằng Jackson; KHÔNG ghép chuỗi JSON bằng tay ở production
~~~

### 3. Lỗi và retry: phần quyết định độ ổn định
| Status | Ý nghĩa | Retry? |
|---|---|---|
| 400 / 404 / 422 | request sai (schema, model không tồn tại, prompt quá dài) | Không, sửa code |
| 401 / 403 | key sai hoặc không có quyền | Không, báo động |
| 429 | rate limit (request/phút hoặc token/phút) | Có, ưu tiên header {{retry-after}} |
| 500 / 502 / 503 / 504 | lỗi phía provider hoặc gateway | Có, backoff |
| 529 (Anthropic) | {{overloaded_error}}: hệ thống quá tải | Có, backoff |

Công thức backoff: {{delay = min(cap, base * 2^attempt)}}, cộng **jitter** ngẫu nhiên để hàng nghìn client không retry cùng một lúc (thundering herd). Luôn có **số lần thử tối đa**. Retry vô hạn với 4xx chỉ đốt quota và không bao giờ thành công.

**Structured output**: khi cần JSON, đừng tin "model sẽ trả JSON". Dùng tính năng của provider ({{response_format}} kiểu {{json_schema}} ở OpenAI, hoặc tool use với {{input_schema}} ở Anthropic), sau đó **vẫn validate** ở server. Parse thất bại thì coi là lỗi (ví dụ map ra 502 {{bad_json}}), có thể thử lại 1 lần, tuyệt đối không bịa ra JSON giả.

### 4. Measurement: đo bằng số, không bằng cảm giác
Với RAG hay gợi ý, hệ thống trả về danh sách xếp hạng. Cho {{relevant}} là tập tài liệu đúng:
- **precision@k** = số kết quả đúng trong top-k / k: trong k thứ đưa cho model, bao nhiêu thứ là có ích?
- **recall@k** = số tài liệu đúng nằm trong top-k / tổng số tài liệu đúng: có bỏ sót tài liệu quan trọng không?
- **MRR** (mean reciprocal rank): trung bình của 1/vị trí của kết quả đúng đầu tiên; đo "kết quả tốt có nằm sát đầu không".

Ví dụ: relevant = {a, b}, ranked = [a, c, b, d]. precision@2 = 1/2 = 0.5, recall@2 = 1/2 = 0.5, recall@3 = 2/2 = 1.0, reciprocal rank = 1/1 = 1.0.

| Metric | Trả lời câu hỏi | Bẫy |
|---|---|---|
| precision@k | context có nhiều rác không? | k lớn làm precision giảm dù recall tăng |
| recall@k | có bỏ sót tài liệu đúng không? | relevant rỗng phải quy ước rõ |
| MRR | kết quả đúng có lên đầu không? | chỉ xét kết quả đúng đầu tiên |

Chạy metric trên một **golden dataset** cố định (50–200 case) mỗi khi đổi prompt, model hay chunking, giống như regression test.

### 5. Checklist production
- **Rate limit** phía mình (theo user) trước khi chạm limit của provider.
- **Retry** có backoff + jitter + cap, chỉ cho 429/5xx/529.
- **Timeout** rõ ràng, dùng streaming khi output dài để UX không bị treo.
- **Cache** kết quả cho input giống hệt nhau; dùng prompt caching của provider cho system prompt dài.
- **Logging/audit**: request id, model, token, latency, cost; không log secret/PII.
- **Abstraction**: đặt client sau interface {{AiClient}} để unit test dùng fake, không gọi network thật.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Bạn tích hợp LLM vào service Java thế nào cho ổn định?". Câu trả lời tốt nêu đủ: contract và timeout, phân loại lỗi (không retry 4xx), backoff có jitter và cap, validate structured output, đo chất lượng bằng golden dataset với precision/recall, và không log dữ liệu nhạy cảm.

> Senior tip: hãy luôn ghi {{usage}} token của từng request vào metrics. Chi phí LLM tăng theo token, và một prompt "lỡ" nhồi thêm 20 KB context có thể làm hoá đơn tháng tăng gấp nhiều lần mà không ai nhận ra nếu không có dashboard.`,
  exercises: [
    {
      title: 'Phân loại lỗi HTTP và tính backoff cho AI client',
      prompt: `Viết class {{AiErrorHandler}} với 3 method static:

1. {{classify(int status)}} trả về chuỗi:
  - {{"OK"}} cho 200–299
  - {{"AUTH"}} cho 401, 403
  - {{"RATE_LIMIT"}} cho 429
  - {{"SERVER"}} cho mọi status ≥ 500 (bao gồm 529 overloaded)
  - {{"BAD_REQUEST"}} cho mọi 4xx còn lại
2. {{retryable(int status)}}: true chỉ khi {{classify}} là {{RATE_LIMIT}} hoặc {{SERVER}}.
3. {{delayMillis(int attempt, long baseMs, long capMs, String retryAfter)}} (attempt bắt đầu từ 0):
  - nếu {{retryAfter}} khác null và là số nguyên giây hợp lệ ≥ 0 thì trả về {{min(capMs, giây * 1000)}};
  - ngược lại trả về {{min(capMs, baseMs * 2^attempt)}}, **không được tràn số** khi attempt lớn (ví dụ 70).

Không dùng jitter trong bài này để test xác định.`,
      starter: `class AiErrorHandler {
    static String classify(int status) {
        throw new UnsupportedOperationException("TODO");
    }

    static boolean retryable(int status) {
        throw new UnsupportedOperationException("TODO");
    }

    static long delayMillis(int attempt, long baseMs, long capMs, String retryAfter) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("classify success", () -> { eq("OK", AiErrorHandler.classify(200)); eq("OK", AiErrorHandler.classify(204)); });
        check("classify auth", () -> { eq("AUTH", AiErrorHandler.classify(401)); eq("AUTH", AiErrorHandler.classify(403)); });
        check("classify rate limit", () -> eq("RATE_LIMIT", AiErrorHandler.classify(429)));
        check("classify bad request", () -> { eq("BAD_REQUEST", AiErrorHandler.classify(400)); eq("BAD_REQUEST", AiErrorHandler.classify(404)); eq("BAD_REQUEST", AiErrorHandler.classify(422)); });
        check("classify server incl 529", () -> { eq("SERVER", AiErrorHandler.classify(500)); eq("SERVER", AiErrorHandler.classify(503)); eq("SERVER", AiErrorHandler.classify(529)); });
        check("retryable only 429 and 5xx", () -> {
            eq(true, AiErrorHandler.retryable(429)); eq(true, AiErrorHandler.retryable(502)); eq(true, AiErrorHandler.retryable(529));
            eq(false, AiErrorHandler.retryable(400)); eq(false, AiErrorHandler.retryable(401)); eq(false, AiErrorHandler.retryable(200));
        });
        check("exponential backoff", () -> {
            eq(500L, AiErrorHandler.delayMillis(0, 500, 30_000, null));
            eq(1000L, AiErrorHandler.delayMillis(1, 500, 30_000, null));
            eq(4000L, AiErrorHandler.delayMillis(3, 500, 30_000, null));
        });
        check("backoff capped", () -> eq(30_000L, AiErrorHandler.delayMillis(10, 500, 30_000, null)));
        check("no overflow for large attempt", () -> eq(30_000L, AiErrorHandler.delayMillis(70, 500, 30_000, null)));
        check("retry-after respected", () -> {
            eq(7000L, AiErrorHandler.delayMillis(0, 500, 30_000, "7"));
            eq(30_000L, AiErrorHandler.delayMillis(0, 500, 30_000, "120"));
        });
        check("invalid retry-after falls back", () -> {
            eq(2000L, AiErrorHandler.delayMillis(2, 500, 30_000, "abc"));
            eq(2000L, AiErrorHandler.delayMillis(2, 500, 30_000, "-5"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class AiErrorHandler {
    static String classify(int status) {
        if (status >= 200 && status < 300) return "OK";
        if (status == 401 || status == 403) return "AUTH";
        if (status == 429) return "RATE_LIMIT";
        if (status >= 500) return "SERVER";          // 500, 502, 503, 504, 529...
        return "BAD_REQUEST";                         // 4xx còn lại: lỗi phía client
    }

    static boolean retryable(int status) {
        String c = classify(status);
        return c.equals("RATE_LIMIT") || c.equals("SERVER");
    }

    static long delayMillis(int attempt, long baseMs, long capMs, String retryAfter) {
        if (retryAfter != null) {
            try {
                long sec = Long.parseLong(retryAfter.trim());
                if (sec >= 0) return Math.min(capMs, sec * 1000);
            } catch (NumberFormatException ignored) { }
        }
        long delay = baseMs;
        for (int i = 0; i < attempt && delay < capMs; i++) delay *= 2;  // dừng nhân khi đã chạm cap: không tràn số
        return Math.min(capMs, delay);
    }
}`,
      hints: [
        'Xét các khoảng status theo thứ tự: 2xx, 401/403, 429, >= 500, còn lại là BAD_REQUEST.',
        'Dùng Long.parseLong trong try/catch cho retryAfter; giá trị âm hoặc không phải số thì bỏ qua.',
        'baseMs << attempt sẽ tràn khi attempt lớn: hãy nhân đôi trong vòng lặp và dừng sớm khi đã vượt cap.',
      ],
      explain: `### Lời giải
- {{classify}} gom status thành vài nhóm mà code nghiệp vụ hiểu được. Thứ tự kiểm tra quan trọng: 429 phải được bắt **trước** nhánh "4xx còn lại".
- {{retryable}} chỉ trả true cho lỗi tạm thời. Retry 400/401 vô ích: request sai thì gửi lại vẫn sai, chỉ đốt quota.
- {{delayMillis}} ưu tiên {{retry-after}} vì provider biết chính xác khi nào quota hồi lại. Không có header thì dùng exponential backoff.

### Lỗi hay gặp
- Viết {{baseMs * (1L << attempt)}}: với attempt = 70, phép shift chỉ lấy 6 bit thấp (70 mod 64 = 6) nên ra giá trị nhỏ sai, còn {{Math.pow}} rồi ép kiểu thì mất chính xác. Vòng lặp dừng ở cap an toàn hơn.
- Quên cap: retry lần thứ 15 chờ hàng giờ.
- Header {{retry-after}} theo chuẩn HTTP cũng có thể là một ngày giờ (HTTP-date); bài này chỉ xử lý dạng số giây, ở production nên xử lý cả hai.

> Senior tip: ở production cộng thêm full jitter ({{random(0, delay)}}) và giới hạn tổng thời gian retry theo deadline của request gốc. Nếu API của bạn có timeout 30 giây thì không được retry đến giây thứ 45.`,
    },
    {
      title: 'Đo chất lượng retrieval: precision@k, recall@k, reciprocal rank',
      prompt: `Một hệ thống RAG trả về danh sách tài liệu đã xếp hạng {{ranked}} (phần tử đầu là tốt nhất). Bạn có tập tài liệu đúng {{relevant}}. Viết class {{RetrievalMetrics}} với 3 method static:

1. {{precisionAtK(List<String> ranked, Set<String> relevant, int k)}}: số tài liệu **khác nhau** trong top-k thuộc {{relevant}}, chia cho {{k}}. Nếu {{k <= 0}} trả về 0.0.
2. {{recallAtK(...)}}: số tài liệu đúng **khác nhau** nằm trong top-k chia cho {{relevant.size()}}. Nếu {{relevant}} rỗng trả về 0.0.
3. {{reciprocalRank(List<String> ranked, Set<String> relevant)}}: {{1.0 / vị trí}} (bắt đầu từ 1) của phần tử đúng đầu tiên; không có thì 0.0.

Top-k nghĩa là {{min(k, ranked.size())}} phần tử đầu. Một tài liệu xuất hiện lặp lại trong ranked chỉ được tính một lần.`,
      starter: `class RetrievalMetrics {
    static double precisionAtK(List<String> ranked, Set<String> relevant, int k) {
        throw new UnsupportedOperationException("TODO");
    }

    static double recallAtK(List<String> ranked, Set<String> relevant, int k) {
        throw new UnsupportedOperationException("TODO");
    }

    static double reciprocalRank(List<String> ranked, Set<String> relevant) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void near(double expected, double actual) {
        if (Math.abs(expected - actual) > 1e-9) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        List<String> ranked = List.of("a", "c", "b", "d");
        Set<String> rel = Set.of("a", "b");
        check("precision@2", () -> near(0.5, RetrievalMetrics.precisionAtK(ranked, rel, 2)));
        check("precision@4", () -> near(0.5, RetrievalMetrics.precisionAtK(ranked, rel, 4)));
        check("precision divides by k when list is short", () -> near(0.25, RetrievalMetrics.precisionAtK(List.of("a"), rel, 4)));
        check("precision k<=0", () -> near(0.0, RetrievalMetrics.precisionAtK(ranked, rel, 0)));
        check("recall@1 and @3", () -> {
            near(0.5, RetrievalMetrics.recallAtK(ranked, rel, 1));
            near(1.0, RetrievalMetrics.recallAtK(ranked, rel, 3));
        });
        check("recall k larger than list", () -> near(1.0, RetrievalMetrics.recallAtK(ranked, rel, 10)));
        check("recall empty relevant", () -> near(0.0, RetrievalMetrics.recallAtK(ranked, Set.of(), 3)));
        check("duplicates counted once", () -> {
            List<String> dup = List.of("a", "a", "a", "x");
            near(1.0 / 3, RetrievalMetrics.precisionAtK(dup, rel, 3));
            near(0.5, RetrievalMetrics.recallAtK(dup, rel, 3));
        });
        check("reciprocal rank", () -> {
            near(1.0, RetrievalMetrics.reciprocalRank(ranked, rel));
            near(1.0 / 3, RetrievalMetrics.reciprocalRank(List.of("x", "y", "b"), rel));
            near(0.0, RetrievalMetrics.reciprocalRank(List.of("x", "y"), rel));
            near(0.0, RetrievalMetrics.reciprocalRank(List.of(), rel));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class RetrievalMetrics {
    // các tài liệu đúng KHÁC NHAU nằm trong top-k
    private static int hits(List<String> ranked, Set<String> relevant, int k) {
        Set<String> found = new HashSet<>();
        int top = Math.min(k, ranked.size());
        for (int i = 0; i < top; i++) {
            String doc = ranked.get(i);
            if (relevant.contains(doc)) found.add(doc);   // Set bỏ trùng lặp
        }
        return found.size();
    }

    static double precisionAtK(List<String> ranked, Set<String> relevant, int k) {
        if (k <= 0) return 0.0;
        return (double) hits(ranked, relevant, k) / k;   // chia cho k, không phải ranked.size()
    }

    static double recallAtK(List<String> ranked, Set<String> relevant, int k) {
        if (relevant.isEmpty() || k <= 0) return 0.0;
        return (double) hits(ranked, relevant, k) / relevant.size();
    }

    static double reciprocalRank(List<String> ranked, Set<String> relevant) {
        for (int i = 0; i < ranked.size(); i++) {
            if (relevant.contains(ranked.get(i))) return 1.0 / (i + 1);   // vị trí tính từ 1
        }
        return 0.0;
    }
}`,
      hints: [
        'Viết một helper đếm số tài liệu đúng khác nhau trong min(k, ranked.size()) phần tử đầu, dùng HashSet để bỏ trùng.',
        'precision chia cho k, recall chia cho relevant.size(); nhớ ép kiểu sang double trước khi chia.',
        'reciprocalRank: dừng ở phần tử đúng đầu tiên, vị trí tính từ 1 nên là 1.0 / (i + 1).',
      ],
      explain: `### Lời giải
- Cả precision và recall dùng chung một tử số: số tài liệu đúng khác nhau trong top-k. Chỉ mẫu số khác nhau: precision chia cho {{k}}, recall chia cho {{relevant.size()}}.
- Chia cho {{k}} (không phải cho số phần tử thực tế) là quy ước phổ biến: hệ thống trả về ít hơn k kết quả vẫn bị "phạt" vì đã hứa k chỗ.
- MRR của cả dataset là trung bình {{reciprocalRank}} trên mọi câu truy vấn.

### Lỗi hay gặp
- Phép chia số nguyên: {{1 / 2}} bằng 0 trong Java. Phải ép {{(double)}}.
- Đếm trùng: retriever trả cùng một chunk 2 lần thì precision bị thổi phồng; ở production nên dedupe trước khi đưa vào prompt.
- Vị trí bắt đầu từ 0 làm {{1.0 / 0}} ra Infinity.

> Senior tip: khi tuning RAG, vẽ recall@k theo k (k = 1, 3, 5, 10, 20). Nếu recall@20 vẫn thấp thì vấn đề nằm ở chunking/embedding, tăng k hay thêm re-ranker cũng không cứu được. Nếu recall@20 cao mà recall@5 thấp thì một re-ranker sẽ đáng tiền.`,
    },
  ],
  check: [
    {
      q: 'Khi gọi Anthropic Messages API ({{POST /v1/messages}}), điều nào sau đây là **đúng**?',
      options: [
        'Xác thực bằng header {{x-api-key}}, kèm {{anthropic-version}}; {{max_tokens}} là bắt buộc.',
        'Xác thực bằng {{Authorization: Bearer}} và system prompt là một message có role "system".',
        'Nội dung trả về nằm ở {{choices[0].message.content}}.',
        'Không cần {{max_tokens}} vì model tự dừng khi trả lời xong.',
      ],
      answer: 0,
      explain: `Messages API dùng {{x-api-key}} + {{anthropic-version}}, system prompt là field {{system}} ở top-level và {{max_tokens}} bắt buộc. {{Authorization: Bearer}}, role "system" và {{choices[0].message.content}} là đặc điểm của OpenAI Chat Completions, nên phương án 2 và 3 sai. Phương án 4 sai vì thiếu {{max_tokens}} thì request bị từ chối với lỗi 400.`,
    },
    {
      q: 'relevant = {a, b}, ranked = [a, c, b, d]. precision@2 và recall@3 lần lượt là?',
      options: ['1.0 và 0.5', '0.5 và 1.0', '0.5 và 0.5', '0.25 và 1.0'],
      answer: 1,
      explain: `Top-2 = [a, c]: chỉ a đúng nên precision@2 = 1/2 = 0.5. Top-3 = [a, c, b] chứa cả a và b nên recall@3 = 2/2 = 1.0. "1.0 và 0.5" đảo ngược hai metric; "0.5 và 0.5" là recall@2 chứ không phải recall@3; 0.25 là chia cho 4 (độ dài cả danh sách) thay vì k = 2.`,
    },
    {
      q: 'AI client nhận lần lượt các status sau. Status nào **nên** retry với backoff?',
      options: [
        '400 Bad Request vì prompt vượt context window',
        '401 Unauthorized',
        '422 Unprocessable Entity do JSON schema sai',
        '429 Too Many Requests có header retry-after',
      ],
      answer: 3,
      explain: `429 là lỗi tạm thời: chờ theo {{retry-after}} rồi gửi lại sẽ thành công. 400 vì prompt quá dài gửi lại vẫn quá dài, cần cắt bớt context. 401 là key sai hoặc bị thu hồi: retry chỉ tạo thêm request lỗi, cần báo động. 422 do schema sai phải sửa request.`,
    },
    {
      q: 'Model đôi khi trả về JSON không parse được dù bạn đã yêu cầu output JSON. Cách xử lý nào phù hợp nhất ở server?',
      options: [
        'Trả về một JSON mặc định có điểm 3/5 để UI không lỗi.',
        'Retry vô hạn cho đến khi parse được.',
        'Dùng structured output/tool schema của provider, validate ở server; parse lỗi thì retry giới hạn rồi trả lỗi rõ ràng.',
        'Ghi toàn bộ prompt và response vào log để audit rồi bỏ qua.',
      ],
      answer: 2,
      explain: `Ràng buộc schema từ phía provider giảm tỉ lệ lỗi, validate ở server bắt phần còn lại, và lỗi thì trả mã rõ ràng (ví dụ 502 {{bad_json}}). Trả JSON giả là bịa kết quả cho người dùng. Retry vô hạn đốt tiền và có thể treo request. Log toàn bộ prompt/response vi phạm nguyên tắc không lưu dữ liệu nhạy cảm và cũng không giải quyết lỗi.`,
    },
  ],
  related: ['ai-001', 'ai-002', 'ai-004', 'ai-006', 'ai-007', 'ai-008'],
  tags: ['ai', 'llm', 'http-client', 'retry', 'backoff', 'evaluation', 'rag', 'precision-at-k'],
}
);
