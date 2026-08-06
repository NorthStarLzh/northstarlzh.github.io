import {defineArrayMember, defineField, defineType} from 'sanity';

import {validateNonNegativeInteger} from './validation';

export const photoCollection = defineType({
  name: 'photoCollection',
  title: '摄影合集',
  type: 'document',
  fields: [
    defineField({name: 'title', title: '合集名称', type: 'localizedShortText', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: '合集简介', type: 'localizedLongText', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'slug',
      title: '链接标识',
      type: 'slug',
      options: {source: 'title.zh'},
      description: '用于合集详情页地址，通常由标题自动生成',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'cover', title: '封面图', type: 'image', options: {hotspot: true}, description: '可选，不填则使用第一张照片'}),
    defineField({name: 'coverAlt', title: '封面替代文本', type: 'localizedShortText', description: '可选'}),
    defineField({
      name: 'photos',
      title: '照片',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'photo'}]})],
      description: '勾选已上传的摄影作品，可拖动排序',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'sortOrder', title: '排序', type: 'number', description: '可选，数字越小越靠前', validation: (Rule) => Rule.custom(validateNonNegativeInteger)}),
  ],
  orderings: [{title: '排序', name: 'sortOrderAsc', by: [{field: 'sortOrder', direction: 'asc'}]}],
  preview: {
    select: {title: 'title.zh', photoCount: 'photos.length', media: 'cover'},
    prepare: ({title, photoCount, media}) => ({
      title: typeof title === 'string' && title.trim() ? title.trim() : '未命名合集',
      subtitle: typeof photoCount === 'number' ? `${photoCount} 张照片` : undefined,
      media,
    }),
  },
});
