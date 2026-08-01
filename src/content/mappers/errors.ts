export class InvalidContentError extends Error {
  readonly documentType: string;
  readonly documentId?: string;
  readonly validationCode: string;

  constructor(
    documentType: string,
    message: string,
    documentId?: string,
    validationCode = 'invalid_content',
  ) {
    super(message);
    this.name = 'InvalidContentError';
    this.documentType = documentType;
    this.documentId = documentId;
    this.validationCode = validationCode;
  }
}

export class ProfileContentError extends Error {
  constructor(message = 'The required profile content is unavailable.', options?: ErrorOptions) {
    super(message, options);
    this.name = 'ProfileContentError';
  }
}

export class ContentServiceError extends Error {
  readonly module: string;

  constructor(module: string, options?: ErrorOptions) {
    super('The content service is temporarily unavailable.', options);
    this.name = 'ContentServiceError';
    this.module = module;
  }
}

export class HeroPhotoUnavailableError extends Error {
  constructor() {
    super('Neither the configured hero photo nor a featured fallback is available.');
    this.name = 'HeroPhotoUnavailableError';
  }
}
