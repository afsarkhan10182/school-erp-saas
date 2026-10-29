const resolveCorsOrigin = (allowedOrigins, requestOrigin) => {
  if (!requestOrigin) return '*';
  if (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return false;
};

module.exports = resolveCorsOrigin;
