# toys

The hapi utility toy chest

[![Build Status](https://app.travis-ci.com/hapipal/toys.svg?branch=main)](https://app.travis-ci.com/hapipal/toys) [![Coverage Status](https://coveralls.io/repos/hapipal/toys/badge.svg?branch=main&service=github)](https://coveralls.io/github/hapipal/toys?branch=main)

Lead Maintainer - [Devin Ivy](https://github.com/devinivy)

## Installation
```sh
npm install @hapipal/toys
```

## Usage
> See also the [API Reference](API.md)
>
> Toys is intended for use with hapi v19+ and nodejs v12+ (_see v2 for lower support_).

Toys is a collection of utilities made to reduce common boilerplate in **hapi v19+** projects, aid usage of events and streams in `async` functions (e.g. handlers and server methods), and provide versions of widely-used utilities from [Hoek](https://github.com/hapijs/hoek) optimized to perform well in hot code paths such as route handlers.

Below is an example featuring [`Toys.auth.strategy()`](API.md#toysauthstrategyserver-name-authenticate), [`Toys.reacher()`](API.md#toysreacherchain-options), and [`Toys.withRouteDefaults()`](API.md#toyswithroutedefaultsdefaults).  The [API Reference](API.md) is also filled with examples.

```js
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Toys = require('@hapipal/toys');

(async () => {

    const server = Hapi.server();

    // Make a one-off auth strategy for testing
    Toys.auth.strategy(server, 'name-from-param', (request, h) => {

        // Yes, perhaps not the most secure
        const { username } = request.params;

        if (!username) {
            throw Boom.unauthorized(null, 'Custom');
        }

        return h.authenticated({ credentials: { user: { name: username } } });
    });

    // Make function to efficiently index into a request to grab an authed user's name
    const grabAuthedUsername = Toys.reacher('auth.credentials.user.name');

    // Default all route methods to "get", unless otherwise specified
    const defaultToGet = Toys.withRouteDefaults({ method: 'get' });

    server.route(
        defaultToGet([
            {
                method: 'post',
                path: '/',
                handler: (request) => {

                    return { posted: true };
                }
            },
            {   // Look ma, my method is defaulting to "get"!
                path: '/as/{username}',
                options: {
                    auth: 'name-from-param', // Here's our simple auth strategy
                    handler: (request) => {

                        // grabAuthedUsername() is designed to be quick
                        const username = grabAuthedUsername(request);

                        return { username };
                    }
                }
            }
        ])
    );

    await server.start();

    console.log(`Now, go forth and ${server.info.uri}/as/your-name`);
})();
```
