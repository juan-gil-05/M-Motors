# Use an official and lightweight Python runtime base image
FROM python:3.11-slim

# Set environment variables to optimize Python inside Docker
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies needed for compiling certain packages (like PostgreSQL drivers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker's cache system
COPY requirements.txt /app/

# Install Python dependencies listed in the requirements file
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source code into the container
COPY . /app/

# Expose the default port Django runs on
EXPOSE 8000

# Default command to start the Django local development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]