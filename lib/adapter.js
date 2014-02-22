/*jslint node: true, nomen: true, white: true, plusplus: true*/
/*!
 * Sitegear3
 * Copyright(c) 2014 Ben New, Sitegear.org
 * MIT Licensed
 */

(function (_, path, fs, mkdirp, rimraf, defaults) {
	"use strict";

	module.exports = function (options) {
		var convertKey = function (key) {
				return key.replace(/\//g, '___') + options.extension;
			},
			generateKey = function (filename) {
				return path.basename(filename, options.extension).replace(/___/g, '/');
			};

		options = _.merge(defaults, options);
		return {
			set: function (type, key, value, callback) {
				mkdirp(path.join(options.root, type), function (mkdirError) {
					if (mkdirError) {
						callback(mkdirError);
					} else {
						if (!_.isString(value)) {
							value = JSON.stringify(value, null, '\t');
						}
						fs.writeFile(path.join(options.root, type, convertKey(key)), value, { encoding: options.encoding }, function (writeFileError) {
							callback(writeFileError);
						});
					}
				});
			},

			get: function (type, key, callback) {
				fs.readFile(path.join(options.root, type, convertKey(key)), { encoding: options.encoding }, function (error, value) {
					if (!error && _.isString(value)) {
						try {
							value = JSON.parse(value);
						} catch (parseError) {
							value = null;
							error = parseError;
						}
					}
					if (error && error.code === 'ENOENT') {
						error = null;
					}
					callback(error, value);
				});
			},

			keys: function (type, callback) {
				fs.readdir(path.join(options.root, type), function (error, files) {
					callback(error, _.map(files, generateKey));
				});
			},

			all: function (type, callback) {
				fs.readdir(path.join(options.root, type), function (error, files) {
					if (error || !files) {
						callback(error);
					} else {
						var data = {},
							remaining = files.length;
						_.each(files || [], function (filename) {
							if (filename.substr(-options.extension.length) === options.extension) {
								fs.readFile(path.join(options.root, type, filename), { encoding: options.encoding }, function (readFileError, value) {
									if (readFileError) {
										callback(readFileError);
									}
									if (_.isString(value)) {
										try {
											value = JSON.parse(value);
										} catch (parseError) {
											callback(parseError);
											return;
										}
									}
									data[generateKey(filename)] = value;
									if (--remaining === 0) {
										callback(undefined, data);
									}
								});
							} else if (--remaining === 0) {
								callback(undefined, data);
							}
						});
					}
				});
			},

			remove: function (type, key, callback) {
				fs.unlink(path.join(options.root, type, convertKey(key)), function (error) {
					if (error && error.code === 'ENOENT') {
						error = null;
					}
					callback(error);
				});
			},

			clear: function (type, callback) {
				rimraf(path.join(options.root, type), function (error) {
					// rimraf handles ENOENT already
					callback(error);
				});
			}
		};
	};
}(require('lodash'), require('path'), require('graceful-fs'), require('mkdirp'), require('rimraf'), require('./defaults.json')));
