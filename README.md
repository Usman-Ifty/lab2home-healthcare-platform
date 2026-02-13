# Lab2Home - Healthcare Management Platform

A modern healthcare management platform with role-based dashboards for patients, labs, phlebotomists, and administrators.

## 🏗️ Project Structure

This is a monorepo using **npm workspaces** with two main parts:

```
Lab2Home/
├── src/                  # Frontend (React + Vite + TypeScript)
├── backend/              # Backend API (Node.js + Express + TypeScript)
└── package.json          # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

Install all dependencies for both frontend and backend with a single command:

```bash
npm install
```

This will install dependencies for the root workspace and the backend workspace automatically.

### Development

Run both frontend and backend concurrently:

```bash
npm run dev
```

This starts:
- **Frontend** at `http://localhost:5173` (Vite dev server)
- **Backend** at `http://localhost:5000` (Express API)

### Run Individual Workspaces

Run only the frontend:
```bash
npm run dev:frontend
```

Run only the backend:
```bash
npm run dev:backend
```

## 📦 Available Scripts

### Root Workspace Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend and backend concurrently |
| `npm run dev:frontend` | Run frontend only |
| `npm run dev:backend` | Run backend only |
| `npm run build` | Build frontend for production |
| `npm run build:backend` | Build backend for production |
| `npm run build:all` | Build both frontend and backend |
| `npm run start:backend` | Start production backend server |
| `npm run lint` | Lint frontend code |
| `npm run preview` | Preview production frontend build |
| `npm run clean` | Remove all node_modules and build artifacts |
| `npm install` | Install all workspace dependencies |

### Backend-Specific Scripts

To run backend commands directly:

```bash
npm run dev --workspace=backend
npm run build --workspace=backend
npm run start --workspace=backend
```

## 🎭 User Roles & Demo Credentials

The platform supports 4 user roles with pre-configured demo accounts:

### 1. Patient Portal
- **Email:** `patient@lab2home.com`
- **Password:** `patient123`
- **Features:** Book tests, view reports, health dashboard, marketplace

### 2. Laboratory Portal
- **Email:** `lab@lab2home.com`
- **Password:** `lab123`
- **Features:** Manage appointments, upload reports, patient management

### 3. Phlebotomist Portal
- **Email:** `phlebotomist@lab2home.com`
- **Password:** `phleb123`
- **Features:** Route optimization, sample collection, schedule management

### 4. Admin Portal
- **Email:** `admin@lab2home.com`
- **Password:** `admin123`
- **Features:** User management, lab management, system oversight

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui + Radix UI
- **Animations:** Framer Motion + GSAP
- **Forms:** React Hook Form + Zod
- **Routing:** React Router DOM
- **State:** React Query

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer
- **Real-time:** Socket.io

## 📁 Frontend Structure

```
src/
├── components/
│   ├── home/           # Landing page components
│   ├── shared/         # Shared components (Layout, StatCard, etc.)
│   └── ui/             # shadcn/ui components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   ├── Login.tsx       # Login page
│   ├── Signup.tsx      # Signup page
│   ├── PatientDashboard.tsx
│   ├── LabDashboard.tsx
│   └── PhlebotomistDashboard.tsx
├── lib/                # Utilities and API client
└── main.tsx            # Application entry point
```

## 📁 Backend Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Express middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   └── server.ts       # Server entry point
└── tsconfig.json       # TypeScript config
```

## 🔧 Workspace Management

### Adding New Dependencies

**Frontend dependencies:**
```bash
npm install <package-name>
```

**Backend dependencies:**
```bash
npm install <package-name> --workspace=backend
```

**Shared dev dependencies (TypeScript, etc.):**
```bash
npm install <package-name> -D
```

### Clean Install

If you encounter dependency issues:

```bash
npm run clean
npm install
```

## 🌟 Features

- ✅ Role-based authentication and authorization
- ✅ Protected routes with automatic redirection
- ✅ Beautiful, responsive UI with dark mode support
- ✅ Animated dashboards with real-time statistics
- ✅ Form validation with Zod schemas
- ✅ Toast notifications for user feedback
- ✅ RESTful API architecture
- ✅ MongoDB integration
- ✅ File upload with Cloudinary
- ✅ Email notifications
- ✅ Real-time updates with Socket.io

## 🚧 Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test:**
   ```bash
   npm run dev
   ```

3. **Lint your code:**
   ```bash
   npm run lint
   ```

4. **Build for production:**
   ```bash
   npm run build:all
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

## 📝 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (backend/.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

## 🐛 Troubleshooting

### Issue: Dependencies not installing
**Solution:** Clean install
```bash
npm run clean
npm install
```

### Issue: Backend not starting
**Solution:** Check if backend dependencies are installed
```bash
npm install --workspace=backend
```

### Issue: Port already in use
**Solution:** Change port in backend/.env or kill the process
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Issue: TypeScript errors
**Solution:** Ensure workspace dependencies are properly installed
```bash
npm run clean
npm install
```

## 📄 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

Built with ❤️ by the Lab2Home Team

