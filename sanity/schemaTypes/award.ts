import {defineField, defineType} from 'sanity';

import {validateNonNegativeInteger, validateOptionalLocalized, validateYearOrMonth} from './validation';

export const award = defineType({
  name: 'award',
  title: '获奖经历',
  type: 'document',
  fields: [
    defineField({name: 'title', title: '奖项名称', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({name: 'date', title: '获奖时间', type: 'string', description: 'YYYY 或 YYYY-MM', validation: (Rule) => Rule.required().custom(validateYearOrMonth)}),
    defineField({name: 'description', title: '补充说明（可选）', type: 'localizedLongText', validation: (Rule) => Rule.custom(validateOptionalLocalized)}),
    defineField({name: 'order', title: '排序', type: 'number', initialValue: 0, validation: (Rule) => Rule.required().custom(validateNonNegativeInteger)}),
  ],
  orderings: [{title: '排序（升序）', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title.zh', subtitle: 'date'}},
});
