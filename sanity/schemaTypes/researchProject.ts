import {defineArrayMember, defineField, defineType} from 'sanity';

import {
  createFeaturedDocumentValidator,
  validateImageCount,
  validateNonNegativeInteger,
  validateResearchPapers,
} from './validation';

export const researchImage = defineType({
  name: 'researchImage',
  title: '科研项目图片',
  type: 'object',
  fields: [
    defineField({name: 'image', title: '图片', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required().assetRequired()}),
    defineField({name: 'alt', title: '替代文本', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
  ],
});

export const paperResult = defineType({
  name: 'paperResult',
  title: '论文',
  type: 'object',
  fields: [defineField({name: 'title', title: '论文名称', type: 'localizedShortText', validation: (Rule) => Rule.required()})],
  preview: {select: {title: 'title.zh', subtitle: 'title.en'}},
});

export const researchProject = defineType({
  name: 'researchProject',
  title: '科研项目',
  type: 'document',
  fields: [
    defineField({name: 'title', title: '项目名称', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({name: 'period', title: '项目时间', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'summary', title: '项目简介', type: 'localizedLongText', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'images',
      title: '项目图片',
      type: 'array',
      of: [defineArrayMember({type: 'researchImage'})],
      validation: (Rule) => Rule.required().min(1).max(3).custom(validateImageCount),
    }),
    defineField({name: 'noPublishedPapers', title: '暂无论文成果', type: 'boolean', initialValue: false}),
    defineField({
      name: 'papers',
      title: '论文名称',
      type: 'array',
      hidden: ({document}) => document?.noPublishedPapers === true,
      of: [defineArrayMember({type: 'paperResult'})],
      validation: (Rule) => Rule.custom((value, context) => validateResearchPapers(value, context.document?.noPublishedPapers)),
    }),
    defineField({name: 'featured', title: '首页精选', type: 'boolean', initialValue: false}),
    defineField({
      name: 'featuredOrder',
      title: '精选顺序',
      type: 'number',
      hidden: ({document}) => !document?.featured,
      validation: (Rule) => Rule.custom((value, context) => context.document?.featured ? validateNonNegativeInteger(value) : true),
    }),
  ],
  validation: (Rule) => Rule.custom(createFeaturedDocumentValidator(3, '首页精选科研项目')),
  orderings: [{title: '精选顺序', name: 'featuredOrderAsc', by: [{field: 'featuredOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title.zh', subtitle: 'period', media: 'images.0.image'}},
});
