/*global describe, it */
'use strict';
let fs = require('fs-extra');
let assert = require('chai').assert;
let confiture = require('../');

fs.emptyDirSync(__dirname + '/temp');

let lodash_json = {
  name: 'lodash',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'fixtures'
};

let bad_lodash_json = {
  name: 'bad-lodash',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'fixtures'
};

let read_gz_lodash_json = {
  name: 'read-lodash-gz',
  compression: 'gz',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'fixtures'
};

let read_aes128_lodash_json = {
  name: 'read-lodash-aes',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'fixtures'
};

let write_lodash_json = {
  name: 'write-lodash',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_sync_lodash_json = {
  name: 'write-sync-lodash',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_lodash_json_with_backup = {
  name: 'write-lodash-bak',
  backupBeforeSave: true,
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_sync_lodash_json_with_backup = {
  name: 'write-sync-lodash-bak',
  backupBeforeSave: true,
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_gz_lodash_json = {
  name: 'write-lodash',
  compression: 'gz',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_sync_gz_lodash_json = {
  name: 'write-sync-lodash',
  compression: 'gz',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_aes128_lodash_json = {
  name: 'write-lodash',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let write_sync_aes128_lodash_json = {
  name: 'write-sync-lodash',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: __dirname + '/fixtures/pack.schema.json',
  baseDirectory: __dirname,
  relativeDirectory: 'temp'
};

let displayError = function(e) {
  throw new Error('Tests failed with error: ' + e);
};

describe('confiture node module', function() {
  it('must configure simple json', function() {
    let conf = confiture(lodash_json).configuration();
    assert.equal(conf.name, 'lodash');
  });

  it('must load and validate simple json', function() {
    let json = confiture(lodash_json).load();
    assert.equal(json.name, 'lodash');
    assert.equal(json.version, '3.7.0');
  });

  it('must not load and validate bad json', function() {
    assert.instanceOf(
      confiture(bad_lodash_json).load(),
      Error,
      'should detect misconfiguration'
    );
  });

  it('must load and validate compressed json', function() {
    let json = confiture(read_gz_lodash_json).load();
    assert.equal(json.name, 'lodash');
    assert.equal(json.version, '3.7.0');
  });

  it('must load and validate encryped json', function() {
    let json = confiture(read_aes128_lodash_json).load();
    assert.equal(json.name, 'lodash');
    assert.equal(json.version, '3.7.0');
  });

  it('must save and validate simple json', function() {
    let json = confiture(lodash_json).load();
    let stream = confiture(write_lodash_json).save(json);
    stream.on('error', displayError);
    assert.isNotNull(stream);
  });

  it('must save and validate simple json synchronously', function() {
    let json = confiture(lodash_json).load();
    let result = confiture(write_sync_lodash_json).saveSync(json);
    assert.equal(result, 'OK');
  });

  it('must save and validate simple json with backup', function() {
    let json = confiture(lodash_json).load();
    fs.writeJsonSync(__dirname + '/temp/write-lodash-bak.json', json);
    let stream = confiture(write_lodash_json_with_backup).save(json);
    stream.on('error', displayError);
    assert.isNotNull(stream);
  });

  it('must save and validate simple json with backup synchronously', function() {
    let json = confiture(lodash_json).load();
    fs.writeJsonSync(__dirname + '/temp/write-sync-lodash-bak.json', json);
    let result = confiture(write_sync_lodash_json_with_backup).saveSync(json);
    assert.equal(result, 'OK');
  });

  it('must validate, compress, save json', function() {
    let json = confiture(lodash_json).load();
    let stream = confiture(write_gz_lodash_json).save(json);
    stream.on('error', displayError);
    assert.isNotNull(stream);
  });

  it('must validate, compress, save json synchronously', function() {
    let json = confiture(lodash_json).load();
    let result = confiture(write_sync_gz_lodash_json).saveSync(json);
    assert.equal(result, 'OK');
  });

  it('must validate, encrypt, save json', function() {
    let json = confiture(lodash_json).load();
    let stream = confiture(write_aes128_lodash_json).save(json);
    stream.on('error', displayError);
    assert.isNotNull(stream);
  });

  it('must validate, encrypt, save json synchronously', function() {
    let json = confiture(lodash_json).load();
    let result = confiture(write_sync_aes128_lodash_json).saveSync(json);
    assert.equal(result, 'OK');
  });
});
