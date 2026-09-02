import type {PaperResult, ResearchProject} from '../contracts';
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

function mapPaper(value: unknown, projectId: string): PaperResult {
  const raw = asRecord(value, 'paperResult', projectId);
  return {
    id: requiredString(raw._key, 'papers._key', 'researchProject', projectId),
    title: localizedText(raw.title, 'papers.title', 'researchProject', projectId),
  };
}

export function mapResearchProject(value: unknown): ResearchProject {
  const documentId = optionalDocumentId(value);
  const raw = asRecord(value, 'researchProject', documentId);
  const id = requiredId(raw._id, 'researchProject', documentId);
  if (!Array.isArray(raw.images) || raw.images.length < 1 || raw.images.length > 3) {
    throw new InvalidContentError(
      'researchProject',
      'images must contain between one and three assets.',
      id,
      'images.one_to_three_required',
    );
  }
  const images = raw.images.map((image) => mapImageAsset(image, 'researchProject', id));
  let papers: PaperResult[];
  if (Array.isArray(raw.papers)) {
    papers = raw.papers.map((paper) => mapPaper(paper, id));
  } else if (
    raw.noPublishedPapers === true &&
    (raw.papers === null || raw.papers === undefined)
  ) {
    // Sanity omits a hidden array field from the GROQ result as null. The
    // explicit marker makes that absence equivalent to an empty result list.
    papers = [];
  } else {
    throw new InvalidContentError(
      'researchProject',
      'papers must be an array.',
      id,
      'papers.array_required',
    );
  }
  if (papers.length === 0 && raw.noPublishedPapers !== true) {
    throw new InvalidContentError(
      'researchProject',
      'papers require a result or an explicit empty marker.',
      id,
      'papers.result_or_empty_marker_required',
    );
  }
  const featured = raw.featured === true;
  const featuredOrder = featured
    ? nonNegativeInteger(raw.featuredOrder, 'featuredOrder', 'researchProject', id)
    : undefined;
  return {
    id,
    title: localizedText(raw.title, 'title', 'researchProject', id),
    period: requiredString(raw.period, 'period', 'researchProject', id),
    summary: localizedText(raw.summary, 'summary', 'researchProject', id),
    images,
    papers,
    featured,
    ...(featuredOrder === undefined ? {} : {featuredOrder}),
  };
}
