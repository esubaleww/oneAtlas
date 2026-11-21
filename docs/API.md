# Catalog API

Start the database, apply the migrations, seed the demo catalog, and run the app using the [local setup](../README.md). All endpoints below are reads and return JSON.

| Request | Response inside `data` |
| --- | --- |
| `GET /api/models` | `{ models, pagination }`. Each summary includes the lab, model specifications, modalities, capabilities, total provider count, and a selected `offering` or `null`. |
| `GET /api/models/[slug]` | One model with its lab, all provider offerings, provenance fields, and benchmark results with their versioned definitions. |
| `GET /api/catalog-filters` | `{ labs, providers, types, capabilities }`. Options reflect records in the catalog. |

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
```

## Price selection and sorting

A provider filter selects that provider's offering. With no provider filter, the list prioritizes offerings with a known input rate, then USD, then billing unit and currency. Within that group, it chooses the lowest input rate and breaks ties by provider slug. Both displayed rates and the sort value come from that selected offering.

For price sorts, PostgreSQL groups known rates by billing unit and currency and orders rates within each group. All four sorts put missing values last and break ties by model slug ascending. The list count and page use the same database snapshot.

Rates are decimal strings with six fractional digits. A rate of `"0.000000"` is free and `null` is unknown or inapplicable. Every offering includes its currency and billing unit. Benchmark values are decimal strings with four fractional digits. Dates use `YYYY-MM-DD` or `null`. Demo records carry `isDemo`, and benchmark results include a source label.

## Errors and checks

Failed catalog GET requests use `{ error: { code, message, issues? } }`. Invalid parameters yield `400 INVALID_REQUEST` and may include field-level issues. A valid slug with no model yields `404 NOT_FOUND`. Recognized connection failures yield `503 SERVICE_UNAVAILABLE`. Other unexpected failures yield `500 INTERNAL_ERROR`.

With the demo catalog and app running, use `npm run test:catalog` to exercise the HTTP endpoints. Set `CATALOG_TEST_BASE_URL` to use a different local port. The suite checks the 30-model seed, combined filters, representative and provider-specific rates, stable pagination, benchmark details, and error responses. It also checks that the model page renders from the catalog and returns HTTP 404 for an unknown slug.
