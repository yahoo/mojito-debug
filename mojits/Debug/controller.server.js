/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen: true */
/*global YUI */

YUI.add('mojito-debug-controller', function (Y, NAME) {
    'use strict';

    Y.namespace('mojito.controllers')[NAME] = {
        index: function (ac) {
            var self = this,
                req = ac.http.getRequest();

            // Create a waterfall and use the waterfall custom dispatcher.
            ac.debug.on('waterfall', function (debugData) {
                var waterfall = new Y.mojito.Waterfall({
                        stats: {
                            // Only show stats related to mojito internals.
                            profileFilter: 'level === "mojito"'
                        }
                    }),
                    dispatcher = Y.mix({}, Y.mojito.Waterfall.Dispatcher);

                debugData.waterfall = waterfall;
                debugData.originalDispatch = ac._dispatch;

                dispatcher.init(ac.dispatcher.store, ac.dispatcher.tunnel, waterfall);
                ac._dispatch = dispatcher.dispatch.bind(dispatcher);

                debugData.appStart = process.hrtime();
            });

            // Remove the /debug route which was added by the debugger middleware.
            req.url = req.url.replace(/^\/debug/, '');

            ac.debug.timing.server.debugStart = req.globals['mojito-debug'].debugStart[0] * 1e9 + req.globals['mojito-debug'].debugStart[1];
            ac.debug.timing.server.appStart = self._getTime(ac);

            self.runApplication(ac, function (err, flushes) {
                ac.debug.timing.server.appEnd = self._getTime(ac);

                ac.debug.flushes = flushes;
                self.runDebugger(ac, function (err, data, meta) {
                    ac.done(data, meta);
                });
            });
        },

        runApplication: function (ac, callback) {
            var req = ac.http.getRequest(),
                self = this,
                command = {
                    instance: this.createAppInstance(ac),
                    context: ac.context,
                    params: ac.params.params
                },
                adapter = {
                    // Keeps track of all the different flushes and their times relative to the first flush.
                    flushes: [],
                    flush: function (data) {
                        this._flush(data, true);
                    },
                    done: function (data) {
                        this._flush(data);
                    },
                    _flush: function (data, more) {
                        var time = self._getTime(ac);

                        if (!this.firstFlushTime) {
                            this.firstFlushTime = time;
                            ac.debug.timing.server.firstFlush = time;
                        }

                        this.flushes.push({
                            data: data,
                            time: (time - this.firstFlushTime) / 1e6 // ms
                        });

                        if (more) {
                            return;
                        }

                        // Last flush.
                        ac.debug.timing.server.lastFlush = time;

                        ac.debug.on('waterfall', function (debugData, hook) {
                            // Revert the original dispatch function.
                            ac._dispatch = debugData.originalDispatch;

                            // Get waterfall gui object and make it available through debugData
                            debugData.waterfall = debugData.waterfall.getGui();

                            // The time taken in ms for the first flush relative to the absolute start time of the
                            // server side waterfall.
                            debugData.serverFlushTime = (this.firstFlushTime[0] * 1e9 + this.firstFlushTime[1]
                                                     - debugData.waterfall.absoluteStartTime) / 1e6;

                            // Add the waterfall gui to waterfall's parameters since the Waterfall
                            // controller requires it.
                            hook.params = {
                                body: {
                                    waterfall: debugData.waterfall
                                }
                            };
                        }.bind(this));

                        callback(null, this.flushes);
                    },
                    error: function (err) {
                        callback(err);
                    }
                };

            if (!command.instance) {
                req.res.end('Cannot ' + req.method + ' ' + req.url.replace('/debug/', '/'));
                return;
            }

            Y.mix(adapter, ac._adapter);
            ac._dispatch(command, adapter);
        },

        runDebugger: function (ac, done) {
            var command = {
                    context: ac.context
                },
                adapter = new Y.mojito.OutputBuffer('debugger', done);

            if (ac.debug.mode === 'json') {
                command.instance = {
                    type: 'Debug',
                    action: 'debugJson'
                };
            } else {
                command.instance = ac.config.get('debug-specs');
            }

            Y.mix(adapter, ac._adapter);
            ac._dispatch(command, adapter);
        },

        debug: function (ac) {
            var self = this;
            // Render all hooks.
            ac.debug._render(function (hooks, hooksMeta) {
                ac.data.set('flushes', ac.debug.flushes);
                ac.data.set('hooks', ac.debug._decycleHooks(hooks));
                ac.data.set('urlHooks', ac.debug.urlHooks);
                ac.data.set('mode', ac.debug.mode);
                ac.data.set('config', ac.debug.config);
                ac.data.set('timing', ac.debug.timing);

                ac.done({}, hooksMeta);
            });
            ac.debug.timing.server.debugEnd = self._getTime(ac);
        },

        debugJson: function (ac) {
            ac.done(JSON.stringify(ac.debug._decycleHooks(ac.debug.hooks), null, '    '), {
                http: {
                    headers: {
                        'content-type': 'application/json; charset="utf-8"'
                    }
                }
            });
        },

        createAppInstance: function (ac) {
            var req = ac.http.getRequest(),
                appUrl = req.url.replace('/debug/', '/'),
                route = ac.url.find(appUrl),
                instance = {};

            if (!route) {
                return null;
            }

            if (route.call === '*.*') {
                route.call = [route.query.module, route.query.action];
            } else {
                route.call = route.call.split('.');
            }

            if (route.call[0].charAt(0) === '@') {
                instance.type = route.substring(1);
            } else {
                instance.base = route.call[0];
            }
            instance.action = route.call[1];

            return instance;
        },

        invoke: function (ac) {
            var body = ac.params.body(),
                url = ac.params.url(),
                hooks = body.hooks,
                command = body.command,
                adapter = new Y.mojito.OutputBuffer('proxy', function (err, data, meta) {
                    ac.http.setHeader('Content-type', 'application/json');
                    ac.done(JSON.stringify({
                        data: data,
                        meta: meta,
                        hooks: Y.mojito.debug.Utils.removeCycles(ac.debug.hooks)
                    }), meta);
                });

            ac.debug.hooks = hooks;
            command.context = ac.context;

            Y.mix(adapter, ac._adapter);
            ac._dispatch(command, adapter);
        },

        _getTime: function (ac) {
            var time = process.hrtime();
            return time[0] * 1e9 + time[1];
        }

    };
}, '0.0.1', {
    requires: [
        'mojito-debug-utils',
        'mojito-debug-addon',
        'mojito-composite-addon',
        'mojito-config-addon',
        'mojito-data-addon',
        'mojito-util',
        'mojito-url-addon',
        'mojito-params-addon',
        'mojito-http-addon',
        'mojito-waterfall',
        'mojito-waterfall-dispatcher'
    ]
});