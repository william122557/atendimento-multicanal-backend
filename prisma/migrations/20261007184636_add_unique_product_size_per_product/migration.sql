/*
  Warnings:

  - A unique constraint covering the columns `[productId,size]` on the table `ProductSize` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_productId_size_key" ON "ProductSize"("productId", "size");
