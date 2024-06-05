## Dockerized Run

### Build the compose project
`docker-compose build`

`docker-compose up -d`

- but I didnt get a chance to test it properly, i think it is broken still. ran out of time. 

## Local Run

### Install deps
`npm install`

### Start a postgres container to go with it

`docker run --name my-postgres -e POSTGRES_USER=johndoe -e POSTGRES_PASSWORD=randompassword -e POSTGRES_DB=mydatabase -p 5432:5432 -d postgres`

### Define a .env file with db connection and coin market cap api key.
```bash
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
CMC_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Establish the db
`npx prisma migrate dev --name init`

### Initialize the symbols we are going to allow:
`npx ts-node src/init-symbols.ts`

### Grab latest quotes for all symbols and insert into db:
`npm run updater`  
~~`npx ts-node src/get-latest-quotes.ts`~~
- For now, to run this on a schedule go into src directory and execute  ./run-updater.sh which will run it once per minute.
- todo:
  - periodic execution eg cron, perhaps some container can be setup for this and just run in the bg doing updates
  - should skip inserting essentially the same record twice. if newest time record for the symbol is the same time we got in the response, then skip inserting a record. at the moment we will just insert the results we got regardless of if it duplicates. 
  - (index the SymbolId+Time field of the Quote table)
  - in the web server, if enddate is supplied but doesnt have a time component then go up to the end of that day as opposed to midnight/day start

### Run the script:
`npm run dev`

### Query for prices:
http://127.0.0.1:3000/quote?order=asc&limit=50&offset=5&symbol=DOGE&sortBy=Price

### Dump the pg database of collected pricing data
`docker exec -t my-postgres pg_dump -U johndoe mydb > db_dump.sql`  
this will put a local file called db_dump.sql

### The Journey
- Being unfamiliar familiar with any free API for this, investigating CoinMarketCap and CoinGecko -- seems CoinMarketCap has a free tier with some api credits. Tried to access CoinGecko but option to obtain API key was not appearing. Gave up on CoinGecko and will proceed with CoinMarketCap however it appears there is no source of historical data on free tier. So ... if we are going to even consider supporting historical data back in time before our cron data collector was started then we must continue researching to find a suitable API. That research now becomes a stretch goal for this project if time allows.

- Figured out how to get quotes for bitcoin,ethereum,dogecoin from CMC api
  - `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?slug=bitcoin,ethereum,dogecoin`

- Developed a script which can be run periodically go grab price quotes from CMC and insert into database

- Got web server running with simple IP based rate limiting, with a /quote GET endpoint, with some query params available:
  - symbol (anything that exists in Symbols table, eg: BTC, ETH, DOGE)
  - startDate (iso 8601 format, defaults to start of today)
  - endDate (iso 8601 format, defaults to current time)
  - limit
  - offset
  - order (asc or desc, defaults to desc)
  - sortBy ('Time', 'RecordedAt', 'Price')

- Implemented a (admittedly simplistic) LRU cache that juts combines the query params as a cache key, helpful for caching stuff with endDate supplied (without endDate supplied we use now as the time which means it will miss the cache)

Given the time looking into the 2 known pricing APIs, and finding their limitations (couldnt get api key for coingecko, and cmc historical data is on paid api only) there wasnt really enough time to consider historical data stuff either, though one approach might be to try and hit a 3rd party historical api and put the info in the db in the event that the time range the user asked for had no results in our db.