# API

## `Toys`
A container for a group of toys, each toy being a hapi utility.

### `new Toys(server)`
Creates an instance of toys specific to a hapi server `server`;

> **A note on usage**
>
> Each instance method, e.g. `toys.reacher()`, may also be used statically, e.g. `Toys.reacher()`.  The only difference between the static and instance methods is that some of the static methods have or require `server` arguments that are not necessary when working with an instance.
>
> The docs below will document the static version of each toy, then note the signature of the instance version.

### `Toys.withRouteDefaults(defaults)`
> As instance, `toys.withRouteDefaults(defaults)`

Returns a function with signature `function(route)` that will apply `defaults` as defaults to the `route` [route configuration](https://github.com/hapijs/hapi/blob/master/API.md#server.route()) object.  It will shallow-merge any route `validate` and `bind` options to avoid inadvertently applying defaults to a Joi schema or other unfamiliar object.  If `route` is an array of routes, it will apply the defaults to each route in the array.

```js
const defaultToGet = Toys.withRouteDefaults({ method: 'get' });

server.route(
    defaultToGet([
        {
            path: '/',
            handler: () => 'I was gotten'
        },
        {
            method: 'post',
            path: '/',
            handler: () => 'I was posted'
        }
    ])
);
```

### `Toys.ext(method, [options])`
> As instance, `toys.ext(method, [options])`

Returns a hapi [extension config](https://github.com/hapijs/hapi/blob/master/API.md#server.ext()) `{ method, options }` without the `type` field. The config only has `options` set when provided as an argument.  This intended to be used with the route `ext` config.

```js
server.route({
    method: 'get',
    path: '/',
    options: {
        handler: (request) => {

            return { ok: true };
        },
        ext: {
            onPostAuth: Toys.ext((request, h) => {

                if (!request.headers['special-header']) {
                    throw Boom.unauthorized();
                }

                return h.continue;
            })
        }
    }
});
```

### `Toys.EXTENSION(method, [options])`
> As instance, `toys.EXTENSION(method, [options])`

Returns a hapi [extension config](https://github.com/hapijs/hapi/blob/master/API.md#server.ext()) `{ type, method, options}` with the `type` field set to `EXTENSION`, where `EXTENSION` is any of `onRequest`, `onPreAuth`, `onPostAuth`, `onCredentials`, `onPreHandler`, `onPostHandler`, `onPreResponse`, `onPreStart`, `onPostStart`, `onPreStop`, or `onPostStop`. The config only has `options` set when provided as an argument.  This is intended to be used with [`server.ext()`](https://github.com/hapijs/hapi/blob/master/API.md#server.ext()).

```js
server.ext([
    Toys.onPreAuth((request, h) => {

        if (!request.query.specialParam) {
            throw Boom.unauthorized();
        }

        return h.continue;
    }),
    Toys.onPreResponse((request, h) => {

        if (!request.response.isBoom &&
            request.query.specialParam === 'secret') {

            request.log(['my-plugin'], 'Someone knew a secret');
        }

        return h.continue;        
    }, {
        sandbox: 'plugin'
    })
]);
```

### `Toys.reacher(chain, [options])`
> As instance, `toys.reacher(chain, [options])`

Returns a function `function(obj)` that will return [`Hoek.reach(obj, chain, options)`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options).  Unlike `Hoek.reach()`, this function is designed to be performant in hot code paths such as route handlers.  See [`Hoek.reach()`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options) for a description of `options`.

```js
const getAuthedGroupId = Toys.reacher('auth.credentials.user.group.id');

server.route({
    method: 'get',
    path: '/user/group',
    options: {
        auth: 'my-strategy',
        handler: (request) => {

            const group = getAuthedGroupId(request);

            if (group !== 'BRS') {
                throw Boom.unauthorized();
            }

            return { group };
        }
    }
});
```

### `Toys.transformer(transform, [options])`
> As instance, `toys.transformer(transform, [options])`

Returns a function `function(obj)` that will return [`Hoek.transform(obj, transform, options)`](https://github.com/hapijs/hoek/blob/master/API.md#transformobj-transform-options).  Unlike `Hoek.transform()`, this function is designed to be performant in hot code paths such as route handlers.  See [`Hoek.reach()`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options) for a description of `options`.

```js
const userAddress = Toys.transformer({
    'street1': 'address.street_one',
    'street2': 'address.street_two',
    'city': 'address.city',
    'state': 'address.state.code',
    'country': 'address.country.code'
});

server.route({
    method: 'get',
    path: '/user/address',
    options: {
        auth: 'my-strategy',
        handler: (request) => {

            const address = userAddress(request.auth.credentials);

            return { address };
        }
    }
});
```

### `Toys.auth.strategy(server, name, authenticate)`
> As instance, `toys.auth.strategy(name, authenticate)`

Adds an auth scheme and strategy with name `name` to `server`.  Its implementation is given by `authenticate` as described in [`server.auth.scheme()`](https://github.com/hapijs/hapi/blob/master/API.md#server.auth.scheme()).  This is intended to make it simple to create a barebones auth strategy without having to create a reusable auth scheme; it is often useful for testing and simple auth implementations.

```js
Toys.auth.strategy(server, 'simple-bearer', async (request, h) => {

    const token = (request.headers.authorization || '').replace('Bearer ', '');

    if (!token) {
        throw Boom.unauthorized(null, 'Bearer');
    }

    const credentials = await lookupSession(token);

    return h.authenticated({ credentials });
});

server.route({
    method: 'get',
    path: '/user',
    options: {
        auth: 'simple-bearer',
        handler: (request) => request.auth.credentials.user
    }
});
```

### `Toys.noop`
> As instance, `toys.noop`

This is a plugin named `toys-noop` that does nothing and can be registered multiple times.  This can be useful when conditionally registering a plugin in a list or [glue](https://github.com/hapijs/glue) manifest.

```js
await server.register([
    require('./my-plugin-a'),
    require('./my-plugin-b'),
    (process.env.NODE_ENV === 'production') ? Toys.noop : require('lout')
]);
```

### `await Toys.event(emitter, eventName, [options])`
> As instance, `await toys.event(emitter, eventName, [options])`

Waits for `emitter` to emit an event named `eventName` and returns the first value passed to the event's listener.  When `options.multiple` is `true` it instead returns an array of all values passed to the listener.  Throws if an event named `'error'` is emitted unless `options.error` is `false`.  This can be useful when waiting for an event in a handler, extension, or server method, which all require an `async` function when returning a value asynchronously.

```js
const ChildProcess = require('child_process');

server.route({
    method: 'get',
    path: '/report/user/{id}',
    options: {
        handler: async (request) => {

            const generateReport = ChildProcess.fork(`${__dirname}/report.js`);

            generateReport.send({ userId: request.params.id });

            const report = await Toys.event(generateReport, 'message');

            generateReport.disconnect();

            return report;
        }
    }
});
```

### `await Toys.stream(stream)`
> As instance, `await toys.stream(stream)`

Waits for a readable `stream` to end, a writable `stream` to finish, or a duplex `stream` to both end and finish.  Throws an error if `stream` emits an `'error'` event.  This can be useful when waiting for a stream to process in a handler, extension, or server method, which all require an `async` function when returning a value asynchronously.

```js
const Fs = require('fs');
const Crypto = require('crypto');

// Hash a file and cache the result by filename

server.method({
    name: 'hash',
    method: async (filename) => {

        const hasher = Crypto.createHash('sha256');
        const input = Fs.createReadStream(filename);
        const output = input.pipe(hasher);

        let hash = '';
        output.on('data', (chunk) => {

            hash += chunk.toString('hex');
        });

        await Toys.stream(output);

        return hash;
    },
    options: {
        cache: {
            generateTimeout: 1000,
            expiresIn: 2000
        }
    }
});
```

### `Toys.options(obj)`
> As instance, `toys.options([obj])`

Given `obj` as a server, request, route, response toolkit, or realm, returns the relevant plugin options.  If `obj` is none of the above then this method will throw an error.  When used as an instance `obj` defaults to `toys.server`.

```js
// Here is a route configuration in its own file.
//
// The route is added to the server somewhere else, but we still
// need that server's plugin options for use in the handler.

module.exports = {
    method: 'post',
    path: '/user/{id}/resend-verification-email',
    handler: async (request) => {

        // fromAddress configured at plugin registration time, e.g. no-reply@toys.biz
        const { fromAddress } = Toys.options(request);
        const user = await server.methods.getUser(request.params.id);

        await server.methods.sendVerificationEmail({
            to: user.email,
            from: fromAddress
        });

        return { success: true };
    }
};
```

### `Toys.realm(obj)`
> As instance, `toys.realm([obj])`

Given `obj` as a server, request, route, response toolkit, or realm, returns the relevant realm.  If `obj` is none of the above then this method will throw an error.  When used as an instance `obj` defaults to `toys.server`.

### `Toys.rootRealm(realm)`
> As instance, `toys.rootRealm()`

Given a `realm` this method follows the `realm.parent` chain and returns the topmost realm, known as the "root realm."  When used as an instance, returns `toys.server.realm`'s root realm.

### `Toys.state(realm, pluginName)`
> As instance, `toys.state(pluginName)`

Returns the plugin state for `pluginName` within `realm` (`realm.plugins[pluginName]`), and initializes it to an empty object if it is not already set.  When used as an instance, returns the plugin state within `toys.server.realm`.

### `Toys.rootState(realm, pluginName)`
> As instance, `toys.rootState(pluginName)`

Returns the plugin state for `pluginName` within `realm`'s [root realm](#toysrootrealmrealm), and initializes it to an empty object if it is not already set.  When used as an instance, returns the plugin state within `toys.server.realm`'s root realm.

### `Toys.forEachAncestorRealm(realm, fn)`
> As instance, `toys.forEachAncestorRealm(fn)`

Walks up the `realm.parent` chain and calls `fn(realm)` for each realm, starting with the passed `realm`.  When used as an instance, this method starts with `toys.server.realm`.
