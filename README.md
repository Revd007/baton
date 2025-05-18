# Next.js Full-Stack Scraping Application

This project is a Next.js application that includes backend API functionality for scraping anime and manga information from external websites and managing content with a PostgreSQL database.

## Features

*   **Web Scraping**:
    *   Scrapes anime information from `9animetv.to`.
    *   Scrapes manga, manhwa, and manhua information from `westmanga.me`.
*   **Next.js API Routes**:
    *   Provides dedicated API endpoints for scraped data.
    *   (Future) Endpoints for creating and updating streaming content (e.g., anime, movies) with thumbnail uploads.
    *   (Future) Endpoints for creating and updating comics content (e.g., manga) with cover image uploads.
*   **PostgreSQL Integration**:
    *   Uses a PostgreSQL database, managed with Knex.js for migrations and queries.
*   **Secure & Robust (Backend Considerations)**:
    *   Next.js API routes can be secured (e.g., using libraries like `next-auth` or custom token validation).
    *   Rate limiting can be implemented using middleware or services if needed.
    *   Uses `dotenv` for managing environment variables.
*   **TypeScript**:
    *   The entire application (frontend and backend) is written in TypeScript.

## Tech Stack

*   **Framework**: Next.js (with React)
*   **Styling**: Tailwind CSS
*   **Database**: PostgreSQL (with Knex.js for query building and migrations)
*   **Scraping**: Puppeteer
*   **Language**: TypeScript
*   **API Client (Frontend)**: Fetch API, Axios (Optional)
*   **File Uploads (Future)**: Handled via Next.js API Routes (e.g., parsing FormData)
*   **Environment Variables**: `dotenv`
*   **UI Components**: Shadcn/UI components (e.g., `@radix-ui/react-*`, `cmdk`, `sonner`, `vaul`)
*   **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
*   **Date & Time**: `date-fns`
*   **Icons**: `lucide-react`

## Project Structure

```
/
|-- app/                   # Next.js App Router directory
|   |-- api/               # API Routes
|   |-- (pages)/           # Page components
|-- components/            # Reusable UI components
|-- lib/
|   |-- db.ts              # Knex.js database connection utility
|   |-- scrapers/
|       |-- anime.ts       # Logic for scraping anime
|       |-- manga.ts       # Logic for scraping manga
|-- db/
|   |-- migrations/        # Database migration files (Knex.js)
|   |-- seeds/             # Database seed files (Knex.js)
|-- public/                # Next.js public assets
|-- uploads/               # Directory for uploaded files - should be in .gitignore (if storing locally)
|-- .env                   # Environment variables (DB_HOST, DB_USER, etc.) - DO NOT COMMIT
|-- knexfile.ts            # Knex.js configuration
|-- package.json
|-- tsconfig.json          # Main TypeScript config for Next.js
|-- next.config.js         # Next.js configuration
|-- README.md              # This file
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your PostgreSQL connection details:
    ```env
    DB_HOST=your_db_host
    DB_PORT=your_db_port
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    # NEXT_PUBLIC_APP_URL=http://localhost:3000 # Optional: For OAuth or other absolute URL needs

    # Variables for Puppeteer if running in restricted environments (e.g., Docker)
    # PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    ```
    Replace with your actual PostgreSQL credentials.

4.  **Set up PostgreSQL Database:**
    Ensure you have a running PostgreSQL instance and that the database specified in `DB_NAME` exists and the `DB_USER` has permissions to access it.

5.  **Run Database Migrations:**
    To create the necessary tables (e.g., `users` table):
    ```bash
    npm run migrate:latest
    ```

6.  **Ensure `uploads` directory exists (if storing uploads locally):**
    If you plan to store uploaded files directly on the server (not recommended for scalable production apps), you might need to create an `uploads/` directory.
    **Important**: Add `uploads/` to your `.gitignore` file.

## Available Scripts

*   **`npm run dev`**: Starts the Next.js development server (serves frontend and API routes).
*   **`npm run build`**: Builds the Next.js application for production.
*   **`npm run start`**: Starts the Next.js production server.
*   **`npm run lint`**: Lints the Next.js application.
*   **Knex Database Migrations & Seeding:**
    *   **`npm run knex -- <command>`**: Base command to run Knex operations (e.g., `npm run knex -- migrate:status`).
    *   **`npm run migrate:make -- <migration_name>`**: Creates a new migration file.
    *   **`npm run migrate:latest`**: Runs all pending migrations.
    *   **`npm run migrate:rollback`**: Rolls back the last batch of migrations.
    *   **`npm run seed:make -- <seed_name>`**: Creates a new seed file.
    *   **`npm run seed:run`**: Runs all seed files.

## API Endpoints (Next.js API Routes - `app/api/...`)

*   **Scraping:**
    *   `GET /api/scrape/anime`: Initiates scraping for anime from `9animetv.to`. Returns `AnimeInfo[]`.
    *   `GET /api/scrape/manga`: Initiates scraping for manga from `westmanga.me`. Returns `MangaInfo[]`.
*   **(Future) Streaming Content (e.g., Anime, Movies):**
    *   `POST /api/stream`: Creates new streaming content.
    *   `PUT /api/stream/:id`: Updates existing streaming content by ID.
*   **(Future) Comics Content (e.g., Manga, Manhwa):**
    *   `POST /api/comics`: Creates new comics content.
    *   `PUT /api/comics/:id`: Updates existing comics content by ID.

Uploaded files (if stored locally) would typically be placed in the `public` folder or served via a custom route if more control is needed. For production, a dedicated file storage service (e.g., AWS S3, Cloudinary) is recommended.

---

This README provides an updated overview. You can expand it further with more details about specific features, API request/response examples, deployment instructions, etc. 