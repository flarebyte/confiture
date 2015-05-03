/*global describe, it */
'use strict';
var fs = require('fs-extra');
var assert = require('chai').assert;
var confiture = require('../');

fs.emptyDirSync(__dirname + "/temp");

var lodash_json = {
    name: "lodash",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "fixtures"
};

var bad_lodash_json = {
    name: "bad-lodash",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "fixtures"
};

var read_gz_lodash_json = {
    name: "read-lodash-gz",
    compression: "gz",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "fixtures"
};

var read_aes128_lodash_json = {
    name: "read-lodash-aes",
    encryption: "aes-256-cbc",
    password: "confiture rocks",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "fixtures"
};

var write_lodash_json = {
    name: "write-lodash",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "temp"
};

var write_lodash_json_with_backup = {
    name: "write-lodash-bak",
    backupBeforeSave: true,
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "temp"
};

var write_gz_lodash_json = {
    name: "write-lodash",
    compression: "gz",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "temp"
};

var write_aes128_lodash_json = {
    name: "write-lodash",
    encryption: "aes-256-cbc",
    password: "confiture rocks",
    schema: __dirname + "/fixtures/pack.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "temp"
};

var displayError = function(e) {
    throw new Error("Tests failed with error: " + e);
};


describe('confiture node module', function() {
    it('must configure simple json', function() {
        var conf = confiture(lodash_json).configuration();
        assert.equal(conf.name, "lodash");
    });

    it('must load and validate simple json', function() {
        var json = confiture(lodash_json).load();
        assert.equal(json.name, 'lodash');
        assert.equal(json.version, '3.7.0');
    });

    it('must not load and validate bad json', function() {
        assert.instanceOf(confiture(bad_lodash_json).load(), Error, "should detect misconfiguration");
    });

    it('must load and validate compressed json', function() {
        var json = confiture(read_gz_lodash_json).load();
        assert.equal(json.name, 'lodash');
        assert.equal(json.version, '3.7.0');
    });

    it('must load and validate encryped json', function() {
        var json = confiture(read_aes128_lodash_json).load();
        assert.equal(json.name, 'lodash');
        assert.equal(json.version, '3.7.0');
    });

    it('must save and validate simple json', function() {
        var json = confiture(lodash_json).load();
        var stream = confiture(write_lodash_json).save(json);
        stream.on("error", displayError);
        assert.isNotNull(stream);
    });

    it('must save and validate simple json with backup', function() {
        var json = confiture(lodash_json).load();
        fs.writeJsonSync(__dirname + "/temp/write-lodash-bak.json", json);
        var stream = confiture(write_lodash_json_with_backup).save(json);
        stream.on("error", displayError);
        assert.isNotNull(stream);
    });

    it('must validate, compress, save json', function() {
        var json = confiture(lodash_json).load();
        var stream = confiture(write_gz_lodash_json).save(json);
        stream.on("error", displayError);
        assert.isNotNull(stream);
    });

    it('must validate, encrypt, save json', function() {
        var json = confiture(lodash_json).load();
        var stream = confiture(write_aes128_lodash_json).save(json);
        stream.on("error", displayError);
        assert.isNotNull(stream);
    });


});