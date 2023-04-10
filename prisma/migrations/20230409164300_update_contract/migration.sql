/*
  Warnings:

  - Added the required column `endDate` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `terms` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCost` to the `Contract` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "terms" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "hourlyRate" TEXT,
    "hoursPerWeek" INTEGER,
    "totalHours" INTEGER,
    "totalCost" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "contractorId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    CONSTRAINT "Contract_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("clientId", "contractorId", "createdAt", "deletedAt", "id", "name", "updatedAt") SELECT "clientId", "contractorId", "createdAt", "deletedAt", "id", "name", "updatedAt" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
