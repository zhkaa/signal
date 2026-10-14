/** Последний middleware: внутренние сообщения БД и ключи не попадают в ответ. */
export function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  res.status(error.status || 502).json({
    code: error.type === 'entity.parse.failed' ? 'INVALID_JSON' : error.code || 'REQUEST_FAILED',
  });
}
