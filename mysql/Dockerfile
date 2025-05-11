FROM mysql:8.0-debian

# Add MySQL configuration if needed
# COPY my.cnf /etc/mysql/conf.d/my.cnf

# Set environment variables (can be overridden in docker-compose)
ENV MYSQL_DATABASE=job_listings
ENV MYSQL_USER=honey
ENV MYSQL_PASSWORD=12345
ENV MYSQL_ROOT_PASSWORD=root

# Create directory for data
RUN mkdir -p /var/lib/mysql && chown -R mysql:mysql /var/lib/mysql

# Create initialization script (optional)
COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose the default MySQL port
EXPOSE 3306

# Use the default CMD from the base image
# CMD ["mysqld"]