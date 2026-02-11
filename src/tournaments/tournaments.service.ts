import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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

  async registerTeam(tournamentId: number, teamId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Check if registration deadline has passed
    if (tournament.registrationDeadline) {
      const now = new Date();
      if (now > tournament.registrationDeadline) {
        throw new BadRequestException(
          'Registration deadline has passed for this tournament',
        );
      }
    }

    // Check if team is already registered
    if (tournament.teams.some((team) => team.id === teamId)) {
      throw new BadRequestException(
        'Team is already registered for this tournament',
      );
    }

    return this.prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        teams: {
          connect: { id: teamId },
        },
      },
      include: { teams: true },
    });
  }
}
