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
        const parsedGitStatsLogs = parseGitStatsLog(log);
        console.log(parsedGitStatsLogs);
    });
}

function parseGitStatsLog(log) {
    var paragraphs = log.toString().split('\n\n');

    let gitStatsLogs = [];
    for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        
        const paragraphObject = parseParagraph(paragraph);
        const diffObject = parseDiff(paragraphObject.diff);

        gitStatsLogs.push({
            name: paragraphObject.name,
            date: paragraphObject.date,
            insertions: diffObject.insertions,
            deletions: diffObject.deletions
        });
    }
    return gitStatsLogs;
}

function parseParagraph(paragraph) {
    const splitedParagraph = paragraph.split('\n'); 

    return {
        name: splitedParagraph && splitedParagraph[0] || 'Anonymous',
        date: splitedParagraph && splitedParagraph[1] || '',
        diff: splitedParagraph && splitedParagraph[2] || ''
    };
}

function parseDiff(diff) {
    const insertionsRegex = /(\d*)\sinsertion/;
    const deletionsRegex = /(\d*)\sdeletion/;

    const insertionMatches = insertionsRegex.exec(diff);
    const deletionMatches = deletionsRegex.exec(diff);

    return {
        insertions: insertionMatches && insertionMatches[1] || 0,
        deletions: deletionMatches && deletionMatches[1] || 0
    };
}