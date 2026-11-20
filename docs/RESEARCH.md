# Product reference notes

Reviewed on November 20, 2026 for the OneAtlas internship MVP.

| Reference | Observation | OneAtlas decision |
| --- | --- | --- |
| [OneAtlas.dev](https://oneatlas.dev/) | The catalog puts model-only search, lab and provider filters, capabilities, and sorting next to the results. Global search spans models, labs, and providers. | Make the explorer the primary page. Give catalog filters shareable URLs and keep global search available across pages. Use a compact desktop list and a responsive mobile layout. |
| [OpenRouter model catalog](https://openrouter.ai/models) | Listings place model identity, context length, input rates, and output rates together. The surrounding product supports developers selecting a model for an API workflow. | Show the two token rates together with their billing unit and serving provider. Link each result to details that explain the offering and its limits. |
| [RouterPlus catalog](https://app.routerplus.com/) and [product overview](https://routerplus.com/) | The catalog separates labs and inference providers and supports capability and price filters. The product emphasizes evaluating models against a particular workload. | Filter creators and serving providers independently. Compare up to four models and publish benchmark definitions, score direction, and provenance per metric. |
| [LiteLLM](https://www.litellm.ai/) and [provider docs](https://docs.litellm.ai/docs/providers) | Developer documentation organizes supported features and integration information around providers and links to their models and prices. | Give providers their own directory and detail pages. Keep catalog endpoints documented so developers can inspect the same records the UI renders. |

The MVP centers on discovery, comparison, rankings, and directories. It uses its own PostgreSQL catalog with visibly labeled demo data.
