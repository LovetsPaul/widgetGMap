var gulp         = require('gulp'),
    browserSync  = require('browser-sync').create();

gulp.task('browser-sync',  function() {
        browserSync.init({
                server: {
                        baseDir: "./"
                },
                notify: false
        });
        
});

gulp.task('watch', function () {
    gulp.watch('js/*.js').on("change", browserSync.reload);
    gulp.watch('*.html').on('change', browserSync.reload);
});

gulp.task('default', ['browser-sync', 'watch']);