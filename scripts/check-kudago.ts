/* eslint-disable no-console */
import { config } from '../src/config';
import { KudaGoAdapter } from '../src/integrations/kudago/KudaGoAdapter';
import { KudaGoClient } from '../src/integrations/kudago/KudaGoClient';
import { EventFactory } from '../src/modules/events/EventFactory';

/** Ручная проверка: отвечает ли KudaGo API и как выглядят данные после адаптера. */
async function main(): Promise<void> {
  const client = new KudaGoClient({
    baseUrl: config.kudagoBaseUrl,
    timeoutMs: config.kudagoTimeoutMs,
  });

  const response = await client.getEvents({
    location: 'spb',
    actualSince: Math.floor(Date.now() / 1000),
    pageSize: 5,
  });
  console.log(
    `Ответ получен. Всего событий: ${response.count}, в выборке: ${response.results.length}`,
  );
  console.log('Пример «сырого» события:');
  console.log(JSON.stringify(response.results[0], null, 2)?.slice(0, 1500));

  const events = new KudaGoAdapter(new EventFactory()).toEvents(response.results, 'spb');
  console.log(`\nПосле адаптера: ${events.length} из ${response.results.length}`);
  for (const event of events) console.log(`- ${event.describe()}`);
}

main().catch((error: unknown) => {
  console.error('Не удалось получить данные:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
