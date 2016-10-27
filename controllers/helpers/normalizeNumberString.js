const normalizeNumberString = (x) => {
  if (x == undefined) return undefined;
  if (parseInt(x) >= 0) return parseInt(x);
  else {
    // received weird string-number of format '"1"'
    return parseInt(x.replace(new RegExp('"', 'g'), ''));
  } 
}

module.exports = normalizeNumberString;