import type {DocumentActionComponent} from 'sanity';

import {isManagedDocumentType} from './actionState';
import {ConfirmDeleteAction} from './confirmDelete';
import {SaveAndPublishAction} from './saveAndPublish';

export function resolveDocumentActions(
  previous: DocumentActionComponent[],
  context: {schemaType: string},
): DocumentActionComponent[] {
  if (!isManagedDocumentType(context.schemaType)) return previous;

  return previous.filter((action) => {
    // A profile can only be reached through the fixed `profile` document ID.
    return !(context.schemaType === 'profile' && action.action === 'duplicate');
  }).map((action) => {
    if (action.action === 'publish') return SaveAndPublishAction;
    if (action.action === 'delete') return ConfirmDeleteAction;
    // Sanity's restore action and document history UI remain available.
    return action;
  });
}

export {ConfirmDeleteAction, SaveAndPublishAction};
