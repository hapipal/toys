# toys

The hapi utility toy chest

[![Build Status](https://travis-ci.org/devinivy/toys.svg?branch=master)](https://travis-ci.org/devinivy/toys) [![Coverage Status](https://coveralls.io/repos/devinivy/toys/badge.svg?branch=master&service=github)](https://coveralls.io/github/devinivy/toys?branch=master)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Usage
> See also the [API Reference](API.md)

Toys is a collection of utilities made to reduce common boilerplate in hapi projects, alleviate a few of hapi's quirks, and provide versions of widely-used utilities from [Hoek](https://github.com/hapijs/hoek) optimized to perform well in hot code paths such as route handlers.

Below is an example featuring [`Toys.auth.strategy()`](API.md#toysauthstrategyserver-name-authenticate), [`Toys.reacher()`](API.md#toysreacherchain-options), and [`Toys.withDefaults()`](API.md#toyswithdefaultsdefaults-isnulloverride).

```js
const Hapi = require('hapi');
const Boom = require('boom');
const Toys = require('toys');

const server = new Hapi.Server();
server.connection();

// Make a one-off auth strategy for testing
Toys.auth.strategy(server, 'name-from-param', (request, reply) => {

    // Yes, perhaps not the most secure
    const username = request.params.username;

    if (!username) {
        return reply(Boom.unauthorized(null, 'Custom'));
    }

    return reply.continue({ credentials: { user: { name: username } } });
});

// Make function to efficiently index into a request to grab an authed user's name
const grabAuthedUsername = Toys.reacher('auth.credentials.user.name');

// Default all route methods to "get", unless otherwise specified
const defaultToGet = Toys.withDefaults({ method: 'get' });

server.route(
    defaultToGet([
        {
            method: 'post',
            path: '/',
            handler: function (request, reply) {

                return reply({ posted: true });
            }
        },
        {   // Look ma, my method is defaulting to "get"!
            path: '/as/{username}',
            config: {
                auth: 'name-from-param', // Here's our simple auth strategy
                handler: function (request, reply) {

                    // grabAuthedUsername() is designed to be quick
                    const username = grabAuthedUsername(request);

                    return reply({ username });
                }
            }
        }
    ])
);

server.start((err) => {

    if (err) {
        throw err;
    }

    console.log(`Now, go forth and ${server.info.uri}/as/your-name`);
});
```
