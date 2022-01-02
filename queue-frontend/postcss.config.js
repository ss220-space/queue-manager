module.exports = {
  plugins: {
    "postcss-custom-properties": {
      "preserve": false
    },
    "postcss-flexbugs-fixes": {},
    "postcss-preset-env": {
      "autoprefixer": {
        "flexbox": true,
        "grid": 'autoplace'
      },
      "stage": 3,
      "preserve": false,
      "features": {
        "custom-properties": true
      }
    }
  }
}