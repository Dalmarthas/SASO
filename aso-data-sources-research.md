# ASO Data Collection Research

Researched on 2026-03-11.

## Short answer

You can cover most ASO data with a hybrid approach:

1. Use official store APIs for your own apps whenever possible.
2. Use public store endpoints for Apple competitor metadata.
3. Use scraping or managed scraper APIs for Google Play competitor metadata and for keyword rank tracking in both stores.
4. Build your own history tables. Neither store gives you full keyword rank history out of the box.

## 1. What data can we gather?

### Apple App Store

#### Public competitor metadata: yes

Best public source: Apple iTunes Search API / Lookup API.

What it is good for:

- app name
- subtitle or summary-like fields when exposed
- description
- screenshots
- icon/artwork
- current rating
- rating count
- version
- release notes
- seller/developer name
- categories / genres
- supported devices and OS info
- localized storefront queries by `country`

Practical note:

- For competitor intelligence on Apple, this is the cleanest public option.
- Apple also exposes public product pages, so you can scrape fields that the Search API does not expose consistently.

Important limitation:

- Apple's hidden App Store keyword field is not publicly exposed. The `aso` library README explicitly calls this out.

#### Your own app metadata: yes, officially

Best source: App Store Connect API.

What it covers for your own apps:

- app info localizations
- version localizations
- description
- keywords
- promotional text
- screenshots
- customer reviews
- review summaries

This is the best source for first-party App Store metadata management and ingestion.

#### Reviews and ratings

For your own apps:

- Use App Store Connect API `customerReviews`.
- Apple documents rating, title, body, reviewer nickname, created date, territory, and response handling.

For competitor apps:

- There is no equivalent official App Store Connect endpoint for other publishers' apps.
- Practical options are public product page scraping or the legacy public reviews feed pattern used by the ecosystem.
- Community reports show the RSS-style review endpoint has been unstable at times, so treat it as best-effort, not core infrastructure.

### Google Play

#### Public competitor metadata: not via official API

Inference from the current Android Publisher reference:

- Google documents APIs for your developer account, your store listings, your listing images, and your reviews.
- I did not find an official Google Play API for public competitor listing metadata, public search results, or keyword ranking.

So for competitor metadata on Google Play, the practical options are:

- scrape public Play Store pages
- use maintained open-source scrapers
- use managed scraper APIs such as SerpApi, SearchAPI, or Apify actors

What public scraping can usually extract:

- app title
- short description
- full description
- icon
- screenshots
- rating
- ratings histogram
- installs range
- version
- update date
- developer name
- developer page / website / email when public
- IAP flag / ads flag / category / tags

#### Your own app metadata: yes, officially

Best source: Google Play Developer API (Android Publisher API).

What it covers for your own apps:

- localized listing title
- short description
- full description
- video URL
- listing images
- reviews

Important limitation:

- The official Reviews API only returns reviews created or modified within the last week.
- Google explicitly says full historical review export should be downloaded as CSV from Play Console.

## 2. Keyword positions: current and history

### Apple App Store

#### Current position

Two workable approaches:

1. Approximate rank from the official iTunes Search API
2. Exact storefront rank from search page scraping or a managed search API

Approach 1 is simpler:

- Run `search?term=<keyword>&entity=software&country=<storefront>`
- find your app ID in the ordered results
- rank = array index + 1

Approach 2 is closer to the real App Store UI:

- scrape App Store search results for a keyword, country, language, and device context
- or use a managed App Store search API such as SerpApi's Apple App Store engine

Important limitation:

- Search rank is storefront-sensitive and can vary by country, language, device context, and over time.
- iTunes Search API is useful, but it is not a contractual "official keyword ranking API."

#### History

There is no official Apple history endpoint for keyword ranks.

You need to store snapshots yourself:

- keyword
- app ID
- country / storefront
- language
- device type if relevant
- observed rank
- fetched-at timestamp
- source used (`itunes_search`, `scraped_search`, managed API)

Run this on a schedule, for example hourly or daily depending on the use case.

### Google Play

#### Current position

There is no official Google Play keyword ranking API in the Android Publisher docs.

Practical approach:

- execute a Play Store search for the keyword
- collect ordered results for a chosen country (`gl`) and language (`hl`)
- find the target package
- store the observed position

Ways to do it:

- your own Play web scraper
- `aso` on top of Google Play scraper libraries
- managed APIs such as SerpApi / SearchAPI / Apify

Important limitation:

- Google Play search results differ between web, app, locale, personalization state, and cache state.
- Stack Overflow discussions also note that web and in-app positions can differ.
- Define one canonical measurement surface and keep it consistent.

#### History

Same as Apple: store your own snapshots.

Recommended schema:

- `keyword_rank_snapshots`
- fields: `store`, `country`, `language`, `device_surface`, `keyword`, `app_id`, `rank`, `found`, `result_count_scanned`, `captured_at`, `source`

## 3. Concrete sources and tools

### Official Apple sources

- iTunes Search API: public search and lookup for App Store items
- App Store Connect API: first-party app metadata and reviews
- App Store Connect Help: fields, localization, screenshots, ratings behavior

Useful for:

- lookup by app ID
- search by keyword
- screenshots / icons / ratings / description
- first-party metadata automation

### Official Google sources

- Android Publisher `edits.listings`
- Android Publisher `edits.images`
- Android Publisher `reviews`

Useful for:

- your own listing text
- your own screenshots and images
- your own recent reviews

Not sufficient for:

- competitor metadata
- keyword search ranks
- full historical reviews via API

### Open-source libraries / scripts

#### `facundoolano/aso`

Useful when you want:

- keyword suggestions
- keyword difficulty / traffic heuristics
- rank-style analysis from live store data
- a single abstraction over Apple and Google

Important note from the project:

- iTunes is easier because Apple exposes a usable search API
- Google Play is slower because data usually has to be scraped live

#### `datasciencecampus/app_review`

Useful as reference code for:

- Apple review collection
- Google Play review collection
- flattening review payloads into CSV

This is a decent starting point if you want example ingestion code rather than a full product dependency.

### Managed scraper APIs

Good when you want faster implementation and less anti-bot work.

Useful vendors found during research:

- SerpApi
- SearchAPI
- Apify actors

They expose structured results for:

- Google Play search
- Google Play product details
- Google Play reviews
- Apple App Store search
- Apple App Store reviews

These are useful for:

- keyword rank collection
- competitor metadata collection
- review ingestion without maintaining your own parser

Tradeoff:

- ongoing cost
- dependence on a vendor's parser and uptime

## 4. Recommended architecture

### Best practical setup

#### Apple

- Metadata for competitors: iTunes Search API first, scrape product pages only for missing fields.
- Metadata for your apps: App Store Connect API.
- Reviews for your apps: App Store Connect API.
- Reviews for competitors: scraper or managed API.
- Keyword ranks: search result snapshots per country.

#### Google Play

- Metadata for your apps: Android Publisher API.
- Reviews for your apps: Android Publisher Reviews API plus Play Console CSV for backfills.
- Metadata for competitors: scraper or managed API.
- Keyword ranks: search result snapshots per country and language.

### Storage you should keep

- `apps`
- `app_localizations`
- `app_assets`
- `reviews`
- `keyword_rank_snapshots`
- `top_chart_snapshots`

Also store:

- raw payload JSON
- normalized parsed rows
- fetch status
- locale / storefront metadata
- parser version

That makes reprocessing possible when parsers change.

## 5. Product caveats for ASO specialists

- Country and language are first-class dimensions. Never treat "global rank" as a single truth.
- Apple ratings are territory-specific on the App Store.
- Google review availability and rank position can differ between web and app surfaces.
- Google's official review API is not a full historical archive.
- Apple competitor keywords are not publicly exposed, so keyword inference for Apple must come from ranking behavior, titles, subtitles, descriptions, review text, and search suggestions rather than the hidden keyword field.

## 6. Bottom line

If the goal is a real ASO workflow, the data stack should be:

- Apple public metadata: official iTunes Search API
- Apple first-party metadata/reviews: App Store Connect API
- Google first-party metadata/reviews: Android Publisher API
- Google competitor metadata and both stores' keyword positions: scraping or managed search APIs
- History for ranks and review changes: your own database snapshots

## Sources

- Apple iTunes Search API: https://performance-partners.apple.com/resources/documentation/itunes-store-web-service-search-api/
- Apple App Store Connect API overview: https://developer.apple.com/app-store-connect/api/
- Apple customer reviews resource: https://developer.apple.com/documentation/appstoreconnectapi/customer-reviews
- Apple list customer reviews endpoint: https://developer.apple.com/documentation/appstoreconnectapi/get-v1-apps-_id_-customerreviews
- Apple app information reference: https://developer.apple.com/help/app-store-connect/reference/app-information
- Apple platform version information reference: https://developer.apple.com/help/app-store-connect/reference/app-review-information
- Apple localize app information: https://developer.apple.com/help/app-store-connect/manage-app-information/localize-app-information
- Apple upload screenshots help: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/
- Apple ratings and reviews overview: https://developer.apple.com/app-store/ratings-and-reviews/
- Google Play Developer API overview: https://developers.google.com/android-publisher
- Google Play listings resource: https://developers.google.com/android-publisher/api-ref/rest/v3/edits.listings
- Google Play listings get method: https://developers.google.com/android-publisher/api-ref/rest/v3/edits.listings/get
- Google Play images resource: https://developers.google.com/android-publisher/api-ref/rest/v3/edits.images
- Google Play reply to reviews / reviews API: https://developers.google.com/android-publisher/reply-to-reviews
- Google Play custom store listings help: https://support.google.com/googleplay/android-developer/answer/9867158?hl=en
- Google Play assets help: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- `aso` library: https://github.com/facundoolano/aso
- `app_review` example code: https://github.com/datasciencecampus/app_review
- Stack Overflow: no official Google Play search API / limited result depth: https://stackoverflow.com/questions/29807757/get-more-then-250-results-from-a-google-play-store-query
- Stack Overflow: Google Play web vs app rank can differ: https://stackoverflow.com/questions/63215734/how-to-get-the-correct-app-position-by-keyword-in-google-play-search
- Stack Overflow: App Store ranking often requires scraping or ordered search results: https://stackoverflow.com/questions/8546915/is-it-possible-to-get-the-ranking-position-of-any-app-with-itunes-app-store-api
- Stack Overflow: App Store review feed instability discussion: https://stackoverflow.com/questions/79143866/how-to-get-apple-app-store-reviews-xml-feed-is-gone
- Reddit: Google Play "all reviews" scraping is practically constrained by paging and locale: https://www.reddit.com/r/learnprogramming/comments/1hxt6ku/how_to_scrape_all_the_reviews_of_an_app_in_google/
- Reddit: App Store review scraping from public RSS is considered feasible by builders in the wild: https://www.reddit.com/r/SideProject/comments/1rcwpl8/i_scraped_8600_real_12_star_app_store_reviews/
- SerpApi Apple App Store search: https://serpapi.com/apple-app-store
- SerpApi Google Play product / reviews: https://serpapi.com/google-play-product-api
- SearchAPI Google Play: https://www.searchapi.io/google-play
- Apify Google Play scraper actor: https://apify.com/automation-lab/google-play-scraper
