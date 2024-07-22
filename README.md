# Coin Price API

### Satoshi.money take home assessment - 2024-06-05 (June 5 2024)

***
#### Please complete and return in 6 hrs from your start time.
#### Take Home Assignment - Backend

#### Summary
Create a RESTful API service using Node.js with Express (or similar framework) that fetches price data for various coins from a third-party API over time, and provides a search endpoint to query the data. The service should use public third-party APIs such as CoinGecko or CoinMarketCap to gather 
this data and store it in a database.

#### Requirements
1. Implement a script/cron job that runs every n seconds. It should fetch price data for multiple coins from a public API, and store this data in a PostgreSQL database. You are free to use an ORM if you want to, we use Prisma at Satoshi. You can spin up a free PostgreSQL database on ElephantSQL

1. Implement a search endpoint that accepts query parameters to filter and sort the price data. You should also add the ability for clients to specify limit and offset query parameters so they can implement pagination.

1. Introduce caching to store the results of common queries to improve response time and reduce the load on the third-party service (and to prevent being rate limited by their API).

#### Stretch Goals
- Add rate limiting to your API to prevent abuse.
- Dockerize the application for easy deployment.

#### Submission Guidelines
- The code should be written in Node.js and TypeScript.
- The code should be well-documented.
- The code should follow best practices for Node.js/Express and PostgreSQL.
- The code should include a README with instructions on how to run the app.
- The code should be made publicly available on GitHub with proper commit messages.
#### Evaluation Criteria
- Code quality and readability.
- Handling of asynchronous operations and data fetching.
- Database schema design.
- Bonus points for creative additional features.

***
#### Notes:

This was a nice take home project that was fairly straightforward to complete within the alotted time. The company required the candidate to find the API to use for supplying the info on their own, which I think is a mistake b/c of the amount of time spent reading documentation and testing APIs to make sure they can deliver the required information at NO COST. I time boxed that part of the assignment to one hour and failed to find a free working API that would give historical price data, I was limited to Coin Market Caps free tier real time data. So the project was framed around being able to populate my postgres DB with that info from that API every minute. 

I essentially completed it within the deadline including the stretch goals for dockerization of the db+web server with cron task running, however I ran into a weird issue getting the crontab to actually be executed -- in the end it was a windows line ending problem with the crontab file, and after switching my file to unix style line endings that issue was resolved.
***

## Dockerized Run

### Define a .env file with db connection and coin market cap api key.
```bash
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
CMC_API_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Build and run the compose project
`docker-compose build`  

`docker-compose up -d`

The 'web' component of the docker compose will also be running the cron task to grab latest pricing every minute from the CMC api.

Url to access the service API: http://localhost:3000/quote
- Example requests:
  - get up to 10 recent records for all supported (BTC, ETH, DOGE) coins:
    - http://localhost:3000/quote
  - get up to 10 recent records for BTC:
    - http://localhost:3000/quote?symbol=BTC
  - Query for a date range of BTC sorting by Price ascending, offset by 2 and limit to 5 records.
    - http://localhost:3000/quote?symbol=BTC&startDate=2024-06-08T19:59:00&endDate=2024-06-08T20:30&sortBy=Price&order=asc&limit=5&offset=2

## Local Run

### Install deps
`npm install`

### Start a postgres container to go with it

`docker run --name my-postgres -e POSTGRES_USER=johndoe -e POSTGRES_PASSWORD=randompassword -e POSTGRES_DB=mydatabase -p 5432:5432 -d postgres`

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
  - note: in the docker compose version, there is a cron job in the webserver container.

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