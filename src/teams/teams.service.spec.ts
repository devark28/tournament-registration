import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MemberRole } from '../../generated/prisma/client';
import { UserSession } from '@thallesp/nestjs-better-auth';

describe('TeamsService', () => {
  let service: TeamsService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;

  const mockPrismaService = {
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    member: {
      create: jest.fn(),
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
    const mockSession: UserSession = {
      user: {
        id: 'captain-id',
        email: 'captain@test.com',
        name: 'Captain',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-id',
        token: 'token',
        expiresAt: new Date(),
        userId: 'captain-id',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should create a team with captain only', async () => {
      const createTeamDto = {
        name: 'Test Team',
      };

      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          {
            userId: 'captain-id',
            role: MemberRole.CAPTAIN,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.create.mockResolvedValue(mockTeam);

      const result = await service.create(createTeamDto, mockSession);

      expect(result).toEqual(mockTeam);
      expect(mockPrismaService.team.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Team',
          maxMembers: 5,
          members: {
            create: {
              userId: 'captain-id',
              role: MemberRole.CAPTAIN,
            },
          },
        },
        include: { members: true },
      });
    });
  });

  describe('addMember', () => {
    const mockSession: UserSession = {
      user: {
        id: 'captain-id',
        email: 'captain@test.com',
        name: 'Captain',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-id',
        token: 'token',
        expiresAt: new Date(),
        userId: 'captain-id',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should add a member when under max limit', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          {
            userId: 'captain-id',
            role: MemberRole.CAPTAIN,
          },
          {
            userId: 'member1',
            role: MemberRole.STANDARD,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMember = {
        userId: 'member2',
        teamId: 1,
        role: MemberRole.STANDARD,
        team: mockTeam,
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.member.create.mockResolvedValue(mockMember);

      const result = await service.addMember(
        1,
        { userId: 'member2' },
        mockSession,
      );

      expect(result).toEqual(mockMember);
      expect(mockPrismaService.member.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: 'member2' } },
          team: { connect: { id: 1 } },
        },
        include: { team: true },
      });
    });

    it('should reject adding member when at max limit', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 3,
        members: [
          { userId: 'captain-id', role: MemberRole.CAPTAIN },
          { userId: 'member1', role: MemberRole.STANDARD },
          { userId: 'member2', role: MemberRole.STANDARD },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.addMember(1, { userId: 'member3' }, mockSession),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addMember(1, { userId: 'member3' }, mockSession),
      ).rejects.toThrow('Team has reached maximum number of members (3)');

      expect(mockPrismaService.member.create).not.toHaveBeenCalled();
    });

    it('should reject duplicate member', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          { userId: 'captain-id', role: MemberRole.CAPTAIN },
          { userId: 'member1', role: MemberRole.STANDARD },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.addMember(1, { userId: 'member1' }, mockSession),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addMember(1, { userId: 'member1' }, mockSession),
      ).rejects.toThrow('User is already a member of this team');

      expect(mockPrismaService.member.create).not.toHaveBeenCalled();
    });

    it('should reject adding to non-existent team', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(999, { userId: 'member1' }, mockSession),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.addMember(999, { userId: 'member1' }, mockSession),
      ).rejects.toThrow('Team not found');

      expect(mockPrismaService.member.create).not.toHaveBeenCalled();
    });

    it('should reject if not captain', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [{ userId: 'not-captain-id', role: MemberRole.CAPTAIN }],
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.addMember(1, { userId: 'member1' }, mockSession),
      ).rejects.toThrow('You must be the captain to add members to this team');
    });
  });

  describe('removeMember', () => {
    const mockSession: UserSession = {
      user: {
        id: 'captain-id',
        email: 'captain@test.com',
        name: 'Captain',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-id',
        token: 'token',
        expiresAt: new Date(),
        userId: 'captain-id',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should remove a member when captain', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [
          { userId: 'captain-id', role: MemberRole.CAPTAIN },
          { userId: 'member1', role: MemberRole.STANDARD },
        ],
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.member.delete.mockResolvedValue({
        userId: 'member1',
        teamId: 1,
      });

      const result = await service.removeMember(
        1,
        { userId: 'member1' },
        mockSession,
      );

      expect(result).toEqual({ userId: 'member1', teamId: 1 });
      expect(mockPrismaService.member.delete).toHaveBeenCalledWith({
        where: {
          userId_teamId: {
            teamId: 1,
            userId: 'member1',
          },
        },
        include: { team: true },
      });
    });

    it('should reject if not captain', async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [{ userId: 'not-captain-id', role: MemberRole.CAPTAIN }],
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.removeMember(1, { userId: 'member1' }, mockSession),
      ).rejects.toThrow(
        'You must be the captain to remove members from this team',
      );
    });

    it("should reject if user isn't a member", async () => {
      const mockTeam = {
        id: 1,
        name: 'Test Team',
        maxMembers: 5,
        members: [{ userId: 'captain-id', role: MemberRole.CAPTAIN }],
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      await expect(
        service.removeMember(1, { userId: 'member1' }, mockSession),
      ).rejects.toThrow("User isn't a member of this team");
    });

    it('should reject removing from non-existent team', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember(999, { userId: 'member1' }, mockSession),
      ).rejects.toThrow('Team not found');
    });
  });
});
