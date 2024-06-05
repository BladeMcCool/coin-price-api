import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });