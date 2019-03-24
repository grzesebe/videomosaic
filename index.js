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
* TODO: centralized status

*/



class File {
    constructor(path, rows, columns, outputSize, callback) {
        if (path === undefined) {
            throw "you must specify file to chop"
        }
        this.path = path;
        this.rows = rows;
        this.columns = columns;
        this.outputSize = outputSize;
        this.maxPieces = columns * rows;
        this.piecesToProcess = 0;
        this.name = path.replace(/^.*[\\\/]/, '');
        this.t0 = performance.now();
        this.piecesInProgress = [];
        this.countFinished = 0;
        ffmpeg.ffprobe(this.path, (err, metadata) => {
            if (err) {
                throw (err)
            }
            this.width = (metadata.streams[0].width)
            this.height = (metadata.streams[0].height)
            this.pieceW = Math.floor(this.width / this.columns)
            this.pieceH = Math.floor(this.height / this.rows)
            this.frames = (metadata.streams[0].nb_frames)
            callback ? callback() : null;
        });
    }
    processPieces(start, end, callback) {
        this.piecesToProcess = !end ? file.maxPieces : end
        if (start > this.piecesToProcess) {
            callback ? callback() : null
            return "end"
        }
        var cb = (piece) => {
            setTimeout(() => {
                this.processPieces(start + 1, end, callback)
            },0)
            this.countFinished++;
            delete this.piecesInProgress[piece.count];
        }
        this.piecesInProgress[start] = new Piece(this, start, (piece) => {
            piece.process(null, cb)
        })
    }

}
class Piece {
    constructor(file, count, callback) {
        this.file = file
        this.count = count
        var row = Math.floor((count-1) / file.columns)+1
        var col = (count) - (row - 1) * file.columns;
        var x = (col - 1) * file.pieceW;
        var y = (row - 1) * file.pieceH;
        var lett = String.fromCharCode(96 + row).toUpperCase();
        var code = lett + col
        if (y + file.pieceH > file.height || x + file.pieceW > file.width) {
            throw "piece out of range"
        }
        this.x = x;
        this.y = y;
        this.code = code;
        callback ? callback(this) : null
    }
    process(onProgress, callback) {


        var whileProgres = (progress) => {
            this.progress = progress.frames / this.file.frames;
            onProgress ? onProgress(this) : null;


        }
        var onError = (err, stdout, stderr) => {
            throw ('Cannot process video: ' + err.message);
        }
        var onEnd = () => {
            this.t1 = performance.now()
            console.log("finished: "+this.code+", time: "+msToTime(this.t1-this.t0)+"         ")
            callback ? callback(this) : null
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
            .on('progress', whileProgres)
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
    var int = setInterval(() => {
        var pieces = "";
        file.piecesInProgress.forEach(element => {
            pieces += element.code + ", "
        });
        process.stdout.write(" Processing: " + pieces + " finished: " + file.countFinished + "/" + file.piecesToProcess + "\r");
    }, 500)
    file.processPieces(1, null, () => {
        clearInterval(int)
        console.log("finished, TIME: "+msToTime(performance.now() - file.t0))
    })
})



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