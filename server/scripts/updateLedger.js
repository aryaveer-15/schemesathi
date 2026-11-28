const fs = require('node:fs');

function updateLedger(apply, update, path) {
  const lock = path + '.lock';
  const temp = path + '.' + process.pid + '.tmp';
  const handle = apply ? fs.openSync(lock, 'wx') : null;
  try {
    const before = JSON.parse(fs.readFileSync(path, 'utf8'));
    const after = update(before);
    if (apply && after !== before) {
      const sorted = Object.fromEntries(Object.entries(after).sort(([a], [b]) => a.localeCompare(b)));
      fs.writeFileSync(temp, JSON.stringify(sorted, null, 2) + '\n', { flag: 'wx' });
      fs.renameSync(temp, path);
    }
    return after;
  } finally {
    if (handle !== null) {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
      fs.closeSync(handle);
      fs.unlinkSync(lock);
    }
  }
}

module.exports = updateLedger;
