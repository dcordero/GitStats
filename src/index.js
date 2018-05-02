const remote = require('electron').remote;
const Chart = require('chart.js');

const repoPath = '/PATH/TO/PROJECT';

document.getElementById('close').addEventListener('click', function () {
    var window = remote.getCurrentWindow();
    window.close();
});


refreshData();

function refreshData() {

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
        const data = composeData(parsedGitStatsLogs);
        updateUIWithData(data);
    });
}

function updateUIWithData(data) {
    console.log(data);

    const context = document.getElementById('graph');
    const chartData = {
        type: 'line',
        data : {
            datasets: [
                {
                    label: 'Timeline',
                    data: data
                }
            ],
            fill: true
        },
        options: {
            responsive: true,
            title:{
                display: true,
                text: 'Number of lines of code'
            },
            scales: {
                xAxes: [{
                    type: 'time',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of lines of code'
                    }
                }]
            }
        }
    };

    new Chart(context, chartData);
}

function composeData(parsedGitStatsLogs) {
    let data =[];
    let numberOfLinesOfCode = 0;
    for (let i = 0; i < parsedGitStatsLogs.length; i++) {
        const currentGitStatLog = parsedGitStatsLogs[i];

        numberOfLinesOfCode += (currentGitStatLog.insertions - currentGitStatLog.deletions);

        data.push({
            x: currentGitStatLog.date,
            y: numberOfLinesOfCode
        });
    }
    return data;
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
            date: Date.parse(paragraphObject.date),
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