/**
 * Used for the desktop build — see the `desktop` configuration in angular.json.
 *
 * Inside the app the interface and the API are served by the same local
 * server, so the address is relative: no host, no port, and nothing to
 * reconfigure when the server starts on a different port each time.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
