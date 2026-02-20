import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';

export class UpdateTeamDto extends PartialType(CreateTeamDto) {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxMembers?: number;
}
