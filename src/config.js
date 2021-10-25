const path = require('path')
exports.devTmpPath = path.resolve(__dirname, '../tmp')
exports.safeFontType = 'ttf' // ttf是通用的
exports.pluginName = 'spa-font-spider'
exports.crawlingUserAgent = 'spa-font-spider--crawling'
exports.defaultUrlList = ['/']
exports.defaultPluginOption = {
  silent: true,
  isDev: process.env.NODE_ENV === 'development',
  hot: false
}
