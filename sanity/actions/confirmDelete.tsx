import {useState} from 'react';
import {useDocumentOperation} from 'sanity';
import type {DocumentActionComponent} from 'sanity';

export const ConfirmDeleteAction: DocumentActionComponent = (props) => {
  const [confirming, setConfirming] = useState(false);
  const operations = useDocumentOperation(props.id, props.type);

  return {
    action: 'delete',
    label: '删除',
    tone: 'critical',
    disabled: Boolean(operations.delete.disabled),
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'critical',
          message: '确定删除此内容吗？删除后可通过 Sanity 文档历史尝试恢复。',
          onCancel: () => setConfirming(false),
          onConfirm: () => {
            operations.delete.execute();
            setConfirming(false);
            props.onComplete();
          },
        }
      : false,
  };
};

ConfirmDeleteAction.action = 'delete';
ConfirmDeleteAction.displayName = 'ConfirmDeleteAction';
