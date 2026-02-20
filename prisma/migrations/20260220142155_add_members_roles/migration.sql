/*
  Warnings:

  - You are about to drop the `_TeamToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('STANDARD', 'CAPTAIN');

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_TeamToUser" DROP CONSTRAINT "_TeamToUser_B_fkey";

-- DropTable
DROP TABLE "_TeamToUser";

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'STANDARD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
