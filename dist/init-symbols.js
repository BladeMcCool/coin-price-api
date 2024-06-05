"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Create symbols
    const symbols = await prisma.symbol.createMany({
        data: [
            { Name: 'Bitcoin', Symbol: 'BTC', Slug: 'bitcoin' },
            { Name: 'Ethereum', Symbol: 'ETH', Slug: 'ethereum' },
            { Name: 'Dogecoin', Symbol: 'DOGE', Slug: 'dogecoin' },
        ],
    });
    console.log('Symbols created:', symbols);
    //
    // // Create quotes
    // const quote1 = await prisma.quote.create({
    //     data: {
    //         SymbolId: symbol1.Id,
    //         Time: new Date('2023-06-01T12:00:00Z'),
    //         Price: 123456.78,
    //     },
    // });
    //
    // const quote2 = await prisma.quote.create({
    //     data: {
    //         SymbolId: symbol2.Id,
    //         Time: new Date('2023-06-01T13:00:00Z'),
    //         Price: 234567.89,
    //     },
    // });
    //
    // const quote3 = await prisma.quote.create({
    //     data: {
    //         SymbolId: symbol3.Id,
    //         Time: new Date('2023-06-01T14:00:00Z'),
    //         Price: 345678.90,
    //     },
    // });
    //
    // console.log('Quotes created:', quote1, quote2, quote3);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
