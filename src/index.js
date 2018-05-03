const remote = require('electron').remote;
const Chart = require('chart.js');

var repoPath = '';

document.getElementById('close').addEventListener('click', function () {
    var window = remote.getCurrentWindow();
    window.close();
});

document.getElementById('selectProject').addEventListener('click', function (event) {
    event.preventDefault();

    const selectProjectForm = document.getElementById('selectProjectForm');
    selectProjectForm.style.visibility = 'hidden';

    repoPath = document.getElementById("projectPath").value;

    const loading = document.getElementById('loading');
    loading.style.visibility = 'visible';

    refreshData();
});

function refreshData() {

    const { spawn } = require('child_process');
    const command = '--git-dir ' + repoPath + '/.git --work-tree ' + repoPath + ' log --no-merges --shortstat --reverse --pretty=format:\'%cn%n%cd\'';
    var child = spawn('git', command.split(' '));//.concat(['--since=\'1 Jan, 2014\'']));

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
    const loading = document.getElementById('loading');
    loading.style.visibility = 'hidden';

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
                text: 'Stadisticts of: ' + repoPath
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
    for (let i = 0; i < paragraphs.length-1; i++) {
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
        name: splitedParagraph && splitedParagraph[splitedParagraph.length-3] || 'Anonymous',
        date: splitedParagraph && splitedParagraph[splitedParagraph.length-2] || '',
        diff: splitedParagraph && splitedParagraph[splitedParagraph.length-1] || ''
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