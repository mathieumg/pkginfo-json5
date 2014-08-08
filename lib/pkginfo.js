/*
 * pkginfo.js: Top-level include for the pkginfo module
 *
 * (C) 2011, Charlie Robbins
 *
 */

var fs = require('fs'),
    path = require('path'),
    JSON5 = require('json5');

//
// ### function pkginfo ([options, 'property', 'property' ..])
// #### @pmodule {Module} Parent module to read from.
// #### @options {Object|Array|string} **Optional** Options used when exposing properties.
// #### @arguments {string...} **Optional** Specified properties to expose.
// Exposes properties from the package.json file for the parent module on
// it's exports. Valid usage:
//
// `require('pkginfo')()`
//
// `require('pkginfo')('version', 'author');`
//
// `require('pkginfo')(['version', 'author']);`
//
// `require('pkginfo')({ include: ['version', 'author'] });`
//
function pkginfo(pmodule, options) {
  var args = [].slice.call(arguments, 2).filter(function (arg) {
    return typeof arg === 'string';
  });

  //
  // **Parse variable arguments**
  //
  if (Array.isArray(options)) {
    //
    // If the options passed in is an Array assume that
    // it is the Array of properties to expose from the
    // on the package.json file on the parent module.
    //
    options = { include: options };
  }
  else if (typeof options === 'string') {
    //
    // Otherwise if the first argument is a string, then
    // assume that it is the first property to expose from
    // the package.json file on the parent module.
    //
    options = { include: [options] };
  }

  //
  // **Setup default options**
  //
  options = options || {};

  // ensure that includes have been defined
  options.include = options.include || [];

  if (args.length > 0) {
    //
    // If additional string arguments have been passed in
    // then add them to the properties to expose on the
    // parent module.
    //
    options.include = options.include.concat(args);
  }

  var pkg = read(pmodule, options.dir).package;
  var pexports = {};
  Object.keys(pkg).forEach(function (key) {
    if (options.include.length > 0 && !~options.include.indexOf(key)) {
      return;
    }

    if (!pexports[key]) {
      pexports[key] = pkg[key];
    }
  });

  return pexports;
};

//
// ### function find (dir)
// #### @pmodule {Module} Parent module to read from.
// #### @dir {string} **Optional** Directory to start search from.
// Searches up the directory tree from `dir` until it finds a directory
// which contains a `package.json5` or `package.json` file.
//
function find(pmodule, dir) {
  if (!dir) {
    dir = path.dirname(pmodule.filename);
  }

  var files = fs.readdirSync(dir);

  if (~files.indexOf('package.json5')) {
    return path.join(dir, 'package.json5');
  }

  if (~files.indexOf('package.json')) {
    return path.join(dir, 'package.json');
  }

  if (dir === '/') {
    throw new Error('Could not find package.json5 or package.json up from: ' + dir);
  }
  else if (!dir || dir === '.') {
    throw new Error('Cannot find package.json5 or package.json from unspecified directory');
  }

  return find(pmodule, path.dirname(dir));
};

//
// ### function read (pmodule, dir)
// #### @pmodule {Module} Parent module to read from.
// #### @dir {string} **Optional** Directory to start search from.
// Searches up the directory tree from `dir` until it finds a directory
// which contains a `package.json5` or `package.json` file and returns
// the package information.
//
function read(pmodule, dir) {
  dir = find(pmodule, dir);

  var data = fs.readFileSync(dir).toString();

  return {
    dir: dir,
    package: JSON5.parse(data)
  };
};

module.exports = pkginfo;
