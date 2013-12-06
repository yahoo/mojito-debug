/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, regexp: true */

module.exports = function (midConfig) {
    'use strict';

    var store = midConfig.store;

    return function (req, res, next) {
        var appConfig = store.getAppConfig(req.context);

        if (appConfig.specs.debug.enabled) {
            if (/^\/debug.*$/.test(req.url)) {
                // If the entry point is 'debug', reroute to page not found. This prevents the user from calling
                // the debugger directly through its entry point instead of through a debug parameter.
                req.url = null;
                console.warn('Request attempting to access debugger route directly.');

            } else if (/^\/.*?[\?&]debug(\.[^=&]+)?(=[^&]*)?(&|$)/.test(req.url)) {
                req.url = '/debug' + req.url;
            }
        }
        next();
    };
};