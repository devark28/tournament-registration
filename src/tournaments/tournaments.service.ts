import { Injectable } from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTournamentDto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: {
        title: createTournamentDto.title,
      },
    });
  }

  findAll() {
    return this.prisma.tournament.findMany();
  }

  findOne(id: number) {
    return this.prisma.tournament.findUnique({
      where: { id },
    });
  }

  update(id: number, updateTournamentDto: UpdateTournamentDto) {
    const updateData: Prisma.TournamentUncheckedUpdateInput = {
      title: updateTournamentDto.title,
    };
    if (updateTournamentDto.teams) {
      updateData.teams = {
        connect: updateTournamentDto.teams.map((team) => ({ id: team })),
      };
    }
    return this.prisma.tournament.update({
      where: { id },
      data: updateData,
    });
  }

  remove(id: number) {
    return this.prisma.tournament.delete({
      where: { id },
    });
  }
}
