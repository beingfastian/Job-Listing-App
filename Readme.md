# Job Listings Portal

A full-stack application for managing job listings with dual-database architecture, featuring both manual entry and automated web scraping functionality.

![Job Listings Portal](https://via.placeholder.com/800x400?text=Job+Listings+Portal)

## Features

- **Dual Database Architecture**:
  - **MongoDB**: Stores user-added jobs
  - **MySQL**: Stores scraped job listings
- **Job Management**:
  - Add, view, and delete job listings manually
  - Filter and sort jobs by company, location, and job type
  - View detailed job information including descriptions and contact info
- **Automated Scraping**:
  - Scheduled scraping of job listings from actuarylist.com
  - Manual trigger option for immediate scraping
  - Scraper status monitoring and job statistics
- **Responsive UI**:
  - Modern interface built with Next.js and Tailwind CSS
  - Mobile-friendly design for on-the-go access
- **Docker Integration**:
  - Containerized deployment for easy setup
  - Separate containers for each service (frontend, backend, MongoDB, MySQL)
  - Data persistence with Docker volumes

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Flask, SQLAlchemy, PyMongo
- **Databases**: MongoDB, MySQL
- **Web Scraping**: Selenium, Chrome WebDriver
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/job-listings-portal.git
   cd job-listings-portal
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Optional: Edit the `.env` file to customize settings.

3. **Make the helper script executable**:
   ```bash
   chmod +x run.sh
   ```

4. **Build and start the application**:
   ```bash
   ./run.sh build
   ./run.sh start
   ```

5. **Access the application**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)
   - Database Health Check: [http://localhost:5000/api/health/databases](http://localhost:5000/api/health/databases)

### Using the Helper Script

The included `run.sh` script provides several useful commands:

```bash
# Start all services
./run.sh start

# View logs from all services
./run.sh logs

# View logs from a specific service
./run.sh logs:backend
./run.sh logs:frontend
./run.sh logs:mysql
./run.sh logs:mongo

# Stop all services
./run.sh stop

# Restart all services
./run.sh restart

# Check status of all services
./run.sh status

# Rebuild all services
./run.sh build

# Remove all containers, networks, and volumes (CAUTION: deletes all data)
./run.sh clean

# Show help message
./run.sh help
```

## Project Structure

```
job-listings-portal/
├── backend/                     # Flask backend
│   ├── scraper/                 # Job scraping functionality
│   ├── app.py                   # Main Flask application
│   ├── config.py                # Application configuration
│   ├── Dockerfile               # Backend Docker configuration
│   ├── models.py                # MySQL database models
│   ├── mongo_models.py          # MongoDB database models
│   ├── requirements.txt         # Python dependencies
│   └── routes.py                # API endpoints
├── frontend/                    # Next.js frontend
│   ├── components/              # React components
│   ├── pages/                   # Next.js pages
│   ├── services/                # API services
│   ├── styles/                  # CSS styles
│   └── Dockerfile               # Frontend Docker configuration
├── mongo/                       # MongoDB configuration
│   └── Dockerfile               # MongoDB Docker configuration
├── mysql/                       # MySQL configuration
│   └── Dockerfile               # MySQL Docker configuration
├── mysql-init/                  # MySQL initialization
│   └── 01-schema.sql            # Database schema and sample data
├── .dockerignore                # Docker ignore file
├── .env.example                 # Example environment variables
├── docker-compose.yml           # Docker Compose configuration
├── run.sh                       # Helper script for managing the application
└── README.md                    # Project documentation
```

## Using the Application

### Manual Jobs Tab

1. **Add a new job**:
   - Click the "Add New Job" button
   - Fill in the job details
   - Click "Add Job"

2. **Filter jobs**:
   - Use the filter panel to filter by company, location, or job type
   - Click "Apply Filters" to update the results

3. **View job details**:
   - Click on a job card to expand and view full details
   - Use the "View Job" button to visit the original job posting

4. **Delete a job**:
   - Click the trash icon on a job card
   - Confirm deletion by clicking the icon again

### Scraped Jobs Tab

1. **View scraped jobs**:
   - Navigate to the "Scraped Jobs" tab to see all scraped jobs
   - Filter jobs using the same filter panel

2. **Run scraper manually**:
   - Click the "Run Scraper Now" button to trigger an immediate scrape
   - Wait for the scraper to complete (this may take a few minutes)

3. **View scraper statistics**:
   - See total job counts, companies, and last update time
   - Job cards indicate whether they came from MongoDB or MySQL

## API Endpoints

### Jobs

- `GET /api/jobs` - Get all jobs with optional filtering
- `POST /api/jobs` - Add a new job
- `DELETE /api/jobs/:id` - Delete a job by ID
- `GET /api/jobs/stats` - Get job statistics

### Scraper

- `POST /api/scraper/run` - Manually trigger the job scraper
- `GET /api/scraper/status` - Get the status of the job scraper

### Health Check

- `GET /api/health/databases` - Check database connections

## Database Details

### MongoDB (User Jobs)

- **Collection**: `user_jobs`
- **Data Model**:
  - `_id`: ObjectId (automatically generated)
  - `title`: String (required)
  - `company`: String (required)
  - Other fields match the MySQL schema

### MySQL (Scraped Jobs)

- **Table**: `jobs`
- **Data Model**:
  - `id`: Integer, Auto-increment
  - `title`: String (required)
  - `company`: String (required)
  - See `mysql-init/01-schema.sql` for full schema

## Troubleshooting

### Database Connection Issues

If you're experiencing database connection issues:

1. **Check the database health endpoint**:
   ```
   http://localhost:5000/api/health/databases
   ```

2. **View logs for specific services**:
   ```bash
   ./run.sh logs:mysql
   ./run.sh logs:mongo
   ```

3. **Verify environment variables**:
   - Check that the `.env` file has correct connection strings
   - Ensure port mappings aren't conflicting with existing services

### Container Issues

If containers won't start or are crashing:

1. **Check container status**:
   ```bash
   ./run.sh status
   ```

2. **View detailed logs**:
   ```bash
   ./run.sh logs
   ```

3. **Rebuild the containers**:
   ```bash
   ./run.sh clean
   ./run.sh build
   ./run.sh start
   ```

### Common Errors

1. **"Error connecting to MySQL/MongoDB"**:
   - Wait a few moments for databases to initialize
   - Check database logs for any startup errors

2. **"Address already in use"**:
   - Another service is using one of the required ports
   - Edit `.env` file to use different ports

3. **Scraper not working**:
   - Ensure your internet connection is active
   - Check if the target website structure has changed

## Development

### Local Development Setup

To develop without Docker:

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Docker](https://www.docker.com/) - Containerization platform
- [Selenium](https://www.selenium.dev/) - Web automation tool