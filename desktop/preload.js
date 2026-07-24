'use strict';

/**
 * Runs before the page loads, in an isolated context.
 *
 * The app is a plain web page talking to its own local server, so it needs
 * nothing from Node. Keeping this file empty of bridges is deliberate:
 * with contextIsolation on and nothing exposed, a bug in the page cannot
 * reach the file system.
 */
