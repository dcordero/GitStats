const remote = require('electron').remote;
const Chart = require('chart.js');

const repoPath = '/PATH/TO/PROJECT';

document.getElementById('close').addEventListener('click', function () {
    var window = remote.getCurrentWindow();
    window.close();
});

const context = document.getElementById('graph');
const data = {
    type: 'line',
    data : {
        labels: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        datasets: [
            {
                label: 'My First Dataset',
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                lineTension: 0.1
            }
        ]
    },
    options: {}
};
new Chart(context, data);

gitLog();

function gitLog() {

    const { spawn } = require('child_process');
    const command = '--git-dir ' + repoPath + '.git --work-tree ' + repoPath + ' log --no-merges --shortstat --reverse --pretty=format:\'%an%n%cd\'';
    var child = spawn('git', command.split(' '));


    var log = '';

    child.stdout.on('data', function (data) {
        log += data;
    });

    child.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
    });
      
    child.on('close', function () {
        var paragraphs = log.toString().split('\n\n');

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const paragraphObject = parseParagraph(paragraph);
            console.log(paragraphObject.name);

            const diffObject = parseDiff(paragraphObject.diff);
            console.log(diffObject);
        }
    });
}

function parseParagraph(paragraph) {
    let splitedParagraph = paragraph.split('\n'); 
    return {
        name: splitedParagraph[0],
        date: splitedParagraph[1],
        diff: splitedParagraph[2]
    };
}

function parseDiff(diff) {
    let insertionsRegex = /(\d*)\sinsertion/;
    let deletionsRegex = /(\d*)\sdeletion/;

    let insertionMatches = insertionsRegex.exec(diff);
    let deletionMatches = deletionsRegex.exec(diff);

    return {
        insertions: insertionMatches && insertionMatches[1] || 0,
        deletions: deletionMatches && deletionMatches[1] || 0
    };
}