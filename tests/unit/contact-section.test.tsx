// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ContactSection,
  createMailtoHref,
} from '@/features/contact';
import { profileFixture } from '@fixtures/domain';

afterEach(cleanup);

const PUBLIC_EMAIL = 'Northstar_lzh@zju.edu.cn';

describe('createMailtoHref', () => {
  it('creates a mail-only URI for the public email', () => {
    expect(createMailtoHref(` ${PUBLIC_EMAIL} `)).toBe(`mailto:${PUBLIC_EMAIL}`);
  });

  it.each(['invalid', 'person?subject=Injected@example.com', 'person@example.com#fragment'])(
    'rejects an unsafe email value: %s',
    (email) => {
      expect(() => createMailtoHref(email)).toThrow('valid email');
    },
  );
});

describe('ContactSection', () => {
  it('exposes only the contact anchor and email without writes or requests', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const cookiesBefore = document.cookie;
    const { container } = render(
      <ContactSection
        locale="zh"
        profile={{...profileFixture, email: PUBLIC_EMAIL}}
      />,
    );

    expect(container.querySelector('#contact')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `电子邮箱：${PUBLIC_EMAIL}` }))
      .toHaveAttribute('href', `mailto:${PUBLIC_EMAIL}`);
    expect(container.querySelectorAll('form, input, textarea, button')).toHaveLength(0);
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookiesBefore);
  });
});
