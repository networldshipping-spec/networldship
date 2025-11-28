# ShipTrack - Shipment Tracking Website

## Overview
ShipTrack is a modern shipment tracking website built with Next.js, TypeScript, and Tailwind CSS. It provides real-time tracking of shipments, a timeline visualization of package journeys, and a professional user interface.

## Features
- Real-time shipment tracking
- Timeline visualization of package journeys
- Responsive design for mobile and desktop
- Professional UI with status indicators
- Mock API integration for demonstration purposes

## Technologies Used
- **Next.js**: A React framework for building server-rendered applications.
- **TypeScript**: A superset of JavaScript that adds static types.
- **Tailwind CSS**: A utility-first CSS framework for styling.
- **PostgreSQL**: A powerful, open-source relational database.

## Getting Started

### Prerequisites
- Node.js (version 14 or later)
- PostgreSQL (with pgAdmin 4)
- Yarn or npm

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   cd shiptrack-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up the PostgreSQL database:
   - Create a new database named `networld`.
   - Use the following credentials:
     - Username: `your_username`
     - Password: `103258`

4. Configure environment variables:
   - Copy `.env.example` to `.env.local` and update the database connection details:
     ```
     DATABASE_URL=postgres://your_username:103258@localhost:5432/networld
     ```

5. Run database migrations:
   ```
   npm run migrate
   ```

6. Start the development server:
   ```
   npm run dev
   ```

### Usage
- Navigate to `http://localhost:3000` to access the application.
- Use the tracking form to input tracking numbers and view shipment statuses.

## Folder Structure
- **src/**: Contains the main application code.
  - **app/**: Contains API routes and pages.
  - **components/**: Contains reusable UI components.
  - **lib/**: Contains database connection and API client code.
  - **types/**: Contains TypeScript type definitions.
  - **hooks/**: Contains custom React hooks.
- **database/**: Contains SQL files for schema and migrations.
- **.env.local**: Environment variables for local development.
- **README.md**: Project documentation.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License.