/**
 * Parse the body of the response (can either be JSON or text) to an object with type indicating properties
 * @function getParsedResponse
 * @param {*} response
 * @returns {object} Returns object with either parsed JSON or string. Check type using parsedResponse.json or parsedResponse.string
 */
export default async function getParsedResponse(response) {
  try {
    // API reference https://developer.mozilla.org/en-US/docs/Web/API/Body/json
    // Read the stream from the cloned response, as the stream can only be read once and
    // if this fails we need to use the stream again for text() reading
    return { json: true, response: await response.clone().json() };
  } catch (_) {
    // API reference https://developer.mozilla.org/en-US/docs/Web/API/Body/text
    return { string: true, response: await response.text() };
  }
}
