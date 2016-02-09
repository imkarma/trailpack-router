'use strict'

const assert = require('assert')
const lib = require('../../../lib')
const _ = require('lodash')

describe('lib.util', () => {

  describe('#getRoutePath', () => {
    it('should generate correct path for typical use case', () => {
      assert.equal(lib.Util.getRoutePath([ 'foo', 'bar' ]), '/foo/bar')
    })
    it('should generate correct path for boundary case', () => {
      assert.equal(lib.Util.getRoutePath('/'), '/')
    })
    it('should generate correct path when given leading and trailing slashes', () => {
      assert.equal(lib.Util.getRoutePath([ 'foo', '/bar' ]),   '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo', 'bar' ]),   '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo', '/bar' ]),  '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ 'foo/', '/bar' ]),  '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ 'foo', '/bar/' ]),  '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo/', '/bar/' ]),'/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo/', 'bar' ]),  '/foo/bar')

      assert.equal(lib.Util.getRoutePath([ '/foo//', '/baz/', '//bar/' ]),'/foo/baz/bar')
    })
    it('should generate correct path when given hapi path params', () => {
      assert.equal(lib.Util.getRoutePath([ 'foo', '/{model}/{id?}' ]),   '/foo/{model}/{id?}')
      assert.equal(lib.Util.getRoutePath([ 'foo', '/{model}/{id?}/' ]),   '/foo/{model}/{id?}')
      assert.equal(lib.Util.getRoutePath([ 'foo', '{model}/{id?}' ]),   '/foo/{model}/{id?}')
    })
    it('should generate correct path when given an array with one element', () => {
      assert.equal(lib.Util.getRoutePath([ 'foo/bar' ]),   '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo/bar/' ]),   '/foo/bar')
      assert.equal(lib.Util.getRoutePath([ '/foo//bar/' ]),   '/foo/bar')
    })
    it('should generate correct path when given a raw string', () => {
      assert.equal(lib.Util.getRoutePath('foo/bar'),   '/foo/bar')
    })
    it('should generate correct path when given regular arguments', () => {
      assert.equal(lib.Util.getRoutePath('foo', 'bar'),   '/foo/bar')
      assert.equal(lib.Util.getRoutePath('/foo', '/bar'),   '/foo/bar')
    })
    it('should generate correct path when given unlikely craziness', () => {
      assert.equal(lib.Util.getRoutePath('foo', [ 'bar', [ 'baz/boo///' ] ]), '/foo/bar/baz/boo')
    })
    it('should fail if unparseable inputs are provided', () => {
      assert.throws(() => lib.Util.getRoutePath(function () { }), TypeError)
    })
    it('should fail if no arguments provided', () => {
      assert.throws(() => lib.Util.getRoutePath(), TypeError)
    })
    it('should fail if falsy arguments provided', () => {
      assert.throws(() => lib.Util.getRoutePath(null), TypeError)
      assert.throws(() => lib.Util.getRoutePath(''), TypeError)
      assert.throws(() => lib.Util.getRoutePath(undefined), TypeError)
      assert.throws(() => lib.Util.getRoutePath(false), TypeError)
      assert.throws(() => lib.Util.getRoutePath([ false, null ]), TypeError)
    })
  })

  describe('#getRouteId', () => {
    const routes = [
      {
        method: 'GET',
        path: '/foo/bar',
        handler: 'FooController.fooHandler'
      },
      {
        method: [ 'GET', 'POST' ],
        path: '/',
        handler: 'FooController.fooHandler'
      },
      {
        method: '*',
        path: '/foo/bar',
        handler: 'FooController.fooHandler'
      }
    ]
    it('should generate a route id from a hapijs route object (single method)', () => {
      assert.equal(lib.Util.getRouteId(routes[0]), '[GET] /foo/bar -> FooController.fooHandler')
    })
    it('should generate a route id from a hapijs route object (multiple methods)', () => {
      assert.equal(lib.Util.getRouteId(routes[1]), '[GET,POST] / -> FooController.fooHandler')
    })
    it('should generate a route id from a hapijs route object (wildcard method)', () => {
      assert.equal(lib.Util.getRouteId(routes[2]), '[*] /foo/bar -> FooController.fooHandler')
    })
  })

  describe('#getRoutePrerequisites', () => {
    const policies = {
      FooController: [ 'FooPolicy.foo', 'FooPolicy.bar' ],
      BarController: {
        testHandler: [ 'BarPolicy.test' ]
      }
    }
    const routes = [
      {
        method: 'GET',
        path: '/foo/foo',
        handler: 'FooController.fooHandler'
      },
      {
        method: '*',
        path: '/bar/test',
        handler: 'BarController.testHandler'
      },
      {
        method: [ 'GET', 'POST' ],
        path: '/bar/foo',
        handler: 'BarController.fooHandler'
      }
    ]

    it('should attach controller-wide policies to all handlers in Controller', () => {
      const pre = lib.Util.getRoutePrerequisites(policies, routes[0])
      assert(_.includes(pre, 'FooPolicy.foo'))
      assert(_.includes(pre, 'FooPolicy.bar'))
      assert.equal(pre.length, 2)
    })
    it('should attach handler-specific policies to the corresponding handler in Controller', () => {
      const pre = lib.Util.getRoutePrerequisites(policies, routes[1])
      assert(_.includes(pre, 'BarPolicy.test'))
      assert.equal(pre.length, 1)
    })
    it('should attach no policies to handler which does not match any policy config', () => {
      const pre = lib.Util.getRoutePrerequisites(policies, routes[2])
      assert.equal(pre.length, 0)
    })
  })

  describe('#findRoutePathConflicts', () => {
    const handlerA = function () { }
    const handlerB = function () { }
    const handlerC = function () { }
    const routesList = [
      { method: '*', path: '/a', handler: handlerA },
      { method: 'GET', path: '/b', handler: handlerB },
      { method: [ 'GET' ], path: '/b', handler: handlerB },
      { method: [ 'GET', 'POST' ], path: '/c', handler: handlerC },
      { method: [ 'GET', 'POST', 'PUT' ], path: '/c', handler: handlerC }
    ]
    it('should detect conflict if methods are identical', () => {
      const route = {
        method: '*',
        path: '/a'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 1)
    })
    it('should detect confilict if methods overlap (non-array)', () => {
      const route = {
        method: 'GET',
        path: '/b'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 2)
    })
    it('should detect confilict if methods overlap (array)', () => {
      const route = {
        method: [ 'GET' ],
        path: '/b'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 2)
    })
    it('should detect confilict if methods overlap (subset)', () => {
      const route = {
        method: [ 'GET', 'POST' ],
        path: '/c'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 2)
    })
    it('should detect confilict if methods overlap (superset)', () => {
      const route = {
        method: [ 'GET', 'POST', 'PUT' ],
        path: '/c'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 2)
    })
    it('should not detect confilict if there exists none (matching path)', () => {
      const route = {
        method: 'PATCH',
        path: '/c'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 0)
    })
    it('should not detect confilict if there exists none (matching path (method array))', () => {
      const route = {
        method: [ 'PATCH' ],
        path: '/c'
      }
      const conflicts = lib.Util.findRoutePathConflicts(route, routesList)

      assert.equal(conflicts.length, 0)
    })
  })

  describe('#mergeRoutes', () => {
  })
})

