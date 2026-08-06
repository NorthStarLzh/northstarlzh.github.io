import type {Locale, PhotoCollection} from '@/content/contracts';
import {AppImage} from '@/components/ui';
import {localize} from '@/i18n';

import {buildPhotographyCollectionsDetailUrl} from './category';
import {buildThumbnailSources} from './thumbnail-sources';

export interface CollectionsGalleryLabels {
  empty: string;
  photoCount: string;
}

export interface CollectionsGalleryProps {
  collections: PhotoCollection[];
  labels: CollectionsGalleryLabels;
  locale: Locale;
}

export const COLLECTION_THUMBNAIL_SIZES =
  '(min-width: 75rem) 25vw, (min-width: 48rem) 33vw, 100vw';

/**
 * Card grid for the collections list page. Each card links to its detail
 * page, shows the curated cover (or the first photo) and the photo count.
 */
export function CollectionsGallery({
  collections,
  labels,
  locale,
}: CollectionsGalleryProps) {
  if (collections.length === 0) {
    return <p className="photography-feed__status">{labels.empty}</p>;
  }

  return (
    <div className="collections-gallery" data-testid="collections-gallery">
      {collections.map((collection) => {
        const cover = collection.cover ?? collection.photos[0].image;
        const title = localize(collection.title, locale);
        const alt = localize(cover.alt, locale);
        const sources = buildThumbnailSources(cover.id);
        const href = buildPhotographyCollectionsDetailUrl(locale, collection.slug);

        return (
          <article className="collection-card" key={collection.id}>
            <a className="collection-card__link" href={href}>
              <span className="collection-card__media">
                <picture>
                  <source
                    sizes={COLLECTION_THUMBNAIL_SIZES}
                    srcSet={sources.srcSet}
                  />
                  <AppImage
                    alt={alt}
                    className="collection-card__image"
                    height={cover.height}
                    loading="lazy"
                    placeholder={cover.blurDataUrl ? 'blur' : 'empty'}
                    blurDataURL={cover.blurDataUrl}
                    sizes={COLLECTION_THUMBNAIL_SIZES}
                    src={sources.src}
                    unoptimized
                    width={cover.width}
                  />
                </picture>
              </span>
              <span className="collection-card__body">
                <span className="collection-card__title">{title}</span>
                <span className="collection-card__description">
                  {localize(collection.description, locale)}
                </span>
                <span className="collection-card__meta">
                  {labels.photoCount.replace('{count}', String(collection.photos.length))}
                </span>
              </span>
            </a>
          </article>
        );
      })}
    </div>
  );
}
