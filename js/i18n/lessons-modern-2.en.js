/*
 * English translation of js/data/lessons-modern.js — task T268. Format: js/core/i18n.js (content overlay).
 * ids: lesson-modern-005
 */
App.i18n.content({
  'lesson-modern-005': {
    title: 'java.time: Instant, LocalDate, ZonedDateTime, time zones and bank cut-off',
    goals: [
      'Distinguish Instant, LocalDate, LocalDateTime, ZonedDateTime and know when to use each',
      'Convert between time zones with ZoneId and calculate by actual time zone',
      'Handle bank cut-off: skip weekends and compute the value date',
    ],
    body: `**Summary:** java.time replaces java.util.Date/Calendar with immutable classes, each serving a purpose: Instant (machine time), LocalDate/LocalDateTime (calendar without time zone), ZonedDateTime (calendar + time zone). Convert between them via ZoneId; handling bank cut-off requires converting to Vietnam time and computing the business day.

### Instant, LocalDate, ZonedDateTime
- {{Instant}}: a point on the UTC timeline (seconds/nanos since epoch), **no time zone**. Use for storing in DB, logging, measuring intervals.
- {{LocalDate}}: a date (year-month-day) with no time and no time zone. Use for birthdays, value dates.
- {{LocalDateTime}}: date + time, **not assigned a time zone**. Do not use to determine a real-world instant because of time zone differences.
- {{ZonedDateTime}}: date + time + time zone, uniquely identifies an instant.
- {{ZoneId}}: a time zone ({{Asia/Ho_Chi_Minh}} = UTC+7, Vietnam has no daylight saving).
- {{Duration}}: time-based amount of time (seconds/nanos). {{Period}}: date-based amount of time (days/months/years).

~~~java
Instant now = Instant.now();                                       // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));      // convert to VN
LocalDate today = vn.toLocalDate();                                // date in VN
~~~

### DateTime formatter
~~~java
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
String s = vn.format(fmt);
ZonedDateTime parsed = ZonedDateTime.parse(s, fmt.withZone(ZoneId.of("Asia/Ho_Chi_Minh")));
~~~

### Bank cut-off
A transaction made after 16:00 Vietnam time moves to the next business day; skip Saturday and Sunday. Always convert to the transaction time zone before comparing against the cut-off — do not compare UTC hours directly.

### Notes on parsing and formatting
{{DateTimeFormatter}} parses/normalizes by pattern; if input does not match the pattern it throws {{DateTimeParseException}}. Always specify the time zone when parsing {{ZonedDateTime}} — do not rely on the JVM's default time zone (it may differ between dev and production).

> Senior tip: store {{Instant}} in the DB and only convert to the user's time zone for display. Do not use {{Date}}/{{Calendar}} (mutable and hard to manage with time zones). Store the time zone ID ({{Asia/Ho_Chi_Minh}}), not a fixed offset (+07) because rules can change.

### Interview relevance
Interviewers ask: when to use Instant/LocalDateTime/ZonedDateTime, why not Date/Calendar, how to convert time zones, how to compute the value date with bank cut-off, and how Duration differs from Period. The exercise below makes you compute the value date skipping weekends and applying the 16:00 Vietnam cut-off.`,
    exercises: [
      {
        title: 'Compute the value date (skip weekends and cut-off)',
        prompt: `Write {{ValueDateCalculator.valueDate(Instant transactionTime)}} returning a {{LocalDate}} value date according to these rules:
- Convert the transaction to time zone {{Asia/Ho_Chi_Minh}} (UTC+7).
- If the transaction is after 16:00 → move to the next day.
- Skip Saturday and Sunday (roll to the next Monday).
A transaction at exactly 16:00 counts for the same day.`,
        hints: [
          'Convert Instant to VN time with {{atZone(ZoneId.of("Asia/Ho_Chi_Minh"))}}.',
          'If the time is after 16:00 then {{d = d.plusDays(1)}}; then loop {{plusDays(1)}} while it is Saturday or Sunday.',
          'Exactly 16:00 is not after cut-off (use {{isAfter}}, not the inverse).',
        ],
        explain: `Convert {{Instant}} to {{ZonedDateTime}} in VN time zone before getting the date and comparing against the cut-off. If the transaction is after 16:00, the value date becomes the next day; then skip weekends with a {{while}} loop. All java.time classes are immutable and thread-safe. Note: cut-off at 16:00 means a transaction at exactly 16:00 is processed today, after 16:00 moves to the next day.

Common mistakes: comparing UTC hours instead of VN hours (causes wrong dates since VN is UTC+7); forgetting to skip weekends after pushing the date due to cut-off; using {{Date}}/{{Calendar}} which are mutable and hard to manage with time zones.`,
      },
    ],
    check: [
      {
        q: 'What does storing {{Instant}} in the DB actually store?',
        options: ['The time converted to the user time zone', 'The UTC instant (seconds since epoch)', 'A date string in the server time zone', 'Only the date, no time'],
        answer: 1,
        explain: '{{Instant}} is a point on the UTC timeline with no time zone, so it is suitable for DB storage. Convert to the user time zone only for display.',
      },
      {
        q: 'How is {{ZonedDateTime}} different from {{LocalDateTime}}?',
        options: ['No difference', 'ZonedDateTime has a time zone and uniquely identifies an instant; LocalDateTime has no time zone assigned', 'LocalDateTime is more precise', 'ZonedDateTime cannot compute intervals'],
        answer: 1,
        explain: '{{LocalDateTime}} is just date+time "on the wall clock" with no time zone (ambiguous, e.g. during DST changes). {{ZonedDateTime}} adds a time zone and uniquely identifies a real instant.',
      },
    ],
  },
});
