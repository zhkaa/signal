/** Последний middleware: внутренние сообщения БД и ключи не попадают в ответ. */
export function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type !== 'entity.parse.failed') console.error(error.message);
  res.status(error.status || 502).json({
    error:
      error.type === 'entity.parse.failed'
        ? 'Некорректный JSON.'
        : 'Не удалось выполнить запрос. Проверьте настройки сервиса и повторите.',
  });
}
