/**
 * 1.全量字体包引用插件直接传入的url,提取的字体包使用本地生成的
 * 2.字体包的url要加上?iefix，避免被html解析器解析到 src后面的format(IE低版本不支持)
 * 3.提取的字体包定义的代码(@font-face)需要一次性插入html，全量的字体包，竞速优先插入
 */
const {
  crawlingUserAgent,
  safeFontType,
  pluginName
} = require('../config')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const fsExtra = require('fs-extra')
const { isBuild } = require('../utils')
const ieSuffix = '?iefix'

function insertAt (origin, str, pos) {
  return [
    origin.slice(0, pos),
    str,
    origin.slice(pos)
  ].join('')
}
function getSignleFontDefStr (url, name) {
  return `@font-face {
    src: url('${url}${ieSuffix}') format('truetype');
    font-family: '${name}';
    font-display: swap; /* 解决FOIT (Flash Of Invisible Text) */
  }`
}
function genCSS (htmlPluginData, callback, {fontFamilyPkgList, fontPkgUrlMapFileName}) {
  const partFontDef = fontFamilyPkgList.reduce((prev, { url, name }) => {
    return prev += getSignleFontDefStr(fontPkgUrlMapFileName[url], name)
  }, ``)
  const fullFontDef = fontFamilyPkgList.reduce((prev, { url, name }) => {
    return prev += `
    var linkEle = document.createElement('link')
    linkEle.href = '${url}${ieSuffix}'
    linkEle.as = 'font'
    linkEle.rel = 'prefetch' // 优先级放低
    linkEle.crossOrigin = true
    linkEle.addEventListener('load', () => {
      const styleEle = document.createElement('style')
      styleEle.type = 'text/css'
      styleEle.appendChild(document.createTextNode("${getSignleFontDefStr(url, name).replace(/\n/g, '')}"))
      headEle.appendChild(styleEle)
    })
    headEle.appendChild(linkEle)
    `
  }, ``)
  const script = `
    ${fontFamilyPkgList.map(({ url }) => `<link rel='preload' href='./${fontPkgUrlMapFileName[url]}${ieSuffix}' as='font'></link>`).join('')}
    <style>
      ${partFontDef}
    </style>
    <script>
      // 避免爬取的时候加载全量包
      if (navigator.userAgent !== '${crawlingUserAgent}') {
        const headEle = document.querySelector('head')
        ${fullFontDef}
      }
    </script>
    `
    const headTagEndPos = htmlPluginData.html.lastIndexOf('</head>')
    htmlPluginData.html = insertAt(htmlPluginData.html, script, headTagEndPos)
    callback(null, htmlPluginData)
}
module.exports = (compiler, options) => {
  if (compiler.hooks) {
    // webpack 4.x+
    compiler.hooks.compilation.tap(pluginName, compilation => {
      if (!compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing) {
        console.error(`${pluginName} must be placed after HtmlWebpackPlugin in \`webpack plugins\`.`)
        return
      }
      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(pluginName, (htmlPluginData, callback) => {
        genCSS(htmlPluginData, callback, options)
      })
    })
  } else {
    compiler.plugin('compilation', compilation => {
      compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => {
        genCSS(htmlPluginData, callback, options)
      })
    })
  }
}