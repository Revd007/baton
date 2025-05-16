"""# Next.js & Express Scraping API Server

This project combines a Next.js application with a custom Express.js backend server. The backend server provides API endpoints for scraping anime and manga information from external websites and managing streaming/comics content with a Supabase database.

## Features

*   **Web Scraping**:
    *   Scrapes anime information from `9animetv.to`.
    *   Scrapes manga, manhwa, and manhua information from `westmanga.me`.
*   **Express.js API Server**:
    *   Provides dedicated API endpoints for scraped data.
    *   Endpoints for creating and updating streaming content (e.g., anime, movies) with thumbnail uploads.
    *   Endpoints for creating and updating comics content (e.g., manga) with cover image uploads.
*   **Supabase Integration**:
    *   Uses Supabase for storing and managing streaming and comics content data.
*   **Secure & Robust**:
    *   Includes `helmet` for security headers.
    *   Rate limiting on API requests.
    *   Uses `dotenv` for managing environment variables.
*   **TypeScript**:
    *   Both Next.js app and Express server are written in TypeScript.

## Tech Stack

*   **Frontend**: Next.js, React, Tailwind CSS (Assumed based on typical Next.js setups - can be adjusted)
*   **Backend**: Express.js
*   **Database**: Supabase (PostgreSQL)
*   **Scraping**: Puppeteer
*   **Language**: TypeScript
*   **API Client**: Axios (Assumed)
*   **File Uploads**: Multer
*   **Environment Variables**: `dotenv`
*   **Security**: `helmet`, `express-rate-limit`
*   **Styling**: `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate` (from `package.json`)
*   **UI Components**: Shadcn/UI components (e.g., `@radix-ui/react-*`, `cmdk`, `sonner`, `vaul`) (from `package.json`)
*   **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod` (from `package.json`)
*   **Date & Time**: `date-fns` (from `package.json`)
*   **Icons**: `lucide-react` (from `package.json`)

## Project Structure

```
/
|-- lib/
|   |-- scrapers/
|       |-- anime.ts       # Logic for scraping anime
|       |-- manga.ts       # Logic for scraping manga
|-- public/                # Next.js public assets
|-- server/
|   |-- index.ts           # Express server setup and API routes
|-- components/            # Next.js UI components (Assumed)
|-- app/                   # Next.js App Router directory (Assumed)
|-- uploads/               # Directory for uploaded files (thumbnails, covers) - should be in .gitignore
|-- .env                   # Environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY) - DO NOT COMMIT
|-- package.json
|-- tsconfig.json          # Main TypeScript config for Next.js
|-- tsconfig.server.json   # TypeScript config for the Express server
|-- next.config.js         # Next.js configuration (Assumed)
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
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_KEY=your_supabase_service_role_key

    # Optional: Define a port for the server, otherwise it defaults to 3001
    # PORT=your_desired_port
    ```
    Replace `your_supabase_url` and `your_supabase_service_role_key` with your actual Supabase project URL and Service Role Key. The Service Role Key is essential for the backend server to interact with Supabase with admin privileges.

4.  **Ensure `uploads` directory exists (or is created by the app):**
    The server is configured to save uploaded files to an `uploads/` directory in the project root. You might need to create this directory manually if the application doesn't create it automatically upon first upload.
    **Important**: Add `uploads/` to your `.gitignore` file to prevent committing uploaded media files to your repository.

## Available Scripts

*   **`npm run dev`**: Starts the Next.js development server (for the frontend).
*   **`npm run build`**: Builds the Next.js application for production.
*   **`npm run start`**: Starts the Next.js production server.
*   **`npm run lint`**: Lints the Next.js application.
*   **`npm run build:server`**: Compiles the Express.js server TypeScript code to JavaScript (output to `dist/` folder).
*   **`npm run server`**: Builds the server code and then starts the Express.js backend server. The server typically runs on port 3001 unless a `PORT` environment variable is set.

**To run both frontend and backend for development:**
*   Open two terminal windows.
*   In the first terminal, run `npm run server` to start the Express backend.
*   In the second terminal, run `npm run dev` to start the Next.js frontend.

## API Endpoints (Backend Server - `server/index.ts`)

The Express server exposes the following API endpoints (default prefix `/api`):

*   **Scraping:**
    *   `GET /api/scrape/anime`: Initiates scraping for anime from `9animetv.to`.
    *   `GET /api/scrape/manga`: Initiates scraping for manga from `westmanga.me`.
*   **Streaming Content (e.g., Anime, Movies):**
    *   `POST /api/stream/create`: Creates new streaming content. Expects `multipart/form-data` for title, type, description, genres, and an optional `thumbnail` file.
    *   `PUT /api/stream/:id`: Updates existing streaming content by ID. Expects `multipart/form-data`.
*   **Comics Content (e.g., Manga, Manhwa):**
    *   `POST /api/comics/create`: Creates new comics content. Expects `multipart/form-data` for title, type, author, description, genres, and an optional `cover` file.
    *   `PUT /api/comics/:id`: Updates existing comics content by ID. Expects `multipart/form-data`.

Uploaded files are served statically from the `/uploads` route (e.g., `http://localhost:3001/uploads/your-file.jpg`).

---

This README provides a starting point. You can expand it further with more details about specific features, API request/response examples, deployment instructions, etc.
"" 