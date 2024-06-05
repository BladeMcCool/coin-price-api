"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
// Middleware for rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later.",
});
app.use(limiter);
app.get('/currency-prices', async (req, res) => {
    const { startDate, endDate, limit = 10, offset = 0 } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: "Please provide startDate and endDate." });
    }
    try {
        const currencyPrices = await prisma.currencyPrice.findMany({
            where: {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            take: parseInt(limit, 10),
            skip: parseInt(offset, 10),
            orderBy: {
                date: 'asc',
            },
        });
        res.json(currencyPrices);
    }
    catch (error) {
        res.status(500).json({ error: "An error occurred while fetching currency prices." });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
