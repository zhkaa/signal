import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Локальные ресурсы: Lucide, Manrope для интерфейса и Space Grotesk для логотипа. */
export async function buildVendorAssets(root) {
  const names = [
    'layout-dashboard',
    'sparkles',
    'users-round',
    'search',
    'chart-no-axes-combined',
    'folder-open',
    'arrow-up-right',
    'arrow-right',
    'arrow-down-left',
    'menu',
    'x',
    'plus',
    'gem',
    'circle-help',
    'chart-no-axes-column-increasing',
  ];
  const assets = resolve(root, 'public/assets');
  const lucide = resolve(root, 'node_modules/lucide-static');
  const font = resolve(root, 'node_modules/@fontsource-variable/manrope');
  await mkdir(resolve(assets, 'fonts'), { recursive: true });
  const symbols = await Promise.all(
    names.map(async (name) => {
      const svg = await readFile(resolve(lucide, `icons/${name}.svg`), 'utf8');
      return `<symbol id="${name}" viewBox="0 0 24 24">${svg.match(/<svg[\s\S]*?>([\s\S]*?)<\/svg>/)[1]}</symbol>`;
    }),
  );
  await writeFile(
    resolve(assets, 'icons.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg"><!-- Lucide: icons-LICENSE.txt -->${symbols.join('\n')}</svg>`,
  );
  await copyFile(resolve(lucide, 'LICENSE'), resolve(assets, 'icons-LICENSE.txt'));
  await copyFile(resolve(font, 'LICENSE'), resolve(assets, 'fonts/LICENSE.txt'));
  const css = await readFile(resolve(font, 'index.css'), 'utf8');
  await writeFile(
    resolve(root, 'public/css/fonts.css'),
    css.replaceAll('./files/', '/assets/fonts/'),
  );
  for (const match of css.matchAll(/\.\/files\/([^)]*)/g)) {
    await copyFile(resolve(font, 'files', match[1]), resolve(assets, 'fonts', match[1]));
  }
  const wordmarkFont = resolve(root, 'node_modules/@fontsource-variable/space-grotesk');
  const wordmarkFile = 'space-grotesk-latin-wght-normal.woff2';
  await copyFile(
    resolve(wordmarkFont, 'files', wordmarkFile),
    resolve(assets, 'fonts', wordmarkFile),
  );
  await copyFile(
    resolve(wordmarkFont, 'LICENSE'),
    resolve(assets, 'fonts/space-grotesk-LICENSE.txt'),
  );
  await writeFile(
    resolve(root, 'public/css/fonts.css'),
    css.replaceAll('./files/', '/assets/fonts/') +
      `\n/* Шрифт только для латинской надписи Signal. */\n@font-face {\n  font-family: 'Space Grotesk Variable';\n  font-style: normal;\n  font-display: swap;\n  font-weight: 300 700;\n  src: url('/assets/fonts/${wordmarkFile}') format('woff2');\n}\n`,
  );
}
