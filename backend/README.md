# School ERP SaaS - Backend

This is the backend service for the School ERP SaaS application, built with Node.js, Express, and PostgreSQL.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- npm or yarn

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-erp-saas/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update the environment variables in `.env` with your configuration

4. **Set up the database**
   - Create a new PostgreSQL database
   - Update the database connection details in `.env`

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database**
   ```bash
   npm run db:seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Access the API documentation**
   - Open `http://localhost:8000/api-docs` in your browser

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests
- `npm run lint` - Lint the code
- `npm run lint:fix` - Fix linting issues
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:setup` - Initialize the database with sample data

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── seeders/          # Database seeders
│   ├── migrations/       # Database migrations
│   ├── app.js            # Express application
│   └── server.js         # Server entry point
├── tests/               # Test files
├── .env                 # Environment variables
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── .sequelizerc         # Sequelize CLI configuration
├── package.json         # Project dependencies
└── README.md            # This file
```

## API Documentation

API documentation is available at `/api-docs` when the server is running. The documentation is generated using Swagger/OpenAPI.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the `Authorization` header for protected routes:

```
Authorization: Bearer <token>
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment (development, production) | development |
| PORT | Port to run the server on | 8000 |
| API_PREFIX | API route prefix | /api |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | |
| DB_NAME | Database name | school_erp |
| JWT_SECRET | Secret key for JWT | |
| JWT_EXPIRES_IN | JWT expiration time | 1h |
| JWT_REFRESH_SECRET | Secret key for refresh token | |
| JWT_REFRESH_EXPIRES_IN | Refresh token expiration time | 7d |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| REDIS_PASSWORD | Redis password | |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## Testing

To run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Deployment

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running
- Redis 6+ running
- Environment variables configured

### Production

1. Install production dependencies:
   ```bash
   npm install --production
   ```

2. Run migrations:
   ```bash
   NODE_ENV=production npx sequelize-cli db:migrate
   ```

3. Start the server:
   ```bash
   NODE_ENV=production npm start
   ```

### Docker

1. Build the Docker image:
   ```bash
   docker build -t school-erp-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env school-erp-backend
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Support

For support, email support@example.com or join our [Slack channel](#).

## Acknowledgements

- [Express](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Redis](https://redis.io/)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/)

## Roadmap

- [x] Project setup and configuration
- [x] Authentication and authorization
- [ ] User management
- [ ] School and branch management
- [ ] Student management
- [ ] Staff management
- [ ] Fee management
- [ ] Attendance system
- [ ] Exam and result management
- [ ] Timetable management
- [ ] Library management
- [ ] Transport management
- [ ] Hostel management
- [ ] Accounting
- [ ] Reports and analytics
- [ ] Mobile app
- [ ] Multi-language support

## Contributors

- [Your Name](https://github.com/yourusername)
