-- CreateTable
CREATE TABLE "Favorite" (
    "userId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId", "menuId")
);

-- CreateIndex
CREATE INDEX "Favorite_menuId_idx" ON "Favorite"("menuId");

-- AddForeignKey
ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite"
ADD CONSTRAINT "Favorite_menuId_fkey"
FOREIGN KEY ("menuId") REFERENCES "Menu"("id")
ON DELETE CASCADE ON UPDATE CASCADE;