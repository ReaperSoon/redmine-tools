function run() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        if (url.split('#')[0].indexOf('https://redmine-projets.smile.fr/multiredmine/user_view/monthly-activity-report') === 0) {
            clearStorage();
            // for the current tab, inject the "inject.js" file & execute it
            chrome.tabs.executeScript(null, { file: "js/jquery-1.12.4.js" }, function() {
                chrome.tabs.executeScript(null, { file: "js/inject.js" });
            });
        }
    });
}

function processData(projects, times) {
    addTextArea(projects, Object.keys(projects), times);
    $( "#content" ).accordion({
        heightStyle: "content"
    });
}

function addTextArea(projects, keysToProcess, times) {
    var count = Object.keys(projects).length;
    if (keysToProcess.length <= 0) {
        return;
    }

    var currentKey = keysToProcess.shift(),
        time = times[currentKey],
        textArea = '<textarea id="'+ currentKey + '" type="textarea"></textarea>',
        projectName = '<span class="projectName">'+currentKey+'</span>',
        projectTime = '<span class="total-time">'+time/8+'</div>',
        project  = projects[currentKey];

    var imputHeader = $('<div class="imputHeader"></div>');
    imputHeader.append( projectName );
    var copyBtn = $('<button class="copyBtn" data-textarea="' + currentKey + '">Copier</button>');
    copyBtn.click(copyTextarea);
    imputHeader.append( projectTime );
    imputHeader.append( copyBtn );
    $('#content').append( imputHeader );
    $('#content').append( textArea );

    if (typeof project === 'object') {
        addWeek(project, currentKey);
    }

    addTextArea(projects, keysToProcess, times);
}

function addWeek(project, projectId) {
    $.each(project, function(i, week) {
        document.getElementById(projectId).value += i+ "\n";
        addTickets(week, projectId);
    });
}

function addTickets(week, projectId) {
    $.each(week, function (i, ticket) {
        document.getElementById(projectId).value += ticket+"\n"
    })
}

function storeData(projects, times) {
    var datas = {};

    datas['projects'] = projects;
    datas['times'] = times;
    datas['lastDate'] = document.getElementById("lastDate").innerHTML;

    console.log(datas);

    chrome.storage.local.set(datas, function() {});
}

function getStorage() {
    chrome.storage.local.get(null, function(datas) {
        console.log(datas);
        var projects = datas.projects;
        var times = datas.times;
        var storedDate = datas.lastDate;
        
        setTimer(storedDate);
        processData(projects, times);
    });
}

function copyTextarea() {
    var textAreaId = $(this).attr('data-textarea');
    var textarea = $('[id="' + textAreaId + '"]');
    textarea.select();
    document.execCommand('copy');
    textarea.blur();
    $(this).text('Fait!');
    $(this).css('background-image', 'url("../imgs/tick.png")');
}

function clearStorage() {
    chrome.storage.local.clear();
}

function setTimer(storedDate = null) {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd='0'+dd
    } 

    if(mm<10) {
        mm='0'+mm
    } 

    today = dd+'/'+mm+'/'+yyyy;

    if (storedDate != null) {
        var res = storedDate.split("/");
        if (parseInt(res[1]) < parseInt(mm) && parseInt(dd) > 2) {
            clearStorage();
        }
    }

    $("#lastDate").html(today);
}

setTimer();
getStorage()
document.getElementById('imputBuilder').addEventListener('click', run);

chrome.runtime.onMessage.addListener(function(request, sender) {
    document.getElementById('content').innerHTML = "";
    var projects = JSON.parse(request.projects);
    var times = JSON.parse(request.times);
    storeData(projects, times);
    processData(projects, times);
});
