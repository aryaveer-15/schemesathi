# SchemeSathi Pass 5 review

26 November 2026 · Accessibility and performance

## Lighthouse baseline and final build

Two fresh Chrome 158 contexts per page and build, using Lighthouse 13.6.0, the mobile simulation profile, 360 × 800 CSS px and 2.75 device pixel ratio. The default simulation uses 150 ms RTT, 1,638.4 Kbps download and a 4× CPU slowdown. Tables report the median of two runs. Local Express served each production build with the same synthetic 51-scheme catalogue and the actual matcher. The results flow visits the questionnaire, supplies a synthetic age, submits and waits for visible results. Its LCP describes the flow from navigation and can reflect the questionnaire shell before results appear. The benchmark uses English, fresh browser contexts and a local server. It does not measure MongoDB, Render, a physical phone or real-world latency. [Lighthouse user flows](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md)

| Page | Performance | Accessibility | Best practices | LCP (ms) | CLS | TBT (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 99.5 → 100 | 100 → 100 | 100 → 100 | 909 → 766 | 0.000 → 0.000 | 7 → 38 |
| Scheme list | 82 → 97.5 | 100 → 100 | 100 → 100 | 5,490 → 2,507 | 0.039 → 0.039 | 0 → 5 |
| PM Surya Ghar detail | 88 → 98 | 100 → 100 | 100 → 100 | 3,907 → 2,412 | 0.000 → 0.000 | 0 → 15 |
| Questionnaire | 100 → 99 | 100 → 100 | 100 → 100 | 905 → 2,100 | 0.000 → 0.000 | 0 → 9 |
| Results flow | 100 → 99 | 100 → 100 | 100 → 100 | 905 → 2,106 | 0.000 → 0.000 | 0 → 17 |

| Page | JS transfer (kB) | CSS transfer (kB) | JS decoded (kB) | CSS decoded (kB) | Image transfer (kB) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 406.89 → 112.33 | 19.11 → 5.44 | 406.34 → 372.57 | 18.57 → 19.63 | 1.40 → 1.42 |
| Scheme list | 406.89 → 121.39 | 19.11 → 5.44 | 406.34 → 390.41 | 18.57 → 19.63 | 1156.51 → 114.17 |
| PM Surya Ghar detail | 406.89 → 122.45 | 19.11 → 5.44 | 406.34 → 390.64 | 18.57 → 19.63 | 105.80 → 67.61 |
| Questionnaire | 406.89 → 123.26 | 19.11 → 5.44 | 406.34 → 390.30 | 18.57 → 19.63 | 1.40 → 1.42 |
| Results flow | 406.89 → 123.26 | 19.11 → 5.44 | 406.34 → 390.30 | 18.57 → 19.63 | 1.40 → 1.42 |

Transfer values include response overhead. Decoded JS and CSS describe the content loaded by each page. Browser tests were running during part of the final measurement, so local CPU contention may affect timing, especially TBT. The individual Lighthouse HTML and JSON files, plus the reproduction script, are in the local `SchemeSathi-Pass5` audit folder under `Documents/Codex`.

## What changed and what it saved

- **Route loading.** The entry bundle includes the homepage so it can paint without a second script request. Catalogue, scheme details, the two eligibility routes, chat, login and registration load on demand. The homepage loads 33.77 kB less decoded JS than the baseline. On the questionnaire the saving is 16.04 kB. The measured result combines route splitting with the accessibility code added in this pass.
- **Compression.** Express negotiates Brotli or gzip for compressible public GET/HEAD responses. Authentication and matcher submissions retain their existing response handling and privacy. The cold homepage transferred 294.56 kB less JS and 13.67 kB less CSS. The CSS grew by 1.06 kB decoded, so the CSS transfer gain comes from compression.
- **Responsive banners.** Original photos remain in place. The 256, 640 and 960 px derivatives add 2.15 MB to build assets, and the browser selects one candidate per banner. The first catalogue image and the scheme detail banner are eager and high priority. Other catalogue images stay lazy. Catalogue image transfer fell by 1042.35 kB and scheme-detail image transfer fell by 38.18 kB in this fixture.
- **Caching and recovery.** Hashed assets may be cached for one year. HTML revalidates, and obsolete asset URLs receive a 404 that is not cached. A warm test in the same Chrome context measured 117.08 kB of JS and CSS transfer on the cold homepage and 0 on the second navigation. A separate smoke test blocked a production hashed scheme-list chunk with a 404 and confirmed the reload button restored the route.

## Accessibility and approved spacing

- Route changes move focus to the new heading after its content exists. The skip link stays available. Account errors focus a summary, associate messages with their fields and provide links back to invalid inputs. New questions carry their progress as a description. Results retain a focusable heading and status headings with labels. Help chat announces the newest reply, while the visible transcript stays available for review.
- The approved visible spacing applies only to mobile touch layouts in four places. Help chat reply lists with multiple links use distinct 44 px rows. Account error summaries use the same treatment for multiple field links. Results gain a little space between adjacent reason/document disclosures or a disclosure and an official link. Application links gain space before an immediately following disclosure or official link on scheme details and results. Existing spacing variables are used throughout.
- Axe covers the homepage, scheme list, detail, guest eligibility, login, registration, chat, signed-in questionnaire and results in English, Hindi and Urdu, on desktop and mobile profiles. Browser tests also check 360 px layout across all 11 languages, language direction, keyboard focus and a failed chunk with reload recovery.

## Remaining risks before commit

- The catalogue still shows approximately 0.039 CLS while replacing its loading state. The same shift was present in the baseline. Direct questionnaire and results loads have a later LCP after route splitting, even with lower transfer. TBT varies on this workstation and should be rechecked on a slower real device.
- Reload after a failed route requires connectivity. It resets in-memory questionnaire and chat content as a normal reload does. A browser or intermediary that ignores HTML revalidation, or a failed initial script before React starts, can still prevent a new app instance from rendering. Render cache behavior has not been checked.
- Account field wording can follow the browser's validation language. Eligibility-critical English and the local review notices stay as in Pass 3. Official destinations can have their own accessibility limitations.
- Axe and Chromium emulation cannot verify speech output, switch input or physical touch. Native controls, screen reader language switching, 200% zoom and large text on a real low-end Android phone remain unverified. Small inline links get transparent padding where space allows. Test target separation with real touch and long labels.

## Manual checks

- **NVDA on Windows.** In Chrome, Tab to Skip to content and activate it. Use heading and landmark navigation to move between the main areas. Submit login or registration with missing fields and follow each summary link back. In the questionnaire, check that the new question and progress are announced on Next and Back. Open result reasons and then send two chat turns to hear whether only the newest reply is announced. [NVDA browse-mode guide](https://download.nvaccess.org/documentation/userGuide.html#BrowseMode)
- **TalkBack on Android.** On a real low-end device, use swipe navigation and double-tap to switch to Urdu, enter an invalid answer, go Back, and open result reasons and official links. Check English phrases inside the Urdu page, focus after switching routes, adjacent tap targets with larger text, and retry after reconnecting. [TalkBack navigation guide](https://support.google.com/accessibility/android/answer/6006598?hl=en)

## Dependencies

- `axe-core@4.14.1` is client development-only. Playwright injects it during tests. It adds no production JavaScript. [Deque axe-core](https://github.com/dequelabs/axe-core)
- `compression@1.8.1` runs in Express and adds no browser code. Its newly installed dependencies are `compressible` for MIME filtering, `negotiator` for encoding selection, `on-headers` for applying headers just before response, and `debug` with `ms` for the middleware's optional diagnostics. [Express compression middleware](https://expressjs.com/en/resources/middleware/compression.html)
- Lighthouse and its bundled Puppeteer dependencies were installed in the separate local audit folder. Python Pillow, already available on this workstation, resized the images. No service worker, offline store, analytics or third-party browser script was added.
