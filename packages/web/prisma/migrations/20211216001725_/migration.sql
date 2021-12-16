-- CreateTable
CREATE TABLE "Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "appleId" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "title" TEXT,
    "content" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_appleId_key" ON "Note"("appleId");
