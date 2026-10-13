import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const notes = [];
const fail = (message) => failures.push(message);

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(join(root, relativePath), 'utf8'));
  } catch (error) {
    fail(`Invalid JSON ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    return entry.isDirectory() ? walk(filePath) : [filePath];
  });
}

const packageJson = readJson('package.json');
const content = readJson('src/data/content.json');
const manifest = readJson('public/site.webmanifest');

const requiredFiles = [
  'index.html',
  'src/main.tsx',
  'vite.config.ts',
  'tsconfig.json',
  'eslint.config.js',
  'src/motion/gsapPrimitives.ts',
  'src/hooks/useLenisScroll.ts',
  'src/hooks/usePageTransitions.ts',
  'src/hooks/useGsapAnimations.ts',
  'src/hooks/useCinematicMotion.ts',
  'src/styles/_tokens.scss',
  'public/favicon.svg',
  'public/site.webmanifest',
  'public/robots.txt',
  '.github/workflows/deploy.yml',
];
for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(`Missing required file: ${file}`);
}

if (packageJson) {
  for (const script of ['dev', 'lint', 'lint:fix', 'typecheck', 'validate:project', 'build', 'preview', 'verify']) {
    if (!packageJson.scripts?.[script]) fail(`Missing npm script: ${script}`);
  }
  if (!packageJson.engines?.node?.includes('22.13.0')) fail('Node engine must require Node 22.13 or newer in the 22.x line.');
  for (const name of ['react', 'react-dom', 'gsap', '@gsap/react', 'lenis']) {
    if (!packageJson.dependencies?.[name]) fail(`${name} must be a runtime dependency.`);
  }
  for (const [name, version] of Object.entries({ ...packageJson.dependencies, ...packageJson.devDependencies })) {
    if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
      fail(`${name} is not pinned to an exact version: ${String(version)}.`);
    }
  }
}
if (content) {
  for (const [path, value] of Object.entries({
    'meta.title': content.meta?.title,
    'nav.brand': content.nav?.brand,
    'hero.eyebrow': content.hero?.eyebrow,
    'hero.title.line1': content.hero?.title?.line1,
    'hero.title.line2': content.hero?.title?.line2,
    'hero.title.line3': content.hero?.title?.line3,
    'sections.blur.title': content.sections?.blur?.title,
    'sections.gradient.title': content.sections?.gradient?.title,
    'sections.fade.title': content.sections?.fade?.title,
  })) {
    if (typeof value !== 'string' || !value.trim()) fail(`Required content field ${path} is empty.`);
  }
}
if (manifest && (!manifest.name || !manifest.theme_color || !Array.isArray(manifest.icons))) {
  fail('site.webmanifest must provide name, theme_color and local icons.');
}

const sourceRoot = join(root, 'src');
const sourceFiles = walk(sourceRoot).filter((file) => ['.ts', '.tsx', '.scss', '.json'].includes(extname(file)));
const sassFiles = sourceFiles.filter((file) => file.endsWith('.scss'));
const tokensPath = join(root, 'src/styles/_tokens.scss');
const tokensContent = readFileSync(tokensPath, 'utf8');
const definedTokens = new Set([...tokensContent.matchAll(/^\s*\$([\w-]+)\s*:/gm)].map((match) => match[1]));
const runtimeSources = sourceFiles.filter((file) => ['.ts', '.tsx', '.scss', '.json'].includes(extname(file)));

for (const token of ['ease-cinematic', 'ease-title', 'breakpoint-mobile']) {
  if (!definedTokens.has(token)) fail(`Shared Sass token $${token} must be defined in _tokens.scss.`);
}
for (const fluidToken of ['--type-hero:', '--type-section:', '--type-body:', '--type-footer:', '--space-gutter:']) {
  if (!tokensContent.includes(fluidToken)) fail(`Design token ${fluidToken} is missing from _tokens.scss.`);
}

const appSource = readFileSync(join(root, 'src/components/App.tsx'), 'utf8');
const gsapSource = readFileSync(join(root, 'src/hooks/useGsapAnimations.ts'), 'utf8');
const lenisSource = readFileSync(join(root, 'src/hooks/useLenisScroll.ts'), 'utf8');
const pageTransitionSource = readFileSync(join(root, 'src/hooks/usePageTransitions.ts'), 'utf8');
const primitivesSource = readFileSync(join(root, 'src/motion/gsapPrimitives.ts'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

if ((appSource.match(/data-chapter=/g) ?? []).length !== 3) fail('The cinematic story must contain exactly three tagged chapters.');
for (const act of ['ACT I', 'ACT II', 'ACT III']) if (!appSource.includes(act)) fail(`Missing cinematic story beat ${act}.`);
for (const feature of ['useLenisScroll', 'usePageTransitions', 'useGsapAnimations', 'Skip to content', 'page-transition']) {
  if (!appSource.includes(feature)) fail(`App is missing required integration ${feature}.`);
}
for (const feature of ['useGSAP', 'createScrubScene', "addLabel('arrival'", "addLabel('hold'", "addLabel('release'", 'gsap.matchMedia()']) {
  if (!gsapSource.includes(feature)) fail(`Shared GSAP choreography missing ${feature}.`);
}
for (const feature of ['new Lenis(', 'lenis.raf(time * 1000)', 'gsap.ticker.add', 'ScrollTrigger.update', 'prefers-reduced-motion']) {
  if (!lenisSource.includes(feature)) fail(`Lenis/ScrollTrigger integration missing ${feature}.`);
}
for (const feature of ['createCurtainTransition', 'scrollToTarget', 'history.pushState']) {
  if (!pageTransitionSource.includes(feature)) fail(`Page-transition behavior missing ${feature}.`);
}
for (const feature of ['createScrubScene', 'createCurtainTransition']) {
  if (!primitivesSource.includes(feature)) fail(`Reusable motion primitive ${feature} is missing.`);
}
for (const metadata of ['name="description"', 'property="og:title"', 'property="og:locale"', 'name="twitter:card"', 'name="robots"', 'rel="icon"']) {
  if (!indexHtml.includes(metadata)) fail(`SEO metadata missing ${metadata}.`);
}

function resolvesLocalImport(importer, specifier) {
  const base = resolve(dirname(importer), specifier);
  const basename = base.split(/[\\/]/).pop() ?? '';
  const candidates = [
    base,
    ...['.ts', '.tsx', '.js', '.jsx', '.json', '.scss', '.css', '.mjs'].map((extension) => `${base}${extension}`),
    join(dirname(base), `_${basename}.scss`),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

const tsImportPattern = /(?:\bfrom\s*|\bimport\s*)['"]([^'"]+)['"]/g;
const sassImportPattern = /@(?:use|forward|import)\s+['"]([^'"]+)['"]/g;
for (const file of runtimeSources) {
  const source = readFileSync(file, 'utf8');
  const relative = file.slice(root.length + 1).replaceAll('\\', '/');
  if (/https?:\/\//i.test(source)) fail(`External runtime URL found in ${relative}.`);

  if (/\.(?:ts|tsx)$/.test(file)) {
    for (const [, specifier] of source.matchAll(tsImportPattern)) {
      if (specifier?.startsWith('.') && !resolvesLocalImport(file, specifier)) {
        fail(`Unresolved import ${specifier} in ${relative}.`);
      }
    }
  }

  if (file.endsWith('.scss')) {
    const variablePattern = /\$([\w-]+)/g;
    for (const [, name] of source.matchAll(variablePattern)) {
      if (!definedTokens.has(name) && !source.includes(`$${name}:`)) fail(`Undefined Sass variable $${name} referenced in ${relative}.`);
      else if (definedTokens.has(name) && !file.endsWith('_tokens.scss') && !/@use\s+['"]\.\/tokens['"]\s+as\s+\*/.test(source)) {
        fail(`${relative} uses shared Sass tokens but does not import './tokens' with @use ... as *.`);
      }
    }
    for (const [, specifier] of source.matchAll(sassImportPattern)) {
      const resolved = resolve(dirname(file), specifier);
      const basename = resolved.split(/[\\/]/).pop() ?? '';
      if (![
        resolved,
        `${resolved}.scss`,
        join(dirname(resolved), `_${basename}.scss`),
      ].some((candidate) => existsSync(candidate))) fail(`Unresolved Sass import ${specifier} in ${relative}.`);
    }
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const [open, close] of [['{', '}'], ['(', ')'], ['[', ']']]) {
      if (withoutComments.split(open).length !== withoutComments.split(close).length) fail(`Unbalanced ${open}${close} delimiters in ${relative}.`);
    }
  }
}

if (!existsSync(join(root, 'package-lock.json'))) notes.push('package-lock.json is not generated in this archive; run npm install, commit the generated lockfile, and use npm ci for reproducible installs.');

if (failures.length) {
  console.error('Project validation failed:');
  failures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Project validation passed: ${sourceFiles.length} source/content/style files and ${sassFiles.length} SCSS files checked.`);
  notes.forEach((note) => console.warn(`  ! ${note}`));
}
