# Scan-ttendance Landing Page Environment Setup

## Web3Forms Contact Form Configuration

To enable the contact form functionality:

1. Visit https://web3forms.com
2. Sign up for a free account
3. Create a new form and get your access key
4. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
5. Update `.env.local` with your actual access key:
   ```
   NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=your_actual_access_key_here
   ```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

The contact form will work automatically once the environment variable is configured.
