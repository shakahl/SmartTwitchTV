//Variable initialization
var Search_cursorY = 0;
var Search_cursorX = 0;
var Search_keyBoardOn = false;
//Variable initialization end

function Search_init() {
    Main_HideWarningDialog();
    Main_HideElement('label_refresh');
    Main_IconLoad('label_thumb', 'icon-return', STR_GOBACK);
    Main_innerHTML("label_last_refresh", '');
    Main_SearchInput.placeholder = STR_PLACEHOLDER_SEARCH;
    Main_ShowElement('search_scroll');
    Search_cursorY = 0;
    Search_cursorX = 0;
    Search_refreshInputFocusTools();
    Search_inputFocus();
}

function Search_exit() {
    Search_RemoveinputFocus(false);
    document.body.removeEventListener("keydown", Search_handleKeyDown);
    Search_refreshInputFocusTools();
    Main_values.Main_Go = Main_values.Main_BeforeSearch;
    Main_IconLoad('label_thumb', 'icon-options', STR_THUMB_OPTIONS_TOP);
    Main_ShowElement('label_refresh');
    Main_SearchInput.value = '';
    Main_HideElement('search_scroll');
}

function Search_loadData() {
    Search_exit();
    Main_ready(function() {
        if (!Search_cursorX) {
            inUseObj = SearchChannels;
            Screens_init();
        } else if (Search_cursorX === 1) {
            inUseObj = SearchGames;
            Screens_init();
        } else if (Search_cursorX === 2) {
            inUseObj = SearchLive;
            Screens_init();
        }
    });
}

function Search_refreshInputFocusTools() {
    Main_RemoveClass('chanel_button', 'button_search_focused');
    Main_RemoveClass('game_button', 'button_search_focused');
    Main_RemoveClass('live_button', 'button_search_focused');

    if (Search_cursorY) {
        if (!Search_cursorX) Main_AddClass('chanel_button', 'button_search_focused');
        else if (Search_cursorX === 1) Main_AddClass('game_button', 'button_search_focused');
        else if (Search_cursorX === 2) Main_AddClass('live_button', 'button_search_focused');
    }
}

function Search_handleKeyDown(event) {
    if (Search_keyBoardOn) return;

    switch (event.keyCode) {
        case KEY_KEYBOARD_BACKSPACE:
        case KEY_RETURN:
            if (Main_isControlsDialogShown()) Main_HideControlsDialog();
            else if (Main_isAboutDialogShown()) Main_HideAboutDialog();
            else {
                Search_exit();
                Main_SwitchScreen();
            }
            break;
        case KEY_LEFT:
            if (Search_cursorY === 1) {
                Search_cursorX--;
                if (Search_cursorX < 0) Search_cursorX = 2;
                Search_refreshInputFocusTools();
            }
            break;
        case KEY_RIGHT:
            if (Search_cursorY === 1) {
                Search_cursorX++;
                if (Search_cursorX > 2) Search_cursorX = 0;
                Search_refreshInputFocusTools();
            }
            break;
        case KEY_UP:
            if (Search_cursorY === 1) {
                Search_cursorY = 0;
                Search_refreshInputFocusTools();
                Search_inputFocus();
            }
            break;
        case KEY_DOWN:
            if (!Search_cursorY) {
                Search_RemoveinputFocus(false);
                Search_cursorY = 1;
                Search_refreshInputFocusTools();
            } else if (Search_cursorY === 1) {
                Search_cursorY = 0;
                Search_refreshInputFocusTools();
                Search_inputFocus();
            }
            break;
        case KEY_PLAY:
        case KEY_PAUSE:
        case KEY_PLAYPAUSE:
        case KEY_ENTER:
            if (!Search_cursorY) Search_inputFocus();
            else {
                if (Main_SearchInput.value !== '' && Main_SearchInput.value !== null) {
                    Main_values.Search_data = Main_SearchInput.value;
                    Main_SearchInput.value = '';
                    Search_loadData();
                } else {
                    Main_showWarningDialog(STR_SEARCH_EMPTY);
                    window.setTimeout(function() {
                        Main_HideWarningDialog();
                    }, 1000);
                }
            }
            break;
        default:
            break;
    }
}

var Search_inputFocusId;
function Search_inputFocus() {
    Main_AddClass('scene_notify', 'avoidclicks');
    Main_AddClass('scenefeed', 'avoidclicks');
    document.body.removeEventListener("keydown", Search_handleKeyDown);
    document.body.addEventListener("keydown", Search_KeyboardEvent, false);
    Main_SearchInput.placeholder = STR_PLACEHOLDER_SEARCH;


    window.clearTimeout(Search_inputFocusId);
    Search_inputFocusId = window.setTimeout(function() {
        Main_SearchInput.focus();
        Search_keyBoardOn = true;
    }, 500);
}

function Search_RemoveinputFocus(EnaKeydown) {
    window.clearTimeout(Search_inputFocusId);
    if (!Main_isTV && Main_IsOnAndroid) Android.mhideSystemUI();

    Main_RemoveClass('scenefeed', 'avoidclicks');
    Main_RemoveClass('scene_notify', 'avoidclicks');
    Main_SearchInput.blur();
    Search_removeEventListener();
    document.body.removeEventListener("keydown", Search_KeyboardEvent);
    Main_SearchInput.placeholder = STR_PLACEHOLDER_PRESS + STR_PLACEHOLDER_SEARCH;

    if (EnaKeydown) document.body.addEventListener("keydown", Search_handleKeyDown, false);
    Search_keyBoardOn = false;
}

function Search_removeEventListener() {
    if (Main_SearchInput !== null) {
        var elClone = Main_SearchInput.cloneNode(true);
        Main_SearchInput.parentNode.replaceChild(elClone, Main_SearchInput);
        Main_SearchInput = document.getElementById("search_input");
    }
}

function Search_KeyboardEvent(event) {
    switch (event.keyCode) {
        case KEY_RETURN:
            if (Main_isAboutDialogShown()) Main_HideAboutDialog();
            else if (Main_isControlsDialogShown()) Main_HideControlsDialog();
            else {
                Search_exit();
                Main_SwitchScreen();
            }
            break;
        case KEY_KEYBOARD_DONE:
        case KEY_DOWN:
            Search_KeyboardDismiss();
            break;
        default:
            break;
    }
}

function Search_KeyboardDismiss() {
    window.clearTimeout(Search_inputFocusId);
    Search_RemoveinputFocus(true);
    Search_cursorY = 1;
    Search_refreshInputFocusTools();
}
