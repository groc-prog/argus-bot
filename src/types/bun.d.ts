declare module 'bun' {
  interface Env {
    LOG_LEVEL?: string;
    WEB_SCRAPER_SCHEDULE?: string;
    MONGODB_URI?: string;
    DEFAULT_NOTIFICATION_SCHEDULE?: string;
    DISCORD_BOT_TOKEN?: string;
    DISCORD_APP_ID?: string;
    DISCORD_TEST_GUILD_ID?: string;
  }
}
