//Variable initialization
var AddUser_loadingDataTry = 0;
var AddUser_loadingDataTryMax = 5;
var AddUser_loadingDataTimeout = 3500;
var AddUser_UsernameArray = [];
var AddUser_Username = null;
var AddUser_loadingData = false;
var AddUser_keyBoardOn = false;
//Variable initialization end

function AddUser_init() {
    Main_values.Main_Go = Main_addUser;
    ScreensObj_SetTopLable(STR_USER_ADD);
    Main_HideWarningDialog();
    Main_AddUserInput.placeholder = STR_PLACEHOLDER_USER;
    Main_ShowElement('add_user_scroll');
    AddUser_inputFocus();
}

function AddUser_exit() {
    AddUser_RemoveinputFocus(false);
    document.body.removeEventListener("keydown", AddUser_handleKeyDown);
    document.body.removeEventListener("keydown", AddUser_KeyboardEvent);
    Main_HideElement('add_user_scroll');
}

function AddUser_handleKeyDown(event) {
    if (AddUser_loadingData || AddUser_keyBoardOn || Main_values.Main_Go !== Main_addUser) return;
    switch (event.keyCode) {
        case KEY_KEYBOARD_BACKSPACE:
        case KEY_RETURN:
            if (Main_isAboutDialogShown()) Main_HideAboutDialog();
            else if (Main_isControlsDialogShown()) Main_HideControlsDialog();
            else {
                if (AddUser_UsernameArray.length > 0 && Main_values.Main_Go !== Main_Users) Main_values.Main_Go = Main_values.Main_Before;
                else Main_values.Main_Go = Main_Live;
                AddUser_exit();
                Main_SwitchScreen();
            }
            break;
        case KEY_PLAY:
        case KEY_PAUSE:
        case KEY_PLAYPAUSE:
        case KEY_KEYBOARD_SPACE:
        case KEY_ENTER:
            AddUser_inputFocus();
            break;
        default:
            break;
    }
}

var AddUser_inputFocusId;
function AddUser_inputFocus() {
    Main_AddClass('scenefeed', 'avoidclicks');
    Main_AddClass('scene_notify', 'avoidclicks');
    document.body.removeEventListener("keydown", AddUser_handleKeyDown);
    document.body.addEventListener("keydown", AddUser_KeyboardEvent, false);
    Main_AddUserInput.placeholder = STR_PLACEHOLDER_USER;

    window.clearTimeout(AddUser_inputFocusId);
    AddUser_inputFocusId = window.setTimeout(function() {
        Main_AddUserInput.focus();
        AddUser_keyBoardOn = true;
    }, 500);
}

function AddUser_removeEventListener() {
    if (!Main_isTV && Main_IsOnAndroid) Android.mhideSystemUI();

    Main_RemoveClass('scenefeed', 'avoidclicks');
    Main_RemoveClass('scene_notify', 'avoidclicks');
    if (Main_AddUserInput !== null) {
        var elClone = Main_AddUserInput.cloneNode(true);
        Main_AddUserInput.parentNode.replaceChild(elClone, Main_AddUserInput);
        Main_AddUserInput = document.getElementById("user_input");
    }
}

function AddUser_RemoveinputFocus(EnaKeydown) {
    window.clearTimeout(AddUser_inputFocusId);
    Main_AddUserInput.blur();
    AddUser_removeEventListener();
    document.body.removeEventListener("keydown", AddUser_KeyboardEvent);
    Main_AddUserInput.placeholder = STR_PLACEHOLDER_PRESS + STR_PLACEHOLDER_USER;

    if (EnaKeydown) document.body.addEventListener("keydown", AddUser_handleKeyDown, false);
    AddUser_keyBoardOn = false;
}

function AddUser_KeyboardEvent(event) {
    if (AddUser_loadingData || Main_values.Main_Go !== Main_addUser) return;

    switch (event.keyCode) {
        case KEY_RETURN:
            if (Main_isAboutDialogShown()) Main_HideAboutDialog();
            else if (Main_isControlsDialogShown()) Main_HideControlsDialog();
            else {
                if (AddUser_UsernameArray.length > 0 && Main_values.Main_Go !== Main_Users) Main_values.Main_Go = Main_values.Main_Before;
                else Main_values.Main_Go = Main_Live;
                AddUser_exit();
                Main_SwitchScreen();
            }
            break;
        case KEY_KEYBOARD_DONE:
        case KEY_DOWN:
            AddUser_KeyboardDismiss();
            break;
        default:
            break;
    }
}

function AddUser_KeyboardDismiss() {
    window.clearTimeout(AddUser_inputFocusId);
    if (Main_AddUserInput.value !== '' && Main_AddUserInput.value !== null) {

        AddUser_Username = Main_AddUserInput.value;

        if (!AddUser_UserCodeExist(AddUser_Username)) {
            AddUser_loadingDataTry = 0;
            AddUser_loadingDataTimeout = 3500;
            AddUser_loadingData = true;
            Main_HideElement('add_user_scroll');
            Main_showLoadDialog();
            AddUser_loadDataRequest();
        } else {
            Main_HideLoadDialog();
            Main_showWarningDialog(STR_USER + " " + AddUser_Username + STR_USER_SET);
            window.setTimeout(function() {
                Main_HideWarningDialog();
                AddUser_inputFocus();
            }, 1500);
        }
    } else AddUser_inputFocus();
}

function AddUser_loadDataRequest() {
    var theUrl = Main_kraken_api + 'users?login=' + encodeURIComponent(AddUser_Username) + Main_TwithcV5Flag;

    BasehttpGet(theUrl, AddUser_loadingDataTimeout, 2, null, AddUser_loadDataRequestSuccess, AddUser_loadDataError);
}

function AddUser_loadDataRequestSuccess(response) {
    if (JSON.parse(response)._total) {
        Main_AddUserInput.value = '';
        document.body.removeEventListener("keydown", AddUser_handleKeyDown);
        AddUser_SaveNewUser(response);
    } else AddUser_loadDataNoUser();
}

function AddUser_loadDataError() {
    AddUser_loadingDataTry++;
    if (AddUser_loadingDataTry < AddUser_loadingDataTryMax) {
        AddUser_loadingDataTimeout += 500;
        AddUser_loadDataRequest();
    } else AddUser_loadDataNoUser();
}

function AddUser_loadDataNoUser() {
    AddUser_Username = null;
    Main_HideLoadDialog();
    Main_showWarningDialog(STR_USER_ERROR);
    window.setTimeout(function() {
        AddUser_init();
    }, 1000);
    AddUser_loadingData = false;
}

function AddUser_RestoreUsers() {
    Sidepannel_FixDiv = document.getElementById('side_panel_fix');
    Sidepannel_MovelDiv = document.getElementById('side_panel_movel');

    AddUser_UsernameArray = Main_getItemJson('AddUser_UsernameArray', []);
    if (AddUser_UsernameArray.length > 0) {

        //TODO remove this try after some app updates
        try {
            if (Main_IsOnAndroid) {
                Android.upNotificationId(AddUser_UsernameArray[0].id);
                UserLiveFeed_WasLiveidObject[AddUser_UsernameArray[0].id] = {};
                Main_RestoreLiveObjt(AddUser_UsernameArray[0].id);
            }
        } catch (e) {}

        //Check and refresh all tokens at start
        for (var i = 0; i < AddUser_UsernameArray.length; i++) {
            if (AddUser_UsernameArray[i].access_token) AddCode_CheckTokenStart(i);

            if (!AddUser_UsernameArray[i].logo) AddUser_UpdateUser(i, 0);
            else if (!i) AddUser_UpdateSidepanel();

            //Set user history obj
            Main_values_History_data[AddUser_UsernameArray[i].id] = {
                live: [],
                vod: [],
                clip: []
            };
        }

        Main_Restore_history();
        return true;
    } else {
        AddUser_UpdateSidepanelDefault();
        return false;
    }
}

function AddUser_UpdateSidepanel() {
    AddUser_UpdateSidepanelSize(AddUser_UsernameArray[0].logo, AddUser_UsernameArray[0].display_name);
}

function AddUser_UpdateSidepanelDefault() {
    AddUser_UpdateSidepanelSize(IMG_404_LOGO, STR_USER_ADD);
}

function AddUser_UpdateSidepanelAfterShow() {
    if (AddUser_IsUserSet()) AddUser_UpdateSidepanel();
    else AddUser_UpdateSidepanelDefault();
}

function AddUser_UpdateSidepanelSize(logo, username) {
    Main_innerHTML("side_panel_new_0_img",
        '<img class="side_panel_new_img" alt="" src="' +
        logo + '" onerror="this.onerror=null;this.src=\'' + IMG_404_LOGO + '\';">');
    Sidepannel_SetUserlable(username);

    var size = username.lengthdoc = document.getElementById('side_panel_movel');

    size = (size > 11 ? size - 11 : 0);

    Sidepannel_MovelDiv.style.width = 'calc(' + Sidepannel_MoveldefaultWidth + '% + ' + size + 'ch)';

    var pos = Sidepannel_MovelDiv.offsetWidth - Sidepannel_FixDiv.offsetWidth;

    if (pos) Sidepannel_MovelDiv.style.transform = 'translateX(-' + ((pos / BodyfontSize) - 0.1) + 'em)';
    else {
        var newsize = document.body.offsetWidth;
        newsize = (newsize / 100 * (Sidepannel_MoveldefaultWidth + size)) - (newsize / 100 * 5);
        Sidepannel_MovelDiv.style.transform = 'translateX(-' + ((newsize / BodyfontSize) - 0.05) + 'em)';
    }
}

function AddUser_UserIsSet() {
    return AddUser_UsernameArray.length > 0;
}

function AddUser_UpdateUser(position, tryes) {
    var theUrl = Main_kraken_api + 'users?login=' + encodeURIComponent(AddUser_UsernameArray[position].name) + Main_TwithcV5Flag;
    var xmlHttp = new XMLHttpRequest();

    xmlHttp.open("GET", theUrl, true);
    xmlHttp.timeout = 10000;

    for (var i = 0; i < 2; i++)
        xmlHttp.setRequestHeader(Main_Headers[i][0], Main_Headers[i][1]);

    xmlHttp.ontimeout = function() {};

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4) {
            if (xmlHttp.status === 200) AddUser_UpdateUsertSuccess(xmlHttp.responseText, position);
            else AddUser_UpdateUserError(position, tryes);
        }
    };

    xmlHttp.send(null);
}

function AddUser_UpdateUsertSuccess(response, position) {
    var user = JSON.parse(response);
    if (user._total) {
        document.body.removeEventListener("keydown", AddUser_handleKeyDown);
        user = user.users[0];
        AddUser_UsernameArray[position].display_name = user.display_name;
        AddUser_UsernameArray[position].logo = user.logo;
        if (!position) AddUser_UpdateSidepanel();
    }
    AddUser_SaveUserArray();
}

function AddUser_UpdateUserError(position, tryes) {
    tryes++;
    if (tryes < AddUser_loadingDataTryMax) AddUser_UpdateUser(position, tryes);
}

function AddUser_SaveNewUser(responseText) {
    AddUser_Username = JSON.parse(responseText).users[0];
    AddUser_UsernameArray.push({
        name: AddUser_Username.name,
        id: AddUser_Username._id,
        display_name: AddUser_Username.display_name,
        logo: AddUser_Username.logo,
        access_token: 0,
        refresh_token: 0,
        expires_in: 0,
        timeout_id: null,
    });

    Main_values_History_data[AddUser_UsernameArray[AddUser_UserFindpos(AddUser_Username.name)].id] = {
        live: [],
        vod: [],
        clip: []
    };

    AddUser_SaveUserArray();
    Users_status = false;
    Users_Userlastadded = AddUser_Username.name;
    Users_ShowAutetication = true;
    AddUser_exit();
    Main_values.Main_Go = Main_Users;
    Main_HideLoadDialog();
    if (AddUser_UsernameArray.length === 1) AddUser_UpdateSidepanel();
    Main_SwitchScreen();
    AddUser_loadingData = false;
}

function AddUser_removeUser(position) {
    // remove the user
    var index = AddUser_UsernameArray.indexOf(AddUser_UsernameArray[position]);
    if (index > -1) {
        window.clearTimeout(AddUser_UsernameArray[position].timeout_id);
        AddUser_UsernameArray.splice(index, 1);
    }

    // reset localStorage usernames
    AddUser_SaveUserArray();

    // restart users and smarthub
    if (AddUser_UsernameArray.length > 0) {
        //Reset main user if user is 0
        if (!position) AddUser_UpdateSidepanel();
        Users_status = false;
        Users_init();
    } else {
        AddUser_UpdateSidepanelDefault();
        AddUser_init();
    }
}

function AddUser_SaveUserArray() {
    if (AddUser_UsernameArray.length > 0) {
        //Remove first user alphabetical sort and add first back
        var mainuser = AddUser_UsernameArray.splice(0, 1);
        AddUser_UsernameArray.sort(function(a, b) {
            return (a.display_name).toLowerCase().localeCompare((b.display_name).toLowerCase());
        });
        AddUser_UsernameArray.splice(0, 0, mainuser[0]);
    }
    var string = JSON.stringify(AddUser_UsernameArray);
    Main_setItem('AddUser_UsernameArray', string);

    if (Main_CanBackup) Android.BackupFile(Main_UserBackupFile, string);
}

function AddUser_UserMakeOne(position) {
    window.clearTimeout(Main_CheckResumeFeedId);

    var temp_Username = JSON.parse(JSON.stringify(AddUser_UsernameArray[0]));
    AddUser_UsernameArray[0] = JSON.parse(JSON.stringify(AddUser_UsernameArray[position]));
    AddUser_UsernameArray[position] = temp_Username;

    AddCode_Refreshtimeout(0);
    AddCode_Refreshtimeout(position);

    AddUser_SaveUserArray();
    Users_status = false;
    AddUser_UpdateSidepanel();
    Users_init();

    if (Main_IsOnAndroid) {
        //TODO remove the try after some app updates
        try {
            Android.upNotificationId(AddUser_UsernameArray[0].id);
        } catch (e) {}
        Main_SaveLiveObjt(AddUser_UsernameArray[0].id);
    }
}

function AddUser_UserCodeExist(user) {
    return AddUser_UsernameArray.filter(function(array) {
        return array.name === user;
    }).length > 0;
}

function AddUser_UserFindpos(user) {
    return AddUser_UsernameArray.map(function(array) {
        return array.name;
    }).indexOf(user);
}

function AddUser_IsUserSet() {
    return AddUser_UsernameArray.length > 0;
}
