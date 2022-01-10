/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['react-bootstrap', 'bootstrap', '@restart/ui', '@restart/ui/ssr', '@react-aria/ssr']);

module.exports = withTM({
  // webpack(config, options) {
  //   config.optimization.minimize = false;
  //   return config;
  // }
  reactStrictMode: true,
});