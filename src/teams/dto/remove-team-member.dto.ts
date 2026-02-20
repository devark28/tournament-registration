import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveTeamMemberDto {
  @IsString({ each: true })
  @IsNotEmpty()
  userId: string;
}
