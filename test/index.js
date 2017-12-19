'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Toys = require('..');

// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

describe('Toys', () => {

    describe('withDefaults()', () => {

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

                Toys.withDefaults(null)({});
            }).to.throw('Invalid defaults value: must be an object');
        });

        it('returns null if options is false.', () => {

            const result = Toys.withDefaults(defaults)(false);
            expect(result).to.equal(null);
        });

        it('returns null if options is null.', () => {

            const result = Toys.withDefaults(defaults)(null);
            expect(result).to.equal(null);
        });

        it('returns null if options is undefined.', () => {

            const result = Toys.withDefaults(defaults)(undefined);
            expect(result).to.equal(null);
        });

        it('returns a copy of defaults if options is true.', () => {

            const result = Toys.withDefaults(defaults)(true);
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

            const result = Toys.withDefaults(defaults)(obj);
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

            const results = Toys.withDefaults(defaults)([obj, obj, obj]);

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

            const withDefaults = Toys.withDefaults(defaults);
            const once = withDefaults(obj);
            const twice = withDefaults(obj);

            expect(once).to.equal(twice);
        });

        it('applies object to defaults with null.', () => {

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

            const result = Toys.withDefaults(defaults, true)(obj);
            expect(result.c.e).to.equal([4]);
            expect(result.a).to.equal(null);
            expect(result.b).to.equal(2);
            expect(result.f).to.equal(0);
            expect(result.g).to.equal({ h: 5 });
        });

        it('works as an instance method.', () => {

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

            const toys = new Toys();
            const result = toys.withDefaults(defaults, true)(obj);

            expect(result.c.e).to.equal([4]);
            expect(result.a).to.equal(null);
            expect(result.b).to.equal(2);
            expect(result.f).to.equal(0);
            expect(result.g).to.equal({ h: 5 });
        });
    });

    describe('reacher()', () => {

        const obj = {
            a: {
                b: {
                    c: {
                        d: 1,
                        e: 2
                    },
                    f: 'hello'
                },
                g: {
                    h: 3
                }
            },
            i: function () { },
            j: null,
            k: [4, 8, 9, 1]
        };

        obj.i.x = 5;

        it('returns object itself.', () => {

            expect(Toys.reacher(null)(obj)).to.shallow.equal(obj);
            expect(Toys.reacher(false)(obj)).to.shallow.equal(obj);
            expect(Toys.reacher()(obj)).to.shallow.equal(obj);
        });

        it('returns first value of array.', () => {

            expect(Toys.reacher('k.0')(obj)).to.equal(4);
        });

        it('returns last value of array using negative index.', () => {

            expect(Toys.reacher('k.-2')(obj)).to.equal(9);
        });

        it('returns a valid member.', () => {

            expect(Toys.reacher('a.b.c.d')(obj)).to.equal(1);
        });

        it('returns a valid member with separator override.', () => {

            expect(Toys.reacher('a/b/c/d', '/')(obj)).to.equal(1);
        });

        it('returns undefined on null object.', () => {

            expect(Toys.reacher('a.b.c.d')(null)).to.equal(undefined);
        });

        it('returns undefined on missing object member.', () => {

            expect(Toys.reacher('a.b.c.d.x')(obj)).to.equal(undefined);
        });

        it('returns undefined on missing function member.', () => {

            expect(Toys.reacher('i.y', { functions: true })(obj)).to.equal(undefined);
        });

        it('throws on missing member in strict mode.', () => {

            expect(() => {

                Toys.reacher('a.b.c.o.x', { strict: true })(obj);
            }).to.throw('Missing segment o in reach path a.b.c.o.x');
        });

        it('returns undefined on invalid member.', () => {

            expect(Toys.reacher('a.b.c.d-.x')(obj)).to.equal(undefined);
        });

        it('returns function member.', () => {

            expect(typeof Toys.reacher('i')(obj)).to.equal('function');
        });

        it('returns function property.', () => {

            expect(Toys.reacher('i.x')(obj)).to.equal(5);
        });

        it('returns null.', () => {

            expect(Toys.reacher('j')(obj)).to.equal(null);
        });

        it('throws on function property when functions not allowed.', () => {

            expect(() => {

                Toys.reacher('i.x', { functions: false })(obj);
            }).to.throw('Invalid segment x in reach path i.x');
        });

        it('will return a default value if property is not found.', () => {

            expect(Toys.reacher('a.b.q', { default: 'defaultValue' })(obj)).to.equal('defaultValue');
        });

        it('will return a default value if path is not found.', () => {

            expect(Toys.reacher('q', { default: 'defaultValue' })(obj)).to.equal('defaultValue');
        });

        it('allows a falsey value to be used as the default value.', () => {

            expect(Toys.reacher('q', { default: '' })(obj)).to.equal('');
        });

        it('is reusable.', () => {

            const reacher = Toys.reacher('a.b.c.d');
            const anotherObj = { a: { b: { c: { d: 'x' } } } };

            expect(reacher(obj)).to.equal(1);
            expect(reacher(anotherObj)).to.equal('x');
        });

        it('works as an instance method.', () => {

            const toys = new Toys();

            expect(toys.reacher('a/b/c/d', '/')(obj)).to.equal(1);
        });
    });

    describe('transformer()', () => {

        const source = {
            address: {
                one: '123 main street',
                two: 'PO Box 1234'
            },
            zip: {
                code: 3321232,
                province: null
            },
            title: 'Warehouse',
            state: 'CA'
        };

        const sourcesArray = [{
            address: {
                one: '123 main street',
                two: 'PO Box 1234'
            },
            zip: {
                code: 3321232,
                province: null
            },
            title: 'Warehouse',
            state: 'CA'
        }, {
            address: {
                one: '456 market street',
                two: 'PO Box 5678'
            },
            zip: {
                code: 9876,
                province: null
            },
            title: 'Garage',
            state: 'NY'
        }];

        it('transforms an object based on the input object.', () => {

            const transform = Toys.transformer({
                'person.address.lineOne': 'address.one',
                'person.address.lineTwo': 'address.two',
                'title': 'title',
                'person.address.region': 'state',
                'person.address.zip': 'zip.code',
                'person.address.location': 'zip.province'
            });

            expect(transform(source)).to.equal({
                person: {
                    address: {
                        lineOne: '123 main street',
                        lineTwo: 'PO Box 1234',
                        region: 'CA',
                        zip: 3321232,
                        location: null
                    }
                },
                title: 'Warehouse'
            });
        });

        it('transforms an array of objects based on the input object.', () => {

            const transform = Toys.transformer({
                'person.address.lineOne': 'address.one',
                'person.address.lineTwo': 'address.two',
                'title': 'title',
                'person.address.region': 'state',
                'person.address.zip': 'zip.code',
                'person.address.location': 'zip.province'
            });

            expect(transform(sourcesArray)).to.equal([
                {
                    person: {
                        address: {
                            lineOne: '123 main street',
                            lineTwo: 'PO Box 1234',
                            region: 'CA',
                            zip: 3321232,
                            location: null
                        }
                    },
                    title: 'Warehouse'
                },
                {
                    person: {
                        address: {
                            lineOne: '456 market street',
                            lineTwo: 'PO Box 5678',
                            region: 'NY',
                            zip: 9876,
                            location: null
                        }
                    },
                    title: 'Garage'
                }
            ]);
        });
        it('uses the reach options passed into it', () => {

            const schema = {
                'person-address-lineOne': 'address-one',
                'person-address-lineTwo': 'address-two',
                'title': 'title',
                'person-address-region': 'state',
                'person-prefix': 'person-title',
                'person-zip': 'zip-code'
            };
            const options = {
                separator: '-',
                default: 'unknown'
            };
            const transform = Toys.transformer(schema, options);

            expect(transform(source)).to.equal({
                person: {
                    address: {
                        lineOne: '123 main street',
                        lineTwo: 'PO Box 1234',
                        region: 'CA'
                    },
                    prefix: 'unknown',
                    zip: 3321232
                },
                title: 'Warehouse'
            });
        });

        it('uses a default separator for keys if options does not specify on', () => {

            const schema = {
                'person.address.lineOne': 'address.one',
                'person.address.lineTwo': 'address.two',
                'title': 'title',
                'person.address.region': 'state',
                'person.prefix': 'person.title',
                'person.zip': 'zip.code'
            };
            const options = {
                default: 'unknown'
            };
            const transform = Toys.transformer(schema, options);

            expect(transform(source)).to.equal({
                person: {
                    address: {
                        lineOne: '123 main street',
                        lineTwo: 'PO Box 1234',
                        region: 'CA'
                    },
                    prefix: 'unknown',
                    zip: 3321232
                },
                title: 'Warehouse'
            });
        });

        it('works to create shallow objects.', () => {

            const transform = Toys.transformer({
                lineOne: 'address.one',
                lineTwo: 'address.two',
                title: 'title',
                region: 'state',
                province: 'zip.province'
            });

            expect(transform(source)).to.equal({
                lineOne: '123 main street',
                lineTwo: 'PO Box 1234',
                title: 'Warehouse',
                region: 'CA',
                province: null
            });
        });

        it('only allows strings in the map.', () => {

            expect(() => {

                Toys.transformer({
                    lineOne: {}
                });
            }).to.throw('All mappings must be strings');
        });

        it('throws an error on invalid arguments.', () => {

            expect(() => {

                Toys.transformer({})(NaN);
            }).to.throw('Invalid source object: must be null, undefined, an object, or an array');
        });

        it('is safe to pass null.', () => {

            const transform = Toys.transformer({});
            expect(transform(null)).to.equal({});
        });

        it('is safe to pass undefined.', () => {

            const transform = Toys.transformer({});
            expect(transform(undefined)).to.equal({});
        });

        it('is reusable.', () => {

            const transform = Toys.transformer({
                lineOne: 'address.one',
                lineTwo: 'address.two',
                title: 'title',
                region: 'state',
                province: 'zip.province'
            });

            expect(transform(sourcesArray[0])).to.equal({
                lineOne: '123 main street',
                lineTwo: 'PO Box 1234',
                title: 'Warehouse',
                region: 'CA',
                province: null
            });

            expect(transform(sourcesArray[1])).to.equal({
                lineOne: '456 market street',
                lineTwo: 'PO Box 5678',
                title: 'Garage',
                region: 'NY',
                province: null
            });
        });

        it('works as an instance method.', () => {

            const toys = new Toys();
            const transform = toys.transformer({
                lineOne: 'address.one',
                lineTwo: 'address.two',
                title: 'title',
                region: 'state',
                province: 'zip.province'
            });

            expect(transform(source)).to.equal({
                lineOne: '123 main street',
                lineTwo: 'PO Box 1234',
                title: 'Warehouse',
                region: 'CA',
                province: null
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

        it('works as an instance method.', async () => {

            const server = Hapi.server();
            const toys = new Toys(server);

            toys.auth.strategy('test-auth', (request, h) => {

                return h.authenticated({ credentials: { user: 'bill' } });
            });

            server.route([
                {
                    method: 'get',
                    path: '/',
                    config: {
                        auth: 'test-auth',
                        handler: (request) => request.auth.credentials
                    }
                }
            ]);

            const res = await server.inject('/');

            expect(res.result).to.equal({ user: 'bill' });
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

            it('works as an instance method.', () => {

                const fn = function () {};
                const opts = { before: 'loveboat' };
                const toys = new Toys();
                const extension = toys[ext](fn, opts);

                const keys = isExt ? ['method', 'options'] : ['type', 'method', 'options'];

                expect(Object.keys(extension)).to.only.contain(keys);
                isExt || expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);
                expect(extension.options).to.shallow.equal(opts);
            });
        });
    });
});
