/**
 * Module that extends the browser fetch method to interact with backend with firebase auth tokens
 * @author JJ
 */

// Throws an error and prevent module from being used if fetch is not available
if (!window.fetch) throw new Error("FETCH API NOT AVAILABLE ON BROWSER");

// Internal firebase auth instance that must be set via setup() so that the library and your app share the same auth instance
let _firebaseAuth;

// Internal base API URL that must be set via setup()
let _apiUrl;

// Default internal error handler function that can be overwritten via setup()
let _errorHandler = (error) => {
  console.error(error);
  // Allow error to bubble back to function caller
  return error;
};

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
 * Inner fetch function used to prepend API base URL and parse the response
 * @function _fetch
 * @param {String} url path of the API only, the base API will be prepended
 * @param {object} init Request object required by fetch
 */
async function _fetch(url = "", init) {
  try {
    // Call window fetch with prepended API URL and default request object
    const response = await window.fetch(_apiUrl + url, init);

    const parsedResponse = await getParsedResponse(response);

    /* Return base on type of body data and include status code along side */
    if (parsedResponse.json)
      return { ...parsedResponse.response, statusCode: response.status };
    else if (parsedResponse.string)
      return { body: parsedResponse.response, statusCode: response.status };
    else throw new Error("Invalid body type. Neither JSON nor String");
  } catch (error) {
    return _errorHandler(error);
  }
}

/**
 * Only returns authentication header if user is authenticated.
 * Split out so if user is unauthenticated, this does not throw if currenUser is null
 * @function getAuthHeader
 * @returns {String} Authentication header or nothing.
 */
async function getAuthHeader() {
  if (_firebaseAuth().currentUser)
    return `Bearer ${await _firebaseAuth().currentUser.getIdToken()}`;
}

/**
 * GET curried function that takes a init object before an URL
 */
function _get(init = {}) {
  return async function (url) {
    return _fetch(
      url,
      Object.assign(
        {
          method: "GET",
          headers: {
            Authorization: await getAuthHeader(),
          },
        },
        init
      )
    );
  };
}

/**
 * POST curried function that takes a init object before an URL and data
 */
function _post(init = {}) {
  return async function (url, data) {
    if (data) init.body = JSON.stringify(data);

    return _fetch(
      url,
      Object.assign(
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: await getAuthHeader(),
          },
        },
        init
      )
    );
  };
}

/**
 * Function to modify the init object only once before making a new request
 * @param {object} init Request object for fetch
 * @returns {object} Same API object with custom request object partially applied.
 */
function modify(init = {}) {
  // Return the http methods to chain it and make a request
  return {
    get: _get(init),
    post: _post(init),
  };
}

/**
 * Fetch methods
 * @notice Suggested to import the package under the "api" name to avoid collision with window.fetch
 *
 * @example
 * api.get(url)
 * api.modify(custom request object).get(url)
 * api.post(url, data)
 * api.modify(custom request object).post(url, data)
 *
 * @notice GET/POST methods are basically _get/_post with no init objects applied
 */
const methods = {
  get: _get(),
  post: _post(),
  modify,
};

/**
 * Module's methods only exported through setup.
 * @function setup
 * @param {function} firebaseAuth The same firebase auth function that ran initializeApp()
 * @param {string} apiUrl Base API URL
 * @param {function} errorHandler Error handling function for when the fetch failed
 */

//  Accept in the firebase instance???
export default function setup(firebaseAuth, apiUrl, errorHandler) {
  // Set the module's internal firebase auth instance
  _firebaseAuth = firebaseAuth;

  // Set the module's internal base api URL
  _apiUrl = apiUrl;

  // Only set the error handler if defined, else keep the default handler
  if (errorHandler) _errorHandler = errorHandler;

  return methods;
}
