'use client';

import { useCallback, useState } from 'react';

import type { Locale, PageResult, Photo, PhotoCategory } from '@/content/contracts';

import {PhotoOverviewGrid} from './photo-overview-grid';
import { PhotoViewer } from './photo-viewer';
import type { PhotoViewerLabels } from './photo-viewer-contract';

export interface PhotoFeedLabels {
  loadMore: string;
  loading: string;
  retry: string;
  complete: string;
  error: string;
  empty?: string;
  prevPage: string;
  nextPage: string;
  pageInfo: string;
}

export interface PhotoFeedProps {
  category: PhotoCategory;
  currentPage: number;
  hasMore: boolean;
  initialPage: PageResult<Photo>;
  labels: PhotoFeedLabels;
  locale: Locale;
  nextPageUrl: string | null;
  onOpen: (photoId: string) => void;
  prevPageUrl: string | null;
  viewerLabels?: PhotoViewerLabels;
}

function formatPageInfo(
  template: string,
  current: number,
  hasMore: boolean,
): string {
  return template
    .replace('{current}', String(current))
    .replace('{total}', hasMore ? '…' : String(current));
}

interface PageNumber {
  current: boolean;
  href: string | null;
  num: number;
}

function buildPageNumbers(
  currentPage: number,
  prevPageUrl: string | null,
  nextPageUrl: string | null,
): PageNumber[] {
  const numbers: PageNumber[] = [];
  if (prevPageUrl) {
    numbers.push({num: currentPage - 1, href: prevPageUrl, current: false});
  }
  numbers.push({num: currentPage, href: null, current: true});
  if (nextPageUrl) {
    numbers.push({num: currentPage + 1, href: nextPageUrl, current: false});
  }
  return numbers;
}

function PhotoFeedController({
  currentPage,
  hasMore,
  initialPage,
  labels,
  locale,
  nextPageUrl,
  onOpen,
  prevPageUrl,
  viewerLabels,
}: PhotoFeedProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const openPhoto = useCallback(
    (photoId: string) => {
      setActiveId(photoId);
      onOpen(photoId);
    },
    [onOpen],
  );

  const { items } = initialPage;

  return (
    <div className="photography-feed">
      {items.length > 0 ? (
        <PhotoOverviewGrid locale={locale} onOpen={openPhoto} photos={items} />
      ) : (
        <p className="photography-feed__status">{labels.empty}</p>
      )}

      <nav
        aria-label="Photography pagination"
        className="photography-feed__pagination"
      >
        {prevPageUrl ? (
          <a className="photography-feed__page-link" href={prevPageUrl}>
            ← {labels.prevPage}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="photography-feed__page-link photography-feed__page-link--disabled"
          >
            ← {labels.prevPage}
          </span>
        )}

        <div
          aria-label={formatPageInfo(labels.pageInfo, currentPage, hasMore)}
          className="photography-feed__page-numbers"
          role="group"
        >
          {buildPageNumbers(currentPage, prevPageUrl, nextPageUrl).map(
            ({num, href, current}) =>
              current ? (
                <span
                  aria-current="page"
                  className="photography-feed__page-number photography-feed__page-number--current"
                  key={num}
                >
                  {num}
                </span>
              ) : (
                <a
                  className="photography-feed__page-number"
                  href={href ?? undefined}
                  key={num}
                >
                  {num}
                </a>
              ),
          )}
        </div>

        <span
          aria-live="polite"
          className="photography-feed__page-info"
        >
          {formatPageInfo(labels.pageInfo, currentPage, hasMore)}
        </span>

        {nextPageUrl ? (
          <a className="photography-feed__page-link" href={nextPageUrl}>
            {labels.nextPage} →
          </a>
        ) : (
          <span
            aria-disabled="true"
            className="photography-feed__page-link photography-feed__page-link--disabled"
          >
            {labels.nextPage} →
          </span>
        )}
      </nav>

      {viewerLabels ? (
        <PhotoViewer
          activeId={activeId}
          labels={viewerLabels}
          locale={locale}
          onClose={() => setActiveId(null)}
          photos={items}
        />
      ) : null}
    </div>
  );
}

export function PhotoFeed(props: PhotoFeedProps) {
  const pageIdentity = props.initialPage.items.map(({ id }) => id).join(',');
  const controllerKey = [
    props.category,
    String(props.currentPage),
    pageIdentity,
  ].join(':');
  return <PhotoFeedController {...props} key={controllerKey} />;
}
