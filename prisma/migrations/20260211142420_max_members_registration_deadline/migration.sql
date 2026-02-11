-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "registrationDeadline" TIMESTAMP(3);
