-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "appleId" TEXT NOT NULL,
    "ipfsHash" TEXT,
    "title" TEXT,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Note_appleId_key" ON "Note"("appleId");
