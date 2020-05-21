/**
 * Only returns authentication header if user is authenticated.
 * Split out so if user is unauthenticated, this does not throw if currenUser is null
 * @function getAuthHeader
 * @param {function} [firebaseAuth] Firebase auth method
 * @returns {String} Authentication header or nothing.
 */
export default async function getAuthHeader(firebaseAuth) {
  if (firebaseAuth().currentUser)
    return `Bearer ${await firebaseAuth().currentUser.getIdToken()}`;
}
