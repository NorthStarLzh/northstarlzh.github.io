'use client';

import { useState } from 'react';

import { ModuleState } from '@/components/feedback';
import { Cluster, Container, Section, Stack } from '@/components/layout';
import { AppImage, Button, ButtonLink, Dialog, IconButton, Skeleton } from '@/components/ui';

export interface DesignSystemShowcaseProps {
  theme?: 'light' | 'dark';
  viewport?: 'mobile' | 'tablet' | 'desktop';
}

export function DesignSystemShowcase({
  theme = 'light',
  viewport = 'desktop',
}: DesignSystemShowcaseProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const previewWidth = { mobile: 390, tablet: 768, desktop: 1440 }[viewport];

  return (
    <div
      className="ds-showcase"
      data-preview-viewport={viewport}
      data-theme={theme}
      style={{ maxWidth: previewWidth }}
    >
      <Container size="wide">
        <Section aria-labelledby={`showcase-${theme}-${viewport}`} spacing="xl">
          <Stack gap="xl">
            <Stack gap="xs">
              <span>Design system · {viewport}</span>
              <h1 id={`showcase-${theme}-${viewport}`}>Photography-first foundations</h1>
              <p>Low-saturation surfaces keep the image and writing in the foreground.</p>
            </Stack>

            <AppImage
              alt="Muted mountain landscape placeholder"
              height={900}
              loading="lazy"
              sizes="(min-width: 75rem) 1120px, 100vw"
              src="/showcase-landscape.jpg"
              width={1600}
            />

            <Cluster gap="sm">
              <Button>Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
              <Button loading loadingLabel="Loading">
                Save
              </Button>
              <IconButton label="Favorite">♡</IconButton>
              <ButtonLink href="#showcase-states" variant="ghost">
                Link action
              </ButtonLink>
              <Button onClick={() => setDialogOpen(true)} variant="secondary">
                Open dialog
              </Button>
            </Cluster>

            <div id="showcase-states">
              <ModuleState kind="empty" locale="en" minHeight="10rem" />
            </div>

            <Cluster align="stretch">
              <Skeleton height="12rem" variant="card" width="18rem" />
              <Skeleton aspectRatio="4 / 3" variant="media" width="18rem" />
            </Cluster>
          </Stack>
        </Section>
      </Container>

      <Dialog
        closeLabel="Close dialog"
        description="Keyboard focus remains inside this accessible dialog."
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        title="Dialog adapter"
      >
        <Stack>
          <p>Business modules consume this local interface rather than Radix types.</p>
          <Button onClick={() => setDialogOpen(false)}>Done</Button>
        </Stack>
      </Dialog>
    </div>
  );
}
