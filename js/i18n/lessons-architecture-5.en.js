/*
 * English translation of js/data/lessons-architecture.js — task T476. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-007 lesson-architecture-008
 */
App.i18n.content({
  'lesson-architecture-007': {
    title: 'Logging framework: level filtering, formatting Decorators and multiple appenders',
    goals: [
      'Design the log pipeline: filter by level first, then appenders and Decorators',
      'Understand why formatting is a Decorator wrapping an appender rather than living inside the Logger',
      'Add new channels or filters without modifying the Logger (Open/Closed)'
    ],
    body: `**Summary:** A logging framework uses a filter chain to decide whether an event goes through, Decorators wrap appenders to format independently, and new channels or filters can be added without modifying the Logger.

### The LLD loop for a logging framework
Logging is a small but deceptively tricky LLD exercise: a Logger receives an event (level, message, timestamp), decides **whether to let it through** (filter), then **who to send it to** (appender), and **in what shape** (format). Clarify up front: how many levels are there; can one log go to several places at the same time (console, file, monitoring); does the format differ per destination; how should sensitive data inside logs be handled? This lesson uses a test suite with an in-memory appender, so it focuses only on the logic part.

### Class diagram
~~~text
LogRecord (immutable)
  |-- level int, message String, timestamp long
Levels
  |-- DEBUG = 0, INFO = 1, WARN = 2, ERROR = 3
LogFilter (interface) -- accept or reject
  |-- LevelFilter(minLevel)
  |-- OnlyOtp (a filter the test adds itself)
Appender (interface)
  |-- append(LogRecord)
  |-- InMemoryAppender
  |-- PiiMask (Decorator: masks digits)
  |-- TimestampDecorator (Decorator: adds [ts=...])
Logger
  |-- List LogFilter, List Appender
  |-- log(level, message, timestamp)
~~~

### Pipeline: filter first, appenders after
Every call to {{log(level, message, timestamp)}} follows a fixed order: (1) build an immutable LogRecord; (2) walk the filters: **every filter must agree** — a single rejecting filter drops the event, and it goes nowhere at all; (3) if it clears them all, the record is sent to every registered appender. This traversal is a variant of Chain of Responsibility commonly seen in Logback: a chain of filters where each link has veto power over the event; unlike the "whoever can handle it takes it and stops" CoR, here the event continues only when **the whole chain agrees**. Spelling out that difference in an interview is a plus: you know why you picked a vetoing filter — a log at the wrong level should not reach any appender.

### Formatting is a Decorator, not part of the Logger
The Logger has exactly two jobs: filter and dispatch. Formatting (adding a timestamp, masking sensitive data) is a chain of Decorator layers wrapped around an Appender. The wrapping order determines the processing order: if you wrap {{PiiMask}} outside and {{Timestamp}} inside, then **digits are masked first and the timestamp is added afterwards** — so the digits inside the timestamp are not masked. This is why the Decorator wrapping order must be stated explicitly; in an interview, draw the flow "record → PiiMask → Timestamp → appender". PiiMask masks by replacing each digit with a star; the message is transformed but level and timestamp stay the same (an immutable record can only be replaced by a new record, never edited in place).

### Extending without changing code
The test adds a hand-written Appender and a hand-written filter — not a single line of the Logger may change. This is the lesson's second Open/Closed signal: the pipeline is open through interfaces and closed by the registration lists fed through add. In real products, appenders appear from configuration: Logback uses XML or YAML, Spring uses beans; the same principle is a registry assembled at startup.

### Trade-offs
| Option | Pros | Cons | When to choose |
|---|---|---|---|
| Log straight to System.out | Fastest | No filtering, no formatting, hard to change | Scripts that run once |
| Filter + appender + Decorator | Clean separation, each part testable, extended by new classes | Needs configuration, more complex | Real applications |
| Logback config (XML/YAML) | Configuration changes without rebuilding | Must learn the configuration language | Large projects on SLF4J |

### Where SOLID applies
- **SRP:** the Logger only coordinates; filters only filter; Decorators only format; appenders only write.
- **DIP/LSP:** every appender and filter is an interface; they are interchangeable given an immutable record.
- **OCP:** adding a filter or an appender is a new class, without opening the Logger's code.
- **ISP:** filters only have accept, appenders only have append — nobody is forced to implement extra methods.

### Interview relevance
Talk about production logging practice: the log level is set per environment (DEV allows verbose DEBUG, PROD only INFO and above); in the sandbox we use LevelFilter(2), that is WARN and above. Then continue: sensitive logs must be masked; high-throughput systems must use an async appender or a queue. The catch: with async, log order can be reversed; if order matters, use a BlockingQueue with a capacity and write in batches.

> Senior tip: in a real banking project, I once saw a developer format logs with StringBuilder and then put a shared synchronized lock around the whole thing — every log line had to wait for the others, burning hundreds of seconds of CPU per day. Instead, letting Logback generate the timestamp itself and running the formatting pipeline outside the lock is far more efficient. When doing logging LLD, always ask the extra question "can this Logger handle thousands of requests per second".`,
    exercises: [
      {
        title: 'A Logger with a filter chain and a Decorator that masks sensitive data',
        prompt: `Complete {{Logger}} and the {{PiiMask}} decorator.

The {{Logger}} class holds the filter and appender lists:
- {{addFilter(LogFilter f)}} / {{addAppender(Appender a)}}: add when the argument is non-null.
- {{log(int level, String message, long timestamp)}}: build a {{LogRecord}}; if any filter rejects, drop it; otherwise send the record to each appender in registration order. Do not throw exceptions for valid input.

The {{PiiMask}} class is a Decorator wrapping an appender: when it receives a record, replace each digit with {{*}} and then send the new record to the inner appender; level and timestamp stay unchanged. The record is immutable, so the old object cannot be modified.

Decorator order in the test: {{new PiiMask(new TimestampDecorator(mem))}} — mask digits first, add {{[ts=...]}} afterwards.`,
        hints: [
          'PiiMask replaces each digit with a star and then creates a new LogRecord; no field may be mutated.',
          'In the Logger, run the filters first; only when every filter agrees do you run the appenders.',
          'addFilter and addAppender only add when the argument is non-null.'
        ],
        explain: `The most important rules of this exercise are "the record is immutable: a Decorator replaces it with a new one, it never edits the old one" and "the Decorator wrapping order determines the processing order": with PiiMask outside wrapping Timestamp inside, the digits inside the timestamp get masked; the other way round keeps the timestamp intact and masks only the digits in the message. A common mistake is using Character.isLetterOrDigit to mask (wrong — only digits should be masked), or using replaceAll with a regex (easy to get the encoding wrong). A wrong Logger, on the other hand, calls the appenders even though a filter has not agreed, meaning it treats filters as mere suggestions.`
      }
    ],
    check: [
      {
        q: 'Which rule does the Logger pipeline in this lesson use when running its filters?',
        options: [
          'One filter accepting is enough; the event is sent to the appenders',
          'Every filter must accept; one rejecting filter drops the event',
          'The first filter decides; the later filters do nothing',
          'Filters are only used to write logs to a file, not to filter'
        ],
        explain: `A filter chain where each link has veto power: every filter must agree before the event reaches the appenders; this style is used when a log at the wrong level must go nowhere.`
      },
      {
        q: 'Why is formatting (timestamp, PII masking) a Decorator wrapping an appender instead of living inside the Logger?',
        options: [
          'So the Logger has fewer methods',
          'So formatting combinations can be configured independently per destination, and the Logger does not change when a new format is added',
          'Because formatting is slower inside the Logger',
          'To avoid using interfaces'
        ],
        explain: `A Decorator wrapping an appender allows each format to be combined per destination; the Logger keeps its two jobs of filtering and dispatching unchanged.`
      },
      {
        q: 'With {{new PiiMask(new TimestampDecorator(mem))}} wrapped, what is the processing flow?',
        options: [
          'Add the timestamp first, mask digits afterwards; digits inside the timestamp get masked',
          'Mask digits in the message first, add the timestamp afterwards; the timestamp keeps its digits',
          'Both must run in parallel',
          'The timestamp only applies to ERROR level'
        ],
        explain: `The inner Decorator processes first and the outer Decorator afterwards; therefore PiiMask (inner) runs before Timestamp (outer), and the timestamp added later is not masked.`
      },
      {
        q: 'How should LogRecord be designed?',
        options: [
          'Mutable, so Decorators can edit it and save code',
          'Immutable: Decorators create a new record and keep the old object untouched, which is thread-safe and easy to reason about',
          'With full getters and setters',
          'Write directly into public fields'
        ],
        explain: `An immutable record lets Decorators create new versions safely and avoids side effects when several appenders work on the same record.`
      }
    ]
  },
  'lesson-architecture-008': {
    title: 'Text editor Undo/Redo: the Command pattern, bounded history and merging consecutive typing',
    goals: [
      'Use the Command pattern so each action knows how to do and undo itself',
      'Bound the undo history size with a bounded deque',
      'Merge consecutive typed characters into one command so undo returns the whole word'
    ],
    body: `**Summary:** A text editor uses the Command pattern for undo/redo, merges consecutive typing actions and bounds history with a deque to save memory.

### The LLD loop for an editor with Undo/Redo
In a word processor or editor (VS Code, Google Docs) every received character is a tiny diff — a file with thousands of letters must still undo *the whole run*, not one character at a time. This LLD interview exercise exploits the Command pattern: each action (typing, deleting) is a command that knows how to execute and undo itself; the history is a collection of commands; redo re-executes them. Two clarifying questions up front: how large may the history be (memory is finite)? Do two consecutive keystrokes count as one action or two? (The second question yields the "merge" requirement: adjacent consecutive typing merges into a single command.)

### Class diagram
~~~text
Cmd (abstract)
  |-- pos int
  |-- execute(Editor e) : affects the buffer and cursor
  |-- undo(Editor e)    : restores the buffer to its previous state
InsertCmd  (pos, text) : execute inserts at pos; undo removes [pos, pos+len)
DeleteCmd  (pos, removed) : execute removes the range; undo inserts it back
Editor
  |-- buf StringBuilder, cursor int
  |-- undoStack : Deque, first element is the newest command
  |-- redoStack : Deque
  |-- type(s), delete(n), undo(), redo(), run(cmd)
~~~

### Two stacks for undo and redo
One stack is not enough: on undo, the command is pushed onto redoStack; on redo, it returns to undoStack. Every time the user **performs a new action** (type, delete, or run a custom command), the system clears every pending command in redoStack — there is no path back to the old branch any more, because the history has branched. Therefore: after an undo, once the user types something new, redoStack must be empty.

### Merging consecutive typing
When the user types {{type("he")}} then {{type("llo")}} while the cursor sits right after the text of the previous insert command, a real editor treats the two keystrokes as a single command. The rule: **the new command is an InsertCmd, there is no pending command in history (redoStack is empty), and the cursor position is exactly at the end of the text of the InsertCmd on top of the stack** — then just append to the old command's text: {{top.text += s}}. If the user has undone (or deleted characters with delete) beforehand, or the command on top is a DeleteCmd, a new command must be opened. Merging cannot cross the boundary of a different command type.

The interesting part: merging does **not** grow the history size. Yet one merged command of many letters still undoes in a single step — exactly what the user feels.

### Bounding the history
Because memory is finite, the history keeps only the {{limit}} most recent commands: when a push makes the size exceed the limit, **drop the oldest command** (deque removeLast). This forces the tester to check: after a long sequence of actions, {{historySize() <= limit}} always holds; once past the mark, older commands can no longer be undone — the cursor and buffer stay consistent because they are decided per action, while undo only lives on the commands that remain.

### Where SOLID applies
- **OCP:** adding a new command type does not require changing the Editor ({{run(Cmd)}} stays as is): "Replace All", "Auto-link" or a MacroCommand are all just a new class.
- **SRP:** each command only knows how to execute and undo itself; the Editor only manages the buffer, cursor and the two stacks.
- **DIP:** the Editor depends on the Cmd class; the test can write a custom UpperCmd.

### Trade-offs
| Implementation direction | Pros | Cons | When to choose |
|---|---|---|---|
| Full buffer snapshot per edit | Easy to explain | Very memory-hungry with large files | Editors larger than a few hundred KB |
| Command pattern + diff | Memory-light, undo per action | Must implement execute and undo for each new command type | Text editors, design tools |
| CRDT / operational transform | Many people can edit together | Far more complex | Google Docs, Figma |

### Interview relevance
Prepare two follow-up questions in advance: "What if several people edit the same file (realtime)?" — the answer is Operational Transform or CRDT, and undo there is far more complex; and "What if you want undo by word instead of by character?" — the answer is the cursor-based merge rule used in this lesson, or time-based merging. When asked to go deeper, explain that Command is a discrete class with execute, undo and redo in place; the Editor only manages the two stacks.

> Senior tip: I once saw an office application that saved the whole buffer as a String for every undo level → with a 1 MB file, 100 undo levels consumed 100 MB. The Command pattern is a little heavier to code, but it is the only choice that keeps up with scale. The cost is worth paying because the memory savings are in the dozens of times.`,
    exercises: [
      {
        title: 'Editor: bounded undo/redo with merging of consecutive typing',
        prompt: `Complete the {{Editor}} class using the provided {{Cmd}}, {{InsertCmd}} and {{DeleteCmd}} classes.

Required API:
- {{type(String s)}}: if {{s}} is empty, ignore it. If the top of undoStack is an {{InsertCmd}} and the {{cursor}} position sits right after its text and there is **no** pending command in redoStack, then **merge**: {{top.text += s}}, insert s into buf at the cursor, advance the cursor by {{s.length}}. Otherwise run a new InsertCmd through {{run(Cmd)}}.
- {{delete(int n)}}: do nothing if the cursor is 0; the number of characters deleted is {{min(n, cursor)}} (delete the range right before the cursor), as a {{DeleteCmd}}.
- {{undo()}} / {{redo()}}: if the stack has a command, take it out; undo reverts it; redo executes it again; return {{true}} when something was done, {{false}} otherwise.
- {{run(Cmd c)}}: execute c, push it onto undoStack, and **clear redoStack** at the same time.
- Limit: after a push, if {{historySize() > limit}} drop the oldest command.
- {{canUndo()}}, {{canRedo()}}, {{historySize()}}, {{text()}}, {{cursor()}}.`,
        hints: [
          'run(Cmd) is the only place that decides: clear redoStack, execute the command, push onto undoStack, then trim if the limit is exceeded.',
          'type(String) only merges when the top of undoStack is an InsertCmd, the cursor is at the end of its text, and redoStack is empty.',
          'Use addFirst and removeLast on a Deque (ArrayDeque) as a bounded stack.'
        ],
        explain: `Remember 3 points: (1) **undo() only calls cmd.undo()**: each command type knows how to undo itself, so the Editor has no if branch; adding a new command leaves the Editor unchanged. (2) **merge conditions**: you must check that redoStack is empty, that top is an InsertCmd, and that the cursor sits exactly at the end of the previous text; miss one condition and you merge wrongly when the user has just undone — producing a floating history that is not on the right branch. (3) **history bound** trims from the tail of the deque; removeLast drops the oldest command, while the newest sits at the front.`
      }
    ],
    check: [
      {
        q: 'Why use the Command pattern instead of saving a snapshot of the buffer on every edit?',
        options: [
          'Snapshots are faster when there are many users',
          'Command stores only the diff, so it is memory-light; it also carries its own undo behaviour with no snapshot needed',
          'Snapshots cannot be used with StringBuilder',
          'Command is always simpler because it has to implement execute and undo'
        ],
        explain: `A full buffer snapshot eats memory with large files; Command stores the diff and knows how to undo itself, and adding a new command type does not require changing the Editor.`
      },
      {
        q: 'After typing a few characters right after an undo, what state must redoStack be in?',
        options: [
          'Unchanged; the user can still redo the part that was undone earlier',
          'Cleared, because the history has detached from the old branch',
          'One more zero-valued record is pushed onto it',
          'It automatically redoes the part that was undone'
        ],
        explain: `Every time a new command is performed (including merged typing), redoStack must be cleared — the history has branched, and there is no path back to redo the old branch.`
      },
      {
        q: 'The undo history is limited to {{limit}} entries; what must happen when it is exceeded?',
        options: [
          'Throw an exception',
          'Drop the oldest command (removeLast) from the stack, keeping exactly the limit number of commands',
          'Merge everything into one command',
          'Turn undo off permanently'
        ],
        explain: `The standard for real editors: the history is a bounded deque, and the oldest command is dropped; the buffer and cursor stay consistent because they are updated per action, while undo only works on the commands that remain.`
      },
      {
        q: 'Try merging typing "he" and "llo": which condition is **not** required for merging?',
        options: [
          'The top of undoStack is an InsertCmd and the cursor sits right after its text',
          'redoStack is empty (the user has not just undone)',
          'There is no DeleteCmd between the two typing actions',
          'Less than 50 ms elapsed between the two keystrokes'
        ],
        explain: `Measuring time is the strategy of some editors (timeout-based), but this lesson's rules merge by position; the time between two keystrokes is not part of this lesson's contract.`
      }
    ]
  }
});
