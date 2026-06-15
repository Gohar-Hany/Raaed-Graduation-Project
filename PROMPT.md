# Project Prompt: AI Educational Platform (Raaed) - Phase 2 Implementation

You are working on an AI Educational Platform called **Raaed**. The system uses a **FastAPI** backend connected to **MongoDB Atlas** (cloud database) and a **React/Vite** frontend styled with vanilla Tailwind CSS. 

Below is a detailed, professional specification of the issues to resolve and the new system features to implement.

---

## 1. Bug Fixes (Student Quiz Screen)

### A. Quiz Score Circle Progress Bar
- **Issue**: When a student finishes a quiz or views a completed quiz, the score circle shows the percentage (e.g. `20%`), but the colored circular progress line (the stroke) is completely invisible.
- **Root Cause**: In [StudentQuiz.jsx](file:///d:/Raaed/frontend/src/pages/student/StudentQuiz.jsx), the SVG `<circle>` for the progress indicator is missing the `stroke="currentColor"` attribute. Tailwind color classes (like `text-danger-500` or `text-accent-500`) are applied via `className`, but they do not affect the stroke unless `stroke="currentColor"` is explicitly defined.
- **Fix**: Update the second `<circle>` in the SVG to include `stroke="currentColor"`.

### B. Empty Answer Review Data
- **Issue**: The "Review Answers" list at the bottom of the quiz results screen is blank/empty, even though the user answered questions and got a score.
- **Root Cause**:
  1. When viewing an already completed assigned quiz, the frontend calls `getCompletedQuizzes(user.id)`. The backend returns a list of completed quizzes with their stored answers dictionary (keys: `"0"`, `"1"`, etc.).
  2. If the user just completed the quiz, the state transitions, but if the local `answers` array state is not properly synced, or if `quizItem.pastAnswers` parsing fails to set the state array, the render mapper `answers.map()` receives an empty array.
  3. Ensure that when completing a quiz, `setQuizScore` and `setQuizTotal` are called for *both* assigned and custom quizzes.
  4. Ensure `pastAnswers` parsing safely converts the database answers dictionary to an array and populates the `answers` state.

---

## 2. New Feature: Admin Student & Role Management Dashboard

Connect the system together by building a comprehensive admin control panel. The master admin (logged in as `goharhany@gmail.com`) must be able to view students, inspect their quiz scores, and manage user roles.

### A. Database & Backend Endpoints
In `src/routes/admin.py` (or a dedicated route file), implement the following endpoints (protected by the JWT admin authentication dependency):
1. **GET `/api/v1/admin/users`**:
   - Fetch all users from the `users` collection.
   - Return names, emails, roles, and registration dates. (Exclude `password_hash`).
2. **PUT `/api/v1/admin/users/{user_id}/role`**:
   - Update a user's role (e.g., change from `student` to `admin` or vice-versa).
   - **Crucial Rule**: Only the primary super admin (`goharhany@gmail.com`) can perform role changes. Other users with the `admin` role should receive a `403 Forbidden` error if they attempt to change anyone's role.
3. **GET `/api/v1/admin/users/{user_id}/results`**:
   - Fetch all quiz attempts and results from the `student_results` collection for a specific user ID.
   - Return scores, total questions, topics, completion timestamps, and detailed answers.

### B. Frontend Admin UI Pages & Routing
1. **Student Management View**:
   - Create a premium, responsive React page (e.g., `/admin/students` or integrated into the Admin navigation panel).
   - Display a list of all registered students in a clean, professional table with search/filtering capabilities.
2. **Role Control Toggle**:
   - In the student list, add a role badge/button. Clicking it allows promoting a student to `admin` or demoting an admin to `student`.
   - Prevent the master admin (`goharhany@gmail.com`) from demoting themselves.
   - Show appropriate feedback/toast messages on success or error.
3. **Student Progress & Score Viewer**:
   - Clicking on any student in the list opens their **Progress Profile**.
   - Show stats: total quizzes taken, average score, and a list of all their completed quizzes.
   - Include a detailed view where the admin can see the exact questions the student answered, what they selected, and what the correct answers were.

---

## 3. System Compilation & Verification
- Verify that both the FastAPI backend and Vite frontend run without compile-time or runtime console errors.
- Ensure MongoDB database queries are optimized and handle edge cases (e.g., a student with no completed quizzes).
