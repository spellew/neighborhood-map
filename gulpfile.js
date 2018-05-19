var gulp = require('gulp'),
  gutil = require('gulp-util'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  babel = require('gulp-babel'),
  cleanCSS = require('gulp-clean-css'),
  htmlmin = require('gulp-html-minifier'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  browserSync = require('browser-sync').create(),
  ngrok = require('ngrok'),
  sequence = require('run-sequence'),
  port = 8080,
  site = null;

gulp.task('html', function () {
  gulp.src('*.html', {
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
  gulp.src('css/**/*.css', {
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
});

gulp.task('scripts', function () {
  gulp.src('js/*.js', {
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
  gulp.src('js/lib/*.js', {
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
});

gulp.task('images', (function () {
  gulp.src('img/**', {
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

gulp.task('watch', function () {
  gulp.watch('js/*.js', ['scripts']);
  gulp.watch('css/*.css', ['styles']);
  gulp.watch('*.html', ['images']);
});

gulp.task('run-server', function() {
  return sequence(
    'default',
    'browser-sync',
    'ngrok-url'
  );
});

gulp.task('default', ['scripts', 'styles', 'html', 'images']);