/**
 * Module that extends the browser fetch method to interact with backend with firebase auth tokens
 * @author JJ
 */

// Throws an error and prevent module from being used if fetch is not available
if (!window.fetch) throw new Error("FETCH API NOT AVAILABLE ON BROWSER");

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
 * @param {String} _apiUrl path of the API only, the base API will be prepended
 * @param {String} url path of the API only, the base API will be prepended
 * @param {object} init Request object required by fetch
 */
async function _fetch(_apiUrl, url = "", init) {
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
 * @param {function} firebaseAuth Firebase auth method
 * @returns {String} Authentication header or nothing.
 */
async function getAuthHeader(firebaseAuth) {
  if (firebaseAuth().currentUser)
    return `Bearer ${await firebaseAuth().currentUser.getIdToken()}`;
}

/**
 * GET curried function that takes a init object before an URL
 */
function _get(apiUrl, init = {}, firebaseAuth) {
  return async function (url) {
    return _fetch(
      apiUrl,
      url,
      Object.assign(
        {
          method: "GET",
          headers: {
            Authorization: await getAuthHeader(firebaseAuth),
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
function _post(apiUrl, init = {}, firebaseAuth) {
  return async function (url, data) {
    if (data) init.body = JSON.stringify(data);

    return _fetch(
      apiUrl,
      url,
      Object.assign(
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: await getAuthHeader(firebaseAuth),
          },
        },
        init
      )
    );
  };
}

/**
 * Module's methods only exported through setup.
 * @function setup
 * @param {function} firebaseAuth The same firebase auth function that ran initializeApp()
 * @param {string} apiUrl Base API URL
 * @param {function} errorHandler Error handling function for when the fetch failed
 */
export default function setup(firebaseAuth, apiUrl, errorHandler) {
  // Internal firebase auth instance that must be set to share the same auth instance between this library and your app
  // Set the module's internal base api URL

  // Only set the error handler if defined, else keep the default handler
  if (errorHandler) _errorHandler = errorHandler;

  /**
   * Function to modify the init object only once before making a new request
   * @param {object} init Request object for fetch
   * @returns {object} Same API object with custom request object partially applied.
   */
  function modify(init = {}, _firebaseAuth = firebaseAuth) {
    // Return the http methods to chain it and make a request
    return {
      get: _get(apiUrl, init, _firebaseAuth),
      post: _post(apiUrl, init, _firebaseAuth),
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
  return {
    get: _get(apiUrl, undefined, firebaseAuth),
    post: _post(apiUrl, undefined, firebaseAuth),
    modify,
  };
}
