'use strict';
import fs from 'fs-extra';
import  zlib from 'zlib';
import  stream from'stream';
const Readable = stream.Readable;
import  crypto from 'crypto';
import  util from 'util';
import  path from 'path';
import  _ from 'lodash';
import  validator from 'is-my-json-valid';
import  Joi from '@hapi/joi';
import  moment from 'moment';

const SPACES = 4;
const OK = 'OK';

const confSchema = Joi.object()
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

const isSchemaFile = function(value: any) {
  return _.isString(value);
};

const isSchemaContent = function(value: any) {
  return _.isPlainObject(value);
};

const loadSchema = function(value: any) {
  if (isSchemaContent(value)) {
    return value;
  } else if (isSchemaFile(value)) {
    return fs.readJsonSync(value);
  } else {
    throw new Error('Unknown schema ' + value);
  }
};

const schemaValidator = function(value: any) {
  const schema = loadSchema(value);
  return validator(schema);
};

module.exports = function(config: object) {

  const confg = confSchema.validate(config);

  if (!_.isNull(confg.error)) {
    throw new Error(confg.error.message);
  }

  const cfg = confg.value;

  const isCompressed = _.has(cfg, 'compression');
  const isEncrypted = _.has(cfg, 'encryption');
  const hasRelativeDirectory = _.has(cfg, 'relativeDirectory');

  const validate = schemaValidator(cfg.schema); // sync

  let content = null;

  const getConfigurationFilename = function() {
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

  const backup = function() {
    const suffix = moment().format();
    const backupFilepath = filepath + '.bak-' + suffix;
    try {
      fs.renameSync(filepath, backupFilepath);
    } catch (e) {
      console.error(e);
    }
  };

  const loadJson = function() {
    const jsonToCheck = fs.readJsonSync(filepath);
    return jsonToCheck;
  };

  const loadCompressedJson = function() {
    const compressed = fs.readFileSync(filepath);
    const uncompressed = zlib.gunzipSync(compressed).toString();
    const jsonToCheck = JSON.parse(uncompressed);
    return jsonToCheck;
  };

  const loadEncryptedJson = function() {
    const encrypted = fs.readFileSync(filepath);
    const decipher = crypto.createDecipher(cfg.encryption, cfg.password);
    let dec = decipher.update(encrypted, undefined, 'utf8');
    dec += decipher.final('utf8');
    const jsonToCheck = JSON.parse(dec);
    return jsonToCheck;
  };

  const load = function() {
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

  const saveJson = function(wishedJson: object) {
    const jsonStr = JSON.stringify(wishedJson, null, SPACES);
    const wstream = fs.createWriteStream(filepath);
    wstream.write(jsonStr);
    return wstream;
  };

  const saveJsonSync = function(wishedJson: object) {
    try {
      fs.writeJsonSync(filepath, wishedJson, { spaces: SPACES });
      return OK;
    } catch (err) {
      return err;
    }
  };

  const stringReader = function(str: string) {
    const r = new Readable();
    r._read = function() {
      r.push(str);
      r.push(null);
    };
    return r;
  };

  const saveCompressedJson = function(wishedJson: object) {
    const jsonStr = JSON.stringify(wishedJson, null, SPACES);
    const rstream = stringReader(jsonStr);
    const zipstream = cfg === 'gz' ? zlib.createGzip() : zlib.createGzip(); // TODO (zip?)
    const wstream = fs.createWriteStream(filepath);
    rstream.pipe(zipstream).pipe(wstream);
    return wstream;
  };

  const saveCompressedJsonSync = function(wishedJson: object) {
    const jsonStr = JSON.stringify(wishedJson, null, SPACES);
    try {
      const compressed = zlib.gzipSync(jsonStr);
      fs.writeFileSync(filepath, compressed);
      return OK;
    } catch (err) {
      return err;
    }
  };

  const saveEncrypedJson = function(wishedJson: object) {
    const jsonStr = JSON.stringify(wishedJson, null, SPACES);
    const rstream = stringReader(jsonStr);
    const encryptor = crypto.createCipher(cfg.encryption, cfg.password);
    const wstream = fs.createWriteStream(filepath);
    rstream.pipe(encryptor).pipe(wstream);
    return wstream;
  };

  const saveEncrypedJsonSync = function(wishedJson: object) {
    const jsonStr = JSON.stringify(wishedJson, null, SPACES);
    const encryptor = crypto.createCipher(cfg.encryption, cfg.password);
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

  const confDirectory = hasRelativeDirectory
    ? path.join(cfg.baseDirectory, cfg.relativeDirectory)
    : cfg.baseDirectory;
  const ensureDirectory = function() {
    fs.ensureDir(confDirectory);
  };

  const save = function(wishedJson: object) {
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

  const saveSync = function(wishedJson: object) {
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

  const getConfiguration = function() {
    return _.clone(cfg);
  };

  const confiture = {
    configuration: getConfiguration,
    load,
    save,
    saveSync
  };

  return confiture;
};
