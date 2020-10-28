# API

The hapi utility toy chest

> **Note**
>
> Toys is intended for use with hapi v19+ and nodejs v12+ (_see v2 for lower support_).

## `Toys`
### `Toys.withRouteDefaults(defaults)`

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

### `Toys.pre(prereqs)`

Returns a hapi [route prerequisite configuration](https://github.com/hapijs/hapi/blob/master/API.md#route.options.pre), mapping each key of `prereqs` to the `assign` value of a route prerequisite.  When the key's corresponding value is a function, that function is used as the `method` of the prerequisite.  When the key's corresponding value is an object, that object's keys and values are included in the prerequisite.  When `prereqs` is a function, that function is simply passed-through.  When `prereqs` is an array, the array's values are simply mapped as described above.

This is intended to be a useful shorthand for writing route prerequisites, as demonstrated below.

```js
server.route({
    method: 'get',
    path: '/user/{id}',
    options: {
        pre: Toys.pre([
            {
                user: async ({ params }) => await getUserById(params.id)
            },
            ({ pre }) => ensureUserIsPublic(pre.user),
            {
                groups: async ({ params, pre }) => await getUserGroups(params.id, pre.user.roles),
                posts: async ({ params, pre }) => await getUserPosts(params.id, pre.user.roles)
            }
        ]),
        handler: ({ pre }) => ({
            ...pre.user,
            groups: pre.groups,
            posts: pre.posts
        })
    }
});

// pre value is expanded as shown below

/*
        pre: [
            [
                {
                    assign: 'user',
                    method: async ({ params }) => await getUserById(params.id)
                }
            ],
            ({ pre }) => ensureUserIsPublic(pre.user),
            [
                {
                    assign: 'groups',
                    method: async ({ params, pre }) => await getUserGroups(params.id, pre.user.roles)
                },
                {
                    assign: 'posts',
                    method: async ({ params, pre }) => await getUserPosts(params.id, pre.user.roles)
                }
            ]
        ]
 */
```

### `Toys.ext(method, [options])`

Returns a hapi [extension config](https://github.com/hapijs/hapi/blob/master/API.md#server.ext()) `{ method, options }` without the `type` field. The config only has `options` set when provided as an argument.  This is intended to be used with the route `ext` config.

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

This is a plugin named `toys-noop` that does nothing and can be registered multiple times.  This can be useful when conditionally registering a plugin in a list or [glue](https://github.com/hapijs/glue) manifest.

```js
await server.register([
    require('./my-plugin-a'),
    require('./my-plugin-b'),
    (process.env.NODE_ENV === 'production') ? Toys.noop : require('lout')
]);
```

### `await Toys.event(emitter, eventName, [options])`

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

### `await Toys.stream(stream, [options])`

Waits for a readable `stream` to end, a writable `stream` to finish, or a duplex `stream` to both end and finish.  Throws an error if `stream` emits an `'error'` event.  This can be useful when waiting for a stream to process in a handler, extension, or server method, which all require an `async` function when returning a value asynchronously.  This is powered by node's [`Stream.finished()`](https://nodejs.org/api/stream.html#stream_stream_finished_stream_options_callback), and accepts all of that utility's `options`.  When `options.cleanup` is `true`, dangling event handlers left by `Stream.finished()` will be removed.

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

### `Toys.header(response, name, value, [options])`

Designed to behave identically to hapi's [`response.header(name, value, [options])`](https://hapi.dev/api/#response.header()), but provide a unified interface for setting HTTP headers between both hapi [response objects](https://hapi.dev/api/#response-object) and [boom](https://hapi.dev/family/boom) errors.  This is useful in request extensions, when you don't know if [`request.response`](https://hapi.dev/api/#request.response) is a hapi response object or a boom error.  Returns `response`.

- `name` - the header name.
- `value` - the header value.
- `options` - (optional) object where:
  - `append` - if `true`, the value is appended to any existing header value using `separator`.  Defaults to `false`.
  - `separator` - string used as separator when appending to an existing value.  Defaults to `','`.
  - `override` - if `false`, the header value is not set if an existing value present.  Defaults to `true`.
  - `duplicate` - if `false`, the header value is not modified if the provided value is already included.  Does not apply when `append` is `false` or if the `name` is `'set-cookie'`.  Defaults to `true`.

### `Toys.getHeaders(response)`

Returns `response`'s current HTTP headers, where `response` may be a hapi [response object](https://hapi.dev/api/#response-object) or a [boom](https://hapi.dev/family/boom) error.

### `Toys.code(response, statusCode)`

Designed to behave identically to hapi's [`response.code(statusCode)`](https://hapi.dev/api/#response.code()), but provide a unified interface for setting the HTTP status code between both hapi [response objects](https://hapi.dev/api/#response-object) and [boom](https://hapi.dev/family/boom) errors.  This is useful in request extensions, when you don't know if [`request.response`](https://hapi.dev/api/#request.response) is a hapi response object or a boom error.  Returns `response`.

### `Toys.getCode(response)`

Returns `response`'s current HTTP status code, where `response` may be a hapi [response object](https://hapi.dev/api/#response-object) or a [boom](https://hapi.dev/family/boom) error.

### `Toys.realm(obj)`

Given `obj` as a server, request, route, response toolkit, or realm, returns the relevant realm.  If `obj` is none of the above then this method will throw an error.  When used as an instance `obj` defaults to `toys.server`.

### `Toys.rootRealm(realm)`

Given a `realm` this method follows the `realm.parent` chain and returns the topmost realm, known as the "root realm."  When used as an instance, returns `toys.server.realm`'s root realm.

### `Toys.state(realm, pluginName)`

Returns the plugin state for `pluginName` within `realm` (`realm.plugins[pluginName]`), and initializes it to an empty object if it is not already set.  When used as an instance, returns the plugin state within `toys.server.realm`.

### `Toys.rootState(realm, pluginName)`

Returns the plugin state for `pluginName` within `realm`'s [root realm](#toysrootrealmrealm), and initializes it to an empty object if it is not already set.  When used as an instance, returns the plugin state within `toys.server.realm`'s root realm.

### `Toys.forEachAncestorRealm(realm, fn)`

Walks up the `realm.parent` chain and calls `fn(realm)` for each realm, starting with the passed `realm`.  When used as an instance, this method starts with `toys.server.realm`.

### `Toys.asyncStorage(identifier)`

Returns async local storage store associated with `identifier`, as set-up using [`Toys.withAsyncStorage()`](#toyswithasyncstorageidentifier-store-fn).  When there is no active store, returns `undefined`.

### `Toys.withAsyncStorage(identifier, store, fn)`

Runs and returns the result of `fn` with an active async local storage `store` identified by `identifier`.  Intended to be used with [`Toys.asyncStorage()`](#toysasyncstorageidentifier).  Note that string identifiers beginning with `'@hapipal'` are reserved.

```js
const multiplyBy = async (x) => {

    await Hoek.wait(10); // Wait 10ms

    return x * (Toys.asyncStorage('y') || 0);
};

// The result is 4 * 3 = 12
const result = await Toys.withAsyncStorage('y', 3, async () => {

    return await multiplyBy(4);
});
```

### `Toys.asyncStorageInternals()`

Returns a `Map` which maps identifiers utilized by [`Toys.withAsyncStorage()`](#toyswithasyncstorageidentifier-store-fn) to the underlying instances of [`AsyncLocalStorage`](https://nodejs.org/api/async_hooks.html#async_hooks_class_asynclocalstorage).
