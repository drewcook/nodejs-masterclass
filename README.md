# Node.js Uptime Monitor

A fullstack Node app with no external dependencies, to monitor URLs and send SMS messages for status updates.

This is a host of tools and applications built purely with [Node.js](https://nodejs.org/en/). It takes advantage of the native Node modules that are built-in, uses background workers, integrates with the [Twilio](https://twilio.com) API for sending SMS messages, presents a GUI, and relies on zero external modules to get all this done.

The application allows users to sign up with their phone number to subscribe to SMS messages regarded to URL uptimes and downtimes. A user may monitor up to 5 URLs and get a message whenever the URL changes status from up to down, or vice versa. The user will be allowed to manage their uptime checks by creating and editing, as well as deleting them. The checks will occur to ping the URL once every minute.

## About

This repo contains code for a REST API, and web app, and a CLI in plain Node.js with no 3rd-party libraries. We use the build in Node library modules to do our lifting.  The following shows what modules are used for each part.

- RESTful API - `crypto`, `fs`, `http`, `https`, `path`, `querystring`, `string_decoder`, `url`, and `zlib` modules
- Web app GUI - consume the API we built with templated views
- CLI: Readline, Events, TTY, V8, and OS modules.
- Stability: Testing over HTTP
- Performance: performance hooks, cluster, and child processes modules
- Loose Ends: HTTP2, VM, UDP, Net, `util`, and TLS modules

## Run the application

The only requirement is that your machine has a version of Node installed.  You can download the LTS version [here](https://nodejs.org). You can run the application by downloading or cloning this repository code and running `node index.js`, or more simply `npm start`.

<p align="center">
 <img src="https://visitor-badge.glitch.me/badge?page_id=drewcook.nodejs-uptime-monitor" alt="visitor count"/>
</p>
