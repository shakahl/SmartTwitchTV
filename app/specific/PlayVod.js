//Variable initialization
var PlayVod_quality = 'Auto';
var PlayVod_qualityPlaying = PlayVod_quality;

var PlayVod_state = 0;

var PlayVod_qualities = [];
var PlayVod_qualityIndex = 0;
var PlayVod_playlist = null;

var PlayVod_isOn = false;
var PlayVod_Buffer = 2000;

var PlayVod_loadingInfoDataTry = 0;
var PlayVod_loadingInfoDataTryMax = 5;
var PlayVod_loadingInfoDataTimeout = 10000;

var Play_jumping = false;
var PlayVod_SizeClearID;
var PlayVod_addToJump = 0;
var PlayVod_IsJumping = false;
var PlayVod_jumpCount = 0;
var PlayVod_currentTime = 0;
var PlayVod_VodPositions = 0;
var PlayVod_PanelY = 0;
var PlayVod_ProgressBaroffset = 0;
var PlayVod_StepsCount = 0;
var PlayVod_TimeToJump = 0;
var PlayVod_replay = false;
var PlayVod_jumpTimers = [0, 5, 10, 30, 60, 120, 300, 600, 900, 1200, 1800];

var PlayVod_RefreshProgressBarrID;
var PlayVod_SaveOffsetId;
var PlayVod_VodOffset;
//Variable initialization end

function PlayVod_Start() {
    Play_showBufferDialog();
    Play_HideEndDialog();
    //Play_SupportsSource = true;
    PlayVod_currentTime = 0;
    Main_textContent("stream_live_time", '');
    Main_textContent('progress_bar_current_time', Play_timeS(0));
    Chat_title = " VOD";
    Play_LoadLogo(document.getElementById('stream_info_icon'), IMG_404_BANNER);
    Main_innerHTML('pause_button', '<div ><i class="pause_button3d icon-pause"></i> </div>');
    Main_HideElement('progress_pause_holder');
    Main_ShowElement('progress_bar_div');
    Play_BufferSize = 0;

    document.getElementById('controls_' + Play_MultiStream).style.display = 'none';
    document.getElementById('controls_' + Play_controlsOpenVod).style.display = 'none';
    document.getElementById('controls_' + Play_controlsChatDelay).style.display = 'none';
    document.getElementById('controls_' + Play_controlsLowLatency).style.display = 'none';
    PlayExtra_UnSetPanel();
    Play_CurrentSpeed = 3;
    Play_IconsResetFocus();
    UserLiveFeed_Unset();
    Play_ShowPanelStatus(2);

    PlayVod_StepsCount = 0;
    Play_DefaultjumpTimers = PlayVod_jumpTimers;
    PlayVod_jumpSteps(Play_DefaultjumpTimers[1]);
    PlayVod_state = Play_STATE_LOADING_TOKEN;
    PlayClip_HasVOD = true;
    UserLiveFeed_PreventHide = false;
    ChannelVod_vodOffset = 0;
    Main_values.Play_isHost = false;
    PlayClip_HideShowNext(0, 0);
    PlayClip_HideShowNext(1, 0);

    if (!Main_values.vodOffset) {//we have some vod info
        Play_LoadLogo(document.getElementById('stream_info_icon'), Main_values.Main_selectedChannelLogo);
        Main_innerHTML("stream_info_name", Play_partnerIcon(Main_values.Main_selectedChannelDisplayname, Main_values.Main_selectedChannelPartner, false, ' [' + (ChannelVod_language).toUpperCase() + ']'));
        Main_innerHTML("stream_info_title", ChannelVod_title);
        Main_textContent("stream_info_game", ChannelVod_game);
        Main_innerHTML("stream_live_time", ChannelVod_createdAt + ',' + STR_SPACE + ChannelVod_views);
        Main_textContent("stream_live_viewers", '');
        Main_textContent("stream_watching_time", '');

        Main_replaceClassEmoji('stream_info_title');
    }

    Play_EndSet(2);
    PlayVod_muted_segments_value = null;
    PlayVod_previews_clear();
    PlayVod_PrepareLoad();
    PlayVod_updateVodInfo();

    if (!PlayVod_replay) {
        var VodIdex = AddUser_UserIsSet() ? Main_history_Exist('vod', Main_values.ChannelVod_vodId) : -1;
        PlayVod_VodOffset = (VodIdex > -1) ?
            Main_values_History_data[AddUser_UsernameArray[0].id].vod[VodIdex].watched : 0;
    }

    if (PlayVod_VodOffset && !Main_values.vodOffset) {
        Play_HideBufferDialog();
        Play_showVodDialog();
    } else {
        Chat_offset = 0;
        Chat_Init();
        PlayVod_PosStart();
    }
}

function PlayVod_PosStart() {
    window.setTimeout(function() {
        Main_ShowElement('controls_holder');
        Main_ShowElement('progress_pause_holder');
    }, 1000);
    Main_textContent('progress_bar_duration', Play_timeS(Play_DurationSeconds));

    Main_values.Play_WasPlaying = 2;
    Main_SaveValues();

    PlayVod_SaveOffsetId = window.setInterval(PlayVod_SaveOffset, 60000);

    Play_IsWarning = false;
    PlayVod_jumpCount = 0;
    PlayVod_IsJumping = false;
    Play_jumping = false;
    PlayVod_isOn = true;

    if (!PlayVod_replay) PlayVod_loadDatanew();
    else {
        PlayVod_state = Play_STATE_PLAYING;
        PlayVod_onPlayer();
    }

    Play_controls[Play_controlsChanelCont].setLable(Main_values.Main_selectedChannelDisplayname);
    Play_controls[Play_controlsGameCont].setLable(Play_data.data[3]);
}

function PlayVod_PrepareLoad() {
    PlayVod_loadingInfoDataTry = 0;
    PlayVod_loadingInfoDataTryMax = 6;
    PlayVod_loadingInfoDataTimeout = 10000;
}

function PlayVod_updateVodInfo() {
    var theUrl = Main_kraken_api + 'videos/' + Main_values.ChannelVod_vodId + Main_TwithcV5Flag_I;
    BasexmlHttpGet(theUrl, PlayVod_loadingInfoDataTimeout, 2, null, PlayVod_updateVodInfoPannel, PlayVod_updateVodInfoError);
}

function PlayVod_updateVodInfoError() {
    PlayVod_loadingInfoDataTry++;
    if (PlayVod_loadingInfoDataTry < PlayVod_loadingInfoDataTryMax) {
        PlayVod_loadingInfoDataTimeout += 2000;
        PlayVod_updateVodInfo();
    }
}

function PlayVod_CheckFollow() {
    if (AddUser_UserIsSet()) {
        AddCode_Channel_id = Main_values.Main_selectedChannel_id;
        AddCode_PlayRequest = true;
        AddCode_CheckFollow();
    } else Play_hideFollow();
}

function PlayVod_updateVodInfoPannel(response) {
    response = JSON.parse(response);

    //Update the value only if the Play_UpdateDuration() has not yet
    if (!Play_DurationSeconds) Play_DurationSeconds = parseInt(response.length);

    ChannelVod_title = twemoji.parse(response.title, false, true);

    Main_values.Main_selectedChannelPartner = response.channel.partner;
    Main_innerHTML("stream_info_name", Play_partnerIcon(Main_values.Main_selectedChannelDisplayname, Main_values.Main_selectedChannelPartner, false,
        '[' + (response.channel.broadcaster_language).toUpperCase() + ']'));

    Main_innerHTML("stream_info_title", ChannelVod_title);
    Main_innerHTML("stream_info_game", (response.game !== "" && response.game !== null ? STR_STARTED + STR_PLAYING +
        response.game : ""));

    Main_innerHTML("stream_live_time", STR_STREAM_ON + Main_videoCreatedAt(response.created_at) + ',' + STR_SPACE + Main_addCommas(response.views) + STR_VIEWS);
    Main_textContent("stream_live_viewers", '');
    Main_textContent("stream_watching_time", '');

    Main_textContent('progress_bar_duration', Play_timeS(Play_DurationSeconds));

    PlayVod_currentTime = Main_values.vodOffset * 1000;
    PlayVod_ProgresBarrUpdate(Main_values.vodOffset, Play_DurationSeconds, true);

    Main_values.Main_selectedChannelDisplayname = response.channel.display_name;

    Main_values.Main_selectedChannelLogo = response.channel.logo;
    Play_LoadLogo(document.getElementById('stream_info_icon'), Main_values.Main_selectedChannelLogo);

    Main_values.Main_selectedChannel_id = response.channel._id;
    Main_values.Main_selectedChannel = response.channel.name;

    PlayVod_CheckFollow();

    PlayVod_previews_pre_start(response.seek_previews_url);
    PlayVod_muted_segments_value = response.muted_segments;
    PlayVod_muted_segments(PlayVod_muted_segments_value);

    Main_values_Play_data = ScreensObj_VodCellArray(response);
    Main_Set_history('vod', Main_values_Play_data);
}

function PlayVod_Resume() {
    UserLiveFeed_Hide();
    Play_showBufferDialog();
    Play_ResumeAfterOnlineCounter = 0;

    //Get the time from android as it can save it more reliably
    Main_values.vodOffset = Android.getsavedtime() / 1000;

    window.clearInterval(Play_ResumeAfterOnlineId);

    if (navigator.onLine) PlayVod_ResumeAfterOnline();
    else Play_ResumeAfterOnlineId = window.setInterval(PlayVod_ResumeAfterOnline, 100);

    Play_EndSet(2);
    window.clearInterval(PlayVod_SaveOffsetId);
    PlayVod_SaveOffsetId = window.setInterval(PlayVod_SaveOffset, 60000);

    window.clearInterval(Play_ShowPanelStatusId);
    Play_ShowPanelStatusId = window.setInterval(function() {
        Play_UpdateStatus(2);
    }, 1000);
}

function PlayVod_ResumeAfterOnline(forced) {
    if (forced || navigator.onLine || Play_ResumeAfterOnlineCounter > 200) {
        window.clearInterval(Play_ResumeAfterOnlineId);
        PlayVod_state = Play_STATE_LOADING_TOKEN;
        PlayVod_loadDatanew();
    }
    Play_ResumeAfterOnlineCounter++;
}

function PlayVod_SaveOffset() {
    //Prevent setting it to 0 before it was used
    if (!Main_values.vodOffset) {
        Main_values.vodOffset = Main_IsOnAndroid ? (parseInt(Android.gettime() / 1000)) : 0;
        if (Main_values.vodOffset > 0) {
            Main_SaveValues();
            PlayVod_SaveVodIds();
        }
        Main_values.vodOffset = 0;
    }
}

//Browsers crash trying to get the streams link
function PlayVod_loadDataSuccessFake() {
    PlayVod_qualities = [
        {
            'id': 'Auto',
            'band': 0,
            'codec': 'avc',
        },
        {
            'id': '1080p60 | source ',
            'band': '| 10.00Mbps',
            'codec': ' | avc',
        },
        {
            'id': '720p60',
            'band': ' | 5.00Mbps',
            'codec': ' | avc',
        },
        {
            'id': '720p',
            'band': ' | 2.50Mbps',
            'codec': ' | avc',
        },
        {
            'id': '480p',
            'band': ' | 2.50Mbps',
            'codec': ' | avc',
        },
        {
            'id': '320p',
            'band': ' | 2.50Mbps',
            'codec': ' | avc',
        },
    ];
    PlayVod_state = Play_STATE_PLAYING;
    if (PlayVod_isOn) PlayVod_qualityChanged();
}

var PlayVod_autoUrl;
function PlayVod_loadDatanew() {
    if (Main_IsOnAndroid) {

        var StreamData = Play_getStreamData(Main_values.ChannelVod_vodId + '', false);

        if (StreamData) {
            StreamData = JSON.parse(StreamData);//obj status url responseText

            if (StreamData.status === 200) {
                PlayVod_autoUrl = StreamData.url;
                PlayVod_loadDataSuccessEnd(StreamData.responseText);
                return;
            } else if (StreamData.status === 1) {
                PlayVod_loadDataCheckSub();
                return;
            } else if (StreamData.status === 410) {
                //410 = api v3 is gone use v5 bug
                PlayVod_WarnEnd(STR_410_ERROR);
                return;
            }

        }

        PlayVod_loadDataErrorFinish();

    } else PlayVod_loadDataSuccessFake();
}

function PlayVod_loadDataErrorFinish() {
    if (Main_IsOnAndroid) {
        Play_HideBufferDialog();
        Play_PlayEndStart(2);
    } else PlayVod_loadDataSuccessFake();
}

function PlayVod_loadDataSuccessEnd(playlist) {

    PlayVod_playlist = playlist;
    //TODO revise the needed for PlayVod_state
    PlayVod_state = Play_STATE_PLAYING;
    if (PlayVod_isOn) PlayVod_onPlayer();
}

function PlayVod_loadDataCheckSub() {
    if (AddUser_UserIsSet() && AddUser_UsernameArray[0].access_token) {
        AddCode_Channel_id = Main_values.Main_selectedChannel_id;
        AddCode_CheckSub();
    } else PlayVod_WarnEnd(STR_IS_SUB_ONLY + STR_IS_SUB_NOOAUTH);
}

function PlayVod_NotSub() {
    PlayVod_WarnEnd(STR_IS_SUB_ONLY + STR_IS_SUB_NOT_SUB);
}

//TODO revise this
function PlayVod_isSub() {
    PlayVod_WarnEnd(STR_IS_SUB_ONLY + STR_IS_SUB_IS_SUB + STR_410_FEATURING);
}

var PlayVod_WarnEndId;
function PlayVod_WarnEnd(text) {
    Play_HideBufferDialog();
    Play_showWarningDialog(text);

    window.clearTimeout(PlayVod_WarnEndId);
    PlayVod_WarnEndId = window.setTimeout(function() {
        if (PlayVod_isOn) {
            Play_HideBufferDialog();
            Play_PlayEndStart(2);
        }
    }, 4000);
}

function PlayVod_qualityChanged() {
    PlayVod_qualityIndex = 1;

    for (var i = 0; i < PlayVod_getQualitiesCount(); i++) {
        if (PlayVod_qualities[i].id === PlayVod_quality) {
            PlayVod_qualityIndex = i;
            break;
        } else if (Main_A_includes_B(PlayVod_qualities[i].id, PlayVod_quality)) { //make shore to set a value before break out
            PlayVod_qualityIndex = i;
        }
    }

    PlayVod_quality = PlayVod_qualities[PlayVod_qualityIndex].id;
    PlayVod_qualityPlaying = PlayVod_quality;

    PlayVod_SetHtmlQuality('stream_quality');
    if (Main_IsOnAndroid) Android.SetQuality(PlayVod_qualityIndex - 1);
    else PlayVod_onPlayer();
    //Play_PannelEndStart(2);
}

function PlayVod_onPlayer() {
    if (Main_IsOnAndroid) {
        if (Main_values.vodOffset) {
            Chat_offset = Main_values.vodOffset;
            Chat_Init();
            PlayVod_onPlayerStartPlay(Main_values.vodOffset * 1000);
            Main_values.vodOffset = 0;
        } else {
            PlayVod_onPlayerStartPlay(Android.gettime());
        }
    }

    PlayVod_replay = false;
    if (Play_ChatEnable && !Play_isChatShown()) Play_showChat();
    Play_SetFullScreen(Play_isFullScreen);
}

function PlayVod_onPlayerStartPlay(time) {
    if (Main_IsOnAndroid && PlayVod_isOn) {
        Android.StartAuto(PlayVod_autoUrl, PlayVod_playlist, 2, PlayVod_replay ? -1 : time, 0);
    }
}

function PlayVod_shutdownStream() {
    if (PlayVod_isOn) {
        PlayVod_PreshutdownStream(true);
        PlayVod_qualities = [];
        PlayVod_playlist = null;
        Play_exitMain();
    }
}

function PlayVod_PreshutdownStream(saveOffset, PreventcleanQuailities) {
    if (saveOffset && Main_IsOnAndroid) {
        if ((Play_DurationSeconds - 300) > parseInt(Android.gettime() / 1000))
            PlayVod_SaveVodIds();
    }
    if (Main_IsOnAndroid) Android.stopVideo(2);
    Main_ShowElement('controls_holder');
    Main_ShowElement('progress_pause_holder');
    PlayVod_isOn = false;
    window.clearInterval(PlayVod_SaveOffsetId);
    window.clearTimeout(PlayVod_WarnEndId);
    Main_values.Play_WasPlaying = 0;
    Chat_Clear();
    UserLiveFeed_Hide(PreventcleanQuailities);
    Play_ClearPlayer();
    PlayVod_ClearVod();
}

function PlayVod_ClearVod() {
    document.body.removeEventListener("keydown", PlayVod_handleKeyDown);
    Main_values.vodOffset = 0;
    Play_DurationSeconds = 0;
}

function PlayVod_hidePanel() {
    //return;//return;
    PlayVod_jumpCount = 0;
    PlayVod_IsJumping = false;
    PlayVod_addToJump = 0;
    Play_clearHidePanel();
    Play_ForceHidePannel();
    if (Main_IsOnAndroid) PlayVod_ProgresBarrUpdate((Android.gettime() / 1000), Play_DurationSeconds, true);
    Main_innerHTML('progress_bar_jump_to', STR_SPACE);
    document.getElementById('progress_bar_steps').style.display = 'none';
    PlayVod_previews_hide();
    PlayVod_quality = PlayVod_qualityPlaying;
    window.clearInterval(PlayVod_RefreshProgressBarrID);
}

function PlayVod_showPanel(autoHide) {
    if (Play_getQualitiesFail) Play_getQualities(2, true);
    PlayVod_RefreshProgressBarr(autoHide);
    Play_clock();
    Play_CleanHideExit();
    window.clearInterval(PlayVod_RefreshProgressBarrID);
    PlayVod_RefreshProgressBarrID = window.setInterval(function() {
        PlayVod_RefreshProgressBarr(autoHide);
    }, 1000);

    if (autoHide) {
        PlayVod_IconsBottonResetFocus();
        PlayVod_qualityIndexReset();
        Play_qualityDisplay(PlayVod_getQualitiesCount, PlayVod_qualityIndex, PlayVod_SetHtmlQuality);
        if (!Main_A_includes_B(PlayVod_qualityPlaying, 'Auto')) PlayVod_SetHtmlQuality('stream_quality');
        Play_clearHidePanel();
        PlayExtra_ResetSpeed();
        PlayVod_setHidePanel();
    }
    Play_ForceShowPannel();
    if (PlayVod_muted_segments_warn && autoHide) PlayVod_muted_WarningDialog();
}

function PlayVod_RefreshProgressBarr(show) {
    if (!Play_Status_Always_On) {
        if (Main_IsOnAndroid && Main_A_includes_B(PlayVod_qualityPlaying, 'Auto') && show)
            Play_getVideoQuality(1);

        if (Main_IsOnAndroid) Play_VideoStatus(false);
        else Play_VideoStatusTest();
    }
}

function PlayVod_IconsBottonResetFocus() {
    PlayVod_PanelY = 1;
    PlayClip_EnterPos = 0;
    PlayVod_IconsBottonFocus();
}

function PlayVod_IconsBottonFocus() {
    if (PlayVod_PanelY < 0) {
        PlayVod_PanelY = 0;
        return;
    }
    Main_RemoveClass('pause_button', 'progress_bar_div_focus');
    Main_RemoveClass('next_button', 'progress_bar_div_focus');
    Main_RemoveClass('back_button', 'progress_bar_div_focus');
    Main_RemoveClass('progress_bar_div', 'progress_bar_div_focus');
    Main_HideElement('next_button_img_holder');
    Main_HideElement('back_button_img_holder');

    if (!PlayVod_PanelY) { //progress_bar
        Main_AddClass('progress_bar_div', 'progress_bar_div_focus');
        Play_IconsRemoveFocus();
        if (PlayVod_addToJump) {
            PlayVod_jumpTime();
            document.getElementById('progress_bar_steps').style.display = 'inline-block';
        }
    } else if (PlayVod_PanelY === 1) { //pause/next/back buttons
        if (!PlayClip_EnterPos) { //pause
            Main_AddClass('pause_button', 'progress_bar_div_focus');
        } else if (PlayClip_EnterPos === 1) { //next
            Main_ShowElement('next_button_img_holder');
            Main_AddClass('next_button', 'progress_bar_div_focus');
        } else if (PlayClip_EnterPos === -1) { //back
            Main_ShowElement('back_button_img_holder');
            Main_AddClass('back_button', 'progress_bar_div_focus');
        }

        Play_IconsRemoveFocus();
        Main_innerHTML('progress_bar_jump_to', STR_SPACE);
        document.getElementById('progress_bar_steps').style.display = 'none';
    } else if (PlayVod_PanelY === 2) { //botton icons
        Play_IconsAddFocus();
        Main_innerHTML('progress_bar_jump_to', STR_SPACE);
        document.getElementById('progress_bar_steps').style.display = 'none';
    }
}

function PlayVod_setHidePanel() {
    Play_PanelHideID = window.setTimeout(PlayVod_hidePanel, 5000 + PlayVod_ProgressBaroffset); // time in ms
}

function PlayVod_qualityIndexReset() {
    PlayVod_qualityIndex = 0;
    for (var i = 0; i < PlayVod_getQualitiesCount(); i++) {
        if (PlayVod_qualities[i].id === PlayVod_quality) {
            PlayVod_qualityIndex = i;
            break;
        } else if (Main_A_includes_B(PlayVod_qualities[i].id, PlayVod_qualities[i].id)) { //make shore to set a value before break out
            PlayVod_qualityIndex = i;
        }
    }
}

function PlayVod_SetHtmlQuality(element) {
    if (!PlayVod_qualities[PlayVod_qualityIndex] || !PlayVod_qualities[PlayVod_qualityIndex].hasOwnProperty('id')) return;

    PlayVod_quality = PlayVod_qualities[PlayVod_qualityIndex].id;

    var quality_string = '';
    if (Main_A_includes_B(PlayVod_quality, 'source')) quality_string = PlayVod_quality.replace("source", STR_SOURCE);
    else quality_string = PlayVod_quality;

    quality_string += !Main_A_includes_B(PlayVod_quality, 'Auto') ? PlayVod_qualities[PlayVod_qualityIndex].band + PlayVod_qualities[PlayVod_qualityIndex].codec : "";

    Main_textContent(element, quality_string);
}

function PlayVod_getQualitiesCount() {
    return PlayVod_qualities.length;
}

function PlayVod_ProgresBarrUpdate(current_time_seconds, duration_seconds, update_bar) {
    Main_textContent('progress_bar_current_time', Play_timeS(current_time_seconds));
    Play_ProgresBarrBufferElm.style.width = Math.ceil(((current_time_seconds + Play_BufferSize) / duration_seconds) * 100.0) + '%';

    if (update_bar) Play_ProgresBarrElm.style.width = ((current_time_seconds / duration_seconds) * 100) + '%';
}

function PlayVod_jump() {
    if (!Play_isEndDialogVisible()) {

        if (PlayVod_isOn) {
            Chat_Pause();
            Chat_offset = PlayVod_TimeToJump;
            Main_values.vodOffset = PlayVod_TimeToJump;
            Main_SaveValues();
            Main_values.vodOffset = 0;
        } else Chat_offset = ChannelVod_vodOffset;

        if (Main_IsOnAndroid) {
            Android.mseekTo(PlayVod_TimeToJump > 0 ? (PlayVod_TimeToJump * 1000) : 0);
        }
        window.setTimeout(PlayVod_SaveOffset, 1000);
        if (PlayClip_HasVOD) Chat_Init();
    }
    Main_innerHTML('progress_bar_jump_to', STR_SPACE);
    document.getElementById('progress_bar_steps').style.display = 'none';
    Main_innerHTML('pause_button', '<div ><i class="pause_button3d icon-pause"></i> </div>');
    PlayVod_jumpCount = 0;
    PlayVod_IsJumping = false;
    Play_BufferSize = Play_BufferSize - PlayVod_addToJump;
    PlayVod_addToJump = 0;
    PlayVod_TimeToJump = 0;
}

function PlayVod_SizeClear() {
    PlayVod_jumpCount = 0;
    PlayVod_StepsCount = 0;
    PlayVod_jumpSteps(Play_DefaultjumpTimers[1]);
}

function PlayVod_jumpSteps(duration_seconds) {
    if (PlayVod_addToJump && !PlayVod_PanelY) document.getElementById('progress_bar_steps').style.display = 'inline-block';
    if (Math.abs(duration_seconds) > 60)
        Main_textContent('progress_bar_steps', STR_JUMPING_STEP + (duration_seconds / 60) + STR_MINUTES);
    else if (duration_seconds)
        Main_textContent('progress_bar_steps', STR_JUMPING_STEP + duration_seconds + STR_SECONDS);
    else
        Main_textContent('progress_bar_steps', STR_JUMPING_STEP + Play_DefaultjumpTimers[1] + STR_SECONDS);
}

function PlayVod_jumpTime() {
    Main_textContent('progress_bar_jump_to', STR_JUMP_TIME + ' (' + (PlayVod_addToJump < 0 ? '-' : '') + Play_timeS(Math.abs(PlayVod_addToJump)) + ')' + STR_JUMP_T0 + Play_timeS(PlayVod_TimeToJump));
}

function PlayVod_jumpStart(multiplier, duration_seconds) {
    var currentTime = Main_IsOnAndroid ? (Android.gettime() / 1000) : 0;

    window.clearTimeout(PlayVod_SizeClearID);
    PlayVod_IsJumping = true;

    if (PlayVod_jumpCount < (Play_DefaultjumpTimers.length - 1) && (PlayVod_StepsCount++ % 6) === 0) PlayVod_jumpCount++;

    PlayVod_addToJump += Play_DefaultjumpTimers[PlayVod_jumpCount] * multiplier;
    PlayVod_TimeToJump = currentTime + PlayVod_addToJump;

    if (PlayVod_TimeToJump > (duration_seconds - 1)) {
        PlayVod_addToJump = duration_seconds - currentTime - 1;
        PlayVod_TimeToJump = currentTime + PlayVod_addToJump;
        PlayVod_jumpCount = 0;
        PlayVod_StepsCount = 0;
    } else if (PlayVod_TimeToJump < 0) {
        PlayVod_addToJump = 0 - currentTime;
        PlayVod_jumpCount = 0;
        PlayVod_StepsCount = 0;
        PlayVod_TimeToJump = 0;
    }

    PlayVod_jumpTime();
    var position = (PlayVod_TimeToJump / duration_seconds);
    Play_ProgresBarrElm.style.width = (position * 100) + '%';

    PlayVod_previews_move(position);

    PlayVod_jumpSteps(Play_DefaultjumpTimers[PlayVod_jumpCount] * multiplier);

    PlayVod_SizeClearID = window.setTimeout(PlayVod_SizeClear, 1000);
}

function PlayVod_SaveVodIds() {
    Main_history_UpdateVodClip(Main_values.ChannelVod_vodId, Main_IsOnAndroid ? (parseInt(Android.gettime() / 1000)) : 0, 'vod');
}

function Play_showVodDialog() {
    window.clearTimeout(Play_HideVodDialogId);
    Main_HideElement('controls_holder');
    PlayVod_showPanel(false);
    Main_textContent('stream_quality', '');
    Main_innerHTML("dialog_vod_saved_text", STR_FROM + Play_timeMs(PlayVod_VodOffset * 1000));
    Main_ShowElement('dialog_vod_start');
}

var Play_HideVodDialogId;
function Play_HideVodDialog() {
    PlayVod_hidePanel();
    Main_HideElement('dialog_vod_start');
    PlayVod_IconsResetFocus();
    window.clearTimeout(Play_HideVodDialogId);
    Play_HideVodDialogId = window.setTimeout(function() {
        Main_ShowElement('controls_holder');
    }, 1000);
}

function Play_isVodDialogVisible() {
    return Main_isElementShowing('dialog_vod_start');
}

function PlayVod_IconsResetFocus() {
    PlayVod_IconsRemoveFocus();
    PlayVod_VodPositions = 0;
    PlayVod_IconsAddFocus();
}

function PlayVod_IconsAddFocus() {
    Main_AddClass('dialog_vod_' + PlayVod_VodPositions, 'dialog_end_icons_focus');
}

function PlayVod_IconsRemoveFocus() {
    Main_RemoveClass('dialog_vod_' + PlayVod_VodPositions, 'dialog_end_icons_focus');
}

function PlayVod_DialogPressed(fromStart) {
    Play_HideVodDialog();
    Play_showBufferDialog();
    Main_ready(function() {
        if (!fromStart) PlayVod_DialogPressedClick(PlayVod_VodOffset);
        else {
            if (!HistoryVod.histPosX[1]) {
                Main_history_UpdateVodClip(Main_values.ChannelVod_vodId, 0, 'vod');
                Main_values.vodOffset = 0;
                PlayVod_Start();
            } else PlayVod_DialogPressedClick(0);
        }
    });
}

function PlayVod_DialogPressedClick(time) {
    Main_values.vodOffset = time;
    PlayVod_currentTime = Main_values.vodOffset * 1000;
    PlayVod_ProgresBarrUpdate(Main_values.vodOffset, Play_DurationSeconds, true);
    PlayVod_PosStart();
}

function PlayVod_OpenLiveStream() {
    PlayVod_PreshutdownStream(true, true);
    Main_OpenLiveStream(
        UserLiveFeed_FeedPosX + '_' + UserLiveFeed_FeedPosY[UserLiveFeed_FeedPosX],
        UserLiveFeed_ids,
        PlayVod_handleKeyDown,
        !UserLiveFeed_CheckVod()
    );
}

function PlayVod_handleKeyDown(e) {
    if (PlayVod_state !== Play_STATE_PLAYING && !Play_isVodDialogVisible()) {
        switch (e.keyCode) {
            case KEY_STOP:
                Play_CleanHideExit();
                PlayVod_shutdownStream();
                break;
            case KEY_KEYBOARD_BACKSPACE:
            case KEY_RETURN:
                if (Play_ExitDialogVisible() || Play_SingleClickExit) {
                    Play_CleanHideExit();
                    PlayVod_shutdownStream();
                } else {
                    Play_showExitDialog();
                }
                break;
            default:
                break;
        }
    } else {
        switch (e.keyCode) {
            case KEY_LEFT:
                if (UserLiveFeed_isFeedShow() && (!Play_EndFocus || !Play_isEndDialogVisible())) UserLiveFeed_KeyRightLeft(-1);
                else if (Play_isPanelShown() && !Play_isVodDialogVisible()) {
                    Play_clearHidePanel();
                    if (PlayVod_PanelY === 2) Play_BottomLeftRigt(2, -1);
                    else if (!PlayVod_PanelY) {
                        PlayVod_jumpStart(-1, Play_DurationSeconds);
                        PlayVod_ProgressBaroffset = 2500;
                    }
                    PlayVod_setHidePanel();
                } else if (Play_isVodDialogVisible()) {
                    PlayVod_IconsRemoveFocus();
                    if (PlayVod_VodPositions) PlayVod_VodPositions--;
                    else PlayVod_VodPositions++;
                    PlayVod_IconsAddFocus();
                } else if (Play_isEndDialogVisible()) {
                    Play_EndTextClear();
                    Play_EndIconsRemoveFocus();
                    Play_Endcounter--;
                    if (Play_Endcounter < 0) Play_Endcounter = 3;
                    if (Play_Endcounter === 1) Play_Endcounter = 0;
                    Play_EndIconsAddFocus();
                } else PlayVod_FastBackForward(-1);
                break;
            case KEY_RIGHT:
                if (UserLiveFeed_isFeedShow() && (!Play_EndFocus || !Play_isEndDialogVisible())) UserLiveFeed_KeyRightLeft(1);
                else if (Play_isPanelShown() && !Play_isVodDialogVisible()) {
                    Play_clearHidePanel();
                    if (PlayVod_PanelY === 2) Play_BottomLeftRigt(2, 1);
                    else if (!PlayVod_PanelY) {
                        PlayVod_jumpStart(1, Play_DurationSeconds);
                        PlayVod_ProgressBaroffset = 2500;
                    }
                    PlayVod_setHidePanel();
                } else if (Play_isVodDialogVisible()) {
                    PlayVod_IconsRemoveFocus();
                    if (PlayVod_VodPositions) PlayVod_VodPositions--;
                    else PlayVod_VodPositions++;
                    PlayVod_IconsAddFocus();
                } else if (Play_isEndDialogVisible()) {
                    Play_EndTextClear();
                    Play_EndIconsRemoveFocus();
                    Play_Endcounter++;
                    if (Play_Endcounter > 3) Play_Endcounter = 0;
                    if (Play_Endcounter === 1) Play_Endcounter = 2;
                    Play_EndIconsAddFocus();
                } else PlayVod_FastBackForward(1);
                break;
            case KEY_UP:
                if (Play_isEndDialogVisible() || UserLiveFeed_isFeedShow()) {
                    Play_EndTextClear();
                    document.body.removeEventListener("keydown", PlayVod_handleKeyDown, false);
                    document.body.addEventListener("keyup", Play_handleKeyUp, false);
                    Play_EndUpclear = false;
                    Play_EndUpclearCalback = PlayVod_handleKeyDown;
                    Play_EndUpclearID = window.setTimeout(Play_keyUpEnd, 250);
                } else if (Play_isPanelShown() && !Play_isVodDialogVisible()) {
                    Play_clearHidePanel();
                    if (PlayVod_PanelY < 2) {
                        PlayVod_PanelY--;
                        PlayVod_IconsBottonFocus();
                    } else Play_BottomUpDown(2, 1);
                    PlayVod_setHidePanel();
                } else if (!UserLiveFeed_isFeedShow() && !Play_isVodDialogVisible()) UserLiveFeed_ShowFeed();
                else if (!Play_isVodDialogVisible()) PlayVod_showPanel(true);
                break;
            case KEY_DOWN:
                if (Play_isEndDialogVisible()) Play_EndDialogUpDown(1);
                else if (Play_isPanelShown() && !Play_isVodDialogVisible()) {
                    Play_clearHidePanel();
                    if (PlayVod_PanelY < 2) {
                        PlayVod_PanelY++;
                        PlayVod_IconsBottonFocus();
                    } else Play_BottomUpDown(2, -1);
                    PlayVod_setHidePanel();
                } else if (UserLiveFeed_isFeedShow()) UserLiveFeed_KeyUpDown(1);
                else if (Play_isFullScreen && !Play_isPanelShown()) Play_controls[Play_controlsChat].enterKey(2);
                else if (!Play_isVodDialogVisible()) PlayVod_showPanel(true);
                break;
            case KEY_ENTER:
                if (Play_isVodDialogVisible()) PlayVod_DialogPressed(PlayVod_VodPositions);
                else if (Play_isEndDialogVisible()) {
                    if (Play_EndFocus) Play_EndDialogPressed(2);
                    else {
                        if (UserLiveFeed_obj[UserLiveFeed_FeedPosX].IsGame) UserLiveFeed_KeyEnter(UserLiveFeed_FeedPosX);
                        else {
                            Play_EndDialogEnter = 2;
                            Play_EndUpclearCalback = PlayVod_handleKeyDown;
                            Play_SavePlayData();
                            Main_OpenLiveStream(
                                UserLiveFeed_FeedPosX + '_' + UserLiveFeed_FeedPosY[UserLiveFeed_FeedPosX],
                                UserLiveFeed_ids,
                                PlayVod_handleKeyDown,
                                !UserLiveFeed_CheckVod()
                            );
                        }
                    }
                } else if (Play_isPanelShown()) {
                    Play_clearHidePanel();
                    if (!PlayVod_PanelY) {
                        if (PlayVod_IsJumping) PlayVod_jump();
                    } else if (PlayVod_PanelY === 1) {
                        if (Main_IsOnAndroid && !Play_isEndDialogVisible()) Android.PlayPauseChange();
                    } else Play_BottomOptionsPressed(2);
                    PlayVod_setHidePanel();
                } else if (UserLiveFeed_isFeedShow()) {
                    if (UserLiveFeed_obj[UserLiveFeed_FeedPosX].IsGame) UserLiveFeed_KeyEnter(UserLiveFeed_FeedPosX);
                    else if (!UserLiveFeed_CheckVod() || Play_CheckIfIsLiveStart()) PlayVod_OpenLiveStream();
                }
                else PlayVod_showPanel(true);
                break;
            case KEY_STOP:
                Play_CleanHideExit();
                PlayVod_shutdownStream();
                break;
            case KEY_KEYBOARD_BACKSPACE:
            case KEY_RETURN:
                Play_KeyReturn(true);
                break;
            case KEY_PLAY:
            case KEY_PLAYPAUSE:
            case KEY_KEYBOARD_SPACE:
                if (Main_IsOnAndroid && !Play_isEndDialogVisible()) Android.PlayPauseChange();
                break;
            case KEY_1:
                if (UserLiveFeed_isFeedShow()) {
                    if (UserLiveFeed_obj[UserLiveFeed_FeedPosX].IsGame) UserLiveFeed_KeyEnter(UserLiveFeed_FeedPosX);
                    else if (Play_CheckIfIsLiveStart()) PlayVod_OpenLiveStream();
                }
                break;
            case KEY_REFRESH:
                if (UserLiveFeed_isFeedShow()) UserLiveFeed_FeedRefresh();
                else if (!Play_isEndDialogVisible() && !Play_isPanelShown() &&
                    !Play_MultiDialogVisible() && !Play_isVodDialogVisible()) Play_controls[Play_controlsChatSide].enterKey();
                break;
            case KEY_CHAT:
                Play_controls[Play_controlsChat].enterKey(2);
                break;
            case KEY_MEDIA_REWIND:
            case KEY_PG_UP:
                if (UserLiveFeed_isFeedShow()) UserLiveFeed_KeyUpDown(-1);
                else if (Play_isChatShown()) Play_KeyChatPosChage();
                else PlayVod_showPanel(true);
                break;
            case KEY_PG_DOWN:
                if (UserLiveFeed_isFeedShow()) UserLiveFeed_KeyUpDown(1);
                else if (Play_isChatShown()) Play_KeyChatSizeChage();
                else PlayVod_showPanel(true);
                break;
            case KEY_MEDIA_FAST_FORWARD:
                if (Play_isEndDialogVisible()) break;

                if (UserLiveFeed_isFeedShow()) UserLiveFeed_FeedRefresh();
                else Play_controls[Play_controlsChatSide].enterKey();

                break;
            case KEY_MEDIA_NEXT:
            case KEY_MEDIA_PREVIOUS:
                if (Play_isPanelShown()) PlayVod_hidePanel();
                else PlayVod_showPanel(true);
                break;
            default:
                break;
        }
    }
}

function PlayVod_FastBackForward(position) {
    if (!Play_isPanelShown()) PlayVod_showPanel(true);
    Play_clearHidePanel();
    PlayVod_PanelY = 0;
    PlayVod_IconsBottonFocus();

    PlayVod_jumpStart(position, Play_DurationSeconds);
    PlayVod_ProgressBaroffset = 2500;
    PlayVod_setHidePanel();
}

var PlayVod_previews_url;

function PlayVod_previews_pre_start(seek_previews_url) {
    if (!seek_previews_url) return;

    PlayVod_previews_url = seek_previews_url;
    PlayVod_previews_clear();

    if (Main_IsOnAndroid) PlayVod_previews_start();
    //else PlayVod_previews_start_test();
}

function PlayVod_previews_clear() {
    PlayVod_previews_hide();
    PlayVod_previews_obj.images = [];
    PlayVod_previews_images_pos = -1;
}

function PlayVod_previews_start() {
    try {
        Android.GetPreviews(PlayVod_previews_url);
    } catch (e) {}
}

var PlayVod_previews_obj = {};
PlayVod_previews_obj.images = [];

var PlayVod_previews_images_pos = -1;
var PlayVod_previews_images_load = false;
var PlayVod_previews_tmp_images = [];

var PlayVod_previews_scale = 1.55;

function PlayVod_previews_hide() {
    Play_seek_previews.classList.add('hideimp');
    PlayVod_previews_images_load = false;
}

function PlayVod_previews_show() {
    PlayVod_previews_images_load = true;
    Play_seek_previews.classList.remove('hideimp');
}

function PlayVod_previews_success(result) {
    if (!result) {
        PlayVod_previews_hide();
        return;
    }

    result = JSON.parse(result);

    if (result.length) {
        PlayVod_previews_obj = result[result.length - 1];

        if (PlayVod_previews_obj.images.length && Main_A_includes_B(PlayVod_previews_obj.images[0], Main_values.ChannelVod_vodId)) PlayVod_previews_success_end();
        else PlayVod_previews_clear();
    }
}

function PlayVod_previews_success_end() {
    PlayVod_previews_obj.width = PlayVod_previews_obj.width * scaleFactor * PlayVod_previews_scale;
    PlayVod_previews_obj.height = PlayVod_previews_obj.height * scaleFactor * PlayVod_previews_scale;

    Play_seek_previews.style.width = PlayVod_previews_obj.width + 'px';
    Play_seek_previews.style.height = PlayVod_previews_obj.height + 'px';

    Play_seek_previews.style.backgroundSize = (PlayVod_previews_obj.cols * PlayVod_previews_obj.width) + "px";

    var base_url = PlayVod_previews_url.split(Main_values.ChannelVod_vodId)[0];
    PlayVod_previews_tmp_images = [];

    for (var i = 0; i < PlayVod_previews_obj.images.length; i++) {
        PlayVod_previews_obj.images[i] = base_url + PlayVod_previews_obj.images[i];

        PlayVod_previews_tmp_images[i] = new Image();

        PlayVod_previews_tmp_images[i].src = PlayVod_previews_obj.images[i];

    }

}

function PlayVod_previews_move(position) {
    if (!PlayVod_previews_obj.images.length || !PlayVod_isOn) {
        PlayVod_previews_hide();
        return;
    }

    position = parseInt(position * PlayVod_previews_obj.count);
    var imagePos = parseInt(position / (PlayVod_previews_obj.cols * PlayVod_previews_obj.rows)) % PlayVod_previews_obj.images.length;

    // console.log('position ' + position + ' w ' + (position % PlayVod_previews_obj.cols) + ' h ' +
    //     parseInt(position / PlayVod_previews_obj.cols) + ' p ' + imagePos);

    if (!PlayVod_previews_images_load || imagePos !== PlayVod_previews_images_pos) {

        PlayVod_previews_images_pos = imagePos;
        PlayVod_previews_images_load = false;

        var imgurl = PlayVod_previews_obj.images[imagePos];

        Play_seek_previews_img.onload = function() {

            this.onload = null;
            Play_seek_previews.style.backgroundImage = "url('" + imgurl + "')";
            PlayVod_previews_show();

        };

        Play_seek_previews_img.onerror = function() {

            this.onerror = null;
            PlayVod_previews_hide();

        };

        Play_seek_previews_img.src = imgurl;

    }

    Play_seek_previews.style.backgroundPosition = (-PlayVod_previews_obj.width * (position % PlayVod_previews_obj.cols)) + "px " +
        (-PlayVod_previews_obj.height * (parseInt(position / PlayVod_previews_obj.cols) % PlayVod_previews_obj.rows)) + "px";
}

// function PlayVod_previews_start_test() {
//     PlayVod_previews_clear();
//     console.log(PlayVod_previews_url);

//     PlayVod_previews_hide();
//     if (!PlayVod_previews_url) return;

//     PlayVod_previews_obj = {
//         "count": 200,
//         "width": 220,
//         "rows": 10,
//         "images": [Main_values.ChannelVod_vodId + "-high-0.jpg", Main_values.ChannelVod_vodId + "-high-1.jpg", Main_values.ChannelVod_vodId + "-high-2.jpg", Main_values.ChannelVod_vodId + "-high-3.jpg"],
//         "interval": 55,
//         "quality": "high",
//         "cols": 5,
//         "height": 124
//     };

//     PlayVod_previews_success_end();
// }

var PlayVod_muted_segments_warn = false;
var PlayVod_muted_segments_value = null;
function PlayVod_muted_segments(muted_segments, skipwarning) {
    if (muted_segments && muted_segments.length) {

        var doc = document.getElementById('inner_progress_bar_muted'), div;
        Main_emptyWithEle(doc);

        for (var i = 0; i < muted_segments.length; i++) {

            div = document.createElement('div');
            div.classList.add('inner_progress_bar_muted_segment');
            div.style.left = ((muted_segments[i].offset / Play_DurationSeconds) * 100) + '%';
            div.style.width = ((muted_segments[i].duration / Play_DurationSeconds) * 100) + '%';

            doc.appendChild(div);
        }
        if (!skipwarning) PlayVod_muted_segments_warn = true;
    } else {
        PlayVod_muted_segments_warn = false;
        Main_empty('inner_progress_bar_muted');
    }
}

var PlayVod_muted_WarningDialogId;
function PlayVod_muted_WarningDialog() {
    PlayVod_muted_segments_warn = false;
    Main_innerHTML("dialog_warning_muted_text", STR_VOD_MUTED);
    Main_ShowElement('dialog_warning_muted');

    window.clearTimeout(PlayVod_muted_WarningDialogId);
    PlayVod_muted_WarningDialogId = window.setTimeout(function() {
        Main_HideElement('dialog_warning_muted');
    }, 5000);
}