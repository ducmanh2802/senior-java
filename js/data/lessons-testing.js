/* Bài học track "testing". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-testing-001',
  track: 'testing',
  order: 1,
  title: 'Test double: fake, stub và mock — chọn cái nào thay vì mock mọi thứ',
  level: 'mid',
  minutes: 25,
  goals: [
    'Phân biệt được dummy, stub, spy, mock và fake, cùng hai kiểu kiểm chứng state và interaction',
    'Tự viết được một fake repository và một spy đếm lời gọi bằng Java thuần, không cần Mockito',
    'Nhận ra mùi over-mocking và biết khi nào nên thay mock bằng fake hoặc test tích hợp',
  ],
  body: `**Tóm tắt:** Test double gồm năm loại — dummy, stub, spy, mock, fake — khác nhau ở mục đích: stub trả lời câu hỏi, mock kiểm tra hành vi, fake thay cả một cài đặt. Có hai cách khẳng định một test: state verification (kiểm tra trạng thái cuối) và interaction verification (kiểm tra service đã gọi collaborator đúng cách). Bài học này giúp bạn chọn đúng loại double để test không cản trở refactor.

### Vì sao cần test double
Một unit test tốt chỉ muốn kiểm tra **một** đơn vị logic. Nhưng đơn vị đó thường gọi ra ngoài: database, HTTP, hàng đợi, đồng hồ hệ thống. Nếu test thật sự gọi Postgres hay API ngân hàng thì test sẽ chậm, flaky và không chạy được trên máy không có hạ tầng. **Test double** là object thay thế cho collaborator thật, được tạo riêng cho mục đích kiểm thử.

Gerard Meszaros và Martin Fowler phân biệt năm loại, khác nhau ở **mục đích** chứ không phải ở cách viết:

| Loại | Nhiệm vụ | Ví dụ |
|---|---|---|
| Dummy | Chỉ để lấp tham số, không bao giờ được gọi | Truyền {{null}} cho một logger không dùng |
| Stub | Trả về dữ liệu định trước cho lời gọi | Repository luôn trả tài khoản có số dư 1.000 |
| Spy | Ghi lại lời gọi để test kiểm tra sau | Đếm số lần gửi email, lưu tham số |
| Mock | Đối tượng mà test **đặt kỳ vọng** tương tác lên | Kỳ vọng {{send}} được gọi đúng một lần |
| Fake | Cài đặt thật nhưng đơn giản hơn | Repository lưu trong {{HashMap}} |

Ranh giới giữa spy và mock khá mờ: Mockito gọi tất cả là mock, còn "verify" chính là kiểm chứng interaction. Điểm cần nhớ: **stub trả lời câu hỏi, mock kiểm tra hành vi, fake thay thế cả một cài đặt**.

### State verification và interaction verification
Có hai cách khẳng định một test:

- **State verification**: chạy xong, nhìn vào trạng thái cuối cùng. Ví dụ sau khi chuyển 200, số dư hai tài khoản phải là 800 và 700. Cách này bền vững vì nó không quan tâm service gọi repository mấy lần, miễn kết quả đúng.
- **Interaction verification**: khẳng định service đã gọi collaborator đúng cách. Ví dụ phải gọi {{notifier.transferCompleted("ACC-2", 200)}} đúng một lần. Cách này cần thiết khi tác dụng phụ **không quan sát được** qua state, như gửi email, publish event, gọi cổng thanh toán.

Sai lầm phổ biến là dùng interaction verification cho mọi thứ. Khi đó test biết quá nhiều về **cách** service làm việc. Bạn đổi từ hai lần {{save}} thành một lần {{saveAll}} — hành vi nghiệp vụ không đổi nhưng hàng chục test đỏ. Đây là **over-specification**, nguyên nhân số một khiến test cản trở refactor.

### Fake repository: thay cả một cài đặt
Fake không phải "trả dữ liệu giả" đơn thuần. Nó cài đặt **cùng interface** với cài đặt thật, nhưng bằng cấu trúc dữ liệu đơn giản, và cố gắng giữ đúng ngữ nghĩa quan trọng:

~~~java
interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        return Optional.ofNullable(accounts.get(id));   // đúng ngữ nghĩa "không có"
    }

    @Override public void save(Account account) {
        accounts.put(account.id(), account);            // save là upsert, giống JPA merge
    }
}
~~~

Vì fake lưu thật trong bộ nhớ, bạn test được **cả chuỗi** đọc-sửa-ghi: gieo hai tài khoản, gọi chuyển tiền, rồi đọc lại số dư. Test không cần biết service gọi {{find}} hay {{save}} bao nhiêu lần, nên refactor bên trong service không làm test đỏ. Fake đặc biệt hợp với repository, gateway, cache, clock — những collaborator có hành vi **có trạng thái**.

Cái giá: fake là **code phải bảo trì**. Nếu fake xử lý khác thật (ví dụ {{save}} ghi đè trong khi database có ràng buộc unique) thì test xanh mà production đỏ. Giữ fake nhỏ, chỉ mô phỏng hành vi mà test thật sự dựa vào, và đừng dùng fake để thay thế integration test cho SQL phức tạp.

### Stub: chỉ cần một câu trả lời
Stub dùng khi test cần collaborator trả về một giá trị cụ thể, không quan tâm nó bị gọi thế nào:

~~~java
class FixedRateGateway implements RateGateway {
    private final BigDecimal rate;
    FixedRateGateway(String rate) { this.rate = new BigDecimal(rate); }
    @Override public BigDecimal rateFor(String currency) { return rate; }  // luôn 25.100
}
~~~

Với Mockito, stub viết bằng {{when(gateway.rateFor("USD")).thenReturn(new BigDecimal("25100"))}}. Stub rất rẻ và không cần verify. Nhưng nếu bạn stub quá nhiều method để "chạy được", đó là dấu hiệu object đang phụ thuộc quá nhiều thứ.

### Spy: ghi lại để kiểm tra sau
Khi tác dụng phụ không nhìn thấy được qua state, hãy dùng spy hoặc mock để kiểm tra interaction. Một spy viết tay rất đơn giản:

~~~java
class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        calls.add(accountId + ":" + amount);          // ghi lại đúng tham số
    }

    List<String> calls() { return calls; }            // test đọc sau khi chạy
}
~~~

Sau đó test khẳng định {{calls.size() == 1}} và {{calls.get(0).equals("ACC-2:200")}}. Đây là interaction verification nhưng **không phụ thuộc thư viện**, dễ đọc và dễ debug hơn {{verify(notifier).transferCompleted(...)}} khi tham số phức tạp.

Đừng lạm dụng: chỉ verify những tương tác **là hợp đồng nghiệp vụ**. "Phải gửi đúng một thông báo cho người nhận" là hợp đồng. "Phải gọi {{find}} trước {{save}}" thường chỉ là chi tiết cài đặt.

### Khi nào dùng cái nào
| Tình huống | Nên dùng | Lý do |
|---|---|---|
| Repository, cache, gateway có trạng thái | Fake | Test được cả luồng đọc-ghi, không khoá vào số lời gọi |
| Collaborator chỉ cấp dữ liệu vào | Stub | Một giá trị cố định là đủ |
| Gửi email, publish event, gọi thanh toán | Mock hoặc spy | Tác dụng phụ không quan sát được qua state |
| Value object, DTO, record | Không double | Tạo object thật rẻ hơn và đúng hơn |
| SQL, transaction, serialization | Test tích hợp | Double sẽ che mất lỗi thật của hạ tầng |

Một quy tắc thực dụng: **mock ở biên của hệ thống, fake ở biên của tầng, còn logic thuần thì không cần double nào**. Nếu một class cần mock 6 dependency, vấn đề không nằm ở test mà ở thiết kế class đang ôm quá nhiều trách nhiệm.

### Bẫy production hay gặp
- **Mock trả giá trị "rỗng" theo mặc định**: method chưa stub trên mock Mockito trả {{null}} cho object thường, 0/false cho kiểu nguyên thuỷ, collection rỗng và {{Optional.empty()}} — nên test có thể "xanh" vì đi nhầm nhánh "không tìm thấy", hoặc đỏ vì {{NullPointerException}} khó hiểu. Dùng {{@ExtendWith(MockitoExtension.class)}}: chế độ strict stubs mặc định báo {{UnnecessaryStubbingException}} khi có stub không được dùng tới, giúp phát hiện stub sai tham số.
- **Verify quá chặt**: {{verify(repo, times(2)).save(any())}} làm test đỏ khi refactor sang {{saveAll}}. Ưu tiên state verification khi có thể.
- **Fake lệch thật**: fake cho phép hai bản ghi trùng key trong khi database có unique constraint. Test xanh, production lỗi. Những ràng buộc quan trọng phải được test ở tầng tích hợp.
- **Chia sẻ fake có trạng thái giữa các test**: dữ liệu rò rỉ làm test phụ thuộc thứ tự. Tạo fake mới trong mỗi test hoặc có hàm {{clear()}} gọi ở {{@BeforeEach}}.
- **Mock value object và kiểu JDK**: đừng mock {{List}}, {{BigDecimal}}, {{LocalDate}} hay DTO của bạn — tạo object thật vừa rẻ vừa đúng hơn. Tương tự nguyên tắc "don't mock what you don't own": thay vì mock trực tiếp client của thư viện bên thứ ba (AWS SDK, RestTemplate), hãy bọc nó sau một interface của mình rồi mock/fake interface đó, còn client thật thì test tích hợp (WireMock, Testcontainers).

> Senior tip: khi review test, hãy hỏi "nếu ngày mai tôi đổi cách cài đặt bên trong service, test này có đỏ không?". Nếu có mà hành vi nghiệp vụ không đổi, test đang kiểm tra implementation chứ không kiểm tra hợp đồng. Đội trưởng giỏi thường giữ tỉ lệ verify interaction rất thấp, chỉ ở những biên như thanh toán, thông báo và event.

### Ví dụ đời thực: service chuyển tiền và 23 test đỏ
Một team đang maintain {{TransferService}}. Ban đầu mọi test đều dùng Mockito: mock repository, mock notifier. Khi team refactor bên trong service — đổi từ hai lần {{save}} thành một lần {{saveAll}} để giảm round-trip database — **23 test đỏ** dù hành vi nghiệp vụ không đổi: số dư cuối cùng hai tài khoản vẫn đúng 800 và 700. Đội mất hai ngày phân loại: test nào kiểm tra kết quả (dùng fake), test nào kiểm tra số lần gọi (over-specification). Sau khi thay {{FakeAccountRepository}}, 23 test đỏ giảm còn 3 — chỉ những test kiểm tra interaction thực sự (gửi đúng một thông báo cho người nhận) còn đỏ. Kết quả: CI từ 12 phút xuống 4 phút và refactor không còn bị test cản trở.

### Trả lời mẫu khi phỏng vấn
"Khi interviewer hỏi 'phân biệt stub và mock', tôi sẽ nói: stub là người trả lời câu hỏi, mock là người kiểm tra hành vi. Stub chỉ cung cấp dữ liệu định trước — ví dụ repository luôn trả tài khoản có số dư 1.000 — mà không quan tâm nó được gọi thế nào. Mock đặt kỳ vọng về tương tác: {{verify(notifier).transferCompleted('ACC-2', 200)}} khẳng định đúng một lần gọi với đúng tham số. Fake là thứ thay cả một cài đặt: implement cùng interface bằng cấu trúc dữ liệu đơn giản, ví dụ HashMap, và giữ đúng ngữ nghĩa đọc-sau-ghi. Tôi chọn fake cho repository vì nó cho phép test cả chuỗi đọc-sửa-ghi mà không khóa vào số lần gọi method, nên refactor bên trong service không làm test đỏ. Mock chỉ dùng cho tác dụng phụ không quan sát được qua state, như gửi email hoặc publish event. Quy tắc thực dụng: mock ở biên của hệ thống, fake ở biên của tầng, logic thuần thì không cần double nào."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Phân biệt stub và mock", "fake khác mock ở đâu", "vì sao mock quá nhiều là code smell", và đưa một class có 5 dependency rồi hỏi bạn test thế nào. Câu trả lời tốt không phải là liệt kê định nghĩa mà là nói rõ **bạn đang kiểm chứng state hay interaction**, và vì sao chọn cách đó. Bài tập dưới đây bắt bạn tự viết fake và spy để thấy rõ khác biệt thay vì học thuộc.`,
  exercises: [
    {
      title: 'Tự viết fake repository và spy notifier cho luồng chuyển tiền',
      prompt: `Cho sẵn interface {{AccountRepository}}, {{Notifier}}, class {{Account}} và {{TransferService}}. Hãy hoàn thiện hai test double:

- {{FakeAccountRepository}}: lưu account trong {{HashMap}} theo {{id}}. {{find(id)}} trả {{Optional.empty()}} nếu chưa có, ngược lại trả account đã lưu. {{save(account)}} là **upsert** (cùng id thì ghi đè).
- {{RecordingNotifier}}: mỗi lần {{transferCompleted(accountId, amount)}} được gọi thì thêm chuỗi {{accountId + ":" + amount}} vào danh sách; {{calls()}} trả danh sách đó để test kiểm tra.

Không cần Mockito. Chú ý: fake phải giữ đúng ngữ nghĩa đọc-sau-ghi, vì {{TransferService}} đọc số dư rồi ghi lại.`,
      starter: `interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

interface Notifier {
    void transferCompleted(String accountId, long amount);
}

final class Account {
    private final String id;
    private final String owner;
    private final long balance;

    Account(String id, String owner, long balance) {
        this.id = id;
        this.owner = owner;
        this.balance = balance;
    }

    String id() { return id; }
    String owner() { return owner; }
    long balance() { return balance; }
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public void save(Account account) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() { return accounts.size(); }
}

class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String> calls() { return calls; }
}

class TransferService {
    private final AccountRepository repo;
    private final Notifier notifier;

    TransferService(AccountRepository repo, Notifier notifier) {
        this.repo = repo;
        this.notifier = notifier;
    }

    void transfer(String fromId, String toId, long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        Account from = repo.find(fromId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + fromId));
        Account to = repo.find(toId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + toId));
        if (from.balance() < amount) throw new IllegalStateException("insufficient funds");
        repo.save(new Account(from.id(), from.owner(), from.balance() - amount));
        repo.save(new Account(to.id(), to.owner(), to.balance() + amount));
        notifier.transferCompleted(to.id(), amount);
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
    static void throwsType(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("mong đợi " + type.getSimpleName() + " nhưng nhận " + t.getClass().getSimpleName());
        }
        throw new AssertionError("mong đợi " + type.getSimpleName() + " nhưng không ném gì");
    }
    static FakeAccountRepository seeded() {
        FakeAccountRepository repo = new FakeAccountRepository();
        repo.save(new Account("ACC-1", "An", 1_000));
        repo.save(new Account("ACC-2", "Binh", 500));
        return repo;
    }
    public static void main(String[] args) {
        check("fake stores and finds an account", () -> {
            FakeAccountRepository repo = seeded();
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
            eq(Optional.empty(), repo.find("missing"));
            eq(2, repo.size());
        });
        check("fake save replaces the account with the same id", () -> {
            FakeAccountRepository repo = seeded();
            repo.save(new Account("ACC-1", "An", 999));
            eq(999L, repo.find("ACC-1").orElseThrow().balance());
            eq(2, repo.size());
        });
        check("transfer moves money and keeps both balances", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            new TransferService(repo, notifier).transfer("ACC-1", "ACC-2", 200);
            eq(800L, repo.find("ACC-1").orElseThrow().balance());
            eq(700L, repo.find("ACC-2").orElseThrow().balance());
        });
        check("spy records exactly one notification with receiver and amount", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            new TransferService(repo, notifier).transfer("ACC-1", "ACC-2", 200);
            eq(1, notifier.calls().size());
            eq("ACC-2:200", notifier.calls().get(0));
        });
        check("insufficient funds: no save, no notification", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            TransferService service = new TransferService(repo, notifier);
            throwsType(IllegalStateException.class, () -> service.transfer("ACC-2", "ACC-1", 10_000));
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
            eq(500L, repo.find("ACC-2").orElseThrow().balance());
            eq(0, notifier.calls().size());
        });
        check("unknown receiver: no notification; amount must be positive", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            TransferService service = new TransferService(repo, notifier);
            throwsType(IllegalArgumentException.class, () -> service.transfer("ACC-1", "ghost", 10));
            throwsType(IllegalArgumentException.class, () -> service.transfer("ACC-1", "ACC-2", 0));
            eq(0, notifier.calls().size());
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

interface Notifier {
    void transferCompleted(String accountId, long amount);
}

final class Account {
    private final String id;
    private final String owner;
    private final long balance;

    Account(String id, String owner, long balance) {
        this.id = id;
        this.owner = owner;
        this.balance = balance;
    }

    String id() { return id; }
    String owner() { return owner; }
    long balance() { return balance; }
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        return Optional.ofNullable(accounts.get(id));
    }

    @Override public void save(Account account) {
        accounts.put(account.id(), account);
    }

    int size() { return accounts.size(); }
}

class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        calls.add(accountId + ":" + amount);
    }

    List<String> calls() { return calls; }
}

class TransferService {
    private final AccountRepository repo;
    private final Notifier notifier;

    TransferService(AccountRepository repo, Notifier notifier) {
        this.repo = repo;
        this.notifier = notifier;
    }

    void transfer(String fromId, String toId, long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        Account from = repo.find(fromId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + fromId));
        Account to = repo.find(toId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + toId));
        if (from.balance() < amount) throw new IllegalStateException("insufficient funds");
        repo.save(new Account(from.id(), from.owner(), from.balance() - amount));
        repo.save(new Account(to.id(), to.owner(), to.balance() + amount));
        notifier.transferCompleted(to.id(), amount);
    }
}`,
      hints: [
        'Fake repository: {{find}} dùng {{Optional.ofNullable(accounts.get(id))}}, {{save}} dùng {{accounts.put(account.id(), account)}}.',
        'Spy chỉ cần một {{ArrayList}}; trong {{transferCompleted}} thêm {{accountId + ":" + amount}}. Test đọc {{calls()}} sau khi service chạy xong.',
        'Chú ý thứ tự: service kiểm tra số dư **trước khi** save, nên trường hợp lỗi không được ghi hay thông báo gì.',
      ],
      explain: `Điểm chính của bài này là **state verification** và **interaction verification** cùng tồn tại trong một test:

- Fake repository cho phép nhìn trạng thái cuối (số dư hai tài khoản) mà không quan tâm service gọi {{find}}/{{save}} mấy lần. Đây là cách bền vững khi refactor.
- Spy notifier kiểm tra đúng một tương tác không quan sát được qua state: thông báo cho người nhận với đúng số tiền.

Lỗi hay gặp:
- Dùng {{List}} làm fake repository nhưng quên upsert theo id, khiến {{save}} cùng id tạo hai bản ghi và test đọc sai.
- Trả {{null}} thay vì {{Optional.empty()}} trong {{find}}, gây {{NullPointerException}} trong {{orElseThrow}}.
- Ghi thông báo trước khi kiểm tra số dư, khiến trường hợp lỗi vẫn gửi thông báo.
- Trả thẳng danh sách nội bộ từ {{calls()}} rồi test vô tình sửa nó. Trong code thật nên trả {{List.copyOf(calls)}} nếu muốn bảo vệ trạng thái.

Khi dùng Mockito, bài này tương đương {{when(repo.find("ACC-1")).thenReturn(...)}} cho stub, {{verify(notifier).transferCompleted("ACC-2", 200)}} cho interaction, còn fake repository thường được thay bằng Testcontainers ở tầng tích hợp.`,
    },
  ],
  check: [
    {
      q: 'Bạn cần kiểm tra service gửi **đúng một** email xác nhận sau khi đặt hàng. Cách nào phù hợp nhất?',
      options: [
        'Dùng fake email sender và kiểm tra file trên đĩa',
        'Dùng spy/mock ghi lại lời gọi rồi verify đúng một lần với đúng tham số',
        'Dùng stub luôn trả về true, không cần kiểm tra gì thêm',
        'Không cần test vì email không ảnh hưởng nghiệp vụ',
      ],
      answer: 1,
      explain: `Gửi email là tác dụng phụ không quan sát được qua state của service, nên cần **interaction verification**: spy hoặc mock ghi lại lời gọi rồi khẳng định số lần và tham số. Fake ghi ra đĩa là quá nặng và phụ thuộc môi trường; stub chỉ trả lời mà không chứng minh có gọi; bỏ test là bỏ mất hợp đồng nghiệp vụ quan trọng.`,
    },
    {
      q: 'Vì sao {{verify(repo, times(2)).save(any())}} thường là dấu hiệu test quá chặt?',
      options: [
        'Vì Mockito không hỗ trợ {{times(2)}}',
        'Vì verify chỉ dùng được với static method',
        'Vì nó khoá test vào số lần gọi nội bộ, nên refactor đúng đắn cũng làm test đỏ',
        'Vì {{save}} không bao giờ được gọi hai lần trong thực tế',
      ],
      answer: 2,
      explain: `Số lần gọi bên trong thường là chi tiết cài đặt. Nếu hành vi nghiệp vụ chỉ yêu cầu dữ liệu cuối cùng đúng, việc đổi hai lần {{save}} thành một lần {{saveAll}} là refactor hợp lệ nhưng test sẽ đỏ. Mockito hỗ trợ {{times(2)}} bình thường; verify dùng được với mọi mock, không riêng static; và không có quy tắc "save không bao giờ gọi hai lần".`,
    },
    {
      q: 'Khi nào **fake** (in-memory repository) tốt hơn mock?',
      options: [
        'Khi cần test cả chuỗi đọc-sửa-ghi và không muốn phụ thuộc số lời gọi',
        'Khi collaborator là một interface không có cài đặt thật',
        'Khi muốn kiểm tra chính xác thứ tự gọi các method',
        'Khi cần mô phỏng lỗi mạng ngẫu nhiên',
      ],
      answer: 0,
      explain: `Fake cài đặt cùng interface bằng cấu trúc dữ liệu đơn giản, nên test được trạng thái sau nhiều bước mà không cần verify từng lời gọi. "Interface chưa có cài đặt thật" không phải lý do để chọn fake thay vì mock — trường hợp đó dùng được cả hai tuỳ mục đích. Muốn kiểm tra thứ tự gọi thì dùng mock/spy với {{InOrder}}; mô phỏng lỗi mạng ngẫu nhiên là fault injection, không phải ưu điểm của fake.`,
    },
  ],
  related: ['testing-003', 'testing-010'],
  tags: ['test double', 'fake', 'stub', 'mock', 'spy', 'unit test'],
},
{
  id: 'lesson-testing-002',
  track: 'testing',
  order: 2,
  title: 'Clock injection: test code phụ thuộc thời gian mà không ngủ và không flaky',
  level: 'senior',
  minutes: 20,
  goals: [
    'Giải thích được vì sao {{LocalDateTime.now()}} là dependency ẩn và làm test không deterministic',
    'Inject {{java.time.Clock}} và dùng {{Clock.fixed}}/{{Clock.offset}} để test đúng biên hạn dùng',
    'Tránh được bẫy timezone, DST và chia sẻ clock mutable giữa các test',
  ],
  body: `**Tóm tắt:** Thời gian là một dependency ẩn: {{Instant.now()}} gọi đồng hồ thật nên test không thể kiểm soát được các biên (trước expiry, đúng expiry, sau expiry). Giải pháp là tiêm {{java.time.Clock}} vào service, dùng {{Clock.fixed()}} để đóng băng và {{Clock.offset()}} để dịch chuyển, từ đó test được mọi mốc trong vài mili giây mà không cần ngủ.

### Thời gian là một dependency, không phải hằng số
Đoạn code sau trông vô hại nhưng là một trong những nguyên nhân flaky test phổ biến nhất:

~~~java
boolean isExpired(Instant startedAt, int days) {
    Instant expiry = startedAt.plus(days, ChronoUnit.DAYS);
    return Instant.now().isAfter(expiry);          // đọc đồng hồ hệ thống ngay bên trong
}
~~~

{{Instant.now()}} gọi đồng hồ thật. Test muốn kiểm tra "hết hạn đúng lúc" thì phải chờ thời gian trôi, hoặc dựng dữ liệu quanh {{now}} và hy vọng test chạy đủ nhanh. Khi CI chậm, test đỏ; khi chạy lại trên máy khác, test xanh. Tệ hơn, không thể test được các mốc biên như "còn đúng 1 giây", "vừa hết hạn", "qua năm nhuận" nếu không đợi thật.

Cách đúng là **đưa thời gian vào từ bên ngoài**. Java 8 có sẵn abstraction {{java.time.Clock}}:

~~~java
class TrialService {
    private final Clock clock;

    TrialService(Clock clock) { this.clock = clock; }

    Instant expiry(Instant startedAt, int days) {
        return startedAt.plus(days, ChronoUnit.DAYS);   // toán học thuần, không đọc đồng hồ
    }

    boolean active(Instant startedAt, int days) {
        return clock.instant().isBefore(expiry(startedAt, days));  // chỉ đọc clock ở đây
    }
}
~~~

Production truyền {{Clock.systemUTC()}} (hoặc bean tương ứng timezone nghiệp vụ); test truyền {{Clock.fixed(...)}} hoặc {{Clock.offset(...)}}. Từ đây mọi mốc thời gian đều điều khiển được, test chạy trong vài mili giây và cho cùng kết quả mọi lúc.

### Các loại Clock có sẵn
| Clock | Ý nghĩa | Dùng khi |
|---|---|---|
| {{Clock.systemUTC()}} | Đồng hồ thật, múi giờ UTC | Production cho mốc thời gian tuyệt đối |
| {{Clock.systemDefaultZone()}} | Đồng hồ thật theo timezone JVM | Hiếm khi nên dùng trong server |
| {{Clock.fixed(instant, zone)}} | Luôn trả cùng một instant | Test một mốc cố định |
| {{Clock.offset(base, duration)}} | Dịch đồng hồ nền thêm một khoảng | Test "sau 23 giờ", "sau 7 ngày" |
| {{Clock.tick(base, duration)}} | Làm tròn **xuống** theo bước {{duration}} (ví dụ bỏ hết mili giây) | Test code nhạy với độ phân giải thời gian, như cache đếm theo giây |

~~~java
Instant base = Instant.parse("2026-03-01T00:00:00Z");
Clock day0  = Clock.fixed(base, ZoneOffset.UTC);
Clock plus23h = Clock.offset(day0, Duration.ofHours(23));
Clock day7  = Clock.offset(day0, Duration.ofDays(7));
~~~

Chú ý {{Clock.fixed}} **không tự chạy**. Nếu code cần thời gian trôi trong một lần test (ví dụ timeout, retry backoff), hãy dùng một mutable clock tự viết: giữ {{volatile Instant}} hoặc {{AtomicReference<Instant>}} và cho test gọi {{advance(Duration)}}. Không dùng {{Thread.sleep}} để "chờ" — nó làm chậm suite và vẫn flaky dưới tải.

### Chọn Instant hay LocalDate
Quy tắc thực dụng:

- **Hạn dùng, token expiry, timeout** nên lưu và tính bằng {{Instant}} (hoặc {{ZonedDateTime}} nếu cần lịch địa phương). {{Instant}} là mốc tuyệt đối, không phụ thuộc timezone, nên test bằng {{Clock.fixed}} rất ổn định.
- **Nghiệp vụ theo ngày lịch** (sao kê cuối tháng, "hết hạn trong hôm nay") cần {{LocalDate.now(clock)}} với một timezone nghiệp vụ **cố định**, ví dụ {{ZoneId.of("Asia/Ho_Chi_Minh")}}. Đừng để mặc định theo JVM, vì server có thể chạy UTC còn người dùng ở múi giờ khác.
- **DST**: cộng {{ChronoUnit.DAYS}} trên {{Instant}} là cộng đúng 24 giờ, còn trên {{ZonedDateTime}} là cộng một ngày lịch và có thể dài 23 hoặc 25 giờ. Chọn theo yêu cầu nghiệp vụ và viết test cho cả hai nếu hệ thống có người dùng ở vùng có DST.

### Biên thời gian: sai một giây là sai hợp đồng
Hãy định nghĩa rõ "hết hạn" là **trước** hay **tại** thời điểm expiry. Nếu dùng {{isBefore}}, tại đúng mốc expiry trial đã không còn active. Test phải phủ ba điểm: trước expiry một chút, đúng expiry, sau expiry một chút. Đây là những case mà test dựa vào {{now}} gần như không thể viết ổn định.

~~~java
// trong test
TrialService s = new TrialService(Clock.fixed(expiry, ZoneOffset.UTC));
assertFalse(s.active(startedAt, 7));   // đúng mốc: đã hết hạn
~~~

### Trong Spring Boot
Khai báo một bean {{Clock}} và inject vào service thay vì gọi static:

~~~java
@Configuration
class TimeConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
~~~

Unit test thì tạo service trực tiếp với clock giả, không cần Spring. Với integration test cần cả context dùng chung một clock giả, hãy khai báo trong {{@TestConfiguration}} một bean {{Clock}} **tên khác** và đánh dấu {{@Primary}} (Spring Boot mặc định cấm ghi đè bean cùng tên). Với legacy code chưa inject được, một số đội dùng {{Mockito.mockStatic(...)}} (mockito-inline, mặc định từ Mockito 5) để giả lập phương thức static trả thời gian — nhưng đó là giải pháp tạm: mock static chỉ có hiệu lực trên thread hiện tại, phải đóng đúng lúc ({{try-with-resources}}), dễ vỡ và che giấu thiết kế phụ thuộc ẩn.

### Bẫy production hay gặp
- **Quên truyền clock vào nhánh code khác**: service nhận clock nhưng một helper vẫn gọi {{LocalDate.now()}}. Test xanh vì nhánh đó không chạy, production sai vào nửa đêm.
- **Clock mutable dùng chung giữa các test**: test này advance làm test khác lệch. Tạo clock mới mỗi test, hoặc reset trong {{@BeforeEach}}.
- **Lưu {{LocalDateTime}} vào database**: mất offset, đọc lại ở múi giờ khác bị lệch. Ưu tiên {{Instant}}/{{OffsetDateTime}} với cột {{timestamptz}}.
- **So sánh thời gian bằng {{equals}} sau khi qua database**: {{Instant.now()}} trên JDK 17 có độ phân giải tới micro giây (thậm chí nano), còn cột {{timestamptz}} của PostgreSQL chỉ lưu micro giây, MySQL {{DATETIME}} mặc định chỉ lưu giây. Lưu rồi đọc lại, giá trị bị cắt nên {{equals}} trả false. Dùng clock cố định trong test, hoặc {{truncatedTo(ChronoUnit.MICROS)}} trước khi lưu và so.
- **Test quá phụ thuộc đồng hồ thật ở tầng tích hợp**: với schedule, hãy tách phần "quyết định có chạy không" thành hàm nhận {{clock}}, còn phần trigger framework để integration test riêng.

> Senior tip: khi hệ thống có bug "chỉ lỗi sau 23h" hoặc "chỉ lỗi ngày cuối tháng", gần như luôn là do timezone hoặc do tính ngày bằng {{LocalDate.now()}} không có clock. Một đội trưởng tốt đặt quy ước: **không có {{now()}} không tham số trong domain code**, chỉ có {{clock.instant()}}; review có thể grep là thấy ngay chỗ vi phạm.

### Ví dụ đời thực: trial 7 ngày chỉ lỗi sau 23h
Một product trial: người dùng đăng ký, sau 7 ngày trial hết hạn. Đội backend viết test bằng {{LocalDate.now()}} và deploy lên staging. Khi test chạy trên CI (múi giờ UTC) thì mọi thứ xanh, nhưng production ở múi giờ Việt Nam (UTC+7) lại **bắt đầu một ngày sớm hơn** — một số user thấy trial "hết hạn" ở ngày thứ 6 thay vì thứ 7. Đội điều tra: test ở staging không phát hiện vì nó cũng chạy theo múi giờ CI, còn production dùng {{LocalDate.now()}} theo timezone JVM. Sau khi đổi sang {{Instant}} + {{Clock}} injection, test được viết lại với ba biên (trước expiry, đúng expiry, sau expiry) và chạy dưới 50 mili giây. Vấn đề không bao giờ tái hiện ở staging nữa.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test code phụ thuộc thời gian thế nào?', tôi sẽ nói: đầu tiên nhận ra {{Instant.now()}} là một dependency ẩn — test không thể kiểm soát được nó. Giải pháp là tiêm {{Clock}} vào service: production truyền {{Clock.systemUTC()}}, test truyền {{Clock.fixed()}} để đóng băng thời gian tại một mốc cố định hoặc {{Clock.offset()}} để dịch chuyển tương đối. Với trial expiry, tôi test ba điểm: một giây trước expiry (vẫn active), đúng expiry (hết hạn), một giây sau (hết hạn). Dùng {{Instant}} cho mốc tuyệt đối vì nó không phụ thuộc timezone. Không bao giờ dùng {{Thread.sleep}} trong unit test — nó làm suite chậm và vẫn flaky dưới tải CI. Trong Spring Boot, khai báo {{@Bean Clock clock()}} là bean và inject; nếu code legacy chưa thể inject, dùng {{Mockito.mockStatic}} trong {{try-with-resources}} nhưng đó là giải pháp tạm thời."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Làm sao test code phụ thuộc thời gian?", "{{Clock.fixed}} khác {{Clock.offset}} thế nào?", "Xử lý expiry qua DST ra sao?", và đưa một test đang {{Thread.sleep(2000)}} để hỏi cách sửa. Câu trả lời tốt là: inject {{Clock}}, test bằng fixed/offset, phủ ba điểm biên, và dùng Instant cho mốc tuyệt đối. Bài tập dưới đây mô phỏng đúng bài toán trial expiry với clock injection.`,
  exercises: [
    {
      title: 'TrialService với Clock: tính hạn, còn active và số ngày còn lại',
      prompt: `Hoàn thiện {{TrialService}} nhận {{Clock}} qua constructor:

- {{expiry(startedAt, days)}}: trả về {{startedAt}} cộng {{days}} ngày (dùng {{ChronoUnit.DAYS}}). {{days <= 0}} thì ném {{IllegalArgumentException}}.
- {{active(startedAt, days)}}: true khi thời điểm hiện tại **trước** expiry; đúng tại mốc expiry là false.
- {{daysRemaining(startedAt, days)}}: số ngày còn lại, **làm tròn lên** (còn 1 giây vẫn tính là 1 ngày); đã hết hạn hoặc đúng mốc expiry thì trả 0. Dùng {{Duration.between(clock.instant(), expiry)}}.

Test sẽ tạo {{Clock.fixed}} và {{Clock.offset}} với các mốc cố định, nên kết quả phải không phụ thuộc thời gian chạy thật.`,
      starter: `import java.time.*;

class TrialService {
    private final Clock clock;

    TrialService(Clock clock) {
        this.clock = clock;
    }

    Instant expiry(Instant startedAt, int days) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean active(Instant startedAt, int days) {
        throw new UnsupportedOperationException("TODO");
    }

    long daysRemaining(Instant startedAt, int days) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.time.*;
import java.util.Objects;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final Instant START = Instant.parse("2026-03-01T00:00:00Z");
    static Clock at(String instant) { return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC); }
    public static void main(String[] args) {
        check("expiry adds exact 24-hour days on the instant", () -> {
            TrialService s = new TrialService(at("2026-03-01T00:00:00Z"));
            eq(Instant.parse("2026-03-08T00:00:00Z"), s.expiry(START, 7));
            eq(Instant.parse("2027-03-01T00:00:00Z"), s.expiry(START, 365));
        });
        check("active is true before expiry and false at the exact boundary", () -> {
            eq(true, new TrialService(at("2026-03-07T23:59:59Z")).active(START, 7));
            eq(false, new TrialService(at("2026-03-08T00:00:00Z")).active(START, 7));
            eq(false, new TrialService(at("2026-03-09T00:00:00Z")).active(START, 7));
        });
        check("daysRemaining rounds partial days up", () -> {
            eq(7L, new TrialService(Clock.offset(at("2026-03-01T00:00:00Z"), Duration.ofHours(23))).daysRemaining(START, 7));
            eq(1L, new TrialService(Clock.offset(at("2026-03-01T00:00:00Z"), Duration.ofDays(7).minusSeconds(1))).daysRemaining(START, 7));
            eq(7L, new TrialService(at("2026-03-01T00:00:00Z")).daysRemaining(START, 7));
        });
        check("daysRemaining is zero at or after expiry", () -> {
            eq(0L, new TrialService(at("2026-03-08T00:00:00Z")).daysRemaining(START, 7));
            eq(0L, new TrialService(at("2026-03-20T00:00:00Z")).daysRemaining(START, 7));
        });
        check("zone of the clock does not change instant-based results", () -> {
            Clock tokyo = Clock.fixed(Instant.parse("2026-03-02T00:00:00Z"), ZoneId.of("Asia/Tokyo"));
            TrialService s = new TrialService(tokyo);
            eq(6L, s.daysRemaining(START, 7));
            eq(true, s.active(START, 7));
        });
        check("non-positive days throws IllegalArgumentException", () -> {
            TrialService s = new TrialService(at("2026-03-01T00:00:00Z"));
            try { s.expiry(START, 0); throw new AssertionError("phải ném lỗi"); }
            catch (IllegalArgumentException expected) { /* ok */ }
            try { s.active(START, -1); throw new AssertionError("phải ném lỗi"); }
            catch (IllegalArgumentException expected) { /* ok */ }
            try { s.daysRemaining(START, 0); throw new AssertionError("phải ném lỗi"); }
            catch (IllegalArgumentException expected) { /* ok */ }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;
import java.time.temporal.ChronoUnit;

class TrialService {
    private final Clock clock;

    TrialService(Clock clock) {
        this.clock = clock;
    }

    Instant expiry(Instant startedAt, int days) {
        if (days <= 0) throw new IllegalArgumentException("days must be positive");
        return startedAt.plus(days, ChronoUnit.DAYS);
    }

    boolean active(Instant startedAt, int days) {
        return clock.instant().isBefore(expiry(startedAt, days));
    }

    long daysRemaining(Instant startedAt, int days) {
        long seconds = Duration.between(clock.instant(), expiry(startedAt, days)).getSeconds();
        if (seconds <= 0) return 0;
        return (seconds + 86_399) / 86_400;          // ceil: còn 1 giây vẫn tính 1 ngày
    }
}`,
      hints: [
        '{{expiry}} chỉ là {{startedAt.plus(days, ChronoUnit.DAYS)}}; kiểm tra {{days <= 0}} trước khi tính.',
        '{{active}} dùng {{clock.instant().isBefore(expiry(...))}} để tại đúng mốc expiry trả về false.',
        '{{daysRemaining}} lấy {{Duration.between(clock.instant(), expiry).getSeconds()}}; nếu <= 0 trả 0, ngược lại {{(seconds + 86_399) / 86_400}}.',
      ],
      explain: `Bài này cho thấy lợi ích rõ nhất của clock injection: cùng một đoạn code, test kiểm tra được chính xác **một giây trước expiry**, **đúng expiry**, và **sau expiry** mà không cần ngủ. Nếu dùng {{Instant.now()}} bên trong, ba case này gần như không thể viết ổn định.

Lỗi hay gặp:
- Đổi sang {{LocalDateTime}} bằng timezone mặc định của JVM rồi mới cộng ngày và so sánh: cùng một đoạn code cho kết quả khác nhau trên laptop (giờ Việt Nam) và server (UTC).
- Viết {{active}} là {{!clock.instant().isAfter(expiry)}}: trông tương đương {{isBefore}} nhưng tại **đúng** mốc expiry, {{isAfter}} trả false nên {{active}} lại thành true — lệch một tích tắc so với hợp đồng. Chỉ test biên "đúng mốc expiry" mới bắt được lỗi này.
- Tính {{daysRemaining}} bằng phép chia nguyên thông thường: còn 1 giây sẽ ra 0 ngày, trong khi nghiệp vụ muốn "còn 1 ngày". Phải làm tròn lên.
- Cộng ngày bằng {{86_400_000}} mili giây: đúng với Instant nhưng sai với {{ZonedDateTime}} qua DST. Dùng API thời gian thay vì số học tay.

Trong Spring Boot, hãy khai báo {{Clock}} là bean và inject; đừng gọi {{Clock.systemUTC()}} rải rác trong service, vì như vậy lại quay về dependency ẩn.`,
    },
  ],
  check: [
    {
      q: 'Vì sao test dùng {{Thread.sleep(2000)}} để chờ token hết hạn là lựa chọn tồi?',
      options: [
        'Vì sleep làm hỏng đồng hồ hệ thống',
        'Vì sleep luôn ném InterruptedException',
        'Vì test chậm, vẫn flaky dưới tải, và không kiểm tra được mốc biên chính xác',
        'Vì Java không cho sleep trong test',
      ],
      answer: 2,
      explain: `Sleep làm suite chậm và chỉ "hy vọng" thời gian trôi đủ: trên CI tải cao, thread có thể thức dậy muộn hơn nhiều so với 2 giây, còn token có thể hết hạn sớm/muộn hơn dự kiến một chút tuỳ lúc test tạo nó — kết quả lúc xanh lúc đỏ. Nó cũng không cho phép kiểm tra chính xác thời điểm một giây trước expiry. Sleep không làm hỏng đồng hồ, chỉ ném InterruptedException khi bị ngắt (có thể khai báo), và hoàn toàn hợp lệ về mặt ngôn ngữ — vấn đề là độ tin cậy và tốc độ.`,
    },
    {
      q: '{{Clock.offset(clock, Duration.ofHours(23))}} khác {{Clock.fixed(instant, zone)}} ở điểm nào?',
      options: [
        'Offset trả về thời điểm của clock nền cộng thêm 23 giờ; fixed luôn trả đúng một instant cố định',
        'Offset chỉ dùng được với timezone UTC',
        'Fixed tự chạy theo thời gian thật, offset thì đứng yên',
        'Không khác gì, cả hai đều đứng yên',
      ],
      answer: 0,
      explain: `{{Clock.offset}} bọc một clock khác và dịch kết quả thêm một khoảng, nên nếu clock nền là system thì nó vẫn chạy; nếu nền là fixed thì nó đứng yên tại instant cộng offset. {{Clock.fixed}} luôn trả cùng một instant. Offset không bị giới hạn ở UTC, và fixed không tự chạy — đó là đặc điểm của {{Clock.systemUTC}}.`,
    },
    {
      q: 'Nghiệp vụ "gói trial hết hạn sau 7 ngày kể từ lúc kích hoạt". Nên lưu và tính bằng gì?',
      options: [
        'Chuỗi ngày theo định dạng dd/MM/yyyy và so sánh chuỗi',
        '{{LocalDateTime}} theo timezone mặc định của JVM',
        'Số mili giây từ epoch tự cộng tay',
        '{{Instant}} cho mốc tuyệt đối, tính expiry bằng {{plus(7, ChronoUnit.DAYS)}} và đọc giờ qua {{Clock}}',
      ],
      answer: 3,
      explain: `Mốc hết hạn là thời điểm tuyệt đối, nên {{Instant}} (hoặc {{OffsetDateTime}} khi cần offset) là lựa chọn đúng; đọc thời gian hiện tại qua {{Clock}} để test được. So sánh chuỗi ngày sai thứ tự và mất giờ; {{LocalDateTime}} theo timezone JVM sẽ lệch khi server đổi múi giờ; cộng tay mili giây dễ sai và bỏ qua API lịch.`,
    },
  ],
  related: ['testing-005', 'testing-010'],
  tags: ['Clock', 'time', 'flaky test', 'Instant', 'timezone'],
},
{
  id: 'lesson-testing-003',
  track: 'testing',
  order: 3,
  title: 'Property-based testing mini: sinh input bằng seed cố định để tìm bug merge/sort',
  level: 'senior',
  minutes: 30,
  goals: [
    'Phân biệt example-based test với property-based test và nêu được các loại property hữu ích',
    'Tự viết harness sinh input ngẫu nhiên có seed, báo counterexample và tái hiện lỗi',
    'Biết giới hạn của PBT: property sai, generator thiên lệch, chi phí chạy và vai trò của shrinking',
  ],
  body: `**Tóm tắt:** Example-based test chỉ kiểm tra những trường hợp bạn nghĩ ra, bỏ sót bug ở mảng rỗng, phần tử trùng hay biên giá trị. Property-based testing (PBT) mô tả một tính chất phải đúng với mọi input, rồi để máy sinh hàng trăm input ngẫu nhiên để cố bác bỏ tính chất đó. Bài học này giúp bạn viết harness PBT với seed cố định để tái hiện lỗi và các property mạnh nhất cho merge/sort.

### Example-based test chỉ kiểm tra những gì bạn nghĩ tới
Một test thường có dạng: đưa vào ba mảng mẫu, so với kết quả mong đợi. Nó tốt để tài liệu hoá ví dụ và bắt regression, nhưng có một điểm yếu cố hữu: **bạn chỉ kiểm tra những trường hợp bạn nghĩ ra**. Bug trong hàm merge thường nằm ở mảng rỗng, mảng một phần tử, phần tử trùng nhau, số âm, hoặc phần tử cuối của một bên — những tổ hợp dễ bị bỏ sót khi viết tay.

**Property-based testing (PBT)** đảo ngược cách làm: bạn mô tả một **tính chất** phải đúng với **mọi** input hợp lệ, rồi để máy sinh hàng trăm input ngẫu nhiên để cố bác bỏ tính chất đó. Nếu tìm được input làm sai, nó báo **counterexample** — ví dụ cụ thể để bạn debug và thêm thành regression test.

### Các loại property hay dùng
| Loại | Phát biểu | Ví dụ với merge/sort |
|---|---|---|
| Invariant | Kết quả luôn thoả một điều kiện | Mảng sau merge luôn không giảm |
| Oracle | So với cài đặt đã biết là đúng | So với {{Arrays.sort}} trên bản sao |
| Round-trip | Biến đổi rồi đảo ngược trở về gốc | encode rồi decode phải bằng input |
| Idempotence | Làm hai lần như một lần | sort(sort(a)) bằng sort(a) |
| Metamorphic | Đổi input theo cách biết trước thì output đổi theo cách biết trước | merge(a, b) bằng merge(b, a); cộng k vào mọi phần tử input thì mọi phần tử output cũng tăng k |
| Bất biến theo hoán vị | Đổi thứ tự input không đổi kết quả | sort(hoán vị của a) bằng sort(a) |

Với merge, ba property mạnh nhất là: **kết quả đã sắp xếp**, **đa tập phần tử bằng hợp của hai input**, và **độ dài đúng bằng tổng độ dài**. Chỉ cần ba điều này, gần như mọi bug "bỏ phần tử", "sai thứ tự", "xử lý trùng sai" đều lộ ra.

### Seed: ngẫu nhiên nhưng tái hiện được
PBT không được dùng nguồn ngẫu nhiên không kiểm soát. Nếu test đỏ trên CI mà không tái hiện được, bạn không debug được. Cách chuẩn:

~~~java
long seed = 42L;                         // cố định trong CI
for (int trial = 0; trial < 300; trial++) {
    Random r = new Random(seed + trial); // mỗi trial một seed xác định
    int[] a = randomArray(r);
    int[] b = randomArray(r);
    // kiểm tra property; nếu sai, ném AssertionError kèm seed và trial
}
~~~

{{new Random(42)}} luôn sinh cùng một chuỗi số trên mọi máy, mọi JDK. Khi một property thất bại, thông báo phải chứa **seed và số trial** (và nếu được thì cả input) để người khác chạy lại đúng một case trong vài giây.

Lưu ý: {{Random}} thread-safe (seed nằm trong một {{AtomicLong}} cập nhật bằng CAS) nên dùng chung không hỏng dữ liệu, nhưng các thread tranh nhau cùng một seed làm chậm, và quan trọng hơn: test nào lấy số nào phụ thuộc thứ tự chạy, nên mất khả năng tái hiện. Vì vậy mỗi test (mỗi trial) nên có instance riêng; đừng dùng một {{Random}} tĩnh dùng chung. {{ThreadLocalRandom}} nhanh nhưng **không đặt được seed** ({{setSeed}} ném {{UnsupportedOperationException}}), nên không dùng cho test cần tái hiện; {{SplittableRandom}} thì nhận seed được.

### Một harness tối giản
Harness chỉ cần ba việc: sinh input theo seed, chạy property, và bọc lỗi kèm ngữ cảnh:

~~~java
static void check(String name, long seed, int trials, Consumer<Random> property) {
    if (trials <= 0) throw new IllegalArgumentException("trials must be positive");
    for (int trial = 0; trial < trials; trial++) {
        long trialSeed = seed + trial;
        try {
            property.accept(new Random(trialSeed));
        } catch (Throwable t) {
            throw new AssertionError(
                "property failed: " + name + " (seed=" + trialSeed + ", trial=" + trial + "): " + t.getMessage(), t);
        }
    }
}
~~~

Property nhận {{Random}} và tự sinh dữ liệu, nên cùng một harness dùng được cho mảng, chuỗi, map hay cặp input. Đây chính là ý tưởng cốt lõi của jqwik, QuickCheck hay Hypothesis; thư viện thật còn thêm generator có kiểu, shrinking và phân phối thông minh.

### Shrinking: từ counterexample lớn về case nhỏ
Giả sử property hỏng với mảng 27 phần tử. Mảng đó khó đọc. **Shrinking** là quá trình tự động thử các biến thể nhỏ hơn (bỏ phần tử, giảm giá trị, rút ngắn chuỗi) mà vẫn làm property sai, để báo cho bạn case tối giản nhất — thường chỉ còn một vài phần tử. Ví dụ bug "quên chép phần còn lại của mảng b" sẽ được thu về kiểu {{a = []}}, {{b = [0]}} thay vì hai mảng 20 phần tử.

Harness tự viết trong bài này không có shrinking; đó là lý do trong dự án thật nên dùng jqwik. Nhưng hiểu shrinking giúp bạn đọc báo cáo lỗi của PBT đúng cách: **input báo cáo chỉ là một counterexample, không phải toàn bộ không gian lỗi**. Sau khi sửa, hãy chạy lại nhiều seed và thêm case tối giản vào bộ example test.

### Giới hạn và bẫy
- **Property yếu hoặc sai**: nếu property chỉ kiểm tra "không ném exception", code trả mảng rỗng vẫn qua. Property phải mô tả đúng hợp đồng, không phải mô tả cài đặt.
- **Generator thiên lệch**: chỉ sinh số dương từ 0 đến 10 sẽ không bao giờ gặp số âm, tràn số hay phần tử trùng ở biên. Phải chủ động sinh cả biên: rỗng, một phần tử, trùng nhau, {{Integer.MIN_VALUE}}, {{Integer.MAX_VALUE}}.
- **Không deterministic**: dùng {{ThreadLocalRandom}} mà không in seed, hoặc phụ thuộc thời gian thật, biến PBT thành máy tạo flaky test.
- **Trial quá nhiều**: 100.000 trial làm CI chậm mà lợi ích tăng rất ít sau vài trăm case. Chọn 100–1000 tuỳ chi phí mỗi lần chạy.
- **Property đúng nhưng không đủ**: merge đúng thứ tự và đủ phần tử nhưng làm mất tính ổn định (stability) thì ba property trên không bắt được. Phải thêm property riêng nếu hợp đồng yêu cầu.

> Senior tip: PBT hiệu quả nhất với **hàm thuần** và **serialize/parse**, ít hiệu quả với workflow nhiều I/O. Một pattern thực tế: dùng example test cho luồng nghiệp vụ chính, dùng PBT cho các hàm lõi như tính phí, chia tiền, merge khoảng thời gian, parse cấu hình. Khi PBT tìm ra bug, luôn biến counterexample thành một example test cố định — vì PBT có thể không chạy trong mọi pipeline, còn regression test thì phải luôn chạy.

### Ví dụ đời thực: merge bị mất phần tử cuối khi mảng bên rỗng
Một team viết merge cho hai mảng đã sắp xếp. Example test của họ: merge [1, 3, 5] với [2, 3, 4, 8] → xanh. Khi production, một service merge hai danh sách category: [1, 2] với [] → kết quả chỉ [1], mất phần tử 2. Bug nằm ở nhánh "bên rỗng" mà example test không bao giờ chạm tới. Sau khi thêm PBT với 300 trial seed 42, property "đã sắp xếp và giữ đúng đa tập phần tử" tìm ra counterexample: a = [], b = [0]. Sau khi shrink về [0], dev nhìn ra ngay: vòng while chép phần còn lại của b bị bỏ sót. Thêm example test merge([], [2]) và bug được fix trong 5 phút.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'property-based testing khác unit test thường thế nào?', tôi sẽ nói: unit test kiểm tra những trường hợp bạn nghĩ ra — bạn chỉ kiểm tra đúng những gì bạn đã viết. PBT đảo ngược: bạn mô tả một tính chất phải đúng với mọi input (ví dụ: kết quả merge luôn được sắp xếp và giữ đúng đa tập phần tử), rồi để máy sinh hàng trăm input ngẫu nhiên để cố bác bỏ tính chất đó. Nếu tìm được input làm sai, nó báo counterexample kèm seed và trial để bạn chạy lại đúng case. Ví dụ merge: chỉ cần ba property — đã sắp xếp, đúng độ dài, giữ đa tập — là bắt được gần như mọi bug: quên chép phần còn lại, dùng < làm mất phần tử trùng, cấp phát thiếu ô. Seed quan trọng vì Random cho cùng chuỗi số trên mọi machine, nên error có thể tái hiện. Shrinking thu nhỏ counterexample từ mảng 20 phần tử xuống [3, 4, 5] để bạn debug nhanh hơn."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Property-based testing khác unit test thường thế nào?", "Bạn kiểm tra hàm sort bằng property gì?", "Seed và shrinking để làm gì?", "Khi nào KHÔNG nên dùng PBT?". Trả lời tốt là nêu property cụ thể (sorted, cùng đa tập, độ dài), nói rõ seed giúp tái hiện, shrinking giúp thu nhỏ counterexample, và PBT không thay thế example test cho hợp đồng nghiệp vụ. Bài tập dưới đây bắt bạn tự viết merge và harness PBT tối giản.`,
  exercises: [
    {
      title: 'Merge hai mảng đã sắp xếp và harness property-based có seed',
      prompt: `Hoàn thiện hai phần trong class {{Pbt}}:

**1. {{merge(a, b)}}**: trả về mảng mới chứa toàn bộ phần tử của {{a}} và {{b}}, đã sắp xếp tăng dần. Hai input đã được sắp xếp sẵn và có thể rỗng. Phần tử trùng phải được giữ đủ (merge không phải union). Không được sửa mảng input.

**2. {{check(name, seed, trials, property)}}**: chạy {{property}} đúng {{trials}} lần. Ở trial thứ {{i}}, tạo {{new Random(seed + i)}} và truyền cho property. Nếu property ném bất kỳ lỗi nào, dừng ngay và ném {{AssertionError}} với message chứa {{name}}, {{seed=<seed của trial>}} và {{trial=<số trial>}} (ví dụ seed 42, lỗi ở trial 3 → {{seed=45}}, {{trial=3}}), kèm lỗi gốc làm cause. {{trials <= 0}} thì ném {{IllegalArgumentException}}.

Test sẽ dùng harness để chạy 300 trial với seed 42, kiểm tra kết quả merge vừa được sắp xếp vừa giữ đúng đa tập phần tử.`,
      starter: `class Pbt {
    static int[] merge(int[] a, int[] b) {
        throw new UnsupportedOperationException("TODO");
    }

    static void check(String name, long seed, int trials, Consumer<Random> property) {
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
    static int[] arr(int... v) { return v; }
    static int[] randomArray(Random r) {
        int n = r.nextInt(21);                       // 0..20 phần tử
        int[] a = new int[n];
        for (int i = 0; i < n; i++) a[i] = r.nextInt(41) - 20;   // -20..20, có trùng
        return a;
    }
    static boolean sorted(int[] a) {
        for (int i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
        return true;
    }
    static boolean sameMultiset(int[] x, int[] y) {
        if (x.length != y.length) return false;
        int[] a = x.clone(), b = y.clone();
        Arrays.sort(a); Arrays.sort(b);
        return Arrays.equals(a, b);
    }
    static void expectPropertyFailure(Runnable r) {
        try { r.run(); }
        catch (AssertionError e) {
            String m = String.valueOf(e.getMessage());
            if (!m.contains("seed=") || !m.contains("trial="))
                throw new AssertionError("message thiếu seed/trial: " + m);
            return;
        }
        throw new AssertionError("mong đợi AssertionError từ harness");
    }
    public static void main(String[] args) {
        check("merge two simple sorted arrays", () -> {
            eq(Arrays.toString(arr(1, 2, 3, 3, 4, 5, 8)),
               Arrays.toString(Pbt.merge(arr(1, 3, 5), arr(2, 3, 4, 8))));
        });
        check("merge handles empty side, all duplicates and no mutation", () -> {
            int[] a = arr(2, 2, 2);
            int[] b = arr();
            eq(Arrays.toString(arr(2, 2, 2)), Arrays.toString(Pbt.merge(a, b)));
            eq(Arrays.toString(arr(2, 2, 2)), Arrays.toString(a));
            eq(Arrays.toString(arr(0, 0, 5, 5)), Arrays.toString(Pbt.merge(arr(0, 5), arr(0, 5))));
            eq(0, Pbt.merge(arr(), arr()).length);
        });
        check("property: merged output is sorted with the same multiset (seed 42)", () -> {
            Pbt.check("merge preserves sorted order and multiset", 42L, 300, r -> {
                int[] a = randomArray(r), b = randomArray(r);
                Arrays.sort(a); Arrays.sort(b);              // hợp đồng: input đã sắp xếp
                int[] sum = new int[a.length + b.length];
                System.arraycopy(a, 0, sum, 0, a.length);
                System.arraycopy(b, 0, sum, a.length, b.length);
                int[] merged = Pbt.merge(a, b);
                if (merged.length != sum.length)
                    throw new AssertionError("sai độ dài: " + Arrays.toString(merged));
                if (!sorted(merged))
                    throw new AssertionError("chưa sắp xếp: " + Arrays.toString(merged));
                if (!sameMultiset(sum, merged))
                    throw new AssertionError("mất phần tử: " + Arrays.toString(merged));
            });
        });
        check("harness reports the failing seed and trial", () -> {
            expectPropertyFailure(() -> Pbt.check("drops last element", 42L, 20, r -> {
                int[] a = randomArray(r), b = randomArray(r);
                Arrays.sort(a); Arrays.sort(b);
                int[] merged = Pbt.merge(a, b);
                if (merged.length > 0 && merged[merged.length - 1] != Integer.MAX_VALUE)
                    throw new AssertionError("giả lập bug");
            }));
        });
        check("harness runs exactly trials times with new Random(seed + i)", () -> {
            List<Integer> got = new ArrayList<>();
            Pbt.check("record", 100L, 5, r -> got.add(r.nextInt()));
            List<Integer> want = new ArrayList<>();
            for (int i = 0; i < 5; i++) want.add(new Random(100L + i).nextInt());
            eq(want, got);
        });
        check("failure message names the exact seed, trial and keeps the cause", () -> {
            int[] calls = { 0 };
            try {
                Pbt.check("fails at trial 3", 42L, 10, r -> {
                    if (calls[0]++ == 3) throw new IllegalStateException("gia lap bug");
                });
            } catch (AssertionError e) {
                String m = String.valueOf(e.getMessage());
                if (!m.contains("fails at trial 3") || !m.contains("seed=45") || !m.contains("trial=3"))
                    throw new AssertionError("message sai: " + m);
                if (!(e.getCause() instanceof IllegalStateException)) throw new AssertionError("mat cause goc: " + e.getCause());
                eq(4, calls[0]);                          // dừng lại ngay ở trial lỗi
                return;
            }
            throw new AssertionError("mong đợi AssertionError từ harness");
        });
        check("same seed produces the same sequence", () -> {
            int[] first = new int[5], second = new int[5];
            Random r1 = new Random(42L), r2 = new Random(42L);
            for (int i = 0; i < 5; i++) { first[i] = r1.nextInt(); second[i] = r2.nextInt(); }
            eq(Arrays.toString(first), Arrays.toString(second));
        });
        check("check rejects non-positive trials", () -> {
            try { Pbt.check("x", 42L, 0, r -> { }); throw new AssertionError("phải ném lỗi"); }
            catch (IllegalArgumentException expected) { /* ok */ }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Pbt {
    static int[] merge(int[] a, int[] b) {
        int[] out = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) {
            // dùng <= để giữ đủ phần tử trùng và giữ tính ổn định khi merge object
            out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        }
        while (i < a.length) out[k++] = a[i++];
        while (j < b.length) out[k++] = b[j++];
        return out;
    }

    static void check(String name, long seed, int trials, Consumer<Random> property) {
        if (trials <= 0) throw new IllegalArgumentException("trials must be positive");
        for (int trial = 0; trial < trials; trial++) {
            long trialSeed = seed + trial;
            try {
                property.accept(new Random(trialSeed));
            } catch (Throwable t) {
                throw new AssertionError(
                    "property failed: " + name + " (seed=" + trialSeed + ", trial=" + trial + "): " + t.getMessage(), t);
            }
        }
    }
}`,
      hints: [
        'Merge dùng ba con trỏ: so {{a[i]}} với {{b[j]}}, lấy phần tử nhỏ hơn (dùng {{<=}} để giữ trùng); sau vòng chính, chép phần còn lại của bên chưa hết.',
        'Harness: vòng lặp {{for (int trial = 0; trial < trials; trial++)}}, tạo {{new Random(seed + trial)}} để mỗi trial tái hiện được, rồi gọi {{property.accept(r)}} trong {{try/catch}}.',
        'Khi bắt lỗi, ném {{AssertionError}} mới với message chứa {{seed}} và {{trial}}; truyền {{t}} làm cause để giữ stack trace gốc.',
      ],
      explain: `Hai property cốt lõi của merge là **đã sắp xếp** và **giữ đúng đa tập phần tử**. Chỉ cần sinh ngẫu nhiên vài trăm cặp mảng, chúng bắt được gần như mọi bug thường gặp: quên chép phần còn lại của một bên, dùng {{<}} làm mất phần tử trùng, cấp phát thiếu một ô, hoặc sửa mảng input.

Vì sao seed cố định quan trọng: {{new Random(42)}} cho cùng chuỗi số trên mọi máy, nên test deterministic. Khi property sai, message chứa seed và trial giúp chạy lại đúng case. Trong harness thật (jqwik, Hypothesis), seed được in ra khi fail và shrinking tự thu nhỏ input; harness tối giản này bỏ shrinking nên counterexample có thể còn dài.

Lỗi hay gặp:
- Dùng {{a[i] <= b[j]}} nhưng quên vòng {{while}} chép phần còn lại, làm mất đuôi.
- Dùng {{Math.min(a.length, b.length)}} làm độ dài kết quả, thiếu phần tử.
- Trả về một trong hai mảng input thay vì mảng mới, khiến test "no mutation" đỏ và gây bug dây chuyền ở nơi gọi.
- Harness dùng {{ThreadLocalRandom}} hoặc không in seed, khiến lỗi không tái hiện được.
- Property kiểm tra bằng cách gọi lại chính hàm cần test (ví dụ so merge với merge) — luôn đúng một cách vô nghĩa. Phải dùng oracle độc lập như {{Arrays.sort}} hoặc kiểm tra tính chất trực tiếp.`,
    },
  ],
  check: [
    {
      q: 'Property nào **không** đủ mạnh để kiểm tra một hàm merge hai mảng đã sắp xếp?',
      options: [
        'Kết quả luôn không giảm',
        'Độ dài kết quả bằng tổng độ dài hai input',
        'Hàm không ném exception',
        'Đa tập phần tử của kết quả bằng hợp đa tập hai input',
      ],
      answer: 2,
      explain: `"Không ném exception" quá yếu: hàm trả mảng rỗng hoặc mảng sai vẫn qua. Ba property còn lại cùng nhau khẳng định thứ tự, độ dài và nội dung — đủ để bắt phần lớn bug merge. Tuy vậy chúng vẫn không kiểm tra tính ổn định (stability) nếu hợp đồng yêu cầu, nên đôi khi cần thêm property riêng.`,
    },
    {
      q: 'Vì sao phải in **seed** khi một property-based test thất bại?',
      options: [
        'Để tăng entropy cho lần chạy sau',
        'Để tái hiện chính xác chuỗi input đã làm test đỏ',
        'Vì Java bắt buộc in seed trước khi ném AssertionError',
        'Để shrinking chạy nhanh hơn',
      ],
      answer: 1,
      explain: `Cùng một seed tạo cùng chuỗi số ngẫu nhiên trên mọi máy, nên in seed và số trial cho phép người khác tái hiện đúng counterexample. Seed không làm tăng entropy; Java không bắt buộc in; shrinking là quá trình thu nhỏ input, không phụ thuộc việc in seed (dù seed giúp tái hiện trước khi shrink).`,
    },
    {
      q: 'Generator chỉ sinh số nguyên từ 0 đến 10. Rủi ro chính là gì?',
      options: [
        'Test chạy quá chậm',
        'Không bao giờ kiểm tra số âm, tràn số, mảng rỗng hoặc giá trị biên',
        'Random không tái hiện được dù seed cố định',
        'Property luôn luôn thất bại',
      ],
      answer: 1,
      explain: `Phân phối input quyết định vùng không gian mà test thực sự chạm tới. Chỉ sinh 0..10 sẽ bỏ qua số âm, giá trị lớn, trùng lặp ở biên và mảng rỗng, nên bug ở các vùng đó không lộ ra. Generator hẹp không làm test chậm hơn; seed cố định vẫn tái hiện; và property không nhất thiết fail — nó chỉ yếu đi.`,
    },
  ],
  related: ['testing-015', 'testing-006'],
  tags: ['property-based testing', 'PBT', 'seed', 'merge sort', 'jqwik'],
},
{
  id: 'lesson-testing-004',
  track: 'testing',
  order: 4,
  title: 'Harness tự viết: verifyAll, barrier abort và trạng thái NOT RUN',
  level: 'senior',
  minutes: 45,
  goals: [
    'Viết được runner chạy hết mọi case, thu thập PASS/FAIL thay vì dừng ở lỗi đầu tiên',
    'Phân biệt SKIP với NOT RUN và giải thích vì sao một case chưa chạy không bao giờ được tính là PASS',
    'Thiết kế dòng RESULT có mẫu số trung thực và dùng nó làm quality gate trong CI',
  ],
  body: `**Tóm tắt:** Harness test tự viết hay hỏng theo hai kiểu: fail-fast chỉ báo case sai đầu tiên nên bạn phải sửa-rồi-chạy lại nhiều vòng, hoặc tệ hơn là biến case chưa hề chạy thành "qua" nên pipeline xanh mà thực chất không kiểm tra gì. Một runner đúng phải chạy hết các case, ghi trạng thái riêng cho từng case (PASS, FAIL, SKIP, NOT RUN) và tổng hợp thành dòng RESULT có mẫu số trung thực.

### Vì sao fail-fast làm bạn mù thông tin
Runner kiểu {{for (Case c : cases) c.run();}} dừng ngay khi case đầu tiên ném lỗi. Trên máy dev điều này có vẻ nhanh, nhưng khi một refactor làm hỏng 12 case, bạn chỉ thấy case số 3. Bạn sửa nó, chạy lại, thấy case số 7, sửa tiếp... Mỗi vòng CI mất vài phút, và bạn không biết mình còn cách "xanh" bao xa. Tệ hơn, một số lỗi chỉ xuất hiện khi các case chạy cùng nhau, nên dừng sớm che mất tương tác giữa chúng.

Cách làm của JUnit và hầu hết runner trưởng thành là **verifyAll**: chạy từng case, ghi kết quả, rồi mới tổng hợp. Đổi lại, mỗi case phải **độc lập**: case trước không được để lại dữ liệu bẩn, không được đóng tài nguyên dùng chung, không được giả định thứ tự. Nếu không có isolation, chạy hết các case sẽ tạo ra lỗi dây chuyền khó tái hiện hơn cả fail-fast.

Một điểm tinh tế: verifyAll không có nghĩa là bỏ qua lỗi nghiêm trọng. Nếu JVM hết bộ nhớ, stack overflow hoặc process bị kill thì runner không thể tiếp tục. Khi đó phần còn lại phải được ghi **NOT RUN**, không được im lặng coi như đã qua.

### Bốn trạng thái, không phải hai
Đa số harness tự viết chỉ có hai biến đếm: pass và fail. Đó là nguồn gốc của các báo cáo sai.

| Trạng thái | Nghĩa | Ví dụ |
|---|---|---|
| PASS | Case đã chạy xong và mọi assertion đúng | Cộng hai số ra đúng kết quả |
| FAIL | Case đã chạy nhưng assertion sai hoặc ném exception ngoài dự kiến | expected 100 but got 99, NullPointerException |
| SKIP | Có quyết định hợp lệ là không chạy | Chỉ chạy smoke test vào ngày release |
| NOT RUN | Chưa từng chạy, thường do runner bị abort | Barrier đóng, process bị kill, case trước treo |

JUnit phân biệt **failure** (AssertionError) và **error** (exception khác), nhưng nhiều báo cáo trên UI gộp chúng thành "failed". Trong harness của bài này, exception cũng được gộp vào FAIL nhưng chi tiết phải giữ loại exception và message. Điều quan trọng không phải tên gọi mà là **không được đánh đồng case chưa chạy với case đã qua**. Một case có thể đã chạy được nửa chừng, in ra vài dòng log rồi bị abort ở barrier; nó vẫn là NOT RUN, không phải PASS, vì phần kiểm chứng cuối cùng chưa xảy ra.

### Cái bẫy im lặng: luôn xanh vì không có gì chạy
Hãy tưởng tượng runner đếm {{fail}} mỗi khi assertion sai và đếm {{total}} theo số case **đã chạy**. Case 1 pass, case 2 gọi {{abort()}} ở barrier, case 3 và 4 không bao giờ bắt đầu. Kết quả in ra {{RESULT 1/1}} và CI báo xanh. Không có case nào fail, nhưng 3 case chưa hề được kiểm tra.

Đây là lý do phải tách hai con số:
- {{total}} là **số case đã đăng ký**, lấy từ danh sách trước khi chạy, không phải số case đã chạy.
- {{not_run}} là số case không chạy được, được đếm riêng và luôn xuất hiện trong dòng kết quả nếu lớn hơn 0.

Một bất biến dễ kiểm tra: {{passed + failed + skipped + not_run == total}}. Nếu đẳng thức này sai, report đã bị hỏng và không nên tin bất kỳ con số nào trong đó.

### Barrier và NOT RUN
Barrier tượng trưng cho một điều kiện hạ tầng: database đã sẵn sàng chưa, service phụ đã khởi động chưa, future đã xong chưa. Trong harness của bài này, mỗi case có thể gọi {{awaitBar()}}. Nếu cờ abort đã bật, lời gọi ném một exception riêng; runner bắt đúng exception đó và ghi case hiện tại cùng toàn bộ case sau là NOT RUN.

Ví dụ với ba case:
- Case A chạy xong, PASS.
- Case B gọi {{abort()}} rồi {{awaitBar()}}, bị chặn ở barrier.
- Case C không bao giờ được gọi.

Report phải là {{RESULT 1/3 (2 not_run)}}, không phải {{RESULT 1/1}} và càng không phải {{RESULT 3/3}}. Từ con số 3 ở mẫu số, người đọc biết ngay hai case chưa được xác minh. Nếu bạn dùng exit code làm gate, hãy chặn khi {{not_run > 0}}; nếu không, một lần CI bị cancel giữa chừng có thể trông giống một lần chạy hoàn hảo.

### SKIP khác NOT RUN ở đâu
Cả hai đều làm giảm độ phủ, nhưng nguyên nhân và cách xử lý khác nhau:
- **SKIP** là quyết định có chủ đích, biết trước và có lý do: "test này chỉ chạy khi có Docker", "chỉ chạy trên release day", "tính năng đang sau feature flag". Người viết test chịu trách nhiệm về nó.
- **NOT RUN** là sự cố vận hành: runner chết, barrier đóng, timeout toàn cục, process bị kill. Không ai chủ động quyết định bỏ case này.

Vì vậy đừng gộp chúng vào một cột "skipped". Một skip tăng đột biến thường là feature flag bị tắt nhầm hoặc điều kiện môi trường thay đổi; một not_run tăng đột biến là hạ tầng test có vấn đề. Cả hai đều cần cảnh báo riêng. Đặc biệt, skip vĩnh viễn là một bug ẩn: hãy gắn owner, ticket và ngày hết hạn cho mọi skip có điều kiện.

### skipIf phải nhận ngày từ ngoài
Một biến thể hay gặp là test chỉ chạy vào một ngày nhất định, ví dụ smoke test ngày release. Nếu bên trong test gọi {{LocalDate.now()}} thì suite trở nên phụ thuộc đồng hồ thật: hôm nay xanh, mai đỏ, CI ở múi giờ khác lại cho kết quả khác. Cách đúng là truyền ngày vào:

~~~java
LocalDate today = LocalDate.of(2026, 10, 26);        // test quyết định ngày
Case smoke = TestGate.skipIf(
    "release-day smoke",
    d -> d.equals(LocalDate.of(2026, 10, 25)),         // predicate nhận ngày được truyền
    check -> check.require(true, "smoke ok")
);
Report report = gate.add(smoke).runAll(today);       // cùng ngày thì cùng kết quả
~~~

Nhờ vậy test của harness cũng deterministic: chạy ngày nào cũng ra cùng kết quả, và bạn kiểm tra được cả nhánh skip lẫn nhánh chạy trong cùng một lần.

### Report phải đủ thông tin để hành động
Một dòng "1 test failed" không giúp ai sửa lỗi. Mỗi kết quả nên có:
- **Tên case** duy nhất và mô tả hành vi, không phải {{test1}}, {{test2}}.
- **Trạng thái** rõ ràng, tách PASS, FAIL, SKIP, NOT RUN; exception ghi kèm loại và message.
- **Chi tiết**: expected/actual, exception type và message, seed nếu là property-based test.
- **Thứ tự chạy** hoặc id để tái hiện khi case phụ thuộc môi trường.
- **Thời lượng** nếu bạn muốn phát hiện case chậm bất thường.

Khi một case có nhiều assertion sai, đừng ném ngay ở assertion đầu. {{Check}} nên thu thập **tất cả** problem rồi báo một lần: sửa một lượt nhanh hơn ba lượt. Nhưng cũng đừng nuốt exception: nếu case ném lỗi ngoài dự kiến, ghi FAIL kèm loại exception và message, không được biến nó thành SKIP.

### Dùng RESULT làm quality gate
Exit code chỉ nói process kết thúc thế nào, không nói có bao nhiêu test thật sự chạy. Một test class bị vô hiệu hoá do merge conflict, một filter sai trong lệnh chạy, hoặc một lần cancel giữa chừng đều có thể cho exit code 0. Gate nên kiểm tra thêm:
- Số test chạy được tối thiểu, ví dụ ít nhất 80% số case đã đăng ký.
- {{not_run == 0}} trên nhánh chính.
- Số skip không vượt ngưỡng đã thoả thuận, và mọi skip mới đều có ticket.
- Không có case nào chạy quá lâu mà không có timeout.

Trong hệ sinh thái Java, Surefire/Failsafe in ra dòng {{Tests run: X, Failures: Y, Errors: Z, Skipped: W}}; hãy parse đúng cả bốn số thay vì chỉ nhìn màu xanh của build. Với harness tự viết, dòng {{RESULT passed/total (skipped, not_run)}} chính là hợp đồng máy đọc được của bạn.

### Bẫy production hay gặp
- **Bắt {{Throwable}} rồi tiếp tục**: nuốt cả {{OutOfMemoryError}} và {{StackOverflowError}} làm JVM ở trạng thái không đáng tin. Harness nhỏ trong bài bắt {{Throwable}} để minh hoạ report, nhưng code production phải rethrow {{VirtualMachineError}} và để tầng ngoài đánh dấu phần còn lại NOT RUN.
- **Một case treo vô hạn**: runner không có timeout sẽ treo cả CI. Mỗi case cần watchdog hoặc timeout toàn cục.
- **Dùng {{System.exit}} trong case**: process thoát trước khi report được ghi, mọi case sau thành NOT RUN mà không ai biết.
- **Chia sẻ trạng thái giữa các case**: case trước để lại dữ liệu, case sau pass giả hoặc fail oan. Tạo fixture mới cho mỗi case.
- **Đếm total theo case đã chạy**: đây chính là lỗi khiến báo cáo 1/1 thay vì 1/3. Total phải lấy từ danh sách đăng ký.
- **Skip im lặng**: {{@Disabled}} hoặc {{assumeTrue}} không ai theo dõi sẽ khiến coverage tụt dần mà không có cảnh báo.

> Senior tip: mình từng thấy pipeline xanh suốt ba tuần vì một test class bị đánh dấu disabled khi resolve merge conflict; Surefire in "Tests run: 0" nhưng build vẫn success. Từ đó đội đặt gate: tổng số test không được giảm quá 5% so với baseline, not_run phải bằng 0, và mọi skip mới phải có ticket trong comment. Một harness trung thực quan trọng hơn một harness nhanh.

### Ví dụ đời thực: pipeline xanh 3 tuần vì một test class bị disable
Một đội có 400 test, CI chạy mỗi PR. Một lần resolve merge conflict, một test class bị đánh dấu @Disabled do conflict. Surefire in "Tests run: 0" nhưng build vẫn success, và team không ai để ý. Pipeline xanh suốt 3 tuần, trong khi 12 case không bao giờ chạy. Đội đặt gate: tổng số test không được giảm quá 5% so với baseline, not_run == 0 trên nhánh chính, và mọi skip mới phải có ticket trong comment. Sau khi gate có mặt, lần đầu tiên CI đỏ và họ phát hiện ra ngay.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'vì sao không nên fail-fast trong test suite?', tôi sẽ nói: fail-fast dừng ngay khi case đầu tiên ném lỗi. Khi một refactor làm hỏng 12 case, bạn chỉ thấy case số 3, sửa rồi chạy lại, thấy case số 7 — mỗi vòng CI mất vài phút và bạn không biết còn cách xanh bao xa. Tệ hơn, một số lỗi chỉ xuất hiện khi các case chạy cùng nhau, nên fail-fast che mất tương tác giữa chúng. VerifyAll chạy từng case, ghi kết quả, rồi mới tổng hợp. Ba case quan trọng: total phải lấy từ danh sách đăng ký (không phải số case đã chạy), bất biến passed + failed + skipped + not_run == total, và không bao giờ đánh đồng case chưa chạy với case đã qua. NOT RUN là sự cố vận hành (runner bị kill, barrier đóng), trong khi SKIP là quyết định có chủ đích (feature flag, ngày release)."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Vì sao không nên fail-fast trong test suite?", "Skipped khác not run thế nào?", "Làm sao biết pipeline xanh thật hay chỉ là không có test nào chạy?", và "Bạn thiết kế quality gate ra sao?". Câu trả lời tốt nên nêu rõ bốn trạng thái, mẫu số lấy từ danh sách đăng ký, bất biến tổng số, và cách phân biệt skip có chủ đích với not run do hạ tầng. Bài tập dưới đây bắt bạn tự viết runner như vậy, gồm cả barrier abort và skipIf theo ngày được truyền vào.`,
  exercises: [
    {
      title: 'Viết TestGate: verifyAll, barrier abort và dòng RESULT trung thực',
      prompt: `Cho sẵn khung {{TestGate}} với các kiểu dữ liệu cơ bản. Hãy hoàn thiện phần logic:

**1. {{Check}}** thu thập lỗi thay vì ném ngay:
- {{require(condition, message)}} thêm {{message}} vào danh sách problem nếu điều kiện sai.
- {{eq(expected, actual)}} thêm problem dạng {{expected X but got Y}} nếu hai giá trị khác nhau.
- {{passed()}} trả true khi không có problem nào; {{problems()}} trả bản sao danh sách problem.

**2. {{runAll(today)}}** chạy **tuần tự, không fail-fast**:
- Mỗi case đã đăng ký phải có đúng một kết quả trong report, kể cả case không chạy.
- Nếu cờ abort đã bật **trước** khi tới case: ghi {{NOT_RUN}}, không gọi body.
- Nếu {{case.skippedOn(today)}} trả true: ghi {{SKIP}}, không gọi body.
- Ngược lại chạy body với một {{Check}} mới. Nếu body gọi {{awaitBar()}} khi đã abort, bắt {{AbortedException}} và ghi case hiện tại cùng mọi case sau là {{NOT_RUN}}.
- Nếu body ném exception khác, ghi {{FAIL}} với chi tiết là tên class và message, rồi **tiếp tục** case sau.
- Nếu body chạy xong, {{Check}} có problem thì {{FAIL}} với các problem nối bằng {{"; "}}, không có problem thì {{PASS}}.

**3. Barrier**: {{abort()}} bật cờ abort; {{awaitBar()}} ném {{AbortedException}} nếu cờ đã bật, ngược lại trả true.

**4. {{Report}}**: {{total()}} là số case đã đăng ký. {{passed()}}, {{failed()}}, {{skipped()}}, {{notRun()}} đếm theo trạng thái. {{line()}} trả đúng định dạng:
- Không có skip và not run: {{RESULT 2/3}}.
- Có not run: {{RESULT 4/5 (1 not_run)}}.
- Có cả hai: {{RESULT 2/4 (1 skipped, 1 not_run)}}.

Test sẽ gọi {{runAll}} với một {{LocalDate}} cố định, nên đừng đọc {{LocalDate.now()}}. Không cần in ra stdout; test đọc trực tiếp từ object report.`,
      starter: `import java.time.*;

class TestGate {
    enum Status { PASS, FAIL, SKIP, NOT_RUN }

    static final class Check {
        private final List<String> problems = new ArrayList<>();

        void require(boolean condition, String message) {
            throw new UnsupportedOperationException("TODO");
        }

        void eq(Object expected, Object actual) {
            throw new UnsupportedOperationException("TODO");
        }

        boolean passed() {
            throw new UnsupportedOperationException("TODO");
        }

        List<String> problems() {
            throw new UnsupportedOperationException("TODO");
        }
    }

    static final class Result {
        private final String name;
        private final Status status;
        private final String detail;

        Result(String name, Status status, String detail) {
            this.name = name;
            this.status = status;
            this.detail = detail;
        }

        String name() { return name; }
        Status status() { return status; }
        String detail() { return detail; }
    }

    static final class Report {
        private final List<Result> results;

        Report(List<Result> results) {
            this.results = new ArrayList<>(results);
        }

        List<Result> results() {
            throw new UnsupportedOperationException("TODO");
        }

        int total() {
            throw new UnsupportedOperationException("TODO");
        }

        int passed() {
            throw new UnsupportedOperationException("TODO");
        }

        int failed() {
            throw new UnsupportedOperationException("TODO");
        }

        int skipped() {
            throw new UnsupportedOperationException("TODO");
        }

        int notRun() {
            throw new UnsupportedOperationException("TODO");
        }

        String line() {
            throw new UnsupportedOperationException("TODO");
        }
    }

    static final class Case {
        private final String name;
        private final Predicate<LocalDate> skipWhen;
        private final Consumer<Check> body;

        Case(String name, Predicate<LocalDate> skipWhen, Consumer<Check> body) {
            this.name = name;
            this.skipWhen = skipWhen;
            this.body = body;
        }

        String name() { return name; }
        boolean skippedOn(LocalDate today) { return skipWhen.test(today); }
        void run(Check check) { body.accept(check); }
    }

    static final class AbortedException extends RuntimeException {
        AbortedException(String message) { super(message); }
    }

    private final List<Case> cases = new ArrayList<>();
    private boolean aborted;

    TestGate add(String name, Consumer<Check> body) {
        throw new UnsupportedOperationException("TODO");
    }

    TestGate add(Case c) {
        throw new UnsupportedOperationException("TODO");
    }

    static Case skipIf(String name, Predicate<LocalDate> skipWhen, Consumer<Check> body) {
        throw new UnsupportedOperationException("TODO");
    }

    void abort() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean aborted() {
        throw new UnsupportedOperationException("TODO");
    }

    boolean awaitBar() {
        throw new UnsupportedOperationException("TODO");
    }

    Report runAll(LocalDate today) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.time.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static TestGate.Result result(TestGate.Report report, String name) {
        for (TestGate.Result r : report.results()) if (r.name().equals(name)) return r;
        throw new AssertionError("không có case " + name + " trong report");
    }
    static final LocalDate MONDAY = LocalDate.of(2026, 10, 26);
    static final LocalDate SUNDAY = LocalDate.of(2026, 10, 25);

    public static void main(String[] args) {
        check("runAll reports every case and does not stop at the first failure", () -> {
            TestGate gate = new TestGate();
            List<String> order = new ArrayList<>();
            gate.add("first", c -> { order.add("first"); c.eq(2, 1 + 1); });
            gate.add("second fails", c -> { order.add("second"); c.eq(5, 2 + 2); });
            gate.add("third", c -> { order.add("third"); c.eq("ok", "ok"); });
            TestGate.Report r = gate.runAll(MONDAY);
            eq(List.of("first", "second", "third"), order);
            eq(3, r.total());
            eq(2, r.passed());
            eq(1, r.failed());
            eq(TestGate.Status.PASS, result(r, "first").status());
            eq(TestGate.Status.FAIL, result(r, "second fails").status());
            eq(TestGate.Status.PASS, result(r, "third").status());
            eq("RESULT 2/3", r.line());
        });

        check("a failed assertion names the exact case and keeps expected/actual detail", () -> {
            TestGate gate = new TestGate();
            gate.add("healthy", c -> c.eq("ok", "ok"));
            gate.add("rounding bug", c -> c.eq(100L, 99L));
            gate.add("healthy too", c -> c.require(true, "fine"));
            TestGate.Report r = gate.runAll(MONDAY);
            TestGate.Result bad = result(r, "rounding bug");
            eq(TestGate.Status.FAIL, bad.status());
            if (!bad.detail().contains("100") || !bad.detail().contains("99"))
                throw new AssertionError("detail thiếu expected/actual: " + bad.detail());
            eq(TestGate.Status.PASS, result(r, "healthy").status());
            eq(TestGate.Status.PASS, result(r, "healthy too").status());
        });

        check("abort at the barrier marks the current and remaining cases NOT RUN, never PASS", () -> {
            TestGate gate = new TestGate();
            gate.add("before barrier", c -> c.require(true, "ok"));
            gate.add("hits aborted barrier", c -> {
                gate.abort();
                gate.awaitBar();
                c.require(true, "must not be reached");
            });
            gate.add("after barrier 1", c -> c.require(false, "must not run"));
            gate.add("after barrier 2", c -> c.require(false, "must not run"));
            TestGate.Report r = gate.runAll(MONDAY);
            eq(TestGate.Status.PASS, result(r, "before barrier").status());
            eq(TestGate.Status.NOT_RUN, result(r, "hits aborted barrier").status());
            eq(TestGate.Status.NOT_RUN, result(r, "after barrier 1").status());
            eq(TestGate.Status.NOT_RUN, result(r, "after barrier 2").status());
            eq(1, r.passed());
            eq(3, r.notRun());
            eq("RESULT 1/4 (3 not_run)", r.line());
        });

        check("an intentional exception is reported as FAIL, not hidden, and later cases still run", () -> {
            TestGate gate = new TestGate();
            gate.add("throws on purpose", c -> { throw new IllegalStateException("database went away"); });
            gate.add("still runs", c -> c.require(true, "alive"));
            TestGate.Report r = gate.runAll(MONDAY);
            TestGate.Result err = result(r, "throws on purpose");
            eq(TestGate.Status.FAIL, err.status());
            if (!err.detail().contains("IllegalStateException") || !err.detail().contains("database went away"))
                throw new AssertionError("detail thiếu loại/message: " + err.detail());
            eq(TestGate.Status.PASS, result(r, "still runs").status());
            eq(1, r.failed());
            eq("RESULT 1/2", r.line());
        });

        check("skipIf reads the supplied date and never executes the skipped body", () -> {
            AtomicInteger runs = new AtomicInteger();
            TestGate gate = new TestGate();
            gate.add(TestGate.skipIf("release-day smoke",
                    d -> d.equals(SUNDAY),
                    c -> { runs.incrementAndGet(); c.require(false, "body must not run on skip day"); }));
            gate.add("always", c -> c.require(true, "ok"));
            TestGate.Report sunday = gate.runAll(SUNDAY);
            eq(0, runs.get());
            eq(TestGate.Status.SKIP, result(sunday, "release-day smoke").status());
            eq("RESULT 1/2 (1 skipped)", sunday.line());
            TestGate.Report monday = gate.runAll(MONDAY);
            eq(1, runs.get());
            eq(TestGate.Status.FAIL, result(monday, "release-day smoke").status());
            eq(1, monday.failed());
        });

        check("result line matches the exact gate format for 4 passed and 1 not run", () -> {
            TestGate gate = new TestGate();
            for (int i = 1; i <= 4; i++) {
                final int n = i;
                gate.add("fast case " + n, c -> c.eq(n * 2, n + n));
            }
            gate.add("async lease renews", c -> {
                gate.abort();
                gate.awaitBar();
            });
            TestGate.Report r = gate.runAll(MONDAY);
            eq("RESULT 4/5 (1 not_run)", r.line());
            eq(4, r.passed());
            eq(0, r.failed());
            eq(1, r.notRun());
            eq(0, r.skipped());
        });

        check("a gate aborted before runAll reports every case NOT RUN and runs nothing", () -> {
            TestGate gate = new TestGate();
            AtomicInteger runs = new AtomicInteger();
            gate.add("never 1", c -> { runs.incrementAndGet(); c.require(false, "must not run"); });
            gate.add("never 2", c -> { runs.incrementAndGet(); c.require(false, "must not run"); });
            gate.abort();
            TestGate.Report r = gate.runAll(MONDAY);
            eq(0, runs.get());
            eq(0, r.passed());
            eq(2, r.notRun());
            eq("RESULT 0/2 (2 not_run)", r.line());
        });

        check("Check collects every problem and eq shows expected/actual", () -> {
            TestGate gate = new TestGate();
            gate.add("many problems", c -> {
                c.eq(1, 2);
                c.require(false, "third problem");
                c.eq("a", "b");
            });
            TestGate.Report r = gate.runAll(MONDAY);
            TestGate.Result bad = result(r, "many problems");
            eq(TestGate.Status.FAIL, bad.status());
            eq(1, r.failed());
            String d = bad.detail();
            if (!d.contains("expected 1 but got 2")) throw new AssertionError("thiếu problem 1: " + d);
            if (!d.contains("third problem")) throw new AssertionError("thiếu problem 2: " + d);
            if (!d.contains("expected a but got b")) throw new AssertionError("thiếu problem 3: " + d);
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;

class TestGate {
    enum Status { PASS, FAIL, SKIP, NOT_RUN }

    static final class Check {
        private final List<String> problems = new ArrayList<>();

        void require(boolean condition, String message) {
            if (!condition) problems.add(message == null ? "requirement failed" : message);
        }

        void eq(Object expected, Object actual) {
            if (!Objects.equals(expected, actual)) {
                problems.add("expected " + expected + " but got " + actual);
            }
        }

        boolean passed() {
            return problems.isEmpty();
        }

        List<String> problems() {
            return new ArrayList<>(problems);
        }
    }

    static final class Result {
        private final String name;
        private final Status status;
        private final String detail;

        Result(String name, Status status, String detail) {
            this.name = name;
            this.status = status;
            this.detail = detail;
        }

        String name() { return name; }
        Status status() { return status; }
        String detail() { return detail; }
    }

    static final class Report {
        private final List<Result> results;

        Report(List<Result> results) {
            this.results = new ArrayList<>(results);
        }

        List<Result> results() {
            return new ArrayList<>(results);
        }

        int total() {
            return results.size();
        }

        private int count(Status status) {
            int n = 0;
            for (Result r : results) if (r.status() == status) n++;
            return n;
        }

        int passed() { return count(Status.PASS); }
        int failed() { return count(Status.FAIL); }
        int skipped() { return count(Status.SKIP); }
        int notRun() { return count(Status.NOT_RUN); }

        String line() {
            StringBuilder sb = new StringBuilder("RESULT ")
                    .append(passed()).append("/").append(total());
            List<String> notes = new ArrayList<>();
            if (skipped() > 0) notes.add(skipped() + " skipped");
            if (notRun() > 0) notes.add(notRun() + " not_run");
            if (!notes.isEmpty()) sb.append(" (").append(String.join(", ", notes)).append(")");
            return sb.toString();
        }
    }

    static final class Case {
        private final String name;
        private final Predicate<LocalDate> skipWhen;
        private final Consumer<Check> body;

        Case(String name, Predicate<LocalDate> skipWhen, Consumer<Check> body) {
            this.name = name;
            this.skipWhen = skipWhen;
            this.body = body;
        }

        String name() { return name; }
        boolean skippedOn(LocalDate today) { return skipWhen.test(today); }
        void run(Check check) { body.accept(check); }
    }

    static final class AbortedException extends RuntimeException {
        AbortedException(String message) { super(message); }
    }

    private final List<Case> cases = new ArrayList<>();
    private boolean aborted;

    TestGate add(String name, Consumer<Check> body) {
        return add(new Case(name, d -> false, body));
    }

    TestGate add(Case c) {
        if (c == null) throw new IllegalArgumentException("case must not be null");
        cases.add(c);
        return this;
    }

    static Case skipIf(String name, Predicate<LocalDate> skipWhen, Consumer<Check> body) {
        return new Case(name, skipWhen, body);
    }

    void abort() {
        aborted = true;
    }

    boolean aborted() {
        return aborted;
    }

    boolean awaitBar() {
        if (aborted) throw new AbortedException("barrier aborted");
        return true;
    }

    Report runAll(LocalDate today) {
        if (today == null) throw new IllegalArgumentException("today is required");
        List<Result> results = new ArrayList<>();
        for (Case c : cases) {
            if (aborted) {
                results.add(new Result(c.name(), Status.NOT_RUN, "runner aborted before case"));
                continue;
            }
            if (c.skippedOn(today)) {
                results.add(new Result(c.name(), Status.SKIP, "skipped on " + today));
                continue;
            }
            Check check = new Check();
            try {
                c.run(check);
            } catch (AbortedException e) {
                results.add(new Result(c.name(), Status.NOT_RUN, e.getMessage()));
                continue;
            } catch (VirtualMachineError e) {
                throw e;
            } catch (Throwable t) {
                results.add(new Result(c.name(), Status.FAIL,
                        t.getClass().getSimpleName() + ": " + t.getMessage()));
                continue;
            }
            if (check.passed()) results.add(new Result(c.name(), Status.PASS, ""));
            else results.add(new Result(c.name(), Status.FAIL, String.join("; ", check.problems())));
        }
        return new Report(results);
    }
}`,
      hints: [
        'Khi đếm total, dùng {{cases.size()}} hoặc {{results.size()}} ở report; không đếm số case đã thực sự chạy, vì đó chính là lỗi biến 1/3 thành 1/1.',
        'Trong {{runAll}}, kiểm tra cờ {{aborted}} trước mỗi case. Khi {{awaitBar()}} ném {{AbortedException}}, bắt riêng nó và ghi {{NOT_RUN}}; đừng để nó rơi vào nhánh bắt {{Throwable}} chung và bị ghi FAIL.',
        'Dòng {{line()}} chỉ thêm phần trong ngoặc khi có skip hoặc not run; dùng {{String.join(", ", notes)}} để có đúng {{(1 skipped, 1 not_run)}}.',
      ],
      explain: `Bài này mô phỏng đúng cách Surefire/JUnit tổng hợp kết quả, nhưng viết tay để bạn thấy các quyết định thiết kế:

- **VerifyAll** chạy hết case để một lần CI cho bạn toàn bộ bức tranh. Test kiểm tra cả thứ tự chạy và việc case thứ ba vẫn chạy sau khi case thứ hai fail.
- **NOT RUN** là trạng thái riêng. Khi barrier đóng, case hiện tại và mọi case sau đều không có kết quả kiểm chứng, nên tuyệt đối không được tính vào passed. Đây là điểm khác biệt giữa report trung thực và report "xanh giả".
- **SKIP** có chủ đích, được quyết định bởi predicate nhận ngày từ ngoài. Nhờ truyền {{LocalDate}} vào {{runAll}}, test kiểm tra được cả ngày skip và ngày chạy mà không phụ thuộc đồng hồ thật.
- **Lỗi bất ngờ** vẫn phải hiện ra. Case ném {{IllegalStateException}} được ghi FAIL kèm loại và message, và các case sau vẫn tiếp tục.

Lỗi hay gặp:
- Đếm {{total}} theo số case đã chạy, khiến report 1/1 thay vì 1/3 khi bị abort.
- Bắt {{AbortedException}} chung với {{Throwable}} rồi ghi FAIL; như vậy case chưa chạy xong bị đánh giá sai và không phân biệt được sự cố hạ tầng với bug thật.
- Quên kiểm tra {{aborted}} trước mỗi case, nên sau barrier vẫn chạy tiếp các case còn lại.
- Gọi {{LocalDate.now()}} bên trong predicate, làm test phụ thuộc ngày chạy và flaky trên CI ở múi giờ khác.
- Nuốt toàn bộ problem trong {{Check}} bằng cách chỉ giữ problem đầu tiên; sửa lỗi sẽ chậm vì mỗi lần chỉ lộ một assertion.

Trong code production, hãy bắt {{Exception}} và {{AssertionError}} thay vì {{Throwable}}; các lỗi như {{OutOfMemoryError}} phải làm runner abort và đánh dấu phần còn lại NOT RUN. Nếu cần chạy song song, mỗi case phải có report riêng và gộp theo id, không dùng một biến đếm chung.`,
    },
  ],
  check: [
    {
      q: 'Vì sao runner chỉ đếm {{passed}} và {{failed}} nhưng bỏ qua case chưa chạy lại nguy hiểm hơn một test fail bình thường?',
      options: [
        'Vì nó làm test chạy chậm hơn',
        'Vì pipeline có thể xanh dù chưa kiểm tra gì, tạo cảm giác an toàn giả và che giấu lỗi cho tới production',
        'Vì Java không cho phép bỏ qua case',
        'Vì nó làm tăng số dòng log',
      ],
      answer: 1,
      explain: `Một fail thật hiện ra và buộc người ta sửa; một case chưa chạy nhưng bị tính là qua thì không ai biết. CI xanh, team tin tưởng, lỗi đi tới production. Runner không chậm hơn vì bỏ qua case; Java hoàn toàn cho phép không chạy case; log ít hơn cũng không phải vấn đề. Điểm chết người là độ tin cậy của tín hiệu.`,
    },
    {
      q: 'Một case gọi {{assumeTrue(false)}} hoặc bị bỏ qua vì hôm nay không phải ngày release. Trạng thái nào đúng?',
      options: [
        'PASS, vì không có assertion nào sai',
        'FAIL, vì test không chạy',
        'SKIP, vì đó là quyết định có chủ đích dựa trên điều kiện đã biết',
        'NOT RUN, vì mọi case không chạy đều là not run',
      ],
      answer: 2,
      explain: `SKIP là quyết định có chủ đích, biết trước: điều kiện môi trường, ngày release, feature flag. NOT RUN là sự cố ngoài ý muốn như runner bị kill hoặc barrier đóng. Cả hai đều không phải PASS và không phải FAIL; nhưng gộp chúng lại sẽ che mất nguyên nhân và cách xử lý khác nhau.`,
    },
    {
      q: 'Vì sao {{skipIf}} nên nhận ngày từ tham số thay vì gọi {{LocalDate.now()}} bên trong?',
      options: [
        'Vì LocalDate.now() luôn ném exception trong test',
        'Vì nó làm test deterministic: cùng một ngày truyền vào cho cùng kết quả, và kiểm tra được cả nhánh skip lẫn nhánh chạy',
        'Vì LocalDate không có method now()',
        'Vì chỉ ngày trong quá khứ mới dùng được',
      ],
      answer: 1,
      explain: `Đọc đồng hồ thật biến test thành phụ thuộc thời điểm chạy và múi giờ CI, nên hôm nay xanh mai đỏ. Truyền ngày vào cho phép test cố định ngày skip và ngày chạy trong cùng một lần. LocalDate có now(), và không có quy tắc nào cấm ngày tương lai; vấn đề là tính xác định.`,
    },
  ],
  related: ['testing-009', 'testing-010', 'testing-006'],
  tags: ['test harness', 'verifyAll', 'NOT RUN', 'skip', 'quality gate', 'CI'],
},
{
  id: 'lesson-testing-005',
  track: 'testing',
  order: 5,
  title: 'Characterization test (golden master)',
  level: 'senior',
  minutes: 20,
  goals: ['Hiểu characterization test', 'Viết golden master', 'Biết pitfall'],
  body: `**Tóm tắt:** Characterization test chụp hành vi thực tế của code cũ, kể cả bug, để có lưới an toàn trước khi refactor. Golden master là bản chụp output để so sánh và phát hiện thay đổi hành vi. Đây là kỹ thuật quan trọng khi maintain hệ thống legacy và thường được hỏi trong phỏng vấn senior.

### Vì sao cần chụp hành vi
Code legacy thường không có test. Khi phải sửa, bạn không biết sửa sẽ phá gì. Characterization test cho phép refactor mà không làm đổi hành vi quan sát được. Nó không kiểm tra spec đúng hay sai, chỉ ghi lại "hệ thống đang làm gì". Điều này giúp bạn tự tin thay đổi implementation bên trong.

### Cơ chế từng bước
Characterization test hoạt động theo quy trình 5 bước, mỗi bước giải quyết một rủi ro cụ thể:

**Bước 1: Xác định ranh vực (seam) để quan sát**
Trước khi viết test, bạn phải chọn *đâu* là output quan sát được. Với hàm thuần, đó là giá trị trả về. Với service có side-effect, đó có thể là: record ghi vào DB, message đẩy lên Kafka, email gửi đi, file ghi ra đĩa, hoặc log audit. **VÌ SAO:** Nếu quan sát sai ranh vực, bạn sẽ bỏ sót hành vi quan trọng (ví dụ: hàm trả về đúng nhưng quên publish event). Chọn ranh vực dựa trên *hợp đồng nghiệp vụ* chứ không phải chi tiết implement.

**Bước 2: Thu thập input đại diện (characterization input)**
Chạy code cũ trên bộ input bao quát: happy path, edge case (rỗng, null, giá trị cực đại), dữ liệu production thật (export từ DB, log request), và các case bug đã biết. Số lượng input thường từ 50–500 case tuỳ độ phức tạp. **VÌ SAO:** Input quá ít → golden master không phát hiện được regression ở nhánh code ít chạy. Input quá nhiều → test chậm, golden master phình to, khó rà soát khi có thay đổi có chủ đích.

**Bước 3: Chạy legacy và lưu golden master**
Với mỗi input, gọi code cũ và serialize output (JSON, protobuf, text) vào file dưới {{name}}. Tên file thường theo pattern {{pattern}}. **VÌ SAO:** Lưu file thay vì hardcode trong test giúp: (a) diff dễ dàng bằng công cụ CLI, (b) review thay đổi golden master trong PR như review code, (c) golden master độc lập với framework test.

**Bước 4: Viết bản mới (refactored) với cùng interface**
Tái cấu trúc code: tách hàm lớn, đổi tên biến, thay thuật toán, extract class… — nhưng **không đổi signature public** và **không sửa logic nghiệp vụ**. Mục tiêu là code dễ đọc, dễ mở rộng, có unit test riêng cho các helper mới. **VÌ SAO:** Nếu đổi signature, golden master không còn so sánh được. Nếu sửa logic cùng lúc, bạn không biết test đỏ do refactor hay do bug mới.

**Bước 5: So sánh và triết (triage) sự khác biệt**
Chạy test: với mỗi input, so sánh output mới với golden master. Có 3 kết quả:
- **Giống hệt** → refactor an toàn, commit.
- **Khác biệt do chuẩn hoá** (timestamp, UUID, thứ tự map) → cập nhật normalizer, không đổi golden master.
- **Khác biệt thật** → đây là *ý định thay đổi hành vi* (sửa bug) hoặc *regression không muốn*. Nếu là sửa bug: cập nhật golden master có chủ đích, ghi chú trong commit. Nếu là regression: sửa code mới cho khớp golden master.

### Ví dụ minh hoạ: golden master cho parser CSV legacy
~~~java
// LegacyParser.java — code cũ rối, không test, xử lý CSV có header
public class LegacyParser {
    public List<Map<String, String>> parse(String csv) {
        String[] lines = csv.split("\\r?\\n");
        if (lines.length == 0) return List.of();
        String[] headers = lines[0].split(",");
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 1; i < lines.length; i++) {
            String[] cols = lines[i].split(",", -1); // -1 giữ cột rỗng cuối
            Map<String, String> row = new LinkedHashMap<>(); // giữ thứ tự cột
            for (int j = 0; j < headers.length; j++) {
                row.put(headers[j].trim(), j < cols.length ? cols[j].trim() : "");
            }
            rows.add(row);
        }
        return rows;
    }
}

// GoldenMasterTest.java — characterization test
class GoldenMasterTest {
    private static final Path GOLDEN_DIR = Path.of("src/test/resources/golden");
    private final LegacyParser legacy = new LegacyParser();
    private final NewParser refactored = new NewParser(); // cùng interface

    @ParameterizedTest
    @MethodSource("goldenCases")
    void goldenMaster(String input, Path goldenFile) throws IOException {
        String refactoredOut = toJson(refactored.parse(input));
        String golden = Files.readString(goldenFile);

        // So sánh refactored với golden master (legacy output đã lưu)
        assertEquals(normalize(golden), normalize(refactoredOut),
            "Refactored output khác golden master: " + goldenFile);
    }

    static Stream<Arguments> goldenCases() throws IOException {
        return Files.list(GOLDEN_DIR)
            .filter(p -> p.toString().endsWith(".golden.json"))
            .map(p -> Arguments.of(readInput(p), p)); // đọc input tương ứng
    }

    // Chuẩn hoá: bỏ timestamp, sắp xếp key JSON, trim whitespace
    String normalize(String json) { /* ... */ }
    String toJson(List<Map<String, String>> rows) { /* ... */ }
}
~~~
Trong thực tế, bạn có thể lưu output vào file theo hướng approval testing (ví dụ ApprovalTests), hoặc tự viết normalizer rồi so sánh bằng thư viện JSON như JsonAssert.

### Pitfall
Golden master cũng chụp cả bug, nên phải theo dõi và sửa dần. Khi phát hiện bug, cập nhật golden master có chủ đích và ghi lý do. Không nên để golden master phình to quá lớn; chọn input đại diện. Nếu output có timestamp hoặc random, cần chuẩn hoá trước khi so sánh. Tránh so sánh object có thứ tự không ổn định.

### Khi nào dùng / không dùng
Dùng khi refactor code legacy không có test. Không dùng khi đang viết tính năng mới từ đầu; khi đó nên viết spec test.

### So sánh với spec test
Spec test kiểm tra hành vi mong đợi theo yêu cầu. Characterization test kiểm tra hành vi hiện tại. Khi refactor, bạn muốn giữ hành vi hiện tại; khi sửa bug, bạn chủ đích thay đổi golden master.

### Lỗi hay gặp trên production
- **So sánh output không chuẩn hoá**: legacy ghi timestamp {{ts}} vào JSON, refactored sinh timestamp khác → test flaky. *Nguyên nhân:* golden master chứa giá trị động. *Cách sửa:* viết normalizer loại bỏ/chuẩn hoá field động trước khi so sánh (ví dụ: replace timestamp bằng placeholder, sort key JSON).
- **Golden master quá lớn (hàng nghìn file, vài trăm MB)**: suite test chạy 15 phút, CI timeout. *Nguyên nhân:* thu thập input không lọc, lưu cả response HTTP to. *Cách sửa:* chọn input đại diện (boundary, equivalence partitioning), chỉ lưu field nghiệp vụ quan trọng, nén golden master, chạy song song.
- **Không ghi lý do khi cập nhật golden master**: 6 tháng sau ai cũng không biết tại sao golden master đổi. *Nguyên nhân:* cập nhật golden master như file tự động. *Cách sửa:* bắt buộc PR description giải thích "cập nhật golden master vì sửa bug X" hoặc "refactor Y không đổi hành vi", reviewer check diff golden master như check code.
- **So sánh object có thứ tự không ổn định**: {{HashSet}} iteration order khác giữa JDK version → golden master mismatch. *Nguyên nhân:* dùng collection không đảm bảo thứ tự. *Cách sửa:* dùng {{LinkedHashMap}}/{{TreeMap}} khi serialize, hoặc sort key trước khi so sánh.
- **Quên golden master cho error path**: legacy ném {{Exception}} cho input hỏng, refactored trả về empty list → test pass vì không so sánh exception. *Nguyên nhân:* chỉ golden master cho success case. *Cách sửa:* golden master phải chứa cả loại exception và message lỗi; test so sánh type exception + message.

### Ví dụ đời thực: refactor 5.000 dòng legacy không có test
Một team phải maintain một module parse CSV 5.000 dòng, không có test nào. Khi cần thay đổi, dev không biết sẽ phá gì. Cách làm: chọn seam (output của parse), thu 100 input đại diện từ production log và edge case (rỗng, null, giá trị cực đại), chạy legacy lưu golden master, rồi refactor từng bước nhỏ — đổi tên biến, tách hàm, thay thuật toán — và chạy golden master sau mỗi bước. Khi refactor xong, test xanh. Sau đó phát hiện một bug: legacy bỏ sót cột rỗng cuối. Giữ golden master (vẫn chụp hành vi cũ), viết spec test cho hành vi đúng (test đỏ), sửa code, cập nhật golden master có chủ đích kèm commit message "fix bug X". Sau 6 tháng, golden master vẫn là lưới an toàn khi thêm tính năng mới.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'characterization test kiểm tra điều gì?', tôi sẽ nói: nó kiểm tra **hành vi thực tế hiện có** của code, kể cả bug, để làm lưới an toàn trước khi refactor. Khác với spec test — kiểm tra hành vi mong đợi theo yêu cầu. Quy trình: xác định ranh vực quan sát được (output, record ghi DB, message push Kafka) → thu input đại diện (happy path, edge case, production data) → chạy legacy serialize output làm golden master → refactor nhỏ, không đổi signature → so sánh output mới với golden master → triết diff: khác do chuẩn hóa (timestamp, UUID) thì sửa normalizer; khác thật thì quyết định là bug fix hay regression. Khi golden master chứa bug: không sửa ngay, giữ nó, viết spec test cho hành vi đúng (red), sửa code (green), sau đó cập nhật golden master kèm lý do trong commit."

### Tóm tắt cho phỏng vấn
Characterization test giúp bạn refactor legacy an toàn bằng cách chụp và so sánh hành vi thực tế, kể cả bug, rồi theo dõi thay đổi có chủ đích.

### Liên hệ phỏng vấn
**Câu 1:** "Bạn refactor một module legacy 5.000 dòng không có test. Quy trình của bạn là gì?"
*Trả lời:* Xác định seam → thu input đại diện (production log + edge case) → chạy legacy lưu golden master → refactor nhỏ, chạy golden master sau mỗi bước → triết diff: nếu khác do chuẩn hoá thì sửa normalizer, nếu khác thật thì quyết định là bug fix hay regression → commit golden master kèm lý do.

**Câu 2:** "Golden master khác snapshot testing ở đâu?"
*Trả lời:* Golden master dùng output của **code cũ (legacy)** làm baseline; snapshot testing dùng output của **code mới** làm baseline (commit snapshot lần đầu). Golden master cho refactor an toàn; snapshot testing cho phát hiện thay đổi bất ngờ khi dev sửa code mới.

**Câu 3:** "Làm sao xử lý khi golden master chứa bug?"
*Trả lời:* Không sửa golden master ngay. Viết spec test cho hành vi đúng (red), sửa code làm spec test xanh, *sau đó* cập nhật golden master cho khớp hành vi mới, ghi commit message "fix bug X, cập nhật golden master". Điều này tạo dấu vết audit: golden master thay đổi có chủ đích, không phải side effect.

> Senior tip: Golden master là lưới an toàn, không phải spec. Luôn rà soát output để phát hiện bug tiềm ẩn. Khi review PR có thay đổi golden master, hãy diff file golden master như diff code — đó là nơi lộ ra regression hoặc bug fix thực sự.`,
  exercises: [{ title: 'Refactor premium', prompt: `Viết phương thức {{refactored}} sao cho cùng hành vi với {{legacy}}. Bạn phải giữ nguyên logic, chỉ tái cấu trúc để dễ đọc hơn.`, starter: `class Premium { static int legacy(int a){return a;} static int refactored(int a){throw new UnsupportedOperationException("TODO");} }`, tests: `public class Main { static int passed=0,total=0; static void check(String n,Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}} static void eq(Object e,Object a){if(!Objects.equals(e,a))throw new AssertionError("expected "+e+" got "+a);} public static void main(String[] a){check("x1",()->eq(Premium.legacy(5),Premium.refactored(5)));
        check("x2",()->eq(Premium.legacy(0),Premium.refactored(0)));
        check("x3",()->eq(Premium.legacy(100),Premium.refactored(100)));
        System.out.println("RESULT "+passed+"/"+total);} }`, reference: `class Premium { static int legacy(int a){return a;} static int refactored(int a){return a;} }`, hints: ['Hãy sao chép đúng logic hiện tại', 'Chỉ đổi cách viết, không đổi hành vi'], explain: `**Tóm tắt:** Mục tiêu là giữ nguyên hành vi quan sát được.

### Giải thích
Phương thức {{legacy}} trả về chính giá trị truyền vào. Để pass characterization test, {{refactored}} phải trả về cùng kết quả. Đây là ví dụ đơn giản để hiểu ý tưởng: bạn không thay đổi "cái hệ thống đang làm", chỉ thay đổi cấu trúc code bên trong.` }],
  check: [
    {
      q: 'Characterization test kiểm tra điều gì?',
      options: ['Theo đúng đặc tả yêu cầu', 'Hành vi thực tế đang có', 'Hiệu năng', 'Bảo mật'],
      answer: 1,
      explain: 'Đáp án đúng là (B): characterization test ghi lại hành vi hiện tại của code, kể cả bug, để làm lưới an toàn khi refactor. (A) sai vì kiểm tra theo đặc tả yêu cầu là việc của spec/acceptance test — characterization test không quan tâm spec đúng hay sai. (C) sai vì hiệu năng thuộc nhóm performance/load test, không phải mục tiêu của characterization test. (D) sai vì bảo mật thuộc security test (SAST/DAST/pentest), không liên quan đến việc chụp hành vi hiện tại.',
    },
    {
      q: 'Golden master dùng để làm gì?',
      options: ['Tạo dữ liệu ngẫu nhiên', 'Chụp output để so sánh sau refactor', 'Mock đối tượng', 'Sinh test tự động'],
      answer: 1,
      explain: 'Đáp án đúng là (B): golden master là bản chụp output quan sát được (thường lưu thành file), dùng để so sánh giữa phiên bản cũ và mới nhằm phát hiện thay đổi hành vi. (A) sai vì tạo dữ liệu ngẫu nhiên là vai trò của generator/fuzzer, không phải golden master. (C) sai vì mock đối tượng là kỹ thuật thay thế phụ thuộc (test double) để cô lập unit test. (D) sai vì sinh test tự động là đặc điểm của property-based testing hoặc fuzzing, còn golden master chỉ là dữ liệu baseline để đối chiếu.',
    },
    {
      q: 'Bạn phát hiện golden master chụp cả một bug của legacy. Cách xử lý đúng khi refactor là gì?',
      options: [
        'Sửa bug ngay trong lần refactor rồi âm thầm cập nhật golden master',
        'Xoá golden master cho case đó để test luôn xanh',
        'Giữ golden master khớp hành vi cũ, viết spec test cho hành vi đúng (red), sửa bug rồi cập nhật golden master có ghi lý do trong commit',
        'Bỏ qua bug vì characterization test chỉ quan tâm hiệu năng',
      ],
      answer: 2,
      explain: 'Đáp án đúng là (C): tách refactor khỏi sửa bug. Giữ golden master khớp hành vi cũ để refactor an toàn, sau đó dùng spec test mô tả hành vi đúng (test đỏ), sửa code để test xanh, rồi cập nhật golden master có chủ đích kèm lý do trong commit để tạo dấu vết audit. (A) sai vì trộn sửa bug và refactor khiến bạn không biết test đỏ do regression hay do thay đổi có chủ đích, và cập nhật âm thầm làm mất dấu vết. (B) sai vì xoá golden master làm mất lưới an toàn cho nhánh code đó. (D) sai vì characterization test không đo hiệu năng; bỏ qua bug đã biết sẽ để lỗi tồn tại trên production.',
    },
    {
      q: 'Output legacy chứa trường {{createdAt}} (timestamp) thay đổi mỗi lần chạy, khiến golden master mismatch dù logic không đổi. Giải pháp phù hợp nhất là gì?',
      options: [
        'Chuẩn hoá output trước khi so sánh (loại bỏ hoặc thay timestamp bằng placeholder)',
        'Tắt toàn bộ golden master test cho endpoint có timestamp',
        'Ghim đồng hồ hệ thống của CI vào một giá trị cố định vĩnh viễn cho mọi test',
        'Cập nhật golden master sau mỗi lần chạy CI để luôn khớp',
      ],
      answer: 0,
      explain: 'Đáp án đúng là (A): viết normalizer loại bỏ hoặc chuẩn hoá các field động (timestamp, UUID, request id) trước khi so sánh, giữ nguyên phần output mang ý nghĩa nghiệp vụ. (B) sai vì tắt test làm mất lưới an toàn cho cả endpoint. (C) sai vì ghim đồng hồ vĩnh viễn cho mọi test có thể làm hỏng các test khác phụ thuộc thời gian thực hoặc gây tác dụng phụ khó kiểm soát; chuẩn hoá tại điểm so sánh là cách khoanh vùng đúng. (D) sai vì cập nhật golden master sau mỗi lần chạy biến test thành vô nghĩa — nó sẽ không bao giờ phát hiện regression thực sự.',
    },
  ],  related: [],
  tags: ['characterization'],
},
{
  id: 'lesson-testing-006',
  track: 'testing',
  order: 6,
  title: 'Shrinking: tự viết bộ thu gọn phản ví dụ để PBT báo lỗi ai cũng debug được',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được shrinking là gì và vì sao counterexample thô gần như vô dụng khi debug',
    'Tự viết được vòng lặp shrink kiểu "bỏ một phần tử, vẫn sai thì giữ" và biết khi nào nó dừng',
    'Biết đọc báo cáo jqwik/PBT thật và biến phản ví dụ tối giản thành regression test',
    'Nắm các bẫy: predicate không thuần, shrink làm mất tính chất, tối giản quá mức, seed không cố định',
  ],
  body: `**Tóm tắt:** Property-based test sinh ngẫu nhiên hàng trăm input để **tìm ra một ví dụ làm sai tính chất** (gọi là counterexample, tạm dịch: phản ví dụ). **Shrinking** là bước tự động thu nhỏ phản ví dụ đó — bỏ bớt phần tử, giảm giá trị — miễn tính chất **vẫn sai** — để bạn nhận được case nhỏ nhất có thể mà vẫn tái hiện bug. Không có shrinking, PBT cho bạn một mảng 200 phần tử random và bắt bạn tự đi tìm chỗ hỏng; có shrinking, nó đưa bạn đúng {{[3, 4, 5]}} — đủ để nhìn bằng mắt.

### Nhắc lại ba mảnh của một harness PBT
Bài trước (lesson-testing-003) đã dựng hai mảnh đầu; bài này thêm mảnh thứ ba.

| Mảnh | Nhiệm vụ | Ở đâu |
|---|---|---|
| Generator | Sinh một mẫu dữ liệu hợp lệ từ {{Random}} có seed | {{gen.apply(r)}} |
| Property (predicate) | Phát biểu điều **phải đúng** với mọi input hợp lệ; sai (hoặc ném lỗi) tức là tìm thấy bug | {{property.test(xs)}} |
| Shrinker | Từ một mẫu sai, sinh các **biến thể nhỏ hơn** và giữ lại biến thể nào vẫn sai | {{shrink(xs, property)}} |

Một cách nói đời thường: generator là người bốc thuốc thử, property là máy dò kim loại, còn shrinker là người lọc bỏ cát để viên kim loại nhỏ xíu hiện ra.

### Vì sao phản ví dụ thô gần như vô dụng
Giả sử property của bạn là "mảng trả về từ {{merge}} phải được sắp xếp". Harness chạy 300 trial, thất bại ở trial 137 với hai mảng 19 và 22 phần tử. Bạn in ra, nhìn 41 con số, và… không kết luận được gì. Bug thật của merge có thể chỉ là "quên chép phần đuôi khi {{a}} rỗng", nhưng nó đang bị che bởi 40 phần tử nhiễu.

Bây giờ chạy 300 ví dụ nhỏ dần, vẫn sai: còn {{a = []}}, {{b = [7, 2]}}. Nhìn hai dòng đó, hầu hết dev lập tức đoán ra nguyên nhân. Đây chính là giá trị của shrinking: **nó biến một báo cáo thống kê thành một gợi ý nguyên nhân**.

### Thuật toán shrink đơn giản nhất: bỏ một phần tử
Với danh sách, "nhỏ hơn" có nghĩa rất tự nhiên: **ít phần tử hơn**. Thuật toán tham lam (greedy — chọn bước tốt trước mắt, không quay lui):

~~~java
static List<Integer> shrink(List<Integer> bad, Predicate<List<Integer>> property) {
    List<Integer> cur = new ArrayList<>(bad);
    boolean changed = true;
    while (changed) {
        changed = false;
        for (int i = 0; i < cur.size(); i++) {
            List<Integer> cand = new ArrayList<>(cur);
            cand.remove(i);                       // biến thể nhỏ hơn: bỏ 1 phần tử
            if (violates(cand, property)) {       // vẫn sai?
                cur = cand;                       // chấp nhận, quay lại đầu danh sách
                changed = true;
                break;
            }
        }
    }
    return cur;
}

static boolean violates(List<Integer> xs, Predicate<List<Integer>> property) {
    try { return !property.test(xs); }            // property trả false = vi phạm
    catch (Throwable t) { return true; }          // property NÉM LỖI cũng là vi phạm
}
~~~

Ba chi tiết đáng chú ý:
- **Phải copy trước khi bỏ** ({{new ArrayList<>(cur)}}): không được sửa danh sách input, vì harness còn cần bản gốc để in ra nếu bạn tắt shrinking.
- **{{break}} để quay lại đầu vòng ngoài**: sau khi bỏ một phần tử, chỉ số các phần tử sau bị dịch; bắt đầu lại từ đầu giúp thuật toán không bỏ sót.
- **Lỗi ném ra được coi là thất bại**: bug thật thường biểu hiện bằng {{NullPointerException}} hoặc {{IndexOutOfBoundsException}} chứ không phải {{false}}. Nếu bạn để exception thoát ra khỏi shrinker, harness mất luôn cơ hội thu gọn.

### Đi tay một vòng để thấy nó hoạt động
Property: "tổng danh sách phải nhỏ hơn 10" ({{xs -> sum(xs) < 10}}). Generator trả {{[1, 2, 3, 4, 5]}} → tổng 15 → vi phạm.

~~~text
[1, 2, 3, 4, 5]  tong 15  vi phạm          (bắt đầu)
   bo idx 0 -> [2, 3, 4, 5]  tong 14  van vi pham  -> chap nhan, quay lai dau
   bo idx 0 -> [3, 4, 5]     tong 12  van vi pham  -> chap nhan, quay lai dau
   bo idx 0 -> [4, 5]       tong 9   -> DAT property (9 < 10) : không được bỏ
   bo idx 1 -> [3, 5]       tong 8   -> DAT property          : không được bỏ
   bo idx 2 -> [3, 4]       tong 7   -> DAT property          : không được bỏ
-> không bỏ được phần tử nào nữa => đúng. Phần ví dụ tối giản: [3, 4, 5]
~~~

Chú ý kết quả **không phải** bộ ba có tổng lớn nhất — thuật toán tham lam chỉ hứa "không bỏ thêm được phần tử nào", không hứa "nhỏ nhất có thể trên mọi hướng". Muốn chắc chắn tối ưu toàn cục, bạn phải thử thêm hướng khác (giảm giá trị từng phần tử, hoán vị) hoặc quay lui. Trong thực tế, tham lam một hướng đã đủ biến case 200 phần tử thành 3 phần tử, và đó là lý do jqwik cũng chạy greedy với giới hạn số bước.

### Shrinking cho các kiểu dữ liệu khác
| Kiểu | Hướng "nhỏ hơn" | Ghi chú |
|---|---|---|
| {{Integer}} | tiến về 0, rồi thử 0, 1, {{MIN_VALUE}} | luôn shrink số về 0 trước vì 0 là biên dễ hiểu nhất |
| {{String}} | bỏ ký tự, rồi hạ về chuỗi rỗng; giữ nguyên tính hợp lệ | với chuỗi parse được, ép về độ dài ngắn nhất vẫn parse lỗi |
| {{List}} | bỏ phần tử, rồi shrink từng phần tử bên trong | hai chiều: độ dài và giá trị |
| {{Map}} | bỏ entry | giữ key nào gây lỗi |
| Object/record | shrink từng field theo thứ tự field | chỉ được làm hỏng một field một lần |
| Giá trị hợp lệ ({{enum}}, key ngoại lai) | **không** shrink tự do | dễ sinh input ngoài miền hợp lệ, property sai vì lý do sai |

Quy tắc vàng: **mọi biến thể đưa ra thử phải còn hợp lệ theo giả định của property**. Nếu property của bạn là "với mọi đơn hàng có {{items}} không rỗng", shrinker không được trả về danh sách rỗng — nếu không, nó sẽ "thu nhỏ" tới một input mà property chưa bao giờ cam kết, và báo cáo thành công giả.

### Bẫy hay gặp
- **Shrink lại bằng generator**: shrinker phải biến đổi **chính counterexample**, không được bốc mẫu ngẫu nhiên mới. Nếu dùng generator, bạn không còn thu nhỏ ví dụ nữa mà đang tìm một ví dụ khác, và kết quả mất tính tái hiện.
- **Property không thuần**: property đọc {{Random}} tĩnh, đọc {{LocalDateTime.now()}}, hoặc đọc trạng thái chia sẻ. Khi đó lời gọi {{violates(cand)}} cho cùng một danh sách có thể trả lời khác nhau giữa hai lần gọi — shrinker có thể dừng ở một danh sách mà thực tế đã pass, tức là báo cáo **sai sự thật**.
- **Vòng lặp không dừng**: nếu hàm "nhỏ hơn" của bạn có lúc trả về biến thể **dài hơn** hoặc bằng đúng bản gốc và vẫn vi phạm, {{changed}} luôn true. Luôn đảm bảo mỗi bước chấp nhận làm giảm một thước đo hữu hạn (kích thước, tổng độ lớn).
- **Tối giản quá mức**: bug là "tràn số khi {{sum}} vượt {{Integer.MAX_VALUE}}"; nếu shrink cả độ dài lẫn giá trị về 0, phản ví dụ còn {{[1, 2]}} và mất hẳn tính chất gây lỗi. Shrinking phải tôn trọng **bất biến của miền input** (đúng kiểu, đúng ràng buộc).
- **Không cố định seed**: cùng một bug, hai lần chạy cho hai phản ví dụ khác nhau làm cả team mất niềm tin. Seed cố định + thuật toán shrink xác định = báo cáo xác định.
- **Chỉ nhìn phản ví dụ, không lưu nó**: sau khi sửa bug, nếu không thêm chính case tối giản đó vào bộ example test, lần refactor sau bug quay lại và PBT (vốn không chạy ở mọi pipeline) sẽ không bắt được.

### PBT thật (jqwik) báo cáo ra sao
Một output jqwik thất bại thường có hai phần: mẫu bị bác bỏ (falsified sample) và mẫu sau khi thu gọn, kèm giá trị seed để chạy lại đúng phiên đó. Tên dòng log đổi theo phiên bản jqwik, nhưng ba thứ cần tìm luôn là: mẫu gốc, mẫu đã thu gọn, và seed. Đọc báo cáo theo thứ tự: **shrunken sample để hiểu bug, falsified sample + seed để tái hiện và để kiểm tra xem generator có phủ đủ miền hay không** — nếu hàng trăm trial đều chỉ sinh mảng tăng dần thì property "đã sắp xếp" của bạn đang được kiểm tra trên dữ liệu quá dễ.

> Senior tip: coi shrinking là **bộ lọc debug**, không phải máy chứng minh. Sau khi PBT báo {{[3, 4, 5]}}, việc của bạn là viết lại ba dòng đó thành một example test có tên mô tả bug ("merge that drops tail when left side is empty") rồi mới sửa code. Quy trình gọn: chạy PBT bằng seed cố định → lấy phản ví dụ tối giản → thêm example test đỏ → sửa → chạy PBT với 5 seed khác nhau để chắc bạn không chỉ vá đúng một điểm. Chi phí: đặt số trial sao cho một run chưa tới ~1 giây (vài trăm trial), còn shrinking đặt trần số bước (ví dụ 500) để một con bug nghiêm trọng không làm CI treo.

### Ví dụ đời thực: counterexample 200 phần tử thành 3
Một team dùng PBT test merge. Lần đầu fail: falsified sample là hai mảng 19 và 22 phần tử random — 41 con số, không ai kết luận được gì. Sau khi enable shrinking, shrunken sample là a = [], b = [0]. Nhìn hai dòng đó, dev lập tức đoán ra: vòng while chép phần còn lại của b khi a rỗng bị bỏ sót. Fix trong 5 phút. Nếu không có shrinking, team có thể mất vài giờ để đi tìm bug trong 41 số.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'shrinking trong PBT là gì?', tôi sẽ nói: shrinking là bước tự động thu nhỏ phản ví dụ — bỏ bớt phần tử, giảm giá trị — miễn tính chất vẫn bị vi phạm, để bạn nhận được case nhỏ nhất có thể mà vẫn tái hiện bug. Không có shrinking, PBT cho bạn một mảng 200 phần tử random và bắt bạn tự đi tìm chỗ hỏng; có shrinking, nó đưa bạn đúng [3, 4, 5]. Thuật toán tham lam: lặp cho tới khi không bỏ thêm được phần tử nào. Mỗi lượt, thử danh sách bỏ đúng một phần tử ở vị trí i; nếu bản đó vẫn vi phạm property thì chấp nhận và quay lại duyệt từ đầu. Lỗi ném ra cũng được coi là vi phạm — bug thật thường biểu hiện bằng NullPointerException. Kết quả xác định nhưng không đảm bảo tối ưu toàn cục — đó cũng là lý do thư viện thật cho phép nhiều hướng shrink rồi chọn cái nhỏ nhất theo một thước đo."

### Liên hệ phỏng vấn
Câu hỏi phổ biến: "Property-based testing có gì hay, bạn đã dùng chưa, dùng cho cái gì?" — câu trả lời mạnh nhất thường là "dùng cho hàm thuần và tầng serialize/parse, và tôi hiểu shrinking vì chính nó mới làm báo cáo debug được". Ứng viên senior còn phải nói được: seed để tái hiện, generator phải phủ biên, property phải phát biểu hợp đồng chứ không phát biểu cài đặt, và phản ví dụ phải được đóng băng thành regression test. Bài tập dưới đây bắt bạn tự viết {{forAll}} và {{shrink}} để sau này đọc báo cáo của jqwik bạn biết chính xác ba dòng kia nghĩa là gì.`,
  exercises: [
    {
      title: 'Viết Prop.forAll và Prop.shrink: trả về phản ví dụ đã được thu gọn',
      prompt: `Bạn dựng một harness property-based mini cho danh sách số nguyên. Viết hai method trong class {{Prop}} ({{Function}} lấy {{Random}} và trả về {{List<Integer>}}, {{Predicate}} là property):

**1. {{forAll(seed, trials, gen, property)}}**
- {{trials <= 0}} → ném {{IllegalArgumentException}}.
- Ở trial thứ {{i}} (đánh số từ 0), sinh một mẫu bằng {{gen.apply(new Random(seed + i))}} — mỗi trial một instance {{Random}} riêng để tái hiện được.
- Mẫu **vi phạm** property nếu {{property.test(mau)}} trả {{false}} **hoặc** ném ra bất kỳ lỗi nào.
- Dừng ngay ở mẫu vi phạm đầu tiên và trả về {{Optional.of}} bản **đã shrink** của mẫu đó (tức kết quả của {{shrink}}). Không có mẫu nào vi phạm → {{Optional.empty()}}.
- {{gen}} chỉ được gọi tối đa {{trials}} lần và phải dừng ngay sau khi tìm thấy phản ví dụ.

**2. {{shrink(counterexample, property)}}**
- Thuật toán tham lam: lặp cho tới khi không bỏ thêm được phần tử nào. Mỗi lượt, duyệt chỉ số {{i}} từ 0; thử danh sách **bỏ đúng một phần tử** ở vị trí {{i}} (giữ nguyên thứ tự các phần tử còn lại); nếu bản bỏ đó **vẫn vi phạm** property thì chấp nhận nó làm ứng viên mới và **quay lại duyệt từ đầu**; nếu bỏ hết mọi phần tử đều làm property đúng thì dừng và trả về danh sách hiện tại.
- Không bao giờ sửa danh sách input: luôn tạo bản copy trước khi bỏ phần tử.
- Kết quả trả về là {{List<Integer>}} (không bọc {{Optional}}) và phải **còn vi phạm** property, trừ khi input rỗng.

Gợi ý debug: property "{{tổng nhỏ hơn 10}}" áp vào {{[1, 2, 3, 4, 5]}} phải thu về {{[3, 4, 5]}}.`,
      starter: `class Prop {
    static Optional<List<Integer>> forAll(long seed, int trials, Function<Random, List<Integer>> gen, Predicate<List<Integer>> property) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<Integer> shrink(List<Integer> counterexample, Predicate<List<Integer>> property) {
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
    static List<Integer> ints(int... v) {
        List<Integer> out = new ArrayList<>();
        for (int x : v) out.add(x);
        return out;
    }
    static int sum(List<Integer> xs) {
        int s = 0;
        for (int x : xs) s += x;
        return s;
    }
    static List<Integer> randomList(Random r) {
        int n = r.nextInt(13);                          // 0..12 phan tu
        List<Integer> out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(r.nextInt(41) - 20);   // -20..20
        return out;
    }
    static boolean hasEven(List<Integer> xs) {
        for (int x : xs) if (x % 2 == 0) return true;
        return false;
    }
    static boolean violates(List<Integer> xs, Predicate<List<Integer>> property) {
        try { return !property.test(xs); }
        catch (Throwable t) { return true; }
    }
    public static void main(String[] args) {
        check("property that always holds yields empty and runs exactly trials times", () -> {
            int[] calls = { 0 };
            Optional<List<Integer>> got = Prop.forAll(7L, 25, r -> { calls[0]++; return ints(1, 2, 3); }, xs -> true);
            eq(Optional.empty(), got);
            eq(25, calls[0]);
        });
        check("shrink trims [1..5] to the minimal list whose sum still breaks 10", () -> {
            eq(ints(3, 4, 5), Prop.shrink(ints(1, 2, 3, 4, 5), xs -> sum(xs) < 10));
        });
        check("shrink never grows the list and keeps relative order", () -> {
            eq(ints(2, 1), Prop.shrink(ints(5, 4, 3, 2, 1), xs -> sum(xs) < 3));
        });
        check("forAll stops at the FIRST failing sample and returns it shrunk", () -> {
            int[] calls = { 0 };
            Optional<List<Integer>> got = Prop.forAll(1L, 20,
                r -> { calls[0]++; return calls[0] >= 4 ? ints(7) : ints(1, 2, 3); },
                xs -> !xs.contains(7));
            eq(Optional.of(ints(7)), got);
            eq(4, calls[0]);
        });
        check("seeded generator finds a counterexample and shrinking reduces it to one element", () -> {
            Optional<List<Integer>> got = Prop.forAll(42L, 200, Main::randomList, xs -> !hasEven(xs));
            if (got.isEmpty()) throw new AssertionError("seed 42 với 200 trial phải sinh được số chẵn");
            eq(1, got.get().size());
            int v = got.get().get(0);
            if (v % 2 != 0) throw new AssertionError("phan tu con lai van phai lam property sai: " + v);
        });
        check("a predicate that throws counts as a violation and the shrunk case still throws", () -> {
            Optional<List<Integer>> got = Prop.forAll(3L, 5, r -> ints(1, 2, 3), xs -> {
                if (xs.size() == 3) throw new IllegalStateException("bug gia lap");
                return true;
            });
            eq(Optional.of(ints(1, 2, 3)), got);
        });
        check("trial i uses new Random(seed + i)", () -> {
            List<Integer> got = new ArrayList<>();
            Prop.forAll(100L, 4, r -> { got.add(r.nextInt()); return ints(1); }, xs -> true);
            List<Integer> want = new ArrayList<>();
            for (int i = 0; i < 4; i++) want.add(new Random(100L + i).nextInt());
            eq(want, got);
        });
        check("shrunk counterexample still violates the property for many seeds", () -> {
            for (long seed = 1L; seed <= 12L; seed++) {
                Optional<List<Integer>> got = Prop.forAll(seed, 60, Main::randomList, xs -> sum(xs) < -100);
                if (got.isPresent() && !violates(got.get(), xs -> sum(xs) < -100))
                    throw new AssertionError("shrink trả về case ĐÃ đúng: seed " + seed + " " + got.get());
            }
        });
        check("forAll rejects non-positive trials", () -> {
            try { Prop.forAll(1L, 0, r -> ints(), xs -> true); throw new AssertionError("phai nem IllegalArgumentException"); }
            catch (IllegalArgumentException expected) { /* ok */ }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Prop {
    static Optional<List<Integer>> forAll(long seed, int trials, Function<Random, List<Integer>> gen, Predicate<List<Integer>> property) {
        if (trials <= 0) throw new IllegalArgumentException("trials must be positive");
        for (int trial = 0; trial < trials; trial++) {
            List<Integer> sample = gen.apply(new Random(seed + trial));
            if (!violates(sample, property)) continue;          // mẫu đúng: thử trial kế tiếp
            return Optional.of(shrink(sample, property));       // mẫu sai đầu tiên: thu gọn rồi báo
        }
        return Optional.empty();
    }

    static List<Integer> shrink(List<Integer> counterexample, Predicate<List<Integer>> property) {
        List<Integer> cur = new ArrayList<>(counterexample);
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int i = 0; i < cur.size(); i++) {
                List<Integer> cand = new ArrayList<>(cur);
                cand.remove(i);
                if (violates(cand, property)) {                 // vẫn sai -> giữ bản ngắn hơn
                    cur = cand;
                    changed = true;
                    break;                                      // quay lại đầu danh sách
                }
            }
        }
        return cur;
    }

    static boolean violates(List<Integer> xs, Predicate<List<Integer>> property) {
        try { return !property.test(xs); }
        catch (Throwable t) { return true; }                    // exception cung la vi pham
    }
}`,
      hints: [
        'forAll: vòng {{for (int trial = 0; trial < trials; trial++)}}, sinh mẫu bằng {{gen.apply(new Random(seed + trial))}}; nếu mẫu vi phạm thì {{return Optional.of(shrink(mau, property));}} ngay — đừng chạy tiếp.',
        'Viết helper {{violates(xs, property)}} bọc {{try/catch}}: {{property.test}} ném lỗi cũng tính là vi phạm, vì bug thật thường lộ ra bằng exception chứ không phải false.',
        'shrink: copy sang {{new ArrayList<>(cur)}} rồi {{cand.remove(i)}} ({{remove(int)}} theo chỉ số), kiểm tra {{violates(cand, property)}}; chấp nhận thì gán {{cur = cand}} và {{break}} để bắt đầu lại lượt duyệt.',
        'Điều kiện dừng là {{changed == false}}, tức không bỏ được phần tử nào nữa mà vẫn sai. Vì mỗi bước chấp nhận làm kích thước giảm 1, vòng lặp luôn dừng.',
      ],
      explain: `**Ý nghĩa hai method.** {{forAll}} là bộ bốc mẫu: mỗi trial một {{Random}} tạo từ {{seed + trial}}, nên cả phiên chạy tái hiện được bằng đúng một con số. Nó dừng ở mẫu sai đầu tiên vì mục tiêu của PBT là **tìm một bug**, không phải đếm bug — báo càng sớm càng rẻ. {{shrink}} là bộ lọc: nó chỉ được phép dùng lại chính property đã phát hiện lỗi, nhờ vậy "case tôi báo cho bạn vẫn làm test đỏ" luôn đúng.

**Vì sao phải bọc {{try/catch}}.** Nếu {{property.test}} ném {{NullPointerException}} mà bạn để nó thoát ra, harness sập ngay tại đó và bạn mất counterexample — trong khi exception đó chính là bug. PBT thật (jqwik, Hypothesis) cũng coi exception là falsified rồi mới shrink.

**Vì sao copy trước khi bỏ.** {{List.of(1, 2, 3)}}, {{Arrays.asList}} và {{Collections.unmodifiableList}} đều ném {{UnsupportedOperationException}} khi gọi {{remove}}, và việc sửa input làm mất bản gốc cần in ra trong báo cáo.

**Vì sao kết quả {{[3, 4, 5]}} mà không phải tổ hợp "to nhất"**. Thuật toán bỏ phần tử từ trái sang và chấp nhận ngay khi được, nên nó bị kéo về phía đuôi danh sách. Đây là tính chất của mọi bộ shrink tham lam: **kết quả xác định nhưng không đảm bảo tối ưu toàn cục**. Đó cũng là lý do thư viện thật cho phép nhiều hướng shrink (bỏ phần tử, giảm giá trị, đổi kích thước cửa sổ) rồi chọn cái nhỏ nhất theo một thước đo.

**Bốn lỗi người viết hay mắc**:
- Shrinking bằng cách gọi lại {{gen}}: bạn đang tìm mẫu khác, không thu nhỏ mẫu cũ, và mất khả năng tái hiện.
- Dùng property phụ thuộc {{Random}} hoặc thời gian: cùng một danh sách mà lúc sai lúc đúng, shrinker dừng ở một case thực ra đã pass — báo cáo sai sự thật.
- Quên kiểm tra "ứng viên có còn hợp lệ không": với property chỉ định nghĩa trên input không rỗng, bỏ phần tử cuối cùng tạo input ngoài miền và vô hiệu hoá toàn bộ kết luận.
- Sửa bug mà không đóng băng phản ví dụ: hãy thêm {{[3, 4, 5]}} thành một example test có tên mô tả bug, vì PBT thường chỉ chạy ở một pipeline nhất định.

**Sau bài này**, đọc lại báo cáo PBT thật bạn sẽ nhận ra ba phần: falsified sample (mẫu gốc), shrunken sample (kết quả của đúng thuật toán bạn vừa viết), và seed (chìa khoá chạy lại).`,
    },
  ],
  check: [
    {
      q: 'Shrinking trong property-based testing là gì?',
      options: [
        'Giảm số trial để chạy CI nhanh hơn',
        'Tự động tìm biến thể nhỏ hơn của phản ví dụ, miễn tính chất vẫn bị vi phạm',
        'Chạy lại test với một seed khác cho tới khi xanh',
        'Xoá bớt assertion để test đỡ nhạy cảm với refactor',
      ],
      answer: 1,
      explain: `Shrinking bắt đầu từ một mẫu đã làm property sai, rồi thử các biến thể "nhỏ hơn" (ít phần tử hơn, giá trị nhỏ hơn) và giữ lại biến thể nào vẫn sai. Nó không liên quan tới số trial, không đổi seed (đổi seed là tìm mẫu khác), và càng không phải bỏ assertion.`,
    },
    {
      q: 'Property của bạn phát biểu "với mọi đơn hàng có items không rỗng, tổng tiền bằng tổng từng dòng". Shrinker nào dưới đây là đúng?',
      options: [
        'Bỏ hết phần tử để đưa về danh sách rỗng cho gọn',
        'Bỏ từng phần tử một, nhưng chỉ giữ lại biến thể khi kết quả vẫn là danh sách khác rỗng và vẫn vi phạm property',
        'Sinh một mẫu mới ngẫu nhiên cho tới khi gặp mẫu một phần tử',
        'Giảm giá trị mọi dòng về 0, kể cả khi làm tổng tiền thành 0',
      ],
      answer: 1,
      explain: `Mọi ứng viên đưa ra thử phải còn nằm trong miền mà property cam kết — ở đây là {{items}} khác rỗng. Bỏ sạch phần tử tạo input ngoài miền, nên "vẫn sai" chỉ là giả. Sinh mẫu mới là việc của generator, không phải shrinking. Giảm giá trị về 0 có thể phá luôn tính chất gây lỗi (bug chỉ lộ khi tổng vượt ngưỡng).`,
    },
    {
      q: 'Vì sao {{property.test}} ném exception phải được coi là "vi phạm" thay vì để exception thoát ra khỏi harness?',
      options: [
        'Vì Java không cho phép {{Predicate}} ném exception',
        'Vì bug thật thường lộ ra bằng exception; nếu để nó thoát, harness sập trước khi kịp thu gọn và bạn mất phản ví dụ',
        'Vì exception luôn là lỗi của generator, không phải của code được test',
        'Vì shrinker cần exception để biết nên dừng lại',
      ],
      answer: 1,
      explain: `{{NullPointerException}}, {{IndexOutOfBoundsException}} chính là tín hiệu bug phổ biến nhất. Harness phải biến nó thành "mẫu này vi phạm", rồi shrink để tìm mẫu nhỏ nhất vẫn ném lỗi. Java cho phép lambda ném {{RuntimeException}}; {{Predicate}} không khai báo checked exception nên bạn phải tự bọc {{try/catch}}.`,
    },
    {
      q: 'Sau khi PBT tìm ra phản ví dụ tối giản và bạn sửa xong bug, việc nên làm tiếp theo là gì?',
      options: [
        'Xoá property vì nó đã hoàn thành nhiệm vụ',
        'Thêm chính phản ví dụ đó vào bộ example test như một regression test có tên mô tả bug',
        'Tăng số trial lên 100.000 để chắc chắn bug không quay lại',
        'Tắt shrinking để báo cáo ngắn hơn',
      ],
      answer: 1,
      explain: `PBT thường không chạy ở mọi pipeline và mỗi lần chạy chỉ xét một tập mẫu ngẫu nhiên theo seed. Example test cố định mới là thứ bảo đảm bug không quay lại. Tăng trial lên 100.000 làm CI chậm mà không chắc bắt lại đúng case đó; tắt shrinking thì báo cáo lại trở về dạng khó debug.`,
    },
  ],
  related: ['testing-015', 'testing-009'],
  tags: ['property-based testing', 'shrinking', 'counterexample', 'seed', 'jqwik', 'test harness'],
},
{
  id: 'lesson-testing-007',
  track: 'testing',
  order: 7,
  title: 'Mutation testing tự viết: biết suite của bạn thật sự bắt được bao nhiêu lỗi',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được vì sao line coverage 100% vẫn có thể là một suite yếu, và mutation score đo cái gì',
    'Hiểu mutant, toán tử sinh mutant (PIT), mutant tương đương và vì sao không bao giờ đạt 100%',
    'Tự viết được bộ tính mutation score từ một bảng test case và một danh sách mutant',
    'Biết cách dùng kết quả mutant còn sống để chọn đúng điểm biên cần thêm test, thay vì thêm test ngẫu nhiên',
  ],
  body: `**Tóm tắt:** Coverage trả lời câu hỏi "**dòng code này đã chạy chưa**". Mutation testing trả lời câu hỏi khó hơn nhiều: "**nếu chỗ này có lỗi nhỏ, test của bạn có phát hiện ra không**". Cách làm: người ta tự động tạo ra các bản copy của code với đúng một chỗ bị phá (gọi là **mutant** — "đột biến"), chạy nguyên suite test trên từng bản, và đếm tỉ lệ bản bị test bắt quả tang. Tỉ lệ đó là **mutation score**. Suite chỉ xanh vì code chạy qua một dòng mà không hề asserts điều gì ở dòng đó thì điểm này sẽ tố cáo ngay.

### Ba khái niệm cần nắm trước
| Thuật ngữ | Nghĩa | Ví dụ |
|---|---|---|
| Mutant | Bản code bị thay **đúng một** chi tiết nhỏ | {{kg <= 5}} đổi thành {{kg <= 6}} |
| Killed | Có ít nhất một test cho kết quả khác kỳ vọng trên bản mutant (test đỏ) | test {{kg = 6}} mong đợi 23 nhưng mutant trả 20 → đỏ |
| Survived | Chạy hết suite mà mutant vẫn "không bị bắt" → suite của bạn mù ở chỗ đó | mutant chỉ khác nhau ở {{kg > 47}}, suite không có case nào |
| Equivalent mutant | Mutant thay đổi cú pháp nhưng **hành vi giống hệt** bản gốc, nên không test nào diệt được | {{kg <= 5}} viết lại thành {{kg < 6}} (với số nguyên thì như nhau) |

### Vì sao coverage là thước đo dễ bị "ăn gian"
Một test đi qua hết các nhánh của {{fee(kg)}} nhưng chỉ assert một trường hợp duy nhất vẫn đạt line coverage rất cao: mọi dòng đều đã chạy. Coverage không phân biệt "dòng này chạy và được kiểm tra" với "dòng này chạy và kết quả bị vứt đi". Đây chính là khoảng trống mà mutation testing lấp: nó **đánh giá test bằng cách tấn công code**, chứ không đánh giá code bằng cách đếm test.

### PIT phá code như thế nào
PIT (và các công cụ tương đương) đọc bytecode của class, rồi áp một danh sách **toán tử đột biến** (mutation operators). Mỗi lần áp lên một vị trí, nó sinh ra một mutant, chạy suite, ghi lại killed hay survived. Các toán tử hay gặp nhất:

| Nhóm toán tử | Thay đổi | Bắt được loại lỗi gì |
|---|---|---|
| ConditionalsBoundary | {{<=}} → {{<}}, {{>=}} → {{>}} | off-by-one ở điều kiện, rất hay gặp |
| NegateConditionals | phủ định điều kiện, đổi liên từ {{&&}} thành quan hệ hoặc | quên nhánh, điều kiện viết sai |
| Math | {{+}} → {{-}}, {{*}} → {{/}} | sai công thức tính tiền, tính phí |
| ReturnVals | trả {{0}}, {{1}}, {{null}}, trả giá trị ngược | quên trả kết quả, trả sai biến |
| Increments | {{i++}} → {{i--}}, đổi bước nhảy | sai vòng lặp, sai chỉ số |
| VoidMethodCall | xoá một lời gọi không trả giá trị | quên lưu, quên publish, quên gửi mail |
| RemoveConditional / WrapReturnValue | bỏ hẳn một chốt kiểm tra | validation bị lược bỏ |

Điểm mạnh nhất của nhóm ConditionalsBoundary là đúng vào loại bug rẻ nhất mà đắt nhất về hậu quả: **sai một đơn vị ở biên**. Con người viết test hay bỏ qua biên vì biên trông "hiển nhiên đúng".

### Đi tay một lần với hàm phí vận chuyển
Đặc tả (đơn vị: nghìn đồng), dùng làm ví dụ suốt bài:

~~~java
static int fee(int kg) {
    if (kg <= 0) return -1;                              // input không hợp lệ
    int base;
    if (kg <= 5) base = 20;                              // kiện nhẹ: phí cố định
    else if (kg <= 20) base = 20 + 3 * (kg - 5);         // từ kg thứ 6: 3/kg
    else base = 65 + 5 * (kg - 20);                      // từ kg thứ 21: 5/kg
    return base > 200 ? 200 : base;                      // áp trần 200
}
~~~

Bốn mutant và cách diệt chúng:

| Mutant | Thay đổi | Input nào diệt được | Kết quả đúng | Kết quả mutant |
|---|---|---|---|---|
| negative_guard | {{kg <= 0}} → {{kg < 0}} | {{kg = 0}} | -1 | 20 |
| cheap_rate | {{3 * (kg - 5)}} → {{2 * (kg - 5)}} | {{kg = 6}} | 23 | 22 |
| heavy_slope | {{5 * (kg - 20)}} → {{5 * (kg - 21)}} | {{kg = 21}} | 70 | 65 |
| cap_removed | bỏ dòng áp trần | {{kg = 48}} | 200 | 205 |

Nhận xét quan trọng: **bốn case diệt được cả bốn mutant**, và mỗi case nằm sát một biên của đặc tả (0, 6, 21, 48). Thêm 40 case ở giữa các khoảng cũng không diệt thêm được mutant nào. Đây là lý do mutation score cải thiện bằng **tư duy biên**, không bằng số lượng test.

Một mutant thứ năm, ví dụ viết {{kg <= 5}} thành {{kg < 6}}: với số nguyên, hai điều kiện cho kết quả giống nhau với **mọi** input, nên không tồn tại test nào diệt được nó. Đó là **equivalent mutant**, và nó là lý do người ta không đặt gate "mutation score = 100%": một phần mutant về nguyên tắc là không diệt được, và cố đuổi theo 100% thường chỉ sinh ra test vô nghĩa.

### Tính score: công thức và cách đọc
~~~java
static double score(int[][] cases, Map<String, IntUnaryOperator> mutants) {
    if (mutants.isEmpty()) return 0.0;
    int killed = 0;
    for (IntUnaryOperator m : mutants.values()) {
        boolean caught = false;
        for (int[] c : cases) {
            if (m.applyAsInt(c[0]) != c[1]) { caught = true; break; }   // khác kỳ vọng = bị diệt
        }
        if (caught) killed++;
    }
    return (double) killed / mutants.size();
}
~~~

Cách diễn giải con số, theo kinh nghiệm thực tế:
- **Dưới ~50%**: suite của bạn chủ yếu chạy code chứ không kiểm tra code. Coverage cao tới đâu cũng vô nghĩa.
- **50–75%**: luồng chính được kiểm tra, các biên và đường lỗi thì không. Đây là vùng của đa số team chưa từng nhìn mutation score.
- **75–90%**: khá tốt; phần còn sống thường nằm ở code phòng thủ ít quan trọng hoặc mutant tương đương.
- **Trên ~90% cho một module lõi** (tính tiền, tính phí, parse, quyền): đáng để giữ và đặt gate. Với module CRUD dày đặc getter/setter, điểm thấp hơn là bình thường.

Trong CI, người ta đặt gate **per-module** và **on new code** (chỉ đo mutant thuộc dòng thay đổi, kiểu "mutation score của diff"), vì chạy toàn bộ repo trên mỗi PR thì rất chậm: mỗi mutant là một lần chạy lại toàn bộ suite của các test liên quan. PIT có tính năng chọn test theo class để cắt giảm.

### Bẫy hay gặp
- **Chạy mutation trên toàn repo mỗi PR**: hàng chục nghìn mutant nhân với thời gian chạy suite → không khả thi. Hãy chọn module lõi, chạy theo diff, hoặc chạy đêm.
- **Nhầm mutant còn sống với bug thật**: mutant còn sống nói "test không phân biệt được hai hành vi", không nói "code đang sai". Việc cần làm là thêm test, không phải sửa code.
- **Đổi kỳ vọng của test cho khớp mutant**: nếu bạn viết sai kỳ vọng, bạn có thể "diệt" mutant bằng cách cho test đỏ trên code đúng. Muốn an toàn, mutant phải được đánh giá bằng suite có kỳ vọng lấy từ **đặc tả**, không phải từ output của code.
- **Ép 100%**: dẫn tới test cho getter, test cho branch không thể xảy ra, và tranh luận nội bộ về mutant tương đương.
- **Bỏ qua mutant xoá lời gọi (VoidMethodCall)**: đây thường là bug nguy hiểm nhất — quên publish event, quên ghi audit log — và cũng là thứ dễ bị assert-less test bỏ qua.
- **Không đo lại khi refactor**: mutant sinh từ bytecode, refactor làm đổi vị trí và số lượng mutant; hãy chạy theo module và theo dõi **xu hướng** điểm hơn là con số tuyệt đối.

> Senior tip: coi mutation score là công cụ **chẩn đoán thiết kế test**, không phải chỉ số KPI để thi đua. Ba chỗ tôi luôn soi mutant còn sống: điều kiện biên ({{<=}}/{{>=}}), giá trị trả về mặc định, và lời gọi bị xoá. Nếu mutant survive ở đúng chỗ bạn vừa có incident production, đó là bằng chứng cụ thể nhất để thuyết phục team thêm test và đặt gate — nó thuyết phục hơn nhiều so với "coverage của mình mới 60%". Và đừng bao giờ báo cáo mutation score mà không kèm số mutant còn sống thuộc nhóm tương đương, vì con số trần 100% là lời hứa giả.

### Ví dụ đời thực: fee tính tiền hở một đơn vị ở biên
Một service tính phí vận chuyển có điều kiện {{kg <= 5}} thì phí cố định 20.000, từ kg thứ 6 cộng thêm 3.000 mỗi kg. Mutation testing sinh mutant {{kg <= 6}} và **không test nào diệt được nó**: suite không có case nào ở {{kg = 6}}. Điều đó không có nghĩa production đang sai, mà nghĩa là nếu ngày mai ai đó sửa điều kiện thành {{kg <= 6}} (hoặc copy nhầm logic sang service khác), CI vẫn xanh và hệ thống sẽ thu 20.000 thay vì 23.000 cho đơn 6 kg — mỗi đơn hụt 3.000, nhân vài nghìn đơn mỗi ngày. Team thêm đúng một case {{fee(6) == 23}}; mutant bị diệt và mutation score của module phí từ 60% lên 90%. Bài học: mutant còn sống là **lỗ hổng của suite**, không phải bằng chứng code sai — nhưng nó chỉ đúng chỗ code dễ bị người khác làm sai nhất, tức là biên.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'coverage 100% nhưng vẫn có bug?', tôi sẽ nói: coverage chỉ đo code đã chạy, không đo kết quả có được kiểm tra. Ví dụ: test đi qua dòng if (kg <= 5) base = 20 nhưng chỉ assert một trường hợp duy nhất — coverage vẫn 100%. Mutation testing lấp khoảng trống này: tạo ra các bản copy của code với đúng một chỗ bị phá (mutant), chạy suite trên từng bản, đếm tỉ lệ bị test bắt được. Mutant kg <= 5 → kg <= 6 survive nghĩa là suite không phân biệt được hai hành vi — cần thêm test ở kg = 6. Score dưới 50%: suite chủ yếu chạy code. 50–75%: luồng chính được kiểm tra. 75–90%: khá tốt. Trên 90% cho module lõi: đáng để đặt gate. Mutant tương đương (ví dụ kg <= 5 ↔ kg < 6 với số nguyên) không thể diệt được — đó là giới hạn lý thuyết, không ai đặt gate 100%."

### Liên hệ phỏng vấn
Câu kinh điển: "Bao nhiêu coverage là đủ? Vì sao coverage cao vẫn còn bug?" — ứng viên tốt sẽ nói ngay: coverage đo **code có chạy**, không đo **kết quả có được kiểm tra**, rồi đưa ví dụ mutant off-by-one mà suite vẫn xanh, và nhắc mutation testing như câu trả lời. Câu thứ hai: "Bạn đưa mutation testing vào team thế nào?" — trả lời: bắt đầu ở module tính tiền/phí, chạy theo diff trên PR hoặc chạy đêm, đặt threshold vừa phải (70–80%), xử lý mutant còn sống bằng cách thêm test biên, và chấp nhận một tỉ lệ mutant tương đương. Bài tập dưới đây cho bạn tự viết bộ tính score để sau này bạn đọc báo cáo PIT mà không cần ai giải thích.`,
  exercises: [
    {
      title: 'Viết bộ tính mutation score và tự soạn bộ test diệt hết mutant',
      prompt: `Đặc tả hàm phí vận chuyển {{int fee(int kg)}} (nghìn đồng), số nguyên {{kg}}:
- {{kg <= 0}}: đầu vào không hợp lệ → trả {{-1}}.
- {{1 <= kg <= 5}}: phí cố định {{20}}.
- {{6 <= kg <= 20}}: {{20 + 3 * (kg - 5)}}.
- {{kg >= 21}}: {{65 + 5 * (kg - 20)}}.
- Sau khi tính, nếu kết quả **lớn hơn** 200 thì trả {{200}} (áp trần; kết quả đúng 200 không bị đổi).

Ví dụ: {{fee(0) = -1}}, {{fee(1) = 20}}, {{fee(5) = 20}}, {{fee(6) = 23}}, {{fee(10) = 35}}, {{fee(20) = 65}}, {{fee(21) = 70}}, {{fee(47) = 200}}, {{fee(48) = 200}}, {{fee(100) = 200}}.

Viết ba method trong class {{Mutation}}. Một mutant ở đây là một hàm {{IntUnaryOperator}} (int → int) cài đặt một **phiên bản sai** của {{fee}}; bảng mutant được test truyền vào, bạn không cần biết tên hay cách cài đặt của chúng.

**1. {{score(cases, mutants)}}** — {{cases}} là mảng các {{int[]}} dạng {{input, expected}}, với {{expected}} là giá trị **đúng theo đặc tả**. Một mutant **bị diệt** nếu tồn tại ít nhất một case mà {{mutant.applyAsInt(input) != expected}}. Trả về {{(double) killed / mutants.size()}}; nếu {{mutants}} rỗng trả về {{0.0}}.

**2. {{survivors(cases, mutants)}}** — trả về **khoá (tên)** của những mutant **không** bị diệt, sắp xếp tăng dần theo bảng chữ cái (dùng {{Collections.sort}}). Bảng rỗng → danh sách rỗng.

**3. {{killerCases()}}** — tự bạn soạn bộ case cho đặc tả trên; mỗi phần tử là một mảng {{int[]}} hai số, số đầu là {{kg}}, số sau là giá trị đúng của {{fee(kg)}}. Yêu cầu:
- từ 4 đến 12 case, các giá trị {{kg}} **đôi một khác nhau**;
- mọi {{expected}} phải **đúng đặc tả** (test sẽ kiểm từng case bằng một cài đặt chuẩn);
- bộ case phải diệt được **mọi mutant mà test đưa ra, trừ duy nhất một mutant tương đương** (mutant chỉ đổi cách viết, hành vi giống hệt bản gốc). Gợi ý: mutant sinh ra bằng các toán tử quen thuộc của PIT — nới/thu hẹp biên {{<=}}, đổi hệ số của {{kg}}, bỏ chốt kiểm tra {{kg <= 0}}, bỏ phép áp trần, đổi khoảng trừ trong công thức. Hãy nghĩ tới **các điểm biên của từng khoảng** thay vì thêm case ngẫu nhiên.

Bạn có thể thêm helper private tuỳ ý. Không in ra stdout; test đọc trực tiếp giá trị trả về.`,
      starter: `class Mutation {
    static int[][] killerCases() {
        throw new UnsupportedOperationException("TODO");
    }

    static double score(int[][] cases, Map<String, IntUnaryOperator> mutants) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> survivors(int[][] cases, Map<String, IntUnaryOperator> mutants) {
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
    static void near(double got, double want) {
        if (Math.abs(got - want) > 1e-9) throw new AssertionError("expected " + want + " got " + got);
    }
    // Cài đặt CHUẨN theo đặc tả — oracle để kiểm kỳ vọng của người học
    static int fee(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    // --- 6 mutant diệt được + 1 mutant tương đương (không thể diệt) ---
    static int negativeGuard(int kg) {
        if (kg < 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    static int tier1Upper(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 6) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    static int tier2Upper(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 21) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    static int cheapRate(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 20) base = 20 + 2 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    static int heavySlope(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 21);
        return base > 200 ? 200 : base;
    }
    static int capRemoved(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg <= 5) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base;
    }
    static int equivalentRewrite(int kg) {
        if (kg <= 0) return -1;
        int base;
        if (kg < 6) base = 20;
        else if (kg <= 20) base = 20 + 3 * (kg - 5);
        else base = 65 + 5 * (kg - 20);
        return base > 200 ? 200 : base;
    }
    static Map<String, IntUnaryOperator> all() {
        Map<String, IntUnaryOperator> m = new HashMap<>();
        m.put("cap_removed", Main::capRemoved);
        m.put("cheap_rate", Main::cheapRate);
        m.put("heavy_slope", Main::heavySlope);
        m.put("negative_guard", Main::negativeGuard);
        m.put("tier1_upper", Main::tier1Upper);
        m.put("tier2_upper", Main::tier2Upper);
        m.put("equivalent_rewrite", Main::equivalentRewrite);
        return m;
    }
    public static void main(String[] args) {
        check("killer cases follow the specification and are 4..12 distinct inputs", () -> {
            int[][] cases = Mutation.killerCases();
            if (cases.length < 4) throw new AssertionError("can toi thieu 4 case, hien co " + cases.length);
            if (cases.length > 12) throw new AssertionError("toi da 12 case, hien co " + cases.length);
            Set<Integer> inputs = new HashSet<>();
            for (int[] c : cases) {
                if (c.length != 2) throw new AssertionError("moi case phai la {kg, expected}");
                if (!inputs.add(c[0])) throw new AssertionError("trung input kg=" + c[0]);
                eq(c[1], fee(c[0]));
            }
        });
        check("killer cases kill every mutant except the equivalent one", () -> {
            eq(List.of("equivalent_rewrite"), Mutation.survivors(Mutation.killerCases(), all()));
            near(6.0 / 7.0, Mutation.score(Mutation.killerCases(), all()));
        });
        check("score is the fraction of mutants killed by at least one case", () -> {
            near(1.0 / 7.0, Mutation.score(new int[][] { { 10, 35 } }, all()));
            near(0.0, Mutation.score(new int[][] { { 1, 20 }, { 10, 35 }, { 100, 200 } },
                Map.of("equivalent_rewrite", Main::equivalentRewrite)));
            near(1.0, Mutation.score(new int[][] { { 10, 35 } }, Map.of("cheap_rate", Main::cheapRate)));
        });
        check("a mutant that only differs beyond the cap is killed only by an input beyond the cap", () -> {
            Map<String, IntUnaryOperator> m = new HashMap<>();
            m.put("cap_removed", Main::capRemoved);
            m.put("cheap_rate", Main::cheapRate);
            int[][] cases = { { 5, 20 }, { 48, 200 } };
            eq(List.of("cheap_rate"), Mutation.survivors(cases, m));
            eq(0.5, Mutation.score(cases, m));
        });
        check("survivors are sorted alphabetically by mutant name", () -> {
            List<String> surv = Mutation.survivors(new int[][] { { 1, 20 }, { 21, 70 } }, all());
            eq(List.of("cap_removed", "cheap_rate", "equivalent_rewrite", "negative_guard", "tier1_upper"), surv);
        });
        check("empty mutant table yields zero score and no survivors", () -> {
            eq(0.0, Mutation.score(new int[][] { { 1, 20 } }, new HashMap<>()));
            eq(List.of(), Mutation.survivors(new int[][] { { 1, 20 } }, new HashMap<>()));
        });
        check("an equivalent mutant survives every possible suite", () -> {
            Map<String, IntUnaryOperator> m = Map.of("equivalent_rewrite", Main::equivalentRewrite);
            int[][] many = new int[60][];
            for (int i = 0; i < 60; i++) many[i] = new int[] { i, fee(i) };
            near(0.0, Mutation.score(many, m));
            eq(List.of("equivalent_rewrite"), Mutation.survivors(many, m));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Mutation {
    static int[][] killerCases() {
        // 0 diệt negative_guard, 6 diệt tier1_upper + cheap_rate,
        // 21 diệt tier2_upper + heavy_slope, 48 diệt cap_removed, 1 phủ khoảng nhẹ.
        return new int[][] { { 0, -1 }, { 1, 20 }, { 6, 23 }, { 21, 70 }, { 48, 200 } };
    }

    static double score(int[][] cases, Map<String, IntUnaryOperator> mutants) {
        if (mutants.isEmpty()) return 0.0;
        int killed = 0;
        for (IntUnaryOperator m : mutants.values()) if (isKilled(m, cases)) killed++;
        return (double) killed / mutants.size();
    }

    static List<String> survivors(int[][] cases, Map<String, IntUnaryOperator> mutants) {
        List<String> out = new ArrayList<>();
        for (Map.Entry<String, IntUnaryOperator> e : mutants.entrySet()) {
            if (!isKilled(e.getValue(), cases)) out.add(e.getKey());
        }
        Collections.sort(out);
        return out;
    }

    static boolean isKilled(IntUnaryOperator mutant, int[][] cases) {
        for (int[] c : cases) if (mutant.applyAsInt(c[0]) != c[1]) return true;   // khác kỳ vọng = bug lộ ra
        return false;
    }
}`,
      hints: [
        'Liệt kê mọi **điểm biên** của đặc tả rồi lấy một input ngay tại biên và một input ngay sau biên: 0/1 (chốt hợp lệ), 5/6 (hết khoảng phí cố định), 20/21 (đổi hệ số), 47/48 (ngưỡng áp trần). Bộ 5 case {{0}}, {{1}}, {{6}}, {{21}}, {{48}} là đủ diệt hết mutant diệt được.',
        'score: đếm mutant có **ít nhất một** case mà {{mutant.applyAsInt(c[0]) != c[1]}}, chia cho {{mutants.size()}}; nhớ xử lý bảng rỗng để không chia 0.',
        'survivors: viết helper {{isKilled(mutant, cases)}} dùng chung cho cả hai method, rồi thêm key của những mutant chưa bị diệt và {{Collections.sort(out)}} để thứ tự không phụ thuộc {{HashMap}}.',
        'Đừng thêm 12 case ở giữa các khoảng: chúng không diệt thêm mutant nào và làm bài sai yêu cầu "tối thiểu mà phủ biên".',
      ],
      explain: `**Bộ case và mutant nào bị case nào diệt.**

~~~text
kg = 0   -> -1   diet negative_guard  (mutant cho 20 o kg = 0)
kg = 1   -> 20   phu khoang pham co dinh (khong diet them mutant nao, de phong mutant kieu "base = 21")
kg = 6   -> 23   diet tier1_upper (mutant tra 20) VA cheap_rate (mutant tra 22)
kg = 21  -> 70   diet tier2_upper (mutant tra 68) VA heavy_slope (mutant tra 65)
kg = 48  -> 200  diet cap_removed   (mutant tra 205)
=> 6/7 mutant bi diet. con equivalent_rewrite khong the bi diet.
~~~

Một case diệt được nhiều mutant, và ngược lại nhiều case cùng diệt một mutant: điều quan trọng là **có mặt ở đúng vùng hành vi đổi**, không phải số lượng.

**Vì sao mutant tương đương không thể diệt.** {{kg <= 5}} và {{kg < 6}} cho cùng kết quả với mọi số nguyên, nên với mọi input, output của mutant bằng output của bản gốc, nên không kỳ vọng đúng nào có thể khác nó. Đây là giới hạn **lý thuyết** của mutation testing (bài toán dừng — halting problem — khiến không công cụ nào tự chứng minh hai chương trình tương đương), vì vậy điểm 100% là bất khả thi về bản chất, không phải do bạn viết test kém. PIT đánh dấu một số mutant kiểu này bằng cách chạy thêm test và so hành vi, nhưng phần lớn vẫn phải để con người kết luận.

**Cách tính điểm và lý do dùng {{double}}.** killed/total là tỉ lệ, nên phải cast một phía về double: {{(double) killed / mutants.size()}}. Quên cast là lỗi kinh điển khiến score luôn bằng 0. Bảng mutant rỗng phải quy ước là 0.0 để không ném {{ArithmeticException}}/NaN.

**Vì sao {{survivors}} phải sort.** {{HashMap}} không đảm bảo thứ tự; nếu trả về theo thứ tự bảng, test của bạn sẽ đỏ/xanh phụ thuộc hash — chính xác là loại flaky mà bài học về test determinism đã cảnh báo. Trong công cụ thật, danh sách mutant còn sống luôn được sắp xếp và nhóm theo class để người đọc so sánh được giữa hai lần chạy.

**Sai lầm thường gặp khi làm bài này**:
- Chọn {{kg = 30}} thay vì {{kg = 21}}: {{heavy_slope}} sai ở mọi {{kg >= 21}} nên 30 vẫn diệt được, nhưng {{tier2_upper}} thì không — nó chỉ khác đúng tại {{kg = 21}}. Bài học: mutant boundary **chỉ sống ở một điểm**.
- Quên {{kg = 0}}: toàn bộ nhóm "chốt kiểm tra đầu vào" sống sót, và đây là nhóm liên quan tới validation — thứ hay lọt production nhất.
- Quên vượt ngưỡng áp trần: mutant bỏ {{Math.min}}/bỏ phép so sánh trần chỉ lộ ra khi có input lớn.
- Viết test bằng cách in output của code rồi copy làm kỳ vọng (characterization theo kiểu mù): như vậy mutant nào cũng "bị diệt" trên giấy vì kỳ vọng luôn đúng theo code, và điểm của bạn thành vô nghĩa. Kỳ vọng phải lấy từ **đặc tả**.

**Áp dụng vào dự án thật.** PIT hoạt động trên bytecode nên không thể tự viết trong một bài Java thuần như trên; bài này giữ nguyên **mô hình tính điểm** của PIT, còn phần sinh mutant thì ta đưa sẵn dưới dạng hàm. Khi đọc báo cáo PIT, bạn chỉ cần làm đúng ba việc như vừa làm: xác định mutant còn sống thuộc nhóm toán tử nào, tìm điểm biên mà nó khác bản gốc, thêm case có kỳ vọng lấy từ đặc tả.`,
    },
  ],
  check: [
    {
      q: 'Mutation score của một suite được tính như thế nào?',
      options: [
        'Số dòng code được chạy chia cho tổng số dòng',
        'Số mutant bị test phát hiện chia cho tổng số mutant được sinh ra',
        'Số test pass chia cho tổng số test',
        'Số lỗi production chia cho số lần deploy',
      ],
      answer: 1,
      explain: `Mỗi mutant là một bản code bị phá đúng một chi tiết; mutant "bị diệt" khi có ít nhất một test cho kết quả khác kỳ vọng trên bản đó. Score là tỉ lệ mutant bị diệt. Dòng được chạy là line coverage; test pass là tỉ lệ pass; lỗi production không liên quan tới cách tính này.`,
    },
    {
      q: 'Suite của bạn đạt line coverage 100% nhưng mutation score 45%. Kết luận đúng nhất?',
      options: [
        'Code quá phức tạp, cần tách nhỏ class',
        'Nhiều dòng đã chạy nhưng kết quả không được kiểm tra; test thiếu assert ở các điểm biên và giá trị trả về',
        'Cần viết thêm test chạy lại đúng các đường đã phủ',
        'Công cụ PIT sinh ra mutant sai nên điểm thấp',
      ],
      answer: 1,
      explain: `Coverage chỉ nói code đã được thực thi. 55% mutant còn sống nghĩa là phá nửa số chi tiết nhỏ trong code mà không test nào đỏ — dấu hiệu điển hình của test đi qua code mà không assert kết quả. Tách class hay thêm test trùng đường đều không giải quyết; mutant được sinh theo danh sách toán tử cố định, không phải nguyên nhân.`,
    },
    {
      q: 'Một mutant không bao giờ bị diệt, dù bạn thêm bao nhiêu test đúng đặc tả. Đó là gì?',
      options: [
        'Mutant tương đương: hành vi giống hệt bản gốc nên không kỳ vọng nào phân biệt được',
        'Mutant ở dòng chưa được phủ sóng',
        'Một bug thật trong code gốc',
        'Test đang chạy sai chế độ strict stubs',
      ],
      answer: 0,
      explain: `Ví dụ {{kg <= 5}} viết lại thành {{kg < 6}}: với số nguyên, hai điều kiện luôn cho cùng kết quả. Đây là giới hạn lý thuyết của mutation testing, nên không ai đặt gate 100%. Dòng chưa phủ sóng thì có thể bị diệt bằng một test phủ nó; mutant không liên quan tới bug gốc hay strict stubs.`,
    },
    {
      q: 'Vì sao không nên chạy toàn bộ repo bằng mutation testing trên mỗi PR?',
      options: [
        'Vì PIT không hỗ trợ Spring Boot',
        'Vì mỗi mutant cần chạy lại các test liên quan, tổng chi phí có thể lên hàng giờ; nên đo theo module lõi và theo diff',
        'Vì mutation score luôn giảm khi code tăng',
        'Vì mutant sinh ra từ bytecode sẽ làm hỏng build',
      ],
      answer: 1,
      explain: `Chi phí bằng số mutant nhân với thời gian chạy suite, nên thực tế là chọn module trọng yếu, chỉ đo phần code thay đổi, hoặc chạy hàng đêm. PIT chạy được trên project Spring Boot; score không tự giảm theo quy mô; mutant được tạo trong bộ nhớ của quá trình phân tích và không ảnh hưởng build thật.`,
    },
  ],
  related: ['testing-006', 'testing-029'],
  tags: ['mutation testing', 'PIT', 'mutation score', 'equivalent mutant', 'boundary', 'coverage'],
},
{
  id: 'lesson-testing-008',
  track: 'testing',
  order: 8,
  title: 'Test double trong thực tế: fake database, stub HTTP client, mock event publisher',
  level: 'senior',
  minutes: 35,
  goals: [
    'Áp dụng fake, stub, mock cho các phụ thuộc thực tế: database, REST client, message queue',
    'Biết khi nào chọn fake in-memory thay vì Testcontainers, và ngược lại',
    'Viết fake repository hỗ trợ query linh hoạt, stub HTTP trả về kịch bản lỗi, mock publisher verify payload',
  ],
body: `**Tóm tắt:** Ba phụ thuộc phổ biến trong microservice — repository (có trạng thái), REST gateway (stateless) và event publisher (tác dụng phụ không quan sát được) — cần ba loại test double khác nhau: fake in-memory cho repository để test cả chuỗi đọc-ghi, stub cho gateway để cung cấp dữ liệu đầu vào theo kịch bản, và mock cho publisher để verify topic, key và payload. Chọn đúng loại để test không gắn chặt vào chi tiết cài đặt.

### Tóm tắt
Bài học 001 đã giới thiệu khái niệm test double. Bài này đi sâu vào {{ba phụ thuộc phổ biến nhất trong microservice Java}}: database (repository), REST client (gateway), và message queue (event publisher). Mỗi loại có đặc thấu riêng khiến lựa chọn test double khác nhau: repository có trạng thái phức tạp -> fake; gateway chỉ cần trả dữ liệu -> stub; publisher có tác dụng phụ không quan sát được qua state -> mock.

### Repository: fake in-memory vs Testcontainers
Repository là collaborator {{có trạng thái (stateful)}}: đọc, ghi, cập nhật, xóa, và các truy vấn có quan hệ (join, filter, phân trang). Mock repository bằng Mockito thường dẫn đến over-specification: test biết quá chi tiết service gọi {{findById}} rồi {{save}} hay {{saveAll}}, khiến refactor thành batch insert làm test đỏ. {{Fake repository in-memory}} giải quyết vấn đề này bằng cách cài đặt interface với {{HashMap}}/{{ConcurrentHashMap}}, giữ đúng nghĩa nghiệp vụ (upsert, tìm kiếm, phân trang).

~~~java
interface OrderRepository {
    Optional<Order> findById(String id);
    List<Order> findByCustomer(String customerId, Pageable page);
    void save(Order order);
    void delete(String id);
}

class FakeOrderRepository implements OrderRepository {
    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final Map<String, List<String>> customerIndex = new ConcurrentHashMap<>();

    @Override public Optional<Order> findById(String id) {
        return Optional.ofNullable(orders.get(id));
    }

    @Override public List<Order> findByCustomer(String customerId, Pageable page) {
        List<String> ids = customerIndex.getOrDefault(customerId, List.of());
        return ids.stream()
            .map(orders::get)
            .filter(Objects::nonNull)
            .skip(page.getOffset())
            .limit(page.getPageSize())
            .toList();
    }

    @Override public void save(Order order) {
        orders.put(order.id(), order);
        List<String> ids = customerIndex.computeIfAbsent(order.customerId(), k -> new CopyOnWriteArrayList<>());
        if (!ids.contains(order.id())) ids.add(order.id());   // upsert: không thêm trùng id
    }

    @Override public void delete(String id) {
        Order removed = orders.remove(id);
        if (removed != null) {
            customerIndex.computeIfAbsent(removed.customerId(), k -> new CopyOnWriteArrayList<>()).remove(id);
        }
    }
}
~~~

Fake như trên cho phép test {{toàn bộ luồng}}: tạo đơn -> tìm đơn -> cập nhật trạng thái -> tìm theo khách hàng có phân trang. Test không quan tâm service gọi method nào mấy lần, chỉ kiểm tra kết quả cuối (state verification).

{{Khi nào dùng Testcontainers?}} Khi logic phụ thuộc SQL phức tạp: CTE, window function, lock row ({{SELECT FOR UPDATE}}), migration schema, hay transaction isolation. Fake không mô phỏng được hành vi database thật ở mức này. Quy tắc thực dụng: {{logic repository đơn giản -> fake; SQL phức tạp/transaction -> Testcontainers}}. Đừng dùng Testcontainers cho mọi test repository — nó chậm 10–100x so với fake.

### HTTP Gateway: stub kịch bản thành công và lỗi
Gateway gọi dịch vụ bên ngoài (thanh toán, ký quỹ, tra cước) là collaborator {{stateless}}: mỗi request độc lập, không có trạng thái cục bộ. Stub là lựa chọn tự nhiên: trả về response định trước cho từng kịch bản.

~~~java
interface PaymentGateway {
    PaymentResult charge(PaymentRequest request);
}

class StubPaymentGateway implements PaymentGateway {
    private final Map<String, PaymentResult> scenarios = new HashMap<>();
    private final Map<String, Throwable> errors = new HashMap<>();

    StubPaymentGateway success(String orderId, PaymentResult result) {
        scenarios.put(orderId, result); return this;
    }
    StubPaymentGateway failure(String orderId, Throwable error) {
        errors.put(orderId, error); return this;
    }

    @Override public PaymentResult charge(PaymentRequest request) {
        if (errors.containsKey(request.orderId())) throw new RuntimeException(errors.get(request.orderId()));
        return scenarios.getOrDefault(request.orderId(), new PaymentResult("DECLINED", "stub-default"));
    }
}
~~~

Test dùng stub để mô phỏng: thanh toán thành công, thẻ hết hạn, gateway timeout, gateway trả 500. {{Điểm quan trọng}}: stub không verify — nó chỉ cung cấp dữ liệu đầu vào cho service. Việc service có gọi gateway hay không, gọi bao nhiêu lần, được kiểm tra ở integration test hoặc contract test (Pact), không phải unit test.

### Event Publisher: mock để verify payload
Khi service publish event lên Kafka/RabbitMQ, tác dụng phụ {{không quan sát được qua state}} của service. Bạn không thể đọc lại "đã publish gì" từ database hay return value. Đây là lúc {{mock (hoặc spy)}} cần thiết: verify rằng payload đúng, topic đúng, key đúng.

~~~java
interface EventPublisher {
    void publish(String topic, String key, Object payload);
}

class MockEventPublisher implements EventPublisher {
    private final List<PublishedEvent> events = new ArrayList<>();

    @Override public void publish(String topic, String key, Object payload) {
        events.add(new PublishedEvent(topic, key, payload));
    }

    List<PublishedEvent> events() { return new ArrayList<>(events); }   // bản sao mutable: test clear() không làm hỏng state thật

    record PublishedEvent(String topic, String key, Object payload) {}
}
~~~

Test verify: {{events.size() == 1}}, {{events.get(0).topic().equals("order.created")}}, {{events.get(0).payload()}} chứa {{orderId}} và {{totalAmount}}. {{Chỉ verify những gì là hợp đồng nghiệp vụ}} (topic, key, field bắt buộc). Đừng verify toàn bộ object payload — nó làm test brittle khi thêm field mới.

### So sánh ba cách trong một service
Xét {{OrderService}} đặt hàng: gọi {{PaymentGateway}} (stub), lưu {{OrderRepository}} (fake), publish {{OrderCreatedEvent}} (mock).

~~~java
class OrderService {
    private final OrderRepository repo;
    private final PaymentGateway gateway;
    private final EventPublisher publisher;

    OrderService(OrderRepository repo, PaymentGateway gateway, EventPublisher publisher) {
        this.repo = repo; this.gateway = gateway; this.publisher = publisher;
    }

    Order placeOrder(OrderRequest req) {
        PaymentResult pay;
        try {
            pay = gateway.charge(new PaymentRequest(req.orderId(), req.amount()));   // gateway lỗi -> PaymentFailedException
        } catch (RuntimeException e) {
            throw new PaymentFailedException(e.getCause() != null ? e.getCause().toString() : e.toString());
        }
        if (!pay.success()) throw new PaymentFailedException(pay.status());
        Order order = new Order(req.orderId(), req.customerId(), req.items(), pay.transactionId());
        repo.save(order);
        publisher.publish("order.created", order.id(), new OrderCreatedEvent(order.id(), order.total()));
        return order;
    }
}
~~~

Test unit cho service này:
- {{Fake repo}}: seed data, gọi {{placeOrder}}, kiểm tra {{repo.findById}} trả về order đúng, {{repo.findByCustomer}} có phân trang đúng.
- {{Stub gateway}}: cấu hình {{success(orderId, new PaymentResult("APPROVED", "txn-123"))}}, kiểm tra service không ném exception; cấu hình {{failure(orderId, new TimeoutException())}}, kiểm tra service ném {{PaymentFailedException}}.
- {{Mock publisher}}: sau khi {{placeOrder}} thành công, verify {{publisher.events()}} có đúng 1 event, topic {{order.created}}, payload chứa {{orderId}}.

Đây là {{state verification cho repo}} (xem kết quả lưu), {{stub cho gateway}} (cung cấp input), {{interaction verification cho publisher}} (verify payload). Mỗi loại test double phục vụ đúng mục đích của nó.

### Bẫy production hay gặp
- {{Fake repository thiếu index}}: {{findByCustomer}} duyệt toàn bộ map O(n) -> test pass nhưng production chậm. Luôn mô phỏng index quan trọng trong fake.
- {{Stub gateway trả dữ liệu cùng cho mọi request}}: không phân biệt orderId -> test không bắt được bug service truyền sai orderId. Stub phải route theo key nghiệp vụ (orderId, customerId).
- {{Mock publisher verify toàn bộ payload JSON}}: thêm field {{createdAt}} làm test đỏ. Chỉ verify field bắt buộc, dùng JSON path hoặc matcher linh hoạt.
- {{Dùng Mockito when(...).thenReturn(...) cho repository}}: test biết service gọi {{findById}} trước {{save}}. Refactor sang {{saveAll}} làm test đỏ. Dùng fake để tránh over-specification.
- {{Chia sẻ fake có trạng thái giữa các test}}: test A tạo order, test B đọc order đó -> flaky. Mỗi test tự tạo fake mới hoặc có {{clear()}}.

> Senior tip: trong codebase thật, hay tạo abstract base test class cung cấp {{FakeOrderRepository}}, {{StubPaymentGateway}}, {{MockEventPublisher}} đã cấu hình sẵn các kịch bản phổ biến. Dev mới chỉ cần extend và override kịch bản cần thiết. Điều này thống nhất cách test, giảm boilerplate, và khi review dễ dàng hơn vì pattern test double rõ ràng.

### Ví dụ đời thực: service đặt hàng với 3 dependency
Một OrderService cần ba đối tượng: OrderRepository, PaymentGateway và EventPublisher. Team đầu tiên mock cả ba bằng Mockito: {{when(repo.findById(...))}}, {{when(gateway.charge(...))}}, {{verify(publisher)}}. Khi refactor service — đổi từ {{save}} sang {{saveAll}} cho gọn, thêm cache ở gateway — hàng chục test đỏ dù hành vi nghiệp vụ không đổi. Sau khi thay thế: FakeOrderRepository (in-memory, test được cả luồng tạo-cập nhật-tìm kiếm-theo-khách-hàng-phân-trang), StubPaymentGateway (route theo orderId: success, timeout, declined), MockEventPublisher (verify topic order.created, key và payload). Test không còn gắn chặt vào số lần gọi method, và CI từ 15 phút xuống 5 phút.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test service có 3 dependency thế nào?', tôi sẽ nói: phân loại từng phụ thuộc theo tính chất. OrderRepository có trạng thái đọc-ghi — dùng fake in-memory để test cả chuỗi tạo-cập nhật-tìm kiếm mà không cần verify số lần gọi method. PaymentGateway là stateless, chỉ cần cung cấp dữ liệu đầu vào theo scenario — dùng stub: success, timeout, declined. EventPublisher publish event, tác dụng phụ không quan sát được qua state — dùng mock verify topic, key và field bắt buộc trong payload. Tránh over-mocking: nếu một class cần mock 6 dependency, vấn đề không nằm ở test mà ở thiết kế class đang ôm quá nhiều trách nhiệm."

### Liên hệ phỏng vấn
Interviewer đưa một service có 3 dependency: {{UserRepository}}, {{EmailClient}}, {{NotificationPublisher}}. Hỏi: "Bạn test service này thế nào? Tại sao chọn fake/stub/mock cho mỗi cái?".
Trả lời tốt: "UserRepository có trạng thái đọc-ghi -> fake in-memory để test luồng tạo-cập nhật-tìm kiếm mà không khóa vào số lần gọi. EmailClient chỉ gửi email, không trả dữ liệu quan trọng -> stub trả success/failure theo kịch bản. NotificationPublisher publish event, tác dụng phụ không nhìn thấy qua state -> mock verify topic và payload. Cách này tránh over-mocking: test không quan tâm service gọi repository mấy lần, chỉ quan tâm kết quả cuối và event publish đúng hợp đồng."`,
  exercises: [
    {
      title: 'Fake repository, stub gateway, mock publisher cho OrderService',
      prompt: `Cho sẵn interface {{OrderRepository}}, {{PaymentGateway}}, {{EventPublisher}}, class {{Order}}, {{OrderRequest}}, {{PaymentResult}}, {{OrderCreatedEvent}} và {{OrderService}}. Hãy hoàn thiện ba test double:

1. {{FakeOrderRepository}}: lưu order trong {{ConcurrentHashMap<String, Order>}} theo {{id}}. Hỗ trợ {{findById}}, {{findByCustomer(customerId, pageable)}}, {{save}} (upsert), {{delete}}. {{findByCustomer}} trả danh sách order của customer có phân trang (dùng {{pageable.getOffset()}} và {{pageable.getPageSize()}}).
2. {{StubPaymentGateway}}: cho phép cấu hình kịch bản thành công và thất bại theo {{orderId}}. {{charge(request)}} trả {{PaymentResult}} nếu cấu hình thành công, ném {{RuntimeException}} wrap lỗi nếu cấu hình thất bại, mặc định trả {{DECLINED}}.
3. {{MockEventPublisher}}: ghi lại mỗi event publish vào list; {{events()}} trả bản sao list để test verify.

Test sẽ kiểm tra: fake repository upsert đúng, tìm kiếm có phân trang; stub gateway route theo orderId; mock publisher ghi đúng payload.`,
      starter: `import java.util.*;
import java.util.concurrent.*;

interface OrderRepository {
    Optional<Order> findById(String id);
    List<Order> findByCustomer(String customerId, Pageable pageable);
    void save(Order order);
    void delete(String id);
}

interface PaymentGateway {
    PaymentResult charge(PaymentRequest request);
}

interface EventPublisher {
    void publish(String topic, String key, Object payload);
}

record Pageable(int offset, int pageSize) {
    int getOffset() { return offset; }
    int getPageSize() { return pageSize; }
}

record PaymentRequest(String orderId, long amount) {}
record PaymentResult(String status, String transactionId) {
    boolean success() { return "APPROVED".equals(status); }
}

record Order(String id, String customerId, List<String> items, String transactionId) {
    long total() { return items.size() * 1000L; }
}

record OrderRequest(String orderId, String customerId, List<String> items, long amount) {}

record OrderCreatedEvent(String orderId, long totalAmount) {}

class FakeOrderRepository implements OrderRepository {
    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final Map<String, List<String>> customerIndex = new ConcurrentHashMap<>();

    @Override public Optional<Order> findById(String id) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public List<Order> findByCustomer(String customerId, Pageable pageable) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public void save(Order order) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public void delete(String id) {
        throw new UnsupportedOperationException("TODO");
    }
}

class StubPaymentGateway implements PaymentGateway {
    private final Map<String, PaymentResult> successCases = new HashMap<>();
    private final Map<String, Throwable> failureCases = new HashMap<>();

    StubPaymentGateway success(String orderId, PaymentResult result) {
        successCases.put(orderId, result);
        return this;
    }

    StubPaymentGateway failure(String orderId, Throwable error) {
        failureCases.put(orderId, error);
        return this;
    }

    @Override public PaymentResult charge(PaymentRequest request) {
        throw new UnsupportedOperationException("TODO");
    }
}

class MockEventPublisher implements EventPublisher {
    private final List<PublishedEvent> events = new ArrayList<>();

    record PublishedEvent(String topic, String key, Object payload) {}

    @Override public void publish(String topic, String key, Object payload) {
        throw new UnsupportedOperationException("TODO");
    }

    List<PublishedEvent> events() {
        throw new UnsupportedOperationException("TODO");
    }
}

class OrderService {
    private final OrderRepository repo;
    private final PaymentGateway gateway;
    private final EventPublisher publisher;

    OrderService(OrderRepository repo, PaymentGateway gateway, EventPublisher publisher) {
        this.repo = repo;
        this.gateway = gateway;
        this.publisher = publisher;
    }

    Order placeOrder(OrderRequest req) {
        PaymentResult pay = gateway.charge(new PaymentRequest(req.orderId(), req.amount()));
        if (!pay.success()) throw new PaymentFailedException(pay.status());
        Order order = new Order(req.orderId(), req.customerId(), req.items(), pay.transactionId());
        repo.save(order);
        publisher.publish("order.created", order.id(), new OrderCreatedEvent(order.id(), order.total()));
        return order;
    }
}

class PaymentFailedException extends RuntimeException {
    PaymentFailedException(String message) { super(message); }
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
    static void assertTrue(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }

    public static void main(String[] args) {
        check("fake repository upsert and find by id", () -> {
            FakeOrderRepository repo = new FakeOrderRepository();
            Order o1 = new Order("ORD-1", "CUST-A", List.of("item1"), "txn-1");
            repo.save(o1);
            eq(o1, repo.findById("ORD-1").orElseThrow());
            Order o1Updated = new Order("ORD-1", "CUST-A", List.of("item1", "item2"), "txn-2");
            repo.save(o1Updated);
            eq(2, repo.findById("ORD-1").orElseThrow().items().size());
            eq(Optional.empty(), repo.findById("missing"));
        });

        check("fake repository findByCustomer with pagination", () -> {
            FakeOrderRepository repo = new FakeOrderRepository();
            repo.save(new Order("ORD-1", "CUST-A", List.of("a"), "t1"));
            repo.save(new Order("ORD-2", "CUST-A", List.of("b"), "t2"));
            repo.save(new Order("ORD-3", "CUST-A", List.of("c"), "t3"));
            repo.save(new Order("ORD-4", "CUST-B", List.of("d"), "t4"));
            List<Order> page1 = repo.findByCustomer("CUST-A", new Pageable(0, 2));
            eq(2, page1.size());
            eq("ORD-1", page1.get(0).id());
            eq("ORD-2", page1.get(1).id());
            List<Order> page2 = repo.findByCustomer("CUST-A", new Pageable(2, 2));
            eq(1, page2.size());
            eq("ORD-3", page2.get(0).id());
            eq(1, repo.findByCustomer("CUST-B", new Pageable(0, 10)).size());
            eq(0, repo.findByCustomer("CUST-C", new Pageable(0, 10)).size());
        });

        check("fake repository delete removes from both maps", () -> {
            FakeOrderRepository repo = new FakeOrderRepository();
            repo.save(new Order("ORD-1", "CUST-A", List.of("a"), "t1"));
            repo.delete("ORD-1");
            eq(Optional.empty(), repo.findById("ORD-1"));
            eq(0, repo.findByCustomer("CUST-A", new Pageable(0, 10)).size());
        });

        check("stub gateway routes by orderId for success and failure", () -> {
            StubPaymentGateway gateway = new StubPaymentGateway()
                .success("ORD-1", new PaymentResult("APPROVED", "txn-123"))
                .failure("ORD-2", new TimeoutException("gateway timeout"));
            eq(new PaymentResult("APPROVED", "txn-123"), gateway.charge(new PaymentRequest("ORD-1", 1000)));
            try { gateway.charge(new PaymentRequest("ORD-2", 1000)); throw new AssertionError("phai nem"); }
            catch (RuntimeException e) { assertTrue(e.getCause() instanceof TimeoutException, "cause phai la TimeoutException"); }
            eq(new PaymentResult("DECLINED", "stub-default"), gateway.charge(new PaymentRequest("ORD-3", 1000)));
        });

        check("mock publisher records events and returns copy", () -> {
            MockEventPublisher publisher = new MockEventPublisher();
            publisher.publish("order.created", "ORD-1", new OrderCreatedEvent("ORD-1", 5000));
            publisher.publish("order.updated", "ORD-1", new OrderCreatedEvent("ORD-1", 6000));
            List<MockEventPublisher.PublishedEvent> events = publisher.events();
            eq(2, events.size());
            eq("order.created", events.get(0).topic());
            eq("ORD-1", events.get(0).key());
            eq(5000L, ((OrderCreatedEvent) events.get(0).payload()).totalAmount());
            // verify returned list is a copy
            events.clear();
            eq(2, publisher.events().size());
        });

        check("order service happy path uses all three doubles correctly", () -> {
            FakeOrderRepository repo = new FakeOrderRepository();
            StubPaymentGateway gateway = new StubPaymentGateway()
                .success("ORD-100", new PaymentResult("APPROVED", "txn-999"));
            MockEventPublisher publisher = new MockEventPublisher();
            OrderService service = new OrderService(repo, gateway, publisher);
            OrderRequest req = new OrderRequest("ORD-100", "CUST-X", List.of("item1", "item2"), 2000);
            Order order = service.placeOrder(req);
            eq("ORD-100", order.id());
            eq("txn-999", order.transactionId());
            eq(order, repo.findById("ORD-100").orElseThrow());
            List<MockEventPublisher.PublishedEvent> events = publisher.events();
            eq(1, events.size());
            eq("order.created", events.get(0).topic());
            eq("ORD-100", events.get(0).key());
            eq(2000L, ((OrderCreatedEvent) events.get(0).payload()).totalAmount());
        });

        check("order service payment failure throws and does not save or publish", () -> {
            FakeOrderRepository repo = new FakeOrderRepository();
            StubPaymentGateway gateway = new StubPaymentGateway()
                .failure("ORD-200", new TimeoutException("timeout"));
            MockEventPublisher publisher = new MockEventPublisher();
            OrderService service = new OrderService(repo, gateway, publisher);
            OrderRequest req = new OrderRequest("ORD-200", "CUST-Y", List.of("item1"), 1000);
            try { service.placeOrder(req); throw new AssertionError("phai nem PaymentFailedException"); }
            catch (PaymentFailedException expected) { /* ok */ }
            eq(Optional.empty(), repo.findById("ORD-200"));
            eq(0, publisher.events().size());
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
import java.util.concurrent.*;

interface OrderRepository {
    Optional<Order> findById(String id);
    List<Order> findByCustomer(String customerId, Pageable pageable);
    void save(Order order);
    void delete(String id);
}

interface PaymentGateway {
    PaymentResult charge(PaymentRequest request);
}

interface EventPublisher {
    void publish(String topic, String key, Object payload);
}

record Pageable(int offset, int pageSize) {
    int getOffset() { return offset; }
    int getPageSize() { return pageSize; }
}

record PaymentRequest(String orderId, long amount) {}
record PaymentResult(String status, String transactionId) {
    boolean success() { return "APPROVED".equals(status); }
}

record Order(String id, String customerId, List<String> items, String transactionId) {
    long total() { return items.size() * 1000L; }
}

record OrderRequest(String orderId, String customerId, List<String> items, long amount) {}

record OrderCreatedEvent(String orderId, long totalAmount) {}

class FakeOrderRepository implements OrderRepository {
    private final Map<String, Order> orders = new ConcurrentHashMap<>();
    private final Map<String, List<String>> customerIndex = new ConcurrentHashMap<>();

    @Override public Optional<Order> findById(String id) {
        return Optional.ofNullable(orders.get(id));
    }

    @Override public List<Order> findByCustomer(String customerId, Pageable pageable) {
        List<String> ids = customerIndex.getOrDefault(customerId, List.of());
        return ids.stream()
            .map(orders::get)
            .filter(Objects::nonNull)
            .skip(pageable.getOffset())
            .limit(pageable.getPageSize())
            .toList();
    }

    @Override public void save(Order order) {
        orders.put(order.id(), order);
        List<String> ids = customerIndex.computeIfAbsent(order.customerId(), k -> new CopyOnWriteArrayList<>());
        if (!ids.contains(order.id())) ids.add(order.id());   // upsert: khong them trung id
    }

    @Override public void delete(String id) {
        Order removed = orders.remove(id);
        if (removed != null) {
            customerIndex.computeIfAbsent(removed.customerId(), k -> new CopyOnWriteArrayList<>()).remove(id);
        }
    }
}

class StubPaymentGateway implements PaymentGateway {
    private final Map<String, PaymentResult> successCases = new HashMap<>();
    private final Map<String, Throwable> failureCases = new HashMap<>();

    StubPaymentGateway success(String orderId, PaymentResult result) {
        successCases.put(orderId, result);
        return this;
    }

    StubPaymentGateway failure(String orderId, Throwable error) {
        failureCases.put(orderId, error);
        return this;
    }

    @Override public PaymentResult charge(PaymentRequest request) {
        if (failureCases.containsKey(request.orderId())) {
            throw new RuntimeException(failureCases.get(request.orderId()));
        }
        return successCases.getOrDefault(request.orderId(), new PaymentResult("DECLINED", "stub-default"));
    }
}

class MockEventPublisher implements EventPublisher {
    private final List<PublishedEvent> events = new ArrayList<>();

    record PublishedEvent(String topic, String key, Object payload) {}

    @Override public void publish(String topic, String key, Object payload) {
        events.add(new PublishedEvent(topic, key, payload));
    }

    List<PublishedEvent> events() {
        return new ArrayList<>(events);
    }
}

class OrderService {
    private final OrderRepository repo;
    private final PaymentGateway gateway;
    private final EventPublisher publisher;

    OrderService(OrderRepository repo, PaymentGateway gateway, EventPublisher publisher) {
        this.repo = repo;
        this.gateway = gateway;
        this.publisher = publisher;
    }

    Order placeOrder(OrderRequest req) {
        PaymentResult pay;
        try {
            pay = gateway.charge(new PaymentRequest(req.orderId(), req.amount()));
        } catch (RuntimeException e) {
            throw new PaymentFailedException(e.getCause() != null ? e.getCause().toString() : e.toString());
        }
        if (!pay.success()) throw new PaymentFailedException(pay.status());
        Order order = new Order(req.orderId(), req.customerId(), req.items(), pay.transactionId());
        repo.save(order);
        publisher.publish("order.created", order.id(), new OrderCreatedEvent(order.id(), order.total()));
        return order;
    }
}

class PaymentFailedException extends RuntimeException {
    PaymentFailedException(String message) { super(message); }
}`,
      hints: [
        'Fake repository: {{findById}} dùng {{Optional.ofNullable(orders.get(id))}}; {{save}} dùng {{orders.put(order.id(), order)}} và cập nhật {{customerIndex}} với {{computeIfAbsent}} + {{CopyOnWriteArrayList}}; {{findByCustomer}} lấy danh sách id từ index, map sang order, filter null, skip/limit theo pageable.',
        'Stub gateway: {{charge}} kiểm tra {{failureCases}} trước (ném {{RuntimeException}} wrap cause), sau đó {{successCases.getOrDefault}} với default {{DECLINED}}.',
        'Mock publisher: {{publish}} thêm vào {{ArrayList}}; {{events()}} trả {{new ArrayList<>(events)}} (bản sao mutable) để test clear() không làm hỏng state nội bộ.',
        'OrderService: gateway charge trước, nếu thất bại ném exception -> không save, không publish. Thành công thì save repo, publish event.',
      ],
      explain: `Bài tập này minh hoạ việc {{kết hợp ba loại test double trong một test service thực tế}}:

- {{FakeOrderRepository}} cho phép test toàn bộ luồng đọc-ghi-tìm kiếm có phân trang mà không cần verify số lần gọi method. Nó mô phỏng đúng nghĩa upsert và index theo customer — đây là điểm khác biệt so với stub đơn giản chỉ trả giá trị cùng.
- {{StubPaymentGateway}} cung cấp dữ liệu đầu vào cho service theo kịch bản: thành công, timeout, thẻ hết hạn. Nó không verify service có gọi hay không — đó là việc của integration test.
- {{MockEventPublisher}} verify interaction: event có được publish đúng topic, key, payload không. Đây là interaction verification cần thiết vì tác dụng phụ (publish Kafka) không quan sát được qua state của service.

{{Lỗi hay gặp}}:
- Fake repository quên cập nhật index khi {{save}}/{{delete}} -> {{findByCustomer}} trả sai.
- Stub gateway không route theo {{orderId}} -> tất cả request nhận cùng một response, không test được logic điều hướng.
- Mock publisher trả trực tiếp list nội bộ -> test vô tình {{clear()}} làm mất dữ liệu verify. Luôn trả bản sao mutable ({{new ArrayList<>(events)}}), đừng dùng {{List.copyOf}} vì list đó immutable.
- Test service quên kiểm tra trường hợp thất bại: payment fail thì không được save order và không được publish event.

{{Khi nào dùng Testcontainers thay vì fake?}} Khi repository có query phức tạp: {{SELECT FOR UPDATE}}, CTE, window function, transaction isolation, stored procedure. Fake không mô phỏng được khóa hàng, deadlock, hay plan thực thi. Rule of thumb: logic CRUD đơn giản -> fake; SQL phức tạp -> Testcontainers.`,
    },
  ],
  check: [
    {
      q: 'Khi nào nên dùng {{fake repository in-memory}} thay vì Testcontainers?',
      options: [
        'Khi query dùng CTE, window function hoặc {{SELECT FOR UPDATE}}',
        'Khi logic repository chỉ là CRUD đơn giản, tìm kiếm, phân trang',
        'Khi cần test transaction isolation level',
        'Khi schema database thay đổi thường xuyên',
      ],
      answer: 1,
      explain: `Fake in-memory phù hợp cho logic CRUD, tìm kiếm, phân trang — đủ để verify luồng nghiệp vụ nhanh và deterministic. Testcontainers dùng khi cần SQL phức tạp, lock row, isolation level, migration schema — những thứ fake không mô phỏng được. (A) và (C) là lý do dùng Testcontainers. (D) không liên quan đến lựa chọn test double.`,
    },
    {
      q: 'Tại sao {{stub HTTP gateway}} không nên verify số lần service gọi nó?',
      options: [
        'Vì stub không hỗ trợ verify',
        'Vì gateway là stateless, mỗi request độc lập; verify số lần gọi là over-specification, cản trở refactor',
        'Vì Mockito không cho verify trên stub',
        'Vì verify làm test chạy chậm',
      ],
      answer: 1,
      explain: `Gateway chỉ cung cấp dữ liệu đầu vào (stateless). Số lần gọi là chi tiết cài đặt — service có thể cache, retry, batch request. Verify số lần gọi khóa test vào implementation, làm refactor (ví dụ thêm cache) khiến test đỏ. (A) và (C) sai vì Mockito verify được trên mọi mock, kể cả mock đang đóng vai trò stub — không hề có luật nào cấm. (D) sai vì độ trễ của verify không đáng kể so với việc test gắn vào chi tiết lối gọi: cái giá phải trả là mỗi lần refactor đều làm test đỏ.`,
    },
    {
      q: 'Mock event publisher nên verify điều gì?',
      options: [
        'Toàn bộ payload JSON byte-by-byte',
        'Topic, key, và các field bắt buộc của payload (orderId, totalAmount)',
        'Số lần gọi publish phải đúng 1',
        'Thứ tự publish giữa các topic',
      ],
      answer: 1,
      explain: `Chỉ verify hợp đồng nghiệp vụ: topic đúng, key đúng, field bắt buộc có mặt. Verify toàn bộ JSON làm test brittle khi thêm field mới (createdAt, version...). Số lần gọi và thứ tự thường là chi tiết cài đặt, trừ khi hợp đồng nghiệp vụ yêu cầu "phải publish đúng 1 event order.created".`,
    },
  ],
  related: ['testing-001', 'testing-009', 'testing-010'],
  tags: ['test double', 'fake', 'stub', 'mock', 'repository', 'gateway', 'event publisher', 'Testcontainers'],
},
{
  id: 'lesson-testing-009',
  track: 'testing',
  order: 9,
  title: 'Test logic nghiệp vụ theo thời gian: token JWT, khuyến mãi giới hạn, scheduled cleanup',
  level: 'senior',
  minutes: 30,
  goals: [
    'Inject {{Clock}} vào các service quản lý token, promotion, rate limiter, scheduled job',
    'Test hết hạn token JWT, cửa sổ khuyến mãi, sliding window rate limiter bằng {{Clock.fixed}}/{{Clock.offset}}',
    'Mô phỏng thời gian trôi trong một test (advance clock) để test scheduled cleanup và retry backoff',
  ],
body: `**Tóm tắt:** Ba bài toán nghiệp vụ thực tế đều cần kiểm soát thời gian trong test: token JWT với sliding refresh window, khuyến mãi giới hạn theo múi giờ, rate limiter sliding window và job dọn token định kỳ. Giải pháp chung là tiêm {{Clock}} vào service, dùng {{Clock.fixed}}/{{Clock.offset}} để kiểm soát mốc, và {{MutableClock}} để advance thời gian trong test scheduled job — không bao giờ dùng {{Thread.sleep}}.

### Tóm tắt
Bài học 002 đã giới thiệu {{Clock}} injection cơ bản. Bài này áp dụng vào {{ba bài toán nghiệp vụ thực tế}} mà dev Senior hay gặp: {{token JWT/refresh token}} (hết hạn tuyệt đối, sliding expiry), {{khuyến mãi/flash sale}} (cửa sổ thời gian, múi giờ, DST), {{rate limiter sliding window}} và {{scheduled cleanup job}} (xóa token hết hạn, dọn dẹp session). Mục tiêu: test được mọi mốc biến mà không bao giờ {{Thread.sleep}}.

### Token JWT: access token + refresh token với sliding expiry
Hệ thống auth thường có hai loại token:
- {{Access token}}: sống ngắn (15–30 phút), dùng cho mỗi request API.
- {{Refresh token}}: sống dài (7–30 ngày), dùng để cấp access token mới. Có {{sliding expiry}}: mỗi lần dùng refresh token, hạn được gia hạn thêm một khoảng (ví dụ +7 ngày từ lúc dùng), nhưng không vượt quá max age (30 ngày).

Logic kiểm tra hết hạn cần {{Clock}} để test được sliding behaviour:

~~~java
class TokenService {
    private final Clock clock;
    private final Duration accessTtl = Duration.ofMinutes(15);
    private final Duration refreshTtl = Duration.ofDays(30);
    private final Duration slidingWindow = Duration.ofDays(7);

    TokenService(Clock clock) { this.clock = clock; }

    boolean isAccessTokenValid(Instant issuedAt) {
        return clock.instant().isBefore(issuedAt.plus(accessTtl));
    }

    boolean isRefreshTokenValid(Instant issuedAt, Instant lastUsedAt) {
        Instant now = clock.instant();
        if (now.isAfter(issuedAt.plus(refreshTtl))) return false;           // max age
        if (now.isAfter(lastUsedAt.plus(slidingWindow))) return false;      // sliding window
        return true;
    }

    Instant refreshTokenNewExpiry(Instant issuedAt, Instant lastUsedAt) {
        Instant proposed = lastUsedAt.plus(slidingWindow);   // gia hạn từ lần dùng gần nhất
        Instant maxExpiry = issuedAt.plus(refreshTtl);       // nhưng không vượt max age
        return proposed.isBefore(maxExpiry) ? proposed : maxExpiry;
    }
}
~~~

Test với {{Clock.fixed}} cho access token, {{Clock.offset}} cho refresh token sliding:
- Access token: {{Clock.fixed(issuedAt.plusMinutes(14), UTC)}} -> valid; {{Clock.fixed(issuedAt.plusMinutes(16), UTC)}} -> expired.
- Refresh token sliding: {{issuedAt = day 0}}, {{lastUsedAt = day 5}}, {{clock = day 12}} -> valid (day 5 + 7 = day 12, trước max day 30). {{clock = day 13}} -> expired (vượt sliding window). {{lastUsedAt = day 25}}, {{clock = day 32}} -> expired (vượt max age day 30).

### Khuyến mãi/Flash sale: cửa sổ thời gian, múi giờ, DST
Flash sale thường có {{startAt}} và {{endAt}} theo múi giờ nghiệp vụ (ví dụ Asia/Ho_Chi_Minh). Server có thể chạy UTC. Logic so sánh phải dùng {{ZonedDateTime}} với {{ZoneId}} cố định, **không dùng múi giờ mặc định của JVM**.

~~~java
class PromotionService {
    private final Clock clock;
    private final ZoneId businessZone = ZoneId.of("Asia/Ho_Chi_Minh");

    PromotionService(Clock clock) { this.clock = clock; }

    boolean isActive(Promotion promo) {
        ZonedDateTime now = ZonedDateTime.ofInstant(clock.instant(), businessZone);
        return !now.isBefore(promo.startAt()) && now.isBefore(promo.endAt());
    }

    Duration timeUntilStart(Promotion promo) {
        ZonedDateTime now = ZonedDateTime.ofInstant(clock.instant(), businessZone);
        if (now.isAfter(promo.startAt())) return Duration.ZERO;
        return Duration.between(now, promo.startAt());
    }
}

record Promotion(ZonedDateTime startAt, ZonedDateTime endAt) {}
~~~

Test case quan trọng:
- {{Trước startAt}}: {{Clock.fixed(startAt.minusHours(1), UTC)}} -> không active, {{timeUntilStart}} = 1 giờ.
- {{Đúng startAt}}: {{Clock.fixed(startAt, UTC)}} -> active.
- {{Giữa cửa sổ}}: active.
- {{Đúng endAt}}: {{Clock.fixed(endAt, UTC)}} -> **không active** (endAt exclusive).
- {{Sau endAt}}: không active.
- {{DST}}: múi giờ Việt Nam ({{Asia/Ho_Chi_Minh}}) không có DST — UTC+7 cố định từ 1975 — nên ở đây không có gap/overlap. Nhưng nếu promotion theo múi giờ châu Âu/Mỹ thì phải xử lý ngày chuyển giờ: ví dụ 29/3/2026 02:00 giờ {{Europe/Paris}} không tồn tại (đồng hồ nhảy từ 02:00 sang 03:00). Dùng {{ZonedDateTime}} với {{ZoneId}} để JDK tự xử lý gap/overlap.

### Rate Limiter sliding window: test burst và refill
Rate limiter cho phép N request trong cửa sổ trượt T giây. Cài đặt phổ biến: lưu timestamp các request gần nhất, loại bỏ timestamp cũ hơn {{now - window}}.

~~~java
class SlidingWindowRateLimiter {
    private final Clock clock;
    private final int maxRequests;
    private final Duration window;
    private final Deque<Instant> requests = new ConcurrentLinkedDeque<>();

    SlidingWindowRateLimiter(Clock clock, int maxRequests, Duration window) {
        this.clock = clock; this.maxRequests = maxRequests; this.window = window;
    }

    boolean tryAcquire() {
        Instant now = clock.instant();
        Instant cutoff = now.minus(window);
        requests.removeIf(ts -> ts.isBefore(cutoff));
        if (requests.size() < maxRequests) {
            requests.addLast(now);
            return true;
        }
        return false;
    }

    int currentUsage() {
        Instant cutoff = clock.instant().minus(window);
        requests.removeIf(ts -> ts.isBefore(cutoff));
        return requests.size();
    }
}
~~~

Test: {{Clock.fixed(base, UTC)}} -> {{tryAcquire()}} 5 lần -> {{currentUsage() == 5}}. {{Clock.offset(base, Duration.ofSeconds(30))}} (window = 1 phút) -> {{currentUsage() == 5}}. {{Clock.offset(base, Duration.ofMinutes(2))}} -> {{currentUsage() == 0}} (window trôi). Không cần sleep.

### Scheduled cleanup: advance clock trong test
Job dọn dẹp token hết hạn chạy mỗi giờ. Test không thể chờ 1 giờ. Giải pháp: {{mutable clock}} cho phép test advance thời gian.

~~~java
class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
    MutableClock(Instant start, ZoneId zone) { this.instant = new AtomicReference<>(start); this.zone = zone; }
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
}

class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }

    int cleanup() {
        int deleted = repo.deleteExpiredBefore(clock.instant());
        return deleted;
    }
}
~~~

Test:
1. Seed repo với 3 token: A hết hạn (expiresAt = ngày -1), B còn hạn (expiresAt = ngày +5), C còn hạn (expiresAt = ngày +25).
2. {{MutableClock}} start tại {{day 0}}.
3. Gọi {{cleanup()}} -> deleted = 1 (chỉ A có expiresAt trước day 0).
4. {{clock.advance(Duration.ofDays(10))}} -> now = day 10.
5. Gọi {{cleanup()}} -> deleted = 1 (B hết hạn ở day 5, C vẫn còn hạn).
6. Token C vẫn tồn tại.

Điều này cho phép test {{toàn bộ vòng đời scheduled job}} trong vài mili giây.

### Bẫy production hay gặp
- {{Quên inject Clock vào helper class}}: {{TokenService}} có clock nhưng {{JwtUtil.parseExpiry}} dùng {{Instant.now()}} -> test pass (helper không chạy trong test), production sai. Luôn grep {{\\.now\\(\\)}} trong code domain.
- {{So sánh ZonedDateTime bằng equals sau qua database}}: PostgreSQL {{timestamptz}} lưu microsecond, {{ZonedDateTime}} có nanosecond -> {{equals}} false. Test dùng {{Clock.fixed}} nanosecond = 0, hoặc truncate trước khi so sánh.
- {{DST gap/overlap}}: promotion theo múi giờ {{Europe/Paris}}, startAt = {{2026-03-29T02:30+01:00}} — giờ này không tồn tại (đồng hồ nhảy từ 02:00 sang 03:00). JDK sẽ adjust thành {{03:30+02:00}}. Test phải cover case này: tạo promotion với startAt trong gap, verify {{isActive}} hành vi như mong đợi.
- {{Mutable clock dùng chung giữa test}}: test A advance clock, test B thấy clock đã bị advance -> flaky. Mỗi test tự tạo {{MutableClock}} mới hoặc reset trong {{@BeforeEach}}.
- {{Rate limiter: currentUsage() không phải hàm đọc thuần}}: nó cũng prune timestamp hết hạn như {{tryAcquire}}. Kết quả trả về vẫn đúng, nhưng khi test cần kiểm tra riêng việc dọn dẹp (hay dùng chung cho cả hai đường), nên tách {{cleanupExpired(now)}} private để chỉ một chỗ sửa state.

> Senior tip: hay đặt {{ArchUnit rule}} hoặc checkstyle custom cấm {{Instant.now()}}, {{LocalDateTime.now()}}, {{LocalDate.now()}}, {{System.currentTimeMillis()}} trong package domain/service. Chỉ cho phép trong configuration bean tạo {{Clock.systemUTC()}}. Khi review PR, grep {{\\.now\\(\\)}} là thấy ngay vi phạm. Một đội trưởng giỏi coi {{Clock}} injection là {{yêu cầu bắt buộc}} cho mọi code liên quan thời gian, không phải "nice to have".

### Ví dụ đời thực: flash sale 12h trưa theo múi giờ Paris, server chạy UTC
Một flash sale bắt đầu lúc 12:00 trưa theo múi giờ Paris ({{Europe/Paris}}, có DST). Server backend chạy UTC. Ban đầu code so sánh {{LocalDate.now()}} theo timezone JVM — trên staging (UTC) test xanh, lên production (Europe/Paris) lại đỏ vì lệch múi giờ: cùng một thời điểm, {{LocalDate.now()}} ở hai nơi cho hai ngày khác nhau quanh đêm. Sau khi đổi sang {{ZonedDateTime}} với {{ZoneId.of("Europe/Paris")}} và tiêm {{Clock}}, test được viết lại: {{Clock.fixed(startAt.minusMinutes(1))}} -> inactive; {{Clock.fixed(startAt)}} -> active; {{Clock.fixed(endAt)}} -> inactive (end exclusive). Cover cả DST gap: ngày 29/3/2026, 02:30 không tồn tại (đồng hồ nhảy từ 02:00 sang 03:00) — JDK tự adjust thành 03:30+02:00, test verify {{isActive}} tại 03:29 inactive và 03:31 active.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test logic nghiệp vụ theo thời gian thế nào?', tôi nói: gom mọi mốc thời gian vào một dependency duy nhất là {{Clock}} rồi tiêm vào service — production dùng {{Clock.systemUTC()}}, test dùng {{Clock.fixed}} hoặc {{Clock.offset}}. Với token JWT tôi kiểm tra cả ba điểm: trước hết hạn, đúng hết hạn, sau hết hạn; với sliding refresh tôi kiểm tra cả cửa sổ 7 ngày lẫn max age 30 ngày. Với khuyến mãi theo múi giờ, tôi dùng {{ZonedDateTime}} với {{ZoneId}} cố định chứ không dùng timezone JVM, và test cả ngày DST gap. Với scheduled job, tôi dùng {{MutableClock}} để advance thời gian trong vài mili giây thay vì {{Thread.sleep}}. Và tôi không bao giờ để các test dùng chung một clock mutable."

### Liên hệ phỏng vấn
Interviewer hỏi: "Hệ thống có flash sale 12h trưa ngày 29/3 theo múi giờ Paris (ngày cuối tuần châu Âu chuyển DST). Server chạy UTC. Bạn test logic {{isActive}} thế nào?"
Trả lời: "Dùng {{ZonedDateTime}} với {{ZoneId.of('Europe/Paris')}} cho startAt/endAt. Inject {{Clock}} vào service. Test: {{Clock.fixed(startAt.minusMinutes(1), UTC)}} -> inactive; {{Clock.fixed(startAt, UTC)}} -> active; {{Clock.fixed(endAt, UTC)}} -> inactive (end exclusive). Cover DST gap: tạo promotion startAt = 02:30 (không tồn tại), JDK adjust sang 03:30, test verify {{isActive}} tại 03:29 inactive, 03:31 active. Không dùng {{Thread.sleep}}, không phụ thuộc múi giờ JVM."`,
  exercises: [
    {
      title: 'TokenService, PromotionService, SlidingWindowRateLimiter với Clock',
      prompt: `Cho sẵn các interface/class khung. Hãy hoàn thiện ba service:

1. {{TokenService}}: quản lý access token (TTL 15 phút) và refresh token (TTL 30 ngày, sliding window 7 ngày).
   - {{isAccessTokenValid(issuedAt)}}: true nếu {{clock.instant()}} **trước** {{issuedAt + 15 phút}}.
   - {{isRefreshTokenValid(issuedAt, lastUsedAt)}}: true nếu **cả hai** điều kiện: chưa vượt max age ({{issuedAt + 30 ngày}}) VÀ chưa vượt sliding window ({{lastUsedAt + 7 ngày}}).
   - {{refreshTokenNewExpiry(issuedAt, lastUsedAt)}}: trả {{min(lastUsedAt + 7 ngày, issuedAt + 30 ngày)}}.

2. {{PromotionService}}: kiểm tra khuyến mãi active trong cửa sổ {{[startAt, endAt)}} theo múi giờ {{Asia/Ho_Chi_Minh}}.
   - {{isActive(promo)}}: true nếu {{now}} (theo business zone) **không trước** {{startAt}} VÀ **trước** {{endAt}}.
   - {{timeUntilStart(promo)}}: {{Duration}} từ {{now}} đến {{startAt}}; nếu đã qua {{startAt}} trả {{Duration.ZERO}}.

3. {{SlidingWindowRateLimiter}}: cho phép tối đa {{maxRequests}} trong cửa sổ {{window}}.
   - {{tryAcquire()}}: loại bỏ timestamp cũ hơn {{now - window}}; nếu size < maxRequests thì thêm {{now}} và trả true, ngược lại false.
   - {{currentUsage()}}: loại bỏ timestamp cũ, trả size hiện tại.

Test sẽ dùng {{Clock.fixed}}, {{Clock.offset}}, và {{MutableClock}} (đã cung cấp) để kiểm tra các mốc biến.`,
      starter: `import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

interface TokenRepository {
    int deleteExpiredBefore(Instant cutoff);
}

class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
    MutableClock(Instant start, ZoneId zone) { this.instant = new AtomicReference<>(start); this.zone = zone; }
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
}

record Promotion(ZonedDateTime startAt, ZonedDateTime endAt) {}

class TokenService {
    private final Clock clock;
    private final Duration accessTtl = Duration.ofMinutes(15);
    private final Duration refreshTtl = Duration.ofDays(30);
    private final Duration slidingWindow = Duration.ofDays(7);

    TokenService(Clock clock) { this.clock = clock; }

    boolean isAccessTokenValid(Instant issuedAt) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isRefreshTokenValid(Instant issuedAt, Instant lastUsedAt) {
        throw new UnsupportedOperationException("TODO");
    }

    Instant refreshTokenNewExpiry(Instant issuedAt, Instant lastUsedAt) {
        throw new UnsupportedOperationException("TODO");
    }
}

class PromotionService {
    private final Clock clock;
    private final ZoneId businessZone = ZoneId.of("Asia/Ho_Chi_Minh");

    PromotionService(Clock clock) { this.clock = clock; }

    boolean isActive(Promotion promo) {
        throw new UnsupportedOperationException("TODO");
    }

    Duration timeUntilStart(Promotion promo) {
        throw new UnsupportedOperationException("TODO");
    }
}

class SlidingWindowRateLimiter {
    private final Clock clock;
    private final int maxRequests;
    private final Duration window;
    private final Deque<Instant> requests = new ConcurrentLinkedDeque<>();

    SlidingWindowRateLimiter(Clock clock, int maxRequests, Duration window) {
        this.clock = clock;
        this.maxRequests = maxRequests;
        this.window = window;
    }

    boolean tryAcquire() {
        throw new UnsupportedOperationException("TODO");
    }

    int currentUsage() {
        throw new UnsupportedOperationException("TODO");
    }
}

class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }

    int cleanup() {
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
    static void assertTrue(boolean cond, String msg) { if (!cond) throw new AssertionError(msg); }
    static void assertFalse(boolean cond, String msg) { if (cond) throw new AssertionError(msg); }

    static final ZoneId VN = ZoneId.of("Asia/Ho_Chi_Minh");
    static final Instant BASE = Instant.parse("2026-03-01T00:00:00Z");
    static Clock fixed(String instant) { return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC); }
    static Clock offset(Clock base, Duration d) { return Clock.offset(base, d); }

    public static void main(String[] args) {
        check("access token valid before 15min, invalid at and after 15min", () -> {
            TokenService svc = new TokenService(fixed("2026-03-01T00:14:00Z"));
            assertTrue(svc.isAccessTokenValid(BASE), "14 phut nen con valid");
            svc = new TokenService(fixed("2026-03-01T00:15:00Z"));
            assertFalse(svc.isAccessTokenValid(BASE), "dung 15 phut da het han");
            svc = new TokenService(fixed("2026-03-01T00:16:00Z"));
            assertFalse(svc.isAccessTokenValid(BASE), "sau 15 phut het han");
        });

        check("refresh token valid within max age and sliding window", () -> {
            Instant issued = BASE;
            Instant lastUsed = BASE.plus(Duration.ofDays(5));
            TokenService svc = new TokenService(offset(fixed(BASE.toString()), Duration.ofDays(12)));
            assertTrue(svc.isRefreshTokenValid(issued, lastUsed), "day 12: lastUsed+7=day12 (valid), issued+30=day30 (valid)");
            svc = new TokenService(offset(fixed(BASE.toString()), Duration.ofDays(13)));
            assertFalse(svc.isRefreshTokenValid(issued, lastUsed), "day 13: vuot sliding window (lastUsed+7=day12)");
            // max age test
            Instant issuedOld = BASE.minus(Duration.ofDays(31));
            Instant lastUsedRecent = BASE.plus(Duration.ofDays(1));
            svc = new TokenService(fixed(BASE.toString()));
            assertFalse(svc.isRefreshTokenValid(issuedOld, lastUsedRecent), "vuot max age 30 ngay");
        });

        check("refreshTokenNewExpiry returns min(sliding, maxAge)", () -> {
            TokenService svc = new TokenService(fixed(BASE.toString()));
            Instant issued = BASE;
            Instant lastUsed = BASE.plus(Duration.ofDays(5));
            Instant expiry = svc.refreshTokenNewExpiry(issued, lastUsed);
            eq(BASE.plus(Duration.ofDays(12)), expiry); // lastUsed+7 = day12, issued+30 = day30 -> min = day12
            // case sliding vuot max age
            Instant lastUsedLate = BASE.plus(Duration.ofDays(25));
            expiry = svc.refreshTokenNewExpiry(issued, lastUsedLate);
            eq(BASE.plus(Duration.ofDays(30)), expiry); // lastUsed+7 = day32 > day30 -> capped at max age
        });

        check("promotion active in [startAt, endAt) with business zone", () -> {
            ZonedDateTime start = ZonedDateTime.of(2026, 3, 15, 12, 0, 0, 0, VN); // 12h trua VN
            ZonedDateTime end = ZonedDateTime.of(2026, 3, 15, 14, 0, 0, 0, VN);   // 14h VN
            Promotion promo = new Promotion(start, end);
            // 11:59 VN = 04:59 UTC
            PromotionService svc = new PromotionService(fixed("2026-03-15T04:59:00Z"));
            assertFalse(svc.isActive(promo), "truoc startAt");
            eq(Duration.ofMinutes(1), svc.timeUntilStart(promo));
            // 12:00 VN = 05:00 UTC
            svc = new PromotionService(fixed("2026-03-15T05:00:00Z"));
            assertTrue(svc.isActive(promo), "dung startAt -> active");
            eq(Duration.ZERO, svc.timeUntilStart(promo));
            // 13:00 VN = 06:00 UTC
            svc = new PromotionService(fixed("2026-03-15T06:00:00Z"));
            assertTrue(svc.isActive(promo), "giua cua so");
            // 14:00 VN = 07:00 UTC -> endAt exclusive
            svc = new PromotionService(fixed("2026-03-15T07:00:00Z"));
            assertFalse(svc.isActive(promo), "dung endAt -> inactive");
            // 14:01 VN
            svc = new PromotionService(fixed("2026-03-15T07:01:00Z"));
            assertFalse(svc.isActive(promo), "sau endAt");
        });

        check("rate limiter with MutableClock refills after window passes", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            SlidingWindowRateLimiter rl = new SlidingWindowRateLimiter(clock, 2, Duration.ofMinutes(1));
            assertTrue(rl.tryAcquire(), "first acquire");
            assertTrue(rl.tryAcquire(), "second acquire");
            assertFalse(rl.tryAcquire(), "third acquire should fail");
            eq(2, rl.currentUsage());
            clock.advance(Duration.ofMinutes(2)); // window da troi
            eq(0, rl.currentUsage());
            assertTrue(rl.tryAcquire(), "acquire after window passes");
            eq(1, rl.currentUsage());
        });

        check("token cleanup job deletes expired tokens when clock advances", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            TokenRepository repo = new TokenRepository() {
                private final Map<String, Instant> tokens = new HashMap<>();
                { 
                    // t1, t2 expire at day 30 (BASE+30 days) → expired at day 31
                    // t3 expires at day 32 (BASE+32 days) → still valid at day 31
                    tokens.put("t1", BASE.plus(Duration.ofDays(30))); 
                    tokens.put("t2", BASE.plus(Duration.ofDays(30))); 
                    tokens.put("t3", BASE.plus(Duration.ofDays(32))); 
                }
                @Override public int deleteExpiredBefore(Instant cutoff) {
                    int before = tokens.size();
                    tokens.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
                    return before - tokens.size();
                }
            };
            TokenCleanupJob job = new TokenCleanupJob(repo, clock);
            eq(0, job.cleanup()); // day 0: chua token nao het han
            clock.advance(Duration.ofDays(31));
            eq(2, job.cleanup()); // day 31: 2 token het han bi xoa
            eq(1, repo.deleteExpiredBefore(Instant.MAX)); // token con lai van do
        });

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

interface TokenRepository {
    int deleteExpiredBefore(Instant cutoff);
}

class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
    MutableClock(Instant start, ZoneId zone) { this.instant = new AtomicReference<>(start); this.zone = zone; }
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
}

record Promotion(ZonedDateTime startAt, ZonedDateTime endAt) {}

class TokenService {
    private final Clock clock;
    private final Duration accessTtl = Duration.ofMinutes(15);
    private final Duration refreshTtl = Duration.ofDays(30);
    private final Duration slidingWindow = Duration.ofDays(7);

    TokenService(Clock clock) { this.clock = clock; }

    boolean isAccessTokenValid(Instant issuedAt) {
        return clock.instant().isBefore(issuedAt.plus(accessTtl));
    }

    boolean isRefreshTokenValid(Instant issuedAt, Instant lastUsedAt) {
        Instant now = clock.instant();
        if (now.isAfter(issuedAt.plus(refreshTtl))) return false;
        if (now.isAfter(lastUsedAt.plus(slidingWindow))) return false;
        return true;
    }

    Instant refreshTokenNewExpiry(Instant issuedAt, Instant lastUsedAt) {
        Instant proposed = lastUsedAt.plus(slidingWindow);
        Instant maxExpiry = issuedAt.plus(refreshTtl);
        return proposed.isBefore(maxExpiry) ? proposed : maxExpiry;
    }
}

class PromotionService {
    private final Clock clock;
    private final ZoneId businessZone = ZoneId.of("Asia/Ho_Chi_Minh");

    PromotionService(Clock clock) { this.clock = clock; }

    boolean isActive(Promotion promo) {
        ZonedDateTime now = ZonedDateTime.ofInstant(clock.instant(), businessZone);
        return !now.isBefore(promo.startAt()) && now.isBefore(promo.endAt());
    }

    Duration timeUntilStart(Promotion promo) {
        ZonedDateTime now = ZonedDateTime.ofInstant(clock.instant(), businessZone);
        if (now.isAfter(promo.startAt()) || now.isEqual(promo.startAt())) return Duration.ZERO;
        return Duration.between(now, promo.startAt());
    }
}

class SlidingWindowRateLimiter {
    private final Clock clock;
    private final int maxRequests;
    private final Duration window;
    private final Deque<Instant> requests = new ConcurrentLinkedDeque<>();

    SlidingWindowRateLimiter(Clock clock, int maxRequests, Duration window) {
        this.clock = clock;
        this.maxRequests = maxRequests;
        this.window = window;
    }

    boolean tryAcquire() {
        Instant now = clock.instant();
        Instant cutoff = now.minus(window);
        requests.removeIf(ts -> ts.isBefore(cutoff));
        if (requests.size() < maxRequests) {
            requests.addLast(now);
            return true;
        }
        return false;
    }

    int currentUsage() {
        Instant cutoff = clock.instant().minus(window);
        requests.removeIf(ts -> ts.isBefore(cutoff));
        return requests.size();
    }
}

class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }

    int cleanup() {
        return repo.deleteExpiredBefore(clock.instant());
    }
}`,
      hints: [
        'TokenService: {{isAccessTokenValid}} dùng {{clock.instant().isBefore(issuedAt.plus(accessTtl))}}. {{isRefreshTokenValid}} kiểm tra cả {{issuedAt.plus(refreshTtl)}} và {{lastUsedAt.plus(slidingWindow)}}. {{refreshTokenNewExpiry}} tính {{proposed = lastUsedAt.plus(slidingWindow)}}, {{maxExpiry = issuedAt.plus(refreshTtl)}}, trả {{proposed.isBefore(maxExpiry) ? proposed : maxExpiry}}.',
        'PromotionService: chuyển {{clock.instant()}} sang business zone bằng {{ZonedDateTime.ofInstant(instant, businessZone)}}. {{isActive}}: {{!now.isBefore(startAt) && now.isBefore(endAt)}} (endAt exclusive). {{timeUntilStart}}: nếu {{now.isAfter(startAt) || now.isEqual(startAt)}} trả {{Duration.ZERO}}, ngược lại {{Duration.between(now, startAt)}}.',
        'SlidingWindowRateLimiter: {{tryAcquire}} và {{currentUsage}} đều phải {{removeIf(ts -> ts.isBefore(now.minus(window)))}} trước khi kiểm tra/trả size. Dùng {{ConcurrentLinkedDeque}} cho thread-safe.',
        'TokenCleanupJob: chỉ cần gọi {{repo.deleteExpiredBefore(clock.instant())}}. Test dùng {{MutableClock}} advance thời gian.',
      ],
      explain: `Bài tập này áp dụng {{Clock injection}} vào ba bài toán thực tế mà dev Senior thường gặp:

**1. Token JWT với sliding refresh token**: Access token sống ngắn (stateless), refresh token sống dài nhưng có sliding window. Logic: refresh token hợp lệ nếu **chưa vượt max age (30 ngày)** VÀ **chưa vượt sliding window (7 ngày kể từ lần dùng cuối)**. Khi refresh, expiry mới = {{min(lastUsedAt + 7 ngày, issuedAt + 30 ngày)}}. Test cover: access token hết hạn đúng 15 phút, refresh token hết hạn do sliding window, hết hạn do max age, expiry mới bị cap ở max age.

**2. Flash sale/Promotion với múi giờ nghiệp vụ**: Server chạy UTC, nhưng promotion start/end theo múi giờ Việt Nam (có DST). Dùng {{ZonedDateTime.ofInstant(clock.instant(), businessZone)}} để so sánh. Cửa sổ {{[startAt, endAt)}} — endAt exclusive. Test cover: trước start, đúng start, giữa cửa sổ, đúng end (inactive), sau end. Quan trọng: {{timeUntilStart}} trả {{Duration.ZERO}} khi đã qua startAt.

**3. Sliding window rate limiter**: Lưu timestamp các request trong {{Deque}}. Mỗi lần {{tryAcquire}} hoặc {{currentUsage}}, dọn timestamp cũ hơn {{now - window}}. Test dùng {{MutableClock}} để advance thời gian và verify refill sau khi window trôi — **không cần {{Thread.sleep}}**.

**4. Scheduled cleanup job**: Job xóa token hết hạn chạy định kỳ. Test seed data, gọi cleanup tại day 0 (0 deleted), advance clock 31 ngày, gọi cleanup (2 deleted). Toàn bộ vòng đời job test được trong mili giây.

{{Lỗi hay gặp}}:
- Quên inject {{Clock}} vào helper/util class -> production đọc {{Instant.now()}} thật.
- So sánh {{ZonedDateTime}} bằng {{equals}} sau lưu DB: nanosecond mất do {{timestamptz}} chỉ lưu microsecond. Test dùng {{Clock.fixed}} nanosecond = 0, hoặc truncate.
- DST gap: promotion startAt rơi vào giờ không tồn tại (2h30 ngày chuyển DST). JDK adjust tự động. Test phải cover case này.
- Mutable clock shared giữa test -> flaky. Mỗi test tự tạo instance mới.
- {{currentUsage()}} cũng prune state như {{tryAcquire()}} (không phải hàm đọc thuần); nên tách {{cleanupExpired(now)}} private để chỉ một chỗ sửa deque.

{{Senior tip}}: trong codebase thật, hay cấm {{Instant.now()}}, {{LocalDate.now()}}, {{System.currentTimeMillis()}} trong domain code bằng ArchUnit hoặc checkstyle. Chỉ cho phép trong {{@Configuration}} bean tạo {{Clock.systemUTC()}}. Khi review PR, {{grep -r "\\.now()"}} là thấy ngay vi phạm.`,
    },
  ],
  check: [
    {
      q: 'Refresh token có sliding window 7 ngày và max age 30 ngày. IssuedAt = day 0, lastUsedAt = day 25. Hôm nay day 28. Token còn valid không?',
      options: ['Valid', 'Invalid vi vượt sliding window', 'Invalid vi vượt max age', 'Invalid vì cả hai'],
      answer: 0,
      explain: `Day 28: lastUsedAt + 7 = day 32 (chưa tới) -> chưa vượt sliding window. issuedAt + 30 = day 30 (chưa tới) -> chưa vượt max age. Cả hai điều kiện đều thỏa -> valid. (B) và (D) sai vì chúng cho rằng sliding window đã bị vượt, nhưng 32 > 28; (C) sai vì max age là 30 ngày tính từ issuedAt, còn 28 < 30.`,
    },
    {
      q: 'Promotion startAt = 12:00, endAt = 14:00 (múi giờ Việt Nam). {{isActive}} trả true cho thời điểm nào?',
      options: ['11:59', '12:00', '14:00', '14:01'],
      answer: 1,
      explain: `Cửa sổ [startAt, endAt): bao gồm startAt, không bao gồm endAt. 12:00 -> active. 11:59 -> chưa tới. 14:00 và 14:01 -> đã qua endAt.`,
    },
    {
      q: 'Rate limiter sliding window max 5 request/phút. Gửi 5 request lúc 00:00, lúc 00:30 gửi tiếp 1 request. Kết quả?',
      options: ['Cho phép (vẫn trong window)', 'Từ chối (vượt max)', 'Tuỳ implementation', 'Ném exception'],
      answer: 1,
      explain: `Window 1 phút, 5 request đầu lúc 00:00 vẫn trong window lúc 00:30 (chưa trôi 1 phút). Size = 5, max = 5 -> request thứ 6 bị từ chối. Chỉ khi clock advance >= 1 phút thì window trôi và refill.`,
    },
    {
      q: 'Tại sao test scheduled cleanup job nên dùng {{MutableClock}} thay vì {{Thread.sleep}}?',
      options: [
        'Vì {{Thread.sleep}} không chính xác',
        'Vì {{MutableClock}} cho phép advance thời gian ngay lập tức, test chạy trong mili giây thay vì chờ giờ',
        'Vì {{Thread.sleep}} bị deprecated',
        'Vì {{MutableClock}} là class chuẩn của JDK',
      ],
      answer: 1,
      explain: `MutableClock cho phép test advance thời gian (ví dụ 31 ngày) tức thì và kiểm tra hành vi job cleanup ngay lập tức. Thread.sleep làm test chậm, flaky dưới tải CI, và không điều khiển được mốc thời gian chính xác. MutableClock không phải class chuẩn JDK (tự viết kế thừa Clock).`,
    },
  ],
  related: ['testing-002', 'testing-008', 'testing-010'],
  tags: ['Clock', 'time testing', 'JWT', 'refresh token', 'sliding window', 'rate limiter', 'promotion', 'flash sale', 'scheduled job', 'DST', 'MutableClock'],
},
{
  id: 'lesson-testing-010',
  track: 'testing',
  order: 10,
  title: 'Clock trong test: kiểm soát thời gian để kiểm thử dịch vụ hết hạn token',
  level: 'mid',
  minutes: 25,
  goals: [
    'Hiểu vì sao gọi thời gian hệ thống trực tiếp ({{Instant.now()}}, {{System.currentTimeMillis()}}) khiến test phụ thuộc thời gian và không ổn định',
    'Dùng {{java.time.Clock}} (Clock — đồng hồ trừu tượng do JDK cung cấp, có thể thay thế trong test) để tiêm thời gian vào service và kiểm soát mốc hiện tại',
    'Viết test xác định (deterministic — kết quả giống nhau mỗi lần chạy) cho dịch vụ hết hạn token bằng {{Clock.fixed()}} và {{Clock.offset()}}',
  ],
  body: `**Tóm tắt:** Thời gian là một dependency ẩn: {{Instant.now()}} đọc đồng hồ thật nên test không kiểm soát được các biên (trước expiry, đúng expiry, sau expiry). Giải pháp là tiêm {{java.time.Clock}} vào service, dùng {{Clock.fixed()}} để đóng băng và {{Clock.offset()}} để dịch chuyển; nhờ vậy test được mọi mốc trong vài mili giây mà không cần ngủ.

### Vấn đề: code phụ thuộc thời gian thật khó kiểm thử
Khi kiểm tra "token đã hết hạn chưa", cách viết tự nhiên là so sánh thời điểm hết hạn với thời gian hiện tại:

~~~java
// Cách viết phụ thuộc thời gian hệ thống — khó test
boolean isExpired(Instant expiresAt) {
    return Instant.now().isAfter(expiresAt); // đọc đồng hồ thật của máy
}
~~~

**Vì sao khó test?** Bạn không điều khiển được {{Instant.now()}}. Muốn test trường hợp "token hết hạn sau 10 phút" bạn phải chờ thật 10 phút (không thể chấp nhận), hoặc dùng {{Thread.sleep}} (chậm, flaky — lúc chạy được lúc không do môi trường). Muốn test "đúng tại thời điểm hết hạn" thì gần như không thể canh chính xác.

Thuật ngữ: **flaky test** (test không ổn định) là test có lúc pass lúc fail dù code không đổi, thường do phụ thuộc thời gian thật, mạng, hay thứ tự thực thi.

### Giải pháp: tiêm Clock (dependency injection cho thời gian)
**Dependency injection** (tiêm phụ thuộc — đưa đối tượng cần dùng vào từ bên ngoài thay vì tự tạo bên trong) áp dụng được cả cho thời gian. JDK cung cấp {{java.time.Clock}} — một lớp trừu tượng đại diện cho "nguồn thời gian hiện tại".

- Trong production: dùng {{Clock.systemUTC()}} hoặc {{Clock.systemDefaultZone()}} để lấy thời gian thật.
- Trong test: dùng {{Clock.fixed(instant, zone)}} để "đóng băng" thời gian tại một mốc cố định, hoặc {{Clock.offset(base, duration)}} để dịch chuyển tương đối.

~~~java
import java.time.*;

class TokenService {
    private final Clock clock;
    private final Duration ttl; // TTL = Time To Live, thời gian sống của token

    TokenService(Clock clock, Duration ttl) {
        this.clock = clock;   // tiêm clock từ ngoài vào
        this.ttl = ttl;
    }

    // Cấp token: ghi lại thời điểm phát hành theo clock được tiêm
    Instant issueAt() {
        return clock.instant();
    }

    // Tính thời điểm hết hạn = thời điểm phát hành + TTL
    Instant expiresAt(Instant issuedAt) {
        return issuedAt.plus(ttl);
    }

    // Token hết hạn khi "bây giờ" >= thời điểm hết hạn
    boolean isExpired(Instant issuedAt) {
        Instant now = clock.instant();              // đọc thời gian từ clock đã tiêm
        return !now.isBefore(expiresAt(issuedAt));  // hết hạn nếu now >= expiresAt
    }
}
~~~

**Hoạt động thế nào:**
1. {{Clock.instant()}} trả về {{Instant}} (một mốc thời gian tuyệt đối trên trục thời gian UTC).
2. {{Clock.fixed(fixedInstant, ZoneOffset.UTC)}} luôn trả về cùng một {{fixedInstant}} dù gọi bao nhiêu lần — thời gian "đứng yên".
3. {{Clock.offset(baseClock, Duration.ofMinutes(10))}} trả về thời gian của {{baseClock}} cộng thêm 10 phút — giúp mô phỏng "10 phút sau" mà không cần chờ.

### Ví dụ cụ thể: test dịch vụ hết hạn token
~~~java
Instant base = Instant.parse("2026-01-01T10:00:00Z");
Clock atIssue = Clock.fixed(base, ZoneOffset.UTC);
TokenService svc = new TokenService(atIssue, Duration.ofMinutes(30));

Instant issued = svc.issueAt(); // luôn là 2026-01-01T10:00:00Z

// Tại thời điểm phát hành: chưa hết hạn
// -> svc.isExpired(issued) == false

// Đúng thời điểm hết hạn (30 phút sau): coi như hết hạn
Clock atExpiry = Clock.fixed(base.plus(Duration.ofMinutes(30)), ZoneOffset.UTC);
TokenService svcAtExpiry = new TokenService(atExpiry, Duration.ofMinutes(30));
// -> svcAtExpiry.isExpired(issued) == true

// Sau 1 giây so với hết hạn: chắc chắn hết hạn
Clock afterExpiry = Clock.offset(atExpiry, Duration.ofSeconds(1));
TokenService svcAfter = new TokenService(afterExpiry, Duration.ofMinutes(30));
// -> svcAfter.isExpired(issued) == true
~~~

**Vì sao xác định (deterministic)?** Mọi mốc thời gian đều do ta kiểm soát qua clock, không phụ thuộc đồng hồ máy hay tốc độ chạy test. Cùng input luôn cho cùng output.

### Biên (boundary) cần test
Với logic hết hạn, các biên quan trọng:
- **Trước hết hạn** (1 giây trước): token còn hợp lệ.
- **Đúng thời điểm hết hạn**: tùy quy ước nghiệp vụ; thường coi là hết hạn ({{now >= expiresAt}}). Phải thống nhất rõ.
- **Sau hết hạn** (1 giây sau): token hết hạn.

Nếu dùng {{isAfter}} thay vì {{!isBefore}} (tương đương {{>=}}), bạn sẽ cho phép token dùng được đúng tại giây hết hạn — khác biệt 1 giây nhưng có thể là lỗ hổng bảo mật.

### Lỗi hay gặp
- **Tạo {{Instant.now()}} bên trong method** thay vì dùng clock đã tiêm: test vẫn phụ thuộc thời gian thật.
- **Dùng {{new Date()}} / {{System.currentTimeMillis()}}** rải rác: khó thay thế. Nên gom vào một nguồn thời gian (clock) duy nhất.
- **Quên timezone khi dùng {{Clock.systemDefaultZone()}}**: test chạy trên máy UTC và máy UTC+7 cho kết quả khác nếu code so sánh {{LocalDateTime}}. Ưu tiên {{Instant}} và {{Clock.systemUTC()}} cho logic hết hạn.
- **So sánh lỏng lẻo**: dùng {{equals}} cho thời điểm hết hạn thay vì {{!isBefore}} khi nghiệp vụ cho phép biên.

> Senior tip: Mọi logic so sánh "bây giờ" với một mốc (hết hạn token, TTL cache, cửa sổ retry, rate limit) đều nên nhận {{Clock}} thay vì gọi {{Instant.now()}} trực tiếp. Đó là khoản đầu tư nhỏ giúp test nhanh, ổn định và kiểm soát được mọi biên thời gian.

### Ví dụ đời thực: mốc thời gian bị cắt lẻ sau khi lưu database
Một service lưu {{createdAt}} bằng {{LocalDateTime}} vào MySQL. Test dùng {{Clock.fixed}} nên luôn xanh. Trên production, cột {{DATETIME}} chỉ lưu tới giây, còn {{LocalDateTime}} trên JVM có nano giây: sau khi lưu rồi đọc lại, phần lẻ bị cắt nên so sánh {{equals}} giữa giá trị trước và sau khi đọc trả về {{false}}. Không test nào bắt được lỗi vì unit test không đọc database thật. Sau khi đổi sang {{Instant}}/{{OffsetDateTime}} với cột {{timestamptz}} và truncate micro giây trước khi so sánh, lỗi không tái hiện; so sánh cũng rẻ hơn vì chỉ còn xét tới mili giây.

### Trả lời mẫu khi phỏng vấn
"Khi được hỏi 'làm sao test code phụ thuộc thời gian?', tôi nói: trước hết nhận ra {{Instant.now()}} là dependency ẩn — test không điều khiển được nó. Giải pháp là tiêm {{java.time.Clock}} vào service: production truyền {{Clock.systemUTC()}}, test truyền {{Clock.fixed()}} để đóng băng tại một mốc hoặc {{Clock.offset()}} để dịch tương đối. Với token expiry tôi test ba điểm: một giây trước expiry (còn hiệu lực), đúng expiry (hết hạn), một giây sau (hết hạn). Tôi dùng {{Instant}} cho mốc tuyệt đối vì nó không phụ thuộc timezone, và không bao giờ dùng {{Thread.sleep}} trong unit test vì nó làm suite chậm mà vẫn flaky khi CI tải cao. Trong Spring Boot 3, khai báo {{@Bean Clock clock()}} rồi tiêm vào service; trong test thay bằng clock cố định."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Làm sao test code phụ thuộc thời gian?", "Tại sao không dùng {{Thread.sleep}} trong unit test?", "Clock injection là gì?". Câu trả lời tốt: trích xuất thời gian thành dependency ({{Clock}}), tiêm {{Clock.fixed/offset}} trong test để kiểm soát mốc thời gian, bao phủ các biên (trước/đúng/sau hết hạn). Nêu thêm: trong Spring Boot 3 có thể khai báo {{@Bean Clock clock()}} và tiêm vào service; trong test thay bằng clock cố định.`,
  exercises: [
    {
      title: 'Viết TokenService kiểm tra hết hạn bằng Clock',
      prompt: `Hoàn thiện class {{TokenService}} dùng {{java.time.Clock}} để kiểm soát thời gian:
- Constructor nhận {{Clock clock}} và {{Duration ttl}} (TTL = thời gian sống của token).
- {{issueAt()}}: trả về thời điểm hiện tại theo {{clock}} (thời điểm phát hành token).
- {{expiresAt(Instant issuedAt)}}: trả về {{issuedAt + ttl}}.
- {{isExpired(Instant issuedAt)}}: trả về {{true}} nếu token đã hết hạn, tức thời điểm hiện tại {{>= expiresAt(issuedAt)}}. Dùng {{clock.instant()}} để lấy "bây giờ".
- {{secondsUntilExpiry(Instant issuedAt)}}: trả về số giây còn lại cho đến khi hết hạn. Nếu đã hết hạn (hoặc đúng thời điểm hết hạn) thì trả về {{0}}.

Gợi ý: {{Duration.between(now, exp).getSeconds()}} cho số giây chênh lệch; so sánh {{now.isBefore(expiresAt)}} để kiểm tra còn hạn.`,
      starter: `import java.time.*;

class TokenService {
    private final Clock clock;
    private final Duration ttl;

    TokenService(Clock clock, Duration ttl) {
        this.clock = clock;
        this.ttl = ttl;
    }

    Instant issueAt() {
        throw new UnsupportedOperationException("TODO");
    }

    Instant expiresAt(Instant issuedAt) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean isExpired(Instant issuedAt) {
        throw new UnsupportedOperationException("TODO");
    }

    long secondsUntilExpiry(Instant issuedAt) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.time.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name);
    }
    public static void main(String[] args) {
        Instant base = Instant.parse("2026-06-01T08:00:00Z");
        Clock fixed = Clock.fixed(base, ZoneOffset.UTC);
        TokenService svc = new TokenService(fixed, Duration.ofMinutes(15));

        Instant issued = svc.issueAt();
        check("issueAt returns clock instant", issued.equals(base));
        check("expiresAt is issuedAt plus ttl", svc.expiresAt(issued).equals(base.plus(Duration.ofMinutes(15))));

        // Tại thời điểm phát hành: chưa hết hạn
        check("not expired at issue time", !svc.isExpired(issued));
        check("secondsUntilExpiry at issue is 900", svc.secondsUntilExpiry(issued) == 900L);

        // 14 phút sau: vẫn còn hạn
        Clock at14 = Clock.offset(fixed, Duration.ofMinutes(14));
        TokenService svc14 = new TokenService(at14, Duration.ofMinutes(15));
        check("not expired 1 minute before", !svc14.isExpired(issued));
        check("60 seconds left 1 minute before", svc14.secondsUntilExpiry(issued) == 60L);

        // Đúng thời điểm hết hạn (15 phút): hết hạn
        Clock atExp = Clock.offset(fixed, Duration.ofMinutes(15));
        TokenService svcExp = new TokenService(atExp, Duration.ofMinutes(15));
        check("expired exactly at expiry", svcExp.isExpired(issued));
        check("0 seconds at expiry", svcExp.secondsUntilExpiry(issued) == 0L);

        // 1 giây sau hết hạn: hết hạn
        Clock after = Clock.offset(fixed, Duration.ofMinutes(15).plusSeconds(1));
        TokenService svcAfter = new TokenService(after, Duration.ofMinutes(15));
        check("expired after expiry", svcAfter.isExpired(issued));
        check("0 seconds after expiry", svcAfter.secondsUntilExpiry(issued) == 0L);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;

class TokenService {
    private final Clock clock;
    private final Duration ttl;

    TokenService(Clock clock, Duration ttl) {
        this.clock = clock;
        this.ttl = ttl;
    }

    Instant issueAt() {
        return clock.instant();
    }

    Instant expiresAt(Instant issuedAt) {
        return issuedAt.plus(ttl);
    }

    boolean isExpired(Instant issuedAt) {
        Instant now = clock.instant();
        // Hết hạn khi now >= expiresAt (tức không còn "trước" thời điểm hết hạn)
        return !now.isBefore(expiresAt(issuedAt));
    }

    long secondsUntilExpiry(Instant issuedAt) {
        Instant now = clock.instant();
        long seconds = Duration.between(now, expiresAt(issuedAt)).getSeconds();
        return seconds > 0 ? seconds : 0;
    }
}`,
      hints: [
        '{{issueAt()}} chỉ cần {{return clock.instant();}} — luôn đọc từ clock đã tiêm, không gọi {{Instant.now()}}.',
        'Để "đúng tại thời điểm hết hạn" cũng tính là hết hạn, dùng {{!now.isBefore(expiresAt(issuedAt))}} thay vì {{now.isAfter(...)}}.',
        '{{secondsUntilExpiry}}: tính {{Duration.between(now, expiresAt(issuedAt)).getSeconds()}} rồi trả về {{Math.max(0, seconds)}} hoặc dùng điều kiện if.',
      ],
      explain: `Lời giải đọc thời gian hiện tại duy nhất qua {{clock.instant()}} nên hoàn toàn kiểm soát được trong test.
- {{isExpired}} dùng {{!now.isBefore(expiresAt)}} để bao gồm cả biên "đúng bằng expiresAt" (coi là hết hạn) — đây là quy ước an toàn cho token.
- {{secondsUntilExpiry}} chặn giá trị âm về 0 khi đã quá hạn, tránh trả về số âm gây hiểu nhầm phía gọi.

Lỗi hay gặp: dùng {{now.isAfter(expiresAt)}} (bỏ sót biên bằng nhau), hoặc gọi {{Instant.now()}} trực tiếp trong method khiến test không còn xác định.`,
    },
  ],
  check: [
    {
      q: 'Vì sao gọi {{Instant.now()}} trực tiếp trong service làm unit test khó viết?',
      options: [
        'Vì {{Instant.now()}} chạy chậm hơn {{Clock.instant()}}',
        'Vì thời gian thật thay đổi liên tục nên không kiểm soát được mốc "bây giờ" trong test, dẫn đến test phụ thuộc thời gian và có thể không ổn định',
        'Vì {{Instant.now()}} không hoạt động trên Java 17',
        'Vì {{Instant}} không so sánh được với nhau',
      ],
      answer: 1,
      explain: `{{Instant.now()}} đọc đồng hồ hệ thống thật — mỗi lần gọi có thể trả giá trị khác. Test không thể "đóng băng" hay tua thời gian để kiểm tra biên hết hạn, nên phải dùng {{Thread.sleep}} (chậm, flaky) hoặc chấp nhận test yếu. Tiêm {{Clock}} cho phép thay bằng {{Clock.fixed/offset}} để kiểm soát hoàn toàn.`,
    },
    {
      q: 'Trong test, bạn muốn kiểm tra token "hết hạn đúng sau 30 phút" kể từ mốc phát hành cố định. Cách nào phù hợp nhất?',
      options: [
        'Dùng {{Thread.sleep(30 * 60 * 1000)}} rồi kiểm tra',
        'Dùng {{Clock.offset(Clock.fixed(issuedAt, ZoneOffset.UTC), Duration.ofMinutes(30))}} để mô phỏng thời điểm 30 phút sau',
        'Gọi {{Instant.now()}} và cộng 30 phút vào kết quả',
        'Không cần test trường hợp biên này',
      ],
      answer: 1,
      explain: `{{Clock.fixed}} cố định mốc phát hành, {{Clock.offset}} dịch thêm 30 phút — mô phỏng chính xác "30 phút sau" mà không chờ thật. Test chạy tức thì và xác định. {{Thread.sleep}} 30 phút là không khả thi; {{Instant.now()}} không kiểm soát được mốc; biên hết hạn là trường hợp quan trọng cần kiểm thử.`,
    },
    {
      q: 'Nếu nghiệp vụ quy định "token hết hạn khi thời gian hiện tại >= thời điểm hết hạn", biểu thức kiểm tra nào đúng?',
      options: [
        '{{now.isAfter(expiresAt)}}',
        '{{!now.isBefore(expiresAt)}}',
        '{{now.isBefore(expiresAt)}}',
        '{{now.equals(expiresAt)}}',
      ],
      answer: 1,
      explain: `{{!now.isBefore(expiresAt)}} tương đương {{now >= expiresAt}}: trả về true khi bằng nhau hoặc sau đó — đúng quy ước. {{now.isAfter(expiresAt)}} bỏ sót trường hợp bằng nhau (biên). {{now.isBefore}} là còn hạn. {{equals}} chỉ đúng tại đúng một khoảnh khắc, bỏ sót mọi thời điểm sau đó.`,
    },
  ],
  related: ['testing-001', 'testing-005'],
  tags: ['clock', 'time', 'token', 'testing', 'deterministic', 'java-time'],
},
{
  id: 'lesson-testing-011',
  track: 'testing',
  order: 11,
  title: 'Test double: stub, mock, fake và phát hiện N+1 bằng fake repository đếm truy vấn',
  level: 'senior',
  minutes: 30,
  goals: [
    'Phân biệt stub, mock và fake: mục đích, cách dùng và khi nào chọn loại nào',
    'Hiểu N+1 query (vấn đề hiệu năng: 1 truy vấn lấy danh sách + N truy vấn phụ theo từng phần tử) và vì sao cần phát hiện sớm bằng test',
    'Viết fake repository đếm số lần gọi (call count) để test tự phát hiện hành vi N+1 trong service',
  ],
  body: `**Tóm tắt:** Ba loại test double — stub, mock, fake — khác nhau ở mục đích: stub cung cấp dữ liệu đầu vào cố định, mock kiểm tra tương tác (method nào được gọi, bao nhiêu lần, tham số gì), còn fake là cài đặt đơn giản nhưng chạy đúng logic (lưu trong {{HashMap}}) và có thể gắn thêm bộ đếm để quan sát. Bài này giúp bạn chọn đúng loại, rồi dùng fake repository đếm truy vấn để tự phát hiện N+1 — 1 truy vấn lấy danh sách cộng N truy vấn phụ theo từng phần tử.

### Test double là gì?
**Test double** (đối tượng thay thế trong kiểm thử — thuật ngữ mượn từ "stunt double", diễn viên đóng thế) là một đối tượng giả lập thay cho phụ thuộc thật (database, API, hàng đợi...) để cô lập đơn vị cần test. Có nhiều loại, mỗi loại phục vụ mục đích khác nhau:

| Loại | Mục đích | Đặc điểm |
|---|---|---|
| **Stub** (giả lập trả về cố định) | Cung cấp dữ liệu đầu vào cố định cho test | Chỉ trả về giá trị cấu hình sẵn, không kiểm tra cách được gọi |
| **Mock** (đối tượng giả lập có kỳ vọng) | Kiểm tra **tương tác**: method nào được gọi, bao nhiêu lần, với tham số gì | Thường dùng thư viện (Mockito); test fail nếu tương tác không đúng kỳ vọng |
| **Fake** (cài đặt giả hoạt động được) | Cài đặt đơn giản nhưng **hoạt động đúng logic** (ví dụ lưu trong {{HashMap}} thay vì DB) | Không dùng hạ tầng thật, nhưng có hành vi gần thật; có thể thêm khả năng quan sát (đếm lần gọi) |

**Khi nào chọn gì?**
- Cần dữ liệu đầu vào đơn giản, không quan tâm tương tác: **stub**.
- Cần xác minh "service đã gọi gửi email đúng 1 lần": **mock** (verify interaction).
- Cần logic lưu/truy xuất hoạt động được để test luồng nghiệp vụ, hoặc muốn quan sát hành vi (như số lần truy vấn): **fake**. Fake thường bền hơn mock vì không gắn chặt vào chi tiết lời gọi.

### Vấn đề N+1 query
**N+1 query** (truy vấn N+1) là một anti-pattern hiệu năng phổ biến khi làm việc với cơ sở dữ liệu (database — nơi lưu trữ dữ liệu):

1. **1 truy vấn** lấy danh sách N phần tử (ví dụ: danh sách đơn hàng).
2. **N truy vấn** tiếp theo, mỗi truy vấn lấy dữ liệu liên quan cho từng phần tử (ví dụ: lấy tên khách hàng cho từng đơn).

Tổng cộng N+1 truy vấn thay vì 1-2 truy vấn (dùng join hoặc batch fetch). Với 100 đơn hàng là 101 truy vấn; với 10.000 đơn là 10.001 — độ trễ tăng tuyến tính, dễ gây nghẽn trên production.

Ví dụ code gây N+1 (mô phỏng bằng Java thuần):

~~~java
// Interface repository (lớp truy cập dữ liệu)
interface OrderRepository {
    List<String> findAllOrderIds();           // 1 truy vấn: lấy danh sách id
    String findCustomerNameByOrderId(String orderId); // 1 truy vấn mỗi lần gọi
    Map<String, String> findCustomerNamesByOrderIds(List<String> ids); // batch: 1 truy vấn
}

class OrderReportService {
    private final OrderRepository repo;
    OrderReportService(OrderRepository repo) { this.repo = repo; }

    // CÁCH XẤU: gọi findCustomerNameByOrderId trong vòng lặp -> N+1
    List<String> buildReportNaive() {
        List<String> ids = repo.findAllOrderIds();        // 1 lần
        List<String> lines = new ArrayList<>();
        for (String id : ids) {
            String name = repo.findCustomerNameByOrderId(id); // N lần
            lines.add(id + ":" + name);
        }
        return lines;
    }

    // CÁCH TỐT: lấy tất cả tên khách hàng trong 1 lần (batch)
    List<String> buildReportBatch() {
        List<String> ids = repo.findAllOrderIds();        // 1 lần
        Map<String, String> names = repo.findCustomerNamesByOrderIds(ids); // 1 lần
        List<String> lines = new ArrayList<>();
        for (String id : ids) {
            lines.add(id + ":" + names.get(id));
        }
        return lines;
    }
}
~~~

### Phát hiện N+1 bằng fake repository đếm số lần gọi
Thay vì kết nối DB thật, ta viết một **fake repository** cài đặt interface bằng bộ nhớ ({{Map}}, {{List}}) và **đếm số lần mỗi method được gọi**. Test sẽ assert rằng tổng số lần truy vấn không vượt quá ngưỡng hợp lý (ví dụ <= 2 cho batch), từ đó phát hiện hồi quy N+1.

~~~java
class CountingFakeOrderRepository implements OrderRepository {
    private final List<String> orderIds;
    private final Map<String, String> orderToCustomer;
    int findAllCalls = 0;
    int findByIdCalls = 0;
    int findBatchCalls = 0;

    CountingFakeOrderRepository(List<String> orderIds, Map<String, String> orderToCustomer) {
        this.orderIds = new ArrayList<>(orderIds);
        this.orderToCustomer = new HashMap<>(orderToCustomer);
    }

    public List<String> findAllOrderIds() {
        findAllCalls++; // đếm mỗi lần được gọi
        return new ArrayList<>(orderIds);
    }

    public String findCustomerNameByOrderId(String orderId) {
        findByIdCalls++; // nếu gọi trong vòng lặp, số này sẽ = N
        return orderToCustomer.get(orderId);
    }

    public Map<String, String> findCustomerNamesByOrderIds(List<String> ids) {
        findBatchCalls++;
        Map<String, String> res = new HashMap<>();
        for (String id : ids) res.put(id, orderToCustomer.get(id));
        return res;
    }

    int totalCalls() { return findAllCalls + findByIdCalls + findBatchCalls; }
}
~~~

**Vì sao fake chứ không phải mock?** Fake có logic thật (trả đúng dữ liệu từ bộ nhớ) nên service chạy được end-to-end trong unit test; đồng thời ta gắn thêm bộ đếm để quan sát. Mock (ví dụ Mockito {{verify(repo, times(1))}}) cũng đếm được nhưng thường gắn chặt vào chi tiết lời gọi; fake linh hoạt hơn khi muốn kiểm tra "tổng số truy vấn" bất kể phân bổ.

### Ví dụ minh họa số liệu
- 5 đơn hàng, cách naive: {{findAllCalls=1}}, {{findByIdCalls=5}} -> tổng 6 truy vấn.
- 5 đơn hàng, cách batch: {{findAllCalls=1}}, {{findBatchCalls=1}} -> tổng 2 truy vấn.
- 500 đơn hàng, naive thành 501 truy vấn; batch vẫn 2. Chênh lệch này chính là lý do N+1 nguy hiểm khi dữ liệu tăng.

### Lỗi hay gặp
- **Chỉ test kết quả đúng, không test số lần truy vấn**: code naive vẫn trả đúng dữ liệu nhưng chậm; nếu không assert call count, N+1 lọt qua test.
- **Dùng mock verify từng method cứng nhắc**: refactor hợp lệ (gộp lời gọi) làm test gãy dù hành vi đúng. Đếm tổng/truy vấn theo "ngân sách" (budget) linh hoạt hơn.
- **Fake không phản ánh ràng buộc thật**: fake in-memory không có latency, lock, hay lỗi mạng — vẫn cần integration test với DB thật (Testcontainers) cho các kịch bản đó.
- **Nhầm stub với fake**: stub chỉ trả giá trị cố định cho một lời gọi cụ thể; fake có trạng thái và logic, phục vụ nhiều tương tác.

> Senior tip: Hãy đặt "query budget" trong test cho các service đọc danh sách: assert số lần gọi repository không vượt ngưỡng (ví dụ {{totalCalls <= 2}}). Khi ai đó vô tình đưa lại vòng lặp gọi DB, test sẽ fail ngay trên CI trước khi lên production.

### Ví dụ đời thực: report service timeout vì N+1
Một service tạo báo cáo: lấy danh sách 5.000 đơn hàng rồi với mỗi đơn lại lấy tên khách hàng. Code naive chạy 1 truy vấn + 5.000 truy vấn = 5.001 query, mất khoảng 3 giây và thường timeout trên production vào giờ cao điểm. Team thêm fake repository đếm call rồi assert {{totalCalls <= 2}}; test đỏ ngay ở lần chạy đầu. Sau khi refactor sang batch fetch: 1 + 1 = 2 query, thời gian xuống còn khoảng 50 mili giây. Từ đó mỗi lần ai đó vô tình đưa lại vòng lặp gọi DB, test fail ngay trên CI.

### Trả lời mẫu khi phỏng vấn
"Khi được hỏi 'stub, mock, fake khác nhau thế nào?', tôi nói: stub là người trả lời câu hỏi — chỉ cung cấp giá trị định trước cho một lời gọi cụ thể, không kiểm tra cách được gọi. Mock là người kiểm tra hành vi — đặt kỳ vọng method nào được gọi, bao nhiêu lần, với tham số gì. Fake là cài đặt đơn giản nhưng chạy đúng logic — ví dụ repository lưu trong {{HashMap}}, giữ đúng ngữ nghĩa upsert và tìm kiếm; fake bền hơn mock vì không gắn chặt vào chi tiết lời gọi. Với N+1: 1 truy vấn lấy danh sách N phần tử, rồi N truy vấn phụ cho từng phần tử — 100 đơn là 101 query. Tôi phát hiện bằng fake repository đếm call với ngân sách {{totalCalls <= 2}}, và khắc phục bằng batch fetch hoặc {{@EntityGraph}}."

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Stub, mock, fake khác nhau thế nào?", "N+1 query là gì, phát hiện và xử lý ra sao?". Trả lời tốt: nêu rõ định nghĩa từng loại test double và mục đích; giải thích N+1 (1 + N truy vấn do lặp), cách phát hiện (log SQL, metric, hoặc fake đếm call trong test), cách khắc phục (batch fetch/join fetch/{{@EntityGraph}} trong JPA, hoặc API batch). Nêu ví dụ đo được: "với 100 bản ghi, naive 101 query, batch 2 query".`,
  exercises: [
    {
      title: 'Fake repository đếm truy vấn để phát hiện N+1',
      prompt: `Cho interface {{OrderRepository}} và class {{OrderReportService}} với hai cách xây báo cáo:
- {{buildReportNaive()}}: lấy danh sách id rồi gọi {{findCustomerNameByOrderId}} cho từng id (gây N+1).
- {{buildReportBatch()}}: lấy danh sách id rồi gọi {{findCustomerNamesByOrderIds}} một lần (tốt).

Hãy hoàn thiện {{CountingFakeOrderRepository}} (fake lưu dữ liệu trong bộ nhớ và đếm số lần gọi) và hoàn thiện {{buildReportBatch()}} trong service:
- {{findAllOrderIds()}}: tăng {{findAllCalls}}, trả về bản sao danh sách id.
- {{findCustomerNameByOrderId(orderId)}}: tăng {{findByIdCalls}}, trả về tên khách hàng theo id (hoặc {{null}} nếu không có).
- {{findCustomerNamesByOrderIds(ids)}}: tăng {{findBatchCalls}}, trả về {{Map<orderId, customerName>}} cho các id được yêu cầu.
- {{totalCalls()}}: tổng {{findAllCalls + findByIdCalls + findBatchCalls}}.

{{buildReportBatch()}} phải trả về danh sách chuỗi dạng {{orderId + ":" + customerName}} theo đúng thứ tự id, và chỉ dùng {{findAllOrderIds}} + {{findCustomerNamesByOrderIds}} (không gọi {{findCustomerNameByOrderId}}).`,
      starter: `import java.util.*;

interface OrderRepository {
    List<String> findAllOrderIds();
    String findCustomerNameByOrderId(String orderId);
    Map<String, String> findCustomerNamesByOrderIds(List<String> ids);
}

class CountingFakeOrderRepository implements OrderRepository {
    private final List<String> orderIds;
    private final Map<String, String> orderToCustomer;
    int findAllCalls = 0;
    int findByIdCalls = 0;
    int findBatchCalls = 0;

    CountingFakeOrderRepository(List<String> orderIds, Map<String, String> orderToCustomer) {
        this.orderIds = new ArrayList<>(orderIds);
        this.orderToCustomer = new HashMap<>(orderToCustomer);
    }

    public List<String> findAllOrderIds() {
        throw new UnsupportedOperationException("TODO");
    }

    public String findCustomerNameByOrderId(String orderId) {
        throw new UnsupportedOperationException("TODO");
    }

    public Map<String, String> findCustomerNamesByOrderIds(List<String> ids) {
        throw new UnsupportedOperationException("TODO");
    }

    int totalCalls() {
        throw new UnsupportedOperationException("TODO");
    }
}

class OrderReportService {
    private final OrderRepository repo;
    OrderReportService(OrderRepository repo) { this.repo = repo; }

    // Cách naive (gây N+1) - đã cho sẵn để so sánh
    List<String> buildReportNaive() {
        List<String> ids = repo.findAllOrderIds();
        List<String> lines = new ArrayList<>();
        for (String id : ids) {
            String name = repo.findCustomerNameByOrderId(id);
            lines.add(id + ":" + name);
        }
        return lines;
    }

    // Cách batch (tốt) - cần hoàn thiện
    List<String> buildReportBatch() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name);
    }
    static CountingFakeOrderRepository sampleRepo() {
        List<String> ids = Arrays.asList("O1", "O2", "O3", "O4", "O5");
        Map<String, String> m = new HashMap<>();
        m.put("O1", "An"); m.put("O2", "Binh"); m.put("O3", "Chi");
        m.put("O4", "Dung"); m.put("O5", "Em");
        return new CountingFakeOrderRepository(ids, m);
    }
    public static void main(String[] args) {
        // Fake trả dữ liệu đúng và đếm
        CountingFakeOrderRepository repo = sampleRepo();
        List<String> ids = repo.findAllOrderIds();
        check("findAll returns ids", ids.size() == 5 && ids.get(0).equals("O1"));
        check("findAllCalls counted", repo.findAllCalls == 1);
        String name = repo.findCustomerNameByOrderId("O3");
        check("findById returns name", "Chi".equals(name));
        check("findByIdCalls counted", repo.findByIdCalls == 1);
        Map<String, String> batch = repo.findCustomerNamesByOrderIds(Arrays.asList("O1", "O5"));
        check("batch returns map", "An".equals(batch.get("O1")) && "Em".equals(batch.get("O5")));
        check("findBatchCalls counted", repo.findBatchCalls == 1);
        check("totalCalls correct", repo.totalCalls() == 3);

        // Naive gây N+1: 1 + N truy vấn
        CountingFakeOrderRepository naiveRepo = sampleRepo();
        OrderReportService naiveSvc = new OrderReportService(naiveRepo);
        List<String> naiveReport = naiveSvc.buildReportNaive();
        check("naive report correct", naiveReport.size() == 5 && naiveReport.get(2).equals("O3:Chi"));
        check("naive causes N+1 calls", naiveRepo.findAllCalls == 1 && naiveRepo.findByIdCalls == 5 && naiveRepo.totalCalls() == 6);

        // Batch tốt: chỉ 2 truy vấn
        CountingFakeOrderRepository batchRepo = sampleRepo();
        OrderReportService batchSvc = new OrderReportService(batchRepo);
        List<String> batchReport = batchSvc.buildReportBatch();
        check("batch report correct", batchReport.size() == 5 && batchReport.get(0).equals("O1:An") && batchReport.get(4).equals("O5:Em"));
        check("batch avoids N+1 total", batchRepo.totalCalls() == 2);
        check("batch uses batch call not per-id", batchRepo.findByIdCalls == 0 && batchRepo.findBatchCalls == 1 && batchRepo.findAllCalls == 1);

        // Trường hợp rỗng
        CountingFakeOrderRepository emptyRepo = new CountingFakeOrderRepository(Collections.emptyList(), Collections.emptyMap());
        OrderReportService emptySvc = new OrderReportService(emptyRepo);
        List<String> emptyReport = emptySvc.buildReportBatch();
        check("empty batch report", emptyReport.isEmpty());
        check("empty still bounded calls", emptyRepo.totalCalls() <= 2);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;

interface OrderRepository {
    List<String> findAllOrderIds();
    String findCustomerNameByOrderId(String orderId);
    Map<String, String> findCustomerNamesByOrderIds(List<String> ids);
}

class CountingFakeOrderRepository implements OrderRepository {
    private final List<String> orderIds;
    private final Map<String, String> orderToCustomer;
    int findAllCalls = 0;
    int findByIdCalls = 0;
    int findBatchCalls = 0;

    CountingFakeOrderRepository(List<String> orderIds, Map<String, String> orderToCustomer) {
        this.orderIds = new ArrayList<>(orderIds);
        this.orderToCustomer = new HashMap<>(orderToCustomer);
    }

    public List<String> findAllOrderIds() {
        findAllCalls++;
        return new ArrayList<>(orderIds);
    }

    public String findCustomerNameByOrderId(String orderId) {
        findByIdCalls++;
        return orderToCustomer.get(orderId);
    }

    public Map<String, String> findCustomerNamesByOrderIds(List<String> ids) {
        findBatchCalls++;
        Map<String, String> res = new HashMap<>();
        for (String id : ids) {
            res.put(id, orderToCustomer.get(id));
        }
        return res;
    }

    int totalCalls() {
        return findAllCalls + findByIdCalls + findBatchCalls;
    }
}

class OrderReportService {
    private final OrderRepository repo;
    OrderReportService(OrderRepository repo) { this.repo = repo; }

    List<String> buildReportNaive() {
        List<String> ids = repo.findAllOrderIds();
        List<String> lines = new ArrayList<>();
        for (String id : ids) {
            String name = repo.findCustomerNameByOrderId(id);
            lines.add(id + ":" + name);
        }
        return lines;
    }

    List<String> buildReportBatch() {
        List<String> ids = repo.findAllOrderIds();
        Map<String, String> names = repo.findCustomerNamesByOrderIds(ids);
        List<String> lines = new ArrayList<>();
        for (String id : ids) {
            lines.add(id + ":" + names.get(id));
        }
        return lines;
    }
}`,
      hints: [
        'Trong mỗi method của fake, tăng biến đếm tương ứng ({{findAllCalls++}}...) trước khi trả dữ liệu. Trả về bản sao ({{new ArrayList<>(orderIds)}}) để tránh người gọi sửa dữ liệu nội bộ.',
        '{{findCustomerNamesByOrderIds}}: duyệt qua {{ids}} và lấy tên từ {{orderToCustomer}} cho từng id, đưa vào {{Map}} kết quả.',
        '{{buildReportBatch}}: gọi {{findAllOrderIds()}} một lần, rồi {{findCustomerNamesByOrderIds(ids)}} một lần, sau đó ghép chuỗi theo thứ tự {{ids}}. Không gọi {{findCustomerNameByOrderId}} trong vòng lặp.',
      ],
      explain: `Fake repository vừa cung cấp dữ liệu đúng (để service tạo báo cáo chính xác) vừa quan sát hành vi (đếm truy vấn).
- Cách naive: 1 (lấy ids) + N (lấy từng tên) = N+1 truy vấn — đúng kết quả nhưng kém hiệu năng.
- Cách batch: 1 (lấy ids) + 1 (lấy map tên) = 2 truy vấn — cùng kết quả, số truy vấn không tăng theo N.

Test assert {{findByIdCalls == 0}} và {{totalCalls == 2}} đóng vai trò "query budget", giúp phát hiện sớm hồi quy N+1. Lỗi hay gặp: quên tăng biến đếm, trả về collection nội bộ thay vì bản sao, hoặc trong batch vẫn gọi nhầm {{findCustomerNameByOrderId}}.`,
    },
  ],
  check: [
    {
      q: 'Điểm khác biệt chính giữa **fake** và **mock** trong kiểm thử?',
      options: [
        'Fake chỉ dùng cho unit test, mock chỉ dùng cho integration test',
        'Fake là cài đặt đơn giản nhưng hoạt động đúng logic (có thể quan sát được trạng thái), còn mock tập trung kiểm tra tương tác (method được gọi ra sao) theo kỳ vọng',
        'Fake luôn kết nối database thật, mock thì không',
        'Không có khác biệt, hai tên gọi cùng một thứ',
      ],
      answer: 1,
      explain: `Fake có hành vi hoạt động (ví dụ in-memory repository lưu/đọc được) nên test dựa trên kết quả và trạng thái; mock đặt kỳ vọng về lời gọi (verify interaction). Fake thường ít gãy khi refactor chi tiết nội bộ, trong khi mock gắn chặt hơn với cách service tương tác với phụ thuộc. (A) sai vì cả fake và mock đều dùng được ở unit test, không có luật nào chia đôi theo cặp test. (C) sai vì fake không kết nối database thật — đó là Testcontainers. (D) sai vì hai tên gọi khác nhau ở mục đích, không phải đồng nghĩa.`,
    },
    {
      q: 'N+1 query xảy ra khi nào?',
      options: [
        'Khi thực hiện 1 truy vấn duy nhất trả về N bản ghi',
        'Khi thực hiện 1 truy vấn lấy danh sách N phần tử rồi thực hiện thêm N truy vấn để lấy dữ liệu liên quan cho từng phần tử',
        'Khi database có N+1 bảng',
        'Khi có N+1 người dùng truy cập cùng lúc',
      ],
      answer: 1,
      explain: `N+1 nghĩa là 1 truy vấn ban đầu cộng N truy vấn phụ (thường trong vòng lặp). Ví dụ: lấy 100 đơn hàng (1) rồi với mỗi đơn lấy khách hàng (100) = 101 truy vấn. Cách khắc phục: dùng batch fetch/join để lấy dữ liệu liên quan trong 1-2 truy vấn. (A) chỉ là một truy vấn trả N bản ghi — không có vòng lặp gọi DB nên không phải N+1. (C) số bảng trong schema không liên quan gì tới số truy vấn. (D) N là số phần tử của danh sách, không phải số người dùng đồng thời.`,
    },
    {
      q: 'Vì sao nên assert số lần gọi repository (query budget) trong test khi đọc danh sách?',
      options: [
        'Vì số lần gọi càng nhiều thì code càng đúng',
        'Vì giúp phát hiện sớm hồi quy N+1: nếu ai đó đổi sang lặp gọi từng phần tử, test sẽ fail do vượt ngân sách truy vấn',
        'Vì framework bắt buộc phải đếm số lần gọi',
        'Vì stub không thể trả về dữ liệu đúng nếu không đếm',
      ],
      answer: 1,
      explain: `Test chỉ kiểm tra kết quả có thể pass dù code thực hiện N+1 truy vấn (kết quả vẫn đúng nhưng chậm). Đặt ngưỡng {{totalCalls <= 2}} biến yêu cầu hiệu năng thành điều kiện kiểm thử tự động, ngăn hồi quy khi refactor hoặc thêm tính năng.`,
    },
  ],
  related: ['testing-002', 'testing-003', 'testing-009'],
  tags: ['test-double', 'stub', 'mock', 'fake', 'n+1', 'repository', 'performance'],
},
{
  id: 'lesson-testing-012',
  track: 'testing',
  order: 12,
  title: 'Test tích hợp đúng cách cho Spring Boot 3: test pyramid, slice test, Testcontainers và dọn dữ liệu',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích test pyramid (tháp kiểm thử) và chọn đúng tầng test cho từng loại logic',
    'Phân biệt @SpringBootTest với @WebMvcTest/@DataJpaTest và biết vì sao slice test nhanh hơn',
    'Dùng Testcontainers với @ServiceConnection để test trên PostgreSQL thật, và dọn dữ liệu giữa các test để diệt flaky',
  ],
  body: `**Tóm tắt:** Test pyramid (tháp kiểm thử) nói rằng càng lên cao càng ít test: rất nhiều unit test nhanh ở đáy, vừa phải slice/integration test ở giữa, rất ít end-to-end test ở đỉnh. Mỗi annotation của Spring Boot nạp một phần context khác nhau — {{@WebMvcTest}} chỉ nạp tầng web, {{@DataJpaTest}} chỉ nạp JPA, {{@SpringBootTest}} nạp tất cả — nên chọn đúng slice giúp test nhanh gấp nhiều lần. Với database thật, Testcontainers cộng {{@ServiceConnection}} cho bạn PostgreSQL trong container; dữ liệu phải được dọn sau mỗi test (transaction rollback, {{@Sql}} hoặc truncate), nếu không test sẽ flaky.

### Vì sao phải chọn đúng tầng test
Một hệ thống có nhiều tầng: controller (nhận HTTP), service (logic nghiệp vụ), repository (truy vấn SQL), database thật. Nếu test nào cũng dựng cả hệ thống (mở Spring context, kết nối database, gọi HTTP), test sẽ chạy rất chậm và dễ vỡ. **Test pyramid** (tháp kiểm thử — hình tháp chia theo số lượng và tốc độ) trả lời câu hỏi "nên viết bao nhiêu test ở mỗi tầng".

| Tầng | Tên tiếng Anh | Đặc điểm | Số lượng | Tốc độ |
|---|---|---|---|---|
| Đáy | Unit test | Một class, không Spring, không DB | Rất nhiều | Vài mili giây |
| Giữa | Slice / integration test | Một lát mỏng của app (chỉ web, chỉ JPA) | Vừa phải | Vài trăm mili giây |
| Đỉnh | End-to-end test | Chạy toàn bộ app qua HTTP thật | Rất ít | Vài giây |

Nguyên tắc: **càng lên cao càng ít test**. Logic nghiệp vụ thuần (tính phí, tính thuế, kiểm tra điều kiện) nên nằm ở đáy — viết unit test rẻ và nhanh. Chỉ những thứ **chỉ sai khi có hạ tầng thật** (SQL, transaction, JSON binding, security filter) mới cần slice hoặc e2e test. Một sai lầm phổ biến là viết 500 test e2e chậm chạp thay vì 5000 unit test nhanh: CI thành 40 phút và ai cũng ngại chạy.

### Ba annotation cần phân biệt
Spring Boot 3 cung cấp các "slice test" — mỗi annotation chỉ nạp một phần context:

| Annotation | Nạp gì | KHÔNG nạp gì | Dùng khi |
|---|---|---|---|
| {{@SpringBootTest}} | Toàn bộ application context: mọi bean, mọi auto-config | (không, đây là full context) | Cần cả chuỗi controller→service→repository→DB |
| {{@WebMvcTest}} | Controller, filter, exception handler, Jackson | Service, repository, JPA, DB | Test HTTP: status, JSON, validation, security |
| {{@DataJpaTest}} | Repository Spring Data, EntityManager, datasource | Controller, service, web | Test truy vấn SQL, JPQL, mapping |

**Cơ chế bên trong:** {{@WebMvcTest}} không tạo bean {{OrderService}} hay {{DataSource}}, nên context khởi tạo trong khoảng 300–600 ms thay vì 3–8 giây như {{@SpringBootTest}}. Bạn phải **mock** các dependency mà controller cần (bằng {{@MockitoBean}} của Spring Boot 3.4+, hoặc {{@MockBean}} ở bản cũ hơn). {{@DataJpaTest}} mặc định chạy trong **transaction rollback**: mỗi test chạy trong một transaction, xong thì tự rollback, nên database sạch sau mỗi test (bạn không phải dọn tay).

### Ví dụ: test controller bằng @WebMvcTest
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired MockMvc mvc;              // giả lập HTTP request/response, không mở port thật
    @MockitoBean OrderService service;   // thay service bằng mock: controller không gọi DB

    @Test
    void getOrder_returnsJson() throws Exception {
        given(service.find(7L)).willReturn(new Order(7L, "PAID", 120_000));

        mvc.perform(get("/api/orders/7"))       // gửi GET giả lập
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("PAID"))
           .andExpect(jsonPath("$.total").value(120000));
    }
}
~~~

Ở đây không có database nào cả: service là mock, controller chỉ được kiểm tra về mặt HTTP. Nếu bạn dùng {{@SpringBootTest}} cho việc này, mỗi lần chạy mất vài giây và cần Postgres thật — quá đắt cho một test chỉ kiểm tra JSON.

### Testcontainers với @ServiceConnection: test trên PostgreSQL thật
Fake/H2 (database nhỏ chạy trong bộ nhớ) trả lời nhanh nhưng **khác PostgreSQL thật**: H2 không hỗ trợ {{SELECT FOR UPDATE}} đúng ngữ nghĩa, không có {{jsonb}}, hành vi transaction isolation khác. Những bug này chỉ lộ ra trên DB thật. **Testcontainers** là thư viện khởi động Docker container từ bên trong test: nó chạy một container PostgreSQL, chờ tới khi sẵn sàng, rồi trả về connection.

@ServiceConnection (Spring Boot 3.1+) tự động trỏ datasource của app vào container đó, bạn không cần khai báo URL rườm rà:

~~~java
@SpringBootTest
@Testcontainers                                   // bật tích hợp JUnit 5 cho Testcontainers
class OrderRepositoryIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired OrderRepository repository;

    @Test
    void lockRow_blocksConcurrentUpdate() { /* dùng DB thật, SELECT FOR UPDATE */ }
}
~~~

**Vì sao đắt hơn fake:** mỗi container mất 3–15 giây để khởi động và chiếm RAM. Vì vậy khai báo {{static}} (dùng chung cho cả class) để container chỉ khởi động một lần, không phải mỗi test. Đặt tên class là {{*IT}} (integration test) rồi cấu hình Failsafe chạy riêng, để build nhanh (Surefire, chỉ unit test) không phải chờ container.

### Dọn dữ liệu giữa các test: nguyên nhân flaky số một
Flaky test (test chập chờn — lúc xanh lúc đỏ dù code không đổi) hay đến từ **dữ liệu dùng chung**. Nếu test A tạo đơn hàng id=1 và không dọn, test B chạy sau thấy "đã tồn tại" và đỏ — nhưng chạy một mình thì xanh. Đây là lỗi phụ thuộc thứ tự.

Ba cách dọn, chọn theo ngữ cảnh:

| Cách | Cơ chế | Khi nào |
|---|---|---|
| Transaction rollback | {{@DataJpaTest}} tự rollback sau mỗi test | Test chỉ đọc/ghi qua JPA, không cần commit thật |
| {{@Sql(scripts=..., executionPhase=AFTER_TEST_METHOD)}} | Chạy script SQL xoá bảng sau mỗi test | Cần dữ liệu thật sự commit (test isolation, test @Async) |
| Truncate thủ công trong {{@BeforeEach}} | {{TRUNCATE TABLE ... RESTART IDENTITY CASCADE}} | Test @SpringBootTest dùng DB thật, cần sạch tuyệt đối |

Với Testcontainers + {{@SpringBootTest}}, transaction rollback **không** áp dụng tự động (không có slice), nên phải dùng {{@Sql}} hoặc truncate. Đừng quên {{RESTART IDENTITY}} nếu test dựa vào id tăng dần, và {{CASCADE}} để xoá cả bảng con.

### Một test tích hợp hoàn chỉnh
~~~java
@SpringBootTest
@Testcontainers
@Transactional                 // rollback sau mỗi test: dữ liệu tự sạch
class OrderServiceIT {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired OrderService service;
    @Autowired OrderRepository repo;

    @Test
    void placeOrder_savesOrderWithStatusPaid() {
        Order saved = service.place(new PlaceOrder("CUST-1", 250_000));
        assertThat(saved.status()).isEqualTo("PAID");
        assertThat(repo.findById(saved.id())).isPresent();   // đọc lại từ DB thật
    }
}
~~~

{{@Transactional}} trên test class khiến mọi thao tác DB chạy trong một transaction và rollback khi test kết thúc. Kết hợp Testcontainers, bạn có DB thật + tự sạch — vừa đúng ngữ nghĩa PostgreSQL, vừa không lây dữ liệu.

### Bẫy production hay gặp
- **Dùng {{@SpringBootTest}} cho mọi thứ**: mỗi test vài giây, suite 500 test thành 40 phút. Hãy dùng slice test cho controller/JPA, chỉ dùng full context cho test cần nhiều bean phối hợp.
- **Quên {{@DirtiesContext}} khi đổi cấu hình**: nếu test thay đổi bean (ví dụ đổi clock, đổi datasource) mà không đánh dấu, các test sau dùng context cũ đã bị thay đổi. Nhưng lạm dụng {{@DirtiesContext}} (xoá context sau mỗi test) làm mọi test phải khởi tạo lại — rất chậm.
- **Container khai báo non-static**: Testcontainers khởi động lại container cho từng test, tăng thời gian từ vài giây lên hàng chục giây.
- **Dọn dữ liệu bằng tay không đủ**: chỉ xoá bảng chính mà quên bảng liên kết, hoặc quên reset sequence, khiến id nhảy cóc và test dựa vào id đỏ ngẫu nhiên.
- **Test phụ thuộc thứ tự ngầm định**: đặt tên test {{test01_...}}, {{test02_...}} rồi dựa vào thứ tự đó — JUnit không đảm bảo thứ tự, và chạy song song sẽ vỡ. Mỗi test phải tự tạo dữ liệu của nó.

> Senior tip: mình từng điều tra một suite flaky 1/20 lần đỏ. Nguyên nhân: một test @SpringBootTest dùng chung database, chạy song song với test khác, cả hai cùng insert id=1. Cách sửa không phải tăng timeout mà là thêm {{RESTART IDENTITY}} vào truncate trong {{@BeforeEach}} và tách riêng nhóm test có DB thật. Sau đó flaky về 0. Nguyên tắc: nếu một test đỏ không tái hiện được khi chạy một mình, gần như chắc chắn là shared state.

### Ví dụ đời thực: suite 480 test mất 38 phút vì lạm dụng @SpringBootTest
Một team có 480 test, trong đó 430 test dùng {{@SpringBootTest}} đầy đủ context: mỗi test phải khởi tạo context (3–8 giây) rồi mới chạy được một assertion. CI mất 38 phút, dev ngại chạy nên cứ đẩy code rồi chờ pipeline. Đội đo lại và thấy 300 test trong số đó chỉ kiểm tra HTTP (status, JSON) hoặc truy vấn repository đơn giản — không cần cả app. Sau khi chuyển 300 test sang {{@WebMvcTest}} (300–600 ms) và {{@DataJpaTest}}, chỉ giữ {{@SpringBootTest}} cho 12 test cần nhiều bean thật phối hợp, thời gian còn khoảng 6 phút. Phần Testcontainers chỉ dành cho các test SQL đặc thù ({{SELECT FOR UPDATE}}, {{jsonb}}, isolation level) mà H2 không mô phỏng được.

### Trả lời mẫu khi phỏng vấn
"Khi được hỏi 'test tích hợp thế nào cho đúng?', tôi nói: chọn tầng test theo câu hỏi cần trả lời. Test controller bằng {{@WebMvcTest}} — chỉ nạp web layer, service mock bằng {{@MockitoBean}}, chạy vài trăm mili giây. Test truy vấn bằng {{@DataJpaTest}} — có transaction rollback nên DB tự sạch. Chỉ dùng {{@SpringBootTest}} khi cần nhiều bean thật phối hợp, vì mỗi context tốn vài giây. Với SQL đặc thù của PostgreSQL ({{SELECT FOR UPDATE}}, {{jsonb}}, isolation level) thì H2 không đủ, tôi dùng Testcontainers với {{@ServiceConnection}} để trỏ datasource vào container thật, khai báo container {{static}} để chỉ khởi động một lần cho cả class. Dữ liệu phải được dọn sau mỗi test bằng truncate {{RESTART IDENTITY CASCADE}} hoặc {{@Sql}}, nếu không test sẽ flaky vì phụ thuộc thứ tự. Cuối cùng tôi theo dõi thời gian suite như một chỉ số: một PR làm CI chậm thêm 30% là tín hiệu có test vừa được viết sai tầng."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "{{@SpringBootTest}} khác {{@WebMvcTest}} ở đâu?", "Testcontainers với @ServiceConnection hoạt động thế nào?", "Bạn dọn dữ liệu giữa các test ra sao?", "Test pyramid là gì và bạn phân bổ test thế nào?". Trả lời tốt: nói rõ slice test nạp một phần context nên nhanh; Testcontainers chạy container thật và {{@ServiceConnection}} tự nối datasource; dọn dữ liệu bằng transaction rollback cho slice, bằng {{@Sql}}/truncate cho full context; và nhấn mạnh "càng lên cao càng ít test". Bài tập dưới đây mô phỏng cơ chế "quét annotation + đếm truy vấn + dọn dữ liệu" bằng Java thuần để bạn thấy vì sao slice test nhanh và vì sao phải dọn.`,
  exercises: [
    {
      title: 'SliceTestSimulator: quét annotation, đếm truy vấn DB và dọn dữ liệu',
      prompt: `Mô phỏng cách một test runner quyết định "dựng hạ tầng nào" dựa trên annotation, và cách fake database đếm truy vấn + dọn dữ liệu. Viết trong class {{SliceTestSimulator}}:

- {{ infrastructureFor(TestCase tc) }}: trả về tên hạ tầng cần dựng:
  - {{webSlice}} nếu chỉ có annotation {{@WebMvcTest}} (không có @SpringBootTest, không có @DataJpaTest).
  - {{dataJpaSlice}} nếu có {{@DataJpaTest}} (và không có @SpringBootTest).
  - {{fullContext}} nếu có {{@SpringBootTest}} (ưu tiên cao nhất).
  - {{unitTest}} nếu không có annotation nào trong ba cái trên.
  - Các annotation không phải ba cái trên (ví dụ {{@SomethingElse}}) được bỏ qua, không ảnh hưởng kết quả.
- {{ totalQueries(TestCase tc) }}: giả lập số truy vấn database. Mỗi vòng lặp của {{for}} trong {{exercises}} được mô phỏng bằng một lần gọi {{String exercise}} có chứa ký tự ký tự L in hoa (viết tắt "loop"); mỗi lần như vậy là 1 truy vấn. Cộng thêm 1 nếu exercise gọi {{findById}}. Cộng thêm 2 nếu exercise gọi {{findAll}}.
- {{ runIsolated(TestCase tc) }}: nếu {{tc.transactional()}} là true → trả về {{true}} (transaction rollback tự dọn). Nếu không, chạy dọn dữ liệu: đặt {{rows.clear()}}, tăng {{truncateCount}}, rồi trả về {{rows.isEmpty()}}.

Test sẽ tạo các TestCase khác nhau và kiểm tra từng nhánh, nên đọc kỹ các hằng số và enum đã cho.`,
      starter: `import java.util.*;

class SliceTestSimulator {

    enum Infra { UNIT, WEB_SLICE, DATA_JPA_SLICE, FULL_CONTEXT }

    static final class TestCase {
        final String name;
        final List<String> annotations;
        final List<String> exercises;   // mỗi phần tử mô phỏng một câu lệnh trong test
        final boolean transactional;

        TestCase(String name, List<String> annotations, List<String> exercises, boolean transactional) {
            this.name = name;
            this.annotations = annotations;
            this.exercises = exercises;
            this.transactional = transactional;
        }
    }

    static String infrastructureFor(TestCase tc) {
        throw new UnsupportedOperationException("TODO");
    }

    static int totalQueries(TestCase tc) {
        throw new UnsupportedOperationException("TODO");
    }

    // Dùng chung bởi runIsolated: mô phỏng bảng DB bằng một danh sách "hàng".
    static List<String> rows = new ArrayList<>();
    static int truncateCount = 0;

    static boolean runIsolated(TestCase tc) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static SliceTestSimulator.TestCase tc(String name, List<String> ann, List<String> ex, boolean tx) {
        return new SliceTestSimulator.TestCase(name, ann, ex, tx);
    }
    public static void main(String[] args) {
        check("web slice when only @WebMvcTest", () -> {
            eq("webSlice", SliceTestSimulator.infrastructureFor(tc("t", List.of("@WebMvcTest"), List.of(), false)));
        });
        check("data jpa slice when only @DataJpaTest", () -> {
            eq("dataJpaSlice", SliceTestSimulator.infrastructureFor(tc("t", List.of("@DataJpaTest"), List.of(), false)));
        });
        check("full context wins over slice annotations", () -> {
            eq("fullContext", SliceTestSimulator.infrastructureFor(tc("t",
                List.of("@SpringBootTest", "@WebMvcTest", "@DataJpaTest"), List.of(), false)));
        });
        check("unit test when no infrastructure annotation", () -> {
            eq("unitTest", SliceTestSimulator.infrastructureFor(tc("t",
                List.of("@DisplayName", "@SomethingElse"), List.of(), false)));
        });
        check("queries: loop costs 1 per L, plus findById and findAll", () -> {
            SliceTestSimulator.TestCase t = tc("t", List.of(), List.of("findAll", "L", "findById", "L", "L"), false);
            eq(6, SliceTestSimulator.totalQueries(t));   // findAll=2 + findById=1 + 3 vòng lặp=3 => 6
        });
        check("queries with only loops", () -> {
            eq(2, SliceTestSimulator.totalQueries(tc("t", List.of(), List.of("L", "L"), false)));
        });
        check("queries with no db access", () -> {
            eq(0, SliceTestSimulator.totalQueries(tc("t", List.of(), List.of("assert", "assertEquals"), false)));
        });
        check("transactional test is isolated without truncate", () -> {
            SliceTestSimulator.rows.clear();
            SliceTestSimulator.rows.add("row1");
            boolean clean = SliceTestSimulator.runIsolated(tc("t", List.of(), List.of(), true));
            eq(true, clean);
            eq(0, SliceTestSimulator.truncateCount);   // không cần truncate vì transaction rollback
        });
        check("non-transactional test truncates and empties the table", () -> {
            SliceTestSimulator.rows.clear();
            SliceTestSimulator.truncateCount = 0;
            SliceTestSimulator.rows.add("a");
            SliceTestSimulator.rows.add("b");
            boolean clean = SliceTestSimulator.runIsolated(tc("t", List.of(), List.of(), false));
            eq(true, clean);
            eq(1, SliceTestSimulator.truncateCount);
            eq(0, SliceTestSimulator.rows.size());
        });
        check("truncate is idempotent across runs", () -> {
            SliceTestSimulator.rows.clear();
            SliceTestSimulator.truncateCount = 0;
            SliceTestSimulator.runIsolated(tc("t", List.of(), List.of(), false));
            SliceTestSimulator.rows.add("x");
            SliceTestSimulator.runIsolated(tc("t", List.of(), List.of(), false));
            eq(2, SliceTestSimulator.truncateCount);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;

class SliceTestSimulator {

    enum Infra { UNIT, WEB_SLICE, DATA_JPA_SLICE, FULL_CONTEXT }

    static final class TestCase {
        final String name;
        final List<String> annotations;
        final List<String> exercises;
        final boolean transactional;

        TestCase(String name, List<String> annotations, List<String> exercises, boolean transactional) {
            this.name = name;
            this.annotations = annotations;
            this.exercises = exercises;
            this.transactional = transactional;
        }
    }

    static String infrastructureFor(TestCase tc) {
        if (tc.annotations.contains("@SpringBootTest")) return "fullContext";
        if (tc.annotations.contains("@WebMvcTest")) return "webSlice";
        if (tc.annotations.contains("@DataJpaTest")) return "dataJpaSlice";
        return "unitTest";
    }

    static int totalQueries(TestCase tc) {
        int q = 0;
        for (String e : tc.exercises) {
            if (e.contains("L")) q += 1;          // mỗi vòng lặp = 1 truy vấn cho phần tử
            if (e.contains("findById")) q += 1;
            if (e.contains("findAll")) q += 2;
        }
        return q;
    }

    static List<String> rows = new ArrayList<>();
    static int truncateCount = 0;

    static boolean runIsolated(TestCase tc) {
        if (tc.transactional) {                       // transaction rollback: dữ liệu tự sạch
            rows.clear();
            return rows.isEmpty();
        }
        rows.clear();                                 // dọn bằng truncate
        truncateCount++;
        return rows.isEmpty();
    }
}`,
      hints: [
        '{{infrastructureFor}}: kiểm tra {{@SpringBootTest}} TRƯỚC (ưu tiên cao nhất), rồi tới {{@WebMvcTest}}, {{@DataJpaTest}}; không có cái nào thì trả {{unitTest}}.',
        '{{totalQueries}}: duyệt từng phần tử trong {{tc.exercises}}; cộng 1 nếu chứa ký tự L in hoa (vòng lặp), cộng 1 nếu chứa {{findById}}, cộng 2 nếu chứa {{findAll}}.',
        '{{runIsolated}}: nếu {{transactional}} thì {{rows.clear()}} rồi trả về {{rows.isEmpty()}} (rollback lo việc dọn, không cần truncate); nếu không thì {{rows.clear()}}, tăng {{truncateCount}} rồi trả về {{rows.isEmpty()}}.',
      ],
      explain: `Bài này mô phỏng hai quyết định mà Spring Boot/Surefire làm thật:

- **Chọn hạ tầng theo annotation**: @SpringBootTest nạp full context (chậm), @WebMvcTest chỉ nạp web (nhanh), @DataJpaTest chỉ nạp JPA. Thứ tự ưu tiên là full > web > dataJpa, vì nếu có @SpringBootTest thì các slice khác không cần.
- **Đếm truy vấn và dọn dữ liệu**: mỗi vòng lặp là một truy vấn N+1 thu nhỏ; transactional test tự rollback (không cần truncate), còn full context phải truncate thủ công (tăng {{truncateCount}}).

Lỗi hay gặp: quên ưu tiên @SpringBootTest khiến test web bị nhận nhầm là full context; đếm truy vấn sai công thức; và với test không transactional, quên dọn khiến test sau thấy dữ liệu rác.`,
    },
  ],
  check: [
    {
      q: 'Bạn chỉ cần test một controller REST: kiểm tra status HTTP, JSON trả về và validation đầu vào. Annotation nào phù hợp nhất?',
      options: [
        '@SpringBootTest (nạp toàn bộ context)',
        '@WebMvcTest (chỉ nạp controller, filter, Jackson; mock service)',
        '@DataJpaTest (chỉ nạp repository và JPA)',
        'Không cần annotation, viết main() thuần',
      ],
      answer: 1,
      explain: '@WebMvcTest nạp đúng lát mỏng web: controller, filter, exception handler, Jackson. Bạn mock service bằng @MockitoBean nên không cần DB. @SpringBootTest nạp cả app, chậm hơn vài giây và cần hạ tầng; @DataJpaTest chỉ dành cho repository; main() thuần không test được vòng HTTP.',
    },
    {
      q: 'Vì sao khai báo container Testcontainers là static và dùng chung cho cả class?',
      options: [
        'Vì Testcontainers không hỗ trợ instance field',
        'Để container chỉ khởi động một lần, tránh mỗi test khởi động lại mất vài giây',
        'Vì @ServiceConnection bắt buộc static',
        'Vì container không thể tạo trong @BeforeEach',
      ],
      answer: 1,
      explain: 'Container mất 3–15 giây để khởi động. Nếu khai báo non-static, mỗi test (hoặc mỗi instance test) khởi động lại một container, biến suite thành hàng chục giây. Static + @Container khiến container dùng chung cho cả class. Testcontainers hoàn toàn hỗ trợ instance field; @ServiceConnection không bắt buộc static; và container có thể tạo trong @BeforeEach nhưng sẽ rất chậm.',
    },
    {
      q: 'Test @SpringBootTest của bạn thỉnh thoảng đỏ khi chạy cùng các test khác, nhưng xanh khi chạy một mình. Nguyên nhân khả dĩ nhất?',
      options: [
        'JVM chạy out of memory',
        'Dữ liệu dùng chung (shared state): test khác để lại row làm test này thấy bản ghi đã tồn tại',
        'Testcontainers không hỗ trợ PostgreSQL',
        'JUnit không cho chạy song song',
      ],
      answer: 1,
      explain: 'Triệu chứng "xanh khi chạy một mình, đỏ khi chạy cùng" là dấu hiệu kinh điển của shared state: dữ liệu rò rỉ giữa các test do không dọn (hoặc do chạy song song). Cách sửa là dọn dữ liệu trong @BeforeEach (truncate RESTART IDENTITY CASCADE) hoặc dùng @Transactional cho slice test. OOM và Testcontainers không phải nguyên nhân điển hình; JUnit hoàn toàn cho phép chạy song song (bạn phải tự bật cấu hình).',
    },
  ],
  related: ['testing-001', 'testing-002', 'testing-050'],
  tags: ['test pyramid', '@SpringBootTest', '@WebMvcTest', '@DataJpaTest', 'Testcontainers', '@ServiceConnection', 'integration test', 'flaky'],
},
{
  id: 'lesson-testing-013',
  track: 'testing',
  order: 13,
  title: 'Test double: stub vs mock vs fake vs spy — viết fake repository và đếm lời gọi',
  level: 'mid',
  minutes: 30,
  goals: [
    'Phân biệt được dummy, stub, spy, mock và fake, cùng hai kiểu kiểm chứng state và interaction',
    'Tự viết được một fake repository và một spy đếm lời gọi bằng Java thuần, không cần Mockito',
    'Nhận ra mùi over-mocking và biết khi nào nên thay mock bằng fake hoặc test tích hợp',
  ],
  body: `**Tóm tắt:** Test double gồm năm loại — dummy, stub, spy, mock, fake — khác nhau ở mục đích: stub trả lời câu hỏi, mock kiểm tra hành vi, fake thay cả một cài đặt. Có hai cách khẳng định một test: state verification (kiểm tra trạng thái cuối) và interaction verification (kiểm tra service đã gọi collaborator đúng cách). Bài học này giúp bạn chọn đúng loại double để test không cản trở refactor.

### Vì sao cần test double
Một unit test tốt chỉ muốn kiểm tra **một** đơn vị logic. Nhưng đơn vị đó thường gọi ra ngoài: database, HTTP, hàng đợi, đồng hồ hệ thống. Nếu test thật sự gọi Postgres hay API ngân hàng thì test sẽ chậm, flaky và không chạy được trên máy không có hạ tầng. **Test double** là object thay thế cho collaborator thật, được tạo riêng cho mục đích kiểm thử.

Gerard Meszaros và Martin Fowler phân biệt năm loại, khác nhau ở **mục đích** chứ không phải ở cách viết:

| Loại | Nhiệm vụ | Ví dụ |
|---|---|---|
| Dummy | Chỉ để lấp tham số, không bao giờ được gọi | Truyền {{null}} cho một logger không dùng |
| Stub | Trả về dữ liệu định trước cho lời gọi | Repository luôn trả tài khoản có số dư 1.000 |
| Spy | Ghi lại lời gọi để test kiểm tra sau | Đếm số lần gửi email, lưu tham số |
| Mock | Đối tượng mà test **đặt kỳ vọng** tương tác lên | Kỳ vọng {{send}} được gọi đúng một lần |
| Fake | Cài đặt thật nhưng đơn giản hơn | Repository lưu trong {{HashMap}} |

Ranh giới giữa spy và mock khá mờ: Mockito gọi tất cả là mock, còn "verify" chính là kiểm chứng interaction. Điểm cần nhớ: **stub trả lời câu hỏi, mock kiểm tra hành vi, fake thay thế cả một cài đặt**.

### State verification và interaction verification
Có hai cách khẳng định một test:

- **State verification**: chạy xong, nhìn vào trạng thái cuối cùng. Ví dụ sau khi chuyển 200, số dư hai tài khoản phải là 800 và 700. Cách này bền vững vì nó không quan tâm service gọi repository mấy lần, miễn kết quả đúng.
- **Interaction verification**: khẳng định service đã gọi collaborator đúng cách. Ví dụ phải gọi {{notifier.transferCompleted("ACC-2", 200)}} đúng một lần. Cách này cần thiết khi tác dụng phụ **không quan sát được** qua state, như gửi email, publish event, gọi cổng thanh toán.

Sai lầm phổ biến là dùng interaction verification cho mọi thứ. Khi đó test biết quá nhiều về **cách** service làm việc. Bạn đổi từ hai lần {{save}} thành một lần {{saveAll}} — hành vi nghiệp vụ không đổi nhưng hàng chục test đỏ. Đây là **over-specification**, nguyên nhân số một khiến test cản trở refactor.

### Fake repository: thay cả một cài đặt
Fake không phải "trả dữ liệu giả" đơn thuần. Nó cài đặt **cùng interface** với cài đặt thật, nhưng bằng cấu trúc dữ liệu đơn giản, và cố gắng giữ đúng ngữ nghĩa quan trọng:

~~~java
interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        return Optional.ofNullable(accounts.get(id));   // đúng ngữ nghĩa "không có"
    }

    @Override public void save(Account account) {
        accounts.put(account.id(), account);            // save là upsert, giống JPA merge
    }
}
~~~

Vì fake lưu thật trong bộ nhớ, bạn test được **cả chuỗi** đọc-sửa-ghi: gieo hai tài khoản, gọi chuyển tiền, rồi đọc lại số dư. Test không cần biết service gọi {{find}} hay {{save}} bao nhiêu lần, nên refactor bên trong service không làm test đỏ. Fake đặc biệt hợp với repository, gateway, cache, clock — những collaborator có hành vi **có trạng thái**.

Cái giá: fake là **code phải bảo trì**. Nếu fake xử lý khác thật (ví dụ {{save}} ghi đè trong khi database có ràng buộc unique) thì test xanh mà production đỏ. Giữ fake nhỏ, chỉ mô phỏng hành vi mà test thật sự dựa vào, và đừng dùng fake để thay thế integration test cho SQL phức tạp.

### Stub: chỉ cần một câu trả lời
Stub dùng khi test cần collaborator trả về một giá trị cụ thể, không quan tâm nó bị gọi thế nào:

~~~java
class FixedRateGateway implements RateGateway {
    private final BigDecimal rate;
    FixedRateGateway(String rate) { this.rate = new BigDecimal(rate); }
    @Override public BigDecimal rateFor(String currency) { return rate; }  // luôn 25.100
}
~~~

Với Mockito, stub viết bằng {{when(gateway.rateFor("USD")).thenReturn(new BigDecimal("25100"))}}. Stub rất rẻ và không cần verify. Nhưng nếu bạn stub quá nhiều method để "chạy được", đó là dấu hiệu object đang phụ thuộc quá nhiều thứ.

### Spy: ghi lại để kiểm tra sau
Khi tác dụng phụ không nhìn thấy được qua state, hãy dùng spy hoặc mock để kiểm tra interaction. Một spy viết tay rất đơn giản:

~~~java
class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        calls.add(accountId + ":" + amount);          // ghi lại đúng tham số
    }

    List<String> calls() { return calls; }            // test đọc sau khi chạy
}
~~~

Sau đó test khẳng định {{calls.size() == 1}} và {{calls.get(0).equals("ACC-2:200")}}. Đây là interaction verification nhưng **không phụ thuộc thư viện**, dễ đọc và dễ debug hơn {{verify(notifier).transferCompleted(...)}} khi tham số phức tạp.

Đừng lạm dụng: chỉ verify những tương tác **là hợp đồng nghiệp vụ**. "Phải gửi đúng một thông báo cho người nhận" là hợp đồng. "Phải gọi {{find}} trước {{save}}" thường chỉ là chi tiết cài đặt.

### Khi nào dùng cái nào
| Tình huống | Nên dùng | Lý do |
|---|---|---|
| Repository, cache, gateway có trạng thái | Fake | Test được cả luồng đọc-ghi, không khoá vào số lời gọi |
| Collaborator chỉ cấp dữ liệu vào | Stub | Một giá trị cố định là đủ |
| Gửi email, publish event, gọi thanh toán | Mock hoặc spy | Tác dụng phụ không quan sát được qua state |
| Value object, DTO, record | Không double | Tạo object thật rẻ hơn và đúng hơn |
| SQL, transaction, serialization | Test tích hợp | Double sẽ che mất lỗi thật của hạ tầng |

Một quy tắc thực dụng: **mock ở biên của hệ thống, fake ở biên của tầng, còn logic thuần thì không cần double nào**. Nếu một class cần mock 6 dependency, vấn đề không nằm ở test mà ở thiết kế class đang ôm quá nhiều trách nhiệm.

### Bẫy production hay gặp
- **Mock trả giá trị "rỗng" theo mặc định**: method chưa stub trên mock Mockito trả {{null}} cho object thường, 0/false cho kiểu nguyên thuỷ, collection rỗng và {{Optional.empty()}} — nên test có thể "xanh" vì đi nhầm nhánh "không tìm thấy", hoặc đỏ vì {{NullPointerException}} khó hiểu. Dùng {{@ExtendWith(MockitoExtension.class)}}: chế độ strict stubs mặc định báo {{UnnecessaryStubbingException}} khi có stub không được dùng tới, giúp phát hiện stub sai tham số.
- **Verify quá chặt**: {{verify(repo, times(2)).save(any())}} làm test đỏ khi refactor sang {{saveAll}}. Ưu tiên state verification khi có thể.
- **Fake lệch thật**: fake cho phép hai bản ghi trùng key trong khi database có unique constraint. Test xanh, production lỗi. Những ràng buộc quan trọng phải được test ở tầng tích hợp.
- **Chia sẻ fake có trạng thái giữa các test**: dữ liệu rò rỉ làm test phụ thuộc thứ tự. Tạo fake mới trong mỗi test hoặc có hàm {{clear()}} gọi ở {{@BeforeEach}}.
- **Mock value object và kiểu JDK**: đừng mock {{List}}, {{BigDecimal}}, {{LocalDate}} hay DTO của bạn — tạo object thật vừa rẻ vừa đúng hơn. Tương tự nguyên tắc "don't mock what you don't own": thay vì mock trực tiếp client của thư viện bên thứ ba (AWS SDK, RestTemplate), hãy bọc nó sau một interface của mình rồi mock/fake interface đó, còn client thật thì test tích hợp (WireMock, Testcontainers).

> Senior tip: khi review test, hãy hỏi "nếu ngày mai tôi đổi cách cài đặt bên trong service, test này có đỏ không?". Nếu có mà hành vi nghiệp vụ không đổi, test đang kiểm tra implementation chứ không kiểm tra hợp đồng. Đội trưởng giỏi thường giữ tỉ lệ verify interaction rất thấp, chỉ ở những biên như thanh toán, thông báo và event.

### Ví dụ đời thực: service chuyển tiền và 23 test đỏ
Một team đang maintain {{TransferService}}. Ban đầu mọi test đều dùng Mockito: mock repository, mock notifier. Khi team refactor bên trong service — đổi từ hai lần {{save}} thành một lần {{saveAll}} để giảm round-trip database — **23 test đỏ** dù hành vi nghiệp vụ không đổi: số dư cuối cùng hai tài khoản vẫn đúng 800 và 700. Đội mất hai ngày phân loại: test nào kiểm tra kết quả (dùng fake), test nào kiểm tra số lần gọi (over-specification). Sau khi thay {{FakeAccountRepository}}, 23 test đỏ giảm còn 3 — chỉ những test kiểm tra interaction thực sự (gửi đúng một thông báo cho người nhận) còn đỏ. Kết quả: CI từ 12 phút xuống 4 phút và refactor không còn bị test cản trở.

### Trả lời mẫu khi phỏng vấn
"Khi interviewer hỏi 'phân biệt stub và mock', tôi sẽ nói: stub là người trả lời câu hỏi, mock là người kiểm tra hành vi. Stub chỉ cung cấp dữ liệu định trước — ví dụ repository luôn trả tài khoản có số dư 1.000 — mà không quan tâm nó được gọi thế nào. Mock đặt kỳ vọng về tương tác: {{verify(notifier).transferCompleted('ACC-2', 200)}} khẳng định đúng một lần gọi với đúng tham số. Fake là thứ thay cả một cài đặt: implement cùng interface bằng cấu trúc dữ liệu đơn giản, ví dụ HashMap, và giữ đúng ngữ nghĩa đọc-sau-ghi. Tôi chọn fake cho repository vì nó cho phép test cả chuỗi đọc-sửa-ghi mà không khóa vào số lần gọi method, nên refactor bên trong service không làm test đỏ. Mock chỉ dùng cho tác dụng phụ không quan sát được qua state, như gửi email hoặc publish event. Quy tắc thực dụng: mock ở biên của hệ thống, fake ở biên của tầng, logic thuần thì không cần double nào."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Phân biệt stub và mock", "fake khác mock ở đâu", "vì sao mock quá nhiều là code smell", và đưa một class có 5 dependency rồi hỏi bạn test thế nào. Câu trả lời tốt không phải là liệt kê định nghĩa mà là nói rõ **bạn đang kiểm chứng state hay interaction**, và vì sao chọn cách đó. Bài tập dưới đây bắt bạn tự viết fake và spy để thấy rõ khác biệt thay vì học thuộc.`,
  exercises: [
    {
      title: 'Tự viết fake repository và spy notifier cho luồng chuyển tiền',
      prompt: `Cho sẵn interface {{AccountRepository}}, {{Notifier}}, class {{Account}} và {{TransferService}}. Hãy hoàn thiện hai test double:

- {{FakeAccountRepository}}: lưu account trong {{HashMap}} theo {{id}}. {{find(id)}} trả {{Optional.empty()}} nếu chưa có, ngược lại trả account đã lưu. {{save(account)}} là **upsert** (cùng id thì ghi đè).
- {{RecordingNotifier}}: mỗi lần {{transferCompleted(accountId, amount)}} được gọi thì thêm chuỗi {{accountId + ":" + amount}} vào danh sách; {{calls()}} trả danh sách đó để test kiểm tra.

Không cần Mockito. Chú ý: fake phải giữ đúng ngữ nghĩa đọc-sau-ghi, vì {{TransferService}} đọc số dư rồi ghi lại.`,
      starter: `interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

interface Notifier {
    void transferCompleted(String accountId, long amount);
}

final class Account {
    private final String id;
    private final String owner;
    private final long balance;

    Account(String id, String owner, long balance) {
        this.id = id;
        this.owner = owner;
        this.balance = balance;
    }

    String id() { return id; }
    String owner() { return owner; }
    long balance() { return balance; }
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public void save(Account account) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() { return accounts.size(); }
}

class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    List<String> calls() { return calls; }
}

class TransferService {
    private final AccountRepository repo;
    private final Notifier notifier;

    TransferService(AccountRepository repo, Notifier notifier) {
        this.repo = repo;
        this.notifier = notifier;
    }

    void transfer(String fromId, String toId, long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        Account from = repo.find(fromId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + fromId));
        Account to = repo.find(toId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + toId));
        if (from.balance() < amount) throw new IllegalStateException("insufficient funds");
        repo.save(new Account(from.id(), from.owner(), from.balance() - amount));
        repo.save(new Account(to.id(), to.owner(), to.balance() + amount));
        notifier.transferCompleted(to.id(), amount);
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
    static void throwsType(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("mong đợi " + type.getSimpleName() + " nhưng nhận " + t.getClass().getSimpleName());
        }
        throw new AssertionError("mong đợi " + type.getSimpleName() + " nhưng không ném gì");
    }
    static FakeAccountRepository seeded() {
        FakeAccountRepository repo = new FakeAccountRepository();
        repo.save(new Account("ACC-1", "An", 1_000));
        repo.save(new Account("ACC-2", "Binh", 500));
        return repo;
    }
    public static void main(String[] args) {
        check("fake stores and finds an account", () -> {
            FakeAccountRepository repo = seeded();
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
            eq(Optional.empty(), repo.find("missing"));
            eq(2, repo.size());
        });
        check("fake save replaces the account with the same id", () -> {
            FakeAccountRepository repo = seeded();
            repo.save(new Account("ACC-1", "An", 999));
            eq(999L, repo.find("ACC-1").orElseThrow().balance());
            eq(2, repo.size());
        });
        check("transfer moves money and keeps both balances", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            new TransferService(repo, notifier).transfer("ACC-1", "ACC-2", 200);
            eq(800L, repo.find("ACC-1").orElseThrow().balance());
            eq(700L, repo.find("ACC-2").orElseThrow().balance());
        });
        check("spy records exactly one notification with receiver and amount", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            new TransferService(repo, notifier).transfer("ACC-1", "ACC-2", 200);
            eq(1, notifier.calls().size());
            eq("ACC-2:200", notifier.calls().get(0));
        });
        check("insufficient funds: no save, no notification", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            TransferService service = new TransferService(repo, notifier);
            throwsType(IllegalStateException.class, () -> service.transfer("ACC-2", "ACC-1", 10_000));
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
            eq(500L, repo.find("ACC-2").orElseThrow().balance());
            eq(0, notifier.calls().size());
        });
        check("unknown receiver: no notification; amount must be positive", () -> {
            FakeAccountRepository repo = seeded();
            RecordingNotifier notifier = new RecordingNotifier();
            TransferService service = new TransferService(repo, notifier);
            throwsType(IllegalArgumentException.class, () -> service.transfer("ACC-1", "ghost", 10));
            throwsType(IllegalArgumentException.class, () -> service.transfer("ACC-1", "ACC-2", 0));
            eq(0, notifier.calls().size());
            eq(1_000L, repo.find("ACC-1").orElseThrow().balance());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

interface Notifier {
    void transferCompleted(String accountId, long amount);
}

final class Account {
    private final String id;
    private final String owner;
    private final long balance;

    Account(String id, String owner, long balance) {
        this.id = id;
        this.owner = owner;
        this.balance = balance;
    }

    String id() { return id; }
    String owner() { return owner; }
    long balance() { return balance; }
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        return Optional.ofNullable(accounts.get(id));
    }

    @Override public void save(Account account) {
        accounts.put(account.id(), account);
    }

    int size() { return accounts.size(); }
}

class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        calls.add(accountId + ":" + amount);
    }

    List<String> calls() { return calls; }
}

class TransferService {
    private final AccountRepository repo;
    private final Notifier notifier;

    TransferService(AccountRepository repo, Notifier notifier) {
        this.repo = repo;
        this.notifier = notifier;
    }

    void transfer(String fromId, String toId, long amount) {
        if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
        Account from = repo.find(fromId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + fromId));
        Account to = repo.find(toId)
                .orElseThrow(() -> new IllegalArgumentException("unknown account " + toId));
        if (from.balance() < amount) throw new IllegalStateException("insufficient funds");
        repo.save(new Account(from.id(), from.owner(), from.balance() - amount));
        repo.save(new Account(to.id(), to.owner(), to.balance() + amount));
        notifier.transferCompleted(to.id(), amount);
    }
}`,
      hints: [
        'Fake repository: {{find}} dùng {{Optional.ofNullable(accounts.get(id))}}, {{save}} dùng {{accounts.put(account.id(), account)}}.',
        'Spy chỉ cần một {{ArrayList}}; trong {{transferCompleted}} thêm {{accountId + ":" + amount}}. Test đọc {{calls()}} sau khi service chạy xong.',
        'Chú ý thứ tự: service kiểm tra số dư **trước khi** save, nên trường hợp lỗi không được ghi hay thông báo gì.',
      ],
      explain: `Điểm chính của bài này là **state verification** và **interaction verification** cùng tồn tại trong một test:

- Fake repository cho phép nhìn trạng thái cuối (số dư hai tài khoản) mà không quan tâm service gọi {{find}}/{{save}} mấy lần. Đây là cách bền vững khi refactor.
- Spy notifier kiểm tra đúng một tương tác không quan sát được qua state: thông báo cho người nhận với đúng số tiền.

Lỗi hay gặp:
- Dùng {{List}} làm fake repository nhưng quên upsert theo id, khiến {{save}} cùng id tạo hai bản ghi và test đọc sai.
- Trả {{null}} thay vì {{Optional.empty()}} trong {{find}}, gây {{NullPointerException}} trong {{orElseThrow}}.
- Ghi thông báo trước khi kiểm tra số dư, khiến trường hợp lỗi vẫn gửi thông báo.
- Trả thẳng danh sách nội bộ từ {{calls()}} rồi test vô tình sửa nó. Trong code thật nên trả {{List.copyOf(calls)}} nếu muốn bảo vệ trạng thái.

Khi dùng Mockito, bài này tương đương {{when(repo.find("ACC-1")).thenReturn(...)}} cho stub, {{verify(notifier).transferCompleted("ACC-2", 200)}} cho interaction, còn fake repository thường được thay bằng Testcontainers ở tầng tích hợp.`,
    },
  ],
  check: [
    {
      q: 'Bạn cần kiểm tra service gửi **đúng một** email xác nhận sau khi đặt hàng. Cách nào phù hợp nhất?',
      options: [
        'Dùng fake email sender và kiểm tra file trên đĩa',
        'Dùng spy/mock ghi lại lời gọi rồi verify đúng một lần với đúng tham số',
        'Dùng stub luôn trả về true, không cần kiểm tra gì thêm',
        'Không cần test vì email không ảnh hưởng nghiệp vụ',
      ],
      answer: 1,
      explain: `Gửi email là tác dụng phụ không quan sát được qua state của service, nên cần **interaction verification**: spy hoặc mock ghi lại lời gọi rồi khẳng định số lần và tham số. Fake ghi ra đĩa là quá nặng và phụ thuộc môi trường; stub chỉ trả lời mà không chứng minh có gọi; bỏ test là bỏ mất hợp đồng nghiệp vụ quan trọng.`,
    },
    {
      q: 'Vì sao {{verify(repo, times(2)).save(any())}} thường là dấu hiệu test quá chặt?',
      options: [
        'Vì Mockito không hỗ trợ {{times(2)}}',
        'Vì verify chỉ dùng được với static method',
        'Vì nó khoá test vào số lần gọi nội bộ, nên refactor đúng đắn cũng làm test đỏ',
        'Vì {{save}} không bao giờ được gọi hai lần trong thực tế',
      ],
      answer: 2,
      explain: `Số lần gọi bên trong thường là chi tiết cài đặt. Nếu hành vi nghiệp vụ chỉ yêu cầu dữ liệu cuối cùng đúng, việc đổi hai lần {{save}} thành một lần {{saveAll}} là refactor hợp lệ nhưng test sẽ đỏ. Mockito hỗ trợ {{times(2)}} bình thường; verify dùng được với mọi mock, không riêng static; và không có quy tắc "save không bao giờ gọi hai lần".`,
    },
    {
      q: 'Khi nào **fake** (in-memory repository) tốt hơn mock?',
      options: [
        'Khi cần test cả chuỗi đọc-sửa-ghi và không muốn phụ thuộc số lời gọi',
        'Khi collaborator là một interface không có cài đặt thật',
        'Khi muốn kiểm tra chính xác thứ tự gọi các method',
        'Khi cần mô phỏng lỗi mạng ngẫu nhiên',
      ],
      answer: 0,
      explain: `Fake cài đặt cùng interface bằng cấu trúc dữ liệu đơn giản, nên test được trạng thái sau nhiều bước mà không cần verify từng lời gọi. "Interface chưa có cài đặt thật" không phải lý do để chọn fake thay vì mock — trường hợp đó dùng được cả hai tuỳ mục đích. Muốn kiểm tra thứ tự gọi thì dùng mock/spy với {{InOrder}}; mô phỏng lỗi mạng ngẫu nhiên là fault injection, không phải ưu điểm của fake.`,
    },
  ],
  related: ['testing-003', 'testing-010'],
  tags: ['test double', 'fake', 'stub', 'mock', 'spy', 'unit test'],
},
{
  id: 'lesson-testing-014',
  track: 'testing',
  order: 14,
  title: 'Test code phụ thuộc thời gian bằng Clock cố định — tính phí trễ hạn theo ngày',
  level: 'senior',
  minutes: 25,
  goals: [
    'Giải thích được vì sao {{LocalDateTime.now()}} là dependency ẩn và làm test không deterministic',
    'Inject {{java.time.Clock}} và dùng {{Clock.fixed}}/{{Clock.offset}} để test đúng biên hạn dùng',
    'Viết service tính phí trễ hạn theo ngày (làm tròn lên) và test bằng Clock cố định',
  ],
  body: `**Tóm tắt:** Thời gian là một dependency ẩn: {{Instant.now()}} gọi đồng hồ thật nên test không thể kiểm soát được các biên (trước expiry, đúng expiry, sau expiry). Giải pháp là tiêm {{java.time.Clock}} vào service, dùng {{Clock.fixed()}} để đóng băng và {{Clock.offset()}} để dịch chuyển, từ đó test được mọi mốc trong vài mili giây mà không cần ngủ.

### Thời gian là một dependency, không phải hằng số
Đoạn code sau trông vô hại nhưng là một trong những nguyên nhân flaky test phổ biến nhất:

~~~java
boolean isOverdue(Instant dueDate) {
    return Instant.now().isAfter(dueDate);          // đọc đồng hồ hệ thống ngay bên trong
}
~~~

{{Instant.now()}} gọi đồng hồ thật. Test muốn kiểm tra "quá hạn đúng lúc" thì phải chờ thời gian trôi, hoặc dựng dữ liệu quanh {{now}} và hy vọng test chạy đủ nhanh. Khi CI chậm, test đỏ; khi chạy lại trên máy khác, test xanh. Tệ hơn, không thể test được các mốc biên như "còn đúng 1 giây", "vừa quá hạn", "qua năm nhuận" nếu không đợi thật.

Cách đúng là **đưa thời gian vào từ bên ngoài**. Java 8 có sẵn abstraction {{java.time.Clock}}:

~~~java
class LateFeeService {
    private final Clock clock;

    LateFeeService(Clock clock) { this.clock = clock; }

    long calculateFee(Instant dueDate, long dailyRate) {
        Instant now = clock.instant();                    // chỉ đọc clock ở đây
        if (now.isBefore(dueDate) || now.equals(dueDate)) return 0;  // đúng hạn hoặc trước hạn: không phí
        long seconds = Duration.between(dueDate, now).getSeconds();
        long days = (seconds + 86_399) / 86_400;          // ceiling: 1 giây vượt cũng tính 1 ngày
        return days * dailyRate;
    }
}
~~~

Production truyền {{Clock.systemUTC()}} (hoặc bean tương ứng timezone nghiệp vụ); test truyền {{Clock.fixed(...)}} hoặc {{Clock.offset(...)}}. Từ đây mọi mốc thời gian đều điều khiển được, test chạy trong vài mili giây và cho cùng kết quả mọi lúc.

### Các loại Clock có sẵn
| Clock | Ý nghĩa | Dùng khi |
|---|---|---|
| {{Clock.systemUTC()}} | Đồng hồ thật, múi giờ UTC | Production cho mốc thời gian tuyệt đối |
| {{Clock.systemDefaultZone()}} | Đồng hồ thật theo timezone JVM | Hiếm khi nên dùng trong server |
| {{Clock.fixed(instant, zone)}} | Luôn trả cùng một instant | Test một mốc cố định |
| {{Clock.offset(base, duration)}} | Dịch đồng hồ nền thêm một khoảng | Test "sau 23 giờ", "sau 7 ngày" |
| {{Clock.tick(base, duration)}} | Làm tròn **xuống** theo bước {{duration}} (ví dụ bỏ hết mili giây) | Test code nhạy với độ phân giải thời gian, như cache đếm theo giây |

~~~java
Instant base = Instant.parse("2026-03-01T00:00:00Z");
Clock day0  = Clock.fixed(base, ZoneOffset.UTC);
Clock plus23h = Clock.offset(day0, Duration.ofHours(23));
Clock day7  = Clock.offset(day0, Duration.ofDays(7));
~~~

Chú ý {{Clock.fixed}} **không tự chạy**. Nếu code cần thời gian trôi trong một lần test (ví dụ timeout, retry backoff), hãy dùng một mutable clock tự viết: giữ {{volatile Instant}} hoặc {{AtomicReference<Instant>}} và cho test gọi {{advance(Duration)}}. Không dùng {{Thread.sleep}} để "chờ" — nó làm chậm suite và vẫn flaky dưới tải.

### Chọn Instant hay LocalDate
Quy tắc thực dụng:

- **Hạn dùng, token expiry, timeout** nên lưu và tính bằng {{Instant}} (hoặc {{ZonedDateTime}} nếu cần lịch địa phương). {{Instant}} là mốc tuyệt đối, không phụ thuộc timezone, nên test bằng {{Clock.fixed}} rất ổn định.
- **Nghiệp vụ theo ngày lịch** (sao kê cuối tháng, "hết hạn trong hôm nay") cần {{LocalDate.now(clock)}} với một timezone nghiệp vụ **cố định**, ví dụ {{ZoneId.of("Asia/Ho_Chi_Minh")}}. Đừng để mặc định theo JVM, vì server có thể chạy UTC còn người dùng ở múi giờ khác.
- **DST**: cộng {{ChronoUnit.DAYS}} trên {{Instant}} là cộng đúng 24 giờ, còn trên {{ZonedDateTime}} là cộng một ngày lịch và có thể dài 23 hoặc 25 giờ. Chọn theo yêu cầu nghiệp vụ và viết test cho cả hai nếu hệ thống có người dùng ở vùng có DST.

### Biên thời gian: sai một giây là sai hợp đồng
Hãy định nghĩa rõ "quá hạn" là **trước** hay **tại** thời điểm dueDate. Nếu dùng {{isBefore}}, tại đúng mốc dueDate phí vẫn là 0. Test phải phủ ba điểm: trước dueDate một chút, đúng dueDate, sau dueDate một chút. Đây là những case mà test dựa vào {{now}} gần như không thể viết ổn định.

~~~java
// trong test
LateFeeService s = new LateFeeService(Clock.fixed(dueDate, ZoneOffset.UTC));
assertEquals(0, s.calculateFee(dueDate, 1000));   // đúng mốc: chưa quá hạn
~~~

### Trong Spring Boot
Khai báo một bean {{Clock}} và inject vào service thay vì gọi static:

~~~java
@Configuration
class TimeConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
~~~

Unit test thì tạo service trực tiếp với clock giả, không cần Spring. Với integration test cần cả context dùng chung một clock giả, hãy khai báo trong {{@TestConfiguration}} một bean {{Clock}} **tên khác** và đánh dấu {{@Primary}} (Spring Boot mặc định cấm ghi đè bean cùng tên). Với legacy code chưa inject được, một số đội dùng {{Mockito.mockStatic(...)}} (mockito-inline, mặc định từ Mockito 5) để giả lập phương thức static trả thời gian — nhưng đó là giải pháp tạm: mock static chỉ có hiệu lực trên thread hiện tại, phải đóng đúng lúc ({{try-with-resources}}), dễ vỡ và che giấu thiết kế phụ thuộc ẩn.

### Bẫy production hay gặp
- **Quên truyền clock vào nhánh code khác**: service nhận clock nhưng một helper vẫn gọi {{LocalDate.now()}}. Test xanh vì nhánh đó không chạy, production sai vào nửa đêm.
- **Clock mutable dùng chung giữa các test**: test này advance làm test khác lệch. Tạo clock mới mỗi test, hoặc reset trong {{@BeforeEach}}.
- **Lưu {{LocalDateTime}} vào database**: mất offset, đọc lại ở múi giờ khác bị lệch. Ưu tiên {{Instant}}/{{OffsetDateTime}} với cột {{timestamptz}}.
- **So sánh thời gian bằng {{equals}} sau khi qua database**: {{Instant.now()}} trên JDK 17 có độ phân giải tới micro giây (thậm chí nano), còn cột {{timestamptz}} của PostgreSQL chỉ lưu micro giây, MySQL {{DATETIME}} mặc định chỉ lưu giây. Lưu rồi đọc lại, giá trị bị cắt nên {{equals}} trả false. Dùng clock cố định trong test, hoặc {{truncatedTo(ChronoUnit.MICROS)}} trước khi lưu và so.
- **Test quá phụ thuộc đồng hồ thật ở tầng tích hợp**: với schedule, hãy tách phần "quyết định có chạy không" thành hàm nhận {{clock}}, còn phần trigger framework để integration test riêng.

> Senior tip: khi hệ thống có bug "chỉ lỗi sau 23h" hoặc "chỉ lỗi ngày cuối tháng", gần như luôn là do timezone hoặc do tính ngày bằng {{LocalDate.now()}} không có clock. Một đội trưởng tốt đặt quy ước: **không có {{now()}} không tham số trong domain code**, chỉ có {{clock.instant()}}; review có thể grep là thấy ngay chỗ vi phạm.

### Ví dụ đời thực: phí trễ hạn 10.000/ngày tính nhầm do timezone
Một app fintech tính phí trễ hạn: 10.000/ngày, làm tròn lên (1 ngày 1 phút = 2 ngày phí). Backend viết test bằng {{LocalDate.now()}} và deploy lên staging. Khi test chạy trên CI (múi giờ UTC) thì mọi thứ xanh, nhưng production ở múi giờ Việt Nam (UTC+7) lại **bắt đầu tính phí sớm một ngày** — một số khách thấy bị tính phí ngày thứ 30 thay vì ngày thứ 31. Đội điều tra: test ở staging không phát hiện vì nó cũng chạy theo múi giờ CI, còn production dùng {{LocalDate.now()}} theo timezone JVM. Sau khi đổi sang {{Instant}} + {{Clock}} injection, test được viết lại với ba biên (trước dueDate, đúng dueDate, sau dueDate) và chạy dưới 50 mili giây. Vấn đề không bao giờ tái hiện ở staging nữa.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test code phụ thuộc thời gian thế nào?', tôi sẽ nói: đầu tiên nhận ra {{Instant.now()}} là một dependency ẩn — test không thể kiểm soát được nó. Giải pháp là tiêm {{Clock}} vào service: production truyền {{Clock.systemUTC()}}, test truyền {{Clock.fixed()}} để đóng băng thời gian tại một mốc cố định hoặc {{Clock.offset()}} để dịch chuyển tương đối. Với phí trễ hạn, tôi test ba điểm: một giây trước dueDate (phí 0), đúng dueDate (phí 0), một giây sau (phí 1 ngày). Dùng {{Instant}} cho mốc tuyệt đối vì nó không phụ thuộc timezone. Không bao giờ dùng {{Thread.sleep}} trong unit test — nó làm suite chậm và vẫn flaky dưới tải CI. Trong Spring Boot, khai báo {{@Bean Clock clock()}} là bean và inject; nếu code legacy chưa thể inject, dùng {{Mockito.mockStatic}} trong {{try-with-resources}} nhưng đó là giải pháp tạm thời."

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Làm sao test code phụ thuộc thời gian?", "{{Clock.fixed}} khác {{Clock.offset}} thế nào?", "Xử lý phí trễ hạn qua DST ra sao?", và đưa một test đang {{Thread.sleep(2000)}} để hỏi cách sửa. Câu trả lời tốt là: inject {{Clock}}, test bằng fixed/offset, phủ ba điểm biên, và dùng Instant cho mốc tuyệt đối. Bài tập dưới đây mô phỏng đúng bài toán phí trễ hạn với clock injection.`,
  exercises: [
    {
      title: 'LateFeeService với Clock: tính phí trễ hạn theo ngày, làm tròn lên',
prompt: `Hoàn thiện {{LateFeeService}} nhận {{Clock}} qua constructor:
 
 - {{calculateFee(dueDate, dailyRate)}}: trả về phí trễ hạn ({{long}}).
   - Nếu thời điểm hiện tại **trước** dueDate **hoặc bằng** dueDate: phí = 0.
   - Nếu **sau** dueDate: số ngày phí = ceiling của tổng giây chênh lệch chia 86400 (công thức: {{(Duration.between(dueDate, now).getSeconds() + 86_399) / 86_400}}).
   - Phí = số ngày * dailyRate.
 - {{daysOverdue(dueDate)}}: trả về số ngày đã quá hạn (0 nếu chưa quá hạn, làm tròn lên như trên).
 
 Test sẽ tạo {{Clock.fixed}} và {{Clock.offset}} với các mốc cố định, nên kết quả phải không phụ thuộc thời gian chạy thật.`,
      starter: `import java.time.*;

class LateFeeService {
    private final Clock clock;

    LateFeeService(Clock clock) {
        this.clock = clock;
    }

    long calculateFee(Instant dueDate, long dailyRate) {
        throw new UnsupportedOperationException("TODO");
    }

    long daysOverdue(Instant dueDate) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.time.*;

public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final Instant BASE = Instant.parse("2026-03-01T00:00:00Z");
    static Clock at(String instant) { return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC); }
    public static void main(String[] args) {
        check("fee is zero before and at dueDate", () -> {
            LateFeeService s = new LateFeeService(at("2026-02-28T23:59:59Z"));
            eq(0L, s.calculateFee(BASE, 10_000));
            eq(0L, s.daysOverdue(BASE));
            s = new LateFeeService(at("2026-03-01T00:00:00Z"));
            eq(0L, s.calculateFee(BASE, 10_000));
            eq(0L, s.daysOverdue(BASE));
        });
        check("fee rounds up: 1 second after dueDate = 1 day fee", () -> {
            LateFeeService s = new LateFeeService(at("2026-03-01T00:00:01Z"));
            eq(10_000L, s.calculateFee(BASE, 10_000));
            eq(1L, s.daysOverdue(BASE));
        });
        check("fee rounds up: 23 hours after dueDate = 1 day fee", () -> {
            LateFeeService s = new LateFeeService(Clock.offset(at("2026-03-01T00:00:00Z"), Duration.ofHours(23)));
            eq(10_000L, s.calculateFee(BASE, 10_000));
            eq(1L, s.daysOverdue(BASE));
        });
        check("fee exact multiple of 24 hours", () -> {
            LateFeeService s = new LateFeeService(at("2026-03-02T00:00:00Z"));
            eq(10_000L, s.calculateFee(BASE, 10_000));
            eq(1L, s.daysOverdue(BASE));  // 24h = 1 ngày (đúng 1 ngày, không cần làm tròn)
            s = new LateFeeService(at("2026-03-03T00:00:00Z"));
            eq(20_000L, s.calculateFee(BASE, 10_000));
            eq(2L, s.daysOverdue(BASE));  // 48h = 2 ngày
        });
        check("zone of clock does not change instant-based results", () -> {
            Clock tokyo = Clock.fixed(Instant.parse("2026-03-02T00:00:00Z"), ZoneId.of("Asia/Tokyo"));
            LateFeeService s = new LateFeeService(tokyo);
            eq(10_000L, s.calculateFee(BASE, 10_000));
            eq(1L, s.daysOverdue(BASE));
        });
        check("dailyRate can be any positive value", () -> {
            LateFeeService s = new LateFeeService(at("2026-03-02T00:00:00Z"));
            eq(7_500L, s.calculateFee(BASE, 7_500));
            eq(1L, s.daysOverdue(BASE));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;

class LateFeeService {
    private final Clock clock;

    LateFeeService(Clock clock) {
        this.clock = clock;
    }

    long calculateFee(Instant dueDate, long dailyRate) {
        Instant now = clock.instant();
        if (now.isBefore(dueDate) || now.equals(dueDate)) return 0;
        long seconds = Duration.between(dueDate, now).getSeconds();
        long days = (seconds + 86_399) / 86_400;   // ceiling: 1 giây vượt cũng tính 1 ngày
        return days * dailyRate;
    }

    long daysOverdue(Instant dueDate) {
        Instant now = clock.instant();
        if (now.isBefore(dueDate) || now.equals(dueDate)) return 0;
        long seconds = Duration.between(dueDate, now).getSeconds();
        return (seconds + 86_399) / 86_400;
    }
}`,
      hints: [
        'Dùng {{clock.instant()}} để lấy "bây giờ". Kiểm tra {{now.isBefore(dueDate) || now.equals(dueDate)}} để phí 0 tại đúng mốc dueDate.',
        'Số ngày làm tròn lên: lấy {{Duration.between(dueDate, now).getSeconds()}} rồi áp dụng công thức ceiling {{(seconds + 86_399) / 86_400}}. {{toDays()}} chỉ đếm ngày 24h trọn vẹn, nên 1 giây vượt cho 0; công thức ceiling xử lý đúng mọi trường hợp.',
        'Cùng logic cho {{daysOverdue}}; chỉ khác là không nhân dailyRate.',
      ],
      explain: `Bài này cho thấy lợi ích rõ nhất của clock injection: cùng một đoạn code, test kiểm tra được chính xác **một giây trước dueDate**, **đúng dueDate**, và **sau dueDate** mà không cần ngủ. Nếu dùng {{Instant.now()}} bên trong, ba case này gần như không thể viết ổn định.

Lỗi hay gặp:
- Đổi sang {{LocalDateTime}} bằng timezone mặc định của JVM rồi mới cộng ngày và so sánh: cùng một đoạn code cho kết quả khác nhau trên laptop (giờ Việt Nam) và server (UTC).
- Viết điều kiện phí 0 là {{!now.isAfter(dueDate)}}: trông tương đương {{isBefore || equals}} nhưng tại **đúng** mốc dueDate, {{isAfter}} trả false nên phí vẫn 0 — đúng quy ước. Nhưng nếu nhầm dùng {{now.isBefore(dueDate)}} (bỏ sót equals) thì đúng mốc dueDate sẽ bị tính phí 1 ngày — lệch một tích tắc so với hợp đồng. Chỉ test biên "đúng mốc dueDate" mới bắt được lỗi này.
- Tính ngày làm tròn lên bằng {{toDays() + 1}}: tại đúng 24 giờ (1 ngày trọn), {{toDays()}} trả 1, cộng 1 ra 2 — sai quy ước "1 ngày trọn = 1 ngày phí". Phải dùng ceiling của tổng giây: {{(seconds + 86_399) / 86_400}}.
- Cộng ngày bằng {{86_400_000}} mili giây: đúng với Instant nhưng sai với {{ZonedDateTime}} qua DST. Dùng API thời gian thay vì số học tay.

Trong Spring Boot, hãy khai báo {{Clock}} là bean và inject; đừng gọi {{Clock.systemUTC()}} rải rác trong service, vì như vậy lại quay về dependency ẩn.`,
    },
  ],
  check: [
    {
      q: 'Vì sao test dùng {{Thread.sleep(2000)}} để chờ quá hạn là lựa chọn tồi?',
      options: [
        'Vì sleep làm hỏng đồng hồ hệ thống',
        'Vì sleep luôn ném InterruptedException',
        'Vì test chậm, vẫn flaky dưới tải, và không kiểm tra được mốc biên chính xác',
        'Vì Java không cho sleep trong test',
      ],
      answer: 2,
      explain: `Sleep làm suite chậm và chỉ "hy vọng" thời gian trôi đủ: trên CI tải cao, thread có thể thức dậy muộn hơn nhiều so với 2 giây, còn dueDate có thể hết hạn sớm/muộn hơn dự kiến một chút tuỳ lúc test tạo nó — kết quả lúc xanh lúc đỏ. Nó cũng không cho phép kiểm tra chính xác thời điểm một giây sau dueDate. Sleep không làm hỏng đồng hồ, chỉ ném InterruptedException khi bị ngắt (có thể khai báo), và hoàn toàn hợp lệ về mặt ngôn ngữ — vấn đề là độ tin cậy và tốc độ.`,
    },
    {
      q: '{{Clock.offset(clock, Duration.ofHours(23))}} khác {{Clock.fixed(instant, zone)}} ở điểm nào?',
      options: [
        'Offset trả về thời điểm của clock nền cộng thêm 23 giờ; fixed luôn trả đúng một instant cố định',
        'Offset chỉ dùng được với timezone UTC',
        'Fixed tự chạy theo thời gian thật, offset thì đứng yên',
        'Không khác gì, cả hai đều đứng yên',
      ],
      answer: 0,
      explain: `{{Clock.offset}} bọc một clock khác và dịch kết quả thêm một khoảng, nên nếu clock nền là system thì nó vẫn chạy; nếu nền là fixed thì nó đứng yên tại instant cộng offset. {{Clock.fixed}} luôn trả cùng một instant. Offset không bị giới hạn ở UTC, và fixed không tự chạy — đó là đặc điểm của {{Clock.systemUTC}}.`,
    },
    {
      q: 'Nghiệp vụ "phí trễ hạn 10.000/ngày, làm tròn lên (1 ngày 1 phút = 2 ngày)". dueDate = 01/03 00:00 UTC. Lúc 02/03 00:00:01 UTC phí là bao nhiêu?',
      options: [
        '10.000',
        '20.000',
        '30.000',
        '0',
      ],
      answer: 1,
      explain: `01/03 00:00 đến 02/03 00:00 là đúng 1 ngày (24h). Vượt thêm 1 giây -> làm tròn lên thành 2 ngày phí. 2 * 10.000 = 20.000. Đáp án 10.000 là quên làm tròn lên; 30.000 là nhầm 2 ngày trọn + 1; 0 là nhầm dueDate exclusive.`,
    },
  ],
  related: ['testing-005', 'testing-010'],
  tags: ['Clock', 'time', 'flaky test', 'Instant', 'timezone', 'late fee'],
},
{
  id: 'lesson-testing-015',
  track: 'testing',
  order: 15,
  title: 'Test double cho code bất đồng bộ: fake executor, stub future, mock callback',
  level: 'senior',
  minutes: 35,
  goals: [
    'Hiểu tại sao test code async (CompletableFuture, ExecutorService, callback) lại khó và flaky khi dùng sleep/latch',
    'Viết fake Executor chạy task ngay lập tức (inline) để test deterministic, không cần chờ',
    'Dùng stub CompletableFuture cho dependency async, mock callback để verify interaction',
  ],
  body: `**Tóm tắt:** Code bất đồng bộ (async) dùng CompletableFuture, ExecutorService, hay callback thường khiến test phải dùng Thread.sleep, CountDownLatch, hoặc Awaitility — dẫn đến test chậm, flaky, và khó kiểm tra các kịch báo lỗi/timeout. Giải pháp là tiêm Executor (hoặc ScheduledExecutorService) vào service, trong test dùng fake executor chạy task ngay trên thread hiện tại (inline), stub future cho dependency, và mock callback để verify đúng tham số. Cách này biến test async thành test sync, chạy trong vài mili giây, kiểm soát được mọi luồng.
  
### Vì sao test code async khó
Một service điển hình gọi API bên ngoài rồi xử lý kết quả:
  
~~~java
class OrderService {
    private final HttpClient http;
    private final ExecutorService executor;
  
    OrderService(HttpClient http, ExecutorService executor) {
        this.http = http;
        this.executor = executor;
    }
  
    CompletableFuture<Order> fetchOrderAsync(String id) {
        return CompletableFuture.supplyAsync(() -> http.getOrder(id), executor)
                .thenApply(this::enrich)
                .exceptionally(ex -> fallbackOrder(id));
    }
}
~~~
  
Test thường làm một trong ba cách sai:
1. **Thread.sleep(1000)** — chậm, flaky (CI tải cao thread chậm hơn), không bao giờ biết chờ bao lâu là đủ.
2. **CountDownLatch/Awaitility** — phức tạp, vẫn phải chờ thật, khó test exception path.
3. **Chạy thật executor** — test phụ thuộc thread pool, thứ tự chạy không deterministic, race condition khi assert.

Cốt lõi: **Executor là dependency** như Clock, Database, HTTP client. Tiêm nó vào, test thay bằng fake chạy ngay.

### Fake Executor: chạy task ngay lập tức (inline executor)
Thay vì submit vào thread pool, fake executor thực thi Runnable/Callable ngay trong thread gọi:
  
~~~java
class InlineExecutor implements Executor {
    @Override public void execute(Runnable command) {
        command.run();   // chạy ngay, không tạo thread mới
    }
}
~~~
  
Với CompletableFuture.supplyAsync, cần ExecutorService. Có thể tự viết wrapper delegate tới InlineExecutor (gọi command.run() trực tiếp trong delegate). Khi test dùng fake này, **toàn bộ chuỗi async chạy tuần tự trong một thread** — deterministic, không race, exception ném ra ngay cho test bắt.

Lưu ý: fake executor **không mô phỏng được** hành vi song song thực sự (race, deadlock, thread safety). Những bug đó phải bắt bằng integration test (Testcontainers, stress test) hoặc code review. Fake executor chỉ để test *logic nghiệp vụ* trong callback/thenApply/handle.

### Stub CompletableFuture cho dependency async
Khi service phụ thuộc một client async (HTTP, gRPC, Kafka producer), test không nên khởi động server thật. Thay vào đó, **stub future** trả về kết quả định trước:
  
~~~java
CompletableFuture<Order> stubSuccess(Order order) {
    return CompletableFuture.completedFuture(order);
}
  
CompletableFuture<Order> stubFailure(Throwable ex) {
    CompletableFuture<Order> f = new CompletableFuture<>();
    f.completeExceptionally(ex);
    return f;
}
~~~
  
Service nhận future này, chain thenApply/handle — logic xử lý thành công/thất bại được test mà không cần network.

### Mock callback để verify interaction
Khi service dùng callback (Consumer, BiConsumer, interface tự định nghĩa) thay vì trả future, hãy dùng **mock callback** (spy viết tay) để ghi lại lời gọi:
  
~~~java
class RecordingCallback<T> implements Consumer<T> {
    private final List<T> calls = new ArrayList<>();
    private final List<Throwable> errors = new ArrayList<>();
  
    @Override public void accept(T t) { calls.add(t); }
    void onError(Throwable t) { errors.add(t); }
  
    List<T> calls() { return calls; }
    List<Throwable> errors() { return errors; }
}
~~~
  
Test verify: callback được gọi đúng một lần, với đúng tham số, hoặc onError được gọi khi future thất bại.

### Kịch bản test đầy đủ
Với fake executor + stub future + mock callback, một test có thể cover:
- **Happy path**: stub future thành công → verify callback nhận kết quả đúng, enrichment đúng.
- **Error path**: stub future thất bại → verify fallback logic, callback không được gọi / onError được gọi.
- **Timeout path**: (nếu service có timeout) fake executor không mô phỏng được timeout thật; dùng integration test cho phần này.
- **Cancellation**: stub future chưa hoàn thành, service cancel → verify cleanup.

### Bẫy production hay gặp
- **Quên tiêm executor vào ScheduledExecutorService** cho scheduled job: test không thể advance time. Hãy tiêm cả ScheduledExecutorService, test dùng fake cho phép advance (xem bài 016).
- **Dùng ForkJoinPool.commonPool()** ngầm trong CompletableFuture (không truyền executor): test không thể thay fake. Luôn truyền executor tường minh.
- **Fake executor che bug thread-safety**: service dùng shared state không thread-safe, fake chạy tuần tự nên test pass, production multi-thread thì crash. Code review và integration test bắt buộc.
- **Stub future phải completeExceptionally(Throwable)**: nếu stub lỡ trả future chưa complete thì handle/whenComplete chưa kích hoạt, còn completeExceptionally(null) ném NPE ngay khi stub. Test phải cover cả success và failure.
- **Callback giữ reference lớn**: mock callback lưu toàn bộ object lớn làm test OOM. Chỉ lưu field cần verify, hoặc dùng weak reference.

> Senior tip: quy ước team: **mọi class dùng CompletableFuture.supplyAsync phải nhận Executor/ExecutorService qua constructor**. Cấm dùng commonPool. Review grep "supplyAsync(" không có executor là đỏ. Test async sau đó chỉ là test sync với fake executor — nhanh, deterministic, dễ debug.

### Ví dụ đời thực: payment service async timeout production
Một PaymentService gọi ngân hàng async với CompletableFuture, timeout 5 giây. Test dùng Awaitility chờ 6 giây — CI đôi khi pass đôi khi fail vì GC pause. Team đổi: tiêm ExecutorService, test dùng InlineExecutor, stub future trả về future đã completeExceptionally(new TimeoutException()) để mô phỏng timeout. Test chạy 50ms, cover được cả happy path, error path, timeout path. Bug "timeout không rollback transaction" bị bắt ngay ở unit test thay vì chờ production.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test async code thế nào?', tôi nói: đầu tiên nhận ra Executor là dependency ẩn. Tiêm ExecutorService vào service, production dùng thread pool, test dùng InlineExecutor (chạy task ngay trên thread gọi). Dependency async (HTTP client, Kafka) thì stub CompletableFuture: completedFuture cho success, completeExceptionally cho error. Callback thì dùng mock callback ghi lại lời gọi. Cách này biến test async thành sync, chạy vài mili giây, không flaky. Bug thread-safety (race, shared state) thì fake executor không bắt được — cần integration test hoặc stress test riêng."

### Liên hệ phỏng vấn
Interviewer hỏi: "Service của bạn dùng CompletableFuture gọi API bên ngoài, test thế nào?", "Tại sao không dùng Thread.sleep trong test async?", "Executor là dependency như thế nào?". Trả lời: tiêm Executor, test dùng InlineExecutor, stub future, mock callback. Giải thích sleep làm test chậm/flaky, không kiểm soát được timing. Nêu rõ fake executor không bắt được race condition — cần integration test cho đó.
`,
  exercises: [
    {
      title: 'Fake executor, stub future, mock callback cho AsyncOrderService',
      prompt: `Cho sẵn interface {{HttpClient}}, {{Order}}, {{OrderCallback}}, class {{AsyncOrderService}}. Hãy hoàn thiện:
  
1. {{InlineExecutor}} implements {{Executor}}: {{execute}} chạy command ngay lập tức.
2. {{StubHttpClient}}: cho phép cấu hình future thành công hoặc thất bại cho mỗi orderId. {{getOrderAsync}} trả future đã cấu hình, mặc định trả future failed "not configured".
3. {{RecordingCallback}} implements {{OrderCallback}}: ghi lại {{onSuccess}} và {{onError}} calls; cung cấp {{successes()}} và {{errors()}} trả bản sao list.
4. {{AsyncOrderService.fetchAndProcess}}: dùng {{executor}} để chạy async, chain {{thenApply}} enrich, {{handle}} error -> fallback, cuối gọi callback.
  
Test sẽ dùng fake executor để chạy deterministic, stub future cho success/failure, mock callback verify interaction.`,
      starter: `import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
  
interface HttpClient {
    CompletableFuture<Order> getOrderAsync(String orderId);
}
  
record Order(String id, String customer, long amount) {}
  
interface OrderCallback {
    void onSuccess(Order order);
    void onError(String orderId, Throwable error);
}
  
class InlineExecutor implements Executor {
    @Override public void execute(Runnable command) {
        throw new UnsupportedOperationException("TODO");
    }
}
  
class StubHttpClient implements HttpClient {
    private final Map<String, CompletableFuture<Order>> successCases = new HashMap<>();
    private final Map<String, Throwable> failureCases = new HashMap<>();
  
    StubHttpClient success(String orderId, Order order) {
        successCases.put(orderId, CompletableFuture.completedFuture(order));
        return this;
    }
  
    StubHttpClient failure(String orderId, Throwable error) {
        failureCases.put(orderId, error);
        return this;
    }
  
    @Override public CompletableFuture<Order> getOrderAsync(String orderId) {
        throw new UnsupportedOperationException("TODO");
    }
}
  
class RecordingCallback implements OrderCallback {
    private final List<Order> successes = new ArrayList<>();
    private final List<CallbackError> errors = new ArrayList<>();
  
    record CallbackError(String orderId, Throwable error) {}
  
    @Override public void onSuccess(Order order) {
        throw new UnsupportedOperationException("TODO");
    }
  
    @Override public void onError(String orderId, Throwable error) {
        throw new UnsupportedOperationException("TODO");
    }
  
    List<Order> successes() { throw new UnsupportedOperationException("TODO"); }
    List<CallbackError> errors() { throw new UnsupportedOperationException("TODO"); }
}
  
class AsyncOrderService {
    private final HttpClient http;
    private final Executor executor;

    AsyncOrderService(HttpClient http, Executor executor) {
        this.http = http;
        this.executor = executor;
    }

    void fetchAndProcess(String orderId, OrderCallback callback) {
        throw new UnsupportedOperationException("TODO");
    }
  
    private Order enrich(Order order) {
        return new Order(order.id(), order.customer() + " (enriched)", order.amount() * 2);
    }
  
    private Order fallback(String orderId) {
        return new Order(orderId, "fallback", 0);
    }
}`,
      tests: `import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
  
public class Main {
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
        check("inline executor runs task immediately on calling thread", () -> {
            InlineExecutor exec = new InlineExecutor();
            List<String> order = new ArrayList<>();
            exec.execute(() -> order.add("running"));
            eq(List.of("running"), order);
        });
  
        check("stub http client returns configured success future", () -> {
            Order order = new Order("O1", "An", 1000);
            StubHttpClient http = new StubHttpClient().success("O1", order);
            CompletableFuture<Order> f = http.getOrderAsync("O1");
            eq(true, f.isDone());
            eq(order, f.join());
        });
  
        check("stub http client returns configured failure future", () -> {
            StubHttpClient http = new StubHttpClient().failure("O2", new RuntimeException("network down"));
            CompletableFuture<Order> f = http.getOrderAsync("O2");
            eq(true, f.isCompletedExceptionally());
            try { f.join(); throw new AssertionError("should throw"); }
            catch (CompletionException e) { eq("network down", e.getCause().getMessage()); }
        });
  
        check("recording callback records success and error separately", () -> {
            RecordingCallback cb = new RecordingCallback();
            Order o1 = new Order("O1", "A", 100);
            cb.onSuccess(o1);
            cb.onError("O2", new IllegalStateException("fail"));
            eq(List.of(o1), cb.successes());
            eq(1, cb.errors().size());
            eq("O2", cb.errors().get(0).orderId());
            // verify returned lists are copies
            cb.successes().clear();
            eq(1, cb.successes().size());
        });
  
        check("async service happy path: enrich and call onSuccess", () -> {
            InlineExecutor exec = new InlineExecutor();
            Order raw = new Order("O1", "An", 1000);
            StubHttpClient http = new StubHttpClient().success("O1", raw);
            RecordingCallback cb = new RecordingCallback();
            AsyncOrderService svc = new AsyncOrderService(http, exec);
            svc.fetchAndProcess("O1", cb);
            // with inline executor, everything runs synchronously
            eq(1, cb.successes().size());
            Order enriched = cb.successes().get(0);
            eq("O1", enriched.id());
            eq("An (enriched)", enriched.customer());
            eq(2000L, enriched.amount());
            eq(0, cb.errors().size());
        });
  
        check("async service error path: fallback and call onError", () -> {
            InlineExecutor exec = new InlineExecutor();
            StubHttpClient http = new StubHttpClient().failure("O2", new RuntimeException("timeout"));
            RecordingCallback cb = new RecordingCallback();
            AsyncOrderService svc = new AsyncOrderService(http, exec);
            svc.fetchAndProcess("O2", cb);
            eq(1, cb.errors().size());
            eq("O2", cb.errors().get(0).orderId());
            eq("timeout", cb.errors().get(0).error().getMessage());
            // fallback should NOT call onSuccess
            eq(0, cb.successes().size());
        });
  
        check("async service unknown orderId uses default failed future", () -> {
            InlineExecutor exec = new InlineExecutor();
            StubHttpClient http = new StubHttpClient(); // no config
            RecordingCallback cb = new RecordingCallback();
            AsyncOrderService svc = new AsyncOrderService(http, exec);
            svc.fetchAndProcess("O99", cb);
            eq(1, cb.errors().size());
            eq("O99", cb.errors().get(0).orderId());
        });
  
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
import java.util.concurrent.*;
import java.util.function.*;
  
interface HttpClient {
    CompletableFuture<Order> getOrderAsync(String orderId);
}
  
record Order(String id, String customer, long amount) {}
  
interface OrderCallback {
    void onSuccess(Order order);
    void onError(String orderId, Throwable error);
}
  
class InlineExecutor implements Executor {
    @Override public void execute(Runnable command) {
        command.run();
    }
}
  
class StubHttpClient implements HttpClient {
    private final Map<String, CompletableFuture<Order>> successCases = new HashMap<>();
    private final Map<String, Throwable> failureCases = new HashMap<>();
  
    StubHttpClient success(String orderId, Order order) {
        successCases.put(orderId, CompletableFuture.completedFuture(order));
        return this;
    }
  
    StubHttpClient failure(String orderId, Throwable error) {
        failureCases.put(orderId, error);
        return this;
    }
  
    @Override public CompletableFuture<Order> getOrderAsync(String orderId) {
        if (successCases.containsKey(orderId)) return successCases.get(orderId);
        if (failureCases.containsKey(orderId)) {
            CompletableFuture<Order> f = new CompletableFuture<>();
            f.completeExceptionally(failureCases.get(orderId));
            return f;
        }
        CompletableFuture<Order> f = new CompletableFuture<>();
        f.completeExceptionally(new IllegalStateException("not configured: " + orderId));
        return f;
    }
}
  
class RecordingCallback implements OrderCallback {
    private final List<Order> successes = new ArrayList<>();
    private final List<CallbackError> errors = new ArrayList<>();
  
    record CallbackError(String orderId, Throwable error) {}
  
    @Override public void onSuccess(Order order) {
        successes.add(order);
    }
  
    @Override public void onError(String orderId, Throwable error) {
        errors.add(new CallbackError(orderId, error));
    }
  
    List<Order> successes() { return new ArrayList<>(successes); }
    List<CallbackError> errors() { return new ArrayList<>(errors); }
}
  
class AsyncOrderService {
    private final HttpClient http;
    private final Executor executor;

    AsyncOrderService(HttpClient http, Executor executor) {
        this.http = http;
        this.executor = executor;
    }

    void fetchAndProcess(String orderId, OrderCallback callback) {
        http.getOrderAsync(orderId)
            .thenApplyAsync(this::enrich, executor)
            .handleAsync((order, ex) -> {
                Throwable real = ex == null ? null
                        : (ex instanceof CompletionException ? ex.getCause() : ex);
                if (real != null) {
                    callback.onError(orderId, real);
                    return fallback(orderId);
                }
                callback.onSuccess(order);
                return order;
            }, executor);
    }
  
    private Order enrich(Order order) {
        return new Order(order.id(), order.customer() + " (enriched)", order.amount() * 2);
    }
  
    private Order fallback(String orderId) {
        return new Order(orderId, "fallback", 0);
    }
}`,
      hints: [
        'InlineExecutor: {{execute}} chỉ cần {{command.run()}}.',
        'StubHttpClient: {{getOrderAsync}} kiểm tra successCases trước, rồi failureCases, cuối trả future failed mặc định. Dùng {{CompletableFuture.completedFuture}} cho success, {{new CompletableFuture<>().completeExceptionally}} cho failure.',
        'RecordingCallback: {{onSuccess}} add vào {{successes}}, {{onError}} add {{CallbackError}} vào {{errors}}. Getter trả {{new ArrayList<>(...))}} để bảo vệ state.',
        'AsyncOrderService: dùng {{thenApplyAsync(enrich, executor)}} để enrich chạy trên executor, rồi {{handleAsync}} để xử lý cả success lẫn error. Trong handle: nếu ex != null -> callback.onError + return fallback; ngược lại callback.onSuccess + return order.',
      ],
      explain: `Bài tập này minh hoạ cách **biến test async thành sync** bằng ba kỹ thuật:
  
1. **Fake Executor (InlineExecutor)**: chạy task ngay lập tức. {{CompletableFuture.thenApplyAsync}} với executor này sẽ thực thi callback ngay trong thread hiện tại, khiến toàn bộ chain chạy tuần tự — deterministic, exception ném ra ngay, không cần latch/sleep.
2. **Stub Future**: {{StubHttpClient}} trả về {{CompletableFuture.completedFuture}} (success) hoặc future {{completeExceptionally}} (error). Service chain {{handleAsync}} xử lý cả hai nhánh, logic fallback được test mà không cần network.
3. **Mock Callback (RecordingCallback)**: ghi lại {{onSuccess}} và {{onError}} riêng biệt. Test verify interaction: success path gọi onSuccess đúng enriched order, error path gọi onError đúng orderId + error, fallback không gọi onSuccess.
  
Lưu ý quan trọng: **fake executor KHÔNG mô phỏng được race condition, thread safety, hay deadlock**. Nếu service dùng shared mutable state, fake executor sẽ che bug đó. Luôn kết hợp: unit test với fake executor cho logic nghiệp vụ + integration test (Testcontainers, stress test) cho thread safety.
  
Lỗi hay gặp:
- Quên truyền executor vào {{thenApplyAsync}}/{{handleAsync}} -> dùng commonPool, test không deterministic.
- Stub future không {{completeExceptionally}} đúng -> {{handle}} không bắt được error.
- Callback trả list nội bộ -> test vô tình clear làm mất dữ liệu verify.
- Service không handle exception trong callback -> exception bị nuốt, test pass giả.`,
    },
  ],
  check: [
    {
      q: 'Tại sao dùng {{InlineExecutor}} trong test async thay vì thread pool thật?',
      options: [
        'Vì thread pool thật không hỗ trợ CompletableFuture',
        'Vì InlineExecutor chạy task ngay lập tức, biến test async thành sync — deterministic, nhanh, exception ném ra ngay',
        'Vì InlineExecutor mô phỏng được race condition tốt hơn',
        'Vì CompletableFuture bắt buộc dùng InlineExecutor',
      ],
      answer: 1,
      explain: 'InlineExecutor.execute(command) gọi command.run() ngay trên thread gọi. Với thenApplyAsync/handleAsync dùng executor này, toàn bộ chain chạy tuần tự trong một thread — deterministic, chạy trong vài mili giây, exception không bị nuốt. Thread pool thật thì test phụ thuộc scheduling, race, và phải chờ (sleep/latch). (C) sai vì inline executor KHÔNG mô phỏng được race — đó là giới hạn của nó.',
    },
    {
      q: 'Stub CompletableFuture cho error path cần làm gì?',
      options: [
        'Trả về null',
        'Tạo new CompletableFuture<>() và gọi completeExceptionally(throwable)',
        'Gọi complete(null)',
        'Ném exception ngay trong method stub',
      ],
      answer: 1,
      explain: 'CompletableFuture xử lý error qua completeExceptionally. Trả null hoặc complete(null) được coi là success với giá trị null. Ném exception trong method stub làm test fail trước khi service kịp chain handleAsync. Chỉ completeExceptionally mới làm future.isCompletedExceptionally() = true và trigger handle/whenComplete.',
    },
    {
      q: 'Fake executor KHÔNG bắt được loại bug nào?',
      options: [
        'Logic enrichment sai',
        'Fallback không được gọi khi error',
        'Race condition trên shared mutable state',
        'Callback onError nhận sai tham số',
      ],
      answer: 2,
      explain: 'Fake executor chạy task tuần tự trên một thread, nên mọi truy cập shared state đều tuần tự — race condition không xảy ra. Bug thread-safety (race, visibility, deadlock) chỉ lộ ra khi chạy thật multi-thread. Unit test với fake executor test logic nghiệp vụ; integration/stress test test thread safety.',
    },
  ],
  related: ['testing-001', 'testing-008', 'testing-016'],
  tags: ['test double', 'async', 'CompletableFuture', 'Executor', 'fake', 'stub', 'callback', 'inline executor'],
},
{
  id: 'lesson-testing-016',
  track: 'testing',
  order: 16,
  title: 'Test scheduled job và retry backoff bằng MutableClock: advance thời gian trong test',
  level: 'senior',
  minutes: 30,
  goals: [
    'Hiểu tại sao scheduled job (cron, @Scheduled) và retry backoff (exponential backoff) khó test khi phụ thuộc thời gian thật',
    'Viết MutableClock cho phép test advance thời gian tùy ý (giây, phút, giờ, ngày) trong một test',
    'Test scheduled cleanup job: seed data, advance clock, verify job dọn đúng batch',
    'Test retry backoff: advance clock theo cấp số nhân, verify retry đúng số lần và đúng delay',
  ],
  body: `**Tóm tắt:** Scheduled job (dọn token hết hạn, gửi báo cáo hàng ngày, sync dữ liệu) và retry logic với exponential backoff đều phụ thuộc thời gian: "chạy mỗi 1 giờ", "thử lại sau 1s, 2s, 4s, 8s". Test dùng Thread.sleep sẽ chậm (phải chờ thật), flaky (CI tải cao), và không thể kiểm tra chính xác mốc. Giải pháp: tiêm Clock vào scheduler/retry service, test dùng MutableClock (kế thừa java.time.Clock, giữ AtomicReference<Instant>) để advance thời gian tức thì — test toàn bộ vòng đời job trong mili giây.
  
### Vấn đề: scheduled job và retry backoff
Hai pattern phổ biến dùng thời gian:
  
1. **Scheduled job**: chạy định kỳ (cron, fixedDelay, fixedRate). Ví dụ: dọn token hết hạn mỗi giờ, gửi báo cáo 0h hàng ngày.
2. **Retry với backoff**: gọi service bên ngoài, nếu thất bại thì chờ 1s, 2s, 4s, 8s... (exponential backoff) rồi thử lại, tối đa N lần.
  
Cả hai đều đọc "bây giờ" để quyết định: *có nên chạy job không?*, *đã đến lúc retry chưa?*. Nếu đọc {{Instant.now()}} hoặc {{System.currentTimeMillis()}} trực tiếp, test buộc phải chờ thật.
  
### MutableClock:_clock có thể advance
{{java.time.Clock}} là abstract class, có thể extend để tự điều khiển thời gian:
  
~~~java
class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
  
    MutableClock(Instant start, ZoneId zone) {
        this.instant = new AtomicReference<>(start);
        this.zone = zone;
    }
  
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
  
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
    void setInstant(Instant i) { instant.set(i); }
}
~~~
  
Production dùng {{Clock.systemUTC()}}; test tạo {{MutableClock}} rồi gọi {{advance()}} để nhảy thời gian. Vì dùng {{AtomicReference}}, an toàn nếu scheduler chạy trên thread riêng (test vẫn advance từ main thread).

### Test scheduled cleanup job
Service dọn token hết hạn:
  
~~~java
class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
  
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }
  
    int cleanup() {
        return repo.deleteExpiredBefore(clock.instant());
    }
}
~~~
  
Test:
1. Seed repo: token A (expired hôm qua), B (còn hạn 5 ngày), C (còn hạn 30 ngày).
2. MutableClock start tại hôm nay 00:00.
3. Gọi cleanup() -> deleted = 1 (chỉ A).
4. clock.advance(10 days) -> now = ngày 10.
5. Gọi cleanup() -> deleted = 1 (B hết hạn ngày 5, C vẫn còn).
6. Verify C vẫn tồn tại.
  
Toàn bộ vòng đời job test trong vài mili giây, không sleep.

### Test retry exponential backoff
Retry service:
  
~~~java
class RetryService {
    private final RemoteClient client;
    private final Clock clock;
    private final int maxRetries;
  
    RetryService(RemoteClient client, Clock clock, int maxRetries) { ... }
  
    String callWithRetry(String input) {
        int attempt = 0;
        while (true) {
            try { return client.call(input); }
            catch (RemoteException ex) {
                if (++attempt >= maxRetries) throw ex;
                long delay = (1L << (attempt - 1)) * 1000; // 1s, 2s, 4s, 8s...
                Instant nextRetry = clock.instant().plusMillis(delay);
                // busy-wait hoặc sleep cho đến nextRetry (giản lược)
                while (clock.instant().isBefore(nextRetry)) { /* spin */ }
            }
        }
    }
}
~~~
  
Test với MutableClock:
1. Stub client fail 3 lần, lần 4 success.
2. clock.advance(1s) -> verify retry 1.
3. clock.advance(2s) -> verify retry 2.
4. clock.advance(4s) -> verify retry 3.
4. clock.advance(8s) -> verify retry 4 success.
Test kiểm soát được chính xác delay giữa các lần retry, không sleep 15 giây.

### Kết hợp với ScheduledExecutorService
Nếu dùng Spring {{@Scheduled}} hoặc {{ScheduledExecutorService}}, hãy tiêm cả ScheduledExecutorService. Test dùng fake scheduler cho phép trigger job thủ công:
  
~~~java
abstract class ManualScheduler implements ScheduledExecutorService {
    private final List<Runnable> tasks = new ArrayList<>();
    private final Clock clock;
  
    ManualScheduler(Clock clock) { this.clock = clock; }
  
    @Override public ScheduledFuture<?> scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnit unit) {
        tasks.add(command);
        return new DummyFuture();
    }
  
    void triggerAll() { tasks.forEach(Runnable::run); }
}
~~~
  
Test: setup job, clock.advance, scheduler.triggerAll(), verify job chạy với thời gian mới.

### Bẫy production hay gặp
- **MutableClock dùng chung giữa test**: test A advance 10 ngày, test B thấy clock đã 10 ngày -> flaky. Mỗi test tự tạo instance mới.
- **Quên tiêm Clock vào helper/internal class**: scheduled job có clock nhưng helper tính nextRunTime dùng {{Instant.now()}}. Test pass (helper không chạy), production sai. Grep {{\.now\(\)}} trong domain code.
- **Retry spin-wait tiêu tốn CPU**: production không nên busy-wait; dùng {{ScheduledExecutorService.schedule}} hoặc {{Thread.sleep}} với interrupt handling. Test vẫn dùng MutableClock để verify logic tính delay.
- **Scheduled job chạy song song với test**: nếu job chạy trên thread pool thật, test advance clock có thể race với job đang chạy. Dùng fake scheduler (trigger thủ công) hoặc {{@Transactional}} isolation.
- **Timezone trong scheduled job**: job "chạy 0h hàng ngày" theo múi giờ nào? Server UTC, user Việt Nam. Dùng ZonedDateTime với ZoneId cố định + Clock injection.

> Senior tip: hãy viết **ArchUnit rule** cấm {{Thread.sleep}}, {{ScheduledExecutorService.scheduleAtFixedRate}} trực tiếp trong domain code, bắt buộc tiêm Clock và Scheduler. Khi review PR, grep "sleep\|scheduleAtFixedRate\|@Scheduled" là thấy ngay vi phạm. Một team trưởng giỏi coi scheduled job test được bằng MutableClock là tiêu chí "senior" — nó tách được logic business khỏi framework scheduling.

### Ví dụ đời thực: cleanup job không chạy do DST
Một job dọn session hết hạn chạy 02:00 hàng ngày (cron "0 2 * * *"). Ngày 29/3 (chuyển DST tại châu Âu), đồng hồ nhảy từ 02:00 sang 03:00 — 02:00 không tồn tại. Spring cron (dựa trên system timezone) bỏ qua lần chạy đó. Session hết hạn tích lũy 24h, DB đầy, service down. Team fix: đổi sang tiêm Clock + ZoneId, test dùng MutableClock advance qua ngày DST gap, verify job vẫn chạy (logic tính nextRun dùng ZonedDateTime.ofInstant(clock.instant(), zone) tự handle gap). Bug không tái diễn.

### Trả lời mẫu khi phỏng vấn
"Khi hỏi 'test scheduled job/retry backoff thế nào?', tôi nói: tiêm Clock vào job/retry service. Test dùng MutableClock (extend java.time.Clock, AtomicReference<Instant>, có advance(Duration)). Scheduled job: seed data, advance clock theo chu kỳ (1h, 1 ngày), gọi job thủ công (fake scheduler), verify dọn đúng batch. Retry backoff: stub client fail N-1 lần, advance clock theo exponential delay (1s, 2s, 4s...), verify retry đúng số lần và delay. Cách này test toàn bộ vòng đời trong mili giây, không sleep, deterministic. Lưu ý: MutableClock không thay thế integration test cho thread-safety và framework scheduling."

### Liên hệ phỏng vấn
Interviewer hỏi: "Hệ thống có job dọn dẹp chạy 0h hàng ngày, test thế nào?", "Retry exponential backoff 1s-2s-4s-8s, test không sleep thế nào?", "DST làm scheduled job bị bỏ qua, xử lý ra sao?". Trả lời: tiêm Clock + MutableClock.advance, fake scheduler trigger thủ công, test advance qua DST gap verify job vẫn chạy. Nêu rõ không dùng Thread.sleep, không phụ thuộc framework scheduler trong unit test.
`,
  exercises: [
    {
      title: 'MutableClock, TokenCleanupJob, RetryService với exponential backoff',
      prompt: `Cho sẵn interface {{TokenRepository}}, {{RemoteClient}}, class {{MutableClock}} (đã có sẵn advance/setInstant). Hãy hoàn thiện:
  
1. {{TokenCleanupJob}}: nhận {{TokenRepository}} và {{Clock}}. {{cleanup()}} gọi {{repo.deleteExpiredBefore(clock.instant())}}.
2. {{RetryService}}: nhận {{RemoteClient}}, {{Clock}}, {{maxRetries}}. {{callWithRetry(input)}}:
   - Gọi {{client.call(input)}}, nếu success trả kết quả.
   - Nếu {{RemoteException}}, tính delay = {{(1L << (attempt - 1)) * 1000}} ms (attempt 1->1s, 2->2s, 3->4s...).
   - Dùng busy-wait trên {{clock}} (xem code block dưới).
   - Tăng attempt, nếu vượt maxRetries ném exception cuối.
  
~~~java
Instant deadline = clock.instant().plusMillis(delay);
while (clock.instant().isBefore(deadline)) { /* spin */ }
~~~
  
Test dùng MutableClock advance thời gian verify job dọn đúng batch và retry đúng delay.`,
      starter: `import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
  
interface TokenRepository {
    int deleteExpiredBefore(Instant cutoff);
}
  
interface RemoteClient {
    String call(String input) throws RemoteException;
}
  
class RemoteException extends RuntimeException {
    RemoteException(String msg) { super(msg); }
}
  
class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
  
    MutableClock(Instant start, ZoneId zone) { this.instant = new AtomicReference<>(start); this.zone = zone; }
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
    void setInstant(Instant i) { instant.set(i); }
}
  
class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
  
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }
  
    int cleanup() { throw new UnsupportedOperationException("TODO"); }
}
  
class RetryService {
    private final RemoteClient client;
    private final Clock clock;
    private final int maxRetries;
  
    RetryService(RemoteClient client, Clock clock, int maxRetries) {
        this.client = client; this.clock = clock; this.maxRetries = maxRetries;
    }
  
    String callWithRetry(String input) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
  
public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static final Instant BASE = Instant.parse("2026-03-01T00:00:00Z");
  
    public static void main(String[] args) {
        check("token cleanup job deletes expired tokens in batches as clock advances", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            TokenRepository repo = new TokenRepository() {
                private final Map<String, Instant> tokens = new HashMap<>();
                { tokens.put("A", BASE.minus(Duration.ofDays(1)));   // expired yesterday
                  tokens.put("B", BASE.plus(Duration.ofDays(5)));    // expires day 5
                  tokens.put("C", BASE.plus(Duration.ofDays(30))); } // expires day 30
                @Override public int deleteExpiredBefore(Instant cutoff) {
                    int before = tokens.size();
                    tokens.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
                    return before - tokens.size();
                }
            };
            TokenCleanupJob job = new TokenCleanupJob(repo, clock);
            eq(1, job.cleanup()); // day 0: A deleted

            clock.advance(Duration.ofDays(10)); // advance to day 10
            eq(1, job.cleanup()); // day 10: B deleted (expired day 5), C remains
            eq(0, job.cleanup()); // still day 10: nothing left to delete

            clock.advance(Duration.ofDays(30)); // advance to day 40
            eq(1, job.cleanup()); // day 40: C deleted (expired day 30)
            eq(0, job.cleanup()); // all tokens deleted
        });
  
        check("retry service with exponential backoff advances clock correctly", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            List<String> attempts = new ArrayList<>();
            RemoteClient client = input -> {
                attempts.add(input + "-" + attempts.size());
                if (attempts.size() <= 3) throw new RemoteException("fail " + attempts.size());
                return "success";
            };
            RetryService svc = new RetryService(client, clock, 5);

            final AtomicReference<String> resultRef = new AtomicReference<>();
            final AtomicReference<Throwable> errorRef = new AtomicReference<>();
            Thread t = new Thread(() -> {
                try { resultRef.set(svc.callWithRetry("test")); }
                catch (Throwable e) { errorRef.set(e); }
            });
            t.start();
            long stop = System.currentTimeMillis() + 10000;
            while (t.isAlive() && System.currentTimeMillis() < stop) {
                clock.advance(Duration.ofMillis(100));
                try { Thread.sleep(10); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
            try { t.join(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            if (errorRef.get() != null) throw new RuntimeException(errorRef.get());
            eq("success", resultRef.get());
            eq(4, attempts.size()); // 3 fails + 1 success
        });
  
        check("retry service throws after maxRetries exhausted", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            RemoteClient client = input -> { throw new RemoteException("always fail"); };
            RetryService svc = new RetryService(client, clock, 3);

            final AtomicReference<Throwable> errorRef = new AtomicReference<>();
            Thread t = new Thread(() -> {
                try { svc.callWithRetry("test"); }
                catch (Throwable e) { errorRef.set(e); }
            });
            t.start();
            long stop = System.currentTimeMillis() + 10000;
            while (t.isAlive() && System.currentTimeMillis() < stop) {
                clock.advance(Duration.ofMillis(100));
                try { Thread.sleep(10); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
            }
            try { t.join(5000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            Throwable err = errorRef.get();
            if (err == null) throw new AssertionError("should throw");
            eq("always fail", err.getMessage());
        });
  
        check("retry service success on first attempt does not advance clock", () -> {
            MutableClock clock = new MutableClock(BASE, ZoneOffset.UTC);
            RemoteClient client = input -> "ok";
            RetryService svc = new RetryService(client, clock, 3);
            eq("ok", svc.callWithRetry("test"));
            eq(BASE, clock.instant()); // clock not advanced
        });
  
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.*;
  
interface TokenRepository {
    int deleteExpiredBefore(Instant cutoff);
}
  
interface RemoteClient {
    String call(String input) throws RemoteException;
}
  
class RemoteException extends RuntimeException {
    RemoteException(String msg) { super(msg); }
}
  
class MutableClock extends Clock {
    private final AtomicReference<Instant> instant;
    private final ZoneId zone;
  
    MutableClock(Instant start, ZoneId zone) { this.instant = new AtomicReference<>(start); this.zone = zone; }
    @Override public ZoneId getZone() { return zone; }
    @Override public Instant instant() { return instant.get(); }
    @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant.get(), zone); }
    void advance(Duration d) { instant.updateAndGet(i -> i.plus(d)); }
    void setInstant(Instant i) { instant.set(i); }
}
  
class TokenCleanupJob {
    private final TokenRepository repo;
    private final Clock clock;
  
    TokenCleanupJob(TokenRepository repo, Clock clock) { this.repo = repo; this.clock = clock; }
  
    int cleanup() { return repo.deleteExpiredBefore(clock.instant()); }
}
  
class RetryService {
    private final RemoteClient client;
    private final Clock clock;
    private final int maxRetries;
  
    RetryService(RemoteClient client, Clock clock, int maxRetries) {
        this.client = client; this.clock = clock; this.maxRetries = maxRetries;
    }
  
    String callWithRetry(String input) {
        int attempt = 0;
        while (true) {
            try { return client.call(input); }
            catch (RemoteException ex) {
                if (++attempt >= maxRetries) throw ex;
                long delay = (1L << (attempt - 1)) * 1000; // 1s, 2s, 4s...
                Instant deadline = clock.instant().plusMillis(delay);
                while (clock.instant().isBefore(deadline)) { /* busy-wait on mutable clock */ }
            }
        }
    }
}`,
      hints: [
        'TokenCleanupJob.cleanup(): một dòng {{return repo.deleteExpiredBefore(clock.instant());}}.',
        'RetryService: vòng lặp {{while (true)}}, try {{client.call}}, catch {{RemoteException}}. Tăng attempt, kiểm tra {{attempt >= maxRetries}}. Delay = {{(1L << (attempt - 1)) * 1000}} (1, 2, 4, 8...). Busy-wait: {{Instant deadline = clock.instant().plusMillis(delay); while (clock.instant().isBefore(deadline)) ; /* spin */}}',
        'Test TokenCleanupJob: seed data, gọi cleanup tại BASE (xóa A), advance 10 ngày, gọi cleanup (xóa B), advance 30 ngày, gọi cleanup (xóa C).',
        'Test RetryService: stub client fail 3 lần rồi success. Test verify attempt count. Vì service busy-wait trên clock, test KHÔNG cần advance clock thủ công — service tự busy-wait cho đến khi clock.instant() >= deadline. Nhưng clock chỉ advance khi test gọi clock.advance(). Vì vậy test cần cấu trúc: service chạy trên thread riêng, test advance clock từ main thread. Để đơn giản, bài này chỉ kiểm tra logic compile và run; test toàn diện cần thread riêng.',
      ],
      explain: `Bài tập này áp dụng **MutableClock** vào hai pattern thực tế:
  
**1. Scheduled cleanup job**: Job dọn token hết hạn chạy định kỳ. Thay vì chờ 1 giờ / 1 ngày, test seed data, gọi cleanup, advance clock 10 ngày, gọi cleanup, verify batch đúng. Toàn bộ vòng đời test trong mili giây.
  
**2. Retry exponential backoff**: Service gọi remote, fail thì retry sau 1s, 2s, 4s, 8s... Test dùng MutableClock để busy-wait trên clock thay vì Thread.sleep. Service đọc {{clock.instant()}} để tính deadline, loop cho đến khi clock advance đủ. Test có thể advance clock từ thread khác để mô phỏng thời gian trôi.
  
**Điểm quan trọng**: {{MutableClock}} dùng {{AtomicReference}} nên an toàn khi service busy-wait trên thread này, test advance trên thread khác. Đây là pattern thay thế {{Thread.sleep}} trong test — cho phép kiểm soát chính xác timing.
  
**Lưu ý về test retry**: Vì service busy-wait (spin) trên {{clock.instant()}}, test cần chạy service trên thread riêng và advance clock từ main thread. Đơn giản hóa: test ở đây chỉ verify logic compile và run; test integration đầy đủ sẽ dùng ExecutorService cho service thread.
  
**Lỗi hay gặp**:
- Quên tiêm Clock vào helper tính nextRunTime -> production dùng Instant.now().
- MutableClock shared giữa test -> flaky. Mỗi test tạo instance mới.
- Retry delay tính sai: attempt 0 -> 1s (1<<0), attempt 1 -> 2s (1<<1)... công thức {{(1L << (attempt - 1)) * 1000}} cho attempt tính từ 1.
- Busy-wait không có timeout -> nếu clock không advance, test treo. Production nên dùng ScheduledExecutorService.schedule thay vì spin-wait.
- Timezone: job "0h hàng ngày" theo múi giờ nào? Dùng ZonedDateTime + ZoneId cố định + Clock injection.
  
**Senior tip**: trong codebase thật, hãy tách **Scheduler** (trigger job) ra khỏi **Job logic** (dọn dữ liệu). Job logic nhận Clock, test dùng MutableClock. Scheduler (Spring @Scheduled, Quartz) chỉ trigger, không chứa logic. Integration test verify scheduler trigger đúng mốc; unit test verify job logic đúng với mọi mốc clock.`,
    },
  ],
  check: [
    {
      q: 'MutableClock dùng AtomicReference<Instant> thay vì biến thường có tác dụng gì?',
      options: [
        'Làm clock chạy nhanh hơn',
        'An toàn khi service busy-wait trên thread này, test advance từ thread khác (thread-safe)',
        'Cho phép clock tự động advance theo thời gian thật',
        'Giảm memory footprint',
      ],
      answer: 1,
      explain: 'MutableClock thường dùng trong test đa luồng: service busy-wait (spin) đọc clock.instant() trên thread worker, test gọi advance() từ main thread. AtomicReference đảm bảo visibility và atomicity giữa hai thread. Biến thường (non-volatile) có thể bị cache gây test treo hoặc đọc giá trị cũ.',
    },
    {
      q: 'Exponential backoff delay sequence (ms) cho attempt 1, 2, 3, 4 là gì?',
      options: [
        '1000, 2000, 3000, 4000',
        '1000, 2000, 4000, 8000',
        '1000, 1000, 2000, 3000',
        '2000, 4000, 8000, 16000',
      ],
      answer: 1,
      explain: 'Exponential backoff thường là 2^(attempt-1) * baseDelay. Với baseDelay=1000ms: attempt 1 -> 1s, attempt 2 -> 2s, attempt 3 -> 4s, attempt 4 -> 8s. (A) là linear backoff. (C) là Fibonacci-ish. (D) bỏ sót attempt 1.',
    },
    {
      q: 'Tại sao scheduled job production không nên dùng busy-wait (spin) trên clock để chờ next run?',
      options: [
        'Vì busy-wait tiêu tốn CPU 100% khi chờ, production nên dùng ScheduledExecutorService.schedule hoặc Thread.sleep có interrupt handling',
        'Vì Clock không hỗ trợ busy-wait',
        'Vì busy-wait không chính xác',
        'Vì MutableClock chỉ dùng trong test',
      ],
      answer: 0,
      explain: 'Spin-wait (while clock.instant().isBefore(deadline) {}) chiếm dụng CPU liên tục. Production nên dùng ScheduledExecutorService.schedule(task, delay, unit) hoặc Thread.sleep (có handle InterruptedException) để nhường CPU. MutableClock + busy-wait chỉ dùng trong test để mô phỏng thời gian trôi tức thì.',
    },
    {
      q: 'Job dọn session chạy 02:00 hàng ngày bị bỏ qua ngày chuyển DST (giờ nhảy từ 02:00 sang 03:00). Giải pháp đúng?',
      options: [
        'Đổi cron chạy 03:00',
        'Dùng ZonedDateTime với ZoneId cố định + Clock injection, tính nextRun tự handle DST gap',
        'Tắt DST trên server',
        'Chạy job thủ công ngày đó',
      ],
      answer: 1,
      explain: 'Khi dùng ZonedDateTime.ofInstant(clock.instant(), zone), JDK tự điều chỉnh gap/overlap DST. Ví dụ 02:30 không tồn tại -> adjust sang 03:30. Job logic tính nextRun dựa trên ZonedDateTime sẽ tự handle. Cron expression của Spring/@Scheduled thường dùng system timezone và có thể bỏ qua gap; cách chắc chắn là tự điều khiển bằng Clock + ZoneId.',
    },
  ],
  related: ['testing-002', 'testing-009', 'testing-015'],
  tags: ['Clock', 'MutableClock', 'scheduled job', 'retry', 'exponential backoff', 'DST', 'advance time', 'time testing'],
},
);
