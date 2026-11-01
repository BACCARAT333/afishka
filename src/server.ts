import { createApp } from './app';
import { config } from './config';

createApp().listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Афишка запущена: http://localhost:${config.port}`);
});
