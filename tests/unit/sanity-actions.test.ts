import type {DocumentActionComponent} from 'sanity';
import {describe, expect, it} from 'vitest';

import {resolveDocumentActions} from '../../sanity/actions';
import {executePublish, getPublishDisabledReason} from '../../sanity/actions/actionState';
import {ConfirmDeleteAction} from '../../sanity/actions/confirmDelete';
import {SaveAndPublishAction} from '../../sanity/actions/saveAndPublish';
import {schemaTypes} from '../../sanity/schemaTypes';
import {filterSingletonTemplates, structure} from '../../sanity/structure';

const fakeAction = (action: string): DocumentActionComponent => {
  const component = (() => null) as DocumentActionComponent;
  component.action = action as NonNullable<DocumentActionComponent['action']>;
  return component;
};

describe('Studio actions', () => {
  it('blocks publishing while validation runs or has errors', () => {
    expect(getPublishDisabledReason({operationDisabled: false, isValidating: true, markers: []})).toContain('校验');
    expect(getPublishDisabledReason({operationDisabled: false, isValidating: false, markers: [{level: 'error'}]})).toContain('修复');
    expect(getPublishDisabledReason({operationDisabled: '没有草稿', isValidating: false, markers: []})).toBe('没有草稿');
    expect(getPublishDisabledReason({operationDisabled: false, isValidating: false, markers: [{level: 'warning'}]})).toBe(false);
  });

  it('never executes a blocked publish and completes a valid publish', () => {
    let published = 0;
    let completed = 0;
    const publish = () => { published += 1; };
    const complete = () => { completed += 1; };

    expect(executePublish('请先修复校验错误', publish, complete)).toBe(false);
    expect([published, completed]).toEqual([0, 0]);
    expect(executePublish(false, publish, complete)).toBe(true);
    expect([published, completed]).toEqual([1, 1]);
  });

  it('replaces publish/delete while retaining restore/history recovery action', () => {
    const restore = fakeAction('restore');
    const resolved = resolveDocumentActions([fakeAction('publish'), fakeAction('delete'), restore], {schemaType: 'photo'});
    expect(resolved).toEqual([SaveAndPublishAction, ConfirmDeleteAction, restore]);
    expect(resolveDocumentActions([restore], {schemaType: 'unknown'})).toEqual([restore]);
  });

  it('removes duplicate from the profile singleton', () => {
    const resolved = resolveDocumentActions([fakeAction('publish'), fakeAction('duplicate')], {schemaType: 'profile'});
    expect(resolved).toEqual([SaveAndPublishAction]);
  });
});

describe('Studio schema and singleton structure', () => {
  it('registers reusable objects and all five content documents', () => {
    expect(schemaTypes.map((schema) => schema.name)).toEqual(expect.arrayContaining([
      'localizedShortText', 'localizedLongText', 'localizedList',
      'profile', 'education', 'award', 'photo', 'researchProject',
    ]));
  });

  it('removes profile from generic creation templates', () => {
    expect(filterSingletonTemplates([{schemaType: 'profile'}, {schemaType: 'photo'}])).toEqual([{schemaType: 'photo'}]);
  });

  it('assigns a stable id to the root content list', () => {
    let rootId: string | undefined;
    const rootList = {
      id(value: string) { rootId = value; return rootList; },
      title() { return rootList; },
      items() { return rootList; },
    };
    const listItem = {
      id() { return listItem; },
      title() { return listItem; },
      child() { return listItem; },
    };
    const document = {
      schemaType() { return document; },
      documentId() { return document; },
    };
    const documentTypeListItem = {title() { return documentTypeListItem; }};

    structure({
      list: () => rootList,
      listItem: () => listItem,
      document: () => document,
      divider: () => ({}),
      documentTypeListItem: () => documentTypeListItem,
      component: () => listItem,
    } as never, {} as never);

    expect(rootId).toBe('content-management');
  });
});
