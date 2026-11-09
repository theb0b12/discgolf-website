# Feature Specification: Saved Courses

## Overview
The **Saved Courses** feature allows disc golfers to save course layouts (hole count and default pars per hole) locally in their browser. This eliminates the repetitive task of manually adjusting hole counts and individual pars every time a round is started at a frequently played course.

---

## 1. Data Structure

Saved courses will be stored in `localStorage` under the key `discGolfCourses`.

### JSON Schema
```json
[
  {
    "id": "course_1710000000000",
    "name": "Ghost Town DGC",
    "layout": "Main 18",
    "holeCount": 18,
    "pars": [3, 4, 3, 3, 5, 3, 4, 3, 3, 3, 4, 3, 3, 5, 3, 4, 3, 3]
  }
]
```

### Properties
- `id` *(string)*: Unique identifier (timestamp + random hash) to ensure precise updates/deletions.
- `name` *(string)*: Course title (e.g., "Beaver Ranch").
- `layout` *(string, optional)*: Layout descriptor (e.g., "Gold Tees", "Shorts").
- `holeCount` *(number)*: Total number of holes (1–21).
- `pars` *(array of numbers)*: Individual par for each hole.

---

## 2. User Experience & Flows

### A. Selecting a Saved Course (Homepage / Calculator)
1. At the top of `index.html`, a dropdown allows the user to select from their list of saved courses or choose **"Custom / New Course"**.
2. When a saved course is selected:
   - Course Name input is auto-filled.
   - Hole count input is updated.
   - Hole rows render with the course's predefined pars automatically filled in.

### B. Quick-Saving a New Course Layout
1. When a user finishes entering pars/scores on `index.html` and clicks **"Save Round"**:
   - If the course name does not match an existing saved course, offer a quick toggle/checkbox: `[x] Save this course layout for future rounds`.
   - If checked, the layout is automatically committed to `localStorage.getItem("discGolfCourses")`.

### C. Course Management
- Add a lightweight section or dedicated management view where users can:
  - View all saved courses.
  - Edit hole pars for existing saved courses.
  - Delete unwanted course presets.

---

## 3. Technical Roadmap & Functions

### Key Methods to Add (`app.js` / Course Helper)
- `getSavedCourses()`: Retrieves and parses `discGolfCourses` from `localStorage`.
- `saveCourse(courseData)`: Appends or updates a course in `localStorage`.
- `deleteCourse(id)`: Removes a course preset by ID.
- `loadCourseIntoCalculator(courseId)`: Populates `index.html` inputs and renders hole rows according to the saved course template.

---

## 4. Backwards Compatibility & Edge Cases
- **No Saved Courses Existing**: Default back to the current behavior (manual hole count & default par input).
- **Modifying Pars Mid-Round**: Changing a par during a round won't overwrite the original saved course preset unless explicitly updated by the user.