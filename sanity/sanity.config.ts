import {defineConfig} from 'sanity';
import {resolveDocumentActions} from './actions';
import {getSanityEnvironment} from './env';
import {schemaTypes} from './schemaTypes';
import {filterSingletonTemplates, structure, structureTool} from './structure';

const environment = getSanityEnvironment();

export default defineConfig({
  name: 'portfolioStudio',
  title: '风花诗酒茶 · 内容后台',
  projectId: environment.projectId,
  dataset: environment.dataset,
  basePath: '/studio',
  plugins: [structureTool({structure})],
  schema: {
    types: schemaTypes,
    templates: (previous) => filterSingletonTemplates(previous),
  },
  document: {actions: resolveDocumentActions},
});
