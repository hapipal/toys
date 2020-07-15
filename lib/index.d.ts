// Type definitions for Toys
// Project: <https://github.com/hapipal/toys>
// Definitions by:
// * Gerson Gallo <https://github.com/ggallovalle>
/*~ This is the module template file for class modules.
 *~ https://www.staging-typescript.org/docs/handbook/declaration-files/templates/module-class-d-ts.html
 */

import {
  Server,
  ServerRoute,
  RouteOptionsPreArray,
  Request,
  ResponseToolkit,
  RouteExtObject,
  ServerExtOptions,
  RequestRoute,
  ServerRealm,
  ResponseObject,
  ResponseObjectHeaderOptions,
} from "@hapi/hapi";
import Hoek from "@hapi/hoek";
import * as stream from "stream";
import { Boom } from "@hapi/boom";
import { ChildProcess } from "child_process";

export = Toys;

/*~ Write your module's methods and properties in this class */
declare class Toys<Serv = Server> {
  constructor(server: Serv);

  /**
   * Returns a function with signature function(route) that will apply defaults as defaults to the route route configuration object. It will shallow-merge any route validate and bind options to avoid inadvertently applying defaults to a Joi schema or other unfamiliar object. If route is an array of routes, it will apply the defaults to each route in the array.
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toyswithroutedefaultsdefaults}
   */
  static withRouteDefaults: Toys.WithRouteDefaults;

  /**
   * The same as static withRouteDefaults
   */
  withRouteDefaults: Toys.WithRouteDefaults;

  /** Returns Hapi prerequisite configuration
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toyspreprereqs}
   */
  static pre: Toys.Pre;

  /**
   * The same as static pre
   */
  pre: Toys.Pre;

  /**
   * This is intended to be used with the route ext config
   * @see {@link https://github.com/hapijs/hapi/blob/master/API.md#-routeoptionsext}
   */
  static ext: Toys.EXTENSION;

  /**
   * The same as static ext
   */
  ext: Toys.EXTENSION;

  static onRequest: Toys.EXTENSION;

  onRequest: Toys.EXTENSION;

  static onPreAuth: Toys.EXTENSION;

  onPreAuth: Toys.EXTENSION;

  static onCredentials: Toys.EXTENSION;

  onCredentials: Toys.EXTENSION;

  static onPostAuth: Toys.EXTENSION;

  onPostAuth: Toys.EXTENSION;

  static onPreHandler: Toys.EXTENSION;

  onPreHandler: Toys.EXTENSION;

  static onPostHandler: Toys.EXTENSION;

  onPostHandler: Toys.EXTENSION;

  static onPreResponse: Toys.EXTENSION;

  onPreResponse: Toys.EXTENSION;

  static onPreStart: Toys.EXTENSION;

  onPreStart: Toys.EXTENSION;

  static onPostStart: Toys.EXTENSION;

  onPostStart: Toys.EXTENSION;

  static onPreStop: Toys.EXTENSION;

  onPreStop: Toys.EXTENSION;

  static onPostStop: Toys.EXTENSION;

  onPostStop: Toys.EXTENSION;
  /**
   * Returns a function function(obj) that will return Hoek.reach(obj, chain, options)
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toysreacherchain-options}
   */
  static reacher: Toys.Reacher;

  /**
   * The same as static reacher
   */
  reacher: Toys.Reacher;

  /**
   * Returns a function function(obj) that will return Hoek.reach(obj, chain, options) transformed
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toystransformertransform-options}
   */
  static transformer: Toys.Transformer;

  /**
   * The same as static transformer
   */
  transformer: Toys.Transformer;

  /**
   * Adds an auth scheme and strategy with name name to server. Its implementation is given by authenticate as described in server.auth.scheme(). This is intended to make it simple to create a barebones auth strategy without having to create a reusable auth scheme; it is often useful for testing and simple auth implementations.
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toysauthstrategyserver-name-authenticate}
   */
  static auth: { strategy: Toys.AuthStrategy };

  /**
   * The same as static auth.strategy but you dont have to specify the server
   */
  auth: { strategy: Toys.AuthStrategyInstance };

  /**
   * This is a plugin named toys-noop that does nothing and can be registered multiple times. This can be useful when conditionally registering a plugin in a list or glue manifest.
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#toysnoop}
   */
  static noop: Toys.Noop;

  /**
   * sames as static noop
   */
  noop: Toys.Noop;

  /**
   * Waits for emitter to emit an event named eventName and returns the first value passed to the event's listener. When options.multiple is true it instead returns an array of all values passed to the listener. Throws if an event named 'error' is emitted unless options.error is false. This can be useful when waiting for an event in a handler, extension, or server method, which all require an async function when returning a value asynchronously.
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#await-toyseventemitter-eventname-options}
   */
  static event: Toys.Event;

  /**
   * same as static event
   */
  event: Toys.Event;

  /**
   * Waits for a readable stream to end, a writable stream to finish, or a duplex stream to both end and finish. Throws an error if stream emits an 'error' event. This can be useful when waiting for a stream to process in a handler, extension, or server method, which all require an async function when returning a value asynchronously.
   * @see {@link https://github.com/hapipal/toys/blob/master/API.md#await-toysstreamstream}
   */
  static stream: Toys.Stream;

  /**
   * same as static stream
   */
  stream: Toys.Stream;

  /**
   * Return server realm from obj
   */
  static realm(obj: Toys.Realm): ServerRealm;

  /**
   * Return realm from this.server
   */
  realm: ServerRealm;

  /**
   * Return realm.pluginOptions from object
   */
  static options(obj: Toys.Realm): object;

  /**
   * Return realm.pluginOptions from this.server
   */
  options: object;

  /**
   * Sets an HTTP header where.
   * - name: the header name.
   * - value: the header value
   */
  static header: Toys.Header;

  /**
   * sames as static header
   */
  header: Toys.Header;

  /**
   * Get all headers
   */
  static getHeaders(response: Boom | ResponseObject): ResponseObject;

  /**
   *  Sets the HTTP status code
   */
  static code(response: Boom | ResponseObject): ResponseObject;

  /**
   * same as static code
   */
  code(response: Boom | ResponseObject): ResponseObject;

  /**
   * Return curren HTTP status code
   */
  getCode(response: Boom | ResponseObject): number;

  /**
   * Given a realm this method follows the realm.parent chain and returns the topmost realm, known as the "root realm." When used as an instance, returns toys.server.realm's root realm.
   */
  static rootRealm(realm: ServerRealm): ServerRealm;

  /**
   * Returns this.server realm
   */
  rootRealm: ServerRealm;

  /**
   * Returns the plugin state for pluginName within realm (realm.plugins[pluginName]), and initializes it to an empty object if it is not already set.
   */
  static state(realm: ServerRealm, name: string): any;

  /**
   * Returns the plugin state within toys.server.realm.
   */
  state: any;

  /**
   * Walks up the realm.parent chain and calls fn(realm) for each realm, starting with the passed realm. 
   */
  static forEachAncestorRealm(fn: object): void

  /**
   * This method starts with toys.server.realm, walks up the realm.parent chain and calls fn(realm) for each realm, starting with the passed realm. 
   */
  forEachAncestorRealm(fn: object): void
}

/*~ If you want to expose types from your module as well, you can
 *~ place them in this block.
 *~
 *~ Note that if you decide to include this namespace, the module can be
 *~ incorrectly imported as a namespace object, unless
 *~ --esModuleInterop is turned on:
 *~   import * as x from '[~THE MODULE~]'; // WRONG! DO NOT DO THIS!
 */
declare namespace Toys {
  export type PrereqSets =
    | Lifecycle.Method
    | (Lifecycle.Method | Dictionary<Lifecycle.Method>)[];

  export type AuthStrategy = <Serv = Server>(
    server: Serv,
    name: string,
    strategy: (request: Request, h: ResponseToolkit) => Lifecycle.ReturnValue
  ) => void;

  export type AuthStrategyInstance = (
    name: string,
    strategy: (request: Request, h: ResponseToolkit) => Lifecycle.ReturnValue
  ) => void;

  export type EXTENSION = (
    method: Lifecycle.Method,
    options?: ServerExtOptions
  ) => RouteExtObject;

  export type Reacher = (
    chain: string,
    options: Hoek.reach.Options
  ) => (obj: object) => object;

  export type Transformer = (
    transform: Dictionary<string>,
    options: Hoek.reach.Options
  ) => (obj: object) => object;

  export type Pre = (prereqSets: Toys.PrereqSets) => RouteOptionsPreArray;

  export type WithRouteDefaults = (
    defaults: ServerRoute
  ) => ServerRoute | ServerRoute[];

  export type Noop = { name: string; multiple: boolean; register: void };

  export type Event = (
    emitter: ChildProcess,
    eventName: string,
    /**
     * error @default true
     * multiple @default false
     */
    options?: { error?: boolean; multiple?: boolean }
  ) => Promise;

  export type Stream = (stream: any) => Promise;

  export type Realm =
    | RequestRoute
    | ResponseToolkit
    | Server
    | Request
    | ServerRealm;

  export type Header = (
    response: Boom | ResponseObject,
    name: string,
    value: string,
    options: ResponseObjectHeaderOptions
  ) => ResponseObject;
}

declare namespace Lifecycle {
  /**
   * Lifecycle methods are the interface between the framework and the application. Many of the request lifecycle steps:
   * extensions, authentication, handlers, pre-handler methods, and failAction function values are lifecyle methods
   * provided by the developer and executed by the framework.
   * Each lifecycle method is a function with the signature await function(request, h, [err]) where:
   * * request - the request object.
   * * h - the response toolkit the handler must call to set a response and return control back to the framework.
   * * err - an error object availble only when the method is used as a failAction value.
   */
  type Method = (
    request: Request,
    h: ResponseToolkit,
    err?: Error
  ) => ReturnValue;

  /**
   * Each lifecycle method must return a value or a promise that resolves into a value. If a lifecycle method returns
   * without a value or resolves to an undefined value, an Internal Server Error (500) error response is sent.
   * The return value must be one of:
   * - Plain value: null, string, number, boolean
   * - Buffer object
   * - Error object: plain Error OR a Boom object.
   * - Stream object
   * - any object or array
   * - a toolkit signal:
   * - a toolkit method response:
   * - a promise object that resolve to any of the above values
   * For more info please [See docs](https://github.com/hapijs/hapi/blob/master/API.md#lifecycle-methods)
   */
  type ReturnValue = ReturnValueTypes | Promise<ReturnValueTypes>;
  type ReturnValueTypes =
    | (null | string | number | boolean)
    | Buffer
    | (Error | Boom)
    | stream.Stream
    | (object | object[])
    | symbol
    | ResponseToolkit;

  /**
   * Various configuration options allows defining how errors are handled. For example, when invalid payload is received or malformed cookie, instead of returning an error, the framework can be
   * configured to perform another action. When supported the failAction option supports the following values:
   * * 'error' - return the error object as the response.
   * * 'log' - report the error but continue processing the request.
   * * 'ignore' - take no action and continue processing the request.
   * * a lifecycle method with the signature async function(request, h, err) where:
   * * * request - the request object.
   * * * h - the response toolkit.
   * * * err - the error object.
   * [See docs](https://github.com/hapijs/hapi/blob/master/API.md#-failaction-configuration)
   */
  type FailAction = "error" | "log" | "ignore" | Method;
}

interface Dictionary<T> {
  [key: string]: T;
}
