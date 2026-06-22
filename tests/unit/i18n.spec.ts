import { describe, expect, it } from 'vitest';

import ru from '@i18n/ru';
import { normalizeLocale } from '@i18n';

describe('i18n', () => {
  it('falls back to ru locale', () => {
    expect(normalizeLocale('en-US')).toBe('ru');
    expect(normalizeLocale('ru-RU')).toBe('ru');
    expect(normalizeLocale(undefined)).toBe('ru');
  });

  it('contains required ru namespaces', () => {
    expect(ru.nav.home).toBeTruthy();
    expect(ru.home.social.title).toBe('Наши социальные сети');
    expect(ru.home.social.links.reviews.title).toBe('Отзывы ТГ');
    expect(ru.home.social.links.news.title).toBe('Новостной канал');
    expect(ru.home.social.links.instagram.title).toBe('Instagram');
    expect(ru.home.social.links.vk.title).toBe('ВКонтакте');
    expect(ru.home.social.links.max.title).toBe('Max');
    expect(ru.home.social.links.threads.title).toBe('Threads');
    expect(ru.order.contact).toBeTruthy();
    expect(ru.order.contactPlaceholder).toBe('@telegram');
    expect(ru.common.notifications).toBeTruthy();
    expect(ru.errors.generic).toBeTruthy();
  });
});
