import {defineField, defineType} from 'sanity';

import {validateNonNegativeInteger} from './validation';

export const education = defineType({
  name: 'education',
  title: '教育经历',
  type: 'document',
  fields: [
    defineField({name: 'institution', title: '学校 / 机构', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: '经历说明', type: 'localizedLongText', validation: (Rule) => Rule.required()}),
    defineField({name: 'period', title: '起止时间', type: 'string', description: '例如：2022-09 — 2026-06', validation: (Rule) => Rule.required()}),
    defineField({name: 'order', title: '排序', type: 'number', initialValue: 0, validation: (Rule) => Rule.required().custom(validateNonNegativeInteger)}),
  ],
  orderings: [{title: '排序（升序）', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'institution.zh', subtitle: 'period'}},
});
