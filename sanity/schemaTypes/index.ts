import {award} from './award';
import {education} from './education';
import {localizedList, localizedLongText, localizedShortText} from './localized';
import {photo} from './photo';
import {photoCollection} from './photoCollection';
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
  photoCollection,
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
  photoCollection,
  profile,
  researchImage,
  researchProject,
};
