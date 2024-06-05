import express from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import moment from 'moment';
import { LRUCache } from 'lru-cache'

// Load environment variables from .env file
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware for rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS as string, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS as string, 10) || 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
});

app.use(limiter);

// Initialize LRU cache
const cache = new LRUCache<string, any>({
    max: 1000, // Maximum number of items in cache
    ttl: 1000 * 60 * 5 // Items expire after 5 minutes (Note: `ttl` replaces `maxAge` in newer versions)
});

app.get('/quote', async (req, res) => {
    const { startDate, endDate, sortBy, order, symbol, limit = 10, offset = 0 } = req.query;

    // Default date range: today
    const defaultStartDate = moment().startOf('day').toISOString();
    const defaultEndDate = moment().toISOString();

    const start = startDate || defaultStartDate;
    const end = endDate || defaultEndDate;

    // Todo: think about doing error for invalid values supplied for sort and order, atm it silently uses the default if things werent valid.
    // Determine the sort field
    const validSortFields = ['Time', 'RecordedAt', 'Price'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'Time';

    //order descending by default.
    const orderByDirection = order === 'asc' ? 'asc' : 'desc';

    // Create a unique cache key based on the query parameters
    const cacheKey = `${start}-${end}-${symbol}-${limit}-${offset}-${orderByDirection}-${sortField}`;
    // Check if the result is in the cache
    if (cache.has(cacheKey)) {
        console.log("Cache hit on: ", cacheKey)
        return res.json(cache.get(cacheKey));
    } else {
        console.log("Cache miss on: ", cacheKey)
    }

    try {
        // If a symbol is provided, find the corresponding SymbolId
        let symbolCondition = {};
        if (symbol) {
            const foundSymbol = await prisma.symbol.findUnique({
                where: { Symbol: symbol as string },
            });

            if (!foundSymbol) {
                return res.status(400).json({ error: "Invalid symbol provided." });
            }

            symbolCondition = { SymbolId: foundSymbol.Id };
        }
        const currencyPrices = await prisma.quote.findMany({
            where: {
                Time: {
                    gte: new Date(start as string),
                    lte: new Date(end as string),
                },
                ...symbolCondition,
            },
            take: parseInt(limit as string, 10),
            skip: parseInt(offset as string, 10),
            orderBy: {
                [sortField as string]: orderByDirection,
            },
            include: {
                Symbol: true, // Include the related Symbol data
            },
        });

        // Transform the result to include only the Symbol field with the symbol value
        const result = currencyPrices.map(quote => ({
            Id: quote.Id,
            SymbolId: quote.SymbolId,
            Time: quote.Time,
            RecordedAt: quote.RecordedAt,
            Price: quote.Price,
            Symbol: quote.Symbol.Symbol // Include the symbol abbreviation only
        }));

        // Store the result in the cache
        cache.set(cacheKey, result);

        //todo: consider that we could maybe go reach out to a 3rd party service for historical data if we got no results from our db.
        //  but the APIs for that were not readily forthcoming and I didnt have time to really consider additional research/dev on that.

        //Return the result to the client as json.
        res.json(result);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: "An error occurred while fetching currency prices: " + err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
