/*jslint node: true, nomen: true, white: true, unparam: true*/
/*globals describe, beforeEach, afterEach, it, expect, spyOn*/
/*!
 * Sitegear3
 * Copyright(c) 2014 Ben New, Sitegear.org
 * MIT Licensed
 */

(function (_) {
	"use strict";

	beforeEach(function () {
		console._originalLog = console.log;
		console.log = _.noop;
	});
	afterEach(function () {
		console.log = console._originalLog;
		delete console._originalLog;
	});
}(require('lodash')));
