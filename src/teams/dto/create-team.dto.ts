export class CreateTeamDto {
  name: string;
  members?: string[];
  maxMembers?: number;
}
