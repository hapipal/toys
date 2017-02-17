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
        {/* TODO */}
    ])
);
```

### `Toys.handler(server, notation)` or `Toys.handler(asyncHandler)`
> As instance, `Toys.handler(notation)` or `Toys.handler(asyncHandler)`
