import { Injectable } from '@nestjs/common';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UserSession } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTeamDto: CreateTeamDto, session: UserSession) {
    const createData: Prisma.TeamUncheckedCreateInput = {
      name: createTeamDto.name,
      members: {
        connect: [{ id: session.user.id }],
      },
    };
    if (createTeamDto.members) {
      createData.members = {
        connect: createTeamDto.members.map((member) => ({ id: member })),
      };
    }
    return this.prisma.team.create({
      data: {
        name: createTeamDto.name,
        members: {
          connect: [
            { id: session.user.id },
            ...createTeamDto.members.map((member) => ({ id: member })),
          ],
        },
      },
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
