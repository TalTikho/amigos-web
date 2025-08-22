# AMIGOS-web

> ⚠️ **Note:** This project is still in progress and under active development.

This is the frontend for the **AMIGOS** chat application.

---

## 👥 Authors
- 👨‍💻 [Tal Tikhonov](https://github.com/TalTikho)
- 👨‍💻 [Kfir Eitan](https://github.com/Kfir15)

---

## 🔗 Links
- [🧩 Amigos Web Server Repository](https://github.com/TalTikho/AMIGOS-web-server)
- [🧩 Amigos Web Repository](https://github.com/TalTikho/amigos-web)

---

## 🚀 Features
- 🔑 **Authentication** – Sign up, log in, manage profile & avatar.
- 💬 **Messaging** – Real-time private and group chats with text, files, images, and videos.
- 👥 **Groups** – Create groups, assign managers, add/remove members, and update group details.
- 🔎 **Search** – Find users, groups, and messages.
- 🔔 **Notifications** – In-app message alerts.
- 🌓 **Theming** – Light/Dark mode.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite, TailwindCSS, shadcn/ui
- **State Management:** React Context + Custom Hooks
- **Routing:** React Router
- **Real-Time:** WebSockets (via server)

---

## ⚡ How to Run

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed

### 1️⃣ Clone the repository
```bash
git clone https://github.com/TalTikho/amigos-web.git
cd amigos-web
```
### 2️⃣ Build and run with Docker Compose
```bash
docker-compose up --build
```

### 3️⃣ Access the app
```bash
http://localhost:3000
```

## 🖥️ Pages

The **AMIGOS-web** frontend includes the following pages:

---

### 1️⃣ Login
- Allows users to log in with their email and password.
- Redirects authenticated users to the **Main Page**.
- Includes “Forgot password?” and login validation.

### 2️⃣ Signup
- Lets new users create an account.
- Users can set a profile picture (avatar), username, and password.
- Redirects to **Login Page** after successful signup.

### 3️⃣ Main Page
- The dashboard of the app.
- Displays a list of chats and groups.
- Allows searching users, groups, and messages.
- Provides quick access to **Settings**.

### 4️⃣ Group / Chat Page
- Shows private chat or group chat conversations.
- Supports sending text messages, files, images, and videos.
- Displays chat members and group information (for group chats).

### 5️⃣ Settings
- Allows users to update profile picture, username, and password.
- Manage app preferences like **Dark/Light mode**.
- Add or remove friends.
- Option to log out from the app.
