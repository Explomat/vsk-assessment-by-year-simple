function getSystemSettings(assessmentAppraiseId) {
	var el = ArrayOptFirstElem(
		XQuery("sql: \n\
			select s.id \n\
			from cc_assessment_settings s \n\
			where s.assessment_appraise_id = " + assessmentAppraiseId + "\n\
		")
	);

	return OpenDoc(UrlFromDocID(Int(el.id)));
}

function toJSON(data) {
	return tools.object_to_text(data, 'json');
}

function log(message) {
	EnableLog('idp');
	LogEvent('idp', message);
}

function setMessage(type, message) {
	return {
		type: type,
		message: String(message)
	}
}

function setSuccess(data) {
	var m = setMessage('success');
	m.data = data;
	return toJSON(m);
}

function setError(message){
	log(message);
	return toJSON(setMessage('error', message));
}

function toBoolean(val) {
	if (val == 'true') {
		return true;
	}

	if (val == true) {
		return true;
	}

	return false;
}

function toJSObject(xmlElem) {
	var returnObj = {};
	for (el in xmlElem){
		try {
			returnObj.SetProperty(el.Name, String(el.Value));
		} catch(e) {}
	}
	return returnObj;
}

function toJSArray(xmlArray) {
	var returnArr = [];

	for (el in xmlArray) {
		returnArr.push(toJSObject(el));
	}

	return returnArr;
}

function notificate(templateCode, primaryId, secondaryId, text){
	var Notifications = OpenCodeLib('x-local://wt/web/vsk/portal/common/aggregateNotifications.js');
	
	var isNotificate = Notifications.notificate('assessment', templateCode, primaryId, text, secondaryId);
	if (isNotificate) {
		log('Отправка уведомления "' + templateCode + '", сотруднику "' + primaryId + '"');
	} else {
		log('Ошибка отправки уведомления "' + templateCode + '", сотруднику "' + primaryId + '"');
	}
}

function getCommonAssessments(assessmentAppraiseId) {
	return XQuery("sql: \n\
		select ccac.scale, ccac.[description], ccac.color, ccac.[percent] \n\
		from cc_assessment_commons ccac \n\
		where \n\
			ccac.assessment_appraise_id = " + assessmentAppraiseId + " \n\
	");
}