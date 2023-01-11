export NODE_OPTIONS=--max-old-space-size=32768

pnpm i
pnpm build
zip -r release.zip dist/*
