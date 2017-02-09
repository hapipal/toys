'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
const Pinkie = require('pinkie');
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

        it('throws when target is null.', (done) => {

            expect(() => {

                Toys.withDefaults(null)({});
            }).to.throw('Invalid defaults value: must be an object');
            done();
        });

        it('returns null if options is false.', (done) => {

            const result = Toys.withDefaults(defaults)(false);
            expect(result).to.equal(null);
            done();
        });

        it('returns null if options is null.', (done) => {

            const result = Toys.withDefaults(defaults)(null);
            expect(result).to.equal(null);
            done();
        });

        it('returns null if options is undefined.', (done) => {

            const result = Toys.withDefaults(defaults)(undefined);
            expect(result).to.equal(null);
            done();
        });

        it('returns a copy of defaults if options is true.', (done) => {

            const result = Toys.withDefaults(defaults)(true);
            expect(result).to.equal(defaults);
            done();
        });

        it('applies object to defaults.', (done) => {

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
            done();
        });

        it('maps array objects over defaults.', (done) => {

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

            done();
        });

        it('applies object to defaults multiple times.', (done) => {

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
            done();
        });

        it('applies object to defaults with null.', (done) => {

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
            done();
        });

        it('works as an instance method.', (done) => {

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
            done();
        });
    });

    describe('handler()', () => {

    });
    describe('pre()', () => {

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

        it('returns object itself.', (done) => {

            expect(Toys.reacher(null)(obj)).to.shallow.equal(obj);
            expect(Toys.reacher(false)(obj)).to.shallow.equal(obj);
            expect(Toys.reacher()(obj)).to.shallow.equal(obj);
            done();
        });

        it('returns first value of array.', (done) => {

            expect(Toys.reacher('k.0')(obj)).to.equal(4);
            done();
        });

        it('returns last value of array using negative index.', (done) => {

            expect(Toys.reacher('k.-2')(obj)).to.equal(9);
            done();
        });

        it('returns a valid member.', (done) => {

            expect(Toys.reacher('a.b.c.d')(obj)).to.equal(1);
            done();
        });

        it('returns a valid member with separator override.', (done) => {

            expect(Toys.reacher('a/b/c/d', '/')(obj)).to.equal(1);
            done();
        });

        it('returns undefined on null object.', (done) => {

            expect(Toys.reacher('a.b.c.d')(null)).to.equal(undefined);
            done();
        });

        it('returns undefined on missing object member.', (done) => {

            expect(Toys.reacher('a.b.c.d.x')(obj)).to.equal(undefined);
            done();
        });

        it('returns undefined on missing function member.', (done) => {

            expect(Toys.reacher('i.y', { functions: true })(obj)).to.equal(undefined);
            done();
        });

        it('throws on missing member in strict mode.', (done) => {

            expect(() => {

                Toys.reacher('a.b.c.o.x', { strict: true })(obj);
            }).to.throw('Missing segment o in reach path a.b.c.o.x');

            done();
        });

        it('returns undefined on invalid member.', (done) => {

            expect(Toys.reacher('a.b.c.d-.x')(obj)).to.equal(undefined);
            done();
        });

        it('returns function member.', (done) => {

            expect(typeof Toys.reacher('i')(obj)).to.equal('function');
            done();
        });

        it('returns function property.', (done) => {

            expect(Toys.reacher('i.x')(obj)).to.equal(5);
            done();
        });

        it('returns null.', (done) => {

            expect(Toys.reacher('j')(obj)).to.equal(null);
            done();
        });

        it('throws on function property when functions not allowed.', (done) => {

            expect(() => {

                Toys.reacher('i.x', { functions: false })(obj);
            }).to.throw('Invalid segment x in reach path i.x');

            done();
        });

        it('will return a default value if property is not found.', (done) => {

            expect(Toys.reacher('a.b.q', { default: 'defaultValue' })(obj)).to.equal('defaultValue');
            done();
        });

        it('will return a default value if path is not found.', (done) => {

            expect(Toys.reacher('q', { default: 'defaultValue' })(obj)).to.equal('defaultValue');
            done();
        });

        it('allows a falsey value to be used as the default value.', (done) => {

            expect(Toys.reacher('q', { default: '' })(obj)).to.equal('');
            done();
        });

        it('is reusable.', (done) => {

            const reacher = Toys.reacher('a.b.c.d');
            const anotherObj = { a: { b: { c: { d: 'x' } } } };

            expect(reacher(obj)).to.equal(1);
            expect(reacher(anotherObj)).to.equal('x');
            done();
        });

        it('works as an instance method.', (done) => {

            const toys = new Toys();

            expect(toys.reacher('a/b/c/d', '/')(obj)).to.equal(1);
            done();
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

        it('transforms an object based on the input object.', (done) => {

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

            done();
        });

        it('transforms an array of objects based on the input object.', (done) => {

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

            done();
        });

        it('uses the reach options passed into it', (done) => {

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

            done();
        });

        it('uses a default separator for keys if options does not specify on', (done) => {

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

            done();
        });

        it('works to create shallow objects.', (done) => {

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

            done();
        });

        it('only allows strings in the map.', (done) => {

            expect(() => {

                Toys.transformer({
                    lineOne: {}
                });
            }).to.throw('All mappings must be strings');

            done();
        });

        it('throws an error on invalid arguments.', (done) => {

            expect(() => {

                Toys.transformer({})(NaN);
            }).to.throw('Invalid source object: must be null, undefined, an object, or an array');

            done();
        });

        it('is safe to pass null.', (done) => {

            const transform = Toys.transformer({});
            expect(transform(null)).to.equal({});

            done();
        });

        it('is safe to pass undefined.', (done) => {

            const transform = Toys.transformer({});
            expect(transform(undefined)).to.equal({});

            done();
        });

        it('is reusable.', (done) => {

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

            done();
        });

        it('works as an instance method.', (done) => {

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

            done();
        });
    });

    describe('promisify()', () => {

        const fn = (value, cb) => {

            if (value instanceof Error) {
                return cb(value);
            }

            return cb(null, value, 'plus', 'extras');
        };

        it('promisifies a function, ignoring additional callback arguments.', () => {

            const pifiedFn = Toys.promisify(fn);

            return pifiedFn('24carat').then((value) => {

                expect(value).to.equal('24carat');

                return pifiedFn(new Error('0carat'));
            })
            .catch((err) => {

                expect(err).to.be.instanceof(Error);
                expect(err.message).to.equal('0carat');
            });
        });

        it('promisifies a function with specified promise implementation.', () => {

            const pifiedFn = Toys.promisify(Pinkie, fn);
            const promise = pifiedFn('24carat');

            expect(promise).to.be.instanceof(Pinkie);

            return promise.then((value) => {

                expect(value).to.equal('24carat');
            });
        });

        it('works as an instance method without custom promise implementation.', () => {

            const toys = new Toys();
            const pifiedFn = toys.promisify(fn);
            const promise = pifiedFn('24carat');

            expect(promise).to.be.instanceof(Promise);

            return promise.then((value) => {

                expect(value).to.equal('24carat');
            });
        });

        it('works as an instance method with custom promise implementation.', () => {

            const toys = new Toys(null, Pinkie);
            const pifiedFn = toys.promisify(fn);
            const promise = pifiedFn('24carat');

            expect(promise).to.be.instanceof(Pinkie);

            return promise.then((value) => {

                expect(value).to.equal('24carat');
            });
        });
    });

    // Test the request extension helpers

    [
        'onRequest',
        'onPreAuth',
        'onPostAuth',
        'onPreHandler',
        'onPostHandler',
        'onPreResponse'
    ].forEach((ext) => {

        describe(`${ext}()`, () => {

            it('creates a valid hapi request extension without options.', (done) => {

                const fn = function () {};
                const extension = Toys[ext](fn);

                expect(Object.keys(extension)).to.only.contain(['type', 'method']);
                expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);

                done();
            });

            it('creates a valid hapi request extension with options.', (done) => {

                const fn = function () {};
                const opts = { before: 'loveboat' };
                const extension = Toys[ext](fn, opts);

                expect(Object.keys(extension)).to.only.contain(['type', 'method', 'options']);
                expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);
                expect(extension.options).to.shallow.equal(opts);

                done();
            });

            it('works as an instance method.', (done) => {

                const fn = function () {};
                const opts = { before: 'loveboat' };
                const toys = new Toys();
                const extension = toys[ext](fn, opts);

                expect(Object.keys(extension)).to.only.contain(['type', 'method', 'options']);
                expect(extension.type).to.equal(ext);
                expect(extension.method).to.shallow.equal(fn);
                expect(extension.options).to.shallow.equal(opts);

                done();
            });
        });
    });
});
