# Update and rollback

Promotion is atomic: generate into `*.tmp` then rename.

## Update (full source)

1. Refresh `data/mlperf-v6.0` from commit `4d3916ac9cf474b679cdfcf492d43a0559418ad1` (or a newer reviewed commit after editing `src/pipeline/constants.ts`).
2. `bun run dataset:full`
3. `bun run dataset:fixture` — fixture hash must stay stable unless fixtures changed.
4. `bun test && bun run type-check && bun run build`
5. Commit `data/generated`, `src/data/generated`, and source pack changes together.

## Rollback

```bash
git checkout <previous-dataset-commit> -- data/generated src/data/generated data/mlperf-v6.0
bun test
```

Do not publish a snapshot that fails Zod validation, hash reproduction, or provenance checks. Automated PRs are out of scope.
