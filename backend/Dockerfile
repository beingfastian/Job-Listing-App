FROM python:3.11-slim

WORKDIR /app

# Install Chrome and dependencies in optimized layers
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    unzip \
    default-libmysqlclient-dev \
    pkg-config \
    gcc \
    build-essential \
    # Chrome dependencies - minimal set
    libnss3 \
    libglib2.0-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxss1 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome and ChromeDriver in a single layer
RUN wget -q -O chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y --no-install-recommends ./chrome.deb \
    && rm chrome.deb \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && CHROME_DRIVER_VERSION=$(google-chrome --version | awk '{print $3}' | cut -d. -f1) \
    && CHROME_DRIVER_URL=$(wget -qO- "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_${CHROME_DRIVER_VERSION}") \
    && wget -q --no-verbose -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/${CHROME_DRIVER_URL}/chromedriver_linux64.zip" \
    && unzip /tmp/chromedriver.zip -d /usr/local/bin/ \
    && rm /tmp/chromedriver.zip \
    && chmod +x /usr/local/bin/chromedriver

# Copy only requirements first
COPY requirements.txt .

# Install Python dependencies with build caching
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DOCKER_ENV=true

# Expose the port
EXPOSE 5000

# Command to run application
CMD ["python", "app.py"]