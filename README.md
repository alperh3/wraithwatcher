# WraithWatchers

A Next.js application for tracking and reporting ghost sightings, built with React, Tailwind CSS, and Supabase.

## Features

- **Interactive Map**: View ghost sightings on an interactive map with custom markers
- **Sightings Management**: Browse, search, filter, and sort ghost sightings
- **Report Sightings**: Submit new ghost sightings with location, details, and images
- **Data Export**: Export filtered sightings to CSV
- **Real-time Data**: Powered by Supabase for real-time updates
- **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Leaflet.js with React Leaflet
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wraithwatcher
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note**: The application will work without Supabase configuration by falling back to CSV data, but you'll need Supabase for full functionality including posting new sightings.

### 4. Set up the Database

1. In your Supabase dashboard, go to the SQL Editor
2. Run the SQL from `supabase-schema.sql` to create the database schema
3. Create a storage bucket named `sighting-images` for image uploads

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses a single `sightings` table with the following structure:

- `id`: Primary key
- `date`: Date of the sighting
- `time`: Time of day
- `type`: Type of ghost/spirit
- `location`: City name
- `state`: US state
- `notes`: Detailed description
- `lat`: Latitude coordinate
- `lng`: Longitude coordinate
- `image_url`: URL to uploaded image (optional)
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last updated

## Features Overview

### Main Dashboard
- View all ghost sightings on an interactive map
- Filter by date range, type, and location
- Search through sighting notes and details
- Sort table by different columns
- Pagination for large datasets
- Export filtered data to CSV

### Report a Sighting
- Fill out detailed sighting information
- Select location on interactive map
- Upload images of the encounter
- Submit to database with validation

### Data Management
- Real-time updates from database
- Fallback to CSV data if database is empty
- Image storage in Supabase Storage
- Comprehensive error handling

## Deployment

### Deploy to Vercel

#### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Set up environment variables when prompted

#### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure the project**:
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. **Add environment variables** (see below)
7. **Click "Deploy"**

### Environment Variables

Set these in your Vercel dashboard (Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

**For all environments** (Production, Preview, Development):
- `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Post-Deployment Setup

1. **Verify your deployment** at the provided Vercel URL
2. **Test all functionality**:
   - View sightings on the map
   - Submit a new sighting
   - Test filtering and search
   - Export data to CSV
3. **Set up custom domain** (optional):
   - Go to Vercel dashboard → Settings → Domains
   - Add your custom domain
   - Configure DNS settings

### Production Checklist

- [ ] Environment variables configured
- [ ] Supabase database accessible
- [ ] All features working in production
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate active
- [ ] Performance optimized
- [ ] Error monitoring set up

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.