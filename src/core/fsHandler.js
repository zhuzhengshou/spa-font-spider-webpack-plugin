/**
 * 1.只对传入插件的字体包进行优化
 */
const fs = require('fs')
const path = require('path')
const fontSpider = require('font-spider')
const { devTmpPath } = require('../config')
const chalk = require('chalk')
module.exports = (pluginOptions) => {
  const needProcessFontNameList = pluginOptions.fontFamilyPkgList.reduce((prev, { name }) => {
    prev.push(name)
    return prev
  }, [])
  const fileNameList = fs.readdirSync(devTmpPath)
  const htmlUrlList = fileNameList.map(fileName => {
    // 对上一步爬取到本地的页面进行font-spider处理
    if (fileName.startsWith('crawling')) {
      return path.join(devTmpPath, fileName)
    } else {
      return false
    }
  }).filter(item => !!item)

  console.log('\n正在进行网站字体分析提取')
  return fontSpider.spider(htmlUrlList, {
    silent: true,
    backup: false
  }).then(function(webFonts) {
    if (!webFonts || webFonts.length === 0) {
      throw Error('没有提取出任何引用的字体包所要渲染的字符')
    }
    console.log('\n字体分析提取完毕，进行压缩')
    webFonts = webFonts.filter(item => {
      return needProcessFontNameList.includes(item.family)
    })
    return fontSpider.compressor(webFonts, {backup: false})
  }).then(function(webFonts) {
    webFonts.forEach(function (font) {
      console.log('')
      console.log(chalk.green('已提取') + chalk.bgGreen.black(' '+ font.chars.length +' ') + chalk.green('个') + chalk.bgGreen.black(' '+ font.family +' ') + chalk.green('字体：'))
      console.log(chalk.white(' '+ font.chars+' '))
      font.files
        .filter(item => {
          return item.format === 'truetype'
        })
        .forEach(function (f) {
          console.log(chalk.whiteBright('* ' + '优化后ttf类型的文件体积' + parseInt(f.size/1024) + 'K'))
        })
    })
  }).catch(e => {
    console.log(chalk.red('font spider字体提取压缩异常'))
    return Promise.reject(e)
  })
}