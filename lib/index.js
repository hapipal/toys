'use strict';

const Hoek = require('hoek');

const internals = {};

module.exports = exports = class {

    constructor(server, CustomPromise) {

        this.server = server;
        this.CustomPromise = CustomPromise;
    }

    static withDefaults(defaults, isNullOverride) {

        return (options) => {

            if (Array.isArray(options)) {
                return options.map((opt) => Hoek.applyToDefaults(defaults, opt, isNullOverride));
            }

            return Hoek.applyToDefaults(defaults, options, isNullOverride);
        };
    }

    withDefaults(defaults, isNullOverride) {

        return this.constructor.withDefaults(defaults, isNullOverride);
    }

    static handler(handlerOrServer, notation) {

        if (typeof handlerOrServer === 'function') {
            const asyncHandler = handlerOrServer;

            return function (request, reply) {

                return asyncHandler.call(this, request, reply).catch(reply);
            };
        }

        const server = handlerOrServer;
        return internals.fromString('handler', server, notation).method;
    }

    handler(handlerOrNotation) {

        if (typeof handlerOrNotation === 'function') {
            const handler = handlerOrNotation;
            return this.constructor.handler(handler);
        }

        const notation = handlerOrNotation;
        return this.constructor.handler(this.server, notation);
    }

    static pre(server, notation, options) {

        options = options || {};

        const pre = (typeof options === 'string') ? { assign: options } : Hoek.shallow(options);

        Hoek.assert(!pre.method, 'pre() will create a prerequisite method for you, so it cannot be specified in options.');

        const parsed = internals.fromString('pre', server, notation);

        pre.method = parsed.method;
        pre.assign = pre.assign || parsed.name;

        return pre;
    }

    pre(notation, options) {

        return this.constructor.pre(this.server, notation, options);
    }

    static ext(method, options) {

        return internals.ext(null, method, options);
    }

    ext(method, options) {

        return this.constructor.ext(method, options);
    }

    static onRequest(method, options) {

        return internals.ext('onRequest', method, options);
    }

    onRequest(method, options) {

        return this.constructor.onRequest(method, options);
    }

    static onPreAuth(method, options) {

        return internals.ext('onPreAuth', method, options);
    }

    onPreAuth(method, options) {

        return this.constructor.onPreAuth(method, options);
    }

    static onPostAuth(method, options) {

        return internals.ext('onPostAuth', method, options);
    }

    onPostAuth(method, options) {

        return this.constructor.onPostAuth(method, options);
    }

    static onPreHandler(method, options) {

        return internals.ext('onPreHandler', method, options);
    }

    onPreHandler(method, options) {

        return this.constructor.onPreHandler(method, options);
    }

    static onPostHandler(method, options) {

        return internals.ext('onPostHandler', method, options);
    }

    onPostHandler(method, options) {

        return this.constructor.onPostHandler(method, options);
    }

    static onPreResponse(method, options) {

        return internals.ext('onPreResponse', method, options);
    }

    onPreResponse(method, options) {

        return this.constructor.onPreResponse(method, options);
    }

    static onPreStart(method, options) {

        return internals.ext('onPreStart', method, options);
    }

    onPreStart(method, options) {

        return this.constructor.onPreStart(method, options);
    }

    static onPostStart(method, options) {

        return internals.ext('onPostStart', method, options);
    }

    onPostStart(method, options) {

        return this.constructor.onPostStart(method, options);
    }

    static onPreStop(method, options) {

        return internals.ext('onPreStop', method, options);
    }

    onPreStop(method, options) {

        return this.constructor.onPreStop(method, options);
    }

    static onPostStop(method, options) {

        return internals.ext('onPostStop', method, options);
    }

    onPostStop(method, options) {

        return this.constructor.onPostStop(method, options);
    }

    static reacher(chain, options) {

        if (chain === false ||
            chain === null ||
            typeof chain === 'undefined') {

            return (obj) => obj;
        }

        options = options || {};

        if (typeof options === 'string') {
            options = { separator: options };
        }

        const path = chain.split(options.separator || '.');

        return (obj) => {

            let ref = obj;

            for (let i = 0; i < path.length; ++i) {
                let key = path[i];

                if (key[0] === '-' && Array.isArray(ref)) {
                    key = key.slice(1, key.length);
                    key = ref.length - key;
                }

                if (!ref ||
                    !((typeof ref === 'object' || typeof ref === 'function') && key in ref) ||
                    (typeof ref !== 'object' && options.functions === false)) {         // Only object and function can have properties

                    Hoek.assert(!options.strict || i + 1 === path.length, `Missing segment ${key} in reach path ${chain}`);
                    Hoek.assert(typeof ref === 'object' || options.functions === true || typeof ref !== 'function', `Invalid segment ${key} in reach path ${chain}`);

                    ref = options.default;

                    break;
                }

                ref = ref[key];
            }

            return ref;
        };
    };

    reacher(chain, options) {

        return this.constructor.reacher(chain, options);
    }

    static transformer(transform, options) {

        const separator = (typeof options === 'object' && options !== null) ? (options.separator || '.') : '.';
        const transformSteps = [];
        const keys = Object.keys(transform);

        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            const sourcePath = transform[key];

            Hoek.assert(typeof sourcePath === 'string', 'All mappings must be strings');

            transformSteps.push({
                path: key.split(separator),
                reacher: this.reacher(sourcePath, options)
            });
        }

        const transformFn = (source) => {

            Hoek.assert(source === null || source === undefined || typeof source === 'object' || Array.isArray(source), 'Invalid source object: must be null, undefined, an object, or an array');

            if (Array.isArray(source)) {
                const results = [];
                for (let i = 0; i < source.length; ++i) {
                    results.push(transformFn(source[i]));
                }
                return results;
            }

            const result = {};

            for (let i = 0; i < transformSteps.length; ++i) {
                const step = transformSteps[i];
                const path = step.path;
                const reacher = step.reacher;

                let segment;
                let res = result;

                for (let j = 0; j < path.length - 1; ++j) {
                    segment = path[j];
                    if (!res[segment]) {
                        res[segment] = {};
                    }
                    res = res[segment];
                }
                segment = path[path.length - 1];

                res[segment] = reacher(source);
            }

            return result;
        };

        return transformFn;
    }

    transformer(transform, options) {

        return this.constructor.transformer(transform, options);
    }

    static promisify(CustomPromise, method) {

        if (!method) {
            method = CustomPromise;
            CustomPromise = null;
        }

        CustomPromise = CustomPromise || Promise;

        return function () {

            const len = arguments.length;
            const args = new Array(len + 1);

            for (let i = 0; i < len; ++i) {
                args[i] = arguments[i];
            }

            return new CustomPromise((resolve, reject) => {

                args[len] = (err, value) => {

                    if (err) {
                        return reject(err);
                    }

                    return resolve(value);
                };

                return method.apply(null, args);
            });
        };
    }

    promisify(method) {

        return this.constructor.promisify(this.CustomPromise, method);
    }

    static get auth() {

        return {
            strategy: internals.strategy
        };
    }

    get auth() {

        return {
            strategy: this.constructor.auth.strategy.bind(this, this.server)
        };
    }
};

internals.strategy = (server, name, authenticate) => {

    server.auth.scheme(name, () => ({ authenticate }));
    server.auth.strategy(name, name);
};

internals.ext = (type, method, options) => {

    const extConfig = { method };

    if (type) {
        extConfig.type = type;
    }

    if (options) {
        extConfig.options = options;
    }

    return extConfig;
};

internals.fromString = function (type, server, notation) {

    //                                  1:name            2:(        3:arguments
    const methodParts = notation.match(/^([\w\.]+)(?:\s*)(?:(\()(?:\s*)(\w+(?:\.\w+)*(?:\s*\,\s*\w+(?:\.\w+)*)*)?(?:\s*)\))?$/);
    Hoek.assert(methodParts, `Invalid server method string notation: ${notation}`);

    const name = methodParts[1];
    Hoek.assert(name.match(internals.methodNameRx), `Invalid server method name: ${name}`);

    const getMethod = exports.reacher(name);
    Hoek.assert(getMethod(server.methods), `Unknown server method in string notation: ${notation}`);

    const argsNotation = !!methodParts[2];
    const methodArgs = (argsNotation ? (methodParts[3] || '').split(/\s*\,\s*/) : []);

    const result = { name };

    if (!argsNotation) {
        result.method = (request, reply) => getMethod(server.methods)(request, reply);
        return result;
    }

    let useCallback = false;
    const argReachers = [];

    for (let i = 0; i < methodArgs.length; ++i) {
        const arg = methodArgs[i];

        if (i === methodArgs.length - 1 && (arg === 'cb' || arg === 'callback' || arg === 'next')) {
            useCallback = true;
        }
        else if (arg) {
            argReachers.push(exports.reacher(arg));
        }
    }

    result.method = (request, reply) => {

        const args = [];
        for (let i = 0; i < argReachers.length; ++i) {
            args.push(argReachers[i](request));
        }

        if (!useCallback) {
            const response = getMethod(server.methods).apply(null, args);
            return reply(response);
        }

        const finalize = (err, value, cached, report) => {

            if (report) {
                request.log([type, 'method', name], report);
            }

            return reply(err, value);
        };

        args.push(finalize);
        getMethod(server.methods).apply(null, args);
    };

    return result;
};

internals.methodNameRx = /^[_$a-zA-Z][$\w]*(?:\.[_$a-zA-Z][$\w]*)*$/;
