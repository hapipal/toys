interface server {
    [key: string]: any
};

interface RouteConfig {

    method: string
    path: string
    handler: any
    options: {
        [key: string]: any
    }
}

interface WithRouteConfig {

    method: string
    options: {
        [key: string]: any
    }
}

interface Handler {
    (request: any, h?: any): any
}

interface PreRequestHandlers {
    [key: string]: Handler
}

interface PreRequestConfig {
    assign: string
    method: Handler
}

interface ExtConfig {
    (method: Handler, options: any): {
        method: Handler
        options: any
    }
}

interface ExtTypeConfig {
    (method: Handler, options: any): {
        method: Handler
        options: any
        type: string
    }
}

interface ToysInterface {

    withRouteDefaults: {
        (config: WithRouteConfig): {
            (routes: RouteConfig[]): RouteConfig[]
        }
    }

    pre: {
        (prereqs: PreRequestHandlers[]): PreRequestConfig[]
    }

    ext: ExtConfig
    onRequest: ExtTypeConfig
    onPreAuth: ExtTypeConfig
    onPostAuth: ExtTypeConfig
    onCredentials: ExtTypeConfig
    onPreHandler: ExtTypeConfig
    onPostHandler: ExtTypeConfig
    onPreResponse: ExtTypeConfig
    onPreStart: ExtTypeConfig
    onPostStart: ExtTypeConfig
    onPreStop: ExtTypeConfig
    onPostStop: ExtTypeConfig

    reacher: {
        (chain: string, options: any): {
            (request: any): any
        }
    }

    transformer: {
        (transform: string): any
    }

    auth: {

        strategy: {
            (name: string, authenticate: Handler): any
            (server: any, name: string, authenticate: Handler): any
        }
    }

    noop: any

    event: {
        (emitter: any, name: string, options?: any): any
    }

    stream: {
        (stream: any): any
    }

    options: {
        (obj: any): any
    }

    header: {
        (response: any, name: string, value: any, options?: any): any
    }

    getHeaders: {
        (response: any): any
    }

    code: {
        (response: any, statusCode: number): any
    }

    getCode: {
        (response: any): any
    }

    realm: {
        (obj: any): any
        (): any
    }

    rootRealm: {
        (realm: any, pluginName: string): any
        (pluginName: string): any
    }

    state: {
        (realm: any, pluginName: string): any
        (pluginName: string): any
    }

    rootState: {
        (realm: any, pluginName: string): any
        (pluginName: string): any
    }

    forEachAncestorRealm: {
        (realm: any, fn: any): any
        (fn: any): any
    }

}

export default class Toys implements ToysInterface {

}