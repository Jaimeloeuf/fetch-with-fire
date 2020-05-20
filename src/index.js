/**
 * Module that extends the browser fetch method to interact with backend with firebase auth tokens
 * @author JJ
 */

import deepmerge from "deepmerge";

// Throws an error and prevent module from being used if fetch is not available
if (!window.fetch) throw new Error("FETCH API NOT AVAILABLE ON BROWSER");

/**
 * Parse the body of the response (can either be JSON or text) to an object with type indicating properties
 * @function getParsedResponse
 * @param {*} response
 * @returns {object} Returns object with either parsed JSON or string. Check type using parsedResponse.json or parsedResponse.string
 */
async function getParsedResponse(response) {
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

/**
 * Only returns authentication header if user is authenticated.
 * Split out so if user is unauthenticated, this does not throw if currenUser is null
 * @function getAuthHeader
 * @param {function} [firebaseAuth] Firebase auth method
 * @returns {String} Authentication header or nothing.
 */
async function getAuthHeader(firebaseAuth) {
  if (firebaseAuth().currentUser)
    return `Bearer ${await firebaseAuth().currentUser.getIdToken()}`;
}

function defaultErrorHandler(error) {
  // Default internal error handler function that can be overwritten via setup()

  // @todo Add a environment check to only do this if not production
  console.error(error);
  // Allow error to bubble back to function caller
  return error;
}

/**
 * Suggested to import the package under the "api" name to avoid collision with window.fetch
 *
 * @example
 * api.get(url)
 * api.modify(custom request object).get(url)
 * api.post(url, data)
 *
 * @notice GET/POST methods are basically _get/_post with no init objects applied
 */
export default class fetch {
  /**
   * @param {function} firebaseAuth The same firebase auth function that ran initializeApp()
   * @param {string} apiUrl Base API URL
   * @param {function} [errorHandler] Error handling function for when the fetch failed
   */
  constructor(firebaseAuth, apiUrl, errorHandler) {
    if (!firebaseAuth)
      throw new Error("Firebase Auth is required for this to work");

    // Internal firebase auth instance that must be set to share the same auth instance between this library and your app
    this._firebaseAuth = firebaseAuth;

    // Set the module's internal base api URL
    this._apiUrl = apiUrl;

    // Only set the error handler if defined, else keep the default handler
    if (errorHandler) this._errorHandler = errorHandler;
    else this._errorHandler = defaultErrorHandler;

    this.get = this._get(undefined, firebaseAuth);
    this.post = this._post(undefined, firebaseAuth);
  }

  /**
   * Inner fetch function used to prepend API base URL and parse the response
   * @function _fetch
   * @param {String} url path of the API only, the base API will be prepended
   * @param {object} init Request object required by fetch
   */
  async _fetch(url = "", init) {
    try {
      // Call window fetch with prepended API URL and default request object
      const response = await window.fetch(this._apiUrl + url, init);

      const parsedResponse = await getParsedResponse(response);

      /* Return base on type of body data and include status code along side */
      if (parsedResponse.json)
        return { ...parsedResponse.response, statusCode: response.status };
      else if (parsedResponse.string)
        return { body: parsedResponse.response, statusCode: response.status };
      else throw new Error("Invalid body type. Neither JSON nor String");
    } catch (error) {
      return this._errorHandler(error);
    }
  }

  /**
   * GET curried function that takes a init object before an URL
   */
  _get(init = {}) {
    // Arrow function to inherit "this", without using explicit "this" binding
    return async (url) =>
      this._fetch(
        url,
        deepmerge(
          {
            method: "GET",
            headers: {
              Authorization: await getAuthHeader(this._firebaseAuth),
            },
          },
          init
        )
      );
  }

  /**
   * POST curried function that takes a init object before an URL and data
   */
  _post(init = {}) {
    // Arrow function to inherit "this", without using explicit "this" binding
    return async (url, data) => {
      if (data) init.body = JSON.stringify(data);

      return this._fetch(
        url,
        deepmerge(
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: await getAuthHeader(this._firebaseAuth),
            },
          },
          init
        )
      );
    };
  }

  /**
   * Function to modify init object only once before making a new request
   * @param {object} init Request object for fetch
   * @returns {object} Same API object with custom request object partially applied.
   *
   * @example
   * api.modify(custom request object).post(url, data)
   */
  modify(init) {
    // Return the http methods to chain it and make a request
    return {
      get: this._get(init),
      post: this._post(init),
    };
  }
}
