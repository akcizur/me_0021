# Release verification report

Release: 1.5.0  
Date: 2026-10-13

## Passed in the packaging environment

- `node scripts/validate-project.mjs`: PASS; 17 source/content/style files and 7 SCSS files inspected.
- TypeScript/TSX syntax parse: PASS; 9 TypeScript source files parsed with the available global TypeScript parser. This is a syntax check, not full semantic type checking.
- `node --check eslint.config.js`: PASS.
- `node --check scripts/validate-project.mjs`: PASS.
- JSON parsing: PASS; package, content and web manifest parsed.
- Static SCSS validation: PASS; all seven SCSS files have balanced delimiters, shared token definitions are present, and files using shared Sass variables import `_tokens.scss`.
- Archive integrity: checked using Python's ZIP integrity test after packaging.

## Blocked / not claimed as passed

- `npm run lint`: BLOCKED; project dependencies are not installed in the packaging environment.
- `npm run typecheck`: BLOCKED because `vite/client` type definitions are missing without installed Vite dependencies.
- `npm run build`: BLOCKED at the lint step for the same missing-dependency reason; Vite/Sass production output was not generated here.
- `package-lock.json`: NOT INCLUDED. The npm registry is unreachable from this environment, so the canonical lockfile could not be resolved. No partial or fabricated lockfile was added.

## Verify on a machine with npm registry access

Use Node.js 22.13+ (22.x) or 24+:

```bash
npm install
npm run verify
```

`npm install` will generate the canonical `package-lock.json`; commit that file. Subsequent CI installs use `npm ci`. If the first GitHub Actions run must bootstrap the lockfile, it uploads a temporary `package-lock-bootstrap` artifact for seven days.
