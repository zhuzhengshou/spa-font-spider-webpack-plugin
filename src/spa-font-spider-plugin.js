'use strict'
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const fontDef = require('./core/fontDef')
const getFontPkg = require('./core/getFontPkg')
const assetsToLocal = require('./core/assetsToLocal')
const { getCanUseServerHost, closeServer } = require('./core/liveServer')
const crawling = require('./core/crawling')
const fsHandler = require('./core/fsHandler')
const { isFontFamilyPkg, getuuid } = require('./utils')
const { defaultPluginOption, defaultUrlList, devTmpPath, pluginName, safeFontType } = require('./config')

let isSuccessLoad
let assets
let finalAssetsReady
let optionCheckResult

class SPAFontSpliderPlugin {
  constructor (options = {}) {
    if (options.urlList) {
      options.urlList = Array.from(new Set(defaultUrlList.concat(options.urlList)))
    }
    optionCheckResult = this.optionsCheck(options)
    if (optionCheckResult) {
      options.fontPkgUrlMapFileName = options.fontFamilyPkgList.reduce((prev, { url }) => {
        prev[url] = `${getuuid()}.${safeFontType}`
        return prev
      }, {})
      this.options = Object.assign({}, defaultPluginOption, options)
    }
  }
  get needReload () { // 开发者进行源代码更新后触发assets更新时，是否reload
    return isSuccessLoad ? this.options.hot : true
  }
  apply(compiler) {
    if (!optionCheckResult) {
      console.log('插件实例化参数校验失败')
      return
    }
    try {
      fontDef(compiler, this.options)
      if (compiler.hooks) {
        compiler.hooks.emit.tapAsync(pluginName, (compilation, callback) => {
          this.main(compilation, callback)
        })
      } else {
        compiler.plugin('emit', (compilation, callback) => {
          this.main(compilation, callback)
        })
      }
    } catch (e) {
      this.abortHandler(e)
    }
  }
  optionsCheck ({ urlList, fontFamilyPkgList }) {
    if (urlList) {
      if (!Array.isArray(urlList)) {
        console.log(chalk.red(`${pluginName}插件实例化参数中的urlList预期得到一个数组类型`))
        return false
      } else {
        let url
        for (let i = urlList.length - 1; i >= 0; i--) {
          url = urlList[i]
          if (url && !url.startsWith('/')) {
            console.log(chalk.yellow(`${pluginName}插件实例化参数中的urlList列表得到了一个非/开头的地址:${url}，将自动过滤掉这个错误配置`))
            urlList.splice(i, 1)
          }
        }
      }
    }
    if (fontFamilyPkgList && Array.isArray(fontFamilyPkgList)) {
      const existFontNameList = []
      const existPkgUrlList = []
      for(let i = 0; i < fontFamilyPkgList.length - 1; i++) {
        const pkg = fontFamilyPkgList[i]
        if (isFontFamilyPkg(pkg)) {
          const fontType = pkg.url.split('.').reverse()[0]
          if (existFontNameList.includes(pkg.name)) {
            console.log(chalk.red(`${pluginName}插件实例化参数中fontFamilyPkgList得到一个重复的name:${pkg.name}, 请避免重复`))
            return false
          } else if (existPkgUrlList.includes(pkg.url)) {
            console.log(chalk.red(`${pluginName}插件实例化参数中fontFamilyPkgList得到一个重复的url:${pkg.url}, 请避免重复`))
            return false
          } else if (fontType !== safeFontType) {
            console.log(chalk.red(`${pluginName}插件实例化参数中fontFamilyPkgList，第${ i + 1}个字体系列文件的类型(${fontType})不是安全的${safeFontType}`))
            return false
          } else {
            existFontNameList.push(pkg.name)
            existPkgUrlList.push(pkg.url)
          }
        } else {
          console.log(chalk.red(`${pluginName}插件实例化参数中的fontFamilyPkgList未按照格式配置`))
          return false
        }
      }
    } else {
      console.log(chalk.red(`${pluginName}插件实例化参数中的fontFamilyPkgList预期得到一个数组类型`))
      return false
    }
    return true
  }
  main (compilation, callback) {
    try {
      finalAssetsReady = callback
      assets = compilation.assets
      if (this.needReload) {
        getFontPkg(assets, this.options)
        .then(assetsToLocal)
        .then(getCanUseServerHost)
        .then(crawling)
        .then(fsHandler)
        .then(() => {
          this.patchOptimizeFontFile()
          this.end()
        })
        .catch((e) => {
          this.abortHandler(e)
        })
      } else {
        this.patchOptimizeFontFile()
        this.end()
      }
    } catch (e) {
      this.abortHandler(e)
    }
  }
  patchOptimizeFontFile () {
    let p
    const fontFamilyPkgList = this.options.fontFamilyPkgList
    const fontPkgUrlMapFileName = this.options.fontPkgUrlMapFileName
    fontFamilyPkgList.forEach(({ url }) => {
      p = fontPkgUrlMapFileName[url]
      const finalOptimizeFontFile = fs.readFileSync(path.join(devTmpPath, p))
      assets[p] = {
        source () {
          return finalOptimizeFontFile
        },
        size () {
          return finalOptimizeFontFile.length
        }
      }
    })
  }
  end () {
    if (!isSuccessLoad) {
      isSuccessLoad = true
    }
    // 非开发模式下的hot模式，插件运行结束后及时释放服务器资源
    if ((this.options.isDev && !this.options.hot) || !this.options.isDev) {
      closeServer()
    }
    finalAssetsReady()
  }
  abortHandler (e) {
    console.log(chalk.red(`\n${pluginName}未正常执行完毕，请根据错误信息解决异常。错误信息：\n`), e)
    if (this.options.silent && finalAssetsReady) {
      finalAssetsReady()
    }
  }
}
module.exports = SPAFontSpliderPlugin;
