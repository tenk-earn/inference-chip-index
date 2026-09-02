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


## Node 22

Wrangler 4 wants Node.js ≥ 22. On this box, Node 22.23.2 is unpacked at `/tmp/node22` (not on the default PATH). After a human `wrangler login`:

```bash
export PATH=/tmp/node22/bin:$PATH
node -v   # v22.23.2
bun run deploy:cloudflare
```

Do not run `wrangler login` from an unattended agent. Do not invent a `workers.dev` URL.

Non-secret payment defaults can live in `wrangler.jsonc` `vars`. CDP API keys are `wrangler secret put` only.

Bazaar listing steps: [bazaar.md](bazaar.md).
