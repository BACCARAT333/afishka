import { createApp } from './app';
import { config } from './config';
import { createContainer } from './container';
import { ConsoleLogger } from './shared/logger';

const logger = new ConsoleLogger();
const container = createContainer(config, logger);

const server = createApp(container).listen(config.port, () => {
  logger.info(`Афишка запущена: http://localhost:${config.port}`);
});

function shutdown(): void {
  server.close(() => {
    container.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
