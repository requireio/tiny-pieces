var sepExpression = '\\s*\\.\\s*'
var keyExpression = '(?:[\\$_a-zA-Z][\\$_a-zA-Z0-9]*|(?:[0-9]|[1-9][0-9]+))'
var validExpression = new RegExp('^' +
  keyExpression + '(?:' +
  sepExpression +
  keyExpression +
'){0,}$', 'g')

module.exports = atPath
module.exports.valid = validPath

function atPath(path) {
  if (!Array.isArray(path)) {
    path = String(path)
    path = path.split('.')
  }

  return function(object) {
    for (var i = 0; i < path.length; i++) {
      if (typeof object === 'undefined') return
      object = object[path[i]]
    }

    return object
  }
}

function validPath(path) {
  if (Array.isArray(path)) return true
  if (typeof path !== 'string') return
  if (path[0] === '.') return
  var result = validExpression.test(path)
  if (result) validExpression.lastIndex = 0
  return result
}
