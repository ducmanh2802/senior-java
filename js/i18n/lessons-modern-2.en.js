/*
 * English translation of js/data/lessons-modern.js — task T268. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-005
 */
App.i18n.content({
  'lesson-modern-005': {
    title: 'java.time: Instant, LocalDate, ZonedDateTime, time zones and bank cut-off',
    goals: [
      'Distinguish Instant, LocalDate, LocalDateTime, ZonedDateTime (and OffsetDateTime) and know when to use each',
      'Convert between time zones with ZoneId and compute in the real business time zone',
      'Handle a bank cut-off: skip weekends and compute the value date',
    ],
    body: `**Summary:** java.time replaces java.util.Date/Calendar with immutable classes, each with one job: Instant (a machine instant), LocalDate/LocalDateTime (a calendar date with no time zone), ZonedDateTime (calendar + time zone). You convert between them through ZoneId; handling a bank cut-off means converting to Vietnam time first, then computing the business day.

### Instant, LocalDate, ZonedDateTime
- {{Instant}}: a point on the UTC timeline (seconds/nanos since the epoch), **no time zone**. This is what you store in the DB, write into logs, or measure intervals with. The epoch is the fixed starting point every computer counts from: 1970-01-01T00:00:00Z.
- {{LocalDate}}: a date (year-month-day) with no time of day and no time zone. Used for birthdays and value dates.
- {{LocalDateTime}}: date + time, **not yet bound to a time zone**. "2024-03-01 09:00" in Hanoi and "2024-03-01 09:00" in London are two instants seven hours apart, so {{LocalDateTime}} alone cannot tell you when an event really happened. Only use it for "wall-clock" time when the time zone is already clear from the context (e.g. the Hanoi office opens at 09:00 local time).
- {{ZonedDateTime}}: date + time + time zone ({{ZoneId}}); it uniquely identifies one instant and also knows that region's daylight-saving rules. {{OffsetDateTime}} only carries a fixed offset (+07:00) and does not know the rules.
- {{ZoneId}}: a region time zone, e.g. {{Asia/Ho_Chi_Minh}} (currently UTC+7; Vietnam has no daylight saving time).
- {{Duration}}: an amount of time counted in seconds/nanos ("exactly 24 hours"). {{Period}}: an amount of time counted on the calendar ("1 day", "1 month"). In a region with daylight saving, {{zdt.plusDays(1)}} keeps the same wall-clock time (which may really be 23 or 25 hours), while {{zdt.plus(Duration.ofHours(24))}} adds exactly 24 hours, so the wall-clock time can shift by one hour.

~~~java
Instant now = Instant.now();                                       // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));      // convert to VN time
LocalDate today = vn.toLocalDate();                                // the date in VN
~~~

### DateTime formatter
~~~java
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
String s = vn.format(fmt);
ZonedDateTime parsed = ZonedDateTime.parse(s, fmt.withZone(ZoneId.of("Asia/Ho_Chi_Minh")));
~~~

The string {{s}} contains no time zone information, so you have to attach a zone with {{withZone}} before it can be parsed back into a {{ZonedDateTime}}; otherwise it throws {{DateTimeParseException}}.

### Classic formatting traps
- {{YYYY}} is the **week-based year**, not the calendar year. 30/12/2024 falls in week 1 of 2025, so the pattern {{dd/MM/YYYY}} prints "30/12/2025". Always use {{yyyy}} (or {{uuuu}}).
- {{MM}} is the month and {{mm}} is the minute; {{HH}} is the 0–23 hour and {{hh}} is the 1–12 hour (which needs {{a}} for AM/PM).
- {{DateTimeFormatter}} is immutable and thread-safe, so a single {{static final}} constant can be shared by every thread. The old {{SimpleDateFormat}} is **not** thread-safe: sharing one instance between threads produces random wrong dates.

### Bank cut-off
An example rule: a transaction after 16:00 **Vietnam time** is booked on the next business day; Saturday and Sunday are not business days. Always convert to the time zone the business rule is written in before comparing against the cut-off time. Servers usually run in UTC: 16:30 Vietnam time is 09:30 UTC, so comparing the UTC hour against 16:00 makes you conclude, wrongly, that the transaction is "before the cut-off". Real systems also have to skip public holidays (Tet, 30 April…), which are usually kept in a holiday calendar table.

### Don't call now() directly inside business logic
{{Instant.now()}} and {{LocalDate.now()}} read the system clock and the server's default time zone ({{ZoneId.systemDefault()}}), which can differ between a dev machine and production. There are two correct approaches:
- Take the instant as a parameter (as the exercise below does with {{Instant}}), or
- Inject a {{java.time.Clock}} and call {{Instant.now(clock)}}; in tests use {{Clock.fixed(...)}} to "freeze" time, so the test produces the same result no matter when it runs.

> Senior tip: for events that **already happened** (transactions, logs, audits), store {{Instant}} (in PostgreSQL: a {{timestamptz}} column) and only convert to the user's time zone for display. For **future** events in local time (a meeting at 9:00 next month), store {{LocalDateTime}} + the time zone ID ({{Asia/Ho_Chi_Minh}}), because the country may change its time rules before that date. Do not store a fixed offset (+07:00) instead of the time zone ID. Don't use {{Date}}/{{Calendar}} in new code: they are mutable and their time zone API is very easy to get wrong.

### Interview relevance
Interviewers ask: when to use Instant/LocalDateTime/ZonedDateTime, why not Date/Calendar, how to convert time zones, how to compute the value date with a bank cut-off, and how Duration differs from Period. The exercise below makes you compute the value date while skipping weekends and applying the 16:00 Vietnam cut-off.`,
    exercises: [
      {
        title: 'Compute the value date (skip weekends and cut-off)',
        prompt: `Write {{ValueDateCalculator.valueDate(Instant transactionTime)}} returning a {{LocalDate}} value date according to these rules:
- Convert the transaction to the {{Asia/Ho_Chi_Minh}} time zone (UTC+7).
- If the transaction is after 16:00 → move to the next day.
- If the resulting day falls on Saturday or Sunday, roll it forward to the next Monday.
- A transaction at exactly 16:00:00 still counts for the same day; only from 16:00:01 does it move to the next day.
- No need to handle public holidays.

Note: the parameter is an {{Instant}} (UTC time), so convert to Vietnam time before comparing. Example: {{2024-01-04T09:30:00Z}} is 16:30 on Thursday Vietnam time, i.e. already past the cut-off.`,
        hints: [
          'Convert the Instant to VN time with {{atZone(ZoneId.of("Asia/Ho_Chi_Minh"))}}.',
          'If the time is after 16:00 then {{d = d.plusDays(1)}}; after that, loop {{plusDays(1)}} while the day is still Saturday/Sunday.',
          'Exactly 16:00 is not past the cut-off: use {{time.isAfter(LocalTime.of(16, 0))}}. {{isAfter}} returns false when the two are equal, which is exactly what the rules want.',
        ],
        explain: `The order of the steps is the key point:
1. Convert the {{Instant}} to a {{ZonedDateTime}} in Vietnam time, and only then take the date ({{toLocalDate}}) and the time ({{toLocalTime}}). Taking the date before converting is wrong for every transaction from 17:00 UTC onwards (in Vietnam it is already the next day).
2. Apply the cut-off: if the time is after 16:00, add one day.
3. **Last**, roll past the weekend with a while loop (Saturday needs two days, Sunday one). If you rolled the weekend first and only then added the cut-off day, a Friday 17:00 transaction would come out as Saturday — wrong.

Every java.time class is immutable: {{d.plusDays(1)}} returns a new object instead of changing {{d}}, so you must assign it back ({{d = d.plusDays(1)}}). Forgetting the assignment is a very common bug: the code still compiles but the date never changes.

Other common mistakes: comparing UTC time instead of Vietnam time (the 09:30 UTC test fails); using {{!isBefore}} so that exactly 16:00 is pushed to the next day; using {{ZoneId.systemDefault()}} instead of the fixed time zone of the business rule, which breaks as soon as the server runs in UTC.`,
      },
    ],
    check: [
      {
        q: 'What does storing {{Instant}} in the DB actually store?',
        options: ['The time already converted to the user time zone', 'The UTC instant (seconds since the epoch)', 'A date string in the server time zone', 'Only the date, no time'],
        answer: 1,
        explain: '{{Instant}} is an absolute point in time (seconds + nanos counted from 1970-01-01T00:00Z) that does not depend on any time zone, so every server anywhere reads back the same instant. If you stored the time already converted to the user\'s or the server\'s zone, you would also need to know which zone that was to make sense of it, and switching server or user would silently corrupt it. Storing only the date loses the time and cannot be used for transactions.',
      },
      {
        q: 'How is {{ZonedDateTime}} different from {{LocalDateTime}}?',
        options: ['No difference', 'ZonedDateTime carries a time zone and uniquely identifies an instant; LocalDateTime has no time zone bound yet', 'LocalDateTime is more precise', 'ZonedDateTime cannot compute intervals'],
        answer: 1,
        explain: '{{LocalDateTime}} is only date + time "on the wall clock", with no time zone, so it does not pin down the real instant (09:00 in Hanoi and 09:00 in London are seven hours apart). {{ZonedDateTime}} adds the time zone, so it identifies one unique instant and also knows the daylight-saving rules: in a region with DST, some local times do not exist (when clocks spring forward) or happen twice (when they fall back). The two types are clearly different, so "no difference" is wrong; LocalDateTime is not more precise (both have nanosecond precision); and ZonedDateTime can compute intervals with {{Duration.between}}.',
      },
      {
        q: 'A year-end report prints the date 30/12/2024 as "30/12/2025". What is the most likely cause?',
        options: [
          'The server is set to the wrong time zone',
          'The format pattern uses {{YYYY}} (week-based year) instead of {{yyyy}}',
          '{{LocalDate}} adds one year while formatting',
          'The code uses {{Instant}} instead of {{LocalDate}}',
        ],
        answer: 1,
        explain: '{{YYYY}} is the week-based year: 30/12/2024 belongs to week 1 of 2025, so it prints 2025. This bug only shows on a few days at the end of December, which makes it easy to slip past tests. A wrong time zone only shifts things by a few hours (a day either side at most), never a whole year; LocalDate is immutable and formatting never adds anything; and an Instant cannot even be formatted with a year pattern unless a zone is attached (it throws an exception rather than printing the wrong year).',
      },
    ],
  },
});
