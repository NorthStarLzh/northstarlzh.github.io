import type {Photo} from '@/content/contracts';

export function derivePhotoIndex(photos: Photo[], activeId: string | null): number {
  if (!activeId) return -1;
  return photos.findIndex(({id}) => id === activeId);
}
