import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TracksModule } from './tracks/tracks.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PurchasesModule } from './purchases/purchases.module';
import { MessagesModule } from './messages/messages.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { SavedTracksModule } from './saved-tracks/saved-tracks.module';
import { PlayHistoryModule } from './play-history/play-history.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
      TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    TracksModule,
    ReviewsModule,
    FavoritesModule,
    PurchasesModule,
    MessagesModule,
    SubscriptionsModule,
    SavedTracksModule,
    PlayHistoryModule,
    AnalyticsModule,
  ],
})
export class AppModule {}


