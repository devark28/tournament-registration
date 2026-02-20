import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { PaginationDto } from '../lib/dto/pagination.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { RemoveTeamMemberDto } from './dto/remove-team-member.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(
    @Body() createTeamDto: CreateTeamDto,
    @Session() session: UserSession,
  ) {
    return this.teamsService.create(createTeamDto, session);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.teamsService.findAll(pagination);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() createTeamMemberDto: CreateTeamMemberDto,
    @Session() session: UserSession,
  ) {
    return this.teamsService.addMember(id, createTeamMemberDto, session);
  }

  @Delete(':id/members')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() removeTeamMemberDto: RemoveTeamMemberDto,
    @Session() session: UserSession,
  ) {
    return this.teamsService.removeMember(id, removeTeamMemberDto, session);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.remove(id);
  }
}
