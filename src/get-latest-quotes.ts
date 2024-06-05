import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();
const apiKey = process.env.CMC_API_KEY; // Load API key from environment variables

async function main() {
    try {
        // Fetch all records from the Symbols table
        const symbols = await prisma.symbol.findMany();

        // Exit early if no symbols are defined
        if (symbols.length === 0) {
            console.log('No symbols found to look up.');
            return;
        }

        // Concatenate the Slug fields with commas
        const slugs = symbols.map(symbol => symbol.Slug).join(',');
        console.log("get quote for slugs: ", slugs)

        // Make HTTP request to the CoinMarketCap API
        const response = await axios.get(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest`, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            },
            params: {
                slug: slugs
            }
        });

        const responseData = response.data;

        // Check for errors in the response
        if (responseData.status.error_code !== 0) {
            throw new Error(responseData.status.error_message || 'Unknown error occurred');
        }

        // Process the response and insert the data into the Quote table
        for (const key in responseData.data) {
            const quoteData = responseData.data[key];


            // Find the matching symbol in our Symbols table
            const symbol = symbols.find(symbol => symbol.Slug === quoteData.slug);

            // Continue to the next iteration if no matching symbol is found
            if (!symbol) {
                continue;
            }

            const quote = quoteData.quote.USD;

            // Insert quote data into the Quote table
            await prisma.quote.create({
                data: {
                    SymbolId: symbol.Id,
                    Time: new Date(quote.last_updated),
                    Price: quote.price
                }
            });
        }

        console.log('Quotes have been successfully updated.');
    } catch (error) {
        const err = error as Error;
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();