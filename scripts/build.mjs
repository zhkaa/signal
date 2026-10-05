import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVendorAssets } from './build-vendor.mjs';
import { format, resolveConfig } from 'prettier';

// Все пути привязаны к проекту, а не к текущей директории терминала.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const client = resolve(root, 'src/client');
const output = resolve(root, 'public');
const views = resolve(client, 'views');

/** Подключаем только локальные HTML-компоненты из views; вложенные include запрещены. */
export async function build() {
  let html = await readFile(resolve(views, 'index.html'), 'utf8');
  for (const match of [...html.matchAll(/<!--\s*include:\s*([^>]+?)\s*-->/g)]) {
    const file = resolve(views, match[1]);
    if (!file.startsWith(views + sep)) throw new Error('Include находится вне views.');
    const part = await readFile(file, 'utf8');
    if (part.includes('<!-- include:')) throw new Error('Вложенный include не поддерживается.');
    html = html.replace(match[0], part);
  }
  // Форматируем целый документ ПОСЛЕ вставки компонентов: вложенность body/main
  // теперь учитывается и в public/index.html, а не только в исходных фрагментах.
  const prettierOptions = await resolveConfig(resolve(root, '.prettierrc.json'));
  html = await format(html, { ...prettierOptions, parser: 'html' });
  await mkdir(output, { recursive: true });
  await Promise.all([
    cp(resolve(client, 'js'), resolve(output, 'js'), { recursive: true }),
    cp(resolve(client, 'styles'), resolve(output, 'css'), { recursive: true }),
    cp(resolve(client, 'assets'), resolve(output, 'assets'), { recursive: true }),
    writeFile(resolve(output, 'index.html'), html),
  ]);
  await buildVendorAssets(root);
  console.log('Signal: клиент собран в public/');
}

// Можно импортировать build() из dev.mjs без повторного запуска сборки.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
