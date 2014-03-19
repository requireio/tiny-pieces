/*
 * Convenience wrapper for creating custom element prototypes.
 */

require('polyfill-webcomponents')

var ProtoEmitter = require('prototype-emitter')
var slice = require('sliced')
var clone = require('clone')
var xtend = require('xtend')

module.exports = createCustom

function createCustom(proto) {
  proto = proto || HTMLElement.prototype

  var CustomHTMLElement = Object.create(proto)

  var observers = CustomHTMLElement.observers = clone(CustomHTMLElement.observers || {})
  var bindings = CustomHTMLElement.bindings = clone(CustomHTMLElement.bindings || [])

  CustomHTMLElement.bind = bindToKey
  CustomHTMLElement.attributeChangedCallback = when('attribute')
  CustomHTMLElement.detachedCallback = when('detach')
  CustomHTMLElement.attachedCallback = when('attach')
  CustomHTMLElement.createdCallback = when('created')

  var exported = ProtoEmitter({
      bind: listenBind
    , prototype: CustomHTMLElement
    , use: use
  })

  // TODO: Unsure if this belongs in prototype-emitter
  // module code or not?
  exported.prototype._sharedEvents = xtend(
      exported.prototype._sharedEvents
    , clone(proto._sharedEvents || {})
  )

  exported.prototype._onceEvents = []
    .concat(exported.prototype._onceEvents)
    .concat(clone(proto._onceEvents || []))

  exported.when = exported.on

  if (!exported.prototype._sharedEvents.created) {
    exported.when('created', function() {
      this._events = this._events || {}

      for (var i = 0; i < this._onceEvents.length; i++) {
        this.once.apply(this, this._onceEvents[i])
      }
    })
  }

  return exported

  function when(key) {
    return function() {
      var args = slice(arguments)
      args.unshift(key)
      this.emit.apply(this, args)
    }
  }

  function use(fn) {
    fn && fn(exported)
    return exported
  }

  function bindToKey(name, observer) {
    var observers = this._observers = this._observers || {}

    for (var i = 0; i < bindings.length; i++) {
      var b = bindings[i]
      if (b.name === name) {
        observers[name] = observers[name] || multiListener(observer)
        observers[name].call(this, b.fn)
      }
    }

    if (observers[name]) return
    return HTMLElement.prototype.bind.apply(this, arguments)
  }

  // observer.open can only attach a single callback,
  // so to respond to multiple events we have to add that
  // functionality in ourself.
  //
  // We keep a cache of observers, by key, for each
  function multiListener(observer) {
    var listeners = []
    var l = 0

    observer.open(function() {
      var args = slice(arguments)
      for (var i = 0; i < l; i += 1) {
        listeners[i][1].apply(listeners[i][0], args)
      }
    })

    return function(listener) {
      l += 1
      listeners.push([this, listener])
    }
  }

  function listenBind(attr, listener) {
    bindings.push({
        name: attr
      , fn: listener
    })

    // The current implementation of HTMLElement::bind
    // doesn't account for when elements are first attached
    // to the DOM, despite Polymer taking care of this.
    return exported.on('attach', function() {
      var value = this.getAttribute(attr)
      if (!isBinding(value)) return // ignore non-bindings

      var model = this.templateInstance && this.templateInstance.model
      if (!model) {
        console.warn('Attached bound element with no container template: ', this)
        return // ignore no template-instance model
      }

      // if there's more than one pair of mustaches,
      // just emit the concatenated string.
      if (hasMultipleMustaches(value)) {
        value = value.replace(/\{\{([^{}]*)}}/g, function(_, key) {
          return atpath(key)(model)
        })

        return listener.call(this, value)
      }

      value = value.match(/\{\{([^{}]*)}}/)[1]
      value = value.replace(/^\{\{|}}$/g, '')

      if (!atpath.valid(value)) return // can't do any more useful work.

      value = atpath(value)(model)

      // Currently, don't trigger an event if
      // the value is undefined, as that's probably
      // not intended anyway.
      if (typeof value !== 'undefined') {
        listener.call(this, value)
      }
    })
  }
}

function isBinding(str) {
  return str && /\{\{(?:[^{}]*)}}/g.test(str)
}

function hasMultipleMustaches(value) {
  return value.match(/\{\{([^{}]*)}}/g).length > 1
}

function extend(a, b) {
  Object.keys(b).forEach(function(k) {
    if (typeof a[k] === 'object') {
      extend(a[k], b[k])
    } else {
      a[k] = b[k]
    }
  })

  return a
}
