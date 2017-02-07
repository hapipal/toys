'use strict';

// Load modules

const Lab = require('lab');
const Code = require('code');
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
            expect(withDefaults(obj)).to.equal(withDefaults(obj));
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
    });

    describe('transformer()', () => {

    });
    describe('promisify()', () => {

    });
    describe('onRequest()', () => {

    });
    describe('onPreAuth()', () => {

    });
    describe('onPostAuth()', () => {

    });
    describe('onPreHandler()', () => {

    });
    describe('onPostHandler()', () => {

    });
    describe('onPreResponse()', () => {

    });
});
