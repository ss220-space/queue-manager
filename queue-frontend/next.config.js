/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['react-bootstrap', '@restart/ui']);

module.exports = withTM({
  // webpack(config, options) {
  //   config.optimization.minimize = false;
  //   return config;
  // }
});