/*
 * English translation of js/data/lessons-ai.js — task T809. Format: js/core/i18n.js (content overlay).
 * ids: lesson-ai-005
 */
App.i18n.content({
  'lesson-ai-005': {
    title: 'RAG from the ground up: overlapping chunking, embedding, cosine similarity, top-k, re-ranking and citations',
    goals: [
      'Explain why documents must be cut into chunks, why you need overlap, and what breaks when chunks are too big or too small.',
      'Understand that an embedding is just a list of numbers and compute cosine similarity by hand, step by step, with no library.',
      'Write the retrieve step: filter by threshold, sort by score, break ties stably, take exactly top-k.',
      'Explain why recall (ANN + BM25) and precision (re-ranker) are two separate stages, and what hybrid search buys you for Vietnamese.',
      'Design citations: chunks carry an id, the model is forced to reference them, the server checks each id before rendering a link.',
    ],
    body: `**Summary:** RAG (Retrieval-Augmented Generation — "generating an answer that is boosted by a search step") lets an LLM answer from your company's own documents, in four steps: **(1)** cut the documents into small pieces (chunks), **(2)** turn each piece into a list of numbers called an embedding vector, **(3)** compare the vector of the question against the vector of every piece with cosine similarity to take the top-k most relevant pieces, **(4)** paste those top-k into the prompt together with source labels and only then call the model. Most of the answer quality is decided in the "search" steps, not by the model — so a developer has to understand chunking, similarity, top-k and citations, not just how to call an API.

### 1. What RAG solves (and why it is not fine-tuning)
An LLM only "knows" what it saw while it was being trained. Three problems when you ask it about your own data:
1. **It does not know**: your internal fee schedule, your credit-limit approval process, your contract clauses were never in the training data.
2. **It stands still**: the knowledge has a cutoff date. The fee table changed last week, the model still answers with last year's numbers.
3. **It invents** (hallucination — the model fluently states something that does not exist): the model is optimised to make "the next token sound plausible", not to "only say things that are true".

Two ways to fix that:
| | Fine-tuning | RAG |
|---|---|---|
| Essence | Continue training, i.e. **change the model weights** | Keep the model untouched, build an extra "bookshelf" and look things up on every question |
| Documents change daily | Must retrain (hours, money, an MLOps process) | Update the index (seconds) |
| Evidence | You cannot tell which document the answer came from | Can cite the exact chunk, the exact page |
| Security risk | The data sits inside the weights and can be "prised out" | Only the chunks sent inside the request — controllable |
| Operational risk | Needs clean data, a training pipeline, MLOps people | Needs retrieval and eval done properly |
> Pick RAG when the knowledge changes and you need citations. Fine-tune when you want to change the **style/format** (tone of voice, email template, layout), not to pump in knowledge.

### 2. Chunking: why you must cut, and how to cut correctly
Every embedding model accepts only a limited number of tokens (usually around 512 tokens per embedding call), and **the vector of a very long passage is a "stew"**: many topics blended together, so it ends up close to nothing in particular. Cutting smaller makes each vector "sharper". But cut too small and one idea falls across two places, and neither place can answer on its own.

The common ways to cut, from worst to best:
1. By **fixed character count** (every 400 characters) — easy to write, but it cuts mid-sentence, mid-money-amount, mid-table-row.
2. By **sentence** (period, line break) — respects sentences.
3. By **structure** (markdown headings, clauses, sections, tables) — best for business documents, because each chunk is one complete idea.
4. Plus **overlap**: the next chunk repeats the last few units of the previous chunk.

Diagram with 12 words, chunk = 4 words, overlap = 1 word:
~~~text
document :  w0  w1  w2  w3  w4  w5  w6  w7  w8  w9  w10  w11
chunk 0  : [w0  w1  w2  w3]
chunk 1  :                 [w3  w4  w5  w6]     <- w3 is repeated (overlap)
chunk 2  :                          [w6  w7  w8  w9]
chunk 3  :                                 [w9  w10  w11]   <- short: it touches the end of the document
~~~
**Why overlap?** A real example. The document reads: "Article 12. The loan file includes a national ID card, a household registration book, and 6 months of statements. The disbursement deadline is at most 15 working days." If the chunk boundary falls right after "6 months of statements." then chunk A holds the document list but no deadline, and chunk B holds "15 working days" without knowing what it belongs to. The question "what papers do I need for a loan and how long until I get the money?" matches **both** chunks only fuzzily, both drop out of top-k, and the model answers incompletely. An overlap of about 10-20% of the chunk size (2 sentences for business documents, 40-80 tokens) guarantees that at least one chunk contains the idea whole.

| Chunk size | Pros | Breaks | When to use |
|---|---|---|---|
| Too small (under ~50 tokens) | Pinpoints the exact place, prompt stays lean | Context is lost; "summarise / what differs" questions are not fully contained in any chunk; the number of chunks grows, so the index bloats and embedding cost grows | FAQ one-question-one-answer, short clauses |
| The stable zone (~200-500 tokens, along paragraphs) | Enough context, the vector is still sharp | Sometimes holds 2 ideas, so you need a re-rank to choose | Most enterprise documents |
| Too large (over ~1000 tokens) | Few chunks, hard to "miss" an idea | The embedding is diluted -> the similarity score against every question looks the same, top-k fills up with junk; "lost in the middle"; each request costs more tokens | Only short documents, or parent chunks used to read extra context |

Every chunk must carry **metadata** (extra data stored alongside the vector): {{docId}}, {{section}}, {{page}}, {{updatedAt}}, {{language}}, {{allowedRoles}}. Metadata serves three jobs: citations, **permission filtering** (a user only sees chunks they are allowed to read) and time filtering. Filtering should run **before** taking top-k; if you filter afterwards, top-k has already been taken over by junk.

> Common indexing mistakes: (a) hard character cuts that break sentences; (b) updating a document without deleting its old chunks -> the system returns last year's fee schedule; (c) indexing footers, "page 12/40" and boilerplate clauses too — they all look alike, so they match every question and steal the top-k slots; (d) forgetting Vietnamese normalisation (Unicode NFC/NFD, "d" with a hook as two code points versus one) which throws off exact matching and BM25.

### 3. Embedding: turning text into a list of numbers
An **embedding** is the output of an embedding model: it maps a piece of text onto a vector, for instance 384 real numbers (all-MiniLM-L6-v2) or 1536 numbers (OpenAI's text-embedding-3-small). The core property: two passages that are **close in meaning** have vectors that are **close in direction**, even when they share no single word.

Illustrated in 3 dimensions (reality is 384-1536 dimensions; nobody can picture 384 dimensions, so people draw 2):
| Text | Vector [banking, hr, legal] |
|---|---|
| "annual credit card fee" | [0.90, 0.05, 0.10] |
| "cash withdrawal limit" | [0.85, 0.00, 0.20] |
| "how many days of annual leave do I get" | [0.05, 0.90, 0.10] |
| "office lease contract" | [0.10, 0.20, 0.85] |

The question "how much does my card cost each year?" gets a vector close to the first two rows -> those two chunks go into the prompt. This is exactly where embedding beats keyword search: "**pay raise**" and "**income adjustment**" share no word, but their vectors are near each other.

How to obtain vectors:
~~~java
// 1) Call an embedding API: the response has an "embedding" field holding an array of numbers (batch many passages in one request to make it cheaper and faster)
// 2) Or run the ONNX model locally (ONNX Runtime, DJL) when you need data residency and do not want to pay per request
float[] embed(String text) {
    // POST {"model": "text-embedding-3-small", "input": text} -> parse the array of numbers
    return vector;
}
~~~
> The crucial invariant: a vector can **only be compared against vectors produced by the same model and the same version**. Changing embedding model = recomputing the entire index (the 2-million-chunk scenario and the way to do it without downtime is in question ai-023).

Vectors live in a **vector store** (a database specialised in finding nearest neighbours): pgvector (a PostgreSQL extension that adds a {{vector}} column type), Pinecone, Qdrant, Milvus, OpenSearch kNN, or Redis (the Redis Query Engine with vector {{FT.SEARCH}}). With pgvector:
~~~sql
-- <=> is the cosine distance operator = 1 - cosine; ORDER BY distance is exactly "find the closest vectors"
SELECT id, 1 - (embedding <=> CAST(:queryVector AS vector)) AS score
FROM chunk
WHERE allowed_role = ANY(:roles)          -- filter by permission BEFORE taking top-k
ORDER BY embedding <=> CAST(:queryVector AS vector)
LIMIT 5;
~~~

### 4. Cosine similarity: a formula you can compute by hand
Given two vectors a and b:
~~~text
                n
cos(a, b)  =   sum a[i] * b[i]   /   ( sqrt(sum a[i]^2) * sqrt(sum b[i]^2) )
               i=1
~~~
The result lies in [-1, 1]: **1** = same direction (closest in meaning), **0** = perpendicular (unrelated), **-1** = opposite directions.

Computed step by step with q = [1, 2] and d = [2, 4]:
1. Dot product: 1\*2 + 2\*4 = 2 + 8 = 10
2. Lengths: |q| = sqrt(1 + 4) = 2.236, |d| = sqrt(4 + 16) = 4.472
3. cos = 10 / (2.236 \* 4.472) = 10 / 10 = **1.0**

Two vectors that are proportional to each other score 1.0 even though their lengths differ wildly. **Why divide by the lengths?** Because the embedding of a long passage usually has a different magnitude than a short one, while what we want to measure is **direction** — a longer passage is not more relevant just because it is longer. If the model already normalised its vectors (norm = 1; OpenAI and sentence-transformers do that by default) then cos = a·b and one multiply-and-add loop is enough; that is why many systems use the dot product for speed.

| Metric | Formula | Use when |
|---|---|---|
| cosine | a·b / (\|a\|·\|b\|) | the default, safe for any vector |
| dot product | a·b | vectors are already normalised (fastest, one loop) |
| Euclidean (L2) | sqrt(sum (a[i] - b[i])^2) | when length carries information; needs a normalised space |

Two places where it goes wrong (exercise 2 makes you handle them):
- An all-zero vector (an empty passage, the tokenizer returns an array of zeros) makes |a| = 0 -> division by zero = **NaN/Infinity**, and NaN wrecks the sort (a comparison with NaN is never true, so the order becomes random). The rule: when the norm is 0 the score is 0.0.
- Vectors of different lengths (model changed, a corrupt record, dimensions truncated on read) -> treat them as invalid, score 0.0; do not throw and take down the whole request.
- Bag-of-words (counting word frequencies, no model needed) uses this very same formula — it simply does not understand synonyms, and it is a cheap way to get a demo vector.

### 5. Top-k and thresholds: how many is enough
- **Money and limits**: 5 chunks x 300 tokens = 1500 context tokens per question; multiply by the number of requests and users and you have the invoice.
- **Quality**: the "lost in the middle" effect — the model pays more attention to the beginning and the end of the context than to the middle. Stuffing 20 chunks usually makes the answer **worse**, not better, and gives the model more raw material to invent with.
- **Threshold**: drop chunks whose cosine is too low (say below 0.25-0.3 with a normalised model). Answering "no document found" is better than letting the model answer from junk.
- Practically: k = 3-5, and **measure** it with recall@k on a set of real questions (see lesson-ai-001) instead of guessing.

### 6. Re-ranking: why the work splits into two stages
Searching millions of vectors with ANN (**A**pproximate **N**earest **N**eighbor — an approximate-neighbour algorithm such as HNSW, which trades a little accuracy for speed) or BM25 (Elasticsearch's keyword ranking algorithm) is **cheap**: a few ms over millions of records, but it scores "naively", because it only compares vector against vector (or word against word).

A **re-ranker** is a small cross-encoder model: it takes **the question and the chunk together in one pass**, so the model "reads" both texts at once and then emits a score. Much more accurate, but it needs one inference run **per pair** — 50 pairs means about 50 model runs, roughly a second, which is impossible across millions of chunks.

That is why the standard pipeline separates the two stages:
~~~text
recall   (cheap, wide): ANN + BM25  ->  ~50 candidates        goal: miss nothing         (recall)
rerank   (costly, narrow): cross-encoder re-scores the 50  ->  top 5   goal: put the best one on top (precision)
generate (LLM):         5 labelled chunks + the question  ->  the answer
~~~
**Hybrid search** = merging the vector results with the keyword results. Their strengths cover for each other: embeddings understand meaning, keywords nail exact strings. For Vietnamese it is well worth doing, because product names, clause codes, abbreviations ("CCCD", "TTLTT") and text **typed without diacritics** ("phi thuong nien the") easily slip past the embedding yet hit BM25. A simple and stable merge is **reciprocal rank fusion**: a document's score = the sum of 1 / (60 + position) taken from each ranked list — you only need the positions, you do not have to normalise the two systems' score scales.

### 7. Citations: turning an answer into something checkable
Without citations nobody trusts the answer, you cannot audit it, and legal will not let it go to production. The compact recipe:
1. Every chunk placed into the prompt is numbered {{[1]}}, {{[2]}}, {{[3]}} and carries its source (docId, page).
2. The system prompt **forces** the model to: answer only from the CONTEXT, tag every statement with the matching {{[number]}}, and if the context is not enough, state clearly that nothing was found.
3. The server **validates**: every id the model cites must be inside the set of ids you sent. An unknown id -> delete it or downgrade the answer to "unsupported". Never build a link out of text the model invented.
4. The UI renders a clickable source list (docId, title, page) so the user can check the answer against it.
~~~java
String context = """
    CONTEXT (you may only answer from the passages below, cite [number] after each statement):
    [1] (doc=QS-01, page=12) Annual fee for the Platinum card: 300,000 VND/year.
    [2] (doc=QS-01, page=13) First year free if a first transaction happens within 30 days.
    """;
// citation id -> the real source. Only these ids may become links in the UI.
Map<String, String> byCiteId = Map.of("1", "QS-01#12", "2", "QS-01#13");
// check: the model citing [3] or [12] invented it -> flag it, do not render a link
~~~
> Pitfall: the model cites "[3]" when the prompt only contains [1] and [2]; or it cites [1] correctly but the answer actually came from the model's own knowledge (a "lip-service" citation). Beyond checking ids, you also need to measure **groundedness** on a golden dataset.

### 8. The flow of one RAG question
~~~seq
title: What a RAG question goes through
actors: User | API | Embed | VectorDB | Rank | LLM
User -> API: Question: what does the Platinum card cost
API -> Embed: Build a vector for the question
Embed --> API: 384-dimension vector
API -> VectorDB: Find the 50 nearest chunks
VectorDB --> API: 50 chunks with scores
API -> Rank: Re-score 50 query-chunk pairs
Rank --> API: Top 5 chunks
API -> LLM: Prompt + 5 chunks labelled [1..5]
LLM --> API: Answer carrying citations
API --> User: Answer plus document links
note API: Filter by user permission before taking top-k
~~~

### 9. Failures you actually see in production
| Symptom | Common cause | Fix |
|---|---|---|
| Answers "not in the documents" although the document has it | the question uses different wording, the embedding does not catch it | hybrid search, normalise the text, add synonyms/definitions into the metadata |
| Content of two products mixed together | chunk too large, several topics in one vector | chunk by structure, increase overlap |
| The model invents money amounts | junk in the prompt, the model "fills in" the missing part | threshold + forced "context only" + citations + eval |
| The answer is correct but misses points | recall@k is low | measure recall before fixing anything; the point lives across chunks, raise k together with re-ranking |
| Results shuffle between two identical calls | the sort has no tie-break, float scores are equal | tie-break by id/recency (exercise 2) |
| A user sees another department's documents | no permission filter | filter {{allowedRoles}} right inside the vector query |

### Interview relevance
The opener: "How does RAG work?" — answer it as a chain: chunk (with overlap + metadata) -> embed -> store in a vector store -> cosine/dot with a threshold -> top-k -> re-rank -> prompt with source labels -> the server checks the citations. The follow-ups are usually: why big chunks break (the embedding is diluted), why you need overlap (an idea cut right at the boundary), when to add a re-ranker (recall is fine but the ranking is wrong), why not stuff 20 chunks (lost in the middle + cost), how to handle Vietnamese typed without diacritics (hybrid + BM25), what to do when the embedding model changes (recompute the index, run two vector columns in parallel).
> Senior tip: before buying a vector DB or a re-ranker, measure recall@50 on 50-100 real questions. If the right chunk is **not** in the top-50, the fault is in chunking/embedding and everything downstream is just makeup; if the right chunk **is there but ranked low**, the re-ranker is the investment that pays back fastest.`,
    exercises: [
      {
        title: 'Chunker.split: cutting text into word chunks with overlap',
        prompt: `Write {{Chunker.split(String text, int size, int overlap)}} returning {{List<String>}}. The acceptance rules (the tests follow exactly these):
- {{text}} is split into **words** on whitespace (space, tab, newline). The helper {{words(String)}} is already written — just use it; it already handles null and extra whitespace.
- Each chunk holds {{size}} **consecutive** words joined by **a single space**; a chunk that reaches the end of the document is allowed to be short.
- The next chunk shifts one **step**, {{step = size - overlap}}, relative to the previous chunk, i.e. the last {{overlap}} words of the previous chunk appear again at the start of the next one.
- Stop as soon as a chunk has reached the last word of the document: do not create an extra chunk whose content is already fully inside the previous chunk.
- {{size <= 0}} or {{overlap < 0}} -> throw {{IllegalArgumentException}}. If {{overlap >= size}} then clamp {{overlap}} to {{size - 1}} (the step is always >= 1, so no infinite loop).
- {{text}} null or entirely whitespace -> return an empty list.

With the 10 words {{alpha beta gamma delta epsilon zeta eta theta iota kappa}}, {{size = 4}}, {{overlap = 1}} the result is 3 chunks: {{alpha beta gamma delta}} / {{delta epsilon zeta eta}} / {{eta theta iota kappa}}.`,
        hints: [
          'Validate {{size}} and {{overlap}} before doing anything else, then compute {{step = size - Math.min(overlap, size - 1)}}.',
          'Loop over the start index: {{for (int start = 0; start < ws.size(); start += step)}} with {{end = Math.min(start + size, ws.size())}}; use {{String.join(" ", ws.subList(start, end))}} to build the chunk.',
          'The tail stop condition: when {{end == ws.size()}} do {{break}} — the chunk you just built already reached the last word, so no extra chunk is needed.',
        ],
        explain: `### Solution
- The text is tokenised into an array of words once ({{words}}); after that everything is a sliding window over an array of indexes: {{[start, start + size)}} with a jump of {{step = size - overlap}}.
- The larger {{overlap}} is, the more chunks you get (more words repeated), but the safer an idea sitting on the boundary. The total number of embedded tokens grows like {{1 / step}}, so a 50% overlap nearly doubles the embedding cost.
- The rule {{end == ws.size() -> break}} is what handles every edge case: once a chunk touches the end of the document, every larger start only produces chunks made of words you already have, and with a small {{step}} that can generate dozens of duplicate junk chunks.

### Common mistakes
- {{step = 0}} when {{overlap == size}} -> the loop never advances, the app hangs. You must clamp {{overlap <= size - 1}}.
- Using {{substring}} by character: it cuts inside a word, inside the number "300,000 VND", and with Vietnamese it can cut inside a combined diacritic.
- Forgetting that the last chunk may be short, then "padding" it with words from another chunk -> duplicated content, a bloated index.
- Returning a list of **empty** chunks when {{text}} is blank, so downstream embeds an empty string and receives a zero-length vector.

> Senior tip: in production, do not chunk a bare string on its own — chunk by **structure** first and only then merge/split to reach the target size, and always record the {{headingChain}} (for example "Fee schedule > Cards > Annual") in the metadata. When a question matches only one line sitting under a heading, it is the headingChain that gives that chunk its full meaning.`,
      },
      {
        title: 'Retriever.topK: cosine similarity and stable top-k',
        prompt: `Write the class {{Retriever}} with two static methods.

1. {{cosine(double[] a, double[] b)}}: return {{(a . b) / (|a| * |b|)}}. Return {{0.0}} (never NaN/Infinity) when: one of the two vectors is null or empty, a vector is all zeros, or **the two vectors have different lengths**.
2. {{topK(double[] query, Map<String, double[]> docs, int k)}}: {{docs}} maps a document id -> its embedded vector. For every document compute {{cosine(query, vector)}}, **drop documents scoring <= 0.0**, sort by descending score and return the ids of at most the first {{k}} documents.
   - Two documents with the **same score**: sort by **id ascending**, lexicographically, so the result does not depend on the order things were put into the map.
   - {{docs}} null/empty, or {{k <= 0}}: return an empty list.
   - Do not modify the input {{docs}} or {{query}}; return a new list.

Note: the score of one document is computed many times if you call {{cosine}} again inside the comparator — not wrong, but better to compute it once and keep it.`,
        hints: [
          'Inside {{cosine}}, accumulate {{dot}}, {{na}} and {{nb}} in one single loop; if {{a}} or {{b}} is null/empty, the two lengths differ, or {{na}} or {{nb}} is 0, return {{0.0}} before dividing.',
          'For {{topK}}, build a temporary list holding only the candidates that score > 0.0 (id and score), sort that list with {{Double.compare}} by descending score and then {{compareTo}} by id when the scores tie.',
          'Do not modify {{docs}} and do not return the {{subList}} of an internal list: finish with {{new ArrayList<>(list.subList(0, Math.min(k, list.size())))}}.',
        ],
        explain: `### Solution
- One loop that computes both the numerator and the denominator is enough and avoids the error of two passes. The guard "norm equals 0 -> 0.0" is precisely what keeps the result **sortable**: let a NaN through and every comparison against NaN returns false, the top-k order becomes random, and that bug is extremely hard to reproduce.
- Separating "the list of candidates scoring > 0" from "sort then cut at k" makes the function easy to test and easy to extend with a threshold (later you only change the filter condition to {{score >= minScore}}).
- Breaking ties by id is a form of **determinism**: the same input always yields the same order, whether the map is a HashMap or the insertion order changed. It is also the precondition that makes your evals and regression tests mean anything.

### Common mistakes
- Forgetting the {{a.length != b.length}} check: a loop over the length of a reads past the end or skips dimensions, so the score is softly wrong without any error.
- Comparing scores with {{b.score - a.score}} inside the comparator: with floats the subtraction can overflow or lose precision and it violates the comparator contract (asymmetric once NaN appears) -> {{IllegalArgumentException: Comparison method violates its general contract}}. Use {{Double.compare}}.
- Returning {{List.subList(...)}}: that view still holds on to the original list, so editing it corrupts the caller's data.
- Filtering permissions after taking top-k: the first 5 hits are blocked documents, only 1 survives the filter, and the user gets a "no documents" answer.

> Senior tip: once you are past 100k+ chunks, do not compute cosine for every chunk inside the JVM. Push the metadata filter + top-k down into the vector store (pgvector {{<=>}} with an HNSW index, OpenSearch kNN) and bring back only the k candidates. On the Java side, keep vectors as {{float[]}} or quantised {{byte[]}} instead of {{double[]}}: 2-4x less memory, friendlier to the CPU cache, and the precision is still enough.`,
      },
    ],
    check: [
      {
        q: 'Why does a chunk usually overlap the chunk that follows it?',
        options: [
          'To make the index larger and lookups faster',
          'To raise the cosine similarity of every question',
          'So that any idea sits whole inside at least one chunk instead of being cut in half at the boundary',
          'Because the embedding model requires each vector to partly repeat the previous vector',
        ],
        explain: `Overlap (typically 10-20% of the chunk size) exists so that a piece of information lying across the boundary of two chunks still appears **in full** inside one chunk. Without it, both chunks contain only half the idea, so the match is fuzzy and the chunk drops out of top-k. The other options are wrong: overlap makes the index **bigger and slower**, not faster; it does not systematically raise similarity; and embedding models place no requirement on the relationship between vectors.`,
      },
      {
        q: 'The cosine similarity between a = [1, 2] and b = [2, 4] is approximately:',
        options: ['10.0', '0.5', '0.71', '1.0'],
        explain: `It is **1.0**: a·b = 2 + 8 = 10, |a| = 2.236, |b| = 4.472, the product of the lengths = 10, so cos = 10/10 = 1.0. The two vectors are proportional, therefore they point in the same direction. "10.0" is what you get when you forget to divide by the lengths (a raw dot product); "0.5" and "0.71" come from dividing by the wrong denominator (forgetting the square root, or dividing by the length of only one vector).`,
      },
      {
        q: 'Your documents contain the right chunk with the answer, but it does **not** appear among the top-50 candidates. What should you fix first?',
        options: [
          'Raise k to 200 so that the chunk is certainly included',
          'Add a re-ranker to reorder the 50 candidates',
          'Fix the chunking and the embedding (chunk size, overlap, move to hybrid search)',
          'Switch to a larger, more powerful LLM',
        ],
        explain: `The right chunk missing from the top-50 means the **recall** of the retrieve step is poor: the problem is in how you cut and how you embed, so fix chunking/embedding and add keyword search (BM25) for exact phrases. Raising k to 200 only hides the fault — it bloats the prompt, wastes tokens and causes "lost in the middle"; a re-ranker can only reorder what was already retrieved, it cannot produce a result that was never retrieved; a bigger LLM knows nothing about the retrieve step.`,
      },
      {
        q: 'What is the "lost in the middle" effect in RAG?',
        options: [
          'The model loses the middle part of a document when embedding it',
          'The model pays more attention to the start and the end of the context than to the middle, so a key chunk placed in the middle is easily ignored',
          'The vector store returns incomplete results while the index is still building',
          'Chunk overlap destroys the context in the middle of the document',
        ],
        explain: `It is a positional bias of the model on long context: information at the beginning or at the end of the prompt is used better than information in the middle. The practical consequence: stuffing 20 chunks both dilutes the signal and can drop the right chunk into the ignored region — so keep k small, put the best chunk first, and re-rank. The remaining options describe indexing or chunking faults, not the "lost in the middle" effect.`,
      },
    ],
  },
});
