'use strict';

const Hoek = require('@hapi/hoek');

const internals = {};

module.exports = class Toys {

    constructor(server) {

        this.server = server;
    }

    static withRouteDefaults(defaults) {

        return (options) => {

            if (Array.isArray(options)) {
                return options.map((opt) => internals.applyRouteDefaults(defaults, opt));
            }

            return internals.applyRouteDefaults(defaults, options);
        };
    }

    withRouteDefaults(defaults) {

        return this.constructor.withRouteDefaults(defaults);
    }

    static pre(prereqSets) {

        const method = (prereq) => {

            return (typeof prereq === 'function') ? { method: prereq } : prereq;
        };

        const toPres = (prereqs) => {

            if (typeof prereqs === 'function') {
                return prereqs;
            }

            return Object.keys(prereqs).reduce((collect, assign) => {

                const prereq = prereqs[assign];

                return collect.concat({
                    assign,
                    ...method(prereq)
                });
            }, []);
        };

        if (Array.isArray(prereqSets)) {
            return prereqSets.map(toPres);
        }

        return toPres(prereqSets);
    }

    pre(prereqSets) {

        return this.constructor.pre(prereqSets);
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

    static onCredentials(method, options) {

        return internals.ext('onCredentials', method, options);
    }

    onCredentials(method, options) {

        return this.constructor.onCredentials(method, options);
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
    }

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

    static get noop() {

        return {
            name: 'toys-noop',
            multiple: true,
            register: Hoek.ignore
        };
    }

    get noop() {

        return this.constructor.noop;
    }

    static async event(emitter, name, options) {

        return await internals.event(emitter, name, options);
    }

    async event(emitter, name, options) {

        return await this.constructor.event(emitter, name, options);
    }

    static async stream(stream) {

        Hoek.assert(stream.readable || stream.writable, 'Stream must be readable or writable');

        if (!stream.writable) {         // Only readable
            await internals.event(stream, 'end');
            return;
        }
        else if (!stream.readable) {    // Only writable
            await internals.event(stream, 'finish');
            return;
        }

        await Promise.all([
            internals.event(stream, 'end'),
            internals.event(stream, 'finish')
        ]);
    }

    async stream(stream) {

        return await this.constructor.stream(stream);
    }

    static forEachAncestorRealm(realm, fn) {

        do {
            fn(realm);
            realm = realm.parent;
        }
        while (realm);
    }

    forEachAncestorRealm(fn) {

        return this.constructor.forEachAncestorRealm(this.server.realm, fn);
    }

    static rootRealm(realm) {

        while (realm.parent) {
            realm = realm.parent;
        }

        return realm;
    }

    rootRealm() {

        return this.constructor.rootRealm(this.server.realm);
    }

    static state(realm, name) {

        return internals.state(realm, name);
    }

    state(name) {

        return this.constructor.state(this.server.realm, name);
    }

    static rootState(realm, name) {

        while (realm.parent) {
            realm = realm.parent;
        }

        return internals.state(realm, name);
    }

    rootState(name) {

        return this.constructor.rootState(this.server.realm, name);
    }

    static realm(obj) {

        if (internals.isRealm(obj && obj.realm)) {
            // Server, route, response toolkit
            return obj.realm;
        }
        else if (internals.isRealm(obj && obj.route && obj.route.realm)) {
            // Request
            return obj.route.realm;
        }

        Hoek.assert(internals.isRealm(obj), 'Must pass a server, request, route, response toolkit, or realm');

        // Realm
        return obj;
    }

    realm(obj = this.server) {

        return this.constructor.realm(obj);
    }

    static options(obj) {

        return this.realm(obj).pluginOptions;
    }

    options(obj = this.server) {

        return this.constructor.options(obj);
    }

    static header(response, key, value, options = {}) {

        Hoek.assert(response && (response.isBoom || typeof response.header === 'function'), 'The passed response must be a boom error or hapi response object.');

        if (!response.isBoom) {
            return response.header(key, value, options);
        }

        key = key.toLowerCase();
        const { headers } = response.output;

        const append = options.append || false;
        const separator = options.separator || ',';
        const override = options.override !== false;
        const duplicate = options.duplicate !== false;

        if ((!append && override) || !headers[key]) {
            headers[key] = value;
        }
        else if (override) {
            if (key === 'set-cookie') {
                headers[key] = [].concat(headers[key], value);
            }
            else {
                const existing = headers[key];
                if (!duplicate) {
                    const values = existing.split(separator);
                    for (const v of values) {
                        if (v === value) {
                            return response;
                        }
                    }
                }

                headers[key] = existing + separator + value;
            }
        }

        return response;
    }

    header(response, key, value, options) {

        return this.constructor.header(response, key, value, options);
    }

    static getHeaders(response) {

        Hoek.assert(response && (response.isBoom || typeof response.header === 'function'), 'The passed response must be a boom error or hapi response object.');

        if (!response.isBoom) {
            return response.headers;
        }

        return response.output.headers;
    }

    getHeaders(response) {

        return this.constructor.getHeaders(response);
    }

    static code(response, statusCode) {

        Hoek.assert(response && (response.isBoom || typeof response.code === 'function'), 'The passed response must be a boom error or hapi response object.');

        if (!response.isBoom) {
            return response.code(statusCode);
        }

        response.output.statusCode = statusCode;
        response.reformat();

        return response;
    }

    code(response, statusCode) {

        return this.constructor.code(response, statusCode);
    }

    static getCode(response) {

        Hoek.assert(response && (response.isBoom || typeof response.code === 'function'), 'The passed response must be a boom error or hapi response object.');

        if (!response.isBoom) {
            return response.statusCode;
        }

        return response.output.statusCode;
    }

    getCode(response) {

        return this.constructor.getCode(response);
    }
};

// Looks like a realm
internals.isRealm = (obj) => obj && obj.hasOwnProperty('pluginOptions') && obj.hasOwnProperty('modifiers');

internals.applyRouteDefaults = (defaults, options) => {

    return Hoek.applyToDefaults(defaults, options, {
        shallow: [
            'options.bind',
            'config.bind',
            'options.validate.headers',
            'config.validate.headers',
            'options.validate.payload',
            'config.validate.payload',
            'options.validate.params',
            'config.validate.params',
            'options.validate.query',
            'config.validate.query',
            'options.response.schema',
            'config.response.schema',
            'options.validate.validator',
            'config.validate.validator'
        ]
    });
};

internals.state = (realm, name) => {

    const state = realm.plugins[name] = realm.plugins[name] || {};
    return state;
};

internals.event = (emitter, name, options = {}) => {

    options = Hoek.applyToDefaults({ error: true, multiple: false }, options);

    return new Promise((resolve, reject) => {

        const onSuccess = (...values) => {

            if (options.error) {
                emitter.removeListener('error', onError);
            }

            if (options.multiple) {
                return resolve(values);
            }

            return resolve(values[0]);
        };

        const onError = (err) => {

            emitter.removeListener(name, onSuccess);

            return reject(err);
        };

        emitter.once(name, onSuccess);

        if (options.error) {
            emitter.once('error', onError);
        }
    });
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
