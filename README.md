# Nodejs Uptime Monitor

This is a host of tools and applications built purely with [Node.js](https://nodejs.org/en/). It takes advantage of the native Node modules that are built-in, uses background workers, integrates with the [Twilio](https://twilio.com) API for sending SMS messages, presents a GUI, and relies on zero external modules to get all this done.

The application allows users to sign up with their phone number to subscribe to SMS messages regarded to URL uptimes and downtimes. A user may monitor up to 5 URLs and get a message whenever the URL changes status from up to down, or vice versa. The user will be allowed to manage their uptime checks by creating and editing, as well as deleting them. The checks will occur to ping the URL every set interval.

## About

This repo contains code for a REST API, and web app, and a CLI in plain Node.js with no 3rd-party libraries.

- RESTful API - fs, http, crypto, lib, string decoder and path modules
- Web app GUI - consume the API we built with templated views
- CLI: Readline, Events, TTY, V8, and OS modules.
- Stability: Testing over HTTP
- Performance: performance hooks, cluster, and child processes modules
- Loose Ends: HTTP2, VM, UDP, Net, and TLS modules
