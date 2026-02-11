import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TournamentsService', () => {
  let service: TournamentsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;

  const mockPrismaService = {
    tournament: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerTeam', () => {
    it('should register team before deadline', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future

      const mockTournament = {
        id: 1,
        title: 'Test Tournament',
        registrationDeadline: futureDate,
        teams: [],
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTournament = {
        ...mockTournament,
        teams: [
          {
            id: 1,
            name: 'Test Team',
            maxMembers: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.tournament.update.mockResolvedValue(
        mockUpdatedTournament,
      );

      const result = await service.registerTeam(1, 1);

      expect(result).toEqual(mockUpdatedTournament);
      expect(mockPrismaService.tournament.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          teams: {
            connect: { id: 1 },
          },
        },
        include: { teams: true },
      });
    });

    it('should reject registration after deadline', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 days in past

      const mockTournament = {
        id: 1,
        title: 'Test Tournament',
        registrationDeadline: pastDate,
        teams: [],
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);

      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        'Registration deadline has passed for this tournament',
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });

    it('should allow registration when no deadline is set', async () => {
      const mockTournament = {
        id: 1,
        title: 'Test Tournament',
        registrationDeadline: null,
        teams: [],
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTournament = {
        ...mockTournament,
        teams: [
          {
            id: 1,
            name: 'Test Team',
            maxMembers: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);
      mockPrismaService.tournament.update.mockResolvedValue(
        mockUpdatedTournament,
      );

      const result = await service.registerTeam(1, 1);

      expect(result).toEqual(mockUpdatedTournament);
      expect(mockPrismaService.tournament.update).toHaveBeenCalled();
    });

    it('should reject duplicate team registration', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockTournament = {
        id: 1,
        title: 'Test Tournament',
        registrationDeadline: futureDate,
        teams: [
          {
            id: 1,
            name: 'Test Team',
            maxMembers: 5,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);

      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        'Team is already registered for this tournament',
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });

    it('should reject registration for non-existent tournament', async () => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(null);

      await expect(service.registerTeam(999, 1)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.registerTeam(999, 1)).rejects.toThrow(
        'Tournament not found',
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });

    it('should reject registration exactly at deadline (boundary test)', async () => {
      // Create a date slightly in the past to ensure the deadline has passed
      const deadlineDate = new Date();
      deadlineDate.setMilliseconds(deadlineDate.getMilliseconds() - 1);

      const mockTournament = {
        id: 1,
        title: 'Test Tournament',
        registrationDeadline: deadlineDate,
        teams: [],
        startDate: null,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.tournament.findUnique.mockResolvedValue(mockTournament);

      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.registerTeam(1, 1)).rejects.toThrow(
        'Registration deadline has passed for this tournament',
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });
  });
});
