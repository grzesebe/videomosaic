const fs = require('fs')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const { performance } = require('perf_hooks');

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);



var getFile = new Promise((resolve, reject) => {
    var file = {
        path: process.argv[2]
    }
    console.log("File Path: "+file.path)
    if(file.path === undefined){
        throw "you must specify file to chop"
    }
    ffmpeg.ffprobe(file.path, (err, metadata) => {
        file.width = (metadata.streams[0].width)
        file.height = (metadata.streams[0].height)
        
        resolve(file)
    });
})

getFile.then((file) => {
    console.log("test: "+file)
    file.piece = {
        width: 320,
        height: 180
    }
    file.usableHeight  = file.height - (file.height%file.piece.height);
    file.usableWidth  = file.width - (file.width%file.piece.width);
    file.numberOfPieces = (file.usableHeight/file.height)*(file.usableWidth/file.width)
    console.log("usable height: "+file.usableHeight+", usable width: "+file.usableWidth)
    file.piece.getPosition = (count) => {
        const flatY = count*file.piece.width;
        const row = Math.floor(flatY/file.usableWidth);
        console.log("row: "+row)
        var x = flatY - row*file.usableWidth;
        var y = row*file.piece.height;
        if(y+file.piece.height>file.usableHeight){
            return null
        }
        return {"x" : x, "y" : y}
    }
    file.t0 = performance.now();
    startPiece(0, file)
})











    // const mkdirSync = function (dirPath) {
    //     try {
    //         fs.mkdirSync(dirPath)
    //     } catch (err) {
    //         if (err.code !== 'EEXIST') throw err
    //     }
    // }






startPiece = function(count, file){
    piece = file.piece
    if(!piece.getPosition(count)){
        file.t1 = performance.now()
        console.log("finished, work time:  "+msToTime(file.t1 - file.t0))
        return("koniec")
    }else{
        this.position = piece.getPosition(count);
    }
    var t0
    var t1
    var meta
    onProgress = (progress) => {
        // console.log('piece: ' + (count+1) + ", frames: " + progress.frames);
        process.stdout.write('piece: ' + (count+1) + "/"+(file.numberOfPieces+1)+", frames: " + progress.frames+", position: "+this.position.x+", "+this.position.y+"\r");
    }
    onError = (err, stdout, stderr) => {
        console.log('Cannot process video: ' + err.message);
    }
    onEnd = () => {
        this.t1 = performance.now()

        console.log('Finished processing piece: '+count+', time: '+msToTime(this.t1 - this.t0)+", position: "+this.position.x+", "+this.position.y)
        startPiece(count+1, file)
    }
    onStart = () => {
        this.t0 = performance.now();
    }
    
    var timemark = null;
    // mkdirSync("")
    ffmpeg()
        .on('end', onEnd)
        .on('start', onStart)
        .on('progress', onProgress)
        .on('error', onError)
        .input(file.path)
        .videoFilters([{
            filter: 'crop',
            options: {
                w: piece.width,
                h: piece.height,
                x: this.position.x,
                y: this.position.y
            }
        }])
        .fps(24)
        .output('./output/'+(count+1)+'.mp4')
        // .noAudio()
        .run();
}


    


function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
  }
// startPiece(0)

//   var file = new File(start())
