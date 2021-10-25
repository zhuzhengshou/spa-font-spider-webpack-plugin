const path = require('path')
const urlList = ['/']
exports.devTmpPath = path.resolve(__dirname, '../tmp')
exports.safeFontType = 'ttf' // ttf是通用的
exports.pluginName = 'spa-font-spider'
exports.crawlingUserAgent = 'spa-font-spider--crawling'
exports.defaultPluginOption = {
  silent: true,
  hot: false,
  urlList
}
