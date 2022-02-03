# +++ This project is a work in progress +++

# Project Manager

Run commands that effect multiple projects in the same way, and optionally commit + push the changes.

## Config

This tool relies on a `.js` config file containing a mapping of each project that you want to update, for example:

```javascript
// ~/my-pm-config.js

module.exports = {
  projects: [
    { name: 'Project 1', path: 'path/to/project-1', clone: 'github.com/project-1'},
    { name: 'Project 2', path: 'path/to/project-2', clone: 'github.com/project-2'}
  ]
}
```

This config accepts a name and path for each project.  You can optionally add a clone URL which will allow you to use the tool to clone the repo into the specified location, useful for setting up a development environment for the first time.

## Running the tool

```
pm -c ~/my-pm-config.js
```

If no config file is specified, PM will look for the file at ~/pm-config.js by default.
