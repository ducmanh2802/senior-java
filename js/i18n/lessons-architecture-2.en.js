/*
 * English translation of js/data/lessons-architecture.js — task T473. Format: js/core/i18n.js (content overlay).
 * ids: lesson-architecture-004
 */
App.i18n.content({
  'lesson-architecture-004': {
    title: 'Vending Machine: State pattern, change with the fewest coins and out-of-stock',
    goals: [
      'Implement a state machine for a vending machine with explicit states',
      'Compute change with the fewest coins when each denomination has a limited count',
      'Handle out-of-stock, insufficient funds and out-of-change situations without losing the user\'s money'
    ],
    body: `**Summary:** A vending machine uses the State pattern to manage the purchase flow, computes change with the fewest coins using dynamic programming, and checks every condition before dispensing.

### The Vending Machine problem
A vending machine has the states: {{WAITING_FOR_MONEY}}, {{SELECTING_ITEM}}, {{DISPENSING}}. The user inserts money, selects a product, receives the product and receives change. Each state has different behaviour: in the waiting-for-money state you cannot select a product; in the selecting state you cannot insert more money; in the dispensing state you cannot change your mind.

### Class diagram
~~~text
VendingMachine
  |-- VendingState (interface)
  |     |-- WaitingForMoney
  |     |-- SelectingItem
  |     |-- DispensingState
  |     |-- MaintenanceState  (extension, no machine changes)
  |-- prices : Map<String,Integer>
  |-- stock  : Map<String,Integer>
  |-- cash   : Map<Integer,Integer>  (denomination -> coin count)
  |-- ChangeMaker (interface)
  |     |-- GreedyChangeMaker  (canonical denominations)
  |     |-- DpChangeMaker      (general optimum)
Product
  |-- name, price
~~~

### State pattern for the machine
Each state is a class that implements the {{VendingState}} interface. The {{insert}}, {{select}} and {{refund}} methods are declared in the interface and implemented differently depending on the state. When the user performs an action that does not fit the current state (for example selecting a product while waiting for money), the method returns an error or ignores it.

Practical benefit: error codes and transition rules live in one place. When you add a maintenance state, you create a {{MaintenanceState}} that rejects every operation and call {{setState}} remotely; you do not have to scatter more if statements across the three public methods.

### Change with the fewest coins
When the user inserts more money than the product price, the system must return the change by combining the available denominations so that the total number of coins is the smallest. With a canonical denomination set (1, 5, 10, 25 or 10, 50, 100, 200, 500), the greedy algorithm — always picking the largest denomination possible — gives the optimal result and is very fast.

But there are two traps. First, the machine has only a **limited count** of each denomination, so the selection step must take {{min(remaining / denomination, available)}}. Second, greedy is not optimal for non-canonical denomination sets: with {{1, 3, 4}} and amount 6, greedy gives 4+1+1 = 3 coins while 3+3 = 2 coins is optimal. When the requirement is truly "fewest coins", use dynamic programming {{dp[i][a]}} = the fewest coins using the first i denominations to reach amount a, then trace back the count of each denomination.

### Out of stock and out of change
If the product is out of stock, the {{SELECTING_ITEM}} state must reject the request to select that product and keep the user in the current state (or move back to {{WAITING_FOR_MONEY}} if you prefer). If there is not enough small change to return the change, the system must check before accepting the transaction; if it is short, reject it and return all the money received. This guarantees consistency: the user never receives a product without receiving the exact change.

The order of checks matters: **out of stock -> insufficient funds -> cannot make change -> then dispense**. If you reverse the order and decrement stock before checking the change, you end up in an irreversible state: the stock is already decremented but the transaction is cancelled.

### Trade-offs
| Change algorithm | Pros | Cons | When to use |
|---|---|---|---|
| Greedy | O(number of denominations), very fast, easy to explain | Only optimal for canonical denominations | Machine with a standard denomination set, high transaction volume |
| DP by amount | Truly optimal, handles any denominations | O(amount × number of denominations), memory heavy | Small amounts, strict optimality required |
| Precomputed table | O(1) at runtime | Must be updated when the cash supply changes | Fixed machine, very high load |

### Where SOLID applies
- **SRP:** a state only decides the flow; {{ChangeMaker}} only computes the change plan; the stock and cash are managed by {{VendingMachine}}.
- **OCP:** add products through {{addProduct}}, add states through a new class implementing {{VendingState}}, add change algorithms through a new {{ChangeMaker}}.
- **DIP:** {{VendingMachine}} depends on the {{ChangeMaker}} interface; you can swap greedy for DP without changing the machine.
- **ISP:** {{ChangeMaker}} has exactly one method that matches its need, without forcing extra implementations.

### Extensions
If you need a discount feature, you can add a pricing strategy (similar to Strategy in the Parking Lot) without modifying the main states. If you need to support card payments, you add a new {{PROCESSING_CARD}} state and a new class implementing the payment interface; the old states keep working normally. If you want to add a product, just call {{addProduct}} — the state logic does not depend on the concrete product list.

### Interview relevance
The interviewer often asks: "If you had to add a new product with a different price, which parts would you modify?". Senior answer: you only add the product to the data store; the states and the change logic are unaffected because they depend on numeric values, not on the concrete product list. If asked about SOLID: the State pattern demonstrates Open/Closed when adding a new state; separating the pricing logic from the states demonstrates Single Responsibility.

> Senior tip: in a production system, I once saw a serious bug where the vending machine did not check the small change before accepting a transaction, leading to cases where the user received the product but not the full change because the machine was short on coins. That is why I always add a check of the change capability before transitioning to {{DISPENSING}}, and always log the remaining coin counts after each transaction for reconciliation.
`,
    exercises: [
      {
        title: 'Compute change with the fewest coins when the coin counts are limited',
        prompt: `Complete {{ChangeCalculator.calculateChange(int amount, int[] denominations, int[] available)}}.

Return an array {{result}} with the same length as {{denominations}}, where {{result[i]}} is the number of coins of denomination {{denominations[i]}} to give back, such that:
- The total value is exactly {{amount}}.
- No more than {{available[i]}} coins are used for denomination i.
- The total number of coins is the **smallest** — even when the denomination set is not canonical (for example {{1, 3, 4}}).
- If an exact amount cannot be returned, return an empty array.
- A negative {{amount}} also returns an empty array; an {{amount}} of 0 returns an array of all zeros.`,
        hints: [
          'With greedy, the number of coins of each denomination is {{min(remaining / denomination, available)}}; but greedy is not optimal for arbitrary denominations.',
          'Dynamic programming: {{dp[i][a]}} is the fewest coins using the first i denominations; transition by trying to use c coins of denomination i.',
          'After computing dp, trace back from {{dp[m][amount]}} to find the count of each denomination.'
        ],
        explain: `This exercise deliberately uses a non-canonical denomination set {{1, 3, 4}} to show that greedy is wrong. Greedy gives 6 = 4 + 1 + 1 (3 coins), while the optimum is 3 + 3 (2 coins). Dynamic programming with a count limit handles both requirements correctly: the exact total and the fewest coins. Common mistakes: checking only the total and forgetting the {{available}} limit, or tracing back incorrectly so the number of coins does not match dp.`
      },
      {
        title: 'VendingMachine: state machine and the checks before dispensing',
        prompt: `Complete {{VendingMachine}} using the provided {{VendingState}} interface and {{ChangeMaker}}.

Standard flow:
1. {{insert(amount)}} is only valid while in {{WAITING_FOR_MONEY}} and the denomination is loaded in the machine; add it to the balance, transition to {{SELECTING_ITEM}}.
2. {{select(product)}} checks in order: the product exists and is in stock -> enough money -> change can be returned. If everything is fine, transition to {{DISPENSING}} and return {{"OK"}}; otherwise, return the appropriate error message and keep the state.
3. {{dispense()}} only while in {{DISPENSING}}: decrement 1 product, return the change, go back to {{WAITING_FOR_MONEY}}.
4. {{refund()}} returns the balance and goes back to {{WAITING_FOR_MONEY}}.

Requirements:
- If the exact change cannot be returned, cancel the transaction, refund the money and do **not** decrement stock.
- {{addProduct}} allows adding a new product without editing the class.
- Do not use any library outside the JDK.`,
        hints: [
          'Set the order of checks inside {{select}} to: out of stock -> insufficient funds -> cannot make change -> dispense.',
          'When the change check fails, refund the whole balance and return to {{WaitingForMoney}} before returning the error.',
          'In {{dispense}}, only decrement stock and coins while in {{DISPENSING}}; that way a failed transaction leaves no side effects.'
        ],
        explain: `This exercise combines the State pattern with an easy-to-get-wrong business rule: only dispense when you are sure the change can be returned. {{SelectingItem}} checks in order and only transitions to {{DispensingState}} when every condition holds; this way {{dispense}} is the only step that changes stock and cash, which makes reconciliation easy. The test uses {{NoChange}} to simulate a machine that is out of small change: the transaction is cancelled, the balance goes back to 0, and the stock is unchanged. Adding the Tea product through {{addProduct}} proves Open/Closed at the data level. Common mistakes are decrementing stock right inside {{select}} and only then discovering the change cannot be made, or forgetting to add the user's money to the cash supply so the change plan cannot be computed.`
      }
    ],
    check: [
      {
        q: 'Which kind of bugs does the State pattern reduce in a Vending Machine?',
        options: [
          'It reduces simulation time',
          'It prevents actions that do not fit the current state',
          'It increases the number of lines of code',
          'It removes the need to check the state'
        ],
        explain: `Each state defines its own behaviour; an inappropriate action is rejected or ignored, which prevents logic bugs.`
      },
      {
        q: 'If there is not enough small change to return the exact change, what should the vending machine do?',
        options: [
          'Sell the product anyway and keep the change',
          'Reject the transaction and return all the money received',
          'Return only part of the change',
          'Ignore it and continue'
        ],
        explain: `To guarantee consistency and avoid losing money or disputes, the system must reject the transaction and refund in full.`
      },
      {
        q: 'Does the greedy algorithm for change work correctly for every denomination set?',
        options: [
          'Yes, it is always correct and always uses the fewest coins',
          'It is only optimal for canonical denominations (for example 1, 5, 10, 25)',
          'It is never correct',
          'It is only correct when there is enough small change'
        ],
        explain: `Greedy gives the optimal result for canonical denomination sets; for arbitrary denominations (for example 1, 3, 4) you need dynamic programming or a recheck to guarantee the fewest coins.`
      }
    ]
  }
});
