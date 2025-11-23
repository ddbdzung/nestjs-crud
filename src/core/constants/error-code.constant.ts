export const MONGODB = {
  MONGO_SERVER_ERROR: 'MongoServerError',
  MONGOOSE_ERROR: 'MongooseError',
  CAST_ERROR: 'CastError',
  SYNC_INDEXES_ERROR: 'SyncIndexesError',
  DISCONNECTED_ERROR: 'DisconnectedError',
  DIVERGENT_ARRAY_ERROR: 'DivergentArrayError',
  MISSING_SCHEMA_ERROR: 'MissingSchemaError',
  DOCUMENT_NOT_FOUND_ERROR: 'DocumentNotFoundError',
  OBJECT_EXPECTED_ERROR: 'ObjectExpectedError',
  OBJECT_PARAMETER_ERROR: 'ObjectParameterError',
  OVERWRITE_MODEL_ERROR: 'OverwriteModelError',
  PARALLEL_SAVE_ERROR: 'ParallelSaveError',
  PARALLEL_VALIDATE_ERROR: 'ParallelValidateError',
  MONGOOSE_SERVER_SELECTION_ERROR: 'MongooseServerSelectionError',
  STRICT_MODE_ERROR: 'StrictModeError',
  VALIDATION_ERROR: 'ValidationError',
  VALIDATOR_ERROR: 'ValidatorError',
  VERSION_ERROR: 'VersionError',
  MONGO_BULK_WRITE_ERROR: 'MongoBulkWriteError',
}

export const MONGOOSE_ERROR_CODES = Object.values(MONGODB)

export const ERROR_MESSAGES: Record<string, string> = {
  // MONGODB
  [MONGODB.MONGO_SERVER_ERROR]: 'MongoDB error',
}
