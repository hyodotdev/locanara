/**
 * Locanara Web SDK Errors
 */

export enum LocanaraErrorCode {
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DOWNLOAD_REQUIRED = 'DOWNLOAD_REQUIRED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  ABORTED = 'ABORTED',
}

export class LocanaraError extends Error {
  code: LocanaraErrorCode
  details?: unknown

  constructor(code: LocanaraErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'LocanaraError'
    this.code = code
    this.details = details
  }

  static notSupported(feature: string): LocanaraError {
    return new LocanaraError(
      LocanaraErrorCode.NOT_SUPPORTED,
      `${feature} is not supported in this browser`,
    )
  }

  static notAvailable(feature: string): LocanaraError {
    return new LocanaraError(
      LocanaraErrorCode.NOT_AVAILABLE,
      `${feature} is not available on this device`,
    )
  }

  static downloadRequired(feature: string): LocanaraError {
    return new LocanaraError(
      LocanaraErrorCode.DOWNLOAD_REQUIRED,
      `${feature} requires model download. Call with autoDownload: true option.`,
    )
  }

  static initializationFailed(feature: string, details?: unknown): LocanaraError {
    return new LocanaraError(
      LocanaraErrorCode.INITIALIZATION_FAILED,
      `Failed to initialize ${feature}`,
      details,
    )
  }

  static executionFailed(feature: string, details?: unknown): LocanaraError {
    return new LocanaraError(
      LocanaraErrorCode.EXECUTION_FAILED,
      `Failed to execute ${feature}`,
      details,
    )
  }

  static invalidInput(message: string): LocanaraError {
    return new LocanaraError(LocanaraErrorCode.INVALID_INPUT, message)
  }

  static aborted(): LocanaraError {
    return new LocanaraError(LocanaraErrorCode.ABORTED, 'Operation was aborted')
  }
}
