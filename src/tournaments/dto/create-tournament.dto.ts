import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  registrationDeadline?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
