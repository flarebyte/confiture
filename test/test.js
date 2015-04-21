/*global describe, it */
'use strict';
var assert = require('assert');
var confiture = require('../');

describe('confiture node module', function () {
  it('must have at least one test', function () {
    confiture().info();
    assert(false, 'I was too lazy to write any tests. Shame on me.');
  });
});
