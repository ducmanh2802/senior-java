/*
 * English translation of js/data/lessons-security.js — task T1026. Format: js/core/i18n.js (content overlay).
 * ids: lesson-security-008
 */
App.i18n.content({
  'lesson-security-008': {
    title: 'SQL injection from the root: code and data share one channel, PreparedStatement separates them, and three spots you must guard yourself',
    goals: [
      'Explain why the DB cannot tell "value" apart from "command" when we concatenate strings, while a {{?}} placeholder can',
      'Use parameterized queries correctly in JDBC, {{JdbcTemplate}} and JPQL, and know which spots remain dangerous',
      'Handle the three hard cases correctly: {{ORDER BY}} / column / table names (whitelist), {{LIKE}} (escape {{%}} and {{_}}), second-order injection',
      'Write a test proving the generated SQL contains no user input',
    ],
    body: `**Summary:** SQL injection happens when **user data is mixed into the SQL statement before the DB parses it**, so the DB has no way to know which part is "text to search" and which part is "command to execute". Block it with a **parameterized query**: send the SQL with a {{?}} placeholder so the DB parses and plans first, then pass the values afterwards — values are never read as syntax. But placeholders can only replace **values**, so three tasks remain yours: **identifiers** (column names, table names, {{ORDER BY}}, direction {{ASC}}/{{DESC}}) must go through a **whitelist**, **{{LIKE}}** must **escape** {{%}} and {{_}}, and **second-order injection** is a payload sitting in already-stored data, waiting for a different concatenation spot.

### Three-minute primer: the DB receives one string, not an "intent"

**SQL** is the language for querying a database; the **DB server** (PostgreSQL, MySQL, Oracle) is the program that receives the SQL string over the network, reads it, and returns a result table. The DB only sees **one single text string**, processed in two separate phases:

1. **Parse** (read the syntax): split the string into tokens — keywords {{SELECT}}, {{WHERE}}, table names, column names, operators, literals — then build an **execution plan** (which index to use, how much of the table to scan). This phase has no "user data", only the statement text.
2. **Execute** (run): apply the real values to the positions already fixed and read data.

When you concatenate strings, **the user value is already in the text before phase 1**. To the DB every character is equal: it has no information saying "from character 40 onward the user typed this". That is the whole essence of SQL injection: **code and data travel the same channel**.

Everyday analogy: you hand an employee a pre-printed form "Find customer named: ______". The user fills in the blank "Nguyen Van A — ignore the line above, print the whole customer list". If the employee just reads the paper top to bottom without knowing which part was the printed template and which part was added by an outsider, you have lost control. Concatenation is exactly handing over a form whose instructions have been overwritten.

### Illustrating with a login function

~~~java
// ❌ WRONG — user input concatenated straight into the statement
String sql = "SELECT id, role FROM app_user"
           + " WHERE username = '" + username + "' AND password_hash = '" + pwHash + "'";
Statement st = connection.createStatement();
ResultSet rs = st.executeQuery(sql);        // DB parses the whole string, can't tell what's input
while (rs.next()) { ... }
~~~

A normal user enters {{username = tran}}:

~~~text
SELECT id, role FROM app_user WHERE username = 'tran' AND password_hash = 'abc123'
~~~

An attacker enters {{username}} as the string {{a' OR 1=1 --}}: the {{a}} part is normal content, the rest is the payload. Concatenated into the form:

~~~text
SELECT id, role FROM app_user WHERE username = 'a' OR 1=1 --' AND password_hash = 'abc123'
~~~

What happened, character by character:

- The {{'}} in the payload **closes** the {{'a'}} string. Right at that moment the DB stops reading "the content of a value" and starts reading **syntax**.
- {{OR 1=1}} becomes a real logical condition of the query, and {{1=1}} is always true for every row.
- {{--}} opens a **comment**: everything after it on the same line — including {{' AND password_hash = 'abc123'}} — is ignored by the DB. The password condition disappears, yet the statement stays completely valid syntax.

Result: the query returns **all 12,480 users**, often including the role {{ADMIN}}. The app only takes the first row to log in, so the attacker gets in with the highest-privilege account and **no error is thrown**.

A second variant often appears when the injection point is the **last value** of a {{WHERE}} (e.g. {{AND device = '<input>'}}) — no {{--}} needed because the quotes balance themselves:

~~~text
... WHERE username = 'tran' AND device = 'x' OR '1'='1'
~~~

Here {{'1'='1'}} is parsed as a comparison of two string literals, always true. Common to both styles: the user has **pushed a single quote out of the data region**, i.e. changed the statement structure.

Destructive payloads use {{;}} to split a second statement — that only runs when the API and driver allow multiple statements in one call ({{Statement.execute}} with MySQL/SQL Server; the PostgreSQL JDBC driver usually blocks it):

~~~text
username = x'); DROP TABLE app_user; --
-->  ... WHERE username = 'x'); DROP TABLE app_user; --' AND password_hash = '...'
~~~

What to remember: **stealing data only needs one valid {{SELECT}}**, no {{;}} and no multi-statement support from the driver — that is the form of attack most often encountered in practice.

Another angle on the consequence: if the screen only shows the first row, the developer still sees "everything normal", while the whole table has been read. The only signal is the number of returned rows, which nobody logs.

### What PreparedStatement does to block it

{{PreparedStatement}} is the JDBC object that lets you send a SQL statement with **gaps** (placeholders) separated from the values:

~~~java
// ✅ CORRECT — statement and values travel two separate paths
String sql = "SELECT id, role FROM app_user WHERE username = ? AND password_hash = ?";
try (PreparedStatement ps = connection.prepareStatement(sql)) {
    ps.setString(1, username);      // value, not syntax
    ps.setString(2, pwHash);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) { ... }       // malicious input -> 0 rows, not "bypass"
    }
}
~~~

On the wire the order changes completely:

~~~text
Concatenation: [ SELECT ... WHERE username = 'tran' OR '1'='1' AND ... ]  --> DB parse --> run
                                                     (value gets parsed as syntax)

Bind param  : [ SELECT ... WHERE username = ? AND password_hash = ? ]   --> DB parse + plan
              (afterwards) [ $1 = "tran' OR '1'='1", $2 = "abc123" ]         --> only stuffed into the data slot
~~~

Because {{?}} was fixed at parse time, the bound value can only land in the **data slot**. The DB handles quoting and escaping itself: the string {{tran' OR '1'='1}} is compared **verbatim** against the {{username}} column, no row has such a name, result is 0 rows. The {{'}} inside the value is no longer "closing the string"; it is just a character in the content.

Two misconceptions to drop:

- **"Using an ORM makes you immune."** Hibernate generates parameterized SQL for {{findById}}, {{@Query}} with {{:param}}, the Criteria API — that part is safe. But if you hand-concatenate in JPQL, in a native query, or pass a column name from the request, it is still SQL injection, because Hibernate parses the **final string**.
- **"PreparedStatement is slower so I must concatenate for speed."** The opposite: many drivers and DBs can reuse a prepared plan/statement (depending on driver, connection, configuration — e.g. the PostgreSQL JDBC driver's {{prepareThreshold}}). Even if you gained nothing, "I need to build the SQL dynamically" is never a reason to drop parameters.

### PreparedStatement does not save every spot — because placeholders replace only VALUES

This is the most important distinction interviewers wait for you to state: {{?}} may stand only where SQL syntax allows a **value**, not where an **identifier** (column name, table name) or **keyword** ({{ASC}}/{{DESC}}, operator name) is required.

| Position in the SQL statement | Bind {{?}}? | Correct handling |
|---|---|---|
| {{WHERE email = ?}}, {{BETWEEN ? AND ?}}, {{INSERT VALUES (?)}} | Yes | JDBC parameter / JPQL {{:param}} |
| {{ORDER BY ?}} | No (PostgreSQL/MySQL only accept a value in this position; binding a column name becomes a string and every row sorts by that string — no error but meaningless) | **Whitelist** the column, map API name → column name |
| sort direction {{ASC}}/{{DESC}} | No | Validate against {{Set.of("ASC","DESC")}}, default {{ASC}} |
| table name / schema name | No | Enum or whitelist map, never user input |
| {{LIMIT ?}} / {{OFFSET ?}} | Yes (PostgreSQL, MySQL; Oracle uses {{FETCH FIRST ? ROWS ONLY}}) | Bind {{int}}, add a ceiling |
| {{IN (?, ?, ?)}} list | Number of placeholders must be **dynamic** with list length | Generate exactly n {{?}}, bind n values |
| {{LIKE}} value | Yes, but {{%}}/{{_}} in the value are still wildcards | Escape + {{ESCAPE}} clause |

**Why not check "this string is safe" with regex and then concatenate?** Because {{[a-z_]+}} accepts {{password_hash}}. A superficial filter does not know the **semantics** of which column may be exposed; only an explicit mapping answers that. Industry standard: a **dictionary map** between the public API name and the internal column name.

~~~java
// whitelist for the ORDER BY part: API never feeds a column name directly
private static final Map<String, String> SORTABLE = Map.of(   // key is API name, value is the real column
    "time",   "created_at",
    "amount", "amount_minor",
    "id",     "id");
private static final Set<String> DIRS = Set.of("ASC", "DESC");

static String orderBy(String sortField, String dirRaw) {
    String column = SORTABLE.get(sortField == null ? "" : sortField.toLowerCase(Locale.ROOT));
    if (column == null) throw new IllegalArgumentException("sort field not allowed");  // 400, no guessing
    String dir = (dirRaw == null ? "ASC" : dirRaw).toUpperCase(Locale.ROOT);               // Locale.ROOT: case change independent of server locale
    if (!DIRS.contains(dir)) dir = "ASC";
    return " ORDER BY " + column + " " + dir;        // this string contains no raw input
}
~~~

### LIKE: what the user types is not a wildcard

{{LIKE}} matches a pattern, where {{%}} means "any number of characters" and {{_}} means "exactly one character". If you bind the raw user input into {{LIKE}}:

- input {{%}} matches **every row** — a search box becomes a tool to dump the whole table, forcing a full table scan (slow query, soft DoS).
- input {{100%}} (searching for product "100% cotton") is read as "starts with 100 then anything" — wrong results, no error.
- input {{ab_c}} is read as "ab" + any one char + "c".

Fix: **escape the special characters in the value**, then you yourself add {{%}} on both sides (because you are the one who decides the "contains substring" semantics):

~~~java
static String escapeLike(String raw) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < raw.length(); i++) {
        char c = raw.charAt(i);
        if (c == '\\\\' || c == '%' || c == '_') sb.append('\\\\');   // place escape char before the special char
        sb.append(c);
    }
    return sb.toString();
}

// Java string for the SQL: "... AND name LIKE ? ESCAPE '\\\\'" — two backslashes in Java source = one backslash in SQL
ps.setString(1, "%" + escapeLike(userQuery) + "%");
~~~

{{ESCAPE}} declares to the DB which character is the escape; state it explicitly instead of relying on the default, because defaults differ between DBs and configurations (MySQL has {{NO_BACKSLASH_ESCAPES}}, PostgreSQL backslash behavior depends on {{standard_conforming_strings}}). Escape **backslash first**, then {{%}}/{{_}}, otherwise you escape the escape character you just inserted.

If the product intentionally lets users write wildcards (advanced search), say so clearly in the UI and docs, and still escape backslash — mixing the two semantics is a very hard-to-trace bug source.

### Second-order injection: the payload sleeps in the database

Input is bound safely on **write**, so the payload is stored verbatim in the DB: a user's {{username}} is {{x' UNION SELECT ...}}. Three months later the reporting module writes:

~~~java
// ❌ still wrong, even though the data comes from a DB table, not a request
String sql = "SELECT * FROM audit_log WHERE username = '" + row.getUsername() + "'";
~~~

The DB cannot tell whether the string came from a request or from another table. Lesson: **the danger lies in the concatenation spot, not in where the data came from**. So there is no concept of "escape it once, store it, then it is safe" — only the rule "never concatenate at any layer". Similar case: dynamic configuration (column names, table names chosen by the user) stored in the DB and then spliced into a query.

### Five layers of defense (parameterization is only layer 2)

1. **Validate input**: type, length, format (email is email, number is number), block {{null byte}}. This layer **reduces attack surface**, it is not the anti-injection layer.
2. **Parameterize every value; whitelist every identifier.** Including dynamic table/column names, including SQL generated from metadata.
3. **Least privilege for the DB account**: the app user needs no {{DROP}}, {{GRANT}}, {{FILE}}, and is not the owner. Reports run as a read-only user. This layer limits **the damage** when layer 2 has a hole.
4. **Do not leak DB errors**: putting {{SQLException.getMessage()}} in the response hands the attacker a schema map. Log on the server, return a generic error code + request id.
5. **Test + audit**: a unit test asserts the generated SQL **does not contain** raw input and no single quote; an integration test runs classic payloads; static analysis (SpotBugs {{SQL_INJECTION_JDBC}}, Semgrep) scans string concatenation.

### Interview tie-in
Opening question: "Why is {{PreparedStatement}} safe?" — answer with the **two phases parse/execute and the position of the value**, not "because it escapes". Deep question: "What if I use {{ORDER BY}} on a column the user picks?" — answer with whitelist/map and why a placeholder cannot replace an identifier. Scenario question: "Which spots in your system still concatenate SQL?" — naming LIKE, {{IN}}, dynamic reports and second-order injection is enough to show real experience. Do the exercise below — writing your own {{QueryBuilder}} — and you have source code to cite for all three questions.`,
    exercises: [
      {
        title: 'Write a QueryBuilder: generate SQL with placeholders, whitelist columns and escape LIKE',
        prompt: `Complete {{QueryBuilder}} (JDK 17 only). Goal: callers must have **no way** to inject their input into the SQL text — values go through {{params()}}, identifiers must be in the whitelist.

**Constructor {{QueryBuilder(String table, Set<String> allowedColumns)}}**
- {{table}} must be a valid identifier: first char a letter or underscore, following chars digits/letters/underscore, max 30 chars. Invalid (including null) → throw {{IllegalArgumentException}}.
- {{allowedColumns}} is the column whitelist, each name also a valid identifier; null or empty → throw {{IllegalArgumentException}}. Store a **case-insensitive** comparison, but SQL always uses the column name exactly as declared in the whitelist (never the string the caller supplied).

**{{eq(column, value)}}** — adds {{column = ?}}; null {{value}} → throw {{IllegalArgumentException}} ({{col = NULL}} in SQL is never true; filtering null needs a separate predicate).
**{{in(column, values)}}** — adds {{column IN (?, ?, ...)}} with the number of {{?}} exactly {{values.size()}}; null or empty {{values}} → throw {{IllegalArgumentException}}. Every element is appended to {{params()}} in order.
**{{like(column, raw)}}** — adds the predicate {{column LIKE ? ESCAPE}} with the escape char being **one** backslash character (in Java source the literal is {{ESCAPE '\\\\'}}), and appends to {{params()}} the value {{"%" + escape(raw) + "%"}}; null {{raw}} → throw {{IllegalArgumentException}}. The escape function puts a backslash before each of {{\\}}, {{%}}, {{_}} — and must process backslash **before** the other two.
**{{orderBy(column, direction)}}** — {{column}} must be in the whitelist (otherwise throw {{IllegalArgumentException}}); null/empty {{direction}} → {{ASC}}, otherwise uppercase with {{Locale.ROOT}} and must be {{ASC}} or {{DESC}}, else throw {{IllegalArgumentException}}. Only one ORDER BY: calling again overwrites the previous one.
**{{sql()}}** — {{SELECT * FROM <table>}}, join predicates with {{ AND }} after {{ WHERE }} (if no predicate, omit {{ WHERE }} entirely), then append {{ ORDER BY <col> <DIR> }} if present. Must never contain a single character of the user value.
**{{params()}}** — list of values in the exact order the {{?}} appear in {{sql()}}.

Every method {{eq/in/like/orderBy}} returns {{this}} for chaining. Implementation hint: keep three things — {{List<String> predicates}}, {{List<Object> params}}, {{String orderByClause}}.`,
        hints: [
          'Validate the identifier with {{java.util.regex.Pattern}}: letter or underscore first, then digits/letters/underscore, max 30 chars; call {{matcher.matches()}}. Return the column name **as declared** in the whitelist, do not return the exact string the caller supplied.',
          'For IN, count placeholders with a for loop running {{values.size()}} times — never {{String.join}} the values into the statement.',
          'LIKE: for each input character, if it is backslash, percent or underscore, write an extra backslash first (process backslash first), then wrap the value with percent on both sides. The generated SQL clause is LIKE ? ESCAPE followed by a single quote containing exactly ONE backslash character — in Java source that needs two backslash characters inside double quotes.',
          '{{sql()}}: if {{predicates}} is empty, omit the whole WHERE clause; join predicates with {{ AND }} and put a space before {{WHERE}}.',
        ],
        explain: `Three design decisions worth saying in an interview:

- **Value and identifier travel two different paths.** {{eq/in/like}} only add a {{?}} and push the value into {{params}}; the SQL string therefore can never contain {{'}} or input content. The first test asserts exactly that by checking {{sql()}} contains neither "OR" nor a single quote — that kind of assertion is far stronger than "run it and see if it breaks".
- **{{resolve(column)}} returns the column name from the whitelist, not from input.** If it returned the caller's string unchanged (only case-folded), then {{orderBy("created_at; DROP TABLE x", ...)}} is already rejected because it is not in the whitelist, but the "validate then reuse input" style is the classic hole. Same logic as the {{ORDER BY}} part: the column name is **chosen** from a mapping, not **checked** then concatenated.
- **{{ORDER BY}} overwrites instead of appending**, because SQL has only one {{ORDER BY}}; if you {{+=}} twice the statement is invalid syntax and any API caller just needs to call twice to make the app 500.

Common mistakes: using {{String.format}} to "concatenate cleanly" and hand-escaping single quotes instead of using a placeholder (hand escaping fails on charset and on the backslash itself), forgetting the empty-list case, and letting a null {{value}} slip into {{eq}} producing a {{col = NULL}} condition that always returns empty. In Spring the real-world version of this exercise is {{NamedParameterJdbcTemplate}} plus a whitelist table for the sort part, or QueryDSL/jOOQ when dynamic queries are needed.`,
      },
    ],
    check: [
      {
        q: 'Why does {{PreparedStatement}} block SQL injection while {{Statement}} + concatenation does not?',
        options: [
          'Because PreparedStatement escapes single quotes for you and Statement does not',
          'Because the DB parses and plans the SQL with {{?}} **before** receiving the values, so values are placed only into the data slot and never read as syntax',
          'Because PreparedStatement runs faster so the attacker cannot inject in time',
          'Because Statement can only be used for INSERT/UPDATE',
        ],
        answer: 1,
        explain: 'The essence is **separating the parse and bind phases**. The "it escapes for you" explanation is common but misses the point: with some drivers the value is quoted on the client, but the reason it is safe is that the DB never parses the value into syntax. Speed relates to execution-plan caching, not safety; Statement works for every statement type.',
      },
      {
        q: 'A list endpoint receives {{?sort=}} as a column name chosen by the user. What is the correct handling?',
        options: [
          'Bind the column name into a placeholder: {{ORDER BY ?}} with the value as sort',
          'Validate sort with regex {{[a-z_]+}} then concatenate it into the SQL',
          'Map sort through a column-name whitelist (and validate ASC/DESC), reject anything else with 400',
          'Switching auto-increment ids to UUID removes the worry',
        ],
        answer: 2,
        explain: 'A placeholder can only replace a **value**, not an identifier — {{ORDER BY ?}} sorts every row by that string. Regex {{[a-z_]+}} still lets through every real column, including {{password_hash}}: a shape check cannot answer "which column may be exposed". Only an explicit mapping (combined with restricting direction to {{ASC}}/{{DESC}}) suffices; changing the id type has nothing to do with {{ORDER BY}}.',
      },
      {
        q: 'A search box runs {{WHERE description LIKE ?}} and binds the raw user input. What real risk exists?',
        options: [
          'It is only a UI glitch, no risk at all',
          'Input {{%}} matches every row and forces a full table scan: data leaks beyond the intended scope plus slow query / soft DoS; you must escape {{%}}, {{_}} and {{\\}} then add {{%}} on both sides yourself',
          'It causes SQL injection, so switch to {{Statement}}',
          'It corrupts the table unique index',
        ],
        answer: 1,
        explain: '{{%}} and {{_}} are wildcards **of LIKE**, not of SQL syntax, so a bound parameter does not neutralize them — this is a spot PreparedStatement does not handle for you. Input {{%}} turns a bounded query into the whole table (both information leak and resource cost). That is why {{ESCAPE}} and escaping backslash first are needed. This is not injection, so switching to {{Statement}} goes backwards; the index is used less efficiently, not corrupted.',
      },
    ],
  },
});
