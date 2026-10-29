/*
 * English translation of js/data/lessons-spring.js — task T505 (re-translated after the Vietnamese source changed).
 * Format: js/core/i18n.js (content overlay).
 * ids: lesson-spring-006 lesson-spring-007
 */
App.i18n.content({
  'lesson-spring-006': {
    title: 'Flyway-style Migration Runner: Versioned, Repeatable and Checksum',
    goals: [
      'Describe how Flyway tracks applied migrations',
      'Distinguish versioned and repeatable migrations',
      'Write a runner that validates checksum, order, and out-of-order handling'
    ],
    body: `**Summary:** Flyway records applied migrations in a schema history table, then applies versioned files in increasing version order and repeatable files when their checksum changes. The runner written in this exercise simulates this mechanism: each migration has a name, checksum, and application timestamp; a checksum mismatch with the recorded version causes the runner to reject, preventing stealth edits to already-run files.

### Versioned and Repeatable Migrations
Flyway distinguishes two groups. Versioned migrations have names like {{V1__create_user.sql}}, {{V2__add_email.sql}}: each version is applied exactly once, in ascending version order. Repeatable migrations have names like {{R__refresh_view.sql}}: they carry no version number and are re-run whenever their checksum changes. Repeatables are typically used for views, stored procedures, or reference data that can be regenerated. Classification is based on the filename prefix: {{V}} followed by a number and two underscores; {{R__}} for repeatables.

### Checksum and Schema History
The history table stores version, checksum, success status, and timestamp. Checksum protects against a developer editing a migration file after it has run on production: if the current checksum differs from the recorded one, the runner throws an {{IllegalStateException}} with a checksum mismatch message. This is an intentional error forcing the person to create a new migration instead of modifying the old one. Each history entry is an immutable proof of the schema state at a point in time.

| Field | Meaning | Note |
|---|---|---|
| version | Version number, 0 for repeatable | Used to sort versioned |
| name | Migration filename | Identifies repeatable |
| checksum | Content fingerprint | Detects stealth edits |
| success | Migration completed | Used for safe retry |
| ts | Application timestamp | Clock injected for tests |

### Order, Gaps, and Out-of-Order
Versioned migrations must run in ascending version order. When a migration with a version smaller than the largest already-applied version appears later, Flyway rejects it by default as out of order. The {{allowOutOfOrder}} flag allows exceptional cases, e.g., adding a missed migration from the past. Using this flag requires clear justification and controlled change. A migration already applied with the same checksum is skipped on subsequent runs, making the runner idempotent.

### Idempotency and Production
The clock is injected to record deterministic timestamps in tests; production uses a reliable clock. Migrations should be short, transactional when the DB supports it, and avoid logic depending on uncontrolled data. With multiple instances running concurrently, a lock on the migration table is needed to prevent two pods from applying the same version. If a migration fails mid-way, a history entry with success=false helps the next run know the state and retry at the right spot.

### Interview Relevance
Explain why editing an already-run migration is wrong, how Flyway detects it, and when out-of-order is allowed. Describe handling of a mid-way migration failure and recovery. Finally, distinguish schema migrations from seed data and reference data.

> Senior tip: A migration is hard to rollback on production. Treat every migration file as an immutable commit; add a new migration to change things, and always have a forward-fix plan instead of a manual downgrade.`,
    exercises: [{
      title: 'Migration Runner with Checksum and Out-of-Order',
      prompt: `Implement {{MigrationRunner}} simulating Flyway with this API:
- {{Migration(name, checksum)}}: name like {{V1__a.sql}} or {{R__sp.sql}}.
- {{MigrationRunner(List<Migration> migrations, Clock clock)}} and overload with {{allowOutOfOrder}} flag.
- {{void applyAll()}} applies migrations, recording into {{schemaHistory}}.
- {{List<HistoryEntry> schemaHistory}} each entry has {{version}}, {{name}}, {{checksum}}, {{success}}, {{ts}}.

Rules: versioned run in ascending version order; same version with different checksum throws {{IllegalStateException("checksum mismatch ...")}}; repeatable only re-runs when checksum differs from last run; if out-of-order is not allowed, a migration with version smaller than max applied throws {{IllegalStateException("out of order ...")}}; empty list does nothing.`,
      hints: [
        'Use regex {{^V(\\\\d+)__}} to extract version number; names starting with {{R__}} are repeatable.',
        'Scan {{schemaHistory}} from the end to find an existing entry with the same version or name.',
        'Check checksum before deciding to skip; max applied version used for out-of-order rule.',
        'Repeatable has no version; only compare checksum with previous run of the same name.'
      ],
      explain: `The runner simulates Flyway at a minimal level while preserving key invariants. Versioned migrations are sorted before application, so the order of calls to applyAll does not depend on the list order. Checksum mismatch is detected by finding the history entry with the same version; if it differs, the runner rejects immediately and does not record a bogus entry. Repeatables use the name as key and only run when the checksum differs, so calling applyAll multiple times produces no side effects. Out-of-order is controlled by the max applied version and the allowOutOfOrder flag. The injected clock makes timestamps deterministic in tests; production should use a reliable clock and lock the migration table when running multiple instances.`
    }],
    check: [
      { q: 'Why should you not edit a migration file already applied to production?', options: ['Because the checksum will differ and the runner rejects it to prevent stealth edits', 'Because Java cannot compile SQL files', 'Because migrations only run once per JVM', 'Because Flyway automatically deletes the history table'], answer: 0, explain: `The current file checksum is compared against the history record. If they differ, the old migration that ran on the DB no longer matches the file, so the runner errors out to force creating a new migration.` },
      { q: 'When should the out-of-order flag be enabled?', options: ['When adding a missed migration with a version smaller than the max already applied', 'In all cases to keep it simple', 'When checksum changes', 'When running in dev environment'], answer: 0, explain: `Out-of-order allows applying a migration with a version smaller than the max applied in special cases like adding a missed migration. Enabling it by default would obscure ordering and make auditing harder.` },
      { q: 'When does a repeatable migration re-run?', options: ['When its checksum differs from the last run', 'Every time applyAll is called', 'When version increases', 'When the history table is empty'], answer: 0, explain: `Repeatable has no version; checksum is the sole criterion. If the checksum stays the same, the runner skips it to avoid re-running a view or procedure unnecessarily.` }
    ]
  },
  'lesson-spring-007': {
    title: 'Jackson-style JSON Mapper: Reflection, Annotations, and Strict Mode Against Silent Field Loss',
    goals: [
      'Use reflection to serialize objects guided by annotations',
      'Understand visibility rules: why a private field without getter or annotation is silently dropped',
      'Implement a strict mode to detect dropped fields, and know the corresponding real Jackson flags'
    ],
    body: `**Summary:** Jackson uses reflection to find an object's "properties" (public fields, public getters, or items with {{@JsonProperty}}) and annotations to decide JSON field names. A private field with no getter and no annotation is **silently ignored** — the JSON lacks the data with no error. This lesson builds a small mapper to understand the mechanism, plus a strict mode that turns silent drops into exceptions.

### Reflection and Runtime Annotations
Annotations are only readable at runtime via reflection if declared with {{@Retention(RetentionPolicy.RUNTIME)}} (default is {{CLASS}}: present in .class but invisible to reflection). {{@Target(ElementType.FIELD)}} only restricts where the annotation may be placed. The mapper iterates {{getDeclaredFields()}}, reads {{@JsonProperty}} and {{@JsonIgnore}}, then calls {{setAccessible(true)}} to read even non-public fields.

Note: The Javadoc of {{getDeclaredFields()}} explicitly states the returned array has **no guaranteed order**. On HotSpot it happens to follow declaration order (the exercise relies on this), but production code needing fixed order must sort explicitly — Jackson provides {{@JsonPropertyOrder}} for this.

### How Real Jackson Decides Properties
With the default {{ObjectMapper}} visibility:

| Component | Becomes a property when |
|---|---|
| Field | is **public**, or has {{@JsonProperty}} |
| Getter {{getX()}} / {{isX()}} | is **public** |
| Any | has {{@JsonIgnore}} → excluded |

Example: {{private String nick;}} **with** {{public String getNick()}} → still serialized via getter. But {{private String nick;}} with no getter and no annotation → vanishes from JSON silently. This is a common bug when using Lombok but forgetting {{@Getter}}, or when renaming a getter.

### Mapper Rules in This Exercise
Simplified: only fields are considered. A field with {{@JsonProperty("name")}} uses that name. No annotation but field is public → uses field name. No annotation and field is not public → silently ignored (like Jackson without a getter). {{@JsonIgnore}} always wins: safely skips sensitive data like SSN or passwords.

### Strict Mode
Jackson does **not** have a flag named "FAIL_ON_MISSING". The closest flags:
- {{DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES}} (enabled by default): throws when **reading** JSON with unknown fields — Spring Boot disables this by default.
- {{SerializationFeature.FAIL_ON_EMPTY_BEANS}} (enabled by default): throws when **writing** an object with zero properties, instead of returning an empty JSON object.

The strict mode in this exercise is a custom check: it does not change output when all fields are valid, but throws an exception when encountering a non-public field without annotation — forcing the developer to decide explicitly: add {{@JsonProperty}} or {{@JsonIgnore}}.

### Values and Empty Objects
Strings must escape double quotes, backslashes, and control characters (newline, tab). Numbers and booleans are written directly. Null becomes null. Nested objects serialize recursively, but circular references (A points to B, B points to A) must be guarded — Jackson uses {{@JsonManagedReference}}/{{@JsonBackReference}} or {{@JsonIdentityInfo}}. This mapper returns an empty JSON object (open/close braces) for an object with no valid fields (different from Jackson's default mentioned above).

### Production Pitfalls
- Silent field drop: API returns missing data, client shows blank, no error log.
- Reflection cost: cache metadata per class (Jackson caches serializer per class).
- {{setAccessible(true)}} blocked by module system (Java 16+ closes JDK internal packages by default) for classes in modules that don't {{opens}} the package to the mapper.
- Building JSON by string concatenation without escaping: user data with double quotes breaks JSON or injects extra fields (JSON injection).

### Interview Relevance
Describe how Jackson finds properties (public field, public getter, annotation), why silent drop is dangerous, and how to guard: JSON snapshot tests, watch Lombok/getters, flags {{FAIL_ON_UNKNOWN_PROPERTIES}} / {{FAIL_ON_EMPTY_BEANS}}. Explain trade-offs between reflection (flexible, slow at startup) and compile-time code generation (fast, less "magic").

> Senior tip: In an API contract, a missing field is often more severe than an extra field. Have JSON snapshot tests and enable strict validation in dev/test to catch regressions early.`,
    exercises: [{
      title: 'SimpleJsonMapper with @JsonProperty and Strict Mode',
      prompt: `Implement {{SimpleJsonMapper}} using reflection and custom annotations:
- {{@JsonProperty("name")}} sets the JSON name.
- {{@JsonIgnore}} always excludes.
- A non-public field without {{@JsonProperty}} is silently ignored in lenient mode; calling {{strict(true)}} makes the mapper throw {{IllegalStateException}} on such fields.
- {{String toJson(Object value)}} serializes an object to JSON.

Sample objects: class {{User}} with fields {{long id}}, {{@JsonProperty("full_name") String name}}, {{@JsonIgnore String ssn}}, and {{String nick}}. In lenient mode only {{full_name}} appears; in strict mode it throws because of {{id}} and {{nick}}.`,
      hints: [
        'Use {{getDeclaredFields()}} and {{getAnnotation(...)}} to read runtime metadata.',
        'Check {{JsonIgnore}} before {{JsonProperty}}.',
        'A public field without annotation is still included using the field name.',
        'Strict only validates before appending; it does not change output of valid objects.'
      ],
      explain: `The mapper simulates Jackson's core idea: annotation decides the name, reflection reads the value, and a custom strict mode (Jackson has no such flag) detects dropped fields. In lenient mode, non-public unannotated fields are silently ignored, so User output is just {{full_name}}. In strict mode, the mapper throws immediately on {{id}} or {{nick}}, helping tests catch regressions. {{JsonIgnore}} always wins to avoid serializing sensitive data. Proper escaping is mandatory to prevent JSON injection. In production, cache metadata per class and consider code generation to reduce reflection overhead.`
    }],
    check: [
      { q: 'Why is the {{long id;}} field in User ignored in lenient mode?', options: ['Because it is not public and has no @JsonProperty', 'Because long cannot be serialized', 'Because @JsonIgnore applies to the whole class', 'Because the mapper only reads getters'], answer: 0, explain: `The mapper only includes public fields or those with @JsonProperty; id is package-private and unannotated, so it is silently dropped — exactly the bug strict mode exists to catch. Long serializes fine (as a number). @JsonIgnore is only on ssn, not the whole class. The exercise mapper does not read getters; and User has none.` },
      { q: 'What does strict mode change?', options: ['Turns dropped fields into exceptions; valid output unchanged', 'Auto-generates getters', 'Ignores @JsonIgnore', 'Sorts fields by name'], answer: 0, explain: `Strict does not alter JSON of valid objects; it only validates and throws when encountering a non-public field without annotation. It does not generate code or getters. @JsonIgnore is still honored (ignored fields do not trigger strict errors). Field order remains declaration order.` },
      { q: 'With Jackson\'s default ObjectMapper, a class has {{private String nick;}} and {{public String getNick()}}. Does nick appear when serialized?', options: ['Yes, because the public getter is recognized as a property', 'No, because private fields are always ignored', 'Only if @JsonProperty is added to the field', 'Only if FAIL_ON_EMPTY_BEANS is enabled'], answer: 0, explain: `Jackson discovers properties from public fields, public getters, and annotations; getNick() is public so nick is serialized via the getter even though the field is private. "Private fields are always ignored" is wrong because ignoring a field does not mean ignoring the property — the getter still exposes it. @JsonProperty is another way to expose the field, not required here. FAIL_ON_EMPTY_BEANS only decides whether to throw when an object has zero properties.` }
    ]
  }
});
