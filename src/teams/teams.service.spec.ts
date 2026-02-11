import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    team: {
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
        TeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockSession = {
      user: { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
      session: {
        id: 'session-id',
        token: 'token',
        expiresAt: new Date(),
        userId: 'captain-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should create a team with captain only', async () => {
      const createTeamDto = {
        name: 'Test Team',
        members: [],
      };

      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.create.mockResolvedValue(mockTeam);

      const result = await service.create(createTeamDto, mockSession);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Team',
          maxMembers: 5,
        }),
        include: { members: true },
      });
    });

    it('should reject team creation when initial members exceed max', async () => {
      const createTeamDto = {
        name: 'Test Team',
        maxMembers: 3,
        members: ['member1', 'member2', 'member3'], // 4 total with captain
      };

      await expect(service.create(createTeamDto, mockSession)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createTeamDto, mockSession)).rejects.toThrow(
        'Cannot add 4 members. Maximum allowed is 3',
      );

      expect(mockPrismaService.team.create).not.toHaveBeenCalled();
    });

    it('should allow team creation at max member limit', async () => {
      const createTeamDto = {
        name: 'Test Team',
        maxMembers: 3,
        members: ['member1', 'member2'], // 3 total with captain
      };

      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 3,
        members: [
          { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
          { id: 'member1', email: 'member1@test.com', name: 'Member 1' },
          { id: 'member2', email: 'member2@test.com', name: 'Member 2' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.create.mockResolvedValue(mockTeam);

      const result = await service.create(createTeamDto, mockSession);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.create).toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should add a member when under max limit', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
          { id: 'member1', email: 'member1@test.com', name: 'Member 1' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedTeam = {
        ...mockTeam,
        members: [
          ...mockTeam.members,
          { id: 'member2', email: 'member2@test.com', name: 'Member 2' },
        ],
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.team.update.mockResolvedValue(mockUpdatedTeam);

      const result = await service.addMember(1, 'member2');

      expect(result).toEqual(mockUpdatedTeam);
      expect(mockPrismaService.team.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          members: {
            connect: { id: 'member2' },
          },
        },
        include: { members: true },
      });
    });

    it('should reject adding member when at max limit', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 3,
        members: [
          { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
          { id: 'member1', email: 'member1@test.com', name: 'Member 1' },
          { id: 'member2', email: 'member2@test.com', name: 'Member 2' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(service.addMember(1, 'member3')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addMember(1, 'member3')).rejects.toThrow(
        'Team has reached maximum number of members (3)',
      );

      expect(mockPrismaService.team.update).not.toHaveBeenCalled();
    });

    it('should reject duplicate member', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          { id: 'captain-id', email: 'captain@test.com', name: 'Captain' },
          { id: 'member1', email: 'member1@test.com', name: 'Member 1' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(service.addMember(1, 'member1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addMember(1, 'member1')).rejects.toThrow(
        'User is already a member of this team',
      );

      expect(mockPrismaService.team.update).not.toHaveBeenCalled();
    });

    it('should reject adding to non-existent team', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(service.addMember(999, 'member1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addMember(999, 'member1')).rejects.toThrow(
        'Team not found',
      );

      expect(mockPrismaService.team.update).not.toHaveBeenCalled();
    });
  });
});
