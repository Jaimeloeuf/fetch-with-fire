# DEPRECATED
`fetch-with-fire` library is fully deprecated. No new changes are expected to land. In fact, none have landed for some time.  
This is deprecated because [simpler-fetch](https://github.com/Enkel-Digital/simpler-fetch/) turned out to be a much better alternative and can do exactly what this library intends to achieve too, which is to make it easier to work with firebase auth. See this [documentation](https://github.com/Enkel-Digital/simpler-fetch/blob/master/firebase-auth.md) on using `simpler-fetch` with firebase auth to migrate!

# fetch-with-fire
Fetch module that extends the browsers' fetch method to interact with backend with firebase auth tokens.  
Your project is assumed to be using firebase auth as the stateless auth system.  

Note that this is essentially a thin wrapper with a few added functionalities
1. Automatically add Firebase auth JWT token to request header using [this api](https://firebase.google.com/docs/auth/admin/verify-id-tokens#retrieve_id_tokens_on_clients)
    - ***Note that if you are not logged in to firebase auth, the token will simply be not included. It is only included if available.***
2. Allow you to define a base API URL used throughout all your requests
3. Extend or modify the [fetch request's init parameter](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters)
4. Parses the body as either JSON or a string, if neither, it will throw an error and return the error back to the user.

## Dependencies
- This package depends on the browsers' fetch method.
    - *Will throw an error if loaded without that being available!*

## Token verification
For token verification on the backend, refer to this module's [complimentary token verification express middleware module](https://www.npmjs.com/package/firebase-auth-express-middleware).

## Examples
-- TODO --

## License, Author and Contributing
This project is developed and made available under the "MIT License". Feel free to use it however you like!  
If you have any questions, contact us via [email](mailto:tech@enkeldigital.com)  
Authors:
- [JJ](https://github.com/Jaimeloeuf)