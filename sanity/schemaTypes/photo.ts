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
  groups: [
    {name: 'upload', title: '上传与基本信息', default: true},
    {name: 'display', title: '展示与排序'},
    {name: 'details', title: '拍摄信息'},
  ],
  fields: [
    defineField({name: 'image', title: '高清原图', type: 'image', group: 'upload', options: {hotspot: true}, validation: (Rule) => Rule.required().assetRequired()}),
    defineField({name: 'alt', title: '无障碍替代文本', type: 'localizedShortText', group: 'upload', description: '可选，填写后用于图片无障碍描述与列表标签'}),
    defineField({
      name: 'categories',
      title: '分类',
      type: 'array',
      group: 'display',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'grid', list: [{title: '风光', value: 'landscape'}, {title: '人像', value: 'portrait'}]},
      description: '可选，未分类的图片不会出现在分类页',
      validation: (Rule) => Rule.unique().custom(validateCategories),
    }),
    defineField({
      name: 'displayOrder',
      title: '分类页排序编号',
      type: 'number',
      group: 'display',
      description: '可选。数字越小越靠前；相同编号的作品会稳定随机排列。未填写的旧作品排在已编号作品之后。',
      validation: (Rule) => Rule.custom((value) => {
        if (value === undefined || value === null) return true;
        if (!Number.isSafeInteger(value)) return '排序必须是非负整数';
        return validateNonNegativeInteger(value);
      }),
    }),
    defineField({name: 'featured', title: '首页精选', type: 'boolean', group: 'display', initialValue: false}),
    defineField({
      name: 'featuredOrder',
      title: '精选顺序',
      type: 'number',
      group: 'display',
      hidden: ({document}) => !document?.featured,
      validation: (Rule) => Rule.custom((value, context) => context.document?.featured ? validateNonNegativeInteger(value) : true),
    }),
    defineField({name: 'shotAt', title: '拍摄年月', type: 'string', group: 'details', description: '可选，YYYY-MM', validation: (Rule) => Rule.custom(validateYearMonth)}),
    defineField({name: 'city', title: '拍摄城市', type: 'localizedShortText', group: 'details', description: '可选'}),
    defineField({name: 'description', title: '作品介绍', type: 'localizedLongText', group: 'details', description: '可选'}),
  ],
  validation: (Rule) => Rule.custom(createFeaturedDocumentValidator(5, '精选摄影作品')),
  orderings: [
    {title: '分类页排序（小到大）', name: 'displayOrderAsc', by: [{field: 'displayOrder', direction: 'asc'}, {field: 'shotAt', direction: 'desc'}]},
    {title: '拍摄时间（新到旧）', name: 'shotAtDesc', by: [{field: 'shotAt', direction: 'desc'}]},
  ],
  preview: {
    select: {altZh: 'alt.zh', displayOrder: 'displayOrder', shotAt: 'shotAt', media: 'image'},
    prepare: ({altZh, displayOrder, shotAt, media}) => {
      const subtitle = [
        typeof displayOrder === 'number' ? `排序 #${displayOrder}` : '未编号',
        typeof shotAt === 'string' && shotAt.trim() ? shotAt.trim() : undefined,
      ].filter((value): value is string => Boolean(value)).join(' · ');
      return {
        title: typeof altZh === 'string' && altZh.trim() ? altZh.trim() : '未命名摄影作品',
        subtitle,
        media,
      };
    },
  },
});
