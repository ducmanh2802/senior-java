# TOEIC Listening & Reading (#/toeic, tab L&R) + tips for 4 skills

## Copyright

ETS test books (ETS 2024, 2025, 2026…) are copyrighted. **Never copy questions, scripts or passages from them or from
leaked "real test" collections.** Write original items that follow the current format, topics, question types and
difficulty of the newest ETS tests (business English: office, HR, travel, purchasing, finance, events, manufacturing,
health, dining, housing, technology). It is fine to describe trends ("đề gần đây hay hỏi…") in tips.

## Test format (ETS, current since 2018)

| Part | Q no. | Items | Unit | Options |
|---|---|---|---|---|
| 1 Photographs | 1–6 | 6 | 1 picture, 4 spoken statements | 4 (A–D) |
| 2 Question-Response | 7–31 | 25 | 1 spoken question, 3 spoken responses | 3 (A–C) |
| 3 Conversations | 32–70 | 39 | 13 conversations × 3 Q; ≥ 2 with 3 speakers; ≥ 3 with a graphic; ≥ 2 "implied meaning" Q | 4 |
| 4 Talks | 71–100 | 30 | 10 talks × 3 Q; ≥ 2 with a graphic; ≥ 2 "implied meaning" Q | 4 |
| 5 Incomplete Sentences | 101–130 | 30 | 1 sentence with a blank | 4 |
| 6 Text Completion | 131–146 | 16 | 4 texts × 4 blanks; each text has 1 sentence-insertion blank | 4 |
| 7 Reading Comprehension | 147–200 | 54 | 10 single passages (29 Q, 2–4 Q each), 2 double (5 Q each), 3 triple (5 Q each); ≥ 2 "insert sentence [1]–[4]" Q, ≥ 2 text-message/online-chat passages with "what does X mean by…" | 4 |

Listening ~45 min, Reading 75 min. Score 5–495 per section.

## Files

One test = 5 files, `js/data/toeic-lr-<T><x>.js` (T = test number 1, 2, …):

| x | parts | units |
|---|---|---|
| a | 1, 2 | 6 + 25 |
| b | 3 | 13 |
| c | 4 | 10 |
| d | 5, 6 | 30 + 4 |
| e | 7 | 15 |

Each file: `(window.TOEIC_LR = window.TOEIC_LR || []).push({...}, ...);` A placeholder file is
`window.TOEIC_LR = window.TOEIC_LR || [];` (allowed; the checker only checks counts when the file has units).

## Unit schema

```js
{
  id: 'lr1-p3-05',        // lr<T>-p<part>-NN (NN = unit order inside the part, 2 digits)
  test: 1, part: 3,
  // LISTENING (parts 1–4): what is spoken. Hidden during the test, shown in review. Read aloud by speechSynthesis.
  picture: 'English description of the photo (part 1 only), 25–60 words: people, objects, positions, actions',
  script: [ { sp: 'W', text: '…' }, { sp: 'M', text: '…' }, { sp: 'M2', text: '…' } ],
          // sp: M, W, M2, W2 (different voices) or N (narrator / single speaker in part 4).
          // Part 1: no script (the options are the spoken statements). Part 2: script = [{sp, text: the question}].
          // Part 3: conversation 70–170 words. Part 4: talk 80–190 words, sp 'N'.
  accent: 'us' | 'uk' | 'au' | 'ca',   // listening only; vary accents across a test like ETS does
  graphic: 'markup table / list shown to the learner (only for graphic questions, parts 3, 4)',
  // READING (parts 6, 7):
  passages: [ { kind: 'email' | 'article' | 'notice' | 'advertisement' | 'letter' | 'memo' | 'form' | 'invoice' | 'schedule' | 'web page' | 'text message chain' | 'online chat' | 'review' | 'report', title: '…', text: `…` } ],
          // Part 6: one passage containing blanks written as -------(131), -------(132)… with the question number.
          // Part 7: insert-sentence positions written [1] [2] [3] [4] in the text.
  questions: [
    {
      n: 41,                                   // official question number (see table), contiguous in the test
      q: 'What does the woman ask the man to do?',   // part 1 and 2: q = '' (nothing printed in the real test)
      options: ['…', '…', '…', '…'],           // part 2: 3 options. Text without "(A)" prefixes.
      answer: 2,                               // index
      type: 'detail',                          // see list below
      explain: `Vietnamese: why the answer is right (quote the key line of script/passage), why each distractor is wrong
               (trap type: same sound, repeated word, wrong person, wrong time…)`
    }
  ],
  vi: `optional: Vietnamese translation of the script / passage (good for review)`,
  vocab: [ 'word – nghĩa tiếng Việt', … ],   // 3–10 useful business words from this unit
}
```

Question `type` values:
- Listening: `photo-person`, `photo-object`, `wh-question`, `yes-no`, `choice`, `suggestion-request`, `statement`, `indirect`,
  `gist` (topic / purpose / where / who), `detail`, `next-action`, `implied` (what does X mean when she says "…"), `graphic`, `inference`.
- Reading: `word-form`, `verb-tense`, `pronoun`, `preposition`, `conjunction`, `vocabulary`, `relative-clause`, `comparison`,
  `sentence-insert` (part 6 sentence choice), `main-idea`, `detail`, `inference`, `not-true`, `synonym`, `insert-sentence`,
  `implied` (text message meaning), `cross-reference` (double/triple passages: needs 2 passages).

Rules:
- Answer positions evenly spread within each part (no position > 35% in a part with ≥ 10 questions).
- Distractors must be real TOEIC traps (similar sound, repeated word, wrong tense, plausible but not stated).
- English natural, current business usage; no Vietnamese inside English text. `explain`, `vi`, vocab meanings: Vietnamese with diacritics.
- Template literals: no backtick, no `${`.

## Tips: `window.TOEIC_TIPS` in `js/data/toeic-tips.js`

```js
{
  id: 'tip-l-01',                  // tip-<l|r|s|w|o>-NN  (o = overall strategy)
  skill: 'listening',              // listening | reading | speaking | writing | overall
  order: 1,
  title: '…',                      // ≤ 90 chars
  summary: '…',                    // 40–300 chars
  body: `markup ≥ 2500 chars, starts with **Tóm tắt:**, ends with > Senior tip: (người đã đạt 900+ chia sẻ)`,
  checklist: ['…'],                // 3–8 items, things to practise / check
  related: ['toeic-s1-001', 'lr1-p3-05']   // optional, existing ids
}
```
