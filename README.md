# NET WORLD SHIPPING - Modern Shipment Tracking System

A private repository: `networldshipping-spec/networldshipping` (intended to be private for the shipping company)

A full-stack shipment tracking application with PostgreSQL database integration, admin panel, receipt generation, and email notification system for NET WORLD SHIPPING company.

## 🚀 Features

### Public Website
- Real-time shipment tracking
- Interactive timeline visualization
- Modern, responsive UI with animations
- Location viewer with visual route map
- Package image viewer
- Recent shipments showcase

### Admin Panel
- Complete CRUD operations for shipments
- Sender/Receiver information management
- Package details and image upload
- Professional receipt generation with QR codes
- Email notification system
- Contact management (sender/receiver)
- Notification history tracking
- Dashboard with statistics
- Tracking events management

### Technical Features
- PostgreSQL database backend
- RESTful API
- File upload support (package images)
- Print-optimized receipts
- Real-time statistics
- Tab-based navigation
- Debounced search functionality

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Database Setup

### Database Credentials
- **Database Name:** `networld`
- **Username:** `postgres`
- **Password:** `103258`
- **Port:** `5432` (default)

### Setup Steps

1. **Ensure PostgreSQL is running:**
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service -Name postgresql*
   
   # If not running, start it
   Start-Service -Name "postgresql-x64-[version]"
   ```

2. **Create the database (if it doesn't exist):**
   ```powershell
   psql -U postgres -c "CREATE DATABASE networld;"
   ```

3. **Run the database setup script:**
   ```powershell
   psql -U postgres -d networld -f database-setup.sql
   ```

   Or manually execute the SQL file in pgAdmin or your preferred PostgreSQL client.

## 📦 Installation

1. **Install dependencies:**
   ```powershell
   npm install
   ```

2. **Verify database connection:**
   The server will automatically test the connection when started.

## 🎯 Running the Application

1. **Start the server:**
   ```powershell
   npm start
   ```

   Or for development with auto-reload:
   ```powershell
   npm run dev
   ```

2. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 🔌 API Endpoints

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/tracking/:trackingNumber` - Get tracking details
- `POST /api/shipments` - Create new shipment
- `PATCH /api/shipments/:id` - Update shipment
- `DELETE /api/shipments/:id` - Delete shipment

### Tracking Events
- `POST /api/tracking-events` - Add tracking event

### Statistics
- `GET /api/statistics` - Get shipment statistics

### Health Check
- `GET /api/health` - Server health check

## 📊 Sample Tracking Numbers

Try these tracking numbers in the application:
- `TRK123456789` - In Transit
- `TRK987654321` - Delivered
- `TRK456789123` - Pending
- `TRK789456123` - In Transit
- `TRK321654987` - In Transit
- `TRK654987321` - Pending

## 🗂️ Project Structure

```
nettrack/
├── index.html              # Frontend UI
├── styles.css              # Styling
├── script.js               # Frontend logic with API integration
├── server.js               # Express backend server
├── database-setup.sql      # Database schema and seed data
├── package.json            # Dependencies
└── README.md              # Documentation
```

## 🔐 Security Note

**Important:** In production, never hardcode database credentials. Use environment variables:

1. Create a `.env` file:
   ```
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=networld
   DB_PASSWORD=103258
   DB_PORT=5432
   PORT=3000
   ```

2. Install dotenv:
   ```powershell
   npm install dotenv
   ```

3. Update server.js to use environment variables.

## 🛠️ Troubleshooting

### Server won't start
- Ensure PostgreSQL is running
- Check if port 3000 is available
- Verify database credentials

### Database connection error
- Confirm PostgreSQL is running: `Get-Service postgresql*`
- Verify database exists: `psql -U postgres -l`
- Check credentials in server.js

### No shipments showing
- Run the database setup script
- Check browser console for errors
- Verify API endpoints are accessible

## 📝 Database Schema

### Shipments Table
- `id` - Serial Primary Key
- `tracking_number` - Unique tracking identifier
- `origin` - Origin location
- `destination` - Destination location
- `carrier` - Shipping carrier
- `status` - Current status (pending, in-transit, delivered)
- `estimated_delivery` - Expected delivery date
- `current_location` - Current package location
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Tracking Events Table
- `id` - Serial Primary Key
- `shipment_id` - Foreign key to shipments
- `event_date` - Event timestamp
- `status` - Event status
- `location` - Event location
- `description` - Event description
- `created_at` - Creation timestamp

## 🚀 Future Enhancements

- User authentication
- Email notifications
- SMS alerts
- Real-time updates with WebSockets
- Advanced analytics dashboard
- Mobile app
- Multi-language support

## 📄 License

ISC License

## 👥 Support

For issues or questions, please check the troubleshooting section or review the server logs.
