import type {
  AwardEntry,
  EducationEntry,
  Profile,
  ProfileRepository,
} from '@/content/contracts';

export interface ResumeContent {
  profile: Profile;
  education: EducationEntry[];
  awards: AwardEntry[];
}

export async function loadResumeContent(
  repository: ProfileRepository,
): Promise<ResumeContent> {
  const [profile, education, awards] = await Promise.all([
    repository.getProfile(),
    repository.listEducation(),
    repository.listAwards(),
  ]);

  return { profile, education, awards };
}
