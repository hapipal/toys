'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');


const { before, describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('import()', () => {

    let Toys;

    before(async () => {

        Toys = await import('../lib/index.js');
    });

    it('exposes all methods and classes as named imports', () => {

        expect(Object.keys(Toys)).to.equal([
            'asyncStorage',
            'asyncStorageInternals',
            'auth',
            'code',
            'default',
            'ext',
            'forEachAncestorRealm',
            'getCode',
            'getHeaders',
            'header',
            'noop',
            'onCredentials',
            'onPostAuth',
            'onPostHandler',
            'onPostStart',
            'onPostStop',
            'onPreAuth',
            'onPreHandler',
            'onPreResponse',
            'onPreStart',
            'onPreStop',
            'onRequest',
            'options',
            'patchJoiSchema',
            'pre',
            'realm',
            'rootRealm',
            'rootState',
            'state',
            'withAsyncStorage',
            'withRouteDefaults'
        ]);
    });
});
