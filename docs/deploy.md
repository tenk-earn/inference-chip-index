# Deployment

Target: Cloudflare Workers through OpenNext.

```bash
npx @opennextjs/cloudflare build
npx wrangler deploy
```

Or `bun run deploy:cloudflare`.

Requirements:

- A Cloudflare account on the **free** Workers plan is enough only if the Worker bundle stays within the free compressed-size limit.
- `wrangler login` (OAuth) or `CLOUDFLARE_API_TOKEN` from a **new** account. Do not use a personal card. Do not put tokens in the repo.

If login requires payment or the bundle exceeds the free limit, skip deploy. `bun run build` (Next.js production build) is still required.

Local Workers preview:

```bash
bun run preview:cloudflare
```
