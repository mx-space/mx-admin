export NODE_OPTIONS=--max-old-space-size=32768

pnpm i
pnpm build
(cd apps/admin && zip -r ../../release.zip dist/*)
