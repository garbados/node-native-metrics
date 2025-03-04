/*
 * Copyright 2020 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict'

var a = require('async')
var fs = require('fs')
var path = require('path')
var pkg = require('../../package')
var tap = require('tap')

var MODULE_DIR = path.resolve(__dirname, '../../node_modules')
var LICENSES = {
  nan: 'MIT',
  semver: 'ISC'
}

tap.test('Dependency licenses', function (t) {
  var deps = Object.keys(pkg.dependencies || {})
  deps.push.apply(deps, Object.keys(pkg.optionalDependencies || {}))
  a.map(
    deps,
    function (dep, cb) {
      a.waterfall(
        [
          function readFile(readFileCb) {
            fs.readFile(
              path.join(MODULE_DIR, dep, 'package.json'),
              { encoding: 'utf8' },
              readFileCb
            )
          },
          function parsePkg(depPackage, parsePkgCb) {
            try {
              var parsedPackage = JSON.parse(depPackage)
              var license = parsedPackage.license || parsedPackage.licenses
              process.nextTick(function () {
                parsePkgCb(null, [dep, license])
              })
            } catch (e) {
              parsePkgCb(e)
            }
          }
        ],
        cb
      )
    },
    function (err, depLicensesArray) {
      if (t.error(err, 'should not fail to retrieve licenses')) {
        var depLicenses = depLicensesArray.reduce(function (obj, dep) {
          obj[dep[0]] = dep[1]
          return obj
        }, {})

        t.same(depLicenses, LICENSES, 'should have expected licenses')
      }
      t.end()
    }
  )
})
