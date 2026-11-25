# OneAtlas Loom walkthrough

Aim for about 8 minutes. Rehearse at `http://localhost:3000` if necessary, then record the submitted walkthrough against the verified public app. Open OneAtlas in one tab and the repository files in another so you can switch directly to the relevant code.

| Time | Show | Talking points |
| --- | --- | --- |
| 0:00–0:25 | Explorer home | “I built OneAtlas for developers choosing an AI model and a serving provider. I’ll start with the workflow. The catalog uses explicitly labeled synthetic data.” |
| 0:25–1:45 | Filters and model details | Filter by **Cedar Research**, **Relay Cloud**, **Tool calling**, and **Multilingual**. Open **Cedar Research General**. Point to its context limit, provider rates, and score sources. Use **Back to models** to show that the filters survive navigation. |
| 1:45–2:45 | Compare two models | Open the comparison example with Cedar Research General and Cedar Research Embed. Point out the named provider, USD per million tokens, and the **N/A** output price for the embedding. Show **Copy link**, then reload to show how the URL preserves the selection. |
| 2:45–3:45 | Rankings and directories | Switch from first-token latency to instruction following and point out the change in scoring direction. Show the shared first-place rank and the demo label. Open the Relay Cloud provider profile and explain how it differs from the Cedar Research lab profile. |
| 3:45–5:00 | Request flow and schema | Open the README architecture diagram, then `prisma/schema.prisma`. Explain how the browser sends URL filters to a read-only Next.js handler, Zod validates them, and the server catalog queries PostgreSQL through Prisma. A lab creates a model. A provider serves it through an offering. A benchmark definition and a model identify one result. |
| 5:00–6:20 | One engineering challenge | Open the price-selection section of `docs/API.md`. Explain why you keep input and output rates on the same offering. Cedar General has different rates across providers, so combining them would give a misleading price. Point to the shared selection rule for the explorer and comparison, and the distinction between free, unknown, and inapplicable values. |
| 6:20–7:35 | Verification and limitations | Show `tests/catalog-api.test.mjs` and `tests/e2e/`. Mention the 16 HTTP tests and 12 desktop/mobile browser tests, including ties, URL reloads, keyboard navigation, and small-screen overflow. Explain that the seed skips existing rows and that the shipped catalog is synthetic. Describe how a future import could add source-verified data. |
| 7:35–8:00 | Public app and repository | Return to the app and show the browser address. Point to the repository README for setup and API examples. End with how someone can try the same comparison themselves. |

## Tabs to prepare

- Explorer and a filtered Cedar Research General page.
- `/compare?ids=cedar-research-general,cedar-research-embed`
- `/rankings?benchmark=demo-instruction-following-v1&category=TEXT_GENERATION`
- `/providers/relay-cloud`
- [Architecture and setup](../README.md#architecture) · [API contract](API.md) · [Verification log](PROGRESS.md)
