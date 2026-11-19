import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { IfoodModule } from './modules/ifood/ifood.module';
import { NinetyNineFoodModule } from './modules/ninety-nine-food/ninety-nine-food.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'painel'),
      serveRoot: '/painel',
    }),

    AuthModule,
    IfoodModule,
    NinetyNineFoodModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}