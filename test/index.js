'use strict';

// Load modules

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
const Joi = require('joi');
const Toys = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('Toys', () => {

    describe('withRouteDefaults()', () => {

        const defaults = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: [5, 6]
            },
            f: 6,
            g: 'test'
        };

        it('throws when target is null.', () => {

            expect(() => {

                Toys.withRouteDefaults(null)({});
            }).to.throw('Invalid defaults value: must be an object');
        });

        it('returns null if options is false.', () => {

            const result = Toys.withRouteDefaults(defaults)(false);
            expect(result).to.equal(null);
        });

        it('returns null if options is null.', () => {

            const result = Toys.withRouteDefaults(defaults)(null);
            expect(result).to.equal(null);
        });

        it('returns null if options is undefined.', () => {

            const result = Toys.withRouteDefaults(defaults)(undefined);
            expect(result).to.equal(null);
        });

        it('returns a copy of defaults if options is true.', () => {

            const result = Toys.withRouteDefaults(defaults)(true);
            expect(result).to.equal(defaults);
        });

        it('applies object to defaults.', () => {

            const obj = {
                a: null,
                c: {
                    e: [4]
                },
                f: 0,
                g: {
                    h: 5
                }
            };

            const result = Toys.withRouteDefaults(defaults)(obj);
            expect(result.c.e).to.equal([4]);
            expect(result.a).to.equal(1);
            expect(result.b).to.equal(2);
            expect(result.f).to.equal(0);
            expect(result.g).to.equal({ h: 5 });
        });

        it('maps array objects over defaults.', () => {

            const obj = {
                a: null,
                c: {
                    e: [4]
                },
                f: 0,
                g: {
                    h: 5
                }
            };

            const results = Toys.withRouteDefaults(defaults)([obj, obj, obj]);

            expect(results).to.have.length(3);

            results.forEach((result) => {

                expect(result.c.e).to.equal([4]);
                expect(result.a).to.equal(1);
                expect(result.b).to.equal(2);
                expect(result.f).to.equal(0);
                expect(result.g).to.equal({ h: 5 });
            });
        });

        it('applies object to defaults multiple times.', () => {

            const obj = {
                a: null,
                c: {
                    e: [4]
                },
                f: 0,
                g: {
                    h: 5
                }
            };

            const withRouteDefaults = Toys.withRouteDefaults(defaults);
            const once = withRouteDefaults(obj);
            const twice = withRouteDefaults(obj);

            expect(once).to.equal(twice);
        });

        it('shallow copies route-specific properties.', () => {

            const shallowDefaults = {
                config: {
                    anything: { x: 1 },
                    validate: {
                        query: { defaults: true },
                        payload: { defaults: true },
                        headers: { defaults: true },
                        params: { defaults: true },
                        validator: { defaults: null }
                    },
                    bind: { defaults: true },
                    response: {
                        schema: { defaults: true }
                    }
                },
                options: {
                    anything: { x: 1 },
                    validate: {
                        query: { defaults: true },
                        payload: { defaults: true },
                        headers: { defaults: true },
                        params: { defaults: true },
                        validator: { defaults: null }
                    },
                    bind: { defaults: true },
                    response: {
                        schema: { defaults: true }
                    }
                }
            };

            const route = {
                config: {
                    anything: { y: 2 },
                    validate: {
                        query: {},
                        payload: {},
                        headers: {},
                        params: {},
                        validator: {}
                    },
                    bind: {},
                    response: {
                        schema: {}
                    }
                },
                options: {
                    anything: { y: 2 },
                    validate: {
                        query: {},
                        payload: {},
                        headers: {},
                        params: {},
                        validator: {}
                    },
                    bind: {},
                    response: {
                        schema: {}
                    }
                }
            };

            const result = Toys.withRouteDefaults(shallowDefaults)(route);

            expect(result).to.equal({
                config: {
                    anything: { x: 1, y: 2 },
                    validate: {
                        query: {},
                        payload: {},
                        headers: {},
                        params: {},
                        validator: {}
                    },
                    bind: {},
                    response: {
                        schema: {}
                    }
                },
                options: {
                    anything: { x: 1, y: 2 },
                    validate: {
                        query: {},
                        payload: {},
                        headers: {},
                        params: {},
                        validator: {}
                    },
                    bind: {},
                    response: {
                        schema: {}
                    }
                }
            });
        });
    });

    describe('auth.strategy()', () => {

        it('creates a one-off auth strategy with duplicate scheme name.', async () => {

            const server = Hapi.server();

            Toys.auth.strategy(server, 'test-auth', (request, h) => {

                return h.authenticated({ credentials: { user: 'bill' } });
            });

            // Reuse the scheme implicitly created above
            server.auth.strategy('test-auth-again', 'test-auth');

            server.route([
                {
                    method: 'get',
                    path: '/',
                    config: {
                        auth: 'test-auth',
                        handler: (request) => request.auth.credentials
                    }
                },
                {
                    method: 'get',
                    path: '/again',
                    config: {
                        auth: 'test-auth-again',
                        handler: (request) => request.auth.credentials
                    }
                }
            ]);

            const res1 = await server.inject('/');

            expect(res1.result).to.equal({ user: 'bill' });

            const res2 = await server.inject('/again');

            expect(res2.result).to.equal({ user: 'bill' });
        });
    });

    describe('pre()', () => {

        it('creates valid hapi route prerequisites with a function or config.', () => {

            const prereqs = {
                assign1: () => null,
                assign2: { method: () => null, failAction: 'log' }
            };

            const [pre1, pre2, ...others] = Toys.pre(prereqs);

            expect(others).to.have.length(0);

            expect(pre1).to.only.contain(['assign', 'method']);
            expect(pre1.assign).to.equal('assign1');
            expect(pre1.method).to.shallow.equal(prereqs.assign1);

            expect(pre2).to.only.contain(['assign', 'method', 'failAction']);
            expect(pre2.assign).to.equal('assign2');
            expect(pre2.method).to.shallow.equal(prereqs.assign2.method);
            expect(pre2.failAction).to.equal('log');

            const method = () => null;

            expect(Toys.pre(method)).to.shallow.equal(method);
        });

        it('creates valid hapi route prerequisites with an array.', () => {

            const prereqs = [
                { assign1: () => null },
                { assign2: { method: () => null, failAction: 'log' } },
                {
                    assign3: () => null,
                    assign4: () => null
                },
                () => null
            ];

            const [
                [pre1, ...others1],
                [pre2, ...others2],
                [pre3, pre4, ...others3],
                pre5,
                ...others
            ] = Toys.pre(prereqs);

            expect(others).to.have.length(0);
            expect(others1).to.have.length(0);
            expect(others2).to.have.length(0);
            expect(others3).to.have.length(0);

            expect(pre1).to.only.contain(['assign', 'method']);
            expect(pre1.assign).to.equal('assign1');
            expect(pre1.method).to.shallow.equal(prereqs[0].assign1);

            expect(pre2).to.only.contain(['assign', 'method', 'failAction']);
            expect(pre2.assign).to.equal('assign2');
            expect(pre2.method).to.shallow.equal(prereqs[1].assign2.method);
            expect(pre2.failAction).to.equal('log');

            expect(pre3).to.only.contain(['assign', 'method']);
            expect(pre3.assign).to.equal('assign3');
            expect(pre3.method).to.shallow.equal(prereqs[2].assign3);

            expect(pre4).to.only.contain(['assign', 'method']);
            expect(pre4.assign).to.equal('assign4');
            expect(pre4.method).to.shallow.equal(prereqs[2].assign4);

            expect(pre5).to.shallow.equal(prereqs[3]);
        });
    });

    // Test the request extension helpers

    [
        'ext',
        'onPreStart',
        'onPostStart',
        'onPreStop',
        'onPostStop',
        'onRequest',
        'onPreAuth',
        'onPostAuth',
        'onCredentials',
        'onPreHandler',
        'onPostHandler',
        'onPreResponse'
    ].forEach((ext) => {

        const isExt = (ext === 'ext');

        describe(`${ext}()`, () => {

            it('creates a valid hapi request extension without options.', () => {

                const fn = function () {};
                const extension = Toys[ext](fn);

                const keys = isExt ? ['method'] : ['type', 'method'];

                expect(Object.keys(extension)).to.only.contain(keys);
                isExt || expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);
            });

            it('creates a valid hapi request extension with options.', () => {

                const fn = function () {};
                const opts = { before: 'loveboat' };
                const extension = Toys[ext](fn, opts);

                const keys = isExt ? ['method', 'options'] : ['type', 'method', 'options'];

                expect(Object.keys(extension)).to.only.contain(keys);
                isExt || expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);
                expect(extension.options).to.shallow.equal(opts);
            });
        });
    });

    describe('noop', () => {

        it('is a hapi plugin that does nothing and can be registered multiple times.', async () => {

            const server = Hapi.server();

            expect(Toys.noop.register).to.shallow.equal(Hoek.ignore);

            await server.register(Toys.noop);

            expect(server.registrations).to.only.contain('toys-noop');

            await server.register(Toys.noop);

            expect(server.registrations).to.only.contain('toys-noop');
        });
    });

    describe('options()', () => {

        it('gets plugin options from a server.', async () => {

            const server = Hapi.server();

            expect(Toys.options(server)).to.shallow.equal(server.realm.pluginOptions);

            await server.register({
                name: 'plugin',
                register(srv) {

                    expect(Toys.options(srv)).to.shallow.equal(srv.realm.pluginOptions);
                }
            });
        });

        it('gets plugin options from a request.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request) {

                            expect(Toys.options(request)).to.shallow.equal(request.route.realm.pluginOptions);
                            expect(Toys.options(request)).to.shallow.equal(srv.realm.pluginOptions);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets plugin options from a route.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request) {

                            expect(Toys.options(request.route)).to.shallow.equal(request.route.realm.pluginOptions);
                            expect(Toys.options(request.route)).to.shallow.equal(srv.realm.pluginOptions);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets plugin options from a response toolkit.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request, h) {

                            expect(Toys.options(h)).to.shallow.equal(h.realm.pluginOptions);
                            expect(Toys.options(h)).to.shallow.equal(srv.realm.pluginOptions);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets plugin options from a realm.', async () => {

            const server = Hapi.server();

            expect(Toys.options(server.realm)).to.shallow.equal(server.realm.pluginOptions);

            await server.register({
                name: 'plugin',
                register(srv) {

                    expect(Toys.options(srv.realm)).to.shallow.equal(srv.realm.pluginOptions);
                }
            });
        });

        it('throws when passed an unfamiliar object.', () => {

            expect(() => Toys.options({})).to.throw('Must pass a server, request, route, response toolkit, or realm');
            expect(() => Toys.options(null)).to.throw('Must pass a server, request, route, response toolkit, or realm');
        });
    });

    describe('realm()', () => {

        it('gets realm from a server.', async () => {

            const server = Hapi.server();

            expect(Toys.realm(server)).to.shallow.equal(server.realm);

            await server.register({
                name: 'plugin',
                register(srv) {

                    expect(Toys.realm(srv)).to.shallow.equal(srv.realm);
                }
            });
        });

        it('gets realm from a request.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request) {

                            expect(Toys.realm(request)).to.shallow.equal(request.route.realm);
                            expect(Toys.realm(request)).to.shallow.equal(srv.realm);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets realm from a route.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request) {

                            expect(Toys.realm(request.route)).to.shallow.equal(request.route.realm);
                            expect(Toys.realm(request.route)).to.shallow.equal(srv.realm);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets realm from a response toolkit.', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin',
                register(srv) {

                    srv.route({
                        method: 'get',
                        path: '/',
                        handler(request, h) {

                            expect(Toys.realm(h)).to.shallow.equal(h.realm);
                            expect(Toys.realm(h)).to.shallow.equal(srv.realm);

                            return { ok: true };
                        }
                    });
                }
            });

            const { result } = await server.inject('/');

            expect(result).to.equal({ ok: true });
        });

        it('gets realm from a realm.', async () => {

            const server = Hapi.server();

            expect(Toys.realm(server.realm)).to.shallow.equal(server.realm);

            await server.register({
                name: 'plugin',
                register(srv) {

                    expect(Toys.realm(srv.realm)).to.shallow.equal(srv.realm);
                }
            });
        });

        it('throws when passed an unfamiliar object.', () => {

            expect(() => Toys.realm({})).to.throw('Must pass a server, request, route, response toolkit, or realm');
            expect(() => Toys.realm(null)).to.throw('Must pass a server, request, route, response toolkit, or realm');
        });
    });

    describe('rootRealm()', () => {

        it('given a realm, returns the root server\'s realm.', async () => {

            const server = Hapi.server();

            expect(Toys.rootRealm(server.realm)).to.shallow.equal(server.realm);

            await server.register({
                name: 'plugin-a',
                async register(srvB) {

                    await srvB.register({
                        name: 'plugin-a1',
                        register(srvA1) {

                            expect(Toys.rootRealm(srvA1.realm)).to.shallow.equal(server.realm);
                        }
                    });
                }
            });
        });
    });

    describe('state()', () => {

        it('returns/initializes plugin state given a realm and plugin name.', async () => {

            const server = Hapi.server();
            const state = () => Toys.state(server.realm, 'root');

            expect(server.realm.plugins.root).to.not.exist();
            expect(state()).to.shallow.equal(state());
            expect(state()).to.shallow.equal(server.realm.plugins.root);
            expect(state()).to.equal({});

            await server.register({
                name: 'plugin-a',
                register(srv) {

                    const stateA = () => Toys.state(srv.realm, 'plugin-a');

                    expect(srv.realm.plugins['plugin-a']).to.not.exist();
                    expect(stateA()).to.shallow.equal(stateA());
                    expect(stateA()).to.shallow.equal(srv.realm.plugins['plugin-a']);
                    expect(stateA()).to.equal({});
                }
            });
        });
    });

    describe('rootState()', () => {

        it('given a realm, returns the root server\'s realm.', async () => {

            const server = Hapi.server();
            const state = () => Toys.rootState(server.realm, 'root');

            expect(server.realm.plugins.root).to.not.exist();
            expect(state()).to.shallow.equal(state());
            expect(state()).to.shallow.equal(server.realm.plugins.root);
            expect(state()).to.equal({});

            await server.register({
                name: 'plugin-a',
                async register(srvB) {

                    await srvB.register({
                        name: 'plugin-a1',
                        register(srvA1) {

                            const stateA1 = () => Toys.rootState(srvA1.realm, 'plugin-a1');

                            expect(server.realm.plugins['plugin-a1']).to.not.exist();
                            expect(stateA1()).to.shallow.equal(stateA1());
                            expect(stateA1()).to.shallow.equal(server.realm.plugins['plugin-a1']);
                            expect(stateA1()).to.equal({});
                        }
                    });
                }
            });
        });
    });

    describe('forEachAncestorRealm()', () => {

        it('calls a function for each ancestor realm up to the root realm', async () => {

            const server = Hapi.server();

            await server.register({
                name: 'plugin-a',
                register() {}
            });

            await server.register({
                name: 'plugin-b',
                async register(srvB) {

                    await srvB.register({
                        name: 'plugin-b1',
                        register(srvB1) {

                            const realms = [];
                            Toys.forEachAncestorRealm(srvB1.realm, (realm) => realms.push(realm));

                            expect(realms).to.have.length(3);
                            expect(realms[0]).to.shallow.equal(srvB1.realm);
                            expect(realms[1]).to.shallow.equal(srvB.realm);
                            expect(realms[2]).to.shallow.equal(server.realm);
                        }
                    });
                }
            });
        });
    });

    describe('header()', () => {

        const testHeadersWith = (method) => {

            const server = Hapi.server();

            server.route({
                method: 'get',
                path: '/non-error',
                options: {
                    handler: () => ({ success: true }),
                    ext: {
                        onPreResponse: { method }
                    }
                }
            });

            server.route({
                method: 'get',
                path: '/error',
                options: {
                    handler: () => {

                        throw Boom.unauthorized('Original message');
                    },
                    ext: {
                        onPreResponse: { method }
                    }
                }
            });

            return server;
        };

        it('throws when passed a non-response.', () => {

            expect(() => Toys.header(null)).to.throw('The passed response must be a boom error or hapi response object.');
            expect(() => Toys.header({})).to.throw('The passed response must be a boom error or hapi response object.');
        });

        it('sets headers without any options.', async () => {

            const server = testHeadersWith((request, h) => {

                Toys.header(request.response, 'a', 'x');
                Toys.header(request.response, 'b', 'x');
                Toys.header(request.response, 'b', 'y');

                return h.continue;
            });

            const { headers: errorHeaders } = await server.inject('/error');
            const { headers: nonErrorHeaders } = await server.inject('/non-error');

            expect(errorHeaders).to.contain({ a: 'x', b: 'y' });
            expect(nonErrorHeaders).to.contain({ a: 'x', b: 'y' });
        });

        it('does not set existing header when override is false.', async () => {

            const server = testHeadersWith((request, h) => {

                Toys.header(request.response, 'a', 'x', { override: false });
                Toys.header(request.response, 'a', 'y', { override: false });

                return h.continue;
            });

            const { headers: errorHeaders } = await server.inject('/error');
            const { headers: nonErrorHeaders } = await server.inject('/non-error');

            expect(errorHeaders).to.contain({ a: 'x' });
            expect(nonErrorHeaders).to.contain({ a: 'x' });
        });

        it('appends to existing headers with separator.', async () => {

            const server = testHeadersWith((request, h) => {

                Toys.header(request.response, 'a', 'x', { append: true });
                Toys.header(request.response, 'A', 'y', { append: true });
                Toys.header(request.response, 'b', 'x', { append: true, separator: ';' });
                Toys.header(request.response, 'B', 'y', { append: true, separator: ';' });

                return h.continue;
            });

            const { headers: errorHeaders } = await server.inject('/error');
            const { headers: nonErrorHeaders } = await server.inject('/non-error');

            expect(errorHeaders).to.contain({ a: 'x,y', b: 'x;y' });
            expect(nonErrorHeaders).to.contain({ a: 'x,y', b: 'x;y' });
        });

        it('handles special case for appending set-cookie.', async () => {

            const server = testHeadersWith((request, h) => {

                Toys.header(request.response, 'set-cookie', 'a=x', { append: true });
                Toys.header(request.response, 'set-cookie', 'b=x', { append: true });
                Toys.header(request.response, 'Set-Cookie', 'b=y', { append: true });

                return h.continue;
            });

            const { headers: errorHeaders } = await server.inject('/error');
            const { headers: nonErrorHeaders } = await server.inject('/non-error');

            expect(nonErrorHeaders).to.contain({ 'set-cookie': ['a=x', 'b=x', 'b=y'] });
            expect(errorHeaders).to.contain({ 'set-cookie': ['a=x', 'b=x', 'b=y'] });
        });

        it('prevents duplicates when appending when duplicate is false.', async () => {

            const server = testHeadersWith((request, h) => {

                Toys.header(request.response, 'a', 'x', { append: true });
                Toys.header(request.response, 'A', 'y', { append: true });
                Toys.header(request.response, 'a', 'y', { append: true, duplicate: false });
                Toys.header(request.response, 'b', 'x', { append: true, separator: ';' });
                Toys.header(request.response, 'B', 'y', { append: true, separator: ';' });
                Toys.header(request.response, 'b', 'y', { append: true, separator: ';', duplicate: false });

                return h.continue;
            });

            const { headers: errorHeaders } = await server.inject('/error');
            const { headers: nonErrorHeaders } = await server.inject('/non-error');

            expect(errorHeaders).to.contain({ a: 'x,y', b: 'x;y' });
            expect(nonErrorHeaders).to.contain({ a: 'x,y', b: 'x;y' });
        });
    });

    describe('getHeaders()', () => {

        it('throws when passed a non-response.', () => {

            expect(() => Toys.getHeaders(null)).to.throw('The passed response must be a boom error or hapi response object.');
            expect(() => Toys.getHeaders({})).to.throw('The passed response must be a boom error or hapi response object.');
        });

        it('gets headers values from a non-error response.', async () => {

            const server = Hapi.server();

            let headers;

            server.route({
                method: 'get',
                path: '/non-error',
                options: {
                    handler: () => ({ success: true }),
                    ext: {
                        onPreResponse: {
                            method: (request, h) => {

                                request.response.header('a', 'x');
                                request.response.header('b', 'y');

                                headers = Toys.getHeaders(request.response);

                                return h.continue;
                            }
                        }
                    }
                }
            });

            const res = await server.inject('/non-error');

            expect(headers).to.contain({ a: 'x', b: 'y' });
            expect(res.headers).to.contain({ a: 'x', b: 'y' });
        });

        it('gets headers values from an error response.', async () => {

            const server = Hapi.server();

            let headers;

            server.route({
                method: 'get',
                path: '/error',
                options: {
                    handler: () => {

                        throw Boom.unauthorized('Original message');
                    },
                    ext: {
                        onPreResponse: {
                            method: (request, h) => {

                                request.response.output.headers.a = 'x';
                                request.response.output.headers.b = 'y';

                                headers = Toys.getHeaders(request.response);

                                return h.continue;
                            }
                        }
                    }
                }
            });

            const res = await server.inject('/error');

            expect(headers).to.equal({ a: 'x', b: 'y' });
            expect(res.headers).to.contain({ a: 'x', b: 'y' });
        });
    });

    describe('code()', () => {

        const testCodeWith = (method) => {

            const server = Hapi.server();

            server.route({
                method: 'get',
                path: '/non-error',
                options: {
                    handler: () => ({ success: true }),
                    ext: {
                        onPreResponse: { method }
                    }
                }
            });

            server.route({
                method: 'get',
                path: '/error',
                options: {
                    handler: () => {

                        throw Boom.unauthorized('Original message');
                    },
                    ext: {
                        onPreResponse: { method }
                    }
                }
            });

            return server;
        };

        it('throws when passed a non-response.', () => {

            expect(() => Toys.code(null)).to.throw('The passed response must be a boom error or hapi response object.');
            expect(() => Toys.code({})).to.throw('The passed response must be a boom error or hapi response object.');
        });

        it('sets status code.', async () => {

            const server = testCodeWith((request, h) => {

                Toys.code(request.response, 403);

                return h.continue;
            });

            const errorRes = await server.inject('/error');
            const nonErrorRes = await server.inject('/non-error');

            expect(errorRes.statusCode).to.equal(403);
            expect(nonErrorRes.statusCode).to.equal(403);

            expect(errorRes.result).to.equal({
                statusCode: 403,
                error: 'Forbidden',
                message: 'Original message'
            });

            expect(nonErrorRes.result).to.equal({ success: true });
        });
    });

    describe('getCode()', () => {


        it('throws when passed a non-response.', () => {

            expect(() => Toys.getCode(null)).to.throw('The passed response must be a boom error or hapi response object.');
            expect(() => Toys.getCode({})).to.throw('The passed response must be a boom error or hapi response object.');
        });

        it('gets status code from a non-error response.', async () => {

            const server = Hapi.server();

            let code;

            server.route({
                method: 'get',
                path: '/non-error',
                options: {
                    handler: () => ({ success: true }),
                    ext: {
                        onPreResponse: {
                            method: (request, h) => {

                                request.response.code(202);

                                code = Toys.getCode(request.response);

                                return h.continue;
                            }
                        }
                    }
                }
            });

            const res = await server.inject('/non-error');

            expect(code).to.equal(202);
            expect(res.statusCode).to.equal(202);
        });

        it('gets status code from an error response.', async () => {

            const server = Hapi.server();

            let code;

            server.route({
                method: 'get',
                path: '/error',
                options: {
                    handler: () => {

                        throw Boom.unauthorized();
                    },
                    ext: {
                        onPreResponse: {
                            method: (request, h) => {

                                request.response.output.statusCode = 403;
                                request.response.reformat();

                                code = Toys.getCode(request.response);

                                return h.continue;
                            }
                        }
                    }
                }
            });

            const res = await server.inject('/error');

            expect(code).to.equal(403);
            expect(res.statusCode).to.equal(403);
        });
    });

    describe('asyncStorage(), withAsyncStorage(), and asyncStorageInternals()', () => {

        it('set-up async local storage based on a string identifier.', async () => {

            const multiplyBy = async (x, ms) => {

                await Hoek.wait(ms);

                return x * (Toys.asyncStorage('y') || 0);
            };

            const [a, b, c, d] = await Promise.all([
                Toys.withAsyncStorage('y', 2, async () => await multiplyBy(4, 10)),
                multiplyBy(4, 20),
                Toys.withAsyncStorage('y', 4, async () => await multiplyBy(4, 30)),
                Toys.withAsyncStorage('y', 5, async () => await multiplyBy(4, 40))
            ]);

            expect(a).to.equal(2 * 4);
            expect(b).to.equal(0 * 4);
            expect(c).to.equal(4 * 4);
            expect(d).to.equal(5 * 4);
        });

        it('set-up async local storage based on a symbol identifier.', async () => {

            const kY = Symbol('y');

            const multiplyBy = async (x, ms) => {

                await Hoek.wait(ms);

                return x * (Toys.asyncStorage(kY) || 0);
            };

            const [a, b, c, d] = await Promise.all([
                Toys.withAsyncStorage(kY, 2, async () => await multiplyBy(4, 10)),
                multiplyBy(4, 20),
                Toys.withAsyncStorage(kY, 4, async () => await multiplyBy(4, 30)),
                Toys.withAsyncStorage(kY, 5, async () => await multiplyBy(4, 40))
            ]);

            expect(a).to.equal(2 * 4);
            expect(b).to.equal(0 * 4);
            expect(c).to.equal(4 * 4);
            expect(d).to.equal(5 * 4);
        });

        it('do not allow conflicting async local storage identifiers on the same stack.', async () => {

            const multiplyBy = async (x) => {

                await Hoek.wait(0);

                return x * (Toys.asyncStorage('y') || 0);
            };

            const getResult = async () => {

                return await Toys.withAsyncStorage('y', 3, async () => {

                    const a = await multiplyBy(4);

                    return await Toys.withAsyncStorage('y', a, async () => {

                        return await multiplyBy(5);
                    });
                });
            };

            await expect(getResult()).to.reject('There is already an active async store for identifier "y".');
        });

        it('generate errors for Symbols properly.', async () => {

            const kY = Symbol('y');

            const multiplyBy = async (x) => {

                await Hoek.wait(0);

                return x * (Toys.asyncStorage(kY) || 0);
            };

            const getResult = async () => {

                return await Toys.withAsyncStorage(kY, 3, async () => {

                    const a = await multiplyBy(4);

                    return await Toys.withAsyncStorage(kY, a, async () => {

                        return await multiplyBy(5);
                    });
                });
            };

            await expect(getResult()).to.reject('There is already an active async store for identifier "Symbol(y)".');
        });

        it('expose async local storage instances.', async () => {

            const multiplyBy = async (x) => {

                await Hoek.wait(0);

                Toys.asyncStorageInternals().get('y').disable();

                return x * (Toys.asyncStorage('y') || 0);
            };

            const a = await Toys.withAsyncStorage('y', 3, async () => await multiplyBy(4));

            expect(a).to.equal(0);
            expect(Toys.asyncStorageInternals()).to.be.an.instanceof(Map);
        });
    });

    describe('patchJoiSchema()', () => {

        it('returns patched schema for joi object', () => {

            const schema = Joi.object();

            const patchedSchema = Toys.patchJoiSchema(schema);

            expect(patchedSchema).to.be.an.object();
        });

        it('patched joi schema contains optional keys', () => {

            const schema = Joi.object().keys({
                a: Joi.string().required(),
                b: Joi.date().required()
            });

            const patchedSchema = Toys.patchJoiSchema(schema);
            const described = patchedSchema.describe();

            expect(described.preferences).to.equal({ noDefaults: true });
            expect(described.keys.a.flags).to.equal({ presence: 'optional' });
            expect(described.keys.b.flags).to.equal({ presence: 'optional' });
        });

        it('patched joi schema does not enforce defaults', () => {

            const schema = Joi.object().keys({
                x: Joi.number().integer().default(10)
            });

            const patchedSchema = Toys.patchJoiSchema(schema);
            const described = patchedSchema.describe();

            expect(described.keys.x.flags).to.equal({ default: 10, presence: 'optional' });
            expect(patchedSchema.validate({ x: undefined })).to.equal({ value: { x: undefined } });
        });
    });
});
