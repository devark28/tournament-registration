import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { PaginationDto } from '../lib/dto/pagination.dto';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTournamentDto: CreateTournamentDto) {
    const creationData: Prisma.TournamentCreateInput = {
      title: createTournamentDto.title,
    };
    if (createTournamentDto.registrationDeadline) {
      creationData.registrationDeadline =
        createTournamentDto.registrationDeadline;
    }
    if (createTournamentDto.startDate) {
      creationData.startDate = createTournamentDto.startDate;
    }
    if (createTournamentDto.endDate) {
      creationData.endDate = createTournamentDto.endDate;
    }

    return this.prisma.tournament.create({
      data: creationData,
    });
  }

  findAll(pagination: PaginationDto) {
    return this.prisma.tournament.findMany({
      skip: pagination.page * pagination.limit,
      take: pagination.limit,
    });
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
    if (updateTournamentDto.registrationDeadline) {
      updateData.registrationDeadline =
        updateTournamentDto.registrationDeadline;
    }
    if (updateTournamentDto.startDate) {
      updateData.startDate = updateTournamentDto.startDate;
    }
    if (updateTournamentDto.endDate) {
      updateData.endDate = updateTournamentDto.endDate;
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

  async registerTeam(tournamentId: number, teamId: number) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Check if the registration deadline has passed
    if (tournament.registrationDeadline) {
      const now = new Date();
      if (now > tournament.registrationDeadline) {
        throw new BadRequestException(
          'Registration deadline has passed for this tournament',
        );
      }
    }

    // Check if the team is already registered
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
