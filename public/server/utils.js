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
	EnableLog('assessment');
	LogEvent('assessment', message);
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

function notificate(templateCode, primaryId, secondaryId, text){
	var Notifications = OpenCodeLib('x-local://wt/web/vsk/portal/common/aggregateNotifications.js');
	
	var isNotificate = Notifications.notificate('assessment', templateCode, primaryId, text, secondaryId);
	if (isNotificate) {
		log('Отправка уведомления "' + templateCode + '", сотруднику "' + primaryId + '"');
	} else {
		log('Ошибка отправки уведомления "' + templateCode + '", сотруднику "' + primaryId + '"');
	}
}

function instruction(assessmentAppraiseId) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select \n\
			t.p.query('text_area').value('.','varchar(MAX)') as instruction \n\
		from \n\
			documents ds \n\
		join document d on d.id = ds.id \n\
		cross apply d.data.nodes('/document') AS t(p) \n\
		where \n\
			ds.id in ( \n\
				select \n\
					t.p.query('manual_document_id').value('.','varchar(250)') as doc_id \n\
				from \n\
					assessment_appraises aas \n\
				join \n\
					assessment_appraise aa on aa.id = aas.id \n\
				cross apply aa.data.nodes('/assessment_appraise') AS t(p) \n\
				where \n\
					aas.id = " + assessmentAppraiseId + " \n\
			)"
	));
	return q == undefined ? '' : q.instruction;
}

function getCommonAssessments(assessmentAppraiseId) {

	return XQuery("sql: \n\
		select ccac.scale, ccac.[description], ccac.color, ccac.[percent] \n\
		from cc_assessment_commons ccac \n\
		where \n\
			ccac.assessment_appraise_id = " + assessmentAppraiseId + " \n\
	");

	/*var doc = OpenDoc(UrlFromDocID(Int(id)));

	var legends = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.legends'");
	var colors = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.colors'");
	var percents = ArrayOptFind(doc.TopElem.wvars, "This.name == 'assessment_by_year.percents'");


	var result = [];
	for (l in legends.entries) {
		obj = {
			scale: String(l.id),
			description: String(l.name)
		}

		cEntrie = ArrayOptFind(colors.entries, "This.id == '" + l.id + "'");
		obj.color = String(cEntrie.name);

		pEntrie = ArrayOptFind(percents.entries, "This.id == '" + l.id + "'");
		obj.percent = String(pEntrie.name);
		result.push(obj);
	}

	return result;*/
}