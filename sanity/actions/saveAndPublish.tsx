import {useDocumentOperation, useValidationStatus} from 'sanity';
import type {DocumentActionComponent} from 'sanity';

import {executePublish, getPublishDisabledReason} from './actionState';

export const SaveAndPublishAction: DocumentActionComponent = (props) => {
  const operations = useDocumentOperation(props.id, props.type);
  const validation = useValidationStatus(props.id, props.type, true);
  const disabled = getPublishDisabledReason({
    operationDisabled: operations.publish.disabled,
    isValidating: validation.isValidating,
    markers: validation.validation,
  });

  return {
    action: 'publish',
    label: '保存并公开',
    disabled: Boolean(disabled),
    tone: disabled ? 'caution' : 'positive',
    onHandle: () => {
      executePublish(disabled, operations.publish.execute, props.onComplete);
    },
  };
};

SaveAndPublishAction.action = 'publish';
SaveAndPublishAction.displayName = 'SaveAndPublishAction';
