import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailService } from './mail.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, MailService],
  controllers: [UsersController],
  exports: [UsersService, MailService],
})
export class UsersModule {}