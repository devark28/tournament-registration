import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { PrismaClientInitializationError } from '../../generated/prisma/internal/prismaNamespace';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      const startTime = Date.now();
      await this.$connect();
      const connectionTime = Date.now() - startTime;
      this.logger.log(`Database online in ${connectionTime / 1000}s`);
    } catch (error) {
      switch ((error as PrismaClientInitializationError)?.errorCode) {
        case 'P1003': {
          // Database does not exist
          throw new InternalServerErrorException('Database does not exist');
        }
        case 'P1001': {
          // Database connection failed
          throw new InternalServerErrorException('Database connection failed');
        }
      }
      this.logger.error('Error connecting to the database:', error);
    }
  }
}
