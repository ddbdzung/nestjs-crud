export function requiredAliasPlugin(schema: import('mongoose').Schema): void {
  schema.eachPath((_pathname, schematype: any) => {
    const opts = schematype.options as any
    if (opts && Object.prototype.hasOwnProperty.call(opts, 'isRequired')) {
      // Transfer value
      opts.required = opts.isRequired
      delete opts.isRequired
      // Update underlying schema type options too
      schematype.options.required = opts.required
    }
  })
}
