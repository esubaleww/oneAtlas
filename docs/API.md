# Catalog API

Start the database, apply the migrations, seed the demo catalog, and run the app using the [local setup](../README.md). All endpoints below are reads and return JSON.

| Request | Response inside `data` |
| --- | --- |
| `GET /api/models` | `{ models, pagination }`. Each summary includes the lab, model specifications, modalities, capabilities, total provider count, and a selected `offering` or `null`. |
| `GET /api/models/[slug]` | One model with its lab, all provider offerings, provenance fields, and benchmark results with their versioned definitions. |
| `GET /api/catalog-filters` | `{ labs, providers, types, capabilities }`. Options reflect records in the catalog. |
| `GET /api/labs` | Lab summaries with each lab's model count. |
| `GET /api/labs/[slug]` | One lab and its models, ordered by release date descending, with unknown dates last. |
| `GET /api/providers` | Provider summaries with each provider's supported model count. |
| `GET /api/providers/[slug]` | One provider and its offerings, including the model, creator, rates, billing unit, and provider context. |
| `GET /api/search?q=…` | `{ models, labs, providers }`. Each group contains up to five hits with their slug, name, description, and demo flag. |
| `GET /api/compare?ids=…` | `{ models }` in the requested order. Each item has the model detail fields plus a `pricingProviderSlug`, which is `null` if the model has no offerings. |

`GET /api/models` accepts the parameters below. Supply each parameter once except for `capability`.

| Parameter | Rule |
| --- | --- |
| `q` | Case-insensitive substring of a model name or description. Leading and trailing whitespace is trimmed. Up to 100 characters. |
| `lab`, `provider` | Lowercase slugs up to 128 characters. |
| `type` | `TEXT_GENERATION` or `EMBEDDING`. |
| `capability` | Repeat `capability=VALUE` for each selection. A model must have all selected capabilities. Obtain available values from `/api/catalog-filters`. |
| `sort` | `inputPrice`, `outputPrice`, `contextWindow`, or `releasedOn`. Defaults to `releasedOn`. |
| `direction` | `asc` or `desc`. Defaults to `desc`. |
| `page` | Positive integer up to 10,000. Defaults to 1. |
| `pageSize` | Positive integer up to 50. Defaults to 12. |

Filters combine with AND. Pagination contains `page`, `pageSize`, `total`, and `totalPages`. An out-of-range page returns an empty `models` array with the filtered count. A valid but unknown lab or provider filter yields zero matches.

```powershell
curl.exe "http://localhost:3000/api/models?lab=cedar-research&provider=relay-cloud&capability=TOOL_CALLING&sort=inputPrice&direction=asc"
curl.exe "http://localhost:3000/api/models/cedar-research-general"
curl.exe "http://localhost:3000/api/catalog-filters"
curl.exe "http://localhost:3000/api/providers/relay-cloud"
curl.exe "http://localhost:3000/api/search?q=compact"
curl.exe "http://localhost:3000/api/compare?ids=cedar-research-general,cedar-research-embed"
```

Global search requires one `q` of 1 to 100 characters after trimming. It matches a literal case-insensitive substring in names and descriptions. Exact names rank first, followed by name prefixes, then other matches. Name and slug break ties within each group.

Comparison requires exactly one `ids` parameter with two to four distinct comma-separated model slugs. Each slug follows the same rules as a model detail slug. A valid selection with a missing model returns `404 NOT_FOUND` for the whole request. The comparison page preserves column order in its URL and groups displayed scores by benchmark version and demo status.

## Price selection and sorting

A provider filter selects that provider's offering. With no provider filter, the list prioritizes offerings with a known input rate, then USD, then billing unit and currency. Within that group, it chooses the lowest input rate and breaks ties by provider slug. Both displayed rates and the sort value come from that selected offering. Comparison uses the same default rule for each `pricingProviderSlug` and includes all offerings in the response.

For price sorts, PostgreSQL groups known rates by billing unit and currency and orders rates within each group. All four sorts put missing values last and break ties by model slug ascending. The list count and page use the same database snapshot.

Rates are decimal strings with six fractional digits. A rate of `"0.000000"` is free and `null` is unknown or inapplicable. Every offering includes its currency and billing unit. Benchmark values are decimal strings with four fractional digits. Dates use `YYYY-MM-DD` or `null`. Demo records carry `isDemo`, and benchmark results include a source label.

## Errors and checks

Failed catalog GET requests use `{ error: { code, message, issues? } }`. Invalid parameters yield `400 INVALID_REQUEST` and may include field-level issues. A valid slug with no matching model, lab, or provider yields `404 NOT_FOUND`. Recognized connection failures yield `503 SERVICE_UNAVAILABLE`. Other unexpected failures yield `500 INTERNAL_ERROR`.

With the demo catalog and app running, use `npm run test:catalog` to exercise the HTTP endpoints. Set `CATALOG_TEST_BASE_URL` to use a different local port. The suite checks the 30-model seed, combined filters, representative and provider-specific rates, stable pagination, benchmark details, directory relationships, bounded global search, comparison ordering and validation, and HTTP 404 responses for unknown slugs.
