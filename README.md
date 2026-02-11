# Project Title

## Setup
- Requirements: git, npm, node
- Install: git clone, npm install
- Run: npm run start:dev
- Test: npm run test

## Assumptions
- teams are can join tournament
- team creator is automatically part of the team
- user can be in multiple teams
- the team size is set at the time of team creation and is fixed

## Tradeoffs
- implicit membership of the team creator.
  - without this, the api would need to keep track of teams without members and discard them if not populated
  - and also allow the creator to invite/add members without being part of the team.

## What I would improve with more time
- improve team members management and their removal
