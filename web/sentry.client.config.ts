import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://57da44fc8ba178aca7aa690d58071363@o4511663065661440.ingest.us.sentry.io/4511663186968576",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
