const path = require('path')
const head = require('./config/head')
const themeConfig = require('./config/themeConfig')

module.exports = {
  base: '/',
  head,
  evergreen: true,
  theme: 'yur',
  themeConfig,
  markdown: {
    lineNumbers: true,
  },
  host: 'localhost',
  port: 8080,
  extraWatchFiles: [
    '/docs/.vuepress/config.js',
  ],
}
