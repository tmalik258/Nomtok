FROM python:3.13-slim-bookworm

WORKDIR /code

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
wget \
gnupg \
ca-certificates \
fonts-liberation \
libasound2 \
libatk-bridge2.0-0 \
libatk1.0-0 \
libatspi2.0-0 \
libdrm2 \
libgtk-3-0 \
libnspr4 \
libnss3 \
libx11-xcb1 \
libxcomposite1 \
libxdamage1 \
libxext6 \
libxfixes3 \
libxrandr2 \
xdg-utils \
ffmpeg \
fonts-liberation \
xvfb \
xauth \
cron \
&& rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install yt-dlp nightly for latest fixes (ensure upgrade over requirements.txt)
RUN pip install --no-cache-dir --upgrade --pre "yt-dlp[default]"

# Add Google Chrome repo and install
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright (browsers will auto-detect Chrome)
RUN pip install --no-cache-dir playwright playwright-stealth
RUN playwright install --with-deps chrome  # Installs deps + links to system Chrome

# Copy application code
COPY . .

# Copy ops scripts for daily updates
COPY ops/auto-update-ytdlp.sh /usr/local/bin/auto-update-ytdlp
RUN chmod +x /usr/local/bin/auto-update-ytdlp

# Create update script for yt-dlp
RUN echo '#!/bin/bash\nset -e\npip install --no-cache-dir --upgrade --pre "yt-dlp[default]"' > /usr/local/bin/update-ytdlp && \
    chmod +x /usr/local/bin/update-ytdlp

# Create logs directory and register cron job for daily updates at 03:15
RUN mkdir -p /code/logs && \
    echo '15 3 * * * root /usr/local/bin/auto-update-ytdlp >> /code/logs/yt-dlp-updater.log 2>&1' > /etc/cron.d/yt-dlp-updater && \
    chmod 0644 /etc/cron.d/yt-dlp-updater && \
    touch /code/logs/yt-dlp-updater.log

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
