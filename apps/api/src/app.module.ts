import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DailyReportsModule } from './daily-reports/daily-reports.module.js';
import { DirectionModule } from './direction/direction.module.js';
import { HabitsModule } from './habits/habits.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SummariesModule } from './summaries/summaries.module.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    // 全局配置：优先读取 .env.local，其次 .env
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HealthModule,
    PrismaModule,
    TasksModule,
    HabitsModule,
    DirectionModule,
    SummariesModule,
    DailyReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
