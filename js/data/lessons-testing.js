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
- **Mock trả về null theo mặc định**: gọi method chưa stub trên mock trả {{null}} (hoặc 0/false), gây {{NullPointerException}} khó hiểu. Với {{@MockitoBean}}, hãy bật strict stubbing để phát hiện stub thừa.
- **Verify quá chặt**: {{verify(repo, times(2)).save(any())}} làm test đỏ khi refactor sang {{saveAll}}. Ưu tiên state verification khi có thể.
- **Fake lệch thật**: fake cho phép hai bản ghi trùng key trong khi database có unique constraint. Test xanh, production lỗi. Những ràng buộc quan trọng phải được test ở tầng tích hợp.
- **Chia sẻ fake có trạng thái giữa các test**: dữ liệu rò rỉ làm test phụ thuộc thứ tự. Tạo fake mới trong mỗi test hoặc có hàm {{clear()}} gọi ở {{@BeforeEach}}.
- **Mock thứ không sở hữu**: đừng mock {{String}}, {{List}}, {{BigDecimal}}. Hãy dùng object thật; mock JDK type khiến test khó hiểu và dễ sai.

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
      explain: `Fake cài đặt cùng interface bằng cấu trúc dữ liệu đơn giản, nên test được trạng thái sau nhiều bước mà không cần verify từng lời gọi. Interface không có cài đặt thật vẫn có thể dùng fake hoặc stub/mock tuỳ mục đích, nên phương án 1 không phải lý do quyết định. Muốn kiểm tra thứ tự gọi thì dùng mock/spy với {{InOrder}}; mô phỏng lỗi mạng ngẫu nhiên là fault injection, không phải ưu điểm của fake.`,
    },
  ],
  related: ['testing-003', 'testing-018', 'testing-010'],
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

Trong test có thể dùng {{@TestConfiguration}} trả {{Clock.fixed(...)}}, hoặc tạo service trực tiếp với clock giả nếu là unit test. Với legacy code chưa inject được, một số đội dùng {{Mockito.mockStatic(Instant.class)}} hoặc thư viện như Clockify — nhưng đó là giải pháp tạm: static mocking dễ vỡ, không chạy song song tốt và che giấu thiết kế phụ thuộc ẩn.

### Bẫy production hay gặp
- **Quên truyền clock vào nhánh code khác**: service nhận clock nhưng một helper vẫn gọi {{LocalDate.now()}}. Test xanh vì nhánh đó không chạy, production sai vào nửa đêm.
- **Clock mutable dùng chung giữa các test**: test này advance làm test khác lệch. Tạo clock mới mỗi test, hoặc reset trong {{@BeforeEach}}.
- **Lưu {{LocalDateTime}} vào database**: mất offset, đọc lại ở múi giờ khác bị lệch. Ưu tiên {{Instant}}/{{OffsetDateTime}} với cột {{timestamptz}}.
- **So sánh thời gian bằng {{equals}}**: hai instant cùng thời điểm nhưng khác độ chính xác (nano) có thể không bằng nhau. So bằng {{isBefore}}/{{isAfter}} hoặc cắt về đơn vị nghiệp vụ.
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
        check("expiry adds exact calendar days on the instant", () -> {
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
- Dùng {{ChronoUnit.DAYS}} trên {{LocalDateTime}} thay vì {{Instant}} rồi so sánh với {{Instant.now()}}; kết quả đổi theo timezone JVM.
- Dùng {{isAfter}} thay vì {{isBefore}} cho {{active}}: tại đúng mốc expiry, {{isAfter}} trả false nên tình cờ đúng, nhưng nếu viết {{!isBefore}} thì tại mốc lại thành true. Hãy viết test biên để khoá ngữ nghĩa.
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
      explain: `Sleep làm suite chậm và chỉ "hy vọng" thời gian trôi đủ; trên CI tải cao, lịch trình thread có thể trễ hơn 2 giây hoặc ngược lại. Nó cũng không cho phép kiểm tra chính xác thời điểm một giây trước expiry. Sleep không làm hỏng đồng hồ, chỉ ném InterruptedException khi bị ngắt (có thể khai báo), và hoàn toàn hợp lệ về mặt ngôn ngữ — vấn đề là độ tin cậy và tốc độ.`,
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
        'Chuỗi ngày sinh theo định dạng dd/MM/yyyy và so sánh chuỗi',
        '{{LocalDateTime}} theo timezone mặc định của JVM',
        'Số mili giây từ epoch tự cộng tay',
        '{{Instant}} cho mốc tuyệt đối, tính expiry bằng {{plus(7, ChronoUnit.DAYS)}} và đọc giờ qua {{Clock}}',
      ],
      answer: 3,
      explain: `Mốc hết hạn là thời điểm tuyệt đối, nên {{Instant}} (hoặc {{OffsetDateTime}} khi cần offset) là lựa chọn đúng; đọc thời gian hiện tại qua {{Clock}} để test được. So sánh chuỗi ngày sai thứ tự và mất giờ; {{LocalDateTime}} theo timezone JVM sẽ lệch khi server đổi múi giờ; cộng tay mili giây dễ sai và bỏ qua API lịch.`,
    },
  ],
  related: ['testing-005', 'testing-022', 'testing-010'],
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
| Metamorphic | Thay đổi input theo cách biết trước ảnh hưởng | merge(a,b) có cùng đa tập phần tử với a+b |
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

Lưu ý: {{Random}} có đồng bộ nội bộ nên dùng chung được, nhưng mọi lời gọi sẽ tranh chấp cùng một seed và làm test chạy song song chậm, chưa kể thứ tự gọi giữa các test ảnh hưởng lẫn nhau. Vì vậy mỗi test nên có instance riêng; đừng dùng một {{Random}} tĩnh dùng chung. Trong code production cần số ngẫu nhiên nhanh, {{ThreadLocalRandom}} hoặc {{SplittableRandom}} phù hợp hơn, nhưng với test ưu tiên khả năng tái hiện.

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
Giả sử property hỏng với mảng 27 phần tử. Mảng đó khó đọc. **Shrinking** là quá trình tự động thử các biến thể nhỏ hơn (bỏ phần tử, giảm giá trị, rút ngắn chuỗi) mà vẫn làm property sai, để báo cho bạn case tối giản nhất — thường chỉ còn một vài phần tử. Ví dụ bug merge bỏ phần tử cuối sẽ thu về {{[1]}} và {{[2]}} thay vì hai mảng dài.

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

**2. {{check(name, seed, trials, property)}}**: chạy {{property}} đúng {{trials}} lần. Ở trial thứ {{i}}, tạo {{new Random(seed + i)}} và truyền cho property. Nếu property ném bất kỳ lỗi nào, ném lại {{AssertionError}} với message chứa {{name}}, {{seed}} của trial và số trial, kèm cause gốc. {{trials <= 0}} thì ném {{IllegalArgumentException}}.

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
  related: ['testing-015', 'testing-006', 'testing-023'],
  tags: ['property-based testing', 'PBT', 'seed', 'merge sort', 'jqwik'],
},
);
