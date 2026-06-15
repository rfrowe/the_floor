# Sample Category Analysis — Prompt Guidance for LLM Studio

**Purpose:** Phase 12 ("LLM Studio") generates new game categories with OpenAI. To make *generated*
categories feel like the hand-made ones, this document analyzes the 20 sample categories shipped by
Task 50 and distills concrete, copy-pasteable directives for the three Studio generators:

- **Category names** → `src/services/openai/categoryNames.ts`
- **Card ideas** (answer + `imageKeywords` + `imagePrompt`) → `src/services/openai/cardIdeas.ts`
- **Images** (future) → `src/services/openai/images.ts` (Task 58)

**Source data:** `public/categories/*.json` (20 files). Each file is `{ category: { name, slides: [...] }, metadata: null }`.
Each slide is `{ answer, censorBoxes, imageUrl }` — **no `imagePrompt`/`imageKeywords` exist in the samples**
(those fields are introduced by the Studio's `cardIdeas.ts`). The `imageUrl` values are base64 data URLs and
were **not** decoded; all image-clue inference below is derived from the `answer` text plus the category theme.

**Corpus size:** 20 categories, 969 non-empty answers (~48 per category). A handful of categories carry one
intentionally-blank answer slide (a title/intro slide): Baseball, Bears, Nathan Fielder, Sea creatures.

---

## Summary table

| Category | Slides | Theme | Humor tone | Lateral % | Non-expert guessability |
|---|---:|---|---|---:|---:|
| Baseball | 50 | MLB players, teams, stadiums, ephemera, baseball-in-film | Earnest fan, light | ~10% | High (~75%) |
| Batman villains | 50 | Comic/film villains + actors who played them | Playful fandom | ~25% | Medium (~55%) |
| Bears | 50 | Anything "bear" — animals, brands, mascots, puns, homophones | Punny, irreverent | ~70% | High (~80%) |
| Biochemistry | 41 | Lab equipment, molecules, techniques + sci films | Deadpan/nerdy | ~15% | Medium (~50%) |
| Cars! | 50 | Real models + famous fictional movie/TV cars | Playful | ~30% | High (~70%) |
| Clouds | 45 | Cloud types + tech "clouds" + fictional clouds (heavy pun) | Punny, meme-y | ~75% | High (~80%) |
| Dogs | 52 | Breeds + famous fictional dogs | Wholesome, light | ~25% | High (~80%) |
| Football | 50 | NFL players, teams, coaches, mascots, ephemera + cartoons | Earnest fan, light | ~15% | Medium-high (~65%) |
| Game of Thrones | 50 | GoT characters/houses/places + board games (the "games") | Playful fandom | ~30% | Medium (~50%) |
| Halo characters | 43 | Deep-cut Halo characters + homophone gags (Buddha, goku) | Deep fandom + sneaky puns | ~20% | Low (~25%) |
| Kitchen equipment | 50 | Pro/specialist cooking tools | Deadpan/nerdy | ~5% | Medium (~55%) |
| Mascots | 50 | Pro sports mascots (NFL/NBA/NHL/MLB) | Wholesome, niche | ~5% | Low (~20%) |
| Minecraft | 50 | In-game items/mobs + craft puns + movie cast | Punny, meta | ~40% | Medium-high (~60%) |
| Musical instruments | 50 | Real instruments + joke "instruments" + homophones | Punny, irreverent | ~30% | High (~75%) |
| Nathan Fielder | 41 | Comedian's shows, bits, collaborators, recurring gags | Niche, deadpan | ~50% | Low (~25%) |
| NBA Players | 50 | Players + basketball-pun shows + sneakers | Playful fandom | ~25% | Medium (~55%) |
| Sea creatures | 50 | Marine animals + a few fictional sea characters | Wholesome, light | ~20% | High (~80%) |
| Taylor Swift | 51 | Albums, songs, exes/collaborators, lore, cats | Fan-lore-heavy | ~45% | Medium (~55%) |
| The Real Housewives | 50 | Cast members + franchise cities + brand spinoffs | Niche fandom | ~30% | Low (~30%) |
| Trees in pop culture | 50 | Famous fictional/real trees + "tree/wood/pine" puns | Punny, clever | ~75% | High (~75%) |

**Corpus headline numbers:** **~30% lateral / ~70% direct**; **~58% non-expert-guessable** (general-audience).

---

## 1. Themes / subject matter

Every category is a single noun-phrase "bucket" broad enough to fill ~40–52 cards. They cluster into four
recurring archetypes, and the strongest sample categories deliberately **blend** archetypes within one bucket:

1. **Concrete real-world taxonomies** — Dogs (breeds), Sea creatures, Musical instruments, Kitchen equipment,
   Biochemistry, Cars, Clouds (cloud types). These read like a field guide: enumerate the members of a
   real-world set.
2. **Pop-culture fandoms** — Batman villains, Game of Thrones, Halo characters, Taylor Swift, The Real
   Housewives, Nathan Fielder, NBA Players, Football, Baseball, Mascots. Enumerate the people/things inside
   one franchise or sport.
3. **Pun / homophone buckets** — Bears, Clouds, Trees in pop culture, Minecraft, Musical instruments. The
   bucket word is a *string* you can match many ways: literal members **plus** brands, memes, and celebrities
   whose names contain or evoke the word.
4. **Hybrids** (the best-feeling ones) — almost every category quietly mixes archetypes. Cars has real models
   *and* the Batmobile, Mystery Machine, DeLorean, Lightning McQueen. Game of Thrones slips in board games
   ("Monopoly," "Risk," "Catan," "Uno" — the *other* "games of thrones"). NBA Players includes "Gnarls
   Barkley," "Full House," "Family Guy." Bears spans real bears, "Bear market," "Berlin," "Berkeley,"
   "Toblerone" (the hidden bear in its logo), and Po/Baloo/Lotso.

**Breadth & common threads:** themes skew **general-pop-culture and everyday-object** rather than academic.
Even the "nerdy" ones (Biochemistry, Kitchen equipment) are about *recognizable physical objects*. The common
thread is **visual concreteness**: every member can be photographed or drawn as a single recognizable image.
Avoid abstractions that can't be pictured (emotions, dates, statistics).

---

## 2. Tone of humor

The voice is **playful, clever, and pop-culture-literate — never edgy or mean.** Humor comes from *clever
connections* (puns, homophones, "wait, that counts?" lateral picks), not from shock. Concrete signals:

- **Pun / homophone delight** is the signature move:
  - Clouds: `salesforce`, `AWS`, `icloud`, `soundcloud`, `Windows XP` (the wallpaper), `heaven`,
    `Old man yells at cloud`.
  - Trees in pop culture: `Tiger Woods`, `Chris Pine`, `Timberland`, `REI`, `Lebanon` (cedar on the flag),
    `Cascadia`, `Forrest Gump`.
  - Bears: `Berkeley`, `Berlin`, `Bear market`, `Da Bears`, `Charmin bear`.
- **"Wait, that counts?" delight** — the answer is a left-field but fair member of the bucket:
  - Game of Thrones: `Monopoly`, `Ticket to Ride`, `Risk`, `Catan`, `Uno` (board games = "games").
  - NBA Players: `Gnarls Barkley`, `Bull Russell`, plus basketball-adjacent shows (`Space Jam`, `Full House`).
  - Minecraft: `Jack Black`, `Jason Momoa`, `Jennifer Coolidge` (2025 movie cast), plus craft puns
    (`crochet`, `embroidery`, `origami`, `mosaic`).
- **Deadpan joke answers** dropped into otherwise-straight lists:
  - Musical instruments: `mayonaisse` (SpongeBob's "instrument"), `Balloon`, `Viola Davis`, `sexophone`,
    `Boomwhacker`.
- **Wholesome / nostalgic** rather than crude: Dogs (`Toto`, `Snoopy`, `Old Yeller`, `Bluey`), Sea creatures
  (`Ariel`, `Dory`, `Spongebob squarepants`).

**Voice a generated category should match:** *a witty, well-read friend running a pub quiz* — leans into
groan-worthy puns and "oh that's clever" cross-references, keeps it warm and inclusive, and never reaches for
offense. The existing `categoryNames.ts` system prompt already says "Avoid niche jargon, offensive themes" —
keep that and add the punny/clever-connection flavor.

**Casual-spelling note:** the samples contain frequent typos/loose spellings (`Joe Dimmagio`, `sexophone`,
`Restone dust`, `Daenerys Targarian`, `mayonaisse`). These are human authoring artifacts, **not** a style to
imitate — generated answers should be correctly spelled. (The Studio editor lets a human fix anything anyway.)

---

## 3. Lateral-thinking frequency — **~30% lateral / ~70% direct**

"Direct" = the image shows the obvious subject and you name it ("photo of a Husky" → "Husky"). "Lateral" = you
must reason indirectly: a pun, a logo, a meme, a representative scene, a person standing in for a concept.

- **Direct (~70%)** — the dominant mode. Examples: Dogs `Irish setter`, `Beagle`, `Corgi`; Sea creatures
  `anglerfish`, `octopus`, `narwhal`; Kitchen equipment `whisk`, `wok`, `mandoline`; Musical instruments
  `violin`, `tuba`, `harp`; Cars `Maserati`, `Porsche 911`; NBA `LeBron James`, `Steph Curry`.
- **Lateral (~30%)** — concentrated in the pun buckets and lore-heavy fandoms. Examples:
  - Homophone/pun: Clouds `salesforce`/`icloud`; Trees `Tiger Woods`/`Chris Pine`/`Lebanon`; Bears
    `Berkeley`/`Bear market`; Musical instruments `mayonaisse`.
  - Logo/brand-mark: Bears `Toblerone` (bear in the Matterhorn), `Charmin`; Trees `Canadian flag`,
    `Timberland`.
  - Representative scene/prop stands in for the answer: Baseball `Moneyball`/`The Sandlot`/`A league of their
    own` (films), `crackerjack`/`Peanuts`/`Organ` (ballpark ephemera).
  - Person-for-concept: Batman villains lists **actors** (`Heath Ledger`, `Margot Robbie`, `Danny Devito`)
    alongside the villains they played — the clue is the actor, the lateral leap is the role.

**Per-category spread:** pun buckets (Bears, Clouds, Trees) run ~70–75% lateral; taxonomies (Dogs, Sea
creatures, Kitchen equipment, Mascots) run ~5–25% lateral. Generated categories should **match the mode to the
theme**: a "field-guide" theme should stay mostly direct; a pun-bucket theme should be mostly lateral.

---

## 4. Guessability by non-experts — **~58% general-audience-guessable**

The samples are pitched mostly at **general-audience knowledge**, but a meaningful minority reward deep fandom.
The good news for guessability: even lateral answers are usually *fair* because the pun/reference is famous
(everyone knows `salesforce`, `Tiger Woods`, the Windows XP hill).

- **High guessability (~70–80%)** — most categories. A non-expert with a good visual clue can land the answer:
  Dogs, Sea creatures, Bears, Clouds, Trees, Musical instruments, Cars, Baseball. These reward *broad cultural
  literacy*, not specialist knowledge.
- **Low guessability (deep-fandom)** — four categories punch above general knowledge and serve as the **floor**
  you should rarely go below:
  - **Mascots** (~20%): `Lou Seal`, `Gritty`, `Steely McBeam`, `Stuff the Magic Dragon` — needs fan knowledge
    of *specific* team mascots.
  - **Halo characters** (~25%): `Serin Osman`, `05-032 Mendicant Bias`, `Rtas 'Vadum`, `Pavium` — deep-cut
    even for fans; leavened by sneaky homophones (`goku`, `Buddha`, `Casper`).
  - **Nathan Fielder** (~25%): `The Hunk`, `Summit Ice`, `The Movement` — bits only fans of his shows recognize.
  - **The Real Housewives** (~30%): `Vicky Gunvalson`, `Heather Gay`, `Sonja Morgan` — franchise-specific cast.

**Implication for generation:** target categories that a smart general audience can *mostly* play, with a long
tail of "for the fans" answers. Don't generate a whole category whose answers are all deep cuts — that's the
Mascots/Halo failure mode (fun for superfans, alienating for everyone else). Within a category, a ~20% sprinkle
of obscure deep-cuts is on-brand; a majority of them is not.

---

## 5. Answer style

Measured across all 969 non-empty answers:

- **Length:** 36% one word, 51% two words, 8% three words; only ~4% exceed three words. **Answers are short —
  aim for 1–3 words, two words being the sweet spot.** Longer answers exist only when the canonical name is long
  (`Cavalier King Charles Spaniel`, `Sandor Clegane/The Hound`).
- **Proper vs common nouns:** mixed, theme-dependent. Fandom/sport categories are almost all **proper nouns**
  (`Babe Ruth`, `Khal Drogo`, `Taylor Swift`). Taxonomy categories are mostly **common nouns**
  (`whisk`, `octopus`, `cumulus clouds`). Pun buckets mix both freely.
- **Specificity:** answers name *the* canonical thing, often with a year/qualifier when it matters:
  `1967 chevy impala`, `Red (Taylor's Version)`, `Ferrari 488`, `Spartan-B312 (Noble 6)`.
- **Alias handling:** common nicknames are folded into one answer with parentheses or slashes:
  `David Ortiz ("Big Papi")`, `Alex Rodriguez (A-Rod)`, `Lab(rador retriever)`, `(Moray) eel`,
  `Shaq(uille O'Neal)`, `Little Finger/Lord Baelish`. This signals acceptable alternate guesses to the human
  host — a useful pattern for generated answers (put the primary name first, alias in parens/slash).
- **Capitalization is loose** in the samples (`baseball`, `cirrus`, `whisk` lowercase; proper nouns
  capitalized). Generation should use clean, consistent capitalization (sentence/title case as appropriate);
  the looseness is a human artifact, not a target.
- **No descriptions, no punctuation-as-clue:** an answer is just the name of the thing — never a sentence,
  riddle, or hint. The *image* carries the clue, not the answer text.

---

## 6. Image-clue style (inferred — images were not decoded)

In gameplay the contestant sees **only the image** and must say the answer; **censor boxes** black out any
text in the image that would give the answer away. A good clue image is therefore **instantly recognizable as
the subject but does not spell out the answer.** Inferences and rules:

- **The image depicts the subject literally for direct answers** — a photo/illustration of the Husky, the
  whisk, the octopus. The skill is recognition, not reading.
- **For lateral/pun answers the image depicts the literal referent**, leaving the player to make the leap:
  for Clouds→`salesforce` the image is presumably the Salesforce cloud logo; for Trees→`Tiger Woods`, Tiger
  Woods; for Bears→`Toblerone`, the bar (with its hidden bear). The pun lives in the *connection*, not in
  on-image words.
- **Censor boxes hide giveaway text — and that's the point.** Box counts vary widely (Nathan Fielder 27,
  Bears 15, Game of Thrones 13; several categories 0) — boxes appear specifically when a recognizable image
  carries a brand name, jersey name, logo wordmark, or caption that would hand over the answer. **The right
  lesson for generation: keep that real identifying detail IN the image — it's what makes the subject
  recognizable — and let the censor step black it out during guessing and reveal it on a correct guess or
  skip** (e.g. a Clorox bottle with the logo censored, then revealed). A logo-less, text-free image is often
  generic and *unguessable*.
- **One subject, centered, unambiguous.** Each clue is a single subject filling the frame, not a busy collage —
  the player must identify *one* thing.

> **Policy update (supersedes the earlier "no text in image" recommendation).** We previously told the
> generators to strip all text/logos so censoring could be skipped. That was wrong: it defeats the censor
> mechanic and makes many subjects unguessable. Generated images SHOULD include the subject's real identifying
> detail (logos, branding, labels, signage, jersey names); the censor step hides giveaways during play.

**What generated `imagePrompt`s should aim for:** a vivid, photographic-or-illustrative depiction of the single
subject (or, for puns, the single literal referent), recognizable to a general audience, with the subject
prominent and centered — **including its real identifying text/logos/branding where that aids recognition.**
**What they must avoid:** a gratuitous caption that merely *writes the literal answer word*; multi-subject
collages; abstractions that can't be pictured. The existing `cardIdeas.ts` schema captures the headline rule
("a recognizable subject, depicting its real identifying detail, without an artificial answer caption") — the
directives below refine it.

---

## Prompt-writing guidance

Actionable directives to fold directly into the three generators. The existing `categoryNames.ts` and
`cardIdeas.ts` system prompts (Tasks 55/56) are a good base; these refine tone, difficulty mix, and the
image rules.

### A. Category names — `src/services/openai/categoryNames.ts`

Append to the system prompt:

- **Length/format:** 1–3 words, title-case, a single concrete noun-phrase "bucket." No punctuation except an
  occasional `!` for energy (sample: `Cars!`).
- **Pictureability gate:** the bucket's members must each be depictable as a single recognizable image. Reject
  abstract themes (emotions, dates, statistics, "concepts").
- **Breadth gate:** broad enough to yield ~50 distinct, varied members.
- **Encourage the two winning archetypes:** (1) a *pun/homophone bucket* whose name is a word that can be
  matched many clever ways (e.g. Bears, Clouds, Trees in pop culture); (2) a *concrete taxonomy or single
  fandom* (e.g. Dogs, Sea creatures, Game of Thrones).
- **Voice:** witty pub-quiz host — clever and pop-culture-literate, warm, never edgy or offensive.
- **Example "good" names in the samples' voice:** `Bears`, `Clouds`, `Trees in pop culture`, `Sea creatures`,
  `Kitchen equipment`, `Musical instruments`, `Mascots`, `Game of Thrones`, `Cars!`.

### B. Card ideas (answers + imageKeywords + imagePrompt) — `src/services/openai/cardIdeas.ts`

Append to the system prompt:

- **Answer style:** 1–3 words (target two). Name *the* canonical thing. Use clean, consistent capitalization.
  Fold a well-known alias into the same answer with parentheses or a slash when helpful
  (e.g. `Shaq (Shaquille O'Neal)`, `Little Finger / Lord Baelish`). No descriptions, sentences, or hints in the
  answer — the image is the clue.
- **Difficulty / lateral mix:** roughly **70% direct, 30% lateral**, and *match the mix to the theme* — a
  field-guide theme stays mostly direct; a pun-bucket theme leans lateral. Lateral cards are puns, homophones,
  logos/brand-marks, representative scenes/props, or a person who stands in for a role/concept.
- **Guessability bar:** target answers a smart **general audience** can mostly get from a good image. Even
  lateral answers must be *famous* references (the pun should be widely recognized). Limit deep-fandom obscurities
  to roughly a 20% tail; never make a whole batch out of deep cuts.
- **Variety:** distinct, non-overlapping members; vary subtype (e.g. for a sport: players, teams, coaches,
  trophies, ephemera, the sport in film). Don't return 50 of the same kind of thing.
- **`imageKeywords`:** space-separated, concrete search terms describing the literal thing the image should
  show (for puns, the literal *referent*, not the pun target).
- **`imagePrompt` do's:** describe one subject, centered and prominent, recognizable to a general audience,
  photographic or clean illustration. **Include the subject's real identifying detail — logos, branding,
  labels, signage, jersey/name plates — where it aids recognition** (the censor step hides giveaways during
  play and reveals the full photo afterward). For a pun/lateral answer, prompt the *literal referent* (e.g.
  for `Tiger Woods` → "professional golfer mid-swing on a course," not "a tree").
- **`imagePrompt` don'ts:** don't add a gratuitous caption that just *writes the literal answer word*; no
  multi-subject collages; nothing un-picturable. (Do NOT strip text/logos — that's the censor step's job, and
  removing it makes many subjects generic and unguessable.)

### C. Images — `src/services/openai/images.ts` (Task 58, `gpt-image-1`)

The image is generated from `card.imagePrompt`, so most control lives in directive B. For the image call/prompt
wrapper:

- **Depict exactly one subject**, prominent and centered, instantly recognizable to a general audience as the
  intended thing (or, for a pun, the literal referent the player must leap from).
- **Keep the subject's real identifying detail** — logos, branding, labels, signage, jersey/name plates — where
  it aids recognition. Do **not** strip text/logos: the censor step (Task 59) blacks out giveaways during
  guessing and reveals the full photo on a correct guess or skip, so that detail is desirable and a text-free
  image is often generic and unguessable. A light quality suffix is fine, e.g.:
  `"... A single, clearly-lit, recognizable subject centered in frame."` (No "no text/logos/watermarks" clause.)
- **No collages or split frames** — one subject per image.
- **Don't caption the answer:** avoid an artificial overlay that simply spells out the literal answer word; the
  image should make a knowledgeable player *recognize* the subject from its real appearance.
- **Honest caveat:** `gpt-image-1` renders specific real people, logos, and text imperfectly — surface this to
  the user and let them reroll a single image.

> **Note:** This directive C supersedes the earlier "absolutely no text in the image" recommendation. Text and
> logos in generated images are GOOD; the censor step hides them during play.

---

## Appendix — methodology

- Answers extracted via `jq -r '.category.slides[].answer'` over all 20 files in `public/categories/`
  (images never decoded). Length stats computed over 969 non-empty answers.
- Lateral % and guessability % are the analyst's judgment per category, sampled across each category's answer
  list; corpus headlines are answer-weighted approximations, not exact counts.
- Existing prompt code reviewed for alignment: `src/services/openai/categoryNames.ts`,
  `src/services/openai/cardIdeas.ts`; Task 57/58 PROMPTs for field names (`imagePrompt`, `imageKeywords`) and
  the `gpt-image-1` image path.
