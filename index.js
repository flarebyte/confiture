'use strict';
var fs = require('fs-extra');
var zlib = require('zlib');
var stream = require('stream');
var Readable = stream.Readable;
var crypto = require('crypto');
var util = require('util');
var path = require('path');
var _ = require('lodash');
var validator = require('is-my-json-valid');
var Joi = require('joi');
var moment = require('moment');

var SPACES = 4;

var confSchema = Joi.object().keys({
    name: Joi.string().min(2).required().description('base name for the configuration file'),
    compression: Joi.string().valid('gz').optional().description('compression algorithm').example('gz'),
    encryption: Joi.string().valid(crypto.getCiphers()).optional().description('encryption algorithm').example('aes-256-cbc'),
    password: Joi.string().min(2).description('password for encryption'),
    schema: [Joi.string().min(2).description('json-schema file path'), Joi.object().description('json-schema content')],
    baseDirectory: Joi.string().min(2).required().description('parent directory containing the configuration file'),
    relativeDirectory: Joi.string().min(2).optional().description('the child directory containing the configuration file'),
    backupBeforeSave: Joi.boolean().default(false).description('true if the configuration file must be backup before save')
}).with('encryption', ['password']);

var isSchemaFile = function(value) {
    return _.isString(value);
};

var isSchemaContent = function(value) {
    return _.isPlainObject(value);
};

var loadSchema = function(value) {
    if (isSchemaContent(value)) {
        return value;
    } else
    if (isSchemaFile(value)) {
        return fs.readJsonSync(value);
    } else {
        throw new Error("Unknown schema " + value);
    }
};

var schemaValidator = function(value) {
    var schema = loadSchema(value);
    return validator(schema);
};



module.exports = function(config) {
    var confg = Joi.validate(config, confSchema);

    if (!_.isNull(confg.error)) {
        throw new Error(confg.error);
    }

    var cfg = confg.value;

    var isCompressed = _.has(cfg, "compression");
    var isEncrypted = _.has(cfg, "encryption");
    var hasRelativeDirectory = _.has(cfg, "relativeDirectory");

    var validate = schemaValidator(cfg.schema); //sync    

    var content = null;


    var getConfigurationFilename = function() {
        var filename = cfg.name + ".json";
        if (isEncrypted) {
            filename = filename + "." + cfg.encryption;
        } else if (isCompressed) {
            filename = filename + "." + cfg.compression;
        }

        return filename;
    };

    var confFilename = getConfigurationFilename();

    cfg.filename = confFilename;

    var filepath = hasRelativeDirectory ? path.join(cfg.baseDirectory, cfg.relativeDirectory, confFilename) : path.join(cfg.baseDirectory, confFilename);

    cfg.filepath = filepath;

    var backup = function() {
        var suffix = moment().format();
        var backupFilepath = filepath + ".bak-" + suffix;
        try {
            fs.renameSync(filepath, backupFilepath);
        } catch (e) {
            console.error(e);
        }
    };

    var loadJson = function() {
        var jsonToCheck = fs.readJsonSync(filepath);
        return jsonToCheck;
    };

    var loadCompressedJson = function() {
        var compressed = fs.readFileSync(filepath);
        var uncompressed = zlib.gunzipSync(compressed).toString();
        var jsonToCheck = JSON.parse(uncompressed);
        return jsonToCheck;
    };

    var loadEncryptedJson = function() {
        var encrypted = fs.readFileSync(filepath);
        var decipher = crypto.createDecipher(cfg.encryption, cfg.password);
        var dec = decipher.update(encrypted, 'hex', 'utf8');
        dec += decipher.final('utf8');
        var jsonToCheck = JSON.parse(dec);
        return jsonToCheck;
    };

    var load = function() {
        var loaded = null;
        if (isEncrypted) {
            loaded = loadEncryptedJson();
        } else if (isCompressed) {
            loaded = loadCompressedJson();
        } else {
            loaded = loadJson();
        }

        if (!validate(loaded)) {
            return new Error(util.format("Failed validation while loading: %j", validate.errors));
        }

        content = loaded;
        return content;

    };

    var saveJson = function(wishedJson) {
        var jsonStr = JSON.stringify(wishedJson, null, SPACES);
        var wstream = fs.createWriteStream(filepath);
        wstream.write(jsonStr);
        return wstream;
    };

    var stringReader = function(str) {
        var r = new Readable();
        r._read = function() {
            r.push(str);
            r.push(null);
        };
        return r;
    };

    var saveCompressedJson = function(wishedJson) {
        var jsonStr = JSON.stringify(wishedJson, null, SPACES);
        var rstream = stringReader(jsonStr);
        var zipstream = cfg === "gz" ? zlib.createGzip() : zlib.createGzip(); //TODO (zip?)
        var wstream = fs.createWriteStream(filepath);
        rstream.pipe(zipstream).pipe(wstream);
        return wstream;
    };

    var saveEncrypedJson = function(wishedJson) {
        var jsonStr = JSON.stringify(wishedJson, null, SPACES);
        var rstream = stringReader(jsonStr);
        var encryptor = crypto.createCipher(cfg.encryption, cfg.password);
        var wstream = fs.createWriteStream(filepath);
        rstream.pipe(encryptor).pipe(wstream);
        return wstream;
    };

    var confDirectory = hasRelativeDirectory ? path.join(cfg.baseDirectory, cfg.relativeDirectory) : cfg.baseDirectory;
    var ensureDirectory = function() {
        fs.ensureDir(confDirectory);
    };

    var save = function(wishedJson) {
        if (!validate(wishedJson)) {
            return new Error(util.format("Failed validation while saving: %j", validate.errors));
        }
        ensureDirectory();

        if (cfg.backupBeforeSave) {
            backup();
        }
        content = wishedJson;
        var rstream = null;

        if (isEncrypted) {
            rstream = saveEncrypedJson(wishedJson);
        } else if (isCompressed) {
            rstream = saveCompressedJson(wishedJson);
        } else {
            rstream = saveJson(wishedJson);
        }

        return rstream;

    };

    var getConfiguration = function() {
        return _.clone(cfg);
    };

    var confiture = {
        configuration: getConfiguration,
        load: load,
        save: save
    };

    return confiture;

};