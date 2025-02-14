import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
config();

export const dataSourceOptions: DataSourceOptions = {
  synchronize: true,
  entities: ['dist/**/*.entity{.ts,.js}'],
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: ['error'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
