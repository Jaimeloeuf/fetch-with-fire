/**
 * Module that extends the browser fetch method to interact with backend with firebase auth tokens
 * @author JJ
 */

// Throws an error and prevent module from being used if fetch is not available
if (!window.fetch) throw new Error("FETCH API NOT AVAILABLE ON BROWSER");

import deepmerge from "deepmerge";

import getParsedResponse from "./getParsedResponse";
import getAuthHeader from "./getAuthHeader";
import defaultErrorHandler from "./defaultErrorHandler";

/**
 * Suggestion: import package as "api" to avoid name collision with window.fetch
 *
 * @example
 * import firebase from "firebase/app";
 * import "firebase/auth";
 * const api = new fetch(firebase.auth, apiUrl, (error) => {
 *  console.error(error);
 *  return error;
 * });
 * api.get(url)
 * api.modify(custom request object).get(url)
 * api.post(url, data)
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
    this.patch = this._patch(undefined, firebaseAuth);
    this.put = this._put(undefined, firebaseAuth);
    this.delete = this._delete(undefined, firebaseAuth);
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
              "Content-Type": data ? "application/json" : undefined,
              Authorization: await getAuthHeader(this._firebaseAuth),
            },
          },
          init
        )
      );
    };
  }

  /**
   * PATCH curried function that takes a init object before an URL and data
   */
  _patch(init = {}) {
    // Arrow function to inherit "this", without using explicit "this" binding
    return async (url, data) => {
      if (data) init.body = JSON.stringify(data);

      return this._fetch(
        url,
        deepmerge(
          {
            method: "PATCH",
            headers: {
              "Content-Type": data ? "application/json" : undefined,
              Authorization: await getAuthHeader(this._firebaseAuth),
            },
          },
          init
        )
      );
    };
  }

  /**
   * PUT curried function that takes a init object before an URL and data
   */
  _put(init = {}) {
    // Arrow function to inherit "this", without using explicit "this" binding
    return async (url, data) => {
      if (data) init.body = JSON.stringify(data);

      return this._fetch(
        url,
        deepmerge(
          {
            method: "PUT",
            headers: {
              "Content-Type": data ? "application/json" : undefined,
              Authorization: await getAuthHeader(this._firebaseAuth),
            },
          },
          init
        )
      );
    };
  }

  /**
   * DELETE curried function that takes a init object before an URL and data
   * It is not recommended to include a request message body even though you are able to
   */
  _delete(init = {}) {
    // Arrow function to inherit "this", without using explicit "this" binding
    return async (url, data) => {
      if (data) init.body = JSON.stringify(data);

      return this._fetch(
        url,
        deepmerge(
          {
            method: "DELETE",
            headers: {
              "Content-Type": data ? "application/json" : undefined,
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
