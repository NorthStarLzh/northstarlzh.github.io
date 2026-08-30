import {defineQuery} from 'next-sanity';

const IMAGE_FIELDS = `
  "id": asset->_id,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "blurDataUrl": asset->metadata.lqip
`;

const PHOTO_FIELDS = `
  _id,
  "image": image{
    ${IMAGE_FIELDS},
    "alt": ^.alt
  },
  categories,
  shotAt,
  city,
  description,
  "featured": featured == true,
  featuredOrder
`;

const COLLECTION_COVER_FIELDS = `
  "id": asset->_id,
  "width": asset->metadata.dimensions.width,
  "height": asset->metadata.dimensions.height,
  "blurDataUrl": asset->metadata.lqip,
  "alt": ^.coverAlt
`;

const COLLECTION_FIELDS = `
  _id,
  title,
  description,
  "slug": slug.current,
  "cover": cover{${COLLECTION_COVER_FIELDS}},
  "photos": photos[]->{${PHOTO_FIELDS}},
  sortOrder
`;

const RESEARCH_FIELDS = `
  _id,
  title,
  period,
  summary,
  "images": images[]{
    "id": image.asset->_id,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
    "blurDataUrl": image.asset->metadata.lqip,
    alt
  },
  papers[]{_key, title},
  noPublishedPapers,
  "featured": featured == true,
  featuredOrder
`;

export const PROFILE_QUERY = defineQuery(`
  *[_type == "profile" && _id == "profile"][0]{
    nickname,
    "avatar": avatar{
      ${IMAGE_FIELDS}
    },
    bio,
    institution,
    role,
    email,
    "heroPhotoId": heroPhoto->_id,
    "resumeUrl": resume.asset->url
  }
`);

export const EDUCATION_QUERY = defineQuery(`
  *[_type == "education"] | order(order asc, _id asc){
    _id,
    institution,
    description,
    period,
    order
  }
`);

export const AWARDS_QUERY = defineQuery(`
  *[_type == "award"] | order(order asc, _id asc){
    _id,
    title,
    date,
    description,
    order
  }
`);

export const HERO_PHOTO_QUERY = defineQuery(`
  *[_type == "profile" && _id == "profile"][0].heroPhoto->{
    ${PHOTO_FIELDS}
  }
`);

export const HERO_PHOTO_DARK_QUERY = defineQuery(`
  *[_type == "profile" && _id == "profile"][0].heroPhotoDark->{
    ${PHOTO_FIELDS}
  }
`);

export const FEATURED_PHOTOS_QUERY = defineQuery(`
  *[_type == "photo" && featured == true]
    | order(featuredOrder asc, shotAt desc, _id asc)[0...5]{
      ${PHOTO_FIELDS}
    }
`);

const PHOTO_PAGE_QUERY_TEMPLATE = `
  *[
    _type == "photo" &&
    $category in categories &&
    (
      $hasCursor == false ||
      (
        $cursorFeatured == true &&
        (
          featured != true ||
          (
            featured == true &&
            (
              coalesce(featuredOrder, 2147483647) > $cursorFeaturedOrder ||
              (
                coalesce(featuredOrder, 2147483647) == $cursorFeaturedOrder &&
                (
                  coalesce(shotAt, "") < $cursorShotAt ||
                  (coalesce(shotAt, "") == $cursorShotAt && _id > $cursorId)
                )
              )
            )
          )
        )
      ) ||
      (
        $cursorFeatured == false &&
        featured != true &&
        (
          coalesce(shotAt, "") < $cursorShotAt ||
          (coalesce(shotAt, "") == $cursorShotAt && _id > $cursorId)
        )
      )
    )
  ] | order(
    select(featured == true => 0, 1) asc,
    select(featured == true => coalesce(featuredOrder, 2147483647), 2147483647) asc,
    coalesce(shotAt, "") desc,
    _id asc
  )[0...__FETCH_LIMIT__]{
    ${PHOTO_FIELDS}
  }
`;

export function createPhotoPageQuery(fetchLimit: number): string {
  if (!Number.isInteger(fetchLimit) || fetchLimit < 2 || fetchLimit > 21) {
    throw new RangeError('Photo query fetch limit must be between 2 and 21.');
  }
  return defineQuery(PHOTO_PAGE_QUERY_TEMPLATE.replace('__FETCH_LIMIT__', String(fetchLimit)));
}

export const PHOTO_PAGE_QUERY = createPhotoPageQuery(21);

export const FEATURED_RESEARCH_QUERY = defineQuery(`
  *[_type == "researchProject" && featured == true]
    | order(featuredOrder asc, period desc, _id asc)[0...3]{
      ${RESEARCH_FIELDS}
    }
`);

export const ALL_RESEARCH_QUERY = defineQuery(`
  *[_type == "researchProject"]
    | order(select(featured == true => 0, 1) asc, featuredOrder asc, period desc, _id asc){
      ${RESEARCH_FIELDS}
    }
`);

export const RESEARCH_BY_ID_QUERY = defineQuery(`
  *[_type == "researchProject" && _id == $id][0]{
    ${RESEARCH_FIELDS}
  }
`);

export const ALL_COLLECTIONS_QUERY = defineQuery(`
  *[_type == "photoCollection"]
    | order(coalesce(sortOrder, 2147483647) asc, _createdAt desc, _id asc){
      ${COLLECTION_FIELDS}
    }
`);

export const COLLECTION_BY_SLUG_QUERY = defineQuery(`
  *[_type == "photoCollection" && slug.current == $slug][0]{
    ${COLLECTION_FIELDS}
  }
`);
