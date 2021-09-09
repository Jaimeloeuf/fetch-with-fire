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

    // Empty factory function calls to use default empty object
    this.get = this._get();
    this.post = this._post();
    this.patch = this._patch();
    this.put = this._put();
    this.delete = this._delete();
  }

  /**
   * USE WITH CAUTION. If you set a new base URL, this will affect every other call out there.
   * --- Experimental --- Might be removed in future versions. DO NOT depend on this
   * @param {string} apiUrl Base API URL
   */
  __setBaseUrl(apiUrl) {
    // Set the module's internal base api URL
    this._apiUrl = apiUrl;
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
}
