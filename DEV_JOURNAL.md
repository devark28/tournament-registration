# Dev Journal (5–10 bullets)

Write a short log of what went wrong, what you tried, and what fixed it.

- better auth docs don't explicitly specify their db models expectations.
- i had to prompt to find the models, and fix the auth
- i should have use the better auth cli which auto generate the models giving assurance.
- tests were added to test functionality and requested changes.
- better-auth doesn't need extensive testing as it's an already tested library during its devevelopment, we only need to test the its integration.
- added validation to the api DTOs.

- when registering a team, registration becomes a captain
- after creating a team, the team needs:
  - minimum number of members
  - when the teams join the tournament, there is a minimum number for brackets to exist
