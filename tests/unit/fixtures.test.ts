import { describe, expect, it } from 'vitest';

import {
  awardFixtures,
  createDeterministicPhotoDataset,
  educationFixtures,
  landscapePhotoFixture,
  photoDataset,
  portraitPhotoFixture,
  profileFixture,
  researchProjectFixtures,
  researchProjectOneImageFixture,
  researchProjectThreeImagesFixture,
  researchProjectTwoImagesFixture,
} from '@fixtures/domain';

describe('minimal domain fixtures', () => {
  it('provides complete profile, education, and award objects', () => {
    expect(profileFixture.avatar.id).toBeTruthy();
    expect(profileFixture.bio.zh).toBeTruthy();
    expect(profileFixture.bio.en).toBeTruthy();
    expect(profileFixture.email).toBe('portfolio-owner@example.com');
    expect(educationFixtures).toHaveLength(2);
    expect(awardFixtures).toHaveLength(2);
  });

  it('provides landscape, portrait, and cross-category coverage', () => {
    expect(landscapePhotoFixture.categories).toEqual(['landscape']);
    expect(portraitPhotoFixture.categories).toEqual(['portrait']);
    expect(photoDataset.some(({ categories }) => categories.length === 2)).toBe(true);
  });

  it('provides research projects with one, two, and three images', () => {
    expect(researchProjectOneImageFixture.images).toHaveLength(1);
    expect(researchProjectTwoImagesFixture.images).toHaveLength(2);
    expect(researchProjectThreeImagesFixture.images).toHaveLength(3);
  });
});

describe('deterministic photo dataset', () => {
  it('creates exactly 100 metadata-only photos with five featured entries', () => {
    expect(photoDataset).toHaveLength(100);
    expect(photoDataset.filter(({ featured }) => featured)).toHaveLength(5);
    expect(new Set(photoDataset.map(({ id }) => id)).size).toBe(100);
    expect(photoDataset.every(({ image }) => !('url' in image))).toBe(true);
  });

  it('covers both categories, cross-category entries, and multiple year-months', () => {
    expect(photoDataset.some(({ categories }) => categories.includes('landscape'))).toBe(true);
    expect(photoDataset.some(({ categories }) => categories.includes('portrait'))).toBe(true);
    expect(photoDataset.some(({ categories }) => categories.length === 2)).toBe(true);
    expect(new Set(photoDataset.map(({ shotAt }) => shotAt)).size).toBeGreaterThan(12);
  });

  it('produces equal fresh output on every run', () => {
    const first = createDeterministicPhotoDataset();
    const second = createDeterministicPhotoDataset();
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
  });

  it.each([-1, 1.5])('rejects an invalid requested size %s', (count) => {
    expect(() => createDeterministicPhotoDataset(count)).toThrow(RangeError);
  });
});

describe('cross-document fixture invariants', () => {
  it('keeps featured photos at or below five', () => {
    expect(photoDataset.filter(({ featured }) => featured).length).toBeLessThanOrEqual(5);
  });

  it('keeps featured research projects at or below three', () => {
    expect(researchProjectFixtures.filter(({ featured }) => featured).length).toBeLessThanOrEqual(3);
  });

  it('keeps every research project between one and three images', () => {
    expect(
      researchProjectFixtures.every(({ images }) => images.length >= 1 && images.length <= 3),
    ).toBe(true);
  });
});
