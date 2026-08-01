export type ModuleStateKind = 'loading' | 'empty' | 'error';
export type ModuleStateLocale = 'zh' | 'en';

export interface ModuleStateMessage {
  description: string;
  retryLabel: string;
  title: string;
}

export type ModuleStateMessages = Record<
  ModuleStateLocale,
  Record<ModuleStateKind, ModuleStateMessage>
>;

export const moduleStateMessages: ModuleStateMessages = {
  zh: {
    loading: {
      title: '正在加载',
      description: '内容正在准备中，请稍候。',
      retryLabel: '重试',
    },
    empty: {
      title: '暂无内容',
      description: '这里暂时没有可展示的内容。',
      retryLabel: '重新加载',
    },
    error: {
      title: '内容加载失败',
      description: '暂时无法显示此部分，请稍后重试。',
      retryLabel: '重试',
    },
  },
  en: {
    loading: {
      title: 'Loading',
      description: 'This content is being prepared. Please wait.',
      retryLabel: 'Retry',
    },
    empty: {
      title: 'Nothing here yet',
      description: 'There is no content to show here yet.',
      retryLabel: 'Reload',
    },
    error: {
      title: 'Unable to load content',
      description: 'This section is unavailable right now. Please try again.',
      retryLabel: 'Retry',
    },
  },
};
