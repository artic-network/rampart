const path = require('path')

const getAbsolutePath = (filepath) => {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  } else if (path.isAbsolute(filepath)) {
    return filepath;
  }
  return path.join(__dirname, "..", filepath)
}

const sleep = (ms) => new Promise((resolve) =>
  setTimeout(resolve, ms)
);

module.exports = {
  getAbsolutePath,
  sleep
};
