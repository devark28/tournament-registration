import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxMembers?: number;
}
