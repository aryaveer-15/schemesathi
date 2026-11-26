# Pass 6 — Help chat and scheme discovery

## Before the changes

I replayed the 20 inputs below against the Pass 5 production build in Chrome at 360 px. The local API returned the 51 catalogue entries. Hindi cases used the Hindi interface. The Hinglish cases used the English interface.

Chat matched exact name phrases and aliases for eight legacy schemes. It showed those schemes' catalogue summaries and links. Three broad keyword groups triggered the eligibility, application or account FAQ. The generic fallback gave no link. Search looked for the entire typed phrase inside each scheme's title, description, category or state, using existing labels from the selected language. It missed longer questions and typos. It also matched parts of unrelated words, such as `house` inside `household`.

| Input | What chat returned | What search returned |
|---|---|---|
| What is the income limit for PM Awas Yojana? | PMAY Urban summary and links | None |
| Am I eligible for PM Kisan if I rent land? | PM-KISAN summary and links | None |
| When is the AICTE Pragati deadline? | Fallback | None |
| How do I apply for Karnataka Shakti? | Application FAQ | None |
| What documents do I need for NPS Vatsalya? | Fallback | None |
| Which scheme helps with a rooftop solar installation? | Fallback | None |
| Is there a scholarship for a student with disabilities? | Fallback | None |
| old age pension | Fallback | None |
| farmer | Fallback | PM-KISAN, PM-KISAN Maan-Dhan, Soil Health Card |
| scholrship | Fallback | None |
| How do I register for an account? | Account FAQ | None |
| scholarship | Fallback | AICTE Pragati, Saksham and Swanath, NMMSS, PM-USP, Swami Vivekananda |
| Can you check my Aadhaar status? | Fallback | None |
| house | Fallback | Odisha CM KISAN, Krishak Bandhu, NMMSS, Surya Ghar, PMAY Gramin, Ujjwala |
| किसान के लिए कौन सी योजना है? | Fallback | None |
| उज्ज्वला में आवेदन कैसे करें? | Ujjwala summary and links | None |
| छात्रवृत्ति | Fallback | NMMSS |
| kisan ke liye kya scheme hai | Fallback | None |
| beti ke liye saving scheme | Fallback | None |
| pm ksan ke liye apply kaise kare | Application FAQ | None |

Chat found a named scheme in 3 cases, used a general FAQ in 3 and fell back in 14. Search returned at least one scheme in 4 cases.

## Behaviour after the changes

- A factual question that names a catalogue scheme gets a scheme-page link, the repo's official URL where available, and the existing statement that the responsible authority makes the final decision. Chat gives application and account navigation from the existing FAQ. It uses a plain-language fallback with a catalogue link when it cannot answer. It fetches the catalogue through the existing API and keeps the text and previous turns in memory while the chat is open.
- Catalogue search matches available names from all supported scripts, tests one-character Latin typos or transpositions, and uses the five synonym groups and name aliases in `client/src/searchTerms.js`. No dependency was added. Query, category and state use `q`, `category` and `state` on the catalogue URL. Back steps through filter selections and each search editing session. The state filter includes nationwide schemes and listings for the selected state.
- Each scheme has a stable slug URL. Existing ObjectId links still resolve. The browser sets the title, canonical URL, description and Open Graph tags using the catalogue and existing banner. It restores the normal title and metadata on navigation away.

I replayed the same 20 inputs against the new matching functions and the repo catalogue. Chat returned named scheme links in 7 cases, discovery suggestions in 7, the account FAQ in 1 and the fallback in 5. Search found listings in 18 cases. The two inputs without search results were about registering and checking Aadhaar status. Housing results contained only the two PMAY variants.

## Tests

The full suites went from 86 to 96 passing server tests and from 68 to 74 passing browser tests. The browser run included axe in English, Hindi and Urdu, and 360 px layout checks for all 11 languages, including right-to-left Urdu. The production build and client lint also passed.

## Mobile performance

Compared the final Pass 5 build with Pass 6 using the same Lighthouse 13.6.0 simulated mobile profile, a 360 × 800 viewport and two fresh Chrome contexts per page. Local Express served production assets and a 51-scheme fixture. The results check submitted a synthetic answer and confirmed the results rendered. LCP for that flow can describe the questionnaire before results appear. Timings are lab measurements, and two runs cannot separate small code effects from normal variation.

| Page | Performance | Accessibility | Best practices | LCP (ms) | CLS | TBT (ms) |
|---|---:|---:|---:|---:|---:|---:|
| Homepage | 100 → 100 | 100 → 100 | 100 → 100 | 766 → 768 | 0 → 0 | 38 → 30 |
| Scheme list | 97.5 → 97.5 | 100 → 100 | 100 → 100 | 2,507 → 2,441 | 0.039 → 0.039 | 5 → 2 |
| PM Surya Ghar detail | 98 → 98 | 100 → 100 | 100 → 100 | 2,412 → 2,416 | 0 → 0 | 15 → 6 |
| Questionnaire | 99 → 99 | 100 → 100 | 100 → 100 | 2,100 → 2,181 | 0 → 0 | 9 → 17 |
| Results flow | 99 → 99 | 100 → 100 | 100 → 100 | 2,106 → 2,184 | 0 → 0 | 17 → 7 |

| Page | JS transfer (kB) | JS decoded (kB) |
|---|---:|---:|
| Homepage | 112.33 → 112.69 | 372.57 → 372.73 |
| Scheme list | 121.39 → 125.06 | 390.41 → 396.01 |
| PM Surya Ghar detail | 122.45 → 123.28 | 390.64 → 391.82 |
| Questionnaire | 123.26 → 123.69 | 390.30 → 390.54 |
| Results flow | 123.26 → 123.69 | 390.30 → 390.54 |

CSS was 5.44 kB transferred and 19.63 kB decoded on every page in both builds. Image transfers also matched. The search module is a separate 2.33 kB gzip chunk shared by the catalogue and chat. The lazy chat chunk grew by 0.37 kB decoded. The project added zero packages. An earlier catalogue run overlapped with browser testing and measured 613 ms blocking time. The two isolated runs each measured 2 ms.

### Direct questionnaire and results loading

Pass 5 already showed a direct-visit LCP increase from roughly 0.91 s to 2.10 s. Pass 6 still measures around 2.18 s for both flows. The network trace shows the entry bundle loads first, then requests the route and shared questionnaire chunks, followed by the questionnaire API. A route-specific `modulepreload` from the Vite build manifest could move those script requests earlier on a cold visit. Authentication, the catalogue of questions and the matcher still run as before. The results use the questionnaire route, so the preload would help the startup shared by both flows and would not fetch any answers or results. This is worth a small controlled trial on slow connections. No preload was added in Pass 6.

## Remaining ways the chat or search can mislead or miss something

- The chat matches a name or alias inside the message. It cannot understand negation, comparisons, multiple questions in one message, or follow-up references such as “what about the first one?”. A shared alias can return multiple schemes, such as PMAY Urban and Gramin. A longer name can take precedence over a second name. Links are navigation, and the app supplies no personal eligibility verdict.
- Broad discovery can return a scheme aimed at a subgroup or a different state. The chat shows up to four suggestions and links to the full catalogue. Curated synonym groups are finite. A related listing can be omitted until its group is updated. Search can prioritize a named scheme even when extra words do not appear in its listing. Search result relevance does not imply that a person qualifies.
- The matcher handles common English and Hindi terms and some Hinglish. Transliteration, spelling variations with several edits, inflected words, short words and some multiword typos can fail. Supported script names are searchable where the repository already has them. The topic and fallback coverage is uneven across languages. The catalogue finds results for “old age pension”, “beti ke liye saving scheme” and “pm ksan ke liye apply kaise kare”, while those prompts fall back in chat. Unreviewed navigation copy uses the existing translation notice.
- Chat points to scheme details for income, age, benefit amounts, deadlines and requirements. Its scheme links can still point to an external page that has moved or changed. This pass did not review external links, current programme status or regional interpretation. Chat can also fall back while the catalogue is still loading or temporarily unavailable. General navigation remains available.
- The catalogue URL includes what someone types directly into the search box. That text can be visible in browser history or when a link is shared. The questionnaire does not feed that box or URL, and chat text stays on the chat page.
- Scheme metadata is visible after the app runs and the scheme request succeeds. The initial HTML contains the generic app shell. Google can render the app, subject to accessibility and indexing of the page. Crawlers or link preview services that only read raw HTML will miss scheme-specific previews. The simplest follow-up is for the existing Express server to inject escaped title, summary, canonical URL and image from the repo into the Vite HTML shell for valid scheme slugs. That needs a confirmed public origin. No sitemap or robots file was generated because the live origin could not be verified.

[Google Search Central guidance on JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
