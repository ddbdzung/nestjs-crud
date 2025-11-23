export interface IThrowable {
  /**
   * Serialize to JSON object format (for error/API response)
   *
   * Throwable object with all properties serialized
   */
  toJSON(): object
}
