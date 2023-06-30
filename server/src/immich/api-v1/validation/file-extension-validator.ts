import { FileValidator, Injectable } from '@nestjs/common';

@Injectable()
export default class FileExtensionValidator extends FileValidator {
  constructor(public allowedExtensions: string[]) {
    super({});
  }

  isValid(files?: any): boolean {
    for (const file of files) {
      if (!this.allowedExtensions.includes(file.extension)) {
        return false;
      }
    }
    return true;
  }

  buildErrorMessage(): string {
    return `File has invalid extension, must be one of: ${this.allowedExtensions.join(', ')}`;
  }
}
