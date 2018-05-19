var gulp = require('gulp'),
  gutil = require('gulp-util'),
  merge = require('merge-stream'),
  concat = require('gulp-concat'),
  uglify = require("gulp-uglify"),
  babel = require('gulp-babel'),
  cleanCSS = require('gulp-clean-css'),
  htmlmin = require('gulp-html-minifier'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  browserSync = require('browser-sync').create(),
  reload = browserSync.reload,
  ngrok = require('ngrok'),
  sequence = require('run-sequence'),
  port = 8080,
  site = null;

var serveSequence = function () {
  sequence(
    'build',
    'browser-sync',
    'ngrok-url'
  );
}

gulp.task('html', function () {
  return gulp.src('*.html', {
      base: '.'
    })
    .pipe(htmlmin({
      collapseWhitespace: true
    }))
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function () {
  var stream1 = gulp.src('css/*.css', {
      base: '.'
    })
    .pipe(concat('styles.css'))
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(cleanCSS())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('dist/css'));
  var stream2 = gulp.src('css/**/*.css', {
      base: '.'
    })
    .pipe(concat('styles.css'))
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(cleanCSS())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest('dist'));
  return merge(stream1, stream2);
});

gulp.task('scripts', function () {
  var stream1 = gulp.src('js/*.js', {
      base: '.'
    })
    .pipe(concat('scripts.js'))
    .pipe(babel({
      presets: ['babel-preset-es2015'].map(require.resolve)
    }))
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(uglify())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(rename('scripts.min.js'))
    .pipe(gulp.dest('dist/js'));
  var stream2 = gulp.src('js/**/*.js', {
      base: '.'
    })
    .pipe(babel({
      presets: ['babel-preset-es2015'].map(require.resolve)
    }))
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(uglify())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('dist'));
  return merge(stream1, stream2);
});

gulp.task('images', (function () {
  return gulp.src('img/**', {
      base: '.'
    })
    .pipe(imagemin())
    .on('error', function (err) {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
    })
    .pipe(gulp.dest('dist'));
}));

gulp.task('browser-sync', function () {
  browserSync.init({
    port: port,
    open: false,
    injectChanges: true,
    server: {
      baseDir: "./dist/"
    }
  });
});

gulp.task('ngrok-url', (cb) => {
  return ngrok.connect(port)
    .then((url) => {
      site = url;
      gutil.log(gutil.colors.blue('[Secure Url]'), site);
    })
    .catch((err) => {
      gutil.log(gutil.colors.red('[Error]'), err.toString());
      return err;
    });
});

gulp.task('build', ['scripts', 'styles', 'html', 'images']);

gulp.task('serve', function () {
  serveSequence();
});

gulp.task('reload', function() {
  reload();
});

gulp.task('develop', function () {
  serveSequence();
  gulp.watch(['js/**', 'css/**', 'img/**', '*.html'], function () {
    sequence(
      'build',
      'reload'
    );
  });
});

gulp.task('default', ['develop']);