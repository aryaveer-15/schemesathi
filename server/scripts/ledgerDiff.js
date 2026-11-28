function ledgerDiff(before, after, name) {
  if (JSON.stringify(before) === JSON.stringify(after)) return 'No ledger changes.';
  const lines = (data) => JSON.stringify(data, null, 2).split('\n');
  const oldLines = lines(before);
  const newLines = lines(after);
  let start = 0;
  while (oldLines[start] === newLines[start] && start < oldLines.length) start++;
  let oldEnd = oldLines.length;
  let newEnd = newLines.length;
  while (oldEnd > start && newEnd > start && oldLines[oldEnd - 1] === newLines[newEnd - 1]) {
    oldEnd--;
    newEnd--;
  }
  return ['--- current ' + name, '+++ proposed ' + name,
    '@@ -' + (start + 1) + ',' + (oldEnd - start) + ' +' + (start + 1) + ',' + (newEnd - start) + ' @@',
    ...oldLines.slice(start, oldEnd).map((line) => '-' + line),
    ...newLines.slice(start, newEnd).map((line) => '+' + line),
  ].join('\n');
}

module.exports = ledgerDiff;
