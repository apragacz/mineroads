gulp = require('gulp')
concat = require('gulp-concat')
cssmin = require('gulp-cssmin')
gulpif = require('gulp-if')
jshint = require("gulp-jshint")
minifyHTML = require('gulp-minify-html')
uglify = require('gulp-uglify')
useref = require('gulp-useref');
zip = require('gulp-zip');


gulp.task 'process-html', ->
    assets = useref.assets();

    gulp.src('app/index.html')
        .pipe(assets)
        #.pipe(gulpif('*.js', uglify()))
        .pipe(gulpif('*.css', cssmin()))
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(minifyHTML())
        .pipe(gulp.dest('dist'))


gulp.task 'copy-img', ->
    gulp.src('app/img/*')
        .pipe(gulp.dest('dist/img/'))


gulp.task 'build', ['process-html', 'copy-img'], ->


gulp.task 'zip', ['build'], ->
    gulp.src('dist/**')
        .pipe(zip('game.zip'))
        .pipe(gulp.dest('.'));


gulp.task 'default', ['zip']


gulp.task 'jshint', ->
    return gulp.src('app/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
