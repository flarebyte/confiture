/*global describe, it */
'use strict';

import test from 'ava';
import fs from 'fs-extra';
import confiture from './confiture';

const packSchemaPath = 'test-data/fixtures/pack.schema.json';
const baseDirectory = 'test-data';
fs.emptyDirSync(baseDirectory + '/temp');

const lodashJson = {
  name: 'lodash',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'fixtures'
};

const badLodashJson = {
  name: 'bad-lodash',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'fixtures'
};

const readgzLodashJson = {
  name: 'read-lodash-gz',
  compression: 'gz',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'fixtures'
};

const readAes128LodashJson = {
  name: 'read-lodash-aes',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'fixtures'
};

const writeLodashJson = {
  name: 'write-lodash',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeSyncLodashJson = {
  name: 'write-sync-lodash',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeLodashJsonWithBackup = {
  name: 'write-lodash-bak',
  backupBeforeSave: true,
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeSyncLodashJsonWithBackup = {
  name: 'write-sync-lodash-bak',
  backupBeforeSave: true,
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeGzLodashJson = {
  name: 'write-lodash',
  compression: 'gz',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeSyncGzLodashJson = {
  name: 'write-sync-lodash',
  compression: 'gz',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeAes128LodashJson = {
  name: 'write-lodash',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const writeSyncAes128LodashJson = {
  name: 'write-sync-lodash',
  encryption: 'aes-256-cbc',
  password: 'confiture rocks',
  schema: packSchemaPath,
  baseDirectory,
  relativeDirectory: 'temp'
};

const displayError = (e: any) => {
  throw new Error('Tests failed with error: ' + e);
};

test('must configure simple json', t => {
  const conf = confiture(lodashJson).configuration();
  t.is(conf.name, 'lodash');
});

test('must load and validate simple json', t => {
  const json = confiture(lodashJson).load();
  t.is(json.name, 'lodash');
  t.is(json.version, '3.7.0');
});

test('must not load and validate bad json', t => {
  const error = t.throws(() => confiture(badLodashJson).load(), Error);
  t.truthy(error.message);
});

test('must load and validate compressed json', t => {
  const json = confiture(readgzLodashJson).load();
  t.is(json.name, 'lodash');
  t.is(json.version, '3.7.0');
});

test('must load and validate encryped json', t => {
  const json = confiture(readAes128LodashJson).load();
  t.is(json.name, 'lodash');
  t.is(json.version, '3.7.0');
});

test('must save and validate simple json', t => {
  const json = confiture(lodashJson).load();
  const stream = confiture(writeLodashJson).save(json);
  if ((stream as fs.WriteStream).on) {
    (stream as fs.WriteStream).on('error', displayError);
  }
  t.not(stream, null);
});

test('must save and validate simple json synchronously', t => {
  const json = confiture(lodashJson).load();
  const result = confiture(writeSyncLodashJson).saveSync(json);
  t.is(result, 'OK');
});

test('must save and validate simple json with backup', t => {
  const json = confiture(lodashJson).load();
  fs.writeJsonSync(__dirname + '/temp/write-lodash-bak.json', json);
  const stream = confiture(writeLodashJsonWithBackup).save(json);
  if ((stream as fs.WriteStream).on) {
    (stream as fs.WriteStream).on('error', displayError);
  }
  t.not(stream, null);
});

test('must save and validate simple json with backup synchronously', t => {
  const json = confiture(lodashJson).load();
  fs.writeJsonSync(__dirname + '/temp/write-sync-lodash-bak.json', json);
  const result = confiture(writeSyncLodashJsonWithBackup).saveSync(json);
  t.is(result, 'OK');
});

test('must validate, compress, save json', t => {
  const json = confiture(lodashJson).load();
  const stream = confiture(writeGzLodashJson).save(json);
  if ((stream as fs.WriteStream).on) {
    (stream as fs.WriteStream).on('error', displayError);
  }
  t.not(stream, null);
});

test('must validate, compress, save json synchronously', t => {
  const json = confiture(lodashJson).load();
  const result = confiture(writeSyncGzLodashJson).saveSync(json);
  t.is(result, 'OK');
});

test('must validate, encrypt, save json', t => {
  const json = confiture(lodashJson).load();
  const stream = confiture(writeAes128LodashJson).save(json);
  if ((stream as fs.WriteStream).on) {
    (stream as fs.WriteStream).on('error', displayError);
  }
  t.not(stream, null);
});

test('must validate, encrypt, save json synchronously', t => {
  const json = confiture(lodashJson).load();
  const result = confiture(writeSyncAes128LodashJson).saveSync(json);
  t.is(result, 'OK');
});
