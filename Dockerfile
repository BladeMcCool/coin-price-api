FROM ubuntu:latest

# Install necessary packages
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    cron \
    build-essential \
    vim

# Install nvm
ENV NVM_DIR /usr/local/nvm
# Select the version used during dev for the moment # todo figure out best practices around node version selection.
ENV NODE_VERSION 21.6.2
ENV EDITOR vim

RUN mkdir -p $NVM_DIR \
    && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm use $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/node /usr/local/bin/node \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/npm /usr/local/bin/npm \
    && ln -s $NVM_DIR/versions/node/v$NODE_VERSION/bin/npx /usr/local/bin/npx

# Install ts-node globally
RUN npm install -g ts-node

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application
COPY . .

# Copy the entrypoint script
COPY entrypoint.sh /usr/src/app/entrypoint.sh

# Copy the cron job configuration file (can't seem to get it to run stuff in /etc/cron.d ?? so replacing main crontab)
COPY cronjob /etc/crontab

# Give execution rights on the cron job
RUN chmod 0644 /etc/crontab

# Create the log files to be able to run tail
# RUN touch /var/log/cron.log /var/log/cron-test.log

# Expose the port your app runs on
EXPOSE 3000

# Set the entrypoint script as the container's entrypoint
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]