#!/bin/bash

# Source nvm
export NVM_DIR="/usr/local/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Export environment variables to a file for cron jobs
echo "Exporting environment variables..."

# Export environment variables to a file -- this is entirely so i can access it from cronjob.
echo "Exporting environment variables..."
echo "PATH=$PATH" > /etc/environment
echo "DATABASE_URL=$DATABASE_URL" >> /etc/environment
echo "CMC_API_KEY=$CMC_API_KEY" >> /etc/environment

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Apply Prisma migrations
echo "Applying Prisma migrations..."
npx prisma migrate deploy

# Run the init-symbols script and handle errors gracefully
echo "Initializing symbols..."
if ! npx ts-node src/init-symbols.ts; then
  echo "Warning: Failed to initialize symbols. (possibly b/c already done)"
fi

# Start cron service
echo "Starting cron service..."
service cron start

# Start the Node.js application
echo "Starting Node.js application..."
npm run dev
