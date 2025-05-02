# Medicine Authenticator

A web application to help verify the authenticity of medicines using barcode scanning and database verification.

## Features

- Barcode scanning for medicine verification
- Real-time authentication against a database
- User-friendly interface
- Secure API endpoints
- Responsive design

## Tech Stack

### Frontend

- React
- TypeScript
- React Router
- Axios
- Zod (for validation)

### Backend

- Node.js
- Express
- MongoDB
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/medicine-authenticator.git
cd medicine-authenticator
```

2. Install frontend dependencies

```bash
cd frontend
npm install
```

3. Install backend dependencies

```bash
cd ../backend
npm install
```

4. Set up environment variables
   Create a `.env` file in the backend directory with:

```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

5. Start the development servers

Frontend:

```bash
cd frontend
npm start
```

Backend:

```bash
cd backend
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
