const normalizeStringToInteger = (x) => {
  const result = parseInt(x);
  return (typeof result == 'number') ? result : undefined;
}

module.exports = normalizeStringToInteger;