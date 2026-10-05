import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

await build();
await import('../src/server/index.js');

// Клиент пересобирается автоматически. После изменения обновите страницу браузера.
// Перезапуск сервера при изменениях src/server выполняет node --watch.
let timer;
let queue = Promise.resolve();
const watcher = watch(
  fileURLToPath(new URL('../src/client', import.meta.url)),
  { recursive: true },
  () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      queue = queue.then(build).catch((error) => console.error('Ошибка сборки:', error.message));
    }, 150);
  },
);
process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});
