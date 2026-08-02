import type {ReactNode} from 'react';

/**
 * The embedded Sanity Studio is a large client bundle whose initial data loads
 * come from Sanity's CDN and API hosts. Preconnecting to those origins opens the
 * TLS connection in parallel with the bundle download, cutting the perceived
 * "content backend loading" time on the first visit to /studio.
 */
function sanityStudioHosts(): string[] {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const hosts = ['https://cdn.sanity.io'];
  if (projectId) {
    hosts.push(
      `https://${projectId}.api.sanity.io`,
      `https://${projectId}.apicdn.sanity.io`,
    );
  }
  return hosts;
}

export default function StudioLayout({children}: Readonly<{children: ReactNode}>) {
  return (
    <>
      {sanityStudioHosts().map((host) => (
        <link key={host} rel="preconnect" href={host} crossOrigin="anonymous" />
      ))}
      {children}
    </>
  );
}
