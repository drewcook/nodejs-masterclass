# JSON Data Store

This is the directory for the local data store.  It stores JSON files in-memory that represents records for Users, Tokens, and Checks in the `/users`, `/tokens`, and `/checks` subdirectories, respectively.

These files are ignored in Git, but the subdirectories should be included so that they may be deployed to production environments like Heroku.
