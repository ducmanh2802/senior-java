/*
 * English translation of js/data/lessons-testing.js — task T506. Format: js/core/i18n.js (content overlay).
 * ids: lesson-testing-001 lesson-testing-002
 */
App.i18n.content({
  'lesson-testing-001': {
    title: 'Test doubles: fake, stub, and mock — choose the right one instead of mocking everything',
    goals: [
      'Distinguish dummy, stub, spy, mock, and fake, plus the two verification styles: state and interaction',
      'Write a fake repository and a spy that counts calls using plain Java, no Mockito required',
      'Recognize the over-mocking smell and know when to replace mocks with fakes or integration tests',
    ],
    body: `### Why test doubles are needed
A good unit test wants to verify **one** unit of logic. But that unit usually calls out: database, HTTP, queues, the system clock. If the test really calls Postgres or a bank API, it becomes slow, flaky, and won't run on a machine without infrastructure. A **test double** is an object that replaces a real collaborator, created specifically for testing purposes.

Gerard Meszaros and Martin Fowler distinguish five types, differing in **purpose** rather than how they are written:

| Type | Role | Example |
|---|---|---|
| Dummy | Only fills a parameter, never called | Passing {{null}} for an unused logger |
| Stub | Returns canned data for a call | Repository always returns an account with balance 1,000 |
| Spy | Records calls for later verification | Count how many times email is sent, store arguments |
| Mock | Object the test **sets expectations** on | Expect {{send}} to be called exactly once |
| Fake | Real implementation but simpler | Repository storing in {{HashMap}} |

The line between spy and mock is blurry: Mockito calls everything a mock, and "verify" is interaction verification. Key point: **stub answers a question, mock checks behavior, fake replaces an entire implementation**.

### State verification and interaction verification
There are two ways to assert a test:

- **State verification**: run the code, look at the final state. Example: after transferring 200, the two account balances must be 800 and 700. This is robust because it doesn't care how many times the service called the repository, as long as the result is correct.
- **Interaction verification**: assert the service called the collaborator correctly. Example: must call {{notifier.transferCompleted("ACC-2", 200)}} exactly once. This is needed when the side effect is **not observable** via state, like sending an email, publishing an event, or calling a payment gateway.

A common mistake is using interaction verification for everything. Then the test knows too much about **how** the service works. You change from two {{save}} calls to one {{saveAll}} — business behavior unchanged but dozens of tests turn red. This is **over-specification**, the number one reason tests hinder refactoring.

### Fake repository: replacing an entire implementation
A fake isn't just "returning fake data". It implements the **same interface** as the real thing, using a simple data structure, and tries to preserve important semantics:

~~~java
interface AccountRepository {
    Optional<Account> find(String id);
    void save(Account account);
}

class FakeAccountRepository implements AccountRepository {
    private final Map<String, Account> accounts = new HashMap<>();

    @Override public Optional<Account> find(String id) {
        return Optional.ofNullable(accounts.get(id));   // correct "not found" semantics
    }

    @Override public void save(Account account) {
        accounts.put(account.id(), account);            // save is upsert, like JPA merge
    }
}
~~~

Because the fake actually stores in memory, you can test the **entire chain** of read-modify-write: seed two accounts, call transfer, then read back the balances. The test doesn't need to know how many times the service called {{find}} or {{save}}, so refactoring inside the service won't break the test. Fakes work especially well for repositories, gateways, caches, clocks — collaborators with **stateful** behavior.

The cost: a fake is **code to maintain**. If the fake behaves differently from the real thing (e.g., {{save}} overwrites while the database has a unique constraint), tests pass but production fails. Keep fakes small, only simulate behavior the tests actually rely on, and don't use fakes to replace integration tests for complex SQL.

### Stub: just need one answer
Use a stub when the test needs a collaborator to return a specific value, without caring how it's called:

~~~java
class FixedRateGateway implements RateGateway {
    private final BigDecimal rate;
    FixedRateGateway(String rate) { this.rate = new BigDecimal(rate); }
    @Override public BigDecimal rateFor(String currency) { return rate; }  // always 25,100
}
~~~

With Mockito, a stub is written as {{when(gateway.rateFor("USD")).thenReturn(new BigDecimal("25100"))}}. Stubs are very cheap and don't need verification. But if you stub too many methods just to "make it run", that's a sign the object depends on too many things.

### Spy: record for later verification
When a side effect isn't visible via state, use a spy or mock to verify interaction. A hand-written spy is very simple:

~~~java
class RecordingNotifier implements Notifier {
    private final List<String> calls = new ArrayList<>();

    @Override public void transferCompleted(String accountId, long amount) {
        calls.add(accountId + ":" + amount);          // record exact arguments
    }

    List<String> calls() { return calls; }            // test reads after run
}
~~~

Then the test asserts {{calls.size() == 1}} and {{calls.get(0).equals("ACC-2:200")}}. This is interaction verification but **without a library dependency**, easier to read and debug than {{verify(notifier).transferCompleted(...)}} when arguments are complex.

Don't overuse: only verify interactions that **are business contracts**. "Must send exactly one notification to the recipient" is a contract. "Must call {{find}} before {{save}}" is usually an implementation detail.

### When to use what
| Situation | Use | Reason |
|---|---|---|
| Repository, cache, gateway with state | Fake | Test entire read-write flow, not locked to call count |
| Collaborator only provides input data | Stub | One fixed value is enough |
| Send email, publish event, call payment | Mock or spy | Side effect not observable via state |
| Value object, DTO, record | No double | Creating real object is cheaper and more correct |
| SQL, transaction, serialization | Integration test | Doubles hide real infrastructure bugs |

A pragmatic rule: **mock at system boundaries, fake at layer boundaries, and pure logic needs no doubles at all**. If a class needs 6 dependencies mocked, the problem isn't the test — it's the class design owning too many responsibilities.

### Production traps to avoid
- **Mock returns "empty" by default**: unstubbed methods on a Mockito mock return {{null}} for objects, 0/false for primitives, empty collections, and {{Optional.empty()}} — tests may "pass" by accidentally hitting the "not found" branch, or fail with confusing {{NullPointerException}}. Use {{@ExtendWith(MockitoExtension.class)}}: strict stubs mode throws {{UnnecessaryStubbingException}} for unused stubs, helping catch wrong arguments.
- **Over-precise verify**: {{verify(repo, times(2)).save(any())}} makes tests red when refactoring to {{saveAll}}. Prefer state verification when possible.
- **Fake diverges from real**: fake allows duplicate keys while database has unique constraint. Tests pass, production crashes. Critical constraints must be tested at the integration layer.
- **Sharing stateful fake between tests**: data leaks make tests order-dependent. Create a new fake per test or have a {{clear()}} method called in {{@BeforeEach}}.
- **Mocking value objects and JDK types**: don't mock {{List}}, {{BigDecimal}}, {{LocalDate}}, or your own DTOs — creating real objects is just as cheap and more correct. Similarly, "don't mock what you don't own": instead of directly mocking a third-party client (AWS SDK, RestTemplate), wrap it behind your own interface and mock/fake that, while the real client is tested via integration (WireMock, Testcontainers).

> Senior tip: when reviewing tests, ask "if I change the internal implementation tomorrow, will this test turn red?". If yes but business behavior hasn't changed, the test is checking implementation, not contract. Good tech leads keep interaction verification ratio very low, only at boundaries like payments, notifications, and events.

### Interview relevance
Interviewers often ask: "Distinguish stub and mock", "how does fake differ from mock", "why is over-mocking a code smell", and give a class with 5 dependencies asking how you'd test it. A good answer isn't reciting definitions — it's explaining **whether you're verifying state or interaction**, and why you chose that approach. The exercise below forces you to write fake and spy yourself to see the difference instead of memorizing.`,
    exercises: [
      {
        title: 'Write a fake repository and spy notifier for a money transfer flow',
        prompt: `Given interfaces {{AccountRepository}}, {{Notifier}}, classes {{Account}} and {{TransferService}}. Complete two test doubles:

- {{FakeAccountRepository}}: store accounts in {{HashMap}} by {{id}}. {{find(id)}} returns {{Optional.empty()}} if absent, otherwise returns the stored account. {{save(account)}} is **upsert** (same id overwrites).
- {{RecordingNotifier}}: each time {{transferCompleted(accountId, amount)}} is called, append string {{accountId + ":" + amount}} to a list; {{calls()}} returns that list for test verification.

No Mockito needed. Note: the fake must preserve correct read-after-write semantics because {{TransferService}} reads balances then writes them back.`,
        hints: [
          'Fake repository: {{find}} uses {{Optional.ofNullable(accounts.get(id))}}, {{save}} uses {{accounts.put(account.id(), account)}}.',
          'Spy just needs an {{ArrayList}}; in {{transferCompleted}} add {{accountId + ":" + amount}}. Test reads {{calls()}} after service runs.',
          'Note the order: service checks balance **before** save, so error cases must not record anything or send notifications.',
        ],
        explain: `The key point of this exercise is **state verification** and **interaction verification** coexisting in one test:

- Fake repository lets you inspect final state (two account balances) without caring how many times service called {{find}}/{{save}}. This is the robust way when refactoring.
- Spy notifier verifies exactly one interaction not observable via state: notification to the recipient with the correct amount.

Common mistakes:
- Using {{List}} as fake repository but forgetting upsert by id, causing {{save}} with same id to create two records and test reads wrong.
- Returning {{null}} instead of {{Optional.empty()}} in {{find}}, causing {{NullPointerException}} in {{orElseThrow}}.
- Recording notification before balance check, causing errors to still send notifications.
- Returning internal list directly from {{calls()}} and test accidentally mutates it. In real code, return {{List.copyOf(calls)}} to protect state.

With Mockito, this exercise maps to {{when(repo.find("ACC-1")).thenReturn(...)}} for stub, {{verify(notifier).transferCompleted("ACC-2", 200)}} for interaction, while fake repository is typically replaced by Testcontainers at the integration layer.`,
      },
    ],
    check: [
      {
        q: 'You need to verify the service sends **exactly one** confirmation email after an order is placed. Which approach fits best?',
        options: [
          'Use a fake email sender and check the file on disk',
          'Use a spy/mock that records the call, then verify it was called once with the correct arguments',
          'Use a stub that always returns true, no further verification needed',
          'No test needed because email doesn\'t affect business logic',
        ],
        answer: 1,
        explain: `Sending an email is a side effect not observable via service state, so you need **interaction verification**: a spy or mock records the call, then you assert the call count and arguments. A fake writing to disk is overkill and environment-dependent; a stub only answers but doesn't prove it was called; skipping the test loses an important business contract.`,
      },
      {
        q: 'Why is {{verify(repo, times(2)).save(any())}} usually a sign of an over-specified test?',
        options: [
          'Because Mockito doesn\'t support {{times(2)}}',
          'Because verify only works with static methods',
          'Because it locks the test to internal call count, so a valid refactor also turns the test red',
          'Because {{save}} is never called twice in reality',
        ],
        answer: 2,
        explain: `Internal call count is often an implementation detail. If business behavior only requires final data to be correct, changing two {{save}} calls to one {{saveAll}} is a valid refactor but the test turns red. Mockito supports {{times(2)}} fine; verify works with any mock, not just static; and there's no rule that "save is never called twice".`,
      },
      {
        q: 'When is a **fake** (in-memory repository) better than a mock?',
        options: [
          'When you need to test the full read-modify-write chain and don\'t want to depend on call counts',
          'When the collaborator is an interface with no real implementation',
          'When you want to verify the exact order of method calls',
          'When you need to simulate random network errors',
        ],
        answer: 0,
        explain: `A fake implements the same interface with a simple data structure, so you can test state after multiple steps without verifying each call. "Interface has no real implementation" isn't a reason to choose fake over mock — both work depending on purpose. To verify call order, use mock/spy with {{InOrder}}; simulating random network errors is fault injection, not a fake's strength.`,
      },
    ],
  },
  'lesson-testing-002': {
    title: 'Clock injection: testing time-dependent code without sleeping and without flakiness',
    goals: [
      'Explain why {{LocalDateTime.now()}} is a hidden dependency that makes tests non-deterministic',
      'Inject {{java.time.Clock}} and use {{Clock.fixed}}/{{Clock.offset}} to test exact expiry boundaries',
      'Avoid timezone, DST, and mutable clock sharing traps between tests',
    ],
    body: `### Time is a dependency, not a constant
The following code looks harmless but is one of the most common causes of flaky tests:

~~~java
boolean isExpired(Instant startedAt, int days) {
    Instant expiry = startedAt.plus(days, ChronoUnit.DAYS);
    return Instant.now().isAfter(expiry);          // reads system clock right inside
}
~~~

{{Instant.now()}} calls the real clock. A test wanting to verify "expires exactly at the boundary" must either wait for real time to pass, or set up data around {{now}} and hope the test runs fast enough. When CI is slow, the test fails; when re-run on another machine, it passes. Worse, you can't test boundary moments like "exactly 1 second left", "just expired", "across a leap year" without actually waiting.

The correct approach is to **inject time from the outside**. Java 8 provides the {{java.time.Clock}} abstraction:

~~~java
class TrialService {
    private final Clock clock;

    TrialService(Clock clock) { this.clock = clock; }

    Instant expiry(Instant startedAt, int days) {
        return startedAt.plus(days, ChronoUnit.DAYS);   // pure math, no clock read
    }

    boolean active(Instant startedAt, int days) {
        return clock.instant().isBefore(expiry(startedAt, days));  // only reads clock here
    }
}
~~~

Production passes {{Clock.systemUTC()}} (or a bean for the business timezone); tests pass {{Clock.fixed(...)}} or {{Clock.offset(...)}}. From then on, every time boundary is controllable, tests run in milliseconds, and produce the same result everywhere.

### Built-in Clock types
| Clock | Meaning | Use when |
|---|---|---|
| {{Clock.systemUTC()}} | Real clock, UTC timezone | Production for absolute timestamps |
| {{Clock.systemDefaultZone()}} | Real clock, JVM default timezone | Rarely appropriate for servers |
| {{Clock.fixed(instant, zone)}} | Always returns the same instant | Test a fixed point in time |
| {{Clock.offset(base, duration)}} | Shifts the base clock by a duration | Test "23 hours later", "7 days later" |
| {{Clock.tick(base, duration)}} | Clock that ticks in fixed steps | Test logic needing time to advance in steps |

~~~java
Instant base = Instant.parse("2026-03-01T00:00:00Z");
Clock day0  = Clock.fixed(base, ZoneOffset.UTC);
Clock plus23h = Clock.offset(day0, Duration.ofHours(23));
Clock day7  = Clock.offset(day0, Duration.ofDays(7));
~~~

Note: {{Clock.fixed}} **does not advance on its own**. If code needs time to pass during a single test (e.g., timeout, retry backoff), write a custom mutable clock: hold a {{volatile Instant}} or {{AtomicReference<Instant>}} and let the test call {{advance(Duration)}}. Don't use {{Thread.sleep}} to "wait" — it slows the suite and remains flaky under load.

### Choosing Instant vs LocalDate
Practical rules:

- **Expiry, token expiry, timeout** should be stored and computed with {{Instant}} (or {{ZonedDateTime}} if local calendar is needed). {{Instant}} is an absolute point, timezone-independent, so testing with {{Clock.fixed}} is very stable.
- **Calendar-day business logic** (end-of-month statement, "expires today") needs {{LocalDate.now(clock)}} with a **fixed** business timezone, e.g., {{ZoneId.of("Asia/Ho_Chi_Minh")}}. Don't default to JVM timezone, because the server may run UTC while users are in a different zone.
- **DST**: adding {{ChronoUnit.DAYS}} on {{Instant}} adds exactly 24 hours; on {{ZonedDateTime}} it adds a calendar day which can be 23 or 25 hours. Choose based on business requirements and write tests for both if your system has users in DST zones.

### Time boundaries: off by one second is a broken contract
Define clearly whether "expired" means **before** or **at** the expiry instant. If using {{isBefore}}, at the exact expiry moment the trial is no longer active. Tests must cover three points: just before expiry, exactly at expiry, just after expiry. These are the cases that tests relying on {{now}} can almost never write reliably.

~~~java
// in test
TrialService s = new TrialService(Clock.fixed(expiry, ZoneOffset.UTC));
assertFalse(s.active(startedAt, 7));   // exact boundary: already expired
~~~

### In Spring Boot
Declare a {{Clock}} bean and inject it into services instead of calling static methods:

~~~java
@Configuration
class TimeConfig {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
~~~

Unit tests create the service directly with a fake clock, no Spring needed. For integration tests needing a shared fake clock across the context, declare a {{Clock}} bean with a **different name** in a {{@TestConfiguration}} and mark it {{@Primary}} (Spring Boot disallows overriding a bean with the same name by default). With legacy code that can't be injected, some teams use {{Mockito.mockStatic(...)}} (mockito-inline, default from Mockito 5) to fake the static time method — but that's a band-aid: mock static only affects the current thread, must be closed correctly ({{try-with-resources}}), is brittle, and hides the hidden dependency design.

### Production traps
- **Forgetting to pass clock down a code path**: service receives clock but a helper still calls {{LocalDate.now()}}. Test passes because that branch isn't exercised, production fails at midnight.
- **Mutable clock shared between tests**: this test advances, that test drifts. Create a new clock per test, or reset in {{@BeforeEach}}.
- **Storing {{LocalDateTime}} in database**: loses offset, reading back in a different timezone shifts the value. Prefer {{Instant}}/{{OffsetDateTime}} with {{timestamptz}} columns.
- **Comparing times with {{equals}} after round-trip through database**: {{Instant.now()}} on JDK 17 has microsecond (even nanosecond) resolution, while PostgreSQL {{timestamptz}} only stores microseconds, MySQL {{DATETIME}} defaults to seconds only. Stored then read back, the value is truncated so {{equals}} returns false. Use a fixed clock in tests, or {{truncatedTo(ChronoUnit.MICROS)}} before save and compare.
- **Integration tests over-relying on real clock**: for schedulers, separate the "should this run?" decision into a function taking {{clock}}, and test the framework trigger separately.

> Senior tip: when a system has a bug "only fails after 11pm" or "only fails on the last day of the month", it's almost always timezone or calculating days with {{LocalDate.now()}} without a clock. A good tech lead enforces: **no parameterless {{now()}} in domain code**, only {{clock.instant()}}; a grep during review immediately spots violations.

### Interview relevance
Interviewers often ask: "How do you test time-dependent code?", "How do {{Clock.fixed}} and {{Clock.offset}} differ?", "How to handle expiry across DST?", and give a test using {{Thread.sleep(2000)}} asking how to fix it. A good answer: inject {{Clock}}, test with fixed/offset, cover the three boundary points, and use {{Instant}} for absolute timestamps. The exercise below models the exact trial expiry problem with clock injection.`,
    exercises: [
      {
        title: 'TrialService with Clock: compute expiry, active status, and days remaining',
        prompt: `Complete {{TrialService}} receiving {{Clock}} via constructor:

- {{expiry(startedAt, days)}}: returns {{startedAt}} plus {{days}} days (use {{ChronoUnit.DAYS}}). Throw {{IllegalArgumentException}} for {{days <= 0}}.
- {{active(startedAt, days)}}: true when current instant is **before** expiry; exactly at expiry returns false.
- {{daysRemaining(startedAt, days)}}: days remaining, **rounding up** (1 second left still counts as 1 day); already expired or exactly at expiry returns 0. Use {{Duration.between(clock.instant(), expiry)}}.

Tests will create {{Clock.fixed}} and {{Clock.offset}} with fixed instants, so results must not depend on real wall-clock time.`,
        hints: [
          '{{expiry}} is just {{startedAt.plus(days, ChronoUnit.DAYS)}}; check {{days <= 0}} first. ',
          '{{active}} uses {{clock.instant().isBefore(expiry(...))}} so at the exact expiry instant it returns false. ',
          '{{daysRemaining}} gets {{Duration.between(clock.instant(), expiry).getSeconds()}}; if <= 0 return 0, else {{(seconds + 86_399) / 86_400}}.',
        ],
        explain: `This exercise shows the clearest benefit of clock injection: the same code lets tests verify **one second before expiry**, **exactly at expiry**, and **after expiry** without sleeping. If using {{Instant.now()}} inside, these three cases are nearly impossible to write reliably.

Common mistakes:
- Converting to {{LocalDateTime}} with JVM default timezone, then adding days and comparing: same code gives different results on laptop (Vietnam time) and server (UTC).
- Writing {{active}} as {{!clock.instant().isAfter(expiry)}}: looks equivalent to {{isBefore}} but at the **exact** expiry instant, {{isAfter}} returns false so {{active}} becomes true — off by one tick from the contract. Only a boundary test at "exact expiry" catches this.
- Computing {{daysRemaining}} with plain integer division: 1 second left yields 0 days, but business wants "1 day remaining". Must round up.
- Adding days by {{86_400_000}} milliseconds: works for Instant but breaks for {{ZonedDateTime}} across DST. Use time APIs instead of manual arithmetic.

In Spring Boot, declare {{Clock}} as a bean and inject; don't sprinkle {{Clock.systemUTC()}} throughout services, or you're back to hidden dependencies.`,
      },
    ],
    check: [
      {
        q: 'Why is using {{Thread.sleep(2000)}} to wait for a token to expire a bad choice?',
        options: [
          'Because sleep breaks the system clock',
          'Because sleep always throws InterruptedException',
          'Because the test is slow, still flaky under load, and cannot verify exact boundary moments',
          'Because Java doesn\'t allow sleep in tests',
        ],
        answer: 2,
        explain: `Sleep makes the suite slow and only "hopes" enough time passes: on a loaded CI, the thread may wake up much later than 2 seconds, while the token might expire slightly earlier or later depending on when the test created it — results flip between green and red. It also doesn't allow verifying the exact moment one second before expiry. Sleep doesn't break the clock, only throws InterruptedException when interrupted (can be declared), and is perfectly valid in Java — the problem is reliability and speed.`,
      },
      {
        q: 'How does {{Clock.offset(clock, Duration.ofHours(23))}} differ from {{Clock.fixed(instant, zone)}}?',
        options: [
          'Offset returns the base clock instant plus 23 hours; fixed always returns exactly one fixed instant',
          'Offset only works with UTC timezone',
          'Fixed advances with real time, offset stands still',
          'No difference, both stand still',
        ],
        answer: 0,
        explain: `{{Clock.offset}} wraps another clock and shifts its result by a duration, so if the base is system it still runs; if the base is fixed it stands still at the instant plus offset. {{Clock.fixed}} always returns the same instant. Offset isn't limited to UTC, and fixed doesn't run — that's the trait of {{Clock.systemUTC}}.`,
      },
      {
        q: 'Business rule: "trial expires 7 days after activation". What should you store and compute with?',
        options: [
          'Date string in dd/MM/yyyy format and compare strings',
          '{{LocalDateTime}} using JVM default timezone',
          'Milliseconds since epoch, adding manually',
          '{{Instant}} for absolute instant, compute expiry with {{plus(7, ChronoUnit.DAYS)}}, read time via {{Clock}}',
        ],
        answer: 3,
        explain: `The expiry moment is an absolute point in time, so {{Instant}} (or {{OffsetDateTime}} when offset is needed) is the right choice; read current time via {{Clock}} for testability. String date comparison breaks ordering and throws away the time of day; {{LocalDateTime}} with JVM timezone shifts when server timezone changes; manual millisecond math is error-prone and ignores calendar APIs.`,
      },
    ],
  },
});
