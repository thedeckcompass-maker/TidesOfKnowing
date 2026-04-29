## COMPASS Application Form Setup

### Required Cloudflare Pages Environment Variables

- `EMAIL_API_KEY`
- `EMAIL_TO=hello@tidesofknowing.com`

### Resend Setup Notes

- Create a Resend API key in your Resend dashboard.
- Verify your sending domain in Resend if required for your account/domain setup.
- Add the API key to Cloudflare Pages environment variables as `EMAIL_API_KEY`.

### Deployment Check

- The site now uses the Cloudflare adapter and server output; confirm Cloudflare Pages is using the correct build settings.
- Build command: `npm run build`
- Output directory: `dist`

### Test Checklist

- Open `/compass/apply/`
- Submit a test application
- Confirm success message appears
- Confirm email arrives at `hello@tidesofknowing.com`
- Confirm required-field errors work
- Confirm mobile form layout is clean

