import {defineArrayMember, defineField, defineType} from 'sanity';

import {validateBilingualList, validateRequiredLocalized} from './validation';

export const localizedShortText = defineType({
  name: 'localizedShortText',
  title: '双语短文本',
  type: 'object',
  fields: [
    defineField({name: 'zh', title: '中文', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required()}),
  ],
  validation: (Rule) => Rule.custom(validateRequiredLocalized),
});

export const localizedLongText = defineType({
  name: 'localizedLongText',
  title: '双语长文本',
  type: 'object',
  fields: [
    defineField({
      name: 'zh',
      title: '中文',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required(),
    }),
  ],
  validation: (Rule) => Rule.custom(validateRequiredLocalized),
});

export const localizedList = defineType({
  name: 'localizedList',
  title: '双语列表',
  type: 'object',
  fields: [
    defineField({
      name: 'zh',
      title: '中文列表',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'en',
      title: 'English list',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  validation: (Rule) => Rule.custom(validateBilingualList),
});
