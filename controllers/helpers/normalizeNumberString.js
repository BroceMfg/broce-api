const normalizeNumberString = (x) => {
  if (!x) return undefined;
  if (parseInt(x) > -1) return parseInt(x);
  else {
    // received weird string-number of foratm '"1"'
    return parseInt(x.replace(new RegExp('"', 'g'), ''));
  } 
}

module.exports = normalizeNumberString;