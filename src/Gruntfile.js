/*!
 * Gruntfile
 * @marcos0x
 */

var pathRoot = '/Users/marcos/Projects/bitcoinday/webroot';
var serveStatic = require('serve-static');
var serveIndex = require('serve-index');
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var path = require('path');

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  var pkg = grunt.file.readJSON('package.json');

  var configBridge = grunt.file.readJSON('./'+pkg.config.shared.dirs.grunt+'/configBridge.json', { encoding: 'utf8' });

  var getFiles = function(dest, src, arr, tasks) {
    if(typeof arr != 'undefined' && arr.length){
      var obj = { files: arr };
    } else if(typeof dest != 'undefined' && dest.length){
      var obj = { files: {} };
      obj.files[dest] = src;
    } else {
      var obj = { src: src };
    }
    if(typeof tasks != 'undefined' && tasks.length){
      obj.tasks = tasks;
    }
    return obj;
  }

  var getTask = function(taskName) {
    // Task options.
    var task = {};
    switch(taskName){
      case 'connect':
        task.options = {
          base: {
            path: pathRoot,
            options: {
              index: 'index.html'
            }
          },
          port: 9000,
        };
        task.livereload = {
          options: {
            middleware: function (connect) {
              return [
                lrSnippet,
                serveStatic(path.resolve(pathRoot)),
                serveIndex(path.resolve(pathRoot))
              ];
            }
          }
        };
      break;
      case 'open':
        task.server = {
          url: 'http://localhost:9000'
        };
      break;
      case 'less':
        task.options = {
          strictMath: false,
          sourceMap: false,
          outputSourceFiles: false,
          plugins: [
            new (require('less-plugin-autoprefix'))({browsers: configBridge.config.autoprefixerBrowsers}),
            new (require('less-plugin-clean-css'))()
          ]
        };
      break;
      case 'uglify':
        task.options = {
          preserveComments: false
        };
      break;
      case 'watch':
        task.options = {
          //spawn: true,
          maxListeners: 99,
          livereloadOnError: false,
          debounceDelay: 50,
          dateFormat: function(time) {
            grunt.log.writeln(('Finished in ' + time + 'ms')['cyan'].bold);
            grunt.log.writeln('Waiting...');
          }
        };
        task.livereload = {
          files: [],
          options: { 
            livereload: true
          }
        };
      break;
    }

    // Task configuration.
    for(var configKey in pkg.config) {
      var config = pkg.config[configKey];

      if(typeof config.files == 'undefined'){
        continue;
      }

      // HTML.
      if(typeof config.dirs.html != 'undefined'){
        switch(taskName){
          case 'watch':
            task.livereload.files.push(config.dirs.html+'/*.html');
          break;
        }
      }

      // CSS.
      if(typeof config.files.css != 'undefined'){
        switch(taskName){
          case 'watch':
            task.livereload.files.push(config.dirs.css.dest+'/*');
          break;
        }
        for(var i in config.files.css) {
          var file = config.files.css[i];
          if(typeof file == 'object'){
            var name = file.dest;
          } else {
            var name = file;
          }
          var id = configKey+'_'+name;
          var src = [];
          if(typeof file == 'object'){
            if(typeof file.shared != 'undefined'){
              for(var j in file.shared) {
                src.push(pkg.config.shared.dirs.css+'/'+file.shared[j]+'.less');
              };
            }
            src.push(config.dirs.css.src+'/'+file.src+'.less');
            if(typeof file.attached != 'undefined'){
              for(var j in file.attached) {
                src.push(config.dirs.css.src+'/'+file.attached[j]+'.less');
              };
            }
          } else {
            src.push(config.dirs.css.src+'/'+file+'.less');
          }
          switch(taskName){
            case 'less':
              task[id] = getFiles(config.dirs.css.dest+'/'+name+'.min.css', src);
            break;
            case 'watch':
              var watchFiles = [config.dirs.css.src+'/'+name+'.less'];
              var watchFile = grunt.file.read(config.dirs.css.src+'/'+name+'.less', { encoding: 'utf8' }).match(/@import\s(.*?);/g);
              if(watchFile){
                for(var k in watchFile){
                  watchFiles.push(config.dirs.css.src+'/'+(watchFile[k].replace(/@import\s[\"|\'](.*?)[\"|\'];/g, "$1")));
                }
              }
              task['css_'+id] = getFiles(false, false, watchFiles, ['less:'+id]);
            break;
          }
        }
      }

      // JS.
      if(typeof config.files.js != 'undefined'){
        switch(taskName){
          case 'watch':
            task.livereload.files.push(config.dirs.js.dest+'/*');
          break;
        }
        for(var i in config.files.js) {
          var file = config.files.js[i];
          if(typeof file == 'object'){
            var name = file.dest;
          } else {
            var name = file;
          }
          var id = configKey+'_'+name;
          var src = [];
          if(typeof file == 'object'){
            if(typeof file.shared != 'undefined'){
              for(var j in file.shared) {
                src.push(pkg.config.shared.dirs.js+'/'+file.shared[j]+'.js');
              };
            }
            src.push(config.dirs.js.src+'/'+file.src+'.js');
            if(typeof file.attached != 'undefined'){
              for(var j in file.attached) {
                src.push(config.dirs.js.src+'/'+file.attached[j]+'.js');
              };
            }
          } else {
            src.push(config.dirs.js.src+'/'+file+'.js');
          }
          switch(taskName){
            case 'concat':
              task[id] = getFiles(config.dirs.js.dest+'/'+name+'.js', src);
            break;
            case 'uglify':
              task[id] = getFiles(config.dirs.js.dest+'/'+name+'.min.js', config.dirs.js.dest+'/'+name+'.js');
            break;
            case 'watch':
              task['js_'+id] = getFiles(false, false, src, [
                'concat:'+id, 
                'uglify:'+id,
              ]);
            break;
          }
        }
      }

    }
    return task;
  };

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    jqueryCheck: configBridge.config.jqueryCheck.join('\n'),
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join('\n'),

    // Livereload.
    livereload: {
      options: {
        open: true,
        middleware: function(connect) {
          return [
            connect().use('/', function (req, res, next) {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', '*');
              next();
            })
          ];
        }
      }
    },

    // Task configuration.
    less: getTask('less'),
    concat: getTask('concat'),
    uglify: getTask('uglify'),
    watch: getTask('watch'),
    connect: getTask('connect'),
    open: getTask('open')
  });

  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });

  // Debug task.
  grunt.registerTask('debug', 'Debug', function(){
    console.log(JSON.stringify({
      debug: [
        { less: getTask('less') },
        { concat: getTask('concat') },
        { uglify: getTask('uglify') },
        { watch: getTask('watch') }
      ]
    }));
  });

  // CSS distribution task.
  grunt.registerTask('dist-css', [
    'less',
  ]);

  // JS distribution task.
  grunt.registerTask('dist-js', [
    'concat', 
    'uglify', 
  ]);

  // Full distribution task.
  grunt.registerTask('dist', [
    'dist-css', 
    'dist-js',
  ]);

  grunt.registerTask('server', function (target) {
    grunt.task.run([
      // 'livereload-start',
      'connect:livereload',
      'open',
      'watch'
    ]);
  });
};
