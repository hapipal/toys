'use strict';

const { AsyncLocalStorage } = require('async_hooks');
const Hoek = require('@hapi/hoek');

const internals = {};

exports.withRouteDefaults = (defaults) => {

    return (options) => {

        if (Array.isArray(options)) {
            return options.map((opt) => internals.applyRouteDefaults(defaults, opt));
        }

        return internals.applyRouteDefaults(defaults, options);
    };
};

exports.pre = (prereqSets) => {

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
};

exports.ext = (method, options) => {

    return internals.ext(null, method, options);
};

exports.onRequest = (method, options) => {

    return internals.ext('onRequest', method, options);
};

exports.onPreAuth = (method, options) => {

    return internals.ext('onPreAuth', method, options);
};

exports.onCredentials = (method, options) => {

    return internals.ext('onCredentials', method, options);
};

exports.onPostAuth = (method, options) => {

    return internals.ext('onPostAuth', method, options);
};

exports.onPreHandler = (method, options) => {

    return internals.ext('onPreHandler', method, options);
};

exports.onPostHandler = (method, options) => {

    return internals.ext('onPostHandler', method, options);
};

exports.onPreResponse = (method, options) => {

    return internals.ext('onPreResponse', method, options);
};

exports.onPreStart = (method, options) => {

    return internals.ext('onPreStart', method, options);
};

exports.onPostStart = (method, options) => {

    return internals.ext('onPostStart', method, options);
};

exports.onPreStop = (method, options) => {

    return internals.ext('onPreStop', method, options);
};

exports.onPostStop = (method, options) => {

    return internals.ext('onPostStop', method, options);
};

exports.auth = {};

exports.auth.strategy = (server, name, authenticate) => {

    server.auth.scheme(name, () => ({ authenticate }));
    server.auth.strategy(name, name);
};

exports.noop = {
    name: 'toys-noop',
    multiple: true,
    register: Hoek.ignore
};

exports.forEachAncestorRealm = (realm, fn) => {

    do {
        fn(realm);
        realm = realm.parent;
    }
    while (realm);
};

exports.rootRealm = (realm) => {

    while (realm.parent) {
        realm = realm.parent;
    }

    return realm;
};

exports.state = (realm, name) => {

    return internals.state(realm, name);
};

exports.rootState = (realm, name) => {

    while (realm.parent) {
        realm = realm.parent;
    }

    return internals.state(realm, name);
};

exports.realm = (obj) => {

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
};

exports.options = (obj) => {

    return this.realm(obj).pluginOptions;
};

exports.header = (response, key, value, options = {}) => {

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
};

exports.getHeaders = (response) => {

    Hoek.assert(response && (response.isBoom || typeof response.header === 'function'), 'The passed response must be a boom error or hapi response object.');

    if (!response.isBoom) {
        return response.headers;
    }

    return response.output.headers;
};

exports.code = (response, statusCode) => {

    Hoek.assert(response && (response.isBoom || typeof response.code === 'function'), 'The passed response must be a boom error or hapi response object.');

    if (!response.isBoom) {
        return response.code(statusCode);
    }

    response.output.statusCode = statusCode;
    response.reformat();

    return response;
};

exports.getCode = (response) => {

    Hoek.assert(response && (response.isBoom || typeof response.code === 'function'), 'The passed response must be a boom error or hapi response object.');

    if (!response.isBoom) {
        return response.statusCode;
    }

    return response.output.statusCode;
};

exports.asyncStorage = (identifier) => {

    if (!internals.asyncStorageInternals.has(identifier)) {
        return;
    }

    return internals.asyncStorageInternals.get(identifier).getStore();
};

exports.withAsyncStorage = (identifier, store, fn) => {

    Hoek.assert(typeof exports.asyncStorage(identifier) === 'undefined', `There is already an active async store for identifier "${String(identifier)}".`);

    if (!internals.asyncStorageInternals.has(identifier)) {
        internals.asyncStorageInternals.set(identifier, new AsyncLocalStorage());
    }

    return internals.asyncStorageInternals.get(identifier).run(store, fn);
};

exports.asyncStorageInternals = () => internals.asyncStorageInternals;

exports.patchJoiSchema = (schema) => {

    const keys = Object.keys(schema.describe().keys || {});

    // Make all keys optional, do not enforce defaults

    if (keys.length) {
        schema = schema.fork(keys, (s) => s.optional());
    }

    return schema.prefs({ noDefaults: true });
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

internals.asyncStorageInternals = new Map();
