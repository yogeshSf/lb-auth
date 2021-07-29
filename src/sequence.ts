import {inject} from '@loopback/core';
import {FindRoute, InvokeMethod, InvokeMiddleware, ParseParams, Reject, RequestContext, Send, SequenceActions, SequenceHandler} from '@loopback/rest';
import {AuthenticateFn, AuthenticationBindings} from 'loopback4-authentication';
import {AuthorizationBindings, AuthorizeFn} from 'loopback4-authorization';
import {AuthUser} from './models/auth-user.model';
import {ILogger, LOG_LEVEL} from './types';

export class MySequence implements SequenceHandler {

  @inject(SequenceActions.INVOKE_MIDDLEWARE, {optional: true})
  protected invokeMiddleware: InvokeMiddleware = () => false;

  constructor(
    @inject(SequenceActions.FIND_ROUTE) protected findRoute: FindRoute,
    @inject(SequenceActions.PARSE_PARAMS) protected parseParams: ParseParams,
    @inject(SequenceActions.INVOKE_METHOD) protected invoke: InvokeMethod,
    @inject(SequenceActions.SEND) public send: Send,
    @inject(SequenceActions.REJECT) public reject: Reject,
    @inject(AuthenticationBindings.USER_AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn<AuthUser>,
    @inject(AuthenticationBindings.CLIENT_AUTH_ACTION)
    protected authenticateRequestClient: AuthenticateFn<AuthUser>,
    @inject(AuthorizationBindings.AUTHORIZE_ACTION)
    protected checkAuthorisation: AuthorizeFn,
    @inject('logger') private logger: ILogger,
  ) {}

  async handle(context: RequestContext) {
    const requestTime = Date.now();
    const {request, response} = context;
    try {
      const finished = await this.invokeMiddleware(context);
      if (finished) {return;}
      const route = this.findRoute(request);
      const args = await this.parseParams(request, route);
      const authUser: AuthUser = await this.authenticateRequest(request);
      console.log(`user object %o`,authUser || null);
      const result = await this.invoke(route, args);
      this.send(response, result);
      this.logger.log(LOG_LEVEL.INFO,`${request.method} ${request.url} ${request.headers['user-agent']} ${response.statusCode} ${Date.now() - requestTime}ms`);
    } catch (err) {
      this.logger.log(LOG_LEVEL.INFO,`${request.method} ${request.url} ${request.headers['user-agent']} ${response.statusCode} ${Date.now() - requestTime}ms errored out. Error :: ${JSON.stringify(err)} ${err}`);
      this.reject(context, err);
    }
  }
}
