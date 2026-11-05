/*
 * English translation of js/data/lessons-autotest.js — task T771. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-015
 */
App.i18n.content({
  'lesson-autotest-015': {
    title: 'JSON Schema checks in API tests: type, required, enum, minimum, items, and contract drift',
    goals: [
      'Explain what a JSON Schema is and read a schema that has type, properties, required, items, enum, minimum',
      'Write an assertion that checks an API response against a schema in REST Assured and understand an error path like $.items[1].price',
      'Tell breaking and non-breaking changes apart in the JSON contract between FE and BE',
      'Know when schema validation is enough and when you need real contract testing (Pact, OpenAPI)',
      'Pick the right strictness for a schema so the test does not turn into a maintenance burden',
    ],
    body: `**Summary:** Modern APIs exchange **JSON** — structured text made of objects ({{"key": value}}), arrays ({{[1, 2]}}), strings, numbers, booleans, and null. **JSON Schema** is a JSON document that **describes another JSON document**: it says "this object must have an {{id}} field of type string, {{total}} is a non-negative number, and {{status}} may only take the three values {{new}}/{{paid}}/{{cancelled}}". Using that schema to check an API response inside a test gives you an **enforceable contract**: FE and BE no longer have to guess each other's data shape. **Contract drift** is the name of the accident it prevents: BE turns {{total}} from a number into the string "199.000" so it displays nicely, and the schema test goes red right in the PR — instead of the app crashing on a user's phone at 8pm.

### An everyday example
A delivery form has two parts: the **content** (customer name, order code, amount) and the **mandatory boxes** (a signature, a "goods intact" checkbox). A courier may fill anything they like and it is still a form, but the company cannot process it. A JSON Schema is the **pre-printed form**: which box is mandatory, which box only accepts a number, which box only accepts one of three ticks. The validator is the clerk who checks the form and can say "row 2, the amount column, that is wrong" — not "something about this form feels off".

### What a schema looks like
~~~json
{
  "type": "object",
  "required": ["id", "total", "status"],
  "properties": {
    "id":     { "type": "string" },
    "total":  { "type": "number", "minimum": 0 },
    "qty":    { "type": "integer", "minimum": 1 },
    "status": { "type": "string", "enum": ["new", "paid", "cancelled"] },
    "note":   { "type": ["string", "null"] },
    "tags":   { "type": "array", "items": { "type": "string" } },
    "items":  { "type": "array", "items": {
        "type": "object",
        "required": ["sku", "price"],
        "properties": { "sku": { "type": "string" }, "price": { "type": "number", "minimum": 0 } }
    } }
  }
}
~~~

Six keywords cover almost every need, and five of them are exactly what you will implement yourself in the exercise:

| Keyword | What it states | Typical violation |
|---|---|---|
| {{type}} | the type of the node: {{object}}, {{array}}, {{string}}, {{number}}, {{integer}}, {{boolean}}, {{null}} | {{total}} becomes the string "199000" |
| {{required}} | an array of field names that **must be present** in the object | BE forgot to return {{status}} after refactoring the mapper |
| {{properties}} | a sub-schema per field, recursing downward | a new field appears with a type nobody checks |
| {{items}} | one schema applied to **every** element of the array | one row in the list is missing {{price}} |
| {{enum}} | the set of allowed values | BE added {{refunded}}, FE has no branch to handle it |
| {{minimum}} | the lower bound for a number (similarly: {{maximum}}, {{minLength}}, {{pattern}}) | {{qty = 0}} slipped into the payment flow |

{{integer}} is a **subset** of {{number}}: {{2}} is valid for both, {{2.5}} is valid only for {{number}}. That detail reddens more tests than you would think, because JSON itself does not distinguish integers from real numbers — the parser is what decides.

### Why an error must carry a **path**
A response with a list of 50 elements, and the error is in one row. "Response does not match the schema" is useless; "{{$.items[1].price: type number}}" points exactly at the line that must be fixed, and that notation is **JSONPath**: {{$}} is the root node, {{.name}} is a field of an object, {{[i]}} is element i of an array (0-based). When you write a validator yourself, the very first thing is to carry the path downward: call {{check(schema, value, path)}}, start path at {{$}}, go down a field with {{path + "." + name}}, go down an array with {{path + "[" + i + "]"}}.

### In a real API test: REST Assured
~~~java
// Add the dependency io.rest-assured:json-schema-validator
 given()
    .header("Authorization", "Bearer " + token)
 .when()
    .get("/api/orders/{id}", orderId)
 .then()
    .statusCode(200)
    .body(matchesJsonSchemaInClasspath("schemas/order.schema.json"))   // check the whole body against the schema
    .body("$.items.size()", greaterThan(0));                            // a schema never says a list may not be empty
~~~

{{matchesJsonSchemaInClasspath}} reads the schema file from the **classpath** (where you put resources next to the test module), so the schema is an ordinary **.json file**: it is reviewed in a PR, reused by many tests, and it reports errors with a path per node. To tighten things further, remember that a schema does **not** say whether a list may be empty — those are two different kinds of assertion, and the "blank page because of an empty array" bug sits exactly on that seam.

### Contract drift: which changes are breaking
| What BE does | Breaking? | How to catch it |
|---|---|---|
| Add a new field, not mandatory | no | the old FE keeps working |
| Rename a field, change a type, drop a field | **yes** | schema + a rendering test on the FE side |
| Move a field into {{required}} | **yes**, for existing clients | validate the sample response of each client |
| Add a new value to an enum | **maybe**: an FE that does not know it renders blank | {{enum}} + one test case for an "unknown value" |
| Allow {{null}} more often ({{note}} becomes null) | **yes**, if FE adds/subtracts it directly | {{type: ["string","null"]}} + a null-safe assertion |
| Change the money unit (VND -> cents) | **yes**, and a schema cannot catch it | you need a business assertion, not just a schema |

The lesson: a schema catches the **shape**, not the **meaning**. Changing {{total}} from "VND" to "cents" is still a {{number}} — CI is green, the customer is charged 100 times more.

### How schema validation differs from contract testing
~~~seq
title: Three ways to keep the JSON contract between FE and BE
actors: Schema | API test | Pact | CI
Schema -> CI: schema file lives in the repo, changed through a PR
API test -> CI: call the real endpoint then check the shape
Pact -> CI: client declares expectations, server proves it matches
CI --> Schema: print an error path like items[1].price
note Pact..API test: a schema checks real responses, Pact also checks the cases the client designed
~~~

- **Schema validation inside a test** (this lesson): you keep the schema file and check real responses against it. Cheap, added immediately, but the schema is **written by QA** — if QA writes it from memory, you are only testing your own memory.
- **OpenAPI + a validator**: the schema is generated from the **actual API description** (BE's Swagger/OpenAPI), so nobody has to remember anything; it can also block a bad request before it reaches the server (Prism, {{openapi-validator}}).
- **Pact (consumer-driven contract testing)**: the side that **uses** the data declares what it needs, and the side that **provides** it must prove it satisfies that declaration in its own CI. Heavier, fits microservices with many teams, and catches cases where no real response ever goes through.
- **Fuzzing from a schema** (Schemathesis): generate thousands of payloads from OpenAPI to find server bugs. Fits public APIs.

### Four mistakes you will actually meet
- **Generating the schema from one single sample response.** The tool turns every existing field into {{required}} and every string into an {{enum}} of itself -> the test reddens as soon as {{note}} = null, and the whole team learns to ignore the test.
- **Checking only 200 responses.** The error envelope ({{code}}, {{message}}, {{traceId}}) is part of the contract too; FE reads {{error.message}} and BE renames it to {{detail}}, so the UI shows an empty space.
- **{{required}} on every field.** A field that is "never null **today**" becomes a bomb when BE adds a guest-checkout mode. Make required only the fields whose absence actually breaks the UI.
- **Forgetting empty lists and pagination.** {{items}} matches the schema but a list of 0 elements still PASSES, while the real bug is "an empty page with no message".
- **Not versioning the schema.** The v2 API test runs against the v1 schema: three days of red before anyone notices FE renamed a field last week.

### Interview connections
- "How do you make sure FE and BE speak the same JSON?" -> the schema lives in the repo, validated in the API test; if the org has OpenAPI, validate from OpenAPI; with many teams, add Pact and the cost trade-off it brings.
- "Can a schema replace business tests?" -> no; give the money-unit example or a new {{status}} value the UI does not handle yet.
- "Where do schema tests run, and how many?" -> API tests on every commit for core endpoints (orders, payment, catalog), not for every endpoint; a few critical schemas per main screen.
- "Tell me about a bug a schema caught." -> prepare a sentence with a path: "{{$.data.orders[3].total}} changed from number to string after a serialization refactor, caught in the PR; had it shipped, the iOS app would crash on a cast".

> Senior tip: write schemas at **two levels**. The strict one ({{required}} + {{type}} + {{enum}}) applied to a **fixed request with fixture data**, so it works as a unit test of the contract; the loose one (only the {{type}} of the few fields the UI actually reads) applied to a regression suite running against real environment data. With only the loose level you never notice a new field; with only the strict level on real data you live with red. And always commit the schema file **in the same PR** that changes the API: reading the diff of a .json file is the fastest way to see someone about to break the contract.`,
    exercises: [
      {
        title: 'SchemaValidator: implement a JSON Schema checker yourself (type, required, properties, items, enum, minimum) over Map/List, with JSONPath error locations',
        prompt: `Write {{SchemaValidator}} — a schema checker for JSON that has already been parsed into Java structures. No file reading, no network, no JSON library, no reading of real time.

**Representing JSON with Java types**: object = {{Map<String, Object>}}, array = {{List}}, string = {{String}}, integer = {{Integer}} or {{Long}}, real number = {{Double}} or {{Float}}, boolean = {{Boolean}}, missing/null = {{null}}.

**Signature**: {{static List<String> validate(Map<String, Object> schema, Object value)}} — returns the **list of error strings**, empty when the data is valid.

**The schema itself is also a {{Map}}** with the keywords below; a keyword is checked only when it is **present**, unknown keywords are ignored:
- {{"type"}} — a string, matched according to this table:
  - {{object}} is satisfied by {{Map}}; {{array}} by {{List}}; {{string}} by {{String}}; {{boolean}} by {{Boolean}}; {{null}} is satisfied only by the value {{null}}.
  - {{integer}} is satisfied by {{Integer}} or {{Long}} ({{Boolean}} is **not** a number).
  - {{number}} is satisfied by {{Integer}}, {{Long}}, {{Double}}, {{Float}}.
  - any other {{type}} value (e.g. {{"date-time"}}): ignore it, report no error.
- {{"required"}} — a {{List}} of field names; a missing **key** in the object is an error. A key that is present but whose value is {{null}} **still counts as present** (null is {{type}}'s business).
- {{"properties"}} — a {{Map}} of field name -> that field's schema. Check only fields **present in the data**; extra fields in the data are ignored (the object stays open).
- {{"items"}} — a {{Map}}, applied to **every** element of the array.
- {{"enum"}} — a {{List}} of allowed values, compared with {{equals}}; it must **not throw** when the value handed in is {{null}}.
- {{"minimum"}} — a {{Number}}, applied only when the value itself is also a {{Number}} (compared as real numbers). A value **equal to** {{minimum}} is valid.

**Error string format** — must be exact to the character, because the grader compares strings:
- Wrong type: {{path + ": type " + schemaTypeName}}, for example {{$.total: type number}}, and at the root {{$: type string}}.
- Missing mandatory field: {{$.id: required}}.
- Value outside the enum: {{$.status: enum}}.
- Below the minimum: {{$.total: minimum 20}} — the {{20}} is {{String.valueOf(minimumValue)}} from the schema, no rounding, no type conversion.

**The path (JSONPath)**: the root is {{$}}; an object field is appended with {{.}} + name ({{$.total}}); an array element is appended with {{[i]}} ({{$.tags[1]}}, and nested as {{$.items[1].price}}).

**Three core rules**: (1) a node with a **wrong type** according to {{type}} gets exactly **one** error reported and then **stops** — do not check {{enum}}/{{minimum}}, do not descend into its {{properties}}/{{items}}; (2) a {{null}} or empty {{schema}} counts as no constraint; (3) the returned list must be **sorted ascending as strings** ({{Collections.sort}}) so the result does not depend on map iteration order.

Example:

~~~text
schema = { type: object, required: [id, total],
           properties: { id: {type: string},
                         total: {type: number, minimum: 20},
                         status: {type: string, enum: [new, paid]},
                         items: {type: array, items: {type: object, required: [price],
                                                      properties: {price: {type: number}}}} } }

data = { total: "25", status: "refunded", items: [ {price: 10}, {price: "3"} ] }

result, after sorting: [
  "$.items[1].price: type number",
  "$.status: enum",
  "$.total: type number"
]
~~~

Notice {{total: "25"}}: it is a **string**, not a number, so there is only the {{type number}} error and **no** {{minimum}} error — rule (1) forces you to stop there. That is exactly the situation where BE turns {{total}} into a formatted string for display: the field still exists, so the assertion "the response has a {{total}} field" stays green; only a schema catches it.`,
        hints: [
          'Recurse with the shape {{check(schema, value, path, out)}}: path starts as {{"$"}}; going down a field uses {{path + "." + name}}, going down an array element uses {{path + "[" + i + "]"}}. If you pass the path from the beginning, reporting an error is only string concatenation instead of rebuilding the path.',
          'The type-check branch at the **top of the method** is the implementation of the "wrong type means stop" rule: add the error and call {{return}} immediately. Forgetting {{return}} is the most common mistake: the node is a string and you still descend into {{properties}} and report a few nonsense errors.',
          'Write {{typeMatches(String type, Object v)}} returning {{boolean}} as its own method, one {{if}} line per {{type}}. {{integer}} does not accept {{Double}}; {{number}} accepts the four numeric classes but not {{Boolean}}; for an unknown {{type}} just {{return true}}.',
          '{{required}}: check {{obj.containsKey(key)}}, do **not** check {{obj.get(key) != null}} — a key present with a {{null}} value is not a missing field. Conversely, the {{enum}} check needs your own loop: {{List.of("a").contains(null)}} throws NullPointerException.',
          '{{minimum}}: compare with {{((Number) value).doubleValue()}}, which lets {{Integer}} be compared with {{Double}} without knowing the class, and applies only when **both** sides are {{Number}} — otherwise the string "25" would be compared as 25 and would hide the type error.',
          'In {{validate}}, call {{Collections.sort(errors)}} before returning. The tests compare lists with {{equals}}, so the order must be your decision, not the way the caller {{LinkedHashMap}} or {{Map.of}} happens to iterate.',
          'Take the schema in the recursive method as {{Map<?, ?>}} so you never cast back to {{Map<String, Object>}} (avoiding unchecked warnings); read the field name with {{String.valueOf(e.getKey())}} when iterating {{properties}}.',
        ],
        explain: `**The three tiers of a validator.** (1) Check {{type}} — on failure report one error and **stop**, because every check below is meaningless: a string cannot "be missing the field {{id}}". (2) Check the constraints **on the node itself**: {{enum}}, {{minimum}}. (3) Descend into structure: {{required}} + {{properties}} for objects, {{items}} for arrays. This is exactly the shape of real JSON Schema; the rest of the specification ({{allOf}}, {{oneOf}}, {{$ref}}, {{format}}) only adds branches at tier 2 and a dereference step at tier 3.

**{{integer}} is a subset of {{number}}**, and that is where JSON tricks the test author. In a JSON document, {{2}}, {{2.0}} and {{2e0}} are the same number; the parser decides whether it becomes an {{Integer}} or a {{Double}} in Java. So an API returning {{total: 25.0}} after a serializer refactor can redden your {{integer}} schema — BE is not wrong, the **contract simply never stated which numeric type**. Good practice: use {{number}} for money, plus a unit convention checked by a business assertion.

**{{contains(null)}} on an immutable list throws NullPointerException.** {{List.of("new", "paid").contains(null)}} is an NPE, so {{enum}} cannot be checked with {{allowed.contains(value)}} when the data may be null. Only a hand-written loop with {{v == null ? o == null : v.equals(o)}} is safe — and that is also how real validators do it.

**Why the error list must be sorted.** The prompt requires a **sorted** list because the iteration order of a {{Map}} is not guaranteed when the caller passes {{Map.of(...)}} (hash order can change across versions). Real validators usually keep document order and do not sort — but they still guarantee **deterministic** output, because otherwise you have pre-ordered yourself a flaky case. General rule for tests: output must not depend on the traversal order of an unordered structure.

**Three directions to extend when you use this for real.**
1. {{maximum}}, {{minLength}}, {{maxLength}}, {{pattern}}: just more branches at tier 2; for {{pattern}} compile once and then {{matcher.reset(url)}} instead of calling {{String.matches}} inside the loop.
2. Allow several types, the modern way of writing nullable: {{type}} is a {{List}} ({{["string","null"]}}); change {{typeMatches}} to accept a {{List}} and pass if **one** member matches.
3. {{$ref}}/{{definitions}}: add a reference table passed down the recursion and dereference before checking {{type}}. This is the feature that inflates a hand-written validator fastest, and the reason real projects should use {{networknt/json-schema-validator}} — writing one yourself is for **understanding the mechanism**, which is what interviews ask about.

**Connection to a real bug.** BE turns {{total}} into the pretty formatted string "1.234". The field is still there -> the "the {{total}} field exists" assertion is green. The web app uses {{Number(total)}} so it still works -> smoke is green. iOS casts to {{Int}} -> crash. {{$.total: type number}} goes red right in the PR, with a path precise enough for the fixer to know which line to touch.`,
      },
    ],
    check: [
      {
        q: 'BE changes {{total}} from a number to the string "199.000". Which assertion **stays green**, i.e. fails to notice the problem?',
        options: [
          'Compare the response against a JSON Schema declaring {{total}} as {{number}}',
          'Assert the field {{total}} exists in the response',
          'Assert the type of {{total}} before handing it to the iOS client',
          'Compare the response against a schema generated from OpenAPI',
        ],
        explain: 'An "the field exists" check says nothing about the field **type**. That is precisely the kind of contract drift that causes accidents: the data is still there but unusable. Only an assertion about the type (a schema or {{isNumber}}) catches it.',
      },
      {
        q: 'Why should you think twice before writing {{integer}} for monetary fields?',
        options: [
          'Because {{integer}} is checked more slowly than {{number}}',
          'Because JSON does not distinguish {{2}} from {{2.0}}; the parser picks {{Integer}} or {{Double}} depending on its implementation, so {{integer}} can redden even when the data is correct',
          'Because {{integer}} does not support {{minimum}}',
          'Because money must always be a formatted string',
        ],
        explain: 'A number in JSON is a single concept; Jackson/Gson decide the Java class. The same API can return {{25}} today and {{25.0}} after a refactor. For money the good contract is {{number}} plus a unit convention — and a schema cannot catch the unit, that takes a business assertion.',
      },
      {
        q: 'In the {{required}} list of a schema, which fields should you put?',
        options: [
          'Every field currently in the response, to detect any change',
          'Only the fields the UI actually reads and that break when missing',
          'Never use {{required}}, only use {{type}}',
          'Only the primary key fields',
        ],
        explain: '{{required}} on every field turns the schema into a snapshot of today: BE leaving {{note}} null or hidden for guest users reddens the test, and the whole team learns to ignore it. A contract should only state what genuinely has to hold.',
      },
      {
        q: 'Compared with Pact or OpenAPI, what is the biggest weakness of "a schema QA writes by hand in the test file"?',
        options: [
          'It runs slower than the other approaches',
          'The schema is a **guess** by QA about the API; if it is not taken from a real description or from the client side, CI stays green even when FE and BE disagree',
          'It cannot check {{enum}}',
          'It cannot be used with REST Assured',
        ],
        explain: 'That is why contract testing exists: the contract must be declared by the side that **uses** the data (Pact) or published by the side that **provides** it (OpenAPI). A hand-written schema still has value, but treat it as a shape test, not as the source of the contract.',
      },
    ],
  },
});
