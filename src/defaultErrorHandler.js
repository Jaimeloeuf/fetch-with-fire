// Default internal error handler function that can be overwritten in class constructor
export default function defaultErrorHandler(error) {
  // @todo Add a environment check to only do this if not production
  console.error(error);
  // Allow error to bubble back to function caller
  return error;
}
