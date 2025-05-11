FROM mongo:5.0

# Add MongoDB configuration file if needed
# COPY mongod.conf /etc/mongod.conf

# Set environment variables (can be overridden in docker-compose)
ENV MONGO_INITDB_DATABASE=job_listings

# Create directory for data
RUN mkdir -p /data/db && chown -R mongodb:mongodb /data/db

# Expose the default MongoDB port
EXPOSE 27017

# Use the default CMD from the base image
# CMD ["mongod"]