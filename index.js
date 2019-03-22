const fs = require('fs')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
const {
    performance
} = require('perf_hooks');
ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

/*
* TODO: learn about references and use it for file handler in piece class 

*/



class File {
    constructor(path, rows, columns, outputSize, callback=()=>{}) {
        if (path === undefined) {
            throw "you must specify file to chop"
        }
        this.path = path;
        this.rows = rows;
        this.columns = columns;
        this.outputSize = outputSize;
        this.name = path.replace(/^.*[\\\/]/, '');
        this.t0 = performance.now();
        ffmpeg.ffprobe(this.path, (err, metadata) => {
            if (err) {
                throw (err)
            }
            this.width = (metadata.streams[0].width)
            this.height = (metadata.streams[0].height)
            this.pieceW = Math.floor(this.width / this.columns)
            this.pieceH = Math.floor(this.height / this.rows)
            this.frames = (metadata.streams[0].nb_frames)
            callback()
        });
    }
}
class Piece {
    constructor(file, count, callback=()=>{}) {
        this.file = file
        this.count = count
        const row = Math.floor(count / file.width) + 1;
        var col = (count) - (row - 1) * file.columns;
        var x = (col - 1) * file.pieceW;
        var y = (row - 1) * file.pieceH;
        var lett = String.fromCharCode(96 + row).toUpperCase();
        var code = lett + col
        if (y + file.pieceH > file.height || x + file.pieceW > file.width) {
            return null
        }
        this.x = x;
        this.y = y;
        this.code = code;
        console.log(this)
        callback()
    }
    process(callback) {
        // if (!piece.getPosition(count)) {
        //     file.t1 = performance.now()
        //     console.log("\nfinished " + (count - 1) + " pieces, work time:  " + msToTime(file.t1 - file.t0))
        //     return ("koniec")
        // } else {
        //     this.position = piece.getPosition(count);
        // }

        var onProgress = (progress) => {
            var prog = progress.frames / this.file.frames;
            this.file.progress = (this.count - 1 + prog) / this.file.numberOfPieces
            this.file.timePast = performance.now() - this.file.t0
            this.file.timeLeft = msToTime((this.file.timePast) * (1 - this.file.progress) / this.file.progress)
            process.stdout.write(" Processing: " + position.code + ', piece: ' + (count) + "/" + (this.file.numberOfPieces) + ", progress: " + (prog * 100).toFixed(0) + "%, position: " + this.x + "x" + this.y + ", estimated time left: " + this.file.timeLeft + "\r");
        }
        var onError = (err, stdout, stderr) => {
            throw ('Cannot process video: ' + err.message);
        }
        var onEnd = () => {
            this.t1 = performance.now()
            callback(this.t0 - this.t1)
        }
        var onStart = () => {
            this.t0 = performance.now();
        }



        var dir = './output/' + this.code

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        ffmpeg()
            .on('end', onEnd)
            .on('start', onStart)
            .on('progress', onProgress)
            .on('error', onError)
            .input(this.file.path)
            .videoFilters([{
                filter: 'crop',
                options: {
                    w: this.file.pieceW,
                    h: this.file.pieceH,
                    x: this.x,
                    y: this.y
                }
            }])
            .size(this.file.outputSize)
            .fps(24)
            .output(dir + '/' + this.file.name)
            // .noAudio()
            .run();
    }
}

var argv = require('minimist')(process.argv.slice(2));

var file = new File(argv._[0], argv.r, argv.c, argv.w + "x" + argv.h, () => {
    var piece = new Piece(file,1, () => {
    })
    piece.process()
})




// var updateConsole = (string) => {
//     process.stdout.write(" Filename: " + position.code + ', piece: ' + (count) + "/" + (file.numberOfPieces) + ", progress: " + (prog * 100).toFixed(0) + "%, position: " + this.position.x + "x" + this.position.y + ", estimated time left: " + file.timeLeft + "\r");
// }



// var getFile = new Promise((resolve, reject) => {
//     var file = {
//         path: argv._[0],
//         rows: argv.r,
//         columns: argv.c,
//         outputSize: argv.w + "x" + argv.h,
//         name: file.path.replace(/^.*[\\\/]/, ''),
//         numberOfPieces = file.columns * file.rows
//     }

//     if (file.path === undefined) {
//         throw "you must specify file to chop"
//     }
//     ffmpeg.ffprobe(file.path, (err, metadata) => {
//         if (err) {
//             throw (err)
//         }
//         file.width = (metadata.streams[0].width)
//         file.height = (metadata.streams[0].height)
//         file.frames = (metadata.streams[0].nb_frames)
//         resolve(file)
//     });
// })

// getFile.then((file) => {
//     file.piece = {
//         width: Math.floor(file.width / file.columns),
//         height: Math.floor(file.height / file.rows)
//     }
//     file.piece.getPosition = (count) => {
//         const row = Math.floor(count / file.width) + 1;
//         var col = (count) - (row - 1) * file.columns;
//         var x = (col - 1) * file.piece.width
//         var y = (row - 1) * file.piece.height;
//         var lett = String.fromCharCode(96 + row).toUpperCase();
//         var code = lett + col
//         if (y + file.piece.height > file.height || x + file.piece.width > file.width) {
//             return null
//         }
//         return {
//             "x": x,
//             "y": y,
//             "code": code
//         }
//     }
//     file.t0 = performance.now();




//     startPiece(1, file)
// })















// startPiece = function (count, file) {
//     piece = file.piece
//     if (!piece.getPosition(count)) {
//         file.t1 = performance.now()
//         console.log("\nfinished " + (count - 1) + " pieces, work time:  " + msToTime(file.t1 - file.t0))
//         return ("koniec")
//     } else {
//         this.position = piece.getPosition(count);
//     }
//     var t0
//     var t1
//     var meta
//     onProgress = (progress) => {
//         var prog = progress.frames / file.frames;
//         file.progress = (count - 1 + prog) / file.numberOfPieces
//         file.timePast = performance.now() - file.t0
//         file.timeLeft = msToTime((file.timePast) * (1 - file.progress) / file.progress)
//         process.stdout.write(" Processing: " + position.code + ', piece: ' + (count) + "/" + (file.numberOfPieces) + ", progress: " + (prog * 100).toFixed(0) + "%, position: " + this.position.x + "x" + this.position.y + ", estimated time left: " + file.timeLeft + "\r");
//     }
//     onError = (err, stdout, stderr) => {
//         throw ('Cannot process video: ' + err.message);
//     }
//     onEnd = () => {
//         this.t1 = performance.now()

//         console.log('Finished processing piece: ' + position.code + ', time: ' + msToTime(this.t1 - this.t0) + ", position: " + this.position.x + ", " + this.position.y + "\t\t")
//         startPiece(count + 1, file)
//     }
//     onStart = () => {
//         this.t0 = performance.now();
//     }

//     var timemark = null;


//     let dir = './output/' + position.code

//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir);
//     }
//     ffmpeg()
//         .on('end', onEnd)
//         .on('start', onStart)
//         .on('progress', onProgress)
//         .on('error', onError)
//         .input(file.path)
//         .videoFilters([{
//             filter: 'crop',
//             options: {
//                 w: piece.width,
//                 h: piece.height,
//                 x: this.position.x,
//                 y: this.position.y
//             }
//         }])
//         .size(file.outputSize)
//         .fps(24)
//         .output(dir + '/' + file.name)
//         // .noAudio()
//         .run();
// }





// function msToTime(duration) {
//     var milliseconds = parseInt((duration % 1000) / 100),
//         seconds = Math.floor((duration / 1000) % 60),
//         minutes = Math.floor((duration / (1000 * 60)) % 60),
//         hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

//     hours = (hours < 10) ? "0" + hours : hours;
//     minutes = (minutes < 10) ? "0" + minutes : minutes;
//     seconds = (seconds < 10) ? "0" + seconds : seconds;

//     return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
// }