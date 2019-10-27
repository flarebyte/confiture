'use strict';
let fs = require('fs-extra');
let zlib = require('zlib');
let stream = require('stream');
let Readable = stream.Readable;
let crypto = require('crypto');
let util = require('util');
let path = require('path');
let _ = require('lodash');
let validator = require('is-my-json-valid');
let Joi = require('joi');
let moment = require('moment');

let SPACES = 4;
let OK = 'OK';

let confSchema = Joi.object()
  .keys({
    name: Joi.string()
      .min(2)
      .required()
      .description('base name for the configuration file'),
    compression: Joi.string()
      .valid('gz')
      .optional()
      .description('compression algorithm')
      .example('gz'),
    encryption: Joi.string()
      .valid(crypto.getCiphers())
      .optional()
      .description('encryption algorithm')
      .example('aes-256-cbc'),
    password: Joi.string()
      .min(2)
      .description('password for encryption'),
    schema: [
      Joi.string()
        .min(2)
        .description('json-schema file path'),
      Joi.object().description('json-schema content')
    ],
    baseDirectory: Joi.string()
      .min(2)
      .required()
      .description('parent directory containing the configuration file'),
    relativeDirectory: Joi.string()
      .min(2)
      .optional()
      .description('the child directory containing the configuration file'),
    backupBeforeSave: Joi.boolean()
      .default(false)
      .description('true if the configuration file must be backup before save')
  })
  .with('encryption', ['password']);

let isSchemaFile = function(value) {
  return _.isString(value);
};

let isSchemaContent = function(value) {
  return _.isPlainObject(value);
};

let loadSchema = function(value) {
  if (isSchemaContent(value)) {
    return value;
  } else if (isSchemaFile(value)) {
    return fs.readJsonSync(value);
  } else {
    throw new Error('Unknown schema ' + value);
  }
};

let schemaValidator = function(value) {
  let schema = loadSchema(value);
  return validator(schema);
};

module.exports = function(config) {
  let confg = Joi.validate(config, confSchema);

  if (!_.isNull(confg.error)) {
    throw new Error(confg.error);
  }

  let cfg = confg.value;

  let isCompressed = _.has(cfg, 'compression');
  let isEncrypted = _.has(cfg, 'encryption');
  let hasRelativeDirectory = _.has(cfg, 'relativeDirectory');

  let validate = schemaValidator(cfg.schema); // sync

  let content = null;

  let getConfigurationFilename = function() {
    let filename = cfg.name + '.json';
    if (isEncrypted) {
      filename = filename + '.' + cfg.encryption;
    } else if (isCompressed) {
      filename = filename + '.' + cfg.compression;
    }

    return filename;
  };

  let confFilename = getConfigurationFilename();

  cfg.filename = confFilename;

  let filepath = hasRelativeDirectory
    ? path.join(cfg.baseDirectory, cfg.relativeDirectory, confFilename)
    : path.join(cfg.baseDirectory, confFilename);

  cfg.filepath = filepath;

  let backup = function() {
    let suffix = moment().format();
    let backupFilepath = filepath + '.bak-' + suffix;
    try {
      fs.renameSync(filepath, backupFilepath);
    } catch (e) {
      console.error(e);
    }
  };

  let loadJson = function() {
    let jsonToCheck = fs.readJsonSync(filepath);
    return jsonToCheck;
  };

  let loadCompressedJson = function() {
    let compressed = fs.readFileSync(filepath);
    let uncompressed = zlib.gunzipSync(compressed).toString();
    let jsonToCheck = JSON.parse(uncompressed);
    return jsonToCheck;
  };

  let loadEncryptedJson = function() {
    let encrypted = fs.readFileSync(filepath);
    let decipher = crypto.createDecipher(cfg.encryption, cfg.password);
    let dec = decipher.update(encrypted, 'hex', 'utf8');
    dec += decipher.final('utf8');
    let jsonToCheck = JSON.parse(dec);
    return jsonToCheck;
  };

  let load = function() {
    let loaded = null;
    if (isEncrypted) {
      loaded = loadEncryptedJson();
    } else if (isCompressed) {
      loaded = loadCompressedJson();
    } else {
      loaded = loadJson();
    }

    if (!validate(loaded)) {
      return new Error(
        util.format('Failed validation while loading: %j', validate.errors)
      );
    }

    content = loaded;
    return content;
  };

  let saveJson = function(wishedJson) {
    let jsonStr = JSON.stringify(wishedJson, null, SPACES);
    let wstream = fs.createWriteStream(filepath);
    wstream.write(jsonStr);
    return wstream;
  };

  let saveJsonSync = function(wishedJson) {
    try {
      fs.writeJsonSync(filepath, wishedJson, { spaces: SPACES });
      return OK;
    } catch (err) {
      return err;
    }
  };

  let stringReader = function(str) {
    let r = new Readable();
    r._read = function() {
      r.push(str);
      r.push(null);
    };
    return r;
  };

  let saveCompressedJson = function(wishedJson) {
    let jsonStr = JSON.stringify(wishedJson, null, SPACES);
    let rstream = stringReader(jsonStr);
    let zipstream = cfg === 'gz' ? zlib.createGzip() : zlib.createGzip(); // TODO (zip?)
    let wstream = fs.createWriteStream(filepath);
    rstream.pipe(zipstream).pipe(wstream);
    return wstream;
  };

  let saveCompressedJsonSync = function(wishedJson) {
    let jsonStr = JSON.stringify(wishedJson, null, SPACES);
    try {
      let compressed = zlib.gzipSync(jsonStr);
      fs.writeFileSync(filepath, compressed);
      return OK;
    } catch (err) {
      return err;
    }
  };

  let saveEncrypedJson = function(wishedJson) {
    let jsonStr = JSON.stringify(wishedJson, null, SPACES);
    let rstream = stringReader(jsonStr);
    let encryptor = crypto.createCipher(cfg.encryption, cfg.password);
    let wstream = fs.createWriteStream(filepath);
    rstream.pipe(encryptor).pipe(wstream);
    return wstream;
  };

  let saveEncrypedJsonSync = function(wishedJson) {
    let jsonStr = JSON.stringify(wishedJson, null, SPACES);
    let encryptor = crypto.createCipher(cfg.encryption, cfg.password);
    try {
      let enc = encryptor.update(jsonStr, 'utf8', 'hex');
      enc += encryptor.final('hex');
      let buff = new Buffer(enc, 'hex');
      fs.writeFileSync(filepath, buff);
      return OK;
    } catch (err) {
      return err;
    }
  };

  let confDirectory = hasRelativeDirectory
    ? path.join(cfg.baseDirectory, cfg.relativeDirectory)
    : cfg.baseDirectory;
  let ensureDirectory = function() {
    fs.ensureDir(confDirectory);
  };

  let save = function(wishedJson) {
    if (!validate(wishedJson)) {
      return new Error(
        util.format('Failed validation while saving: %j', validate.errors)
      );
    }
    ensureDirectory();

    if (cfg.backupBeforeSave) {
      backup();
    }
    content = wishedJson;
    let rstream = null;

    if (isEncrypted) {
      rstream = saveEncrypedJson(wishedJson);
    } else if (isCompressed) {
      rstream = saveCompressedJson(wishedJson);
    } else {
      rstream = saveJson(wishedJson);
    }

    return rstream;
  };

  let saveSync = function(wishedJson) {
    if (!validate(wishedJson)) {
      return new Error(
        util.format('Failed validation while saving: %j', validate.errors)
      );
    }
    ensureDirectory();

    if (cfg.backupBeforeSave) {
      backup();
    }
    content = wishedJson;
    let saveResult = OK;

    if (isEncrypted) {
      saveResult = saveEncrypedJsonSync(wishedJson);
    } else if (isCompressed) {
      saveResult = saveCompressedJsonSync(wishedJson);
    } else {
      saveResult = saveJsonSync(wishedJson);
    }

    return saveResult;
  };

  let getConfiguration = function() {
    return _.clone(cfg);
  };

  let confiture = {
    configuration: getConfiguration,
    load,
    save,
    saveSync
  };

  return confiture;
};
