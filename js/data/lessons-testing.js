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
  body: `### Vì sao cần test double
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
  body: `### Thời gian là một dependency, không phải hằng số
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
| {{Clock.tick(base, duration)}} | Đồng hồ nhích từng bước cố định | Test logic cần thời gian trôi theo nhịp |

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
  body: `### Example-based test chỉ kiểm tra những gì bạn nghĩ tới
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
                eq(4, calls[0]);                          // dung lai ngay o trial loi
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
);
