import type {StructureResolver} from '../../node_modules/sanity/lib/structure.js';
export {structureTool} from '../../node_modules/sanity/lib/structure.js';

import {BatchUploadPane} from '../components/batch-upload';
import {PROFILE_DOCUMENT_ID} from '../schemaTypes/profile';

export const structure: StructureResolver = (S) =>
  S.list()
    .id('content-management')
    .title('内容管理')
    .items([
      S.listItem()
        .id('profile-singleton')
        .title('个人资料（单例）')
        .child(S.document().schemaType('profile').documentId(PROFILE_DOCUMENT_ID)),
      S.divider(),
      S.documentTypeListItem('education').title('教育经历'),
      S.documentTypeListItem('award').title('获奖经历'),
      S.documentTypeListItem('photo').title('摄影作品'),
      S.documentTypeListItem('photoCollection').title('摄影合集'),
      S.documentTypeListItem('researchProject').title('科研项目'),
      S.divider(),
      S.listItem()
        .id('batch-photo-upload')
        .title('批量上传摄影图')
        .child(S.component(BatchUploadPane).id('batch-photo-upload-pane')),
    ]);

export function filterSingletonTemplates<Template extends {schemaType: string}>(
  templates: Template[],
): Template[] {
  return templates.filter((template) => template.schemaType !== 'profile');
}
