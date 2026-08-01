export interface ValidationMarkerLike {
  level: string;
}

export interface PublishStateInput {
  operationDisabled: false | string;
  isValidating: boolean;
  markers: ValidationMarkerLike[];
}

export function getPublishDisabledReason(input: PublishStateInput): false | string {
  if (input.isValidating) return '正在校验内容…';
  if (input.markers.some((marker) => marker.level === 'error')) {
    return '请先修复校验错误';
  }
  return input.operationDisabled;
}

export function executePublish(
  disabledReason: false | string,
  publish: () => void,
  complete: () => void,
): boolean {
  if (disabledReason) return false;
  publish();
  complete();
  return true;
}

export function isManagedDocumentType(schemaType: string): boolean {
  return ['profile', 'education', 'award', 'photo', 'researchProject'].includes(schemaType);
}
