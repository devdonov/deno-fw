import { ServerRequest, listenAndServe } from "https://deno.land/std@0.50.0/http/server.ts";
import { match, Match, MatchFunction } from 'https://deno.land/x/path_to_regexp/mod.ts';

export { Request, Handler, MiddlewareHandler }

type Request = ServerRequest;

type Handler = {
  (request: ServerRequest, next?: Function): void;
}
type MiddlewareHandler = {
  (request: ServerRequest, next: Function): void;
}
type HTTPMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
interface App {
  listen(options: Deno.ListenOptions): Promise<void>;
  get(path: string, handler: Handler): App;
  post(path: string, handler: Handler): App;
  put(path: string, handler: Handler): App;
  delete(path: string, handler: Handler): App;
  patch(path: string, handler: Handler): App;
  use(handler: MiddlewareHandler): App;
}
interface Route {
  path: string;
  handler: Handler | MiddlewareHandler;
  match: MatchFunction;
}
type RouteMap = {
  [K in HTTPMethods]: Route[];
}

function notFoundHandler(request: ServerRequest) {
  request.respond({ body: "Not found", status: 404 })    
}

function errorHandler(error: Error, request: ServerRequest) {
  request.respond({ body: "Server error", status: 500 })
}

export default (): App => {
  const routes: RouteMap = {
    GET: [],
    POST: [],
    PUT: [],
    PATCH: [],
    DELETE: []
  };
  const middleware: Route[] = [];

  function routeHelper(method: HTTPMethods, path: string, handler: Handler) {
    routes[method] = routes[method] || [];
    routes[method].push({ path, handler, match: match(path) });
  }
  function handleRequest(request: ServerRequest) {
    console.log(request.url, request.method);
    const stack = [...middleware, ...routes[request.method as HTTPMethods]]

    function next(error?: Error) {
      const route = stack.shift();
      
      // if (!!error) {
      //   errorHandler(error, request);
      //   return;
      // }

      if (!route) {
        return notFoundHandler(request)
      }

      route.handler(request, next);
    }

    next();
  }
  function use(fn: MiddlewareHandler): App;
  function use(path: string, fn: MiddlewareHandler): App;
  function use(
    this: App,
    arg1: string | MiddlewareHandler,
    arg2?: MiddlewareHandler
  ) {
    const { path, handler } = arg2 === undefined ?
      { path: "/", handler: arg1 as MiddlewareHandler } : 
      { path: arg1 as string, handler: arg2 as MiddlewareHandler };
    middleware.push({ match: match(path), handler, path})
    return this;
  }

  return {
    use,
    listen(options) {
      return listenAndServe(options, handleRequest)
    },
    get(path, handler) {
      routeHelper("GET", path, handler);
      return this;
    },
    post(path, handler) {
      routeHelper("POST", path, handler);
      return this;
    },
    put(path, handler) {
      routeHelper("PUT", path, handler);
      return this;
    },
    delete(path, handler) {
      routeHelper("DELETE", path, handler);
      return this;
    },
    patch(path, handler) {
      routeHelper("PATCH", path, handler);
      return this;
    }
  }
}
