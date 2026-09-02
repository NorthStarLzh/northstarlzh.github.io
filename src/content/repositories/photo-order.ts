import type {Photo, PhotoCategory} from '../contracts';

function byFeaturedOrder(left: Photo, right: Photo): number {
  return (left.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
    (right.featuredOrder ?? Number.MAX_SAFE_INTEGER);
}

function compareLegacyPhotos(left: Photo, right: Photo): number {
  if (left.featured !== right.featured) {
    return left.featured ? -1 : 1;
  }

  if (left.featured && right.featured) {
    const featuredDifference = byFeaturedOrder(left, right);
    if (featuredDifference !== 0) return featuredDifference;
  }

  const dateDifference = (right.shotAt ?? '').localeCompare(left.shotAt ?? '');
  return dateDifference === 0 ? left.id.localeCompare(right.id) : dateDifference;
}

/**
 * Produces a repeatable, category-specific shuffle score without relying on
 * request-time randomness. The stable score is important: pagination must not
 * duplicate or skip photos when two works share the same display number.
 */
function stableShuffleScore(id: string, category: PhotoCategory, order: number): number {
  let hash = 2_166_136_261;
  const input = `${category}:${order}:${id}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/**
 * Sorts category pages by their editorial number. Equal numbers use a stable
 * shuffle, while old unnumbered work retains the previous featured/date order.
 */
export function comparePhotosForCategory(
  left: Photo,
  right: Photo,
  category: PhotoCategory,
): number {
  const leftOrder = left.displayOrder;
  const rightOrder = right.displayOrder;
  if (leftOrder !== undefined || rightOrder !== undefined) {
    if (leftOrder === undefined) return 1;
    if (rightOrder === undefined) return -1;
    const orderDifference = leftOrder - rightOrder;
    if (orderDifference !== 0) return orderDifference;

    const shuffleDifference = stableShuffleScore(left.id, category, leftOrder) -
      stableShuffleScore(right.id, category, rightOrder);
    return shuffleDifference === 0 ? left.id.localeCompare(right.id) : shuffleDifference;
  }

  return compareLegacyPhotos(left, right);
}
