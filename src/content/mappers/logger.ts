import {InvalidContentError} from './errors';

export interface InvalidDocumentLog {
  event: 'content.invalid_document';
  module: 'profile' | 'education' | 'awards' | 'photos' | 'research';
  documentType: string;
  documentId: string;
  errorCategory: 'validation';
  validationCode: string;
}

export interface ContentLogger {
  invalidDocument(entry: InvalidDocumentLog): void;
}

function safeDocumentId(id: string | undefined): string {
  if (!id) return 'unknown';
  return id.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 128) || 'unknown';
}

function safeValidationCode(code: string | undefined): string {
  if (!code) return 'unknown';
  return code.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 96) || 'unknown';
}

export const consoleContentLogger: ContentLogger = {
  invalidDocument(entry) {
    console.error(JSON.stringify(entry));
  },
};

export function logInvalidDocument(
  logger: ContentLogger,
  module: InvalidDocumentLog['module'],
  documentType: string,
  error: unknown,
): void {
  const documentId = error instanceof InvalidContentError ? error.documentId : undefined;
  const validationCode = error instanceof InvalidContentError
    ? error.validationCode
    : undefined;
  logger.invalidDocument({
    event: 'content.invalid_document',
    module,
    documentType,
    documentId: safeDocumentId(documentId),
    errorCategory: 'validation',
    validationCode: safeValidationCode(validationCode),
  });
}
