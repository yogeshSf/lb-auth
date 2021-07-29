import {repository} from '@loopback/repository';
import {getModelSchemaRef, post, requestBody} from '@loopback/rest';
import * as jwt from 'jsonwebtoken';
import {authorize} from 'loopback4-authorization';
import {Users} from '../models';
import {LoginRequest} from '../models/login-request.dto';
import {UsersRepository} from '../repositories';


export class AuthController {
  constructor(
    @repository(UsersRepository)
    public usersRepository: UsersRepository,
  ) {}


  @authorize({permissions: ['*']})
  @post('/signup', {
    responses: {
      '200': {
        description: 'Users model instance',
        content: {'application/json': {schema: getModelSchemaRef(Users)}},
      },
    },
  })
  async signup(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Users, {
            title: 'NewUsers',
            exclude: ['id'],
          }),
        },
      },
    })
    users: Omit<Users, 'id'>,
  ): Promise<Users> {
    return this.usersRepository.create(users);
  }

  @authorize({permissions: ['*']})
  @post('/login', {
    responses: {
      '200': {
        description: 'Users model instance',
        content: {'application/json': {schema: {}}},
      },
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(LoginRequest),
        },
      },
    })
    loginRequest: LoginRequest,
  ): Promise<{accessToken: string}> {
    const user = await this.usersRepository.verifyPassword(
      loginRequest.username,
      loginRequest.password,
    );
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '24h',
        issuer: process.env.JWT_ISSUER,
      },
    );

    return {
      accessToken,
    };
  }
}
