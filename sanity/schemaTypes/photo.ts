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
    defineField({name: 'alt', title: '无障碍替代文本', type: 'localizedShortText', description: '可选，填写后用于图片无障碍描述与列表标签'}),
    defineField({
      name: 'categories',
      title: '分类',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'grid', list: [{title: '风光', value: 'landscape'}, {title: '人像', value: 'portrait'}]},
      description: '可选，未分类的图片不会出现在分类页',
      validation: (Rule) => Rule.unique().custom(validateCategories),
    }),
    defineField({name: 'shotAt', title: '拍摄年月', type: 'string', description: '可选，YYYY-MM', validation: (Rule) => Rule.custom(validateYearMonth)}),
    defineField({name: 'city', title: '拍摄城市', type: 'localizedShortText', description: '可选'}),
    defineField({name: 'description', title: '作品介绍', type: 'localizedLongText', description: '可选'}),
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
  preview: {
    select: {altZh: 'alt.zh', shotAt: 'shotAt', media: 'image'},
    prepare: ({altZh, shotAt, media}) => ({
      title: typeof altZh === 'string' && altZh.trim() ? altZh.trim() : '未命名摄影作品',
      subtitle: typeof shotAt === 'string' && shotAt.trim() ? shotAt.trim() : undefined,
      media,
    }),
  },
});
