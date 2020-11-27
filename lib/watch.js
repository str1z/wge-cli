const fs = require("fs");
const path = require("path");

function watch(dir, handler) {
  for (let item of fs.readdirSync(dir)) {
    let full = path.resolve(dir, item);
    if (fs.statSync(full).isDirectory()) watch(full, handler);
  }
  fs.watch(dir, handler);
}

module.exports = watch;
