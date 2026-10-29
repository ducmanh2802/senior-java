/*
 * English translation of js/data/lessons-architecture.js — task T475. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-006
 */
App.i18n.content({
  'lesson-architecture-006': {
    title: 'Splitwise: Strategy for splitting money with net balances and minimizing settlement transactions',
    goals: [
      'Design Strategy for the different split types: equal split, percentage split, exact amounts',
      'Maintain a net balance per person and reject an expense when the shares do not add up to the total',
      'Minimize the number of settlement transactions with greedy netting'
    ],
    body: `**Summary:** Split group bills with the Strategy pattern (equal/percentage/exact amounts), keep a net balance per person, and minimize settlement transactions with greedy netting.

### The problem: one expense, several ways to split it
Splitwise (splitting group bills) has three facts per expense: the **payer** (the person who paid), the total amount, and the **split method** (equal, by percentage, by explicit amounts). The system does not need to store every raw pairwise debt; it only needs one **net balance** record per person: positive means they are owed money, negative means they still owe money. From this net you can produce the payment plan with the fewest transactions. This lesson drills one important engineering decision: money is an integer (cents, the long type), never double — a wallet with 997 cents must still match to the exact cent.

### Class diagram
~~~text
SplitStrategy (interface)
  |-- split(amount, users, params) -> Map user -> amount each person owes
  |-- EqualSplit   : equal split, the remainder goes to the people at the front of the list
  |-- PercentSplit : percentages must sum to 100, the leftover is distributed cent by cent
  |-- ExactSplit   : explicit amounts must sum exactly to amount
Ledger
  |-- net : Map user -> net balance
  |-- addExpense(paidBy, amount, users, strategy, params)
  |-- net()    -> a copy of net
  |-- settle() -> List "B pays A 100"
~~~

### Strategy for the split method
The split strategy is the clearest embodiment of Open/Closed: the Ledger does not know EqualSplit or PercentSplit, it only knows the contract "return a split map whose total equals amount". Adding a new split method (shares, per-mille, discounts) means adding a new class, not editing the Ledger. The mandatory contract for every strategy: (1) no negative share; (2) the shares sum exactly to amount; (3) a mismatched total throws IllegalArgumentException. Thanks to (3), the Ledger only needs to validate once more before writing — errors are blocked at the boundary and never pollute the net.

### EqualSplit and the remainder
Splitting 10 cents among 3 people gives each person 3 cents with 1 cent left over. The remainder must be distributed deterministically: by convention **each leftover cent goes to the people at the front of the list, in order**, one +1 each. Never distribute it randomly, because tests and the UI need reproducible results. The same applies to PercentSplit: each person gets the floor of amount * percent / 100, and the remaining cents are distributed as above. If the percentages do not sum to 100, throw IllegalArgumentException — the expense is rejected before it ever touches the Ledger.

### Netting: minimizing the number of settlement transactions
Raw debts can be messy: A owes B, B owes C, and C owes A. Note that the total debt is zero — the optimal settlement requires no transaction at all. The standard greedy algorithm: (1) split people into debtors (negative net) and creditors (positive net); (2) sort debtors by debt descending (ties by ascending id), and creditors the same way; (3) in each round, pair one debtor with one creditor for min(need, give), update both balances, and drop whoever reaches 0 from the list. With realistic group sizes greedy produces close to n-1 transactions — tell the interviewer plainly that the absolute optimum is NP-hard, so greedy is a legitimate choice.

### Where SOLID applies
- **SRP:** the strategy only splits; the Ledger only records the net and settles; do not stuff both into one class.
- **OCP:** adding a new split method does not modify the Ledger; a test can plug in a hand-written strategy and the system still works.
- **DIP:** the Ledger depends on the SplitStrategy interface, not on a concrete class.
- **LSP:** every strategy honours the same contract "return a split map whose total matches amount" — they are interchangeable.

### Major edge cases
- **Debt cycle A pays B, B pays C, C pays A:** every net is 0; settle returns an empty list — showing that netting cancels out the cycle.
- **One large debtor, many creditors:** greedy connects the debtor to each creditor in the sorted order.
- **Single-person expense:** the payer bears the whole amount — the net stays 0 and no transaction is produced.
- **Validation done wrong:** a mismatched split is rejected **before** the net is touched; if you write halfway and only then discover the error, you must write rollback code — error-prone and hard to review.

### Interview relevance
For the DB design answer: the Expense table (id, paidBy, amount) and the ExpenseShare table (expenseId, userId, share) are the source of truth; net is derived data, either computed lazily or updated idempotently per (expenseId, userId). Simply stating "computing the net is idempotent: as long as each expense is applied exactly once, the data always balances" already puts you a level above most candidates.

> Senior tip: in a real financial project, the most common bug is not in the algorithm but an expense applied twice after a retry (the client received 200 but the net was debited 400). Use a reconciliation table keyed by (expenseId, userId) — on a duplicate, skip it. The exercise applies the same principle: validate before every write.`,
    exercises: [
      {
        title: 'Three split strategies: equal, percentage and exact amounts',
        prompt: `Complete {{EqualSplit}} and {{PercentSplit}} against the {{SplitStrategy}} interface ({{ExactSplit}} is already provided as an example).

Common rules: money is a long counted in cents, never double. The result is a {{Map}} user -> amount they owe; the total must equal amount exactly.

- {{EqualSplit}}: split equally; the remainder {{amount % n}} is distributed as +1 to each person at the front of the list, in order.
- {{PercentSplit}}: params holds each user's percentage (for example {{A: 50, B: 25, C: 25}}); the percentages must sum to exactly 100, otherwise throw {{IllegalArgumentException}}; each person's share is the floor of amount times percent divided by 100, and the remaining cents are distributed like the EqualSplit remainder.
- negative amount or empty users: throw {{IllegalArgumentException}}.`,
        hints: [
          'For EqualSplit: derive the base share and the remainder with integer division and modulo; each leftover cent goes to the people at the front of the list.',
          'For PercentSplit: sum the percentages first, then compute each person\'s floor share, and finally hand out the leftover cents in order.',
          'A split must always total exactly amount — double-check the result after computing it.'
        ],
        explain: `The three strategies illustrate Open/Closed: a new split type is just a new class, with no change to the recording code. Two points that earn marks: (1) use long cents, not double, so 997 cents still matches exactly; (2) validate that the total matches amount on the split return value — reject any mismatch instead of pushing a lopsided split into the ledger and having to roll back. Common mistakes: using double, losing cents to rounding, or giving the remainder to a random person instead of following a deterministic order.`
      },
      {
        title: 'Ledger: net balances and a transaction-minimizing settle',
        prompt: `Complete the {{Ledger}} class.

- {{addExpense(paidBy, amount, users, strategy, params)}}: call {{strategy.split}} to get the split map; if the total does not equal amount, throw {{IllegalArgumentException}} and the net must stay intact (no partial writes). When recording: the payer is credited amount; each person according to the split result is debited.
- {{net()}}: return a copy of the Map user -> net balance (positive means owed money, negative means owing money).
- {{settle()}}: minimize the number of transactions with greedy: sort debtors by debt descending (ties by ascending id), sort creditors by the amount owed to them descending (ties by ascending id); each step emits one line {{debtor pays creditor amount}} with min(need, give); whoever reaches 0 is dropped from the list. settle must not change the net (it is only a payment plan).`,
        hints: [
          'Write the net through a temporary Map copy and only commit to the real net at the end; if something fails halfway, do not commit.',
          'In settle, operate on a copy of the net so settle never corrupts the real net; use Long.compare to sort numbers, breaking ties by id.',
          'With a debt cycle where A, B, and C pay each other in turn, every net becomes 0, so settle returns an empty list.'
        ],
        explain: `This exercise tests a design skill: **separating netting from the split method**. The Ledger does not need to know EqualSplit or PercentSplit; it only needs a validated total and a net map. The tests plug in three hand-written strategies (Eq, OnePayer, BadSplit) without modifying the Ledger, a direct demonstration of Open/Closed. Common mistakes: (1) mutating the net directly before the throw — the net drifts and the tests catch it; (2) using double, so the line "B pays A 100" becomes "100.0"; (3) settle changing the net — so the next settle returns a different result. In short: settle should read the net, print the plan, and leave the data unchanged.`
      }
    ],
    check: [
      {
        q: 'Why should you use long cents instead of double when splitting money?',
        options: [
          'To keep the code shorter',
          'To avoid floating-point rounding errors; a single cent off makes the financial data unbalanced',
          'To speed up the computation',
          'It is easier to read'
        ],
        explain: `Double cannot represent decimals exactly (0.1 plus 0.2 yields 0.30000000000000004); money must use long in the smallest unit.`
      },
      {
        q: 'Roughly how many transactions does the greedy settle produce for n people?',
        options: [
          'On the order of n squared transactions',
          'At most n-1 transactions, close to optimal because each match pairs one debtor with one creditor and removes one side',
          'Always n divided by 2',
          'Unbounded'
        ],
        explain: `Greedy pairs one debtor with one creditor each round; the absolute optimum is NP-hard, so greedy landing near n-1 is the standard.`
      },
      {
        q: 'If every net is 0, what does settle return?',
        options: [
          'It throws an exception',
          'An empty list, because every debt has been netted out',
          'A single zero-value transaction',
          'It hangs forever'
        ],
        explain: `There are no debtors or creditors left, so the result list is empty; the cycle where A, B, and C pay each other in turn is a concrete example.`
      },
      {
        q: 'If the shares total differs from amount, the correct behaviour is',
        options: [
          'Write the net first and roll back afterwards',
          'Reject the expense immediately and keep the net intact — validate at the boundary before touching the data',
          'No validation is needed',
          'Validate only at the end of the day'
        ],
        explain: `Fail fast at the boundary: the split return must match the amount total; on a mismatch the expense is rejected before the Ledger writes a single cent.`
      }
    ]
  }
});
