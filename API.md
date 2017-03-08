# API

## `Toys`
A container for a group of toys, each toy being a hapi utility.

### `new Toys(server, [CustomPromise])`
Creates an instance of toys specific to a hapi server `server`, and optionally a custom A+ promise constructor `CustomPromise`.

> **A note on usage**
>
> Each instance method, e.g. `toys.reacher()`, may also be used statically, e.g. `Toys.reacher()`.  The only difference between the static and instance methods is that some of the static methods have `server` or `CustomPromise` arguments that are not necessary when working with an instance.
>
> The docs below will document the static version of each toy, then note the signature of the instance version.

### `Toys.withDefaults(defaults, [isNullOverride])`
> As instance, `toys.withDefaults(defaults, [isNullOverride])`

Returns a function with signature `function(options)` that will apply `defaults` as defaults to the `options` object.  If `options` is an array of objects, it will apply the defaults to each item in the array. If `isNullOverride` is `true` then `null` values within `options` can override corresponding default values.

```js
const defaultToGet = Toys.withDefaults({ method: 'get' });

server.route(
    defaultToGet([
        {
            path: '/',
            handler: function (request, reply) {
                reply('I was gotten');
            }
        },
        {
            method: 'post',
            path: '/',
            handler: function (request, reply) {
                reply('I was posted');
            }
        }
    ])
);
```

### `Toys.handler(asyncHandler)`
> As instance, `toys.handler(asyncHandler)`

Returns a route handler function given `asyncHandler`, an `async function(request, reply)`, that will handle otherwise unhandled exceptions that occur in `asyncHandler`.  When such an exception `err` occurs, the handler will `reply(err)`.

```js
server.route({
    method: 'get',
    path: '/user/{id}',
    handler: Toys.handler(async function(request, reply) {

        const user = await getUser(request.params.id);

        if (!user) {
            throw Boom.notFound('User not found'); // This will work!
        }

        return reply(user);
    })
});
```

### `Toys.handler(server, notation)`
> As instance, `toys.handler(notation)`

Returns a route handler function given a hapi `server` and a short-hand string `notation` referencing a server method on that server.

Note that the server method is resolved at the time of the request, so monkey-patching server methods will work correctly; hapi's short-hand for server method handlers does not support monkey-patching server methods, which is often useful during testing.

#### `notation` format
The `notation` parameter should be in the format `name(args)` or `name` where,
 - `name` - the method name, e.g. `users.fetch`.
 - `args` - the method arguments where each argument is a property of the request object.  If the server method takes a callback then the last argument should be called `cb`, `callback`, or `next`.  If `(args)` are omitted entirely then the args will implicitly be `(request, reply)`.

Here are some valid examples,
 - `'someMethodHandler'`
 - `'latestNews()'`
 - `'users.fetch(params.id, cb)'`
 - `'add(query.a, query.b)'`

```js
server.method({
    name: 'users.fetch',
    method: (id, callback) => {
        return getUserById(id, callback);
    }
});

server.route({
    method: 'get',
    path: '/user/{userId}',
    handler: Toys.handler(server, 'users.fetch(params.userId, cb)')
});
```

### `Toys.pre(server, notation, [options])`
> As instance, `toys.pre(notation, [options])`

Returns a [route prerequisite object](https://github.com/hapijs/hapi/blob/master/API.md#route-prerequisites) given a hapi `server`, a short-hand string `notation` (described [above](#notation-format)) referencing a server method on that server, and optional `options` to set the prerequisite's `assign` or `failAction`.  By default `assign` is set to the server method's name.

```js
server.method({
    name: 'add',
    method: (a, b) => {
        return parseInt(a) + parseInt(b);
    },
    options: { callback: false }
});

server.route({
    method: 'get',
    path: '/{a}/{b}',
    config: {
        pre: [
            Toys.pre(server, 'add(params.a, params.b)')
        ],
        handler: function (request, reply) {

            reply(`Magic number is ${request.pre.add}`);
        }
    }
});
```

### `Toys.ext(method, [options])`
> As instance, `toys.ext(method, [options])`

Returns a hapi [extension config](https://github.com/hapijs/hapi/blob/master/API.md#serverextevents) `{ method, options }` without the `type` field. The config only has `options` set when provided as an argument.  This intended to be used with the route `ext` config.

```js
server.route({
    method: 'get',
    path: '/',
    config: {
        handler: function (request, reply) {

            return reply({ ok: true });
        },
        ext: {
            onPostAuth: Toys.ext((request, reply) => {

                if (!request.headers['special-header']) {
                    return reply(Boom.unauthorized());
                }

                return reply.continue();
            })
        }
    }
});
```

### `Toys.EXTENSION(method, [options])`
> As instance, `toys.EXTENSION(method, [options])`

Returns a hapi [extension config](https://github.com/hapijs/hapi/blob/master/API.md#serverextevents) `{ type, method, options}` with the `type` field set to `EXTENSION`, where `EXTENSION` is any of `onRequest`, `onPreAuth`, `onPostAuth`, `onPreHandler`, `onPostHandler`, `onPreResponse`, `onPreStart`, `onPostStart`, `onPreStop`, or `onPostStop`. The config only has `options` set when provided as an argument.  This is intended to be used with [`server.ext()`](https://github.com/hapijs/hapi/blob/master/API.md#serverextevents).

```js
server.ext([
    Toys.onPreAuth((request, reply) => {

        if (!request.query.specialParam) {
            return reply(Boom.unauthorized());
        }

        return reply.continue();
    }),
    Toys.onPreResponse((request, reply) => {

        if (!request.response.isBoom &&
            request.query.specialParam === 'secret') {

            request.log(['my-plugin'], 'Someone knew a secret');
        }

        return reply.continue();        
    }, {
        sandbox: true
    })
]);
```

### `Toys.promisify([CustomPromise], fn)`
> As instance, `toys.promisify(fn)`

Promisifies callback-style function `fn`.  When `CustomPromise` is provided, it is used as a `Promise` constructor rather than native promises.  If `fn`'s callback receives more arguments than `function(err, value)` then those arguments are ignored.  This is intended to help promisify cacheable server methods, which require a callback using multiple value arguments.

```js
server.method({
    name: 'getTodaysWeather',
    method: (cb) => {
        obtainTheWeather((err, weather) => {

            if (err) {
                return cb(err);
            }

            return cb(null, weather.today);
        });
    },
    options: {
        cache: {                        // Requires use of callback
            expiresIn: 1000 * 60 * 15,  // 15min
            generateTimeout: 200
        }
    }
});

server.methods.getTodaysWeather = Toys.promisify(server.methods.getTodaysWeather);

server.methods.getTodaysWeather()
.then((todaysWeather) => {
    // This result should be cached for 15min
    server.log(['weather'], todaysWeather);
})
.catch((err) => {
    server.log(['weather', 'error'], err);
});
```

### `Toys.reacher(chain, [options])`
> As instance, `toys.reacher(chain, [options])`

Returns a function `function(obj)` that will return [`Hoek.reach(obj, chain, options)`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options).  Unlike `Hoek.reach()`, this function is designed to be performant in hot code paths such as route handlers.  See [`Hoek.reach()`](https://github.com/hapijs/hoek/blob/master/API.md#reachobj-chain-options) for a description of `options`.

```js
const getAuthedGroupId = Toys.reacher('auth.credentials.user.group.id');

server.route({
    method: 'get',
    path: '/user/group',
    config: {
        auth: 'my-strategy',
        handler: function (request, reply) {

            const group = getAuthedGroupId(request);

            if (group !== 'BRS') {
                return reply(Boom.unauthorized());
            }

            return reply({ group });
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
    'country': 'address.country.code',
});

server.route({
    method: 'get',
    path: '/user/address',
    config: {
        auth: 'my-strategy',
        handler: function (request, reply) {

            const address = userAddress(request.auth.credentials);

            return reply({ address });
        }
    }
});
```

### `Toys.auth.strategy(server, name, authenticate)`
> As instance, `toys.auth.strategy(name, authenticate)`

Adds an auth scheme and strategy with name `name` to `server`.  Its implementation is given by `authenticate` as described in [`server.auth.scheme()`](https://github.com/hapijs/hapi/blob/master/API.md#serverauthschemename-scheme).  This is intended to make it simple to create a barebones auth strategy without having to create a reusable auth scheme; it is often useful for testing and simple auth implementations.

```js
Toys.auth.strategy(server, 'simple-bearer', (request, reply) => {

    const token = (request.headers.authorization || '').replace('Bearer ', '');

    if (!token) {
        return reply(Boom.unauthorized(null, 'Bearer'));
    }

    lookupSession(token, (err, session) => {

        if (err) {
            return reply(err);
        }

        return reply.continue({ credentials: session })
    });
});

server.route({
    method: 'get',
    path: '/user',
    config: {
        auth: 'simple-bearer',
        handler: function (request, reply) {

            const user = request.auth.credentials.user;

            return reply({ user });
        }
    }
});
```
