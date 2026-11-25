
# 🎓 EduSphere - Learning Management System

## End Semester Hackathon Project

EduSphere is a full-stack Learning Management System
designed to simplify online education, academic
management and communication between students,
faculty members and administrators.

## 📌 Project Abstract

EduSphere provides a digital learning platform where
students can enroll in courses, submit assignments,
attempt quizzes, track academic progress, view grades
and generate course completion certificates.

Faculty members can create courses, publish assignments,
create quizzes and evaluate student submissions.

Administrators can manage registered users, create
faculty accounts and monitor academic statistics.

## 🚀 Features

### Student Portal

- Student Registration and Login
- Course Enrollment
- Assignment Submission
- Online Quizzes
- Progress Tracking
- Grades and Results
- Certificate Generation
- Discussion Forum
- Profile Management

### Faculty Portal

- Faculty Authentication
- Course Creation
- Assignment Publishing
- Student Assignment Evaluation
- Quiz Creation
- Student Progress Monitoring
- Discussion Forum
- Profile Management

### Admin Portal

- Separate Administrator Dashboard
- Total Users Statistics
- Student Management
- Faculty Management
- Faculty Account Creation
- User Search and Filtering
- Academic Reports
- Administrator Profile

### Additional Features

- Professional User Interface
- Dark Mode and Light Mode
- Responsive Website Design
- Form Validation
- Password Hashing
- Session-Based Authentication
- Role-Based Access Control
- REST API Integration
- Local Storage for Theme Preferences
- SQLite Database

## 💻 Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website structure |
| CSS3 | Styling and responsive design |
| JavaScript | Application logic |
| React.js | Frontend development |
| Vite | Frontend development server |
| Node.js | Backend runtime |
| Express.js | REST API development |
| SQLite | Database storage |
| Local Storage | Save theme preferences |
| Git | Version control |
| GitHub | Source code hosting |

## 🏗️ System Architecture

    User
      |
      v
    React.js Frontend
      |
      v
    Fetch API / REST API
      |
      v
    Node.js + Express.js Backend
      |
      v
    SQLite Database

## 📂 Project Structure

    EDUSPHERE/
    |
    |-- src/
    |   |-- Admin.jsx
    |   |-- admin.css
    |   |-- data.js
    |   |-- main.jsx
    |   |-- style.css
    |
    |-- admin.js
    |-- server.js
    |-- index.html
    |-- package.json
    |-- package-lock.json
    |-- vite.config.js
    |-- .gitignore
    |-- README.md

## 🔐 Form Validation

The application implements frontend and backend
validation to ensure valid user inputs.

- Required field validation
- Email format validation
- Password length validation
- Duplicate email validation
- Invalid login detection
- Marks range validation from 0 to 100

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/register | Student registration |
| POST | /api/login | User authentication |
| POST | /api/logout | User logout |
| GET | /api/state | Retrieve academic data |
| POST | /api/action | Perform LMS operations |
| GET | /api/admin/dashboard | Admin statistics |
| GET | /api/admin/users | Retrieve users |
| POST | /api/admin/faculty | Create faculty account |

## 💾 Database

SQLite is used to store application data permanently.

### Database Tables

- users
- sessions
- academic_data

The database stores registered users, password hashes,
login sessions, courses, assignments, quiz results,
grades, progress and discussion messages.

The database file is automatically generated when
the backend server is started.

## 📦 Local Storage

Browser Local Storage is used to store the user's
Dark Mode and Light Mode preferences.

### Local Storage Keys

- edu-dark-mode
- theme

The selected theme is retained after refreshing
the website.

Passwords are not stored in Local Storage.

## ⚙️ Installation and Execution

### Prerequisites

- Node.js 24 LTS or compatible newer version
- npm
- Visual Studio Code
- Git

### Step 1: Clone Repository

    git clone https://github.com/2500031706/END-SEM_HACKATHON.git

### Step 2: Open Project Folder

    cd END-SEM_HACKATHON

### Step 3: Install Dependencies

    npm install

### Step 4: Configure Environment Variables

Create a .env file in the project root.

    PORT=3000
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
    FACULTY_EMAIL=faculty@example.com
    FACULTY_PASSWORD=YOUR_FACULTY_PASSWORD

Replace the password placeholders with unique
passwords containing at least eight characters.

Do not upload the .env file to GitHub.

### Step 5: Start Backend Server

Open the first terminal and execute:

    npm run server

### Step 6: Start Frontend Server

Open another terminal and execute:

    npm run dev

### Step 7: Open Application

Open the URL displayed in the Vite terminal.

Default URL:

http://localhost:5173/

Both frontend and backend servers must be running.

## 🧪 Testing

- Student Registration
- Login Authentication
- Form Validation
- Course Enrollment
- Assignment Submission
- Quiz Evaluation
- Faculty Grading
- Certificate Generation
- Admin Dashboard
- Local Storage
- Database Persistence

## 🎯 Advantages

- Centralized academic management
- Easy access to learning resources
- Automated quiz evaluation
- Role-based user dashboards
- Permanent database storage
- User-friendly interface
- Improved student-faculty communication

## 🔮 Future Enhancements

- Video lectures
- Assignment file uploads
- Email notifications
- AI-based learning recommendations
- Direct PDF certificate downloads
- Online examinations
- Cloud deployment
- Mobile application

## 📝 Conclusion

EduSphere demonstrates the integration of frontend
development, backend programming, database management,
REST APIs, form validation, authentication and browser
Local Storage in a full-stack educational application.

This project was developed for the End Semester
Hackathon.

## 🔗 GitHub Repository

https://github.com/2500031706/END-SEM_HACKATHON

---

**EduSphere - Learn. Connect. Grow.**
