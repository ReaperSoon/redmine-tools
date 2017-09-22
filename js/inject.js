var userId = getUserId();
var projects = {};
var times = {};
var text = "";
var currentWeek;
var maxWeeks;
var weekIndex;
var days;
var weekTickets = [];

run();

function run() {
    var calendar = $('#calendar_today').next();
    getProjects();

    weekIndex = 2;
    maxWeeks = calendar.children().children().length;
    changeWeek(weekIndex);

    /* Fonction appelée lorsque on est arrivé à la fin du mois */
    goToDay(function() {
        console.log(projects);
        console.log(times);
        chrome.runtime.sendMessage({
            projects: JSON.stringify(projects),
            times: JSON.stringify(times)
        });
    });
}

function getUserId() {
    var userId = $('#user_id_val').val();

    return userId;
}

function getProjects() {
    $('.listing.tickets:first tr:not(:first)').each(function(i) {
        var project = $(this).find('td:nth-child(2)').text();
        var time = $(this).find('td:nth-child(7)').text();

        projects[project] = {};
        if (typeof times[project] === 'undefined') {
            times[project] = parseInt(time);
        }
        else {
            times[project] += parseInt(time);
        }
    });

    return projects;
}

function changeWeek(weekNumber) {
    currentWeek = weekNumber-1;
    weekTickets = [];
    var calendar = $('#calendar_today').next();
    var week = calendar.children().children(':nth-child('+ weekNumber +')');
    days = week.children(':not(.calendar_without_hours)');
    dayIndex = 0;
}

function goToDay(finishCallback) {
    var day = $(days[dayIndex]);

    var elClass = day.attr('class').split(" ");
    var dateArr = elClass[0].split("_");
    var date = dateArr[4];

    var year = $('#date_year').val();
    var month = $('#date_month').val();

    if (day.find('.calendar_hours').find('span').text() !== 0) {
        load_day(userId, year, month, date, function() {
            getDailyData(date);
            if (dayIndex < days.length - 1) { // On change de jour
                dayIndex = dayIndex + 1;
                goToDay(finishCallback);
            } else if (weekIndex <= maxWeeks - 1) { // On change de semaine
                weekIndex = weekIndex + 1;
                changeWeek(weekIndex);
                goToDay(finishCallback);
            }else { // On a fini
                finishCallback();
            }
        });
    }
}

function load_day(user_id, year, month, day, callback){
    $.ajax({
        url: "https://redmine-projets.smile.fr/multiredmine/user_view_by_day/monthly-activity-report",
        cache: false,
        type: "GET",
        data: ({
            'user_id' : user_id,
            'date[year]' : year,
            'date[month]' : month,
            'day' : day
        }),
        success: function(html){
            $('#day_content').html(html);
            $(".calendar_selected").removeClass("calendar_selected");

            $(".calendar_date_"+year+"_"+month+"_"+day).addClass("calendar_selected");
            callback();
        },
        error: function(error) {
            console.log(error);
        }

    });
    location.hash=day;
}

function getDailyData(date) {
    
    var dayTickets = $('#day_content .listing.tickets:first tr:not(:first)');
    var week = [];

    for (var i = 0; i < dayTickets.length; i++) {
        dayTicket = dayTickets[i];
        var id = $(dayTicket).find('td.ticket').text();
        var project = $(dayTicket).find('td:nth-child(2)').text();
        var name = $(dayTicket).find('td:nth-child(3)').text();
        var time = $(dayTicket).find('td:nth-child(7)').text();

        if (typeof projects[project]["Semaine " + currentWeek] === 'undefined') {
            projects[project]["Semaine " + currentWeek] = {};
        }
        if (typeof weekTickets[id] === 'undefined') {
            weekTickets[id] = parseInt(time);
        }
        else {
            weekTickets[id] += parseInt(time);
        }
        projects[project]["Semaine " + currentWeek][id] = id + " - " + name + " - " + weekTickets[id]/8;
    }
}