mojito-debug
============

mojito-debug helps developers debug the client/server sides of their [Mojito](http://developer.yahoo.com/cocktails/mojito/) applications through user-defined debug hooks that are enabled when a `debug` parameter appears in the url. The results of the hooks are displayed on the client side below the application.

[![Build Status](https://secure.travis-ci.org/yahoo/mojito-pipeline.png)](http://travis-ci.org/yahoo/mojito-pipeline)

[![NPM](https://nodei.co/npm/mojito-pipeline.png)](https://nodei.co/npm/mojito-pipeline/) 

## Getting Started

1. Install mojito-debug in the mojito application:

        $ npm install mojito-debug

2. Add the debugger middleware to `application.json`.

        [{
            "settings": ["master"],
            ...
            "middleware: [
                "./node_modules/mojito-debug/middleware/debug.js"
            ]
            ...
        }]

3. Access the debugger by appending the `debug` parameter to the url. For example:
        http://localhost/?debug

    This loads the application with a help menu below. This help menu summarizes all the different debug modes, hooks, and aliases of hooks. Clicking any of these will automatically update the url and refresh the application and debugger.

    To manually specify debug hooks, set the value of the debug parameter to a comma-separated list of debug hooks.

## Debug Modes

The debugger has three modes: `default`, `hide`, and `json`. Each of these modes are represented by a particular debug parameter:

* **debug**      - The default mode. Displays the application followed by the debugger.
* **debug.hide** - Hides the application and just shows the debugger.
* **debug.json** - Loads a page of content-type 'application/json', that displays all the debug hooks' data as JSON.

## API

**ac.debug.on** (hook, callback)
Gives access to the `debugData` object of an enabled hook.
* **hook** `string` - The name of the hook.
* **callback** `function` - The function that is called if the specified hook is enabled. The function has one argument: `debugData`, an object unique to the specified hook. This object is used to store any debugging data and is passed in subsequent calls to `ac.debug.on` for the specified hook.

**Example**
```js
ac.debug.on('hook', function (debugData) {
    debugData.myData = myData;
});
```

---

**ac.debug.log** (line, [options])
Logs an HTML line or JSON object. Lines are shown by the `log` hook whenever enabled.
* **line** `string` | `object` - The line to log. This line can be an HTML string or a JSON object.
* **options** `string` | `object` `optional` - Options include the strings `error` and `warn` or a JSONTree options object (see JSONTree documentation).

**Example**
```js
ac.debug.log('An error occurred:', 'error');
ac.debug.log(errorObject);
```

---

**ac.debug.get** (hook)
Gets all the data associated with a debug hook.
* **hook** `string` - The name of the hook.
* **returns** `object` - The data associated with the hook, this is the same as any configuration specified for this hook plus `debugData`, the object used to store debugging data. On the client-side, this object also includes `binder`, a reference to any associated hook binder, and `hookContainer`, the HookContainer instance representing the hook on the page (See HookContainer).

**Example**
```js
var hookData = ac.debug.get('hook');
```

---

**ac.debug.render** ([hooks], [callback]) `client-side only`
On the server-side, hooks get rendered automatically after the application is rendered; however, on the client-side there is no end point, and so the debugger must be told when to render any debugging data resulting from client-side debug hooks.
* **hooks** `string` | `string[]` `optional` - A hook or list of hook to render. If nothing is specified, then all hooks with modified `debugData` are rendered.
* **callback** `function` `optional` - An optional callback that is called once all the hooks have been rendered. It passes one argument, hooks, a map of hooks and their corresponding data (the same data that is returned by `ac.debug.get`). This callback can be passed as the only argument.

**Example**
```js
ac.debug.render(['hook1', 'hook2'], function (hooks) {
    console.log(Object.keys(hooks).join(', ') + ' have finished rendering');
});
```

---

**Y.Debug.*** `client-side only`

On the client side, ac.debug can conviniently be accessed through `Y.Debug` within any YUI module that includes `mojito-debug-addon`.


## Debugging

Debugging involves instrumenting server/client side code with debugger API calls (debug hooks). When the debugger is disabled these hooks are empty functions, therefore the debugger presents no overhead when disabled. When the debugger is enabled, only the debug hooks specified in the debug parameter are enabled.

### Simple Debug Hook

The simplest debug hook involves displaying HTML or a JSON interactive object using `ac.debug.on`. Just set `debugData.content` to an HTML string or a JSON object. For example:

```js
// Display HTML.
ac.debug.on('hook-name', function (debugData) {
    debugData.content = '<b>Value</b> = ' + value;
});

// Display JSON object.
ac.debug.on('hook-name', function (debugData) {
    debugData.content = jsonObject;
});
```

### Configuration

### Mojit Debug Hook

### Client Side Debugging

### Waterfall Debug Hook

## Advanced

