import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import WebScraperService from './services/web-scraper';
import mongoose from 'mongoose';
import logger from './utils/logger';
import client from './bot/client';
import NotificationService from './services/notifications';

dayjs.extend(timezone);
dayjs.extend(utc);

mongoose.connection.on('connected', () => {
  logger.info('Connected to MongoDB');
});
mongoose.connection.on('disconnected', () => {
  logger.warn('Lost connection to MongoDB, attempting to reconnect');
});
mongoose.connection.on('reconnected', () => {
  logger.info('Reconnected MongoDB');
});
mongoose.connection.on('error', (event) => {
  logger.error(event, 'MongoDB connection error');
});

if (!process.env.MONGODB_URI) {
  logger.error('No MongoDB connection URI defined in environment');
  process.exit(1);
}

logger.info('Connecting to MongoDB');
await mongoose.connect(process.env.MONGODB_URI);

await client.initialize();

const webScraperService = new WebScraperService();
await webScraperService.initialize();

const notificationService = new NotificationService();
await notificationService.initialize();
