var GAME_NAME = 'MeteorBlast';
var TOP_SCORES = 5;
var serviceBase = 'http://codebridgesoftware.com/Services/';
//var serviceBase = 'http://localhost/CodeBridgeSoftware/Services/';

//=========================================================================== 
//Global and General Functions
//===========================================================================
//Dataservice closure
Dataservice = (function () {

    //Private members
    var service = 'CodeBridgeSoftwareService.asmx/';
    var ajaxRequest = null;

    function processAjaxRequest(method, successcallback, errorcallback, Data, isAsync, actiontype) {

        jQuery.support.cors = true;

        if ((typeof Data === "undefined") || (Data == {}))
            Data = {};

        if (typeof isAsync === "undefined")
            isAsync = true;

        if (typeof actiontype === "undefined")
            actiontype = "POST";

        ajaxRequest = $.ajax({
            type: actiontype,
            url: serviceBase + service + method,
            data: Data,
            crossDomain: true,
            contentType: "application/json",
            dataType: "json",
            async: isAsync,
            beforeSend: function (xhr) {
            },
            success: function (data) {
                ajaxRequest = null;
                if (successcallback != null) successcallback(data);
            },
            error: function (request, status, error) {
                ajaxRequest = null;
                if (errorcallback != null) errorcallback(status + ': ' + $.parseJSON(request.responseText).Message);
            }
        });

    }

    return {

        //Public members

        abortAjaxRequest: function () {
            if (ajaxRequest) {
                ajaxRequest.abort();
            }
        },

        getTopScores: function (successcallback, errorcallback) {
            processAjaxRequest('GetGameTopPlayers', successcallback, errorcallback, JSON.stringify({ GameName: GAME_NAME, TopCount: TOP_SCORES }));
        },

        insertPlayerStats: function (playerStats, successcallback, errorcallback) {
            processAjaxRequest('SavePlayerStats', successcallback, errorcallback, JSON.stringify({ GameName: GAME_NAME, Tag: playerStats.Tag, Score: playerStats.Score }));
        }

    }

})();
