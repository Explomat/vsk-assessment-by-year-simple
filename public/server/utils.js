function toJSON(data){
	return tools.object_to_text(data, 'json');
}

function log(message){
	EnableLog('assessment');
	LogEvent('assessment', message);
}

function setMessage(type, message){
	return {
		type: type,
		message: String(message)
	}
}

function setSuccess(data){
	var m = setMessage('success');
	m.data = data;
	return toJSON(m);
}

function setError(message){
	log(message);
	return toJSON(setMessage('error', message));
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

function toBoolean(val) {
	if (val == 'true') {
		return true;
	}

	if (val == true) {
		return true;
	}

	return false;
}

function _isContains(_ids, _id) {
	for (i = _ids.length - 1; i >= 0; i--) {
		if (_ids[i] == _id) {
			return true;
		}
	}

	return false;
}

function notificate(templateCode, primaryId, secondaryId, text){
	var ids = [6605156524408652638];
	if (!_isContains(ids, primaryId)) {
		tools.create_notification(templateCode, primaryId, text, secondaryId);
		log('notificate: "templateCode": ' + templateCode + ', "primaryId": ' + primaryId + ', "text": ' + text + ', "secondaryId": ' + secondaryId);
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

function statusNameByStatusId(statusId){
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select p.name \n\
		from [common.assessment_appraise_participants] p \n\
		where p.id = '" + statusId + "'"
	));
	return q == undefined ? q : q.name;
}

function docWvars(id){
	var doc = OpenDoc(UrlFromDocID(Int(id)));

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

	return result;
}