# Smart Attendance Web Application

A lightweight, in-class attendance system built for university departments. Runs directly in the browser on any phone or PC with zero app installation.

---

## Quick Start

### Start the Application (Port 3050)
Double-click `start.bat` in this folder, or run:
```bash
npm run dev
```

The app will be running at:
* **Lecturer / Admin Dashboard**: `http://localhost:3050/admin`
* **Student Check-In Portal**: `http://localhost:3050`

*(Using port 3050 avoids conflicts with other projects like Hospital Dashboard or School Manager on port 3000).*

---

## Accessing from Students' Mobile Phones on Classroom Wi-Fi

To let students access the system from their phones during lecture:
1. Ensure your laptop and students' phones are connected to the same Wi-Fi / hotspot.
2. Find your laptop's local IP address (e.g. `ipconfig` -> `192.168.1.50`).
3. Students simply open: `http://192.168.1.50:3050` in their mobile browser (Chrome, Safari).
