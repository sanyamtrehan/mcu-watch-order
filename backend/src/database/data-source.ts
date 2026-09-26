import { DataSource } from 'typeorm';
import { ENVIRONMENT } from '../helpers/configs/environment';
import { User } from '../auth/auth.model';
import { Mcu } from '../mcu/mcu.model';

export default new DataSource({
  type: 'postgres',
  url: ENVIRONMENT.DATABASE_URL,
  ssl: ENVIRONMENT.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  entities: [User, Mcu],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
