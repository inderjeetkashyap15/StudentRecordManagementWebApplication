# EduNexus — Student Record Management Web Application

A full-stack Student Record Management Web Application built with the **MEAN**-style stack (**MongoDB**, **Express.js**, **AngularJS 1.8**, and **Node.js**).

![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20AngularJS%20%7C%20MongoDB-indigo)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- 🎓 **Complete CRUD Operations**:
  - **Add Student**: Intuitive modal with real-time form validation (Student ID, Name, Email, Course, Semester, Mobile Number).
  - **Display Student Records**: Interactive table with sorting, colored course badges, and student initials avatars.
  - **Update Student**: Pre-filled update modal with instant validation.
  - **Delete Student**: Safe deletion with warning confirmation modal.
  - **Search & Filter**: Live debounced multi-field search (by Name, ID, Course, Email) and dropdown filters for course and semester.
- 🪪 **Digital Student Identity Pass**: View high-fidelity digital ID card badge modal for any student.
- 📊 **Dynamic Dashboard Metrics**: Overview widgets displaying Total Students, Courses Offered, Semesters covered, and DB status.
- 🗂 **Dual View Modes**: Seamlessly toggle between a Data Table View and a modern Card Grid View.
- 🔔 **Toast Notification System**: Instant user feedback for actions and errors.
- 💾 **Intelligent MongoDB Adapter**:
  - Connects to local MongoDB or MongoDB Atlas via `MONGODB_URI`.
  - Automatically spins up an embedded in-memory MongoDB fallback with demo data if no external database daemon is active.

---

## Student Record Fields

| Field | Type | Rules | Example |
|---|---|---|---|
| **Student ID** | String | Required, Unique, Alphanumeric | `STU-1001` |
| **Student Name** | String | Required, Min 2 chars | `Aarav Sharma` |
| **Email** | String | Required, Valid Email, Unique | `aarav.sharma@example.com` |
| **Course** | String | Required (e.g. Computer Science) | `Data Science & AI` |
| **Semester** | Number | Required (1 to 8) | `6` |
| **Mobile Number** | String | Required, 10 digits | `9876543210` |

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional)* MongoDB running locally or a MongoDB Atlas URI

### Installation & Run

1. Clone or navigate into the repository:
   ```bash
   cd StudentRecordManagementWebApplication
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Start the application:
   ```bash
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## REST API Endpoints

- `GET /api/students` — Retrieve all students (supports `?search=`, `?course=`, `?semester=`)
- `GET /api/students/:id` — Retrieve a single student by Mongo `_id` or `studentId`
- `POST /api/students` — Register a new student record
- `PUT /api/students/:id` — Update existing student details
- `DELETE /api/students/:id` — Delete a student record
- `GET /api/students/stats` — Retrieve aggregated dashboard metrics
- `POST /api/students/seed` — Seed sample student records for instant testing
- `GET /api/health` — Check server and database connection status
