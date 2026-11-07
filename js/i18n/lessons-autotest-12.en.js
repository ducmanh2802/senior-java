/*
 * English translation of js/data/lessons-autotest.js — task T770. Format: js/core/i18n.js (content overlay).
 * ids: lesson-autotest-014
 */
App.i18n.content({
  'lesson-autotest-014': {
    title: 'Visual regression: screenshot comparison with a baseline, pixel diff, thresholds, mask regions, and sources of flakiness',
    goals: [
      'Explain how an image is represented in a computer (pixels, RGB, packed integers) and why comparison must be done per channel',
      'Distinguish a per-pixel threshold (maxDiffPixels), a ratio threshold (maxDiffPixelRatio), and a color intensity threshold (tolerance)',
      'Write a mask region for dynamic data without hiding real defects',
      'Name at least five causes of flaky visual tests and the matching fix for each',
      'Design a baseline workflow: who approves, where it is stored, and when it is updated',
    ],
    body: `**Summary:** **Visual regression testing** answers a question that ordinary assertions cannot reach: "does the page **look different**". The method: take a screenshot of a known state, save the approved version as the **baseline** (the reference image), take another screenshot on later runs, and **compare it pixel by pixel** with the baseline; if the difference exceeds a threshold, the test FAILs and produces a diff image that highlights the changed areas. It catches a CSS bug that makes a button overlap another element, a missing icon, a font falling back to the system font, or a table overflowing — things that {{isVisible()}} and {{toHaveText()}} stay completely silent about. The price is **flakiness**. Small differences in fonts, anti-aliasing, or dynamic data all produce different pixels, so the whole art of visual testing lies in **thresholds**, **mask regions**, and the **stability of the rendering environment**.

### An everyday example
You print a promotional flyer. Compare this week's print to last week's: if the entire headline is shifted by 3 mm, your eye spots it immediately, but if a **single word** in the footer changes font, you would have to inspect it for a long time. A machine does the opposite: it can count "5,312 different pixels, clustered in the lower-left corner" in 20 milliseconds, but it **does not know** whether the smaller text was intentional or a defect. That is why the workflow always includes a human pressing "approve" for a legitimate change, and that person must look at the diff image, not at a PASS message.

### How an image is represented in a computer
A **pixel** = a picture element, the smallest square a screen can display. Each pixel stores three **color channels**: red, green, and blue, each an integer from 0 to 255. A compact form often used in code: a 24-bit integer, commonly written in hex as {{0xRRGGBB}} — the red channel occupies the highest 8 bits (bits 16-23), green bits 8-15, and blue bits 0-7. For example {{0xFF0000}} is pure red, {{0xFFFFFF}} is white, and {{0x000000}} is black.

~~~java
int px = 0xFF8800;                      // orange: R=255, G=136, B=0
int r = (px >> 16) & 0xFF;              // shift 16 bits then take the low 8 bits
int g = (px >> 8) & 0xFF;
int b = px & 0xFF;
// Compare two images: differ per channel, not as a 24-bit integer
int dr = Math.abs(ra - rb);             // R = 255 vs 250 -> dr = 5
int maxDiff = Math.max(dr, Math.max(dg, db));
boolean different = maxDiff > tolerance; // tolerance = the accepted intensity
~~~

**Tolerance** (an intensity threshold, per channel) is different from the **number of pixels allowed to differ**. These two concepts are often confused, and both major tools have them:
| Threshold type | Meaning | Use when |
|---|---|---|
| {{tolerance}} / {{colorThreshold}} (0-255 per channel) | a pixel is considered **the same** even if its color shifts slightly | anti-aliasing, JPEG/PNG compression, subpixel |
| {{maxDiffPixels}} (pixel count) | allow a **number** of pixels to differ entirely | an image with a few specks of noise |
| {{maxDiffPixelRatio}} (0-1) | allow a **ratio** of pixels to differ, e.g. 0.01 = 1% | a suite running on screens of different sizes |

Recent Playwright Java versions provide the assertion {{Assertions.assertThat(page).hasScreenshot("checkout-cart", options)}} with {{setThreshold}}, {{setMaxDiffPixelRatio}}, {{setMaxDiffPixels}}, {{setMask}}, {{setClip}}, and {{setOmitAnimations(true)}}; {{page.screenshot(new Page.ScreenshotOptions().setPath(...).setFullPage(true))}} is available in any version. If you are on an older version or want full control, run a CLI tool ({{reg-cli}}, {{BackstopJS}}) or **write a comparator yourself like in the exercise** — write it once and you understand it forever.

### Why fonts and anti-aliasing produce results that flip between green and red
**Anti-aliasing** (removing jagged edges): to make the edges of text or diagonal lines look smooth, the browser paints the border pixels with a color **between** the text color and the background, based on the **fractional** position of the glyph stroke relative to the pixel grid. Shift that position by just 0.2 pixels and dozens of border pixels change color — even though a human eye sees no difference. Things that shift that position:
- **A different font file or a different text-rendering system**: CI uses a Docker {{node:20}} image without the dev machine's fonts → the browser falls back to a **fallback font**, and every character changes shape. This is the number-one source of flakiness.
- **Font hinting / subpixel rendering** differs between Windows, Linux, and macOS; and between {{antialiased}} and {{subpixel-antialiased}} in CSS.
- **Device scale factor (DPR)**: a screenshot at DPR 1 and DPR 2 has a completely different pixel count.
- **Content that changes length**: the number {{1.234}} becoming {{9.876}} widens a cell by one character and shifts the whole line → the diff spreads into unrelated areas.
- **Animations, transitions, a blinking cursor in an input, an auto-rotating carousel, or a lazy-loaded image that is not finished** — a capture at 300 ms differs from one at 900 ms.
- **The scrollbar**: content taller than the viewport adds or removes a scrollbar, shifting the entire layout by 15 pixels.
- **A clock / a random session / real ads** on the page.

How to handle it, in order of effectiveness: (1) run the **same Docker image** both when creating the baseline and when comparing; (2) install fixed fonts in the image (use {{fc-list}} to verify); (3) disable animations ({{prefers-reduced-motion}} or {{setOmitAnimations(true)}}); (4) lock the data: the same seed, mock the API (previous lesson) so numbers do not change; (5) {{page.waitForLoadState('networkidle')}} and wait for web fonts ({{document.fonts.ready}}) before capturing; (6) mask the regions that still remain dynamic; (7) set a reasonable tolerance instead of 0.

### Mask regions: hide dynamic data, do not hide real defects
A **mask** (also called an ignore region) is a rectangle {{x, y, w, h}} in pixel coordinates that the comparator **ignores completely** — it is not counted toward the number of different pixels, nor toward the total number of pixels compared.

~~~text
+--------------------------------------+
| Product             Price    [X]     |   <- mask the avatar + the logged-in user name
|--------------------------------------|
| O-1    Ao Thom      199.000   12/11  |   <- mask the "order date" column (dynamic even with a mock)
| O-2    Hat  <- mask the price label generated by PROMOTION
~~~

Two techniques for defining a mask region, with different trade-offs:
- **Hard-coded coordinates** ({{setClip}} / mask by pixel): simple, but breaks as soon as the layout shifts by 10 pixels.
- **Mask by element** ({{locator("...")}}, as Playwright accepts a {{Locator}} in {{setMask}}): follows the element and survives layout changes, but the element needs a {{data-testid}}.

Principle: keep the mask **as narrow as possible**. Masking an entire table block because "one column changes" often hides a missing-column defect as well. If the dynamic area is too large, the problem lies in the **data**, not in the visual test — mock it ({{page.route}}) instead of masking it.

### The baseline workflow: the "operational" part that decides success
~~~seq
title: One visual regression round
actors: Test | Browser | Engine | Baseline
Test -> Browser: open the page with mocked data
Test -> Browser: wait for network idle and fonts ready
Browser --> Engine: PNG image of the screen
Engine -> Baseline: read the reference image approved last time
Baseline --> Engine: baseline PNG from the same Docker image
Engine --> Test: if pixels over threshold then FAIL
Engine -> Baseline: write the diff image and the new image for review
note Engine..Baseline: an approver can replace the baseline
~~~

Three decisions must be written down in the team: **who may update the baseline** (not every QA, because the updater could "turn off the lights" to make CI green); **where the baseline is stored** (git + Git LFS, or object storage versioned by UI release — storing it in D:\\tmp means it is lost when the runner dies); and **where the diff is viewed** (a CI job publishes the actual/baseline/diff images to a report, otherwise no one reads a FAIL). When a legitimate FAIL is approved, attach it to the **commit/PR ID** that caused the change — later this is how you answer "since when did this change the UI".

### When a visual test is worth it, and when it is not
| Situation | Conclusion |
|---|---|
| Marketing pages, a design system, email templates, charts | **very worth it**: a visual defect is a product defect |
| A screen with too much dynamic data that cannot be mocked | not worth it: you would mask more than you compare |
| Core business flows (payment, ordering) | use DOM assertions; a visual capture is only extra evidence |
| A small team, CI without a standard rendering image | not yet: a baseline created on a dev machine will turn red on CI |
| A deliberate large CSS refactor | run it **once** to prove "nothing changed beyond intent", then stop |

### Four common mistakes
- **Tolerance = 0** "to be absolutely safe". Result: the suite turns red because of fonts, and people disable the suite. A threshold of 0 only works when the baseline and the actual are produced by the same frozen Docker image.
- **Create the baseline on a dev machine, compare on CI** — two systems render fonts differently, and you just bought a detector for... operating systems.
- **Compare full-size images when the scroll position differs**: an image captured with {{setFullPage(true)}} is completely different from a viewport-only image; choose one fixed mode for both the baseline and the comparison.
- **Approve a diff without looking at the image**, just to make CI green. Every approval is you agreeing "this UI is correct" — treat the diff like a code review.
- **Mask by coordinates and then refactor the layout**: the old mask now covers a different area, and defects slip through silently. Prefer masking by element.

### Interview notes
- "How does visual regression work?" → baseline + pixel diff + threshold + human approval; be able to say that anti-aliasing is why a threshold is needed.
- "Your tests often fail because of fonts, how do you handle it?" → freeze the environment (a shared Docker image for both baseline and run), install fonts, disable animations, lock data with mocks, use narrow masks, and set a tolerance with evidence (measure over 20 stable runs before choosing it).
- "What is a reasonable threshold?" → there is no magic number: for a static screen, a small {{maxDiffPixels}}; for a list with data, a {{maxDiffPixelRatio}} of a few percent; it must be based on the diff distribution of **clean** runs.
- "Maintenance cost?" → every UI change is a baseline approval; that is a real cost, and the reason visual tests live best on a design system / pages with high stability.

> Senior tip: enable visual testing **together with** a semantic assert on the same state (for example "the table has 3 rows, the total is 199.000"). Visual answers "does it look different", DOM answers "is the data correct"; with both, when it FAILs you know immediately whether to look for a CSS dev or an API dev. A second tip: store the **diff image** (the changed area painted red) as an artifact, not just a number — a reviewer understands the defect in 3 seconds instead of opening two PNGs to inspect.`,
    exercises: [
      {
        title: 'PixelDiff: compare two images per color channel, with an intensity threshold + a ratio threshold, mask regions, and a bounding box of the changed area',
        prompt: `Write {{PixelDiff}} — the image comparator for visual regression, working on two-dimensional arrays of packed color integers {{0xRRGGBB}}. Do not read files, do not use an image library, do not call the network, and do not read real time.

**How to view an image**: {{int[][] a}} has {{a.length}} rows and {{a[0].length}} columns (a rectangular image), each element is a pixel in the {{0xRRGGBB}} form (any bits above bit 23 are ignored). The red channel sits in the highest 8 bits of the 24 bits (bits 16-23), green in bits 8-15, and blue in bits 0-7.

**Conventions of this exercise** (follow them exactly, do not change them):
- **Two images of different sizes** are compared on a grid {{rows = max(a.rows, b.rows)}}, {{cols = max(a.cols, b.cols)}}. A pixel that lies outside the corresponding image is treated as **black background** {{0x000000}}. (In practice tools fail immediately on a size mismatch; here we use the black-background convention for simplicity so the comparator still returns numbers.)
- A pixel is considered **different** if {{max(|dr|, |dg|, |db|) > channelTolerance}}. Compare **each channel separately**, not the 24-bit integer, and do **not** sum them.
- {{masks}} is an array of {{int[]}} values, each with 4 numbers {{x, y, w, h}} in pixels: {{x}} is the **column**, {{y}} is the **row**. Any pixel inside **any** mask is ignored completely: not compared, and not counted in {{compared}}.
- A negative {{x}} or {{y}}, or a {{w}}/{{h}} that extends beyond the image: the overflow is clipped, i.e. the mask is clamped to fit the grid. A negative or {{0}} {{w}} or {{h}} = an empty mask. A {{null}} mask = no region.

**1) Class {{PixelDiff.Report}}** (this is the return type; write it fully because the grader needs it): constructor {{Report(int compared, int changed, double ratio, boolean pass)}}, four getters {{compared()}}, {{changed()}}, {{ratio()}}, {{pass()}}, and {{toString()}} printing in the form {{compared=4 changed=1 ratio=0.25 pass=false}}.

**2) {{static Report compare(int[][] a, int[][] b, int channelTolerance, double maxDiffRatio, int[][] masks)}}**:
- {{compared}} = the number of pixels brought into comparison (i.e. **not** inside a mask) on the common grid.
- {{changed}} = the number of those pixels that differ by the channel rule above.
- {{ratio}} = {{changed / compared}} as a real number; if {{compared == 0}} then {{ratio = 0.0}}.
- {{pass}} = {{true}} when {{ratio <= maxDiffRatio}}, with a rounding tolerance of {{1e-9}}.

**3) {{static int[] diffBounds(int[][] a, int[][] b, int channelTolerance, int[][] masks)}}**: the smallest rectangle that **encloses all different pixels (with masked regions ignored)**, returned as an array of 4 integers in the order {{x}}, {{y}}, {{w}}, {{h}} ({{x}} = smallest column, {{y}} = smallest row). If no pixel differs, return {{4 integers all equal to 0}}.

Example:

~~~text
a = 2x2 all 0xFFFFFF (white)
b = like a but b[1][0] = 0xFF0000 (red)

compare(a, b, 0, 0.0, null)                      -> compared=4 changed=1 ratio=0.25 pass=false
compare(a, b, 0, 0.25, null)                     -> pass=true  (ratio exactly equals the threshold)
compare(a, b, 0, 0.0, new int[][]{{0,1,1,1}})    -> compared=3 changed=0 pass=true (the red pixel was masked)
diffBounds(a, b, 0, null)                        -> {0, 1, 1, 1}
diffBounds(a, a, 0, null)                        -> {0, 0, 0, 0}
~~~

Traps: if you compare the raw {{0xRRGGBB}} value with {{!=}} then {{channelTolerance}} becomes meaningless, and every smallest anti-aliasing change becomes a FAIL. If you count masked pixels in {{compared}} then the {{ratio}} of an image with a dynamic region is artificially larger than reality and the test turns red for no good reason.`,
        hints: [
          'Turn the masks into a {{boolean[][]}} grid of {{rows x cols}} and just query {{masked[r][c]}}. This naturally handles overlapping masks (setting {{true}} twice is still one masked pixel) and masks that extend beyond the image ({{Math.max(0, x)}} / {{Math.min(cols, x + w)}}).',
          'Extract a {{pixelAt(img, r, c)}} method that returns {{0}} when {{r}} or {{c}} is outside the image. With it, "two images of different sizes" needs no separate branch: the common grid {{max(rows)}} and the missing part automatically become black background.',
          'Extract a {{different(a, b, r, c, tol)}} method using {{Math.abs(((p >> 16) & 0xFF) - ((q >> 16) & 0xFF))}} for the red channel, similarly for green and blue, then take the {{Math.max}} of the three results and compare **greater than** ({{>}}) the threshold. Comparing {{>=}} fails the "difference exactly equals the threshold" case.',
          '{{compare}} and {{diffBounds}} share almost everything — have both call the same loop unless you want to repeat bugs. In {{diffBounds}}, track {{x1 = min(column)}} and {{y1 = min(row)}}, {{x2 = max(column)}}, {{y2 = max(row)}}; remember {{x}} is the **column** while {{y}} is the **row** in the spec.',
          'Place the 4-zero return when {{x2 < 0}} **after** the loop: an initial value of {{Integer.MAX_VALUE}} leaking out cannot be distinguished from a real result by the reader.',
          'Compute {{ratio}} with {{changed / compared}} where one operand is a {{double}} — dividing two integers truncates the fraction and makes every ratio threshold meaningless.',
        ],
        explain: `**Three numbers, three different questions.** {{channelTolerance}} answers "can these two colors be considered **the same**" (against anti-aliasing), {{changed/compared}} answers "**how much** of the page changed", and {{pass}} answers "is it over the accepted limit". The fatal ordering mistake: if you compare the raw 24-bit value with {{!=}} then tolerance disappears and a pixel off by 1/255 becomes "different"; if you count masked pixels in {{compared}} then {{ratio}} drops artificially and a screen with more dynamic regions is more likely to "PASS by luck". Both produce a green CI that means nothing.

**Why "black background" for a size mismatch is still dangerous.** The exercise convention makes a {{2x2}} white image compared with a {{3x3}} white image yield {{changed = 5}} — the comparator detects the size mismatch by itself. But if both images are **black** and differ in size, {{changed}} will be {{0}} and the test **PASSes** even though the layout is broken. That is exactly right, and it is exactly why every real tool (Playwright, BackstopJS, reg-cli) compares **size first** and fails immediately on a mismatch without counting pixels. Saying this in an interview shows you understand the limits of the algorithm, not just the formula.

**{{tolerance}} is not a place to "let things slide".** A reasonable number comes from **measurement**: run the same build, the same data, 20 times, and take the distribution of the pixel difference between those captures — that is the background noise of the environment. The threshold should sit slightly **above** that noise. Setting 0 on an environment with unfrozen fonts means you have bought a detector for... when the browser feels inspired.

**The bbox ({{diffBounds}}) is what turns a FAIL into information.** The number {{changed = 312}} helps no one; "the diff is in the region (x=180, y=42, 320x48)" says immediately: that is the header. Real tools draw the diff image with exactly this idea — paint the changed area red, and QA can tell at a glance whether to call a CSS dev or ask why the logo image changed. Your {{diffBounds}} ignores pixels inside masks, because otherwise a masked dynamic region would inflate the bbox and hide the location of the real defect.

**The {{1e-9}} detail.** {{0.1 + 0.2 != 0.3}} in floating-point numbers; a raw {{ratio <= maxDiffRatio}} comparison can fail right at the threshold you computed carefully. Adding a small epsilon is the standard way to express "less than or equal" when the number comes from a division.`,
      },
    ],
    check: [
      {
        q: 'Why does visual regression need a threshold (tolerance) instead of comparing images pixel-perfectly?',
        options: [
          'Because PNG images do not store enough colors',
          'Because anti-aliasing and font hinting make the border pixels of text change color very slightly across renders, even when a human eye sees them as identical',
          'Because comparing pixels is too slow, so the number of pixels to compare must be reduced',
          'Because Playwright does not allow comparing a whole image',
        ],
        answer: 1,
        explain: 'Text is rendered with intermediate colors at stroke edges, depending on the fractional position of the stroke relative to the pixel grid; a shift of just 0.2 pixels changes dozens of border pixels. A per-**channel intensity** threshold lets those shifts pass while real differences (a color change, a missing element) are still caught.',
      },
      {
        q: 'How do {{maxDiffPixels = 500}} and {{maxDiffPixelRatio = 0.01}} differ when a suite captures both small and large screens?',
        options: [
          'No difference, they are just two names',
          'An absolute threshold treats every screen the same; a ratio threshold allows a large screen to differ by more pixels',
          'A ratio threshold is always stricter than an absolute threshold',
          'An absolute threshold only works when there is a mask region',
        ],
        answer: 1,
        explain: '500 pixels on a small modal is a lot, on a full-page screenshot it is very little. A ratio (0.5%, 1%) scales with the size, so it fits a suite with screens of different sizes; an absolute threshold fits when you want "no more than N points may change" on a fixed component.',
      },
      {
        q: 'A table column that shows the current date/time keeps turning the test red. Which is the **best** way to handle it among these?',
        options: [
          'Mask the whole table so nothing shows',
          'Lock the data with a mock API or a fixed clock for that column, and only mask what truly cannot be locked',
          'Set {{maxDiffPixelRatio = 0.2}} to make it pass',
          'Remove the visual test for that screen',
        ],
        answer: 1,
        explain: 'The problem lies in the **data**, not in the comparator. Masking the whole table also removes the ability to detect a column defect (a missing column, broken padding). Raising the threshold to 20% lets almost any layout defect slip through. Lock the data source first, then mask only what remains.',
      },
      {
        q: 'A baseline created on a QA Windows machine turns red across the board when CI runs on a Linux container, even though the code did not change. What is the most plausible cause?',
        options: [
          'CI is slow so the image did not finish loading',
          'The two environments render glyphs differently: different fonts (or a missing font → fallback), different hinting/subpixel rendering, different scrollbar width',
          'PNG files should not be stored in git',
          'Visual regression cannot be used with Docker',
        ],
        answer: 1,
        explain: 'This is the classic visual-testing failure. Fix: generate the baseline **with the exact same image used to run the tests** (store the artifact, not on a personal machine), install fixed fonts in the image, and lock the device scale factor and capture mode (viewport vs full-page).',
      },
    ],
  },
});
