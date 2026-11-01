import { describe, expect, it } from 'vitest';
import { Exhibition } from '../../src/modules/events/models/Exhibition';
import { makeProps } from './helpers';

describe('Exhibition.isActiveAt', () => {
  const far = new Date('2035-01-01T00:00:00Z');

  it('постоянная экспозиция актуальна всегда', () => {
    const exhibition = new Exhibition(makeProps({ endsAt: null }), true);
    expect(exhibition.isActiveAt(far)).toBe(true);
  });

  it('обычная выставка после окончания неактуальна', () => {
    const exhibition = new Exhibition(makeProps(), false);
    expect(exhibition.isActiveAt(far)).toBe(false);
  });
});
