# Todo List Application with Kanban Boards

A full-stack application for managing todo lists and kanban boards with user authentication.
**[Work in Progress]**

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT
- Containerization: Docker
- Testing: Jest and React Testing Library

## Current Status

🚧 **Project Under Development** 🚧

- ✅ Project structure setup
- ✅ Docker configuration
- 🏗️ Frontend development (In Progress)
- 🏗️ Backend API implementation (In Progress)
- ⏳ Database schema implementation (Pending)
- ⏳ Authentication system (Pending)
- ⏳ Testing suite (Pending)

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (optional)

## Getting Started

1. Clone the repository (or download the files)
```bash
git clone <repository-url>
cd todo-kanban-app
```

2. Environment Setup
```bash
# Copy the example env file
cp .env.example .env
# Update the .env file with your settings
```

3. Start the Application
```bash
# Build and start all containers
docker-compose up -d
```

4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## Project Structure

```
├── frontend/          # React frontend application
│   ├── src/          # Source files
│   ├── tests/        # Test files
│   └── Dockerfile    # Frontend container configuration
├── backend/          # Node.js backend API
│   ├── src/          # Source files
│   ├── tests/        # Test files
│   └── Dockerfile    # Backend container configuration
├── docker/           # Docker configuration files
└── database/         # Database migrations and seeds
```

## API Documentation

The API documentation is available at `http://localhost:8080/api-docs` when running the application.

## Database Schema

See `schema.txt` for a detailed database schema diagram.

## Development

### Running Tests
```bash
# Frontend tests
docker-compose exec frontend npm test

# Backend tests
docker-compose exec backend npm test
```

### Linting
```bash
# Frontend
docker-compose exec frontend npm run lint

# Backend
docker-compose exec backend npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Known Issues

- Database migrations not yet implemented
- Authentication system under development
- Test coverage incomplete

## Roadmap

1. Complete basic CRUD operations for todos
2. Implement user authentication
3. Add Kanban board functionality
4. Implement drag-and-drop features
5. Add unit and integration tests
6. Deploy production version