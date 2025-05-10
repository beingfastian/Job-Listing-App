FROM mongo:6.0-focal

# Add health check for faster service availability detection
HEALTHCHECK --interval=5s --timeout=3s --retries=3 CMD mongosh --eval "db.adminCommand('ping')" || exit 1

# Optimize for faster startup and lower memory usage
RUN echo "mongod --wiredTigerCacheSizeGB=0.25 --bind_ip_all" > /usr/local/bin/docker-entrypoint-initdb.d

# Expose MongoDB port
EXPOSE 27017

CMD ["mongod"]