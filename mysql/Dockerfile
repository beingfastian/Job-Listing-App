FROM mysql:8.0-debian

# Add health check for faster service availability detection
HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD mysqladmin ping -h localhost -u root --password=${MYSQL_ROOT_PASSWORD} || exit 1

# Copy initialization scripts
COPY mysql-init/ /docker-entrypoint-initdb.d/

# Set environment variables
ENV MYSQL_ROOT_PASSWORD=rootpass
ENV MYSQL_DATABASE=job_listings
ENV MYSQL_USER=honey
ENV MYSQL_PASSWORD=12345

# Optimize for faster startup
ENV MYSQL_INITDB_SKIP_TZINFO=1

# Configure MySQL for faster startup and lower memory usage
RUN echo "[mysqld]" > /etc/mysql/conf.d/custom.cnf && \
    echo "innodb_buffer_pool_size = 64M" >> /etc/mysql/conf.d/custom.cnf && \
    echo "innodb_log_file_size = 16M" >> /etc/mysql/conf.d/custom.cnf && \
    echo "max_connections = 50" >> /etc/mysql/conf.d/custom.cnf && \
    echo "default-authentication-plugin = mysql_native_password" >> /etc/mysql/conf.d/custom.cnf

EXPOSE 3306

CMD ["mysqld"]