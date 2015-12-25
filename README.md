#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Configuration library with validation using json-schema, compression, and encryption

The main goal of confiture is to provide configuration with:

 * systematic validation using json schema.
 * the option to compress the configuration file.
 * the option to encrypt the configuration file.


## Install

```sh
$ npm install --save confiture
```


## Usage

### Synchronously load some JSON

```js
var confiture = require('confiture');

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
});

var conf = configurator.load();
//Will load __dirname/appname/conf.json
//conf will contain the configuration data
//or an Error object if the validation has failed.

```

### Asynchronously save some JSON through a stream

```js
var confiture = require('confiture');

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
});

var conf = {
	"email": "support@mycompany.com",
	"project": "bestProject"
};

var stream = configurator.save(conf);
//Will save the configuration in __dirname/appname/conf.json
//and return a stream
//or an Error object if the validation has failed.
```
### Synchronously save some JSON

```js
var confiture = require('confiture');

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
});

var conf = {
	"email": "support@mycompany.com",
	"project": "bestProject"
};

var saveResult = configurator.saveSync(conf);
//Will save the configuration in __dirname/appname/conf.json
//and return OK
//or an Error object if the validation has failed.
```

### Compression

You can ask for the json file to be compressed.
Only gz is supported at the moment.

```js

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
    compression: "gz"
});

//The generated file name will be __dirname/appname/conf.json.gz

```

### Encryption

You can ask for the json file to be encrypted.
When encryption is on, compression is not supported though.

Most ciphers should be supported. You can check the list by typing:

```js
require('crypto').getCiphers();
```

Encrypted configuration:

```js

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
    encryption: "aes-256-cbc",
    password: "my secure password"
});

//The generated file name will be __dirname/appname/conf.json.aes-256-cbc

```

### Backup

You can ask for the json file to be backed up before saving a new configuration.

```js

var configurator = confiture({
    name: "conf",
    schema: __dirname + "/schemas/conf.schema.json",
    baseDirectory: __dirname,
    relativeDirectory: "appname"
    backupBeforeSave: true

});

//The backup file name will be something like __dirname/appname/conf.json.bak-2015-05-02T17:44:25+01:00

```

### Understanding the configuration

You can have an insight about the configuration by logging this:

```js

console.log(configurator.configuration());

```


## License

MIT © [Olivier Huin]()


[npm-url]: https://npmjs.org/package/confiture
[npm-image]: https://badge.fury.io/js/confiture.svg
[travis-url]: https://travis-ci.org/flarebyte/confiture
[travis-image]: https://travis-ci.org/flarebyte/confiture.svg?branch=master
[daviddm-url]: https://david-dm.org/flarebyte/confiture.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/flarebyte/confiture
