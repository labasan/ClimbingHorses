# MoonBoard Race & Schedule App

A mobile-first React application designed to gamify Moonboard training. It features a live "Horse Race" leaderboard based on grade benchmarks, a session scheduler to coordinate climbing days, and individual climber logbooks.

## Features

### 1. 📅 Session Calendar (Drill Down 1)
* **Weekly View:** Displays a rolling 7-day window.
* **Coordination:** Users can log their intended climbing sessions (Who, Where, When) so groups can coordinate training times.
* **Live Updates:** Changes sync in real-time for all users.

### 2. 🏆 Race Leaderboards (Drill Down 2)
* **Grade-Based Races:** Select a specific grade (e.g., 6B+, 6C) to see a progress bar race.
* **Gamification:**
    * **Distance:** The "track" length is determined by the total number of benchmarks in that grade.
    * **Position:** Calculated by `(User Completions / Total Benchmarks) * 100`.
    * **Visuals:** Users are assigned unique colors; progress is visualized as a "Horse Race."

### 3. 📖 Digital Logbook (Drill Down 3)
* **Personal Tracking:** Filter by individual climber.
* **Smart Filters:** Toggle between "Completed Climbs" (Sends) and "All Benchmarks" (Project list).
* **Filtering:** Drill down by specific grades to see what is left to tick.

---

## Tech Stack

* **Frontend:** React (Vite), TypeScript
* **Styling:** Tailwind CSS (Mobile-first responsive design)
* **Icons:** Lucide React
* **Backend / Database:** Firebase Firestore (Real-time NoSQL)

---

## Setup & Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/moonboard-race.git](https://github.com/yourusername/moonboard-race.git)
cd moonboard-race

```

### 2. Install Dependencies

`npm install`

### 3. Firebase Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Register a generic "Web App".
4. Copy your `firebaseConfig` object.
5. Create a file `src/firebase.ts` and paste your config:

// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


### 4. Database Setup (Firestore)

You need to create the following collections in your Firestore database.

**Collection: `benchmarks**` (The Problems)

* `name` (string)
* `grade` (string) - e.g., "6B+", "6C"

**Collection: `users**` (The Climbers)

* `name` (string)
* `color` (hex string)
* `completions` (array of objects):
* `benchmarkId` (string)
* `date` (string)
* `rating` (number)



**Collection: `schedule**` (The Calendar)

* *Note: This is generated automatically by the app as users add sessions.*

### 5. Run the App

`npm run dev`

---

## Seeding Data (Optional)

If you need dummy data to test the leaderboard immediately, you can use this script to populate the `benchmarks` collection.

// Run this function once in your app to seed data
const seedBenchmarks = async () => {
  const problems = [
    { name: 'PULL YASELF UP! YAY', grade: '6B+' },
    { name: 'WARM UP 1', grade: '6B+' },
    { name: 'B.O.B. 2', grade: '6C' },
    { name: 'EASY PEASY', grade: '6C' },
    { name: 'BINGO WAS HIS NAME', grade: '6C+' },
    { name: 'ENTER SANDBAG', grade: '6C+' },
    { name: 'MOON POWER', grade: '7A' }
  ];
  
  const { collection, addDoc } = require('firebase/firestore');
  const { db } = require('./firebase'); // Adjust path as needed

  for (const p of problems) {
    await addDoc(collection(db, 'benchmarks'), p);
  }
  console.log("Seeding complete");
};
