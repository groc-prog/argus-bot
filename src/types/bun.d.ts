declare module 'bun' {
  interface Env {
    LOG_LEVEL?: string;
    WEB_SCRAPER_SCHEDULE?: string;
    MONGODB_URI?: string;
    DEFAULT_NOTIFICATION_SCHEDULE?: string;
  }
}
