const fs = require('fs')
const chalk = require('chalk')
const axios = require('axios').default

module.exports = (assets, pluginOptions) => {
  return new Promise((resolve, reject) => {
    let loadedNumber = 0
    const fontFamilyPkgList = pluginOptions.fontFamilyPkgList
    const fontPkgUrlMapFileName = pluginOptions.fontPkgUrlMapFileName
    fontFamilyPkgList.forEach(({ url }) => {
      axios.get(url, {responseType: 'arraybuffer'})
      .then(response => {
        assets[fontPkgUrlMapFileName[url]] = {
          source: () => response.data,
          size: () => response.data.length
        }
        loadedNumber++
        if (loadedNumber === fontFamilyPkgList.length) {
          resolve({assets, pluginOptions})
        }
      })
      .catch(error => {
        console.log(chalk.red(`\n字体包文件资源：${url}获取失败\n`))
        reject(error)
      })
    })
  })
}