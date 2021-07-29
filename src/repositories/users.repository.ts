import {inject} from '@loopback/core';
import {
  DataObject,

  Options
} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import * as bcrypt from 'bcrypt';
import {AuthErrorKeys} from 'loopback4-authentication';
import {SoftCrudRepository} from 'loopback4-soft-delete';
import {PgDataSource} from '../datasources';
import {Users, UsersRelations} from '../models';

export class UsersRepository extends SoftCrudRepository<
  Users,
  typeof Users.prototype.id,
  UsersRelations
  > {


  constructor(
    @inject('datasources.pg') dataSource: PgDataSource,
  ) {
    super(Users, dataSource);

  }

  async create(entity: DataObject<Users>, options?: Options): Promise<Users> {
    const userExist  =   await super.findOne({ where: {username: entity.username} });

    if (userExist) {
      throw new HttpErrors.Unauthorized(`username ${entity.username} already exist`);
    }

    entity.password = await bcrypt.hash(entity.password as string,10);
    const user = await super.create(entity, options);
    return user;
  }

  async verifyPassword(username: string, password: string): Promise<Users> {
    const user = await super.findOne({
      where: {username}
    });
    if (!user || !user.password) {
      throw new HttpErrors.Unauthorized("UserDoesNotExist");
    } else if (!(await bcrypt.compare(password, user.password))) {
      throw new HttpErrors.Unauthorized(AuthErrorKeys.InvalidCredentials);
    }
    return user;
  }
}
