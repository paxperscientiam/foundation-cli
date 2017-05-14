var async    = require('async');
var Promise  = require('bluebird');
var bower    = require('bower');
var colors   = require('colors');
var exec     = require('child_process').exec;
var fs       = require('fs');
var inquirer = require('inquirer');
var isRoot   = require('is-root');
var npm      = require('npm');
var path     = require('path');
var rimraf   = require('rimraf');
var which    = require('which');
var util     = require('../util');
var EventEmitter = require("events").EventEmitter;
var format   = require('util').format;

var pseries   = require('../util/promise-series.js');

var repositories = {
  sites: {
    basic: 'https://github.com/zurb/foundation-sites-template.git',
    zurb: 'https://github.com/zurb/foundation-zurb-template.git'
  },
  apps: 'https://github.com/zurb/foundation-apps-template.git',
  emails: 'https://github.com/zurb/foundation-emails-template.git'
}

module.exports = function(args, options, callback, ee) {
  var projectName, projectFolder, framework, template, messages, directory;

  function preflight () {
    return Promise.try(function() {
      if (isRoot()) {
        console.log(util.mascot('sites', util.messages.noRoot));
        process.exit(1);
      }
      which('git', function(er) {
        if (er) {
          console.log(util.messages.gitNotInstalled);
          process.exit(69);
        }
      });
    });
  }


  function prompt () {
    return inquirer.prompt(util.questions(options))
      .then((answers) => ({
        projectName: answers.directory || options.directory,
        framework: answers.framework || options.framework,
        template: answers.template || options.template || 'unspecified'
      }))
  };

  function gitClone(response) {
    return Promise.try(function() {
      var projectName = response.projectName;
      var framework = response.framework;
      var template = response.template;


      projectFolder = path.join(process.cwd(), projectName);
      messages = util.messages(projectName, framework, template);

      var repo = framework === 'sites'
        ? repositories.sites[template]
        : repositories[framework];

      var cmd = format('git clone %s %s', repo, projectName);
      var hello = formatHello(messages.helloYeti, framework);
      console.log(util.mascot(framework, hello));
      process.stdout.write(messages.downloadingTemplate);

      //      [TODO] Change to spawn and check for errors on stderr
      if (repositories[framework] === undefined) {
        console.log("error!".red + "\nFramework " + framework.cyan + " unknown.");
        process.exit(1);
      }

      exec(cmd, function(err) {
        if (err instanceof Error) {
          console.log(messages.gitCloneError);
          process.exit(1);
        }
        process.chdir(projectFolder);

      });

      if (typeof(ee) !== 'undefined') {
        ee.emit("cloneSuccess", projectName);
      }
      return {messages:messages,projectFolder:projectFolder,projectName:projectName};
    })
      .then(function (x) {
        return x;
      });
  };
  // 4. Remove the Git folder and change the version number if applicable
  function folderSetup(response) {
    return Promise.try(function() {
      rimraf('.git', function() {});
      console.log(response.messages.installingDependencies);

      return response;
    });
  }

  //  5. Install Node dependencies
  function npmInstall(response) {
    return Promise.try(function() {
      npm.load({ prefix: response.projectFolder, loglevel: 'error', loaded: false }, function(err) {
        npm.commands.install([], function(err, data) {
          if (options.debug && err) console.log(err);
          var success = err === null;
          if(success && typeof(ee) !== 'undefined') ee.emit("npmInstallSuccess", response.projectName);
          else if(typeof(ee) !== 'undefined') ee.emit("npmInstallFailure", response.projectName);
        });
      });
      return response;
    })
      .then(function (x) {
        return x;
      });
  }

  //  6. Install Bower dependencies
  function bowerInstall(response) {
    return Promise.try(function () {
      //    Only run "bower install" if a bower.json is present
      if (!fs.existsSync('bower.json')) {
        console.log("bower.json does not exist");
      }
      else {
        bower.commands.install(undefined, undefined, {
          cwd: process.cwd(), silent: true, quiet: true, production: true })
          .on('err', function(err) {
            if (typeof ee !== 'undefined')
              ee.emit("bowerInstallFailure", response.projectName);
          })
          .on('end', function(data) {
            if (typeof ee !== 'undefined')
              ee.emit("bowerInstallSuccess", response.projectName);
          });
      }
    });
  }

  // 7. Finish the process with a status report
  function finish(err, results) {
    console.log("brb lol");
    //    return Promise.try
    // Indexes 4 and 5 of results are the npm/Bower statuses
    // All the rest should be undefined
    // var allGood = results.indexOf(false) === -1;

    // if (allGood)
    //   console.log(messages.installSuccess);
    // else
    //   console.log(messages.installFail);

    // console.log(messages.gitCloneSuccess);

    // if (results[4])
    //   console.log(messages.npmSuccess);
    // else
    //   console.log(messages.npmFail);

    // if (results[5])
    //   console.log(messages.bowerSuccess);
    // else if (fs.existsSync('bower.json'))
    //   console.log(messages.bowerFail);

    // if (allGood)
    //   console.log(messages.installSuccessFinal);
    // else
    //   console.log(messages.installFailFinal);

    // if (typeof(callback)!=='undefined') callback();
  }



  preflight()
    .then(a => {
      var A = prompt(a);
      return A;
    })
    .then(b => {
      var B = gitClone(b);
      return B;
    })
    .then(c => {
      var C = folderSetup(c);
      return C;
    })
    .then(d => {
      var D = npmInstall(d);
      return D
    })
    .then(e => {
      var E = bowerInstall(e);
      return E;
    })
    .then(f => {
      var F = finish(f);
    })
    .catch(error => {
      console.log(error);
    });







}/////last





function formatHello(str = ["REDACTED"], framework) {
  framework = framework.charAt(0).toUpperCase() + framework.slice(1)
  str = str.join('\n');
  str = str.replace('%s', framework);
  return str.split('\n');
}
