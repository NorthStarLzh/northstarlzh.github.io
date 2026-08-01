import type {AwardEntry, EducationEntry, Profile} from '../contracts';
import {isValidEmail} from '../contracts';
import {InvalidContentError} from './errors';
import {
  asRecord,
  localizedText,
  mapImageAsset,
  nonNegativeInteger,
  optionalDocumentId,
  requiredId,
  requiredString,
} from './helpers';

const AWARD_DATE = /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/;
const SANITY_FILE_HOSTS = new Set(['cdn.sanity.io']);

function mapResumeUrl(value: unknown, documentId?: string): string {
  if (value === undefined || value === null || value === '') return '';
  const raw = requiredString(value, 'resumeUrl', 'profile', documentId);
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !SANITY_FILE_HOSTS.has(url.hostname) || !url.pathname.startsWith('/files/')) {
      throw new Error('Unsupported asset URL.');
    }
    return url.toString();
  } catch {
    throw new InvalidContentError(
      'profile',
      'resumeUrl must be a Sanity file asset URL.',
      documentId,
      'resumeUrl.sanity_asset_required',
    );
  }
}

export function mapProfile(value: unknown): Profile {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'profile', documentId);
  const nickname = requiredString(raw.nickname, 'nickname', 'profile', documentId);
  const email = requiredString(raw.email, 'email', 'profile', documentId);
  if (!isValidEmail(email)) {
    throw new InvalidContentError('profile', 'email must be valid.', documentId, 'email.valid_required');
  }

  return {
    nickname,
    avatar: mapImageAsset(raw.avatar, 'profile', documentId, {
      zh: `${nickname}的头像`,
      en: `Portrait of ${nickname}`,
    }),
    bio: localizedText(raw.bio, 'bio', 'profile', documentId),
    institution: requiredString(raw.institution, 'institution', 'profile', documentId),
    role: localizedText(raw.role, 'role', 'profile', documentId),
    email,
    heroPhotoId: typeof raw.heroPhotoId === 'string' ? raw.heroPhotoId.trim() : '',
    resumeUrl: mapResumeUrl(raw.resumeUrl, documentId),
  };
}

export function mapEducation(value: unknown): EducationEntry {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'education', documentId);
  const id = requiredId(raw._id, 'education', documentId);
  return {
    id,
    institution: localizedText(raw.institution, 'institution', 'education', id),
    description: localizedText(raw.description, 'description', 'education', id),
    period: requiredString(raw.period, 'period', 'education', id),
    order: nonNegativeInteger(raw.order, 'order', 'education', id),
  };
}

export function mapAward(value: unknown): AwardEntry {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'award', documentId);
  const id = requiredId(raw._id, 'award', documentId);
  const date = requiredString(raw.date, 'date', 'award', id);
  if (!AWARD_DATE.test(date)) {
    throw new InvalidContentError(
      'award',
      'date must use YYYY or YYYY-MM.',
      id,
      'date.year_or_month_required',
    );
  }
  const description = raw.description === undefined || raw.description === null
    ? undefined
    : localizedText(raw.description, 'description', 'award', id);
  return {
    id,
    title: localizedText(raw.title, 'title', 'award', id),
    date,
    ...(description ? {description} : {}),
    order: nonNegativeInteger(raw.order, 'order', 'award', id),
  };
}
