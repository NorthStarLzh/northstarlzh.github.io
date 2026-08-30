'use client';

import {useLayoutEffect, useState} from 'react';

import {AppImage} from '@/components/ui';
import type {ImageAsset} from '@/content/contracts';

import {buildHomeHeroSources, toSrcSet} from './home-image-sources';
import styles from './home.module.css';

export interface HeroPhotoProps {
  light: ImageAsset;
  dark: ImageAsset | null;
  altLight: string;
  altDark: string;
}

type HeroTheme = 'light' | 'dark';

function readTheme(): HeroTheme {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'dark'
    : 'light';
}

/** Picks the theme-appropriate hero image. Falls back to `light` when the
 *  dark cover is unset, so a single image is loaded per theme. */
export function HeroPhoto({light, dark, altLight, altDark}: HeroPhotoProps) {
  // Start from the light cover so the hydrated render matches the SSR HTML
  // (server-rendering the dark cover would cause a hydration mismatch that
  // React refuses to patch). next-themes stamps `data-theme` on the `<html>`
  // in its head bootstrap script before React runs, so the layout effect
  // applies the stored theme before the first paint — no visible flash.
  const [theme, setTheme] = useState<HeroTheme>('light');

  useLayoutEffect(() => {
    const applyTheme = () => setTheme(readTheme());
    applyTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          applyTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  const darkActive = theme === 'dark' && dark !== null;
  const image = darkActive ? dark : light;
  const sources = buildHomeHeroSources(image);

  return (
    <picture className={styles.heroMedia}>
      <source sizes="100vw" srcSet={toSrcSet(sources)} />
      <AppImage
        alt={darkActive ? altDark : altLight}
        blurDataURL={image.blurDataUrl}
        className={styles.heroImage}
        fetchPriority="high"
        height={image.height}
        loading="eager"
        placeholder={image.blurDataUrl ? 'blur' : 'empty'}
        sizes="100vw"
        src={sources.src}
        unoptimized
        width={image.width}
      />
    </picture>
  );
}
