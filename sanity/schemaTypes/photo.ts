import {defineArrayMember, defineField, defineType} from 'sanity';

import {
  createFeaturedDocumentValidator,
  validateCategories,
  validateNonNegativeInteger,
  validateYearMonth,
} from './validation';

export const photo = defineType({
  name: 'photo',
  title: '摄影作品',
  type: 'document',
  fields: [
    defineField({name: 'image', title: '高清原图', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required().assetRequired()}),
    defineField({name: 'alt', title: '无障碍替代文本', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'categories',
      title: '分类',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'grid', list: [{title: '风光', value: 'landscape'}, {title: '人像', value: 'portrait'}]},
      validation: (Rule) => Rule.required().unique().custom(validateCategories),
    }),
    defineField({name: 'shotAt', title: '拍摄年月', type: 'string', description: 'YYYY-MM', validation: (Rule) => Rule.required().custom(validateYearMonth)}),
    defineField({name: 'city', title: '拍摄城市', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: '作品介绍', type: 'localizedLongText', validation: (Rule) => Rule.required()}),
    defineField({name: 'featured', title: '首页精选', type: 'boolean', initialValue: false}),
    defineField({
      name: 'featuredOrder',
      title: '精选顺序',
      type: 'number',
      hidden: ({document}) => !document?.featured,
      validation: (Rule) => Rule.custom((value, context) => context.document?.featured ? validateNonNegativeInteger(value) : true),
    }),
  ],
  validation: (Rule) => Rule.custom(createFeaturedDocumentValidator(5, '精选摄影作品')),
  orderings: [{title: '拍摄时间（新到旧）', name: 'shotAtDesc', by: [{field: 'shotAt', direction: 'desc'}]}],
  preview: {select: {title: 'alt.zh', subtitle: 'shotAt', media: 'image'}},
});
