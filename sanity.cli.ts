import {defineCliConfig} from 'sanity/cli';

import {getSanityEnvironment} from './sanity/env';

const environment = getSanityEnvironment();

export default defineCliConfig({
  api: {
    projectId: environment.projectId,
    dataset: environment.dataset,
  },
});
