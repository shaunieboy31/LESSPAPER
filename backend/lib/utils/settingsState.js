// settingsState.js
let cutoffEnabled = false; // default

function getCutoffEnabled() {
  return cutoffEnabled;
}

function setCutoffEnabled(value) {
  cutoffEnabled = value;
}

module.exports = { getCutoffEnabled, setCutoffEnabled };
