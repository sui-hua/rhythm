# schedule-manage

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Supabase Setup

1. **Create a Supabase project**
   - Go to [Supabase](https://supabase.com/) and create a new project
   - Make a note of your `Project URL` and `Project API Key` (anon public)

2. **Create database table**
   - In your Supabase dashboard, navigate to the `Table Editor`
   - Create a new table called `schedules` with the following columns:
     - `id` (UUID, Primary Key, auto-generated)
     - `date` (Date, required)
     - `start_time` (Time, required)
     - `end_time` (Time, required)
     - `title` (Text, required)
     - `description` (Text)
     - `tag` (Text, required)
     - `dot_color` (Text, required)
     - `bg_color` (Text, required)
     - `border_color` (Text, required)
     - `created_at` (Timestamptz, auto-generated)
     - `updated_at` (Timestamptz, auto-generated)

3. **Configure environment variables**
   - Create a `.env` file in the project root
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=YOUR_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
     ```

4. **Set up Row Level Security (RLS)**
   - In the Supabase dashboard, go to `Authentication` > `Policies`
   - Enable RLS for the `schedules` table
   - Create appropriate policies for reading and writing data

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Project Structure

```
src/
├── assets/            # Static assets
├── components/        # Vue components
├── config/            # Configuration files
│   └── supabase.js    # Supabase client configuration
├── models/            # Data models
│   └── Schedule.js    # Schedule model
├── services/          # Service layer
│   └── scheduleService.js  # Schedule service
├── App.vue            # Root component
└── main.js            # Application entry point
```

## Key Features

- **Year View**: Calendar overview showing all 12 months
- **Month View**: Detailed view of a single month with daily schedules
- **Timeline View**: Schedule timeline for the selected date
- **Supabase Integration**: Real-time database integration for storing and retrieving schedules
- **Responsive Design**: Works on different screen sizes
- **Modern UI**: Clean, modern interface with smooth animations

## Technologies Used

- **Vue 3**: Frontend framework
- **Vite**: Build tool
- **Tailwind CSS**: CSS framework
- **Supabase**: Backend as a Service (BaaS)
- **JavaScript**: Programming language
