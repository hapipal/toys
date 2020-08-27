'use strict';

// Load modules

const EventEmitter = require('events');
const Stream = require('stream');
const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
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
                },
                '-2': true
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

        it('returns object property with negative index for non-array.', () => {

            expect(Toys.reacher('a.-2')(obj)).to.be.equal(true);
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

    describe('async event()', () => {

        it('waits for an event to be emitted.', async () => {

            const emitter = new EventEmitter();

            let emitted = false;

            emitter.once('my-event', () => {

                emitted = true;
            });

            setTimeout(() => emitter.emit('my-event', 'value'));

            const myEvent = Toys.event(emitter, 'my-event');

            expect(emitted).to.equal(false);
            expect(emitter.listenerCount('my-event')).to.equal(2);
            expect(emitter.listenerCount('error')).to.equal(1);

            const value = await myEvent;

            expect(value).to.equal('value');
            expect(emitted).to.equal(true);
            expect(emitter.listenerCount('my-event')).to.equal(0);
            expect(emitter.listenerCount('error')).to.equal(0);
        });

        it('waits for an event to be emitted with multiple: true.', async () => {

            const emitter = new EventEmitter();

            let emitted = false;

            emitter.once('my-event', () => {

                emitted = true;
            });

            setTimeout(() => emitter.emit('my-event', 'value1', 'value2'));

            const myEvent = Toys.event(emitter, 'my-event', { multiple: true });

            expect(emitted).to.equal(false);
            expect(emitter.listenerCount('my-event')).to.equal(2);
            expect(emitter.listenerCount('error')).to.equal(1);

            const values = await myEvent;

            expect(values).to.equal(['value1', 'value2']);
            expect(emitted).to.equal(true);
            expect(emitter.listenerCount('my-event')).to.equal(0);
            expect(emitter.listenerCount('error')).to.equal(0);
        });

        it('throws if an error event is emitted.', async () => {

            const emitter = new EventEmitter();

            let emitted = false;

            emitter.once('error', () => {

                emitted = true;
            });

            setTimeout(() => emitter.emit('error', new Error('Oops!')));

            const myEvent = Toys.event(emitter, 'my-event');

            expect(emitted).to.equal(false);
            expect(emitter.listenerCount('my-event')).to.equal(1);
            expect(emitter.listenerCount('error')).to.equal(2);

            await expect(myEvent).to.reject('Oops!');

            expect(emitted).to.equal(true);
            expect(emitter.listenerCount('my-event')).to.equal(0);
            expect(emitter.listenerCount('error')).to.equal(0);
        });

        it('does not throw when an error is emitted when error: false.', async () => {

            const emitter = new EventEmitter();

            let emitted = false;

            emitter.once('error', () => {

                emitted = true;
            });

            setTimeout(() => {

                emitter.emit('error', new Error('Oops!'));
                emitter.emit('my-event', 'value');
            });

            const myEvent = Toys.event(emitter, 'my-event', { error: false });

            expect(emitted).to.equal(false);
            expect(emitter.listenerCount('my-event')).to.equal(1);
            expect(emitter.listenerCount('error')).to.equal(1);

            const value = await myEvent;

            expect(value).to.equal('value');
            expect(emitted).to.equal(true);
            expect(emitter.listenerCount('my-event')).to.equal(0);
            expect(emitter.listenerCount('error')).to.equal(0);
        });
    });

    describe('async stream()', () => {

        it('waits for a readable stream to end.', async () => {

            let i = 0;

            const counter = new Stream.Readable({
                read() {

                    if (i >= 10) {
                        return this.push(null);
                    }

                    const count = `${i++}`;
                    process.nextTick(() => this.push(count));
                }
            });

            let ended = false;
            counter.once('end', () => {

                ended = true;
            });

            const data = [];
            counter.on('data', (count) => data.push(count.toString()));

            expect(ended).to.equal(false);
            expect(data).to.equal([]);

            const value = await Toys.stream(counter);

            expect(value).to.not.exist();
            expect(ended).to.equal(true);
            expect(data).to.equal(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
        });

        it('waits for a writable stream to finish.', async () => {

            const data = [];

            const toArray = new Stream.Writable({
                write(chunk, encoding, cb) {

                    process.nextTick(() => {

                        data.push(chunk.toString());

                        return cb();
                    });
                }
            });

            let finished = false;
            toArray.once('finish', () => {

                finished = true;
            });

            for (let i = 0; i < 10; ++i) {
                toArray.write(`${i}`);
            }

            process.nextTick(() => toArray.end());

            expect(finished).to.equal(false);
            expect(data).to.equal([]);

            const value = await Toys.stream(toArray);

            expect(value).to.not.exist();
            expect(finished).to.equal(true);
            expect(data).to.equal(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
        });

        it('waits for a duplex stream to end and finish.', async () => {

            let i = 0;
            const data = [];

            const countToArray = new Stream.Duplex({
                read() {

                    if (i >= 10) {
                        return this.push(null);
                    }

                    const count = `${i++}`;
                    process.nextTick(() => this.push(count));
                },
                write(chunk, encoding, cb) {

                    process.nextTick(() => {

                        data.push(chunk.toString());

                        return cb();
                    });
                }
            });

            let ended = false;
            countToArray.once('end', () => {

                ended = true;
            });

            let finished = false;
            countToArray.once('finish', () => {

                finished = true;
            });

            countToArray.pipe(countToArray);

            expect(ended).to.equal(false);
            expect(finished).to.equal(false);
            expect(data).to.equal([]);

            const value = await Toys.stream(countToArray);

            expect(value).to.not.exist();
            expect(ended).to.equal(true);
            expect(finished).to.equal(true);
            expect(data).to.equal(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
        });

        it('throws on a stream error.', async () => {

            let i = 0;

            const counter = new Stream.Readable({
                read() {

                    if (i >= 5) {
                        return process.nextTick(() => this.emit('error', new Error('Oops!')));
                    }

                    const count = `${i++}`;
                    process.nextTick(() => this.push(count));
                }
            });

            let ended = false;
            counter.once('end', () => {

                ended = true;
            });

            const data = [];
            counter.on('data', (count) => data.push(count.toString()));

            expect(ended).to.equal(false);
            expect(data).to.equal([]);

            await expect(Toys.stream(counter)).to.reject('Oops!');

            expect(ended).to.equal(false);
            expect(data).to.equal(['0', '1', '2', '3', '4']);
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
});
