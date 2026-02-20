import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString({ each: true })
  @IsNotEmpty()
  userId: string;
}
