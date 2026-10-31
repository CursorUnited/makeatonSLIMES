/**
 * Sets `X-Response-Time` just before headers go out (used for the < 2 s check)
 * and logs one JSON line per request.
 */
export function timing(req, res, next) {
  const start = process.hrtime.bigint();
  const elapsedMs = () => Number(process.hrtime.bigint() - start) / 1e6;

  const writeHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) res.setHeader('X-Response-Time', `${elapsedMs().toFixed(1)}ms`);
    return writeHead.apply(this, args);
  };

  res.on('finish', () => {
    if (process.env.NODE_ENV === 'test') return;
    console.log(
      JSON.stringify({
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Number(elapsedMs().toFixed(1)),
        requestId: req.id,
        userId: req.user?.id ?? null,
      }),
    );
  });

  next();
}
