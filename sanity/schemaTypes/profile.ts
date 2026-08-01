import {defineField, defineType} from 'sanity';

import {validateEmail, validatePdfAsset} from './validation';

export const PROFILE_DOCUMENT_ID = 'profile';

export const profile = defineType({
  name: 'profile',
  title: '个人资料',
  type: 'document',
  fields: [
    defineField({name: 'nickname', title: '昵称', type: 'string', initialValue: '风花诗酒茶', validation: (Rule) => Rule.required()}),
    defineField({name: 'avatar', title: '头像', type: 'image', options: {hotspot: true}, validation: (Rule) => Rule.required().assetRequired()}),
    defineField({name: 'bio', title: '个人简介', type: 'localizedLongText', validation: (Rule) => Rule.required()}),
    defineField({name: 'institution', title: '学校', type: 'string', initialValue: 'Zhejiang University', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'role',
      title: '身份标签',
      type: 'localizedShortText',
      initialValue: {zh: '视觉中国签约摄影师', en: 'Visual China contracted photographer'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'email', title: '邮箱', type: 'string', initialValue: 'Northstar_lzh@zju.edu.cn', validation: (Rule) => Rule.required().custom(validateEmail)}),
    defineField({name: 'heroPhoto', title: '首页主图', type: 'reference', to: [{type: 'photo'}], validation: (Rule) => Rule.required()}),
    defineField({name: 'resume', title: '简历 PDF', type: 'file', options: {accept: 'application/pdf'}, validation: (Rule) => Rule.custom(validatePdfAsset)}),
  ],
  preview: {select: {title: 'nickname', media: 'avatar'}},
});
