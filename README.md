# The Vault

A secure investor content portal for sharing sensitive materials with potential investors.

## Features

- Password-protected access to investor materials
- Support for Google Docs, Sheets, PDFs, and YouTube videos
- Access logging to Google Sheets (email, timestamp, file accessed)
- Cal.com meeting booking integration
- Rate limiting (3 failed attempts = 15-minute block)
- Minimal, developer-focused design with JetBrains Mono font

## Quick Start

### Prerequisites

- Node.js 18+
- Google Account
- Vercel account (for deployment)
- Cal.com account (optional, for meeting booking)

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd theVault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Google Apps Script (see [SETUP.md](./SETUP.md))

4. Create `.env.local` with your configuration:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Google Apps Script web app URL | Yes |
| `NEXT_PUBLIC_CAL_COM_LINK` | Cal.com meeting booking URL | No |

## Project Structure

```
theVault/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── login/          # Authentication endpoint
│   │   │   └── log-access/     # File access logging
│   │   ├── page.tsx            # Main page
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── LoginForm.tsx       # Login form
│   │   ├── ContentDisplay.tsx  # File list display
│   │   ├── FileList.tsx        # Grid of files
│   │   ├── FileItem.tsx        # Individual file card
│   │   └── FileViewer.tsx      # Embedded file viewer
│   └── lib/
│       ├── google-script-client.ts  # Google Apps Script client
│       ├── rate-limiter.ts          # Rate limiting logic
│       ├── types.ts                 # TypeScript types
│       └── errors.ts                # Error utilities
├── google-apps-script/
│   ├── Code.gs                 # Apps Script source
│   └── README.md               # Apps Script setup guide
├── .env.example                # Environment template
└── SETUP.md                    # Detailed setup guide
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `GOOGLE_APPS_SCRIPT_URL`
   - `NEXT_PUBLIC_CAL_COM_LINK` (optional)
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## How It Works

1. **Investor visits portal** → Login page displayed
2. **Enters email + password** → Validated against Google Sheet
3. **On success** → Access logged, file list displayed
4. **Clicks file** → Opens in embedded viewer, access logged
5. **Books meeting** → Redirects to Cal.com

## Google Sheet Structure

### Config Sheet
| Cell | Content |
|------|---------|
| A1 | Investor portal password |

### Access Log Sheet
| Column | Content |
|--------|---------|
| A | Email address |
| B | Timestamp (ISO 8601) |
| C | File name accessed |
| D | Running access count |

## Security Notes

- Password stored in plain text (acceptable for shared investor password)
- Rate limiting resets on deployment (in-memory storage)
- No session persistence - re-authenticate on each visit
- Access logs are non-blocking (failures don't prevent access)

## Troubleshooting

See [SETUP.md](./SETUP.md#troubleshooting) for common issues and solutions.

## License

Private - All rights reserved
