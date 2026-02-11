import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto, session: UserSession) {
    const maxMembers = createTeamDto.maxMembers || 5;
    const memberIds = createTeamDto.members || [];

    // Check if total members (including captain) exceeds max
    if (memberIds.length + 1 > maxMembers) {
      throw new BadRequestException(
        `Cannot add ${memberIds.length + 1} members. Maximum allowed is ${maxMembers}`,
      );
    }

    const createData: Prisma.TeamUncheckedCreateInput = {
      name: createTeamDto.name,
      maxMembers,
      members: {
        connect: [{ id: session.user.id }],
      },
    };
    if (createTeamDto.members) {
      createData.members = {
        connect: [
          { id: session.user.id },
          ...createTeamDto.members.map((member) => ({ id: member })),
        ],
      };
    }
    return this.prisma.team.create({
      data: createData,
      include: { members: true },
    });
  }

  async addMember(teamId: number, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is already a member
    if (team.members.some((member) => member.id === userId)) {
      throw new BadRequestException('User is already a member of this team');
    }

    // Check if adding this member would exceed max
    if (team.members.length >= team.maxMembers) {
      throw new BadRequestException(
        `Team has reached maximum number of members (${team.maxMembers})`,
      );
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: { members: true },
    });
  }

  findAll() {
    return this.prisma.team.findMany();
  }

  findOne(id: number) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }

  update(id: number, updateTeamDto: UpdateTeamDto) {
    const updateData: Prisma.TeamUncheckedUpdateInput = {
      name: updateTeamDto.name,
    };
    if (updateTeamDto.members) {
      updateData.members = {
        connect: updateTeamDto.members.map((member) => ({ id: member })),
      };
    }
    return this.prisma.team.update({
      where: { id },
      data: updateData,
    });
  }

  remove(id: number) {
    return this.prisma.team.delete({
      where: { id },
    });
  }
}
