/**
 * Module that extends the browser fetch method to interact with backend with firebase auth tokens
 *
 * See how I can apply multiple things to be permanant.
 * or pass in function to execute to return a init object intead of it being fixed
 *
 * Catch this type of error and display a "500" internal service is down error
 * TypeError: Failed to fetch
 * Potentially implement a retry?
 *
 * @author JJ
 */

// Throws an error and prevent module from being used if fetch is not available
if (!window.fetch) throw new Error("FETCH API NOT AVAILABLE ON BROWSER");

// const response = await fetch(url, {
//   method: "POST", // *GET, POST, PUT, DELETE, etc.
//   mode: "cors", // no-cors, *cors, same-origin
//   cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
//   redirect: "follow", // manual, *follow, error
//   referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
//   body: init.body
//   // body: JSON.stringify(data) // body data type must match "Content-Type" header
// });

// mode: "cors", // no-cors, *cors, same-origin
// Can remove for now because both website and server is localhost.

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
function _get(init = {}, apiUrl, firebaseAuth) {
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
function _post(init = {}, apiUrl, firebaseAuth) {
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

/*
modify should only be for modifying init Object
make that clear. dont allow to modify everything. If u wanna modify more, just create a new instance
*/

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
  function modifyInit(init = {}) {
    // Return the http methods to chain it and make a request
    return {
      get: _get(init, apiUrl, firebaseAuth),
      post: _post(init, apiUrl, firebaseAuth),
      //   Return this again? to chain modifys?
    };
  }

  /**
   * Function to modify the init object only once before making a new request
   * @param {object} init Request object for fetch
   * @returns {object} Same API object with custom request object partially applied.
   */
  function modifyAuth(_firebaseAuth) {
    // Return the http methods to chain it and make a request
    return {
      get: _get(undefined, apiUrl, _firebaseAuth),
      post: _post(undefined, apiUrl, _firebaseAuth),
      //   Return this again? to chain modifys?
    };
  }

  /**
   * Function to modify the init object only once before making a new request
   * @param {object} init Request object for fetch
   * @returns {object} Same API object with custom request object partially applied.
   */
  function modify(init = {}, _firebaseAuth) {
    // Return the http methods to chain it and make a request
    return {
      get: _get(init, apiUrl, _firebaseAuth),
      post: _post(init, apiUrl, _firebaseAuth),
      //   Return this again? to chain modifys?
    };
  }

  /**
   * Fetch methods
   * @notice Suggested to import the package under the "api" name to avoid collision with window.fetch
   *
   * @example
   * api.get(url)
   * api.modifyInit(custom request object).get(url)
   * api.post(url, data)
   * api.modifyInit(custom request object).post(url, data)
   *
   * @notice GET/POST methods are basically _get/_post with no init objects applied
   */
  return {
    get: _get(undefined, apiUrl, firebaseAuth),
    post: _post(undefined, apiUrl, firebaseAuth),
    modifyInit,
  };
}
