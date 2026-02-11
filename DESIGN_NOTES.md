# Design Notes (max 1 page)

## Architecture choice
- nestjs for project structure
- prisma layer for ease of use of postgres and flexibility

## Data model
- User
- Tournament
- Team

## Edge cases handled
- prevents team registration after tournament due date
- prevents member registration with a full team

## Risks and mitigations
- dangling/empty team risk: the team creator becomes a member automatically.

## What I'd do next
- i need api validation for all controller DTOs.
- add more tests and use e2e test to test better-auth integration since manual testing isn't scalable
- add other authentication methods in better-auth
