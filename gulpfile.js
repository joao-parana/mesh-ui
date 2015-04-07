var gulp = require('gulp'),
    ngAnnotate = require('gulp-ng-annotate'),
    jsHint = require('gulp-jshint'),
    inject = require('gulp-inject'),
    templateCache = require('gulp-angular-templatecache'),
    angularFilesort = require('gulp-angular-filesort'),
    less = require('gulp-less'),
    livereload = require('gulp-livereload'),
    karma = require('karma').server,
    exec = require('child_process').exec;


var VENDOR_SCRIPTS = [
    'bower_components/angular/angular.js',
    'bower_components/angular-animate/angular-animate.js',
    'bower_components/angular-cookies/angular-cookies.js',
    'bower_components/angular-aria/angular-aria.js',
    'bower_components/angular-material/angular-material.js',
    'bower_components/ui-router/release/angular-ui-router.js',
    'bower_components/lodash/dist/lodash.js',
    'bower_components/restangular/dist/restangular.js',
    'bower_components/angular-utils-pagination/dirPagination.js'
];

var VENDOR_STYLES = [
    'bower_components/angular-material/angular-material.css'
];

gulp.task('app-scripts', function() {
    return gulp.src([
        '!src/**/*.spec.js',
        'src/**/*.js'
    ])
        .pipe(jsHint())
        .pipe(jsHint.reporter('jshint-stylish'))
        .pipe(ngAnnotate())
        .pipe(gulp.dest('build/'))
        .pipe(livereload());
});

gulp.task('vendor-scripts', function() {
    return gulp.src(VENDOR_SCRIPTS)
        .pipe(gulp.dest('build/vendor/scripts'));
});

gulp.task('app-templates', function() {
    return gulp.src('src/app/**/*.html')
        .pipe(templateCache('templates.js', { module: 'caiLunAdminUi'}))
        .pipe(gulp.dest('build/app/'))
        .pipe(livereload());
});

gulp.task('app-styles', function() {
    return gulp.src('src/styles/app.less')
    /**
     * Dynamically injects @import statements into the main app.less file, allowing
     * .less files to be placed around the app structure with the component
     * or page they apply to.
     */
        .pipe(inject(gulp.src(['../**/*.less'], {read: false, cwd: 'src/styles/'}), {
            starttag: '/* inject:imports */',
            endtag: '/* endinject */',
            transform: function (filepath) {
                return '@import ".' + filepath + '";';
            }
        }))
        .pipe(less())
        .pipe(gulp.dest('build/styles'))
        .pipe(livereload());
});

gulp.task('vendor-styles', function() {
    return gulp.src(VENDOR_STYLES)
        .pipe(gulp.dest('build/vendor/styles'));
});

gulp.task('index', ['app-scripts', 'app-templates', 'vendor-scripts', 'app-styles', 'vendor-styles'], function() {

    var vendorJs = gulp.src([
        'vendor/**/angular.js',
        'vendor/**/*.js'
    ], { cwd: 'build/'} );

    var appJs = gulp.src([
        'app/**/*.js'
    ], { cwd: 'build/'} )
        .pipe(angularFilesort());

    var css = gulp.src([
        '**/*.css'
    ], { cwd: 'build/'} );

    return gulp.src('src/index.html')
        .pipe(inject(css, { addRootSlash: false }))
        .pipe(inject(vendorJs,  {
            addRootSlash: false,
            starttag: '<!-- inject:vendorjs -->',
            endtag: '<!-- endinject -->'
        }))
        .pipe(inject(appJs,  {
            addRootSlash: false,
            starttag: '<!-- inject:appjs -->',
            endtag: '<!-- endinject -->'
        }))
        .pipe(gulp.dest('build/'))
        .pipe(livereload());
});

gulp.task('static-assets', function() {
    return gulp.src([
        'src/.htaccess',
        'src/assets**/**/*'
    ])
        .pipe(gulp.dest('build/'))
        .pipe(livereload());
});

gulp.task('karma-watch', function() {
    karma.start({
        configFile: __dirname + '/karma.conf.js'
    });
});

/**
 * Single-run all the tests
 * */
gulp.task('karma-test', function() {
    karma.start({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    });
});

gulp.task('e2e', function() {
    exec('protractor e2e/protractor.conf.js', function (err, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
    });
});

gulp.task('watch', ['default', 'karma-watch'], function() {
    livereload.listen({ quiet: true });
    gulp.watch('src/app/**/*.js', ['app-scripts']);
    gulp.watch('src/app/**/*.html', ['app-templates']);
    gulp.watch('src/**/*.less', ['app-styles']);
    gulp.watch('src/index.html', ['index']);
    gulp.watch('src/assets/**/*.*', ['static-assets']);
});

gulp.task('default', ['index', 'static-assets']);