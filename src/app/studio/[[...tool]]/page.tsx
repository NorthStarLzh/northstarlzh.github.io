import {StudioClient} from './studio-client';

export function generateStaticParams() {
  return [{tool: []}];
}

export default function StudioPage() {
  if (process.env.GITHUB_PAGES === 'true') {
    return (
      <main>
        <p>内容后台仅在本地开发环境中提供。</p>
      </main>
    );
  }

  return <StudioClient />;
}
