/*jslint node: true, nomen: true, white: true, unparam: true*/
/*globals describe, beforeEach, afterEach, it, expect, spyOn*/
/*!
 * Sitegear3
 * Copyright(c) 2014 Ben New, Sitegear.org
 * MIT Licensed
 */

(function (_, filesystemAdapter, os, path, fs, jasmine) {
	"use strict";
	require('../setupTests');

	describe('Data adapter: filesystem', function () {
		it('Exports a function', function () {
			expect(_.isFunction(filesystemAdapter)).toBeTruthy();
		});
		describe('When underlying filesystem is working and accessible', function () {
			var filesystem, callbackSpy;
			beforeEach(function () {
				filesystem = filesystemAdapter({ root: path.join(os.tmpdir(), 'sitegear3-adapter-filesystem-spec-' + Date.now()) });
			});
			describe('The set() method', function () {
				var error, originalWriteFile;
				beforeEach(function (done) {
					originalWriteFile = fs.writeFile;
					spyOn(fs, 'writeFile').andCallFake(function (filePath, value, options, callback) {
						if (!_.isFunction(callback) && _.isFunction(options)) {
							callback = options;
						}
						callback();
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.set('type', 'key', { title: 'title', main: 'body content' }, callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Does not pass an error', function () {
					expect(error).toBeUndefined();
				});
				afterEach(function () {
					fs.writeFile = originalWriteFile;
				});
			});
			describe('The get() method', function () {
				var error, value, originalReadFile;
				beforeEach(function (done) {
					originalReadFile = fs.readFile;
					spyOn(fs, 'readFile').andCallFake(function (filePath, options, callback) {
						if (!_.isFunction(callback) && _.isFunction(options)) {
							callback = options;
						}
						callback(undefined, '{ "title": "title", "main": "body content" }');
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e, v) {
						error = e;
						value = v;
						done();
					});
					filesystem.get('type', 'key', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Does not pass an error', function () {
					expect(error).toBeUndefined();
				});
				it('Passes the correct value', function () {
					expect(_.isPlainObject(value)).toBeTruthy();
					expect(value.title).toBe('title');
					expect(value.main).toBe('body content');
				});
				afterEach(function () {
					fs.readFile = originalReadFile;
				});
			});
			describe('The keys() method', function () {
				var error, keys, originalReaddir;
				beforeEach(function (done) {
					originalReaddir = fs.readdir;
					spyOn(fs, 'readdir').andCallFake(function (filePath, callback) {
						callback(undefined, [ 'foo', 'bar', 'baz' ]);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e, k) {
						error = e;
						keys = k;
						done();
					});
					filesystem.keys('type', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Does not pass an error', function () {
					expect(error).toBeUndefined();
				});
				it('Passes the correct value', function () {
					expect(_.isArray(keys)).toBeTruthy();
					expect(keys.length).toBe(3);
					expect(keys[0]).toBe('foo');
					expect(keys[1]).toBe('bar');
					expect(keys[2]).toBe('baz');
				});
				afterEach(function () {
					fs.readdir = originalReaddir;
				});
			});
			describe('The all() method', function () {
				var error, data, originalReaddir, originalReadFile;
				beforeEach(function (done) {
					originalReaddir = fs.readdir;
					originalReadFile = fs.readFile;
					spyOn(fs, 'readdir').andCallFake(function (filePath, callback) {
						callback(undefined, [ 'foo.json', 'bar.json', 'baz___xyzzy.json' ]);
					});
					spyOn(fs, 'readFile').andCallFake(function (filePath, options, callback) {
						callback(undefined, '"this is ' + filePath + '"');
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e, d) {
						error = e;
						data = d;
						done();
					});
					filesystem.all('type', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Does not pass an error', function () {
					expect(error).toBeUndefined();
				});
				it('Passes the correct value', function () {
					expect(_.isPlainObject(data)).toBeTruthy();
					expect(_.size(data)).toBe(3);
					expect(data.foo).toMatch('this is .*/foo.json');
					expect(data.bar).toMatch('this is .*/bar.json');
					expect(data['baz/xyzzy']).toMatch('this is .*/baz.*xyzzy.json');
				});
				afterEach(function () {
					fs.readdir = originalReaddir;
					fs.readFile = originalReadFile;
				});
			});
			describe('The remove() method', function () {
				var error, originalUnlink;
				beforeEach(function (done) {
					originalUnlink = fs.unlink;
					spyOn(fs, 'unlink').andCallFake(function (filePath, callback) {
						callback(undefined);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.remove('type', 'key', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Does not pass an error', function () {
					expect(error).toBeUndefined();
				});
				afterEach(function () {
					fs.unlink = originalUnlink;
				});
			});
		});
		describe('When underlying filesystem is returning errors', function () {
			var filesystem, callbackSpy,
				thrownError = new Error('This is an error');
			beforeEach(function () {
				filesystem = filesystemAdapter({ root: path.join(os.tmpdir(), 'sitegear3-adapter-filesystem-spec-' + Date.now()) });
			});
			describe('The set() method', function () {
				var error, originalWriteFile;
				beforeEach(function (done) {
					originalWriteFile = fs.writeFile;
					spyOn(fs, 'writeFile').andCallFake(function (filePath, value, options, callback) {
						if (!_.isFunction(callback) && _.isFunction(options)) {
							callback = options;
						}
						callback(thrownError);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.set('type', 'key', { title: 'title', main: 'body content' }, callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Passes the expected error', function () {
					expect(error).toBe(thrownError);
				});
				afterEach(function () {
					fs.writeFile = originalWriteFile;
				});
			});
			describe('The get() method', function () {
				var error, value, originalReadFile;
				beforeEach(function (done) {
					originalReadFile = fs.readFile;
					spyOn(fs, 'readFile').andCallFake(function (filePath, options, callback) {
						if (!_.isFunction(callback) && _.isFunction(options)) {
							callback = options;
						}
						callback(thrownError);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e, v) {
						error = e;
						value = v;
						done();
					});
					filesystem.get('type', 'key', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Passes the expected error', function () {
					expect(error).toBe(thrownError);
					expect(value).toBeUndefined();
				});
				afterEach(function() {
					fs.readFile = originalReadFile;
				});
			});
			describe('The keys() method', function () {
				var error, originalReaddir;
				beforeEach(function (done) {
					originalReaddir = fs.readdir;
					spyOn(fs, 'readdir').andCallFake(function (filePath, callback) {
						callback(thrownError);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.keys('type', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Passes the expected error', function () {
					expect(error).toBe(thrownError);
				});
				afterEach(function () {
					fs.readdir = originalReaddir;
				});
			});
			describe('The all() method', function () {
				var error, originalReaddir, originalReadFile;
				beforeEach(function (done) {
					originalReaddir = fs.readdir;
					originalReadFile = fs.readFile;
					spyOn(fs, 'readdir').andCallFake(function (filePath, callback) {
						callback(thrownError);
					});
					spyOn(fs, 'readFile').andCallFake(function (filePath, options, callback) {
						callback(thrownError);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.all('type', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Passes the expected error', function () {
					expect(error).toBe(thrownError);
				});
				afterEach(function () {
					fs.readdir = originalReaddir;
					fs.readFile = originalReadFile;
				});
			});
			describe('The remove() method', function () {
				var error, originalUnlink;
				beforeEach(function (done) {
					originalUnlink = fs.unlink;
					spyOn(fs, 'unlink').andCallFake(function (filePath, callback) {
						callback(thrownError);
					});
					callbackSpy = jasmine.createSpy('callback').andCallFake(function (e) {
						error = e;
						done();
					});
					filesystem.remove('type', 'key', callbackSpy);
				});
				it('Calls the callback', function () {
					expect(callbackSpy).toHaveBeenCalled();
					expect(callbackSpy.callCount).toBe(1);
				});
				it('Passes the expected error', function () {
					expect(error).toBe(thrownError);
				});
				afterEach(function () {
					fs.unlink = originalUnlink;
				});
			});
		});
		describe('Handles valid workflows correctly', function () {
			var filesystem;
			beforeEach(function () {
				filesystem = filesystemAdapter({ root: path.join(os.tmpdir(), 'sitegear3-adapter-filesystem-spec-' + Date.now()) });
			});
			describe('When getting a key that has been set', function () {
				var result;
				beforeEach(function (done) {
					filesystem.set('type', 'key', { value: 'this is the value' }, function () {
						filesystem.get('type', 'key', function (e, r) {
							result = r;
							done();
						});
					});
				});
				it('Returns the value that was set', function () {
					expect(result.value).toBe('this is the value');
				});
			});
			describe('When getting a key that has been set and then removed', function () {
				var result;
				beforeEach(function (done) {
					filesystem.set('type', 'key', { value: 'this is the value' }, function () {
						filesystem.remove('type', 'key', function () {
							filesystem.get('type', 'key', function (e, r) {
								result = r;
								done();
							});
						});
					});
				});
				it('Does not return a value', function () {
					expect(result).toBeFalsy();
				});
			});
			describe('When retrieving keys after a single set', function () {
				var keys;
				beforeEach(function (done) {
					filesystem.set('type', 'key', { value: 'this is the value' }, function () {
						filesystem.keys('type', function (e, k) {
							keys = k;
							done();
						});
					});
				});
				it('Returns the key that was set', function () {
					expect(keys.length).toBe(1);
					expect(keys[0]).toBe('key');
				});
			});
			describe('When retrieving keys after multiple sets', function () {
				var keys;
				beforeEach(function (done) {
					filesystem.set('type', 'key0', { sequence: 0, value: 'this is the first value' }, function () {
						filesystem.set('type', 'key1', { sequence: 1, value: 'this is the second value' }, function () {
							filesystem.set('type', 'key2', { sequence: 2, value: 'this is the third value' }, function () {
								filesystem.keys('type', function (e, k) {
									keys = k;
									done();
								});
							});
						});
					});
				});
				it('Returns the key that was set', function () {
					expect(keys.length).toBe(3);
					expect(keys[0]).toBe('key0');
					expect(keys[1]).toBe('key1');
					expect(keys[2]).toBe('key2');
				});
			});
			describe('When retrieving all after a single set', function () {
				var data;
				beforeEach(function (done) {
					filesystem.set('type', 'key', { value: 'this is the value' }, function () {
						filesystem.all('type', function (e, d) {
							data = d;
							done();
						});
					});
				});
				it('Returns the key that was set', function () {
					expect(_.size(data)).toBe(1);
					expect(_.isPlainObject(data.key)).toBeTruthy();
					expect(data.key.value).toBe('this is the value');
				});
			});
			describe('When retrieving all after multiple sets', function () {
				var data;
				beforeEach(function (done) {
					filesystem.set('type', 'key0', { sequence: 0, value: 'this is the first value' }, function () {
						filesystem.set('type', 'key1', { sequence: 1, value: 'this is the second value' }, function () {
							filesystem.set('type', 'key2', { sequence: 2, value: 'this is the third value' }, function () {
								filesystem.all('type', function (e, d) {
									data = d;
									done();
								});
							});
						});
					});
				});
				it('Returns the key that was set', function () {
					expect(_.size(data)).toBe(3);
					expect(_.isPlainObject(data.key0)).toBeTruthy();
					expect(data.key0.sequence).toBe(0);
					expect(data.key0.value).toBe('this is the first value');
					expect(_.isPlainObject(data.key1)).toBeTruthy();
					expect(data.key1.sequence).toBe(1);
					expect(data.key1.value).toBe('this is the second value');
					expect(_.isPlainObject(data.key2)).toBeTruthy();
					expect(data.key2.sequence).toBe(2);
					expect(data.key2.value).toBe('this is the third value');
				});
			});
		});
	});
}(require('lodash'), require('../../'), require('os'), require('path'), require('graceful-fs'), require('jasmine-node')));
