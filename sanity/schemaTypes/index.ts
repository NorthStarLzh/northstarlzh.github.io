import {award} from './award';
import {education} from './education';
import {localizedList, localizedLongText, localizedShortText} from './localized';
import {photo} from './photo';
import {profile} from './profile';
import {paperResult, researchImage, researchProject} from './researchProject';

export const schemaTypes = [
  localizedShortText,
  localizedLongText,
  localizedList,
  researchImage,
  paperResult,
  profile,
  education,
  award,
  photo,
  researchProject,
];

export {
  award,
  education,
  localizedList,
  localizedLongText,
  localizedShortText,
  paperResult,
  photo,
  profile,
  researchImage,
  researchProject,
};
