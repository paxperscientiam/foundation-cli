var Promise  = require('bluebird');
var bower    = require('bower');
var colors   = require('colors');
var fs       = require('fs');
var inquirer = require('inquirer');
var isRoot   = require('is-root');
var npm      = require('npm');
var path     = require('path');
var del      = require('del');
var which    = require('which');
var util     = require('../util');
var EventEmitter = require("events").EventEmitter;
var format   = require('util').format;
var git      = require("git-promise");

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


  function prompt (result) {
    return inquirer.prompt(util.questions(options))
      .then((answers) => ({
        projectName: answers.directory || options.directory,
        framework: answers.framework || options.framework,
        template: answers.template || options.template || 'unspecified'
      }))
  };

  function gitClone(response) {
    return Promise.try(function () {

      var projectName = response.projectName;
      var framework = response.framework;
      var template = response.template;

      projectFolder = path.join(process.cwd(), projectName);
      messages = util.messages(projectName, framework, template);

      var repo = framework === 'sites'
        ? repositories.sites[template]
        : repositories[framework];

      return git('clone ' + repo + " " + projectFolder)
        .then(function () {
          console.log("Cloning...");
          return {repo:repo,messages:messages,projectFolder:projectFolder,projectName:projectName};
        })
        .fail(function (err) {
          return Promise.reject(err.message+"\n"+err.stdout);
        });
    });
  };
  //   var hello = formatHello(messages.helloYeti, framework);
  //   console.log(util.mascot(framework, hello));
  //   process.stdout.write(messages.downloadingTemplate);

  //   if (repositories[framework] === undefined) {
  //     console.log("error!".red + "\nFramework " + framework.cyan + " unknown.");
  //     process.exit(1);
  //   }
  //
  // })
  //   .then(function (x) {
  //     console.log(x);
  //    // clone(x.repo, x.projectFolder,{});
  //   });


  // 4. Remove the Git folder and change the version number if applicable
  function folderSetup(response) {
    return Promise.try(function () {
      process.chdir(response.projectFolder);
      return del(['.git'], {dryRun: true}).then(function(paths)  {
        //console.log('Cleaning:\n', paths.join('\n'));
        console.log('Cleaning...');
        return response;
      });
    });
  }

  //  5. Install Node dependencies
  function npmInstall(response) {
    return Promise.try(function () {
      npm.load({ prefix: response.projectFolder, loglevel: 'error', loaded: false }, function(err) {
        //npm.commands.install([], function(err, data) {

        //      });
      });
    })
  }



  // npm.load({ prefix: response.projectFolder, loglevel: 'error', loaded: false }, function(err) {
  //   npm.commands.install([], function(err, data) {
  //     if (options.debug && err) console.log(err);
  //     var success = err === null;
  //     if(success && typeof(ee) !== 'undefined') ee.emit("npmInstallSuccess", response.projectName);
  //     else if(typeof(ee) !== 'undefined') ee.emit("npmInstallFailure", response.projectName);
  //   });
  // });
  // return response;


  //  6. Install Bower dependencies
  function bowerInstall(response) {
    return Promise.try(function () {
      console.log("ROLF");
      //    Only run "bower install" if a bower.json is present
      if (!fs.existsSync('bower.json')) {
        console.log("bower.json does not exist");
      }
      else {
        bower.commands.install(undefined, undefined, {
          cwd: process.cwd(), silent: true, quiet: true, production: true })
        // .on('err', function(err) {
        //   if (typeof ee !== 'undefined')
        //     ee.emit("bowerInstallFailure", response.projectName);
        // })
        // .on('end', function(data) {
        //   if (typeof ee !== 'undefined')
        //     ee.emit("bowerInstallSuccess", response.projectName);
        // });
        return response;
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


  // "Synchronous inspection"
  preflight()
    .then(a => {
      return prompt(a);
    })
    .then(b => {
      return gitClone(b);
    })
    .then(c => {
      return folderSetup(c);
    })
    .then(d => {
      return npmInstall(d);
    })
    .then(e => {
      return bowerInstall(e);
    })
    .then(f => {
      return finish(f);
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
