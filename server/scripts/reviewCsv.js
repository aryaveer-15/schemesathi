function parseSheet(text) {
  const input = text.replace(/^\uFEFF/, '');
  const cells = /(?:"((?:[^"]|"")*)"|([^",\r\n]*))(,|\r\n|\n|\r|$)/gy;
  const rows = [];
  let row = [];
  let end = 0;
  while (end < input.length) {
    const cell = cells.exec(input);
    if (!cell) throw new Error('Invalid CSV quoting in sheet row ' + (rows.length + 1) + '.');
    end = cells.lastIndex;
    row.push(cell[1] === undefined ? cell[2] : cell[1].replaceAll('""', '"'));
    if (cell[3] === ',') {
      if (end === input.length) rows.push([...row, '']);
    } else {
      rows.push(row);
      row = [];
    }
  }
  return rows;
}

module.exports = { parseSheet };
