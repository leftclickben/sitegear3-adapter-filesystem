/*jslint node: true, nomen: true, white: true, unparam: true*/
/*globals describe, beforeEach, afterEach, it, expect, spyOn*/
/*!
 * Sitegear3
 * Copyright(c) 2014 Ben New, Sitegear.org
 * MIT Licensed
 */

(function (_, filesystemAdapter, os, fs, jasmine) {
	"use strict";
	require('../setupTests');

	describe('Data adapter: filesystem', function () {
		it('Exports a function', function () {
			expect(_.isFunction(filesystemAdapter)).toBeTruthy();
		});
		describe('When underlying filesystem is working and accessible', function () {
			var filesystem, callbackSpy;
			beforeEach(function () {
				filesystem = filesystemAdapter({ root: os.tmpdir() });
			});
			describe('The set() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'writeFile').andCallFake(function (path, value, options, callback) {
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
			});
			describe('The get() method', function () {
				var error, value;
				beforeEach(function (done) {
					spyOn(fs, 'readFile').andCallFake(function (path, options, callback) {
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
			});
			describe('The keys() method', function () {
				var error, keys;
				beforeEach(function (done) {
					spyOn(fs, 'readdir').andCallFake(function (path, callback) {
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
			});
			describe('The all() method', function () {
				var error, data;
				beforeEach(function (done) {
					spyOn(fs, 'readdir').andCallFake(function (path, callback) {
						callback(undefined, [ 'foo.json', 'bar.json', 'baz_xyzzy.json' ]);
					});
					spyOn(fs, 'readFile').andCallFake(function (path, options, callback) {
						callback(undefined, '"this is ' + path + '"');
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
					expect(data.foo).toBe('this is /tmp/type/foo.json');
					expect(data.bar).toBe('this is /tmp/type/bar.json');
					expect(data['baz/xyzzy']).toBe('this is /tmp/type/baz_xyzzy.json');
				});
			});
			describe('The remove() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'unlink').andCallFake(function (path, callback) {
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
			});
		});
		describe('When underlying filesystem is returning errors', function () {
			var filesystem, callbackSpy,
				thrownError = new Error('This is an error');
			beforeEach(function () {
				filesystem = filesystemAdapter({ root: os.tmpdir() });
			});
			describe('The set() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'writeFile').andCallFake(function (path, value, options, callback) {
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
			});
			describe('The get() method', function () {
				var error, value;
				beforeEach(function (done) {
					spyOn(fs, 'readFile').andCallFake(function (path, options, callback) {
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
			});
			describe('The keys() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'readdir').andCallFake(function (path, callback) {
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
			});
			describe('The all() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'readdir').andCallFake(function (path, callback) {
						callback(thrownError);
					});
					spyOn(fs, 'readFile').andCallFake(function (path, options, callback) {
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
			});
			describe('The remove() method', function () {
				var error;
				beforeEach(function (done) {
					spyOn(fs, 'unlink').andCallFake(function (path, callback) {
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
			});
		});
	});
}(require('lodash'), require('../../'), require('os'), require('graceful-fs'), require('jasmine-node')));
