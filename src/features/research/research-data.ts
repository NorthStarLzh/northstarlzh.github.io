import type {
  ResearchProject,
  ResearchRepository,
} from '@/content/contracts';

export async function loadResearchProjects(
  repository: ResearchRepository,
): Promise<ResearchProject[]> {
  return repository.listAll();
}

export async function loadFeaturedResearch(
  repository: ResearchRepository,
): Promise<ResearchProject[]> {
  return repository.listFeatured(3);
}
