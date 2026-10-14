# Ports in this folder

| File | Source (~/git_local/deepwell/…) | Status |
|---|---|---|
| cover-art.ts, theme.ts, article-title.ts | apps/web/src/lib/… | unchanged (drift-tested by tests/unit/ports.test.ts) |
| silhouette-ascii.json | apps/web/src/lib/reader/cover/silhouette-ascii.json | unchanged, byte-identical (JSON can't carry a header) |
| classification.ts | packages/article-doc/src/classification.ts | subset: class + ACS helpers only |
| acs.ts | apps/web/src/lib/render/acs.ts | modified: imports ./classification |
| series.ts | apps/web/src/lib/reader/provenance.ts (seriesFromSlug) + apps/web/src/lib/browse/archive.ts (seriesLabel) | subset |
