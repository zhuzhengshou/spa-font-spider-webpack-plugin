/**
 * @description 爬取要进行字体动态提取压缩的页面内容，由插件实例化参数的urlList决定
 */
const puppeteer = require('puppeteer')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')
const { devTmpPath, crawlingUserAgent } = require('../config')
const { getuuid } = require('../utils')
const chalk = require('chalk')

module.exports = ({serverHost, pluginOptions}) => {
  let crawlingEndNumber = 0
  const completeUrlList = pluginOptions.urlList.map(url => {
    return serverHost + url
  })
  return new Promise(async (resolve, reject) => {
    const browser = await puppeteer.launch() 
    completeUrlList.forEach(function(url){
      (async () => {
        try {
          const page = await browser.newPage()
          page.setUserAgent(crawlingUserAgent)
          await page.setRequestInterception(true)
          page.on('request', request => {
            request.continue()
          })
          page.on('dialog', dialog => {
            // 避免弹窗阻止页面爬取
            if (dialog.type() === 'alert') {
              dialog.accept()
            } else {
              console.log(chalk.red(`\n当前页面爬取时，被非alert弹窗阻塞，请检查url:${url.replace(serverHost, '')}\n`))
              reject()
            }
          })
          try {
            // 默认30s超时失败
            await page.goto(url, {
              waitUntil: [
                'load',              //等待 “load” 事件触发
                'domcontentloaded',  //等待 “domcontentloaded” 事件触发
                'networkidle0'      //不再有网络连接时触发（至少500毫秒后），用于SPA页面的动态加载之后
              ]
            })
          } catch (e) {
            if (e.message.includes('timeout')) {
              console.log(chalk.red(`\n待提取字体的h5页面资源请求链接在30s内超时，可能未爬取完整，错误页面url路径:${url.replace(serverHost, '')}，请根据提取出的字符判断已爬取的内容是否符合所需\n`))
            } else {
              console.log(chalk.red(`\n待提取字体的h5页面资源请求链接失败，错误页面url路径:${url.replace(serverHost, '')}\n`))
              reject(e)
            }
          }
          await page.content().then((content)=>{
            const absoulteUri = path.join(devTmpPath, `crawling-${getuuid()}.html`)
            fsExtra.ensureFileSync(absoulteUri)
            fs.writeFileSync(absoulteUri, content)
            crawlingEndNumber++
          })
          if (crawlingEndNumber === completeUrlList.length) {
            await browser.close()
            resolve(pluginOptions)
          }
        } catch (e) {
          console.log(chalk.red(`爬取页面${url.replace(serverHost, '')}出错`))
          reject(e)
        }
      })()
  })
  })
}