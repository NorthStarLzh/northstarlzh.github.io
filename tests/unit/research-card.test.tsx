// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResearchCard } from '@/features/research';
import { researchProjectOneImageFixture } from '@fixtures/domain';

afterEach(cleanup);

describe('ResearchCard', () => {
  it('emits only the selected project id without creating a details link', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <ResearchCard
        locale="zh"
        onOpen={onOpen}
        project={researchProjectOneImageFixture}
      />,
    );

    await user.click(screen.getByRole('button', { name: /测试项目 research-001/ }));

    expect(onOpen).toHaveBeenCalledWith('research-001');
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /测试图片/ })).toHaveAttribute(
      'src',
      '/content-image-placeholder.svg?fit=max&w=1200',
    );
    expect(screen.getByRole('img', { name: /测试图片/ })).not.toHaveAttribute(
      'src',
      '/research-001-image-1',
    );
  });
});
