exports.getuuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
exports.isFontFamilyPkg = (val) => {
  return val &&
    (typeof val === 'object') &&
    (typeof val.name === 'string') &&
    (typeof val.url === 'string')
}