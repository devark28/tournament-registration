import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { MemberRole, Prisma } from '../../generated/prisma/client';
import { PaginationDto } from '../lib/dto/pagination.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { RemoveTeamMemberDto } from './dto/remove-team-member.dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, session: UserSession) {
    const maxMembers = createTeamDto.maxMembers || 5;

    const createData: Prisma.TeamUncheckedCreateInput = {
      name: createTeamDto.name,
      maxMembers,
      members: {
        create: {
          userId: session.user.id,
          role: MemberRole.CAPTAIN,
        },
      },
    };
    return this.prisma.team.create({
      data: createData,
      include: { members: true },
    });
  }

  async addMember(
    teamId: number,
    createTeamMemberDto: CreateTeamMemberDto,
    session: UserSession,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if current user is the captain
    if (
      !team.members.some(
        (member) =>
          member.userId === session.user.id &&
          member.role === MemberRole.CAPTAIN,
      )
    ) {
      throw new BadRequestException(
        'You must be the captain to add members to this team',
      );
    }

    // Check if user is already a member
    if (
      team.members.some(
        (member) => member.userId === createTeamMemberDto.userId,
      )
    ) {
      throw new BadRequestException('User is already a member of this team');
    }

    // Check if adding this member would exceed max
    if (team.members.length >= team.maxMembers) {
      throw new BadRequestException(
        `Team has reached maximum number of members (${team.maxMembers})`,
      );
    }

    return this.prisma.member.create({
      data: {
        user: { connect: { id: createTeamMemberDto.userId } },
        team: { connect: { id: teamId } },
      },
      include: { team: true },
    });
  }

  async removeMember(
    teamId: number,
    removeTeamMemberDto: RemoveTeamMemberDto,
    session: UserSession,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if current user is the captain
    if (
      !team.members.some(
        (member) =>
          member.userId === session.user.id &&
          member.role === MemberRole.CAPTAIN,
      )
    ) {
      throw new BadRequestException(
        'You must be the captain to remove members from this team',
      );
    }

    // Check if user is already a member
    if (
      !team.members.some(
        (member) => member.userId === removeTeamMemberDto.userId,
      )
    ) {
      throw new BadRequestException("User isn't a member of this team");
    }

    return this.prisma.member.delete({
      where: {
        userId_teamId: {
          teamId: teamId,
          userId: removeTeamMemberDto.userId,
        },
      },
      include: { team: true },
    });
  }

  findAll(pagination: PaginationDto) {
    return this.prisma.team.findMany({
      skip: pagination.page * pagination.limit,
      take: pagination.limit,
      include: { members: true },
    });
  }

  findOne(id: number) {
    return this.prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });
  }

  update(id: number, updateTeamDto: UpdateTeamDto) {
    const updateTeamData: Prisma.TeamUncheckedUpdateInput = {
      name: updateTeamDto.name,
    };
    return this.prisma.team.update({
      where: { id },
      data: updateTeamData,
    });
  }

  remove(id: number) {
    return this.prisma.team.delete({
      where: { id },
    });
  }
}
