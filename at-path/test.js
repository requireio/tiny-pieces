var test = require('tape')
var path = require('./')

test('validation', function(t) {
  t.ok(path.valid('hello'), 'hello')
  t.ok(path.valid('hello.world'), 'hello.world')
  t.ok(path.valid('hello.world.again'), 'hello.world.again')
  t.ok(path.valid('$hello.world.again'), '$hello.world.again')
  t.notOk(path.valid('1_hello.world.again'), '1_hello.world.again')
  t.end()
})

test('at-path', function(t) {
  t.equal(path('hello')({
    hello: 'world'
  }), 'world')

  t.equal(path('hello.world')({
    hello: {
      world: 'again'
    }
  }), 'again')

  t.equal(path('hello.world.2')({
    hello: {
      world: [1,2,3]
    }
  }), 3)

  t.end()
})

test('undefined properties', function(t) {
  t.equal(path('hello')({
    world: 'something else'
  }), undefined)

  t.equal(path('hello.again')({
    hello: {
      world: 'something else'
    }
  }), undefined)

  t.end()
})
