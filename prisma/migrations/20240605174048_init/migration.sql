-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Symbol" (
    "Id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Symbol" TEXT NOT NULL,
    "Slug" TEXT NOT NULL,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "Id" SERIAL NOT NULL,
    "SymbolId" INTEGER NOT NULL,
    "Time" TIMESTAMP(3) NOT NULL,
    "Price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_key_key" ON "User"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Symbol_Symbol_key" ON "Symbol"("Symbol");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_SymbolId_fkey" FOREIGN KEY ("SymbolId") REFERENCES "Symbol"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
