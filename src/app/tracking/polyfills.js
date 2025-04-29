// app/polyfills.js
if (typeof window !== "undefined" && !window.crypto) {
  window.crypto = require("crypto-browserify");
}
