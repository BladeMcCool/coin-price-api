FROM node:21

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application
COPY . .

# Install cron
RUN apt-get update && apt-get install -y cron

# Copy the cron job configuration file
COPY cronjob /etc/cron.d/cronjob

# Give execution rights on the cron job
RUN chmod 0644 /etc/cron.d/cronjob

# Create the log file to be able to run tail
RUN touch /var/log/cron.log

# Expose the port your app runs on
EXPOSE 3000

# Run migrations and start cron and the Node.js application
# todo this stuff should go in a script, but i'm running out of time.
CMD npx prisma generate && npx prisma migrate deploy && npx ts-node src/init-symbols.ts || true && cron && npm run dev
