# Todo List Application with Kanban Boards

A full-stack application for managing todo lists and kanban boards with real-time chat, user authentication, and dark mode support.

## Features

- ✅ User Authentication (Register/Login)
- ✅ Board Creation and Management
- ✅ Kanban Board Interface
- ✅ Real-time Board Chat
- ✅ Dark Mode Support
- ✅ Drag and Drop Tasks
- ✅ Task Comments System
- ✅ User Profiles
- ✅ Board Member Management
- ✅ Modern Material-UI Interface

## Tech Stack

### Frontend
- React.js
- Material-UI
- Socket.IO Client
- React Router
- React Beautiful DnD
- Context API for State Management

### Backend
- Node.js
- Express
- PostgreSQL
- Socket.IO
- JWT Authentication
- Bcrypt

### Infrastructure
- Docker
- Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Node.js (for local development)
- Git

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd todo-app
```

2. Create `.env` file in the root directory:
```env
DB_USER=postgres
DB_PASSWORD=demos
DB_NAME=tododb
JWT_SECRET=your_generated_secret
```

3. Build and start the containers:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
todo-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/      # Context providers
│   │   └── services/     # API services
│   └── Dockerfile
├── server/                # Node.js backend
│   ├── src/
│   │   └── index.js      # Main server file
│   └── Dockerfile
├── docker-compose.yml
└── .env
```

## Features in Detail

### Authentication
- User registration with username
- Secure login with JWT
- Password hashing with bcrypt

### Board Management
- Create and view boards
- Add lists to boards
- Create and manage tasks
- Drag and drop tasks between lists

### Real-time Features
- Board chat with instant updates
- Task comments
- User presence indicators

### User Interface
- Dark/Light mode toggle
- Responsive design
- Modern Material-UI components
- Intuitive navigation

## Database Schema

The application uses PostgreSQL with the following main tables:
- users
- boards
- lists
- tasks
- board_members
- board_chat_messages
- card_comments

## Development

To run the application in development mode:

1. Start the database:
```bash
docker-compose up postgres
```

2. Run the backend:
```bash
cd server
npm install
npm run dev
```

3. Run the frontend:
```bash
cd client
npm install
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

- Chat messages require page refresh to show up initially
- Some UI elements need dark mode refinement
- Mobile responsiveness needs improvement

## Future Enhancements

- [ ] Add file attachments to tasks
- [ ] Implement board templates
- [ ] Add due dates and reminders
- [ ] Enhance mobile experience
- [ ] Add activity log
- [ ] Implement board sharing
- [ ] Add task labels and filtering

## License

This project is licensed under the MIT License.