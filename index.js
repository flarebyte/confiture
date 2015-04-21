'use strict';
var _ = require('lodash');
var fs = require('fs-extra');
var validator = require('is-my-json-valid');

var checkValidCompression = function(value) {
    var valid = value === "gz";
    if (!valid) {
        throw new Error("Compression should be gz!");
    }
};

var checkValidEncryption = function(value) {
    var valid = value === "bcrypt";
    if (!valid) {
        throw new Error("Encryption should be bcrypt!");
    }
};

var checkValidPassword = function(value) {
    var valid = value.length > 0; //TODO
    if (!valid) {
        throw new Error("Password should not be empty!");
    }
};

var checkValidSchema = function(value) {
    var valid = value.length > 0; //TODO
    if (!valid) {
        throw new Error("Schema should not be empty!");
    }
};

var checkValidName = function(value) {
    var valid = value.length > 0; //TODO
    if (!valid) {
        throw new Error("Schema should not be empty!");
    }

};

var checkValidDirectories = function(value) {
    var valid = value.length > 0; //TODO
    if (!valid) {
        throw new Error("Schema should not be empty!");
    }

};

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
    var defaults = {
        name: "conf",
        directories: ["/etc"]
    };

    var cfg = _.defaults(config, defaults);
    //Checks configuration


    var isCompressed = _.has(cfg, "compression");
    var isEncryped = _.has(cfg, "encryption");

    checkValidSchema(cfg.schema);
    checkValidName(cfg.name);
    checkValidDirectories(cfg.directories);
    if (isCompressed) {
        checkValidCompression(cfg.compression);
    }

    if (isEncryped) {
        checkValidEncryption(cfg.encryption);
        checkValidPassword(cfg.password);
    }

    var validate = schemaValidator(cfg.schema); //sync    

    var content = null;
    var dirty = null;
    var configuration = function() {
        return cfg;
    };

    var findFirst = function() {
        //find the first matching configuration
    };

    var restore = function() {
        dirty = content;
    };


    var loadJson = function() {
        var filename = findFirst();
        var jsonToCheck = fs.readJsonSync(filename);
        validate(jsonToCheck);
        content = jsonToCheck;
    };

    var loadCompressedJson = function() {

    };

    var loadEncryptedJson = function() {

    };

    var saveJson = function() {

    };

    var saveCompressedJson = function() {

    };

    var saveEncryptedJson = function() {

    };

    var validateJson = function(data) {
        return data != null;
    };

    var load = function() {
        var found = findFirst();
        if (!_.isString(found)) {
            throw new Error();
        }

        var loaded = null;
        if (isEncryped) {
            loaded = loadEncryptedJson();
        } else if (isCompressed) {
            loaded = loadCompressedJson();
        } else {
            loaded = loadJson();
        }

        validateJson(loaded);
        content = loaded;
        dirty = content;
        return dirty;

    };

    var save = function() {
        validateJson(dirty);
        if (isEncryped) {
            saveEncryptedJson();
        } else if (isCompressed) {
            saveCompressedJson();
        } else {
            saveJson();
        }
        content = dirty;

    };


    var confiture = {
        configuration: configuration,
        findFirst: findFirst,
        load: load,
        restore: restore,
        save: save,
    };

    return confiture;

};