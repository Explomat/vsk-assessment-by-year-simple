function baseSettings(assessmentAppraiseId) {

	//var ASSESSMENT_APPRAISE_ID = 6790263731625424310;
	var doc = OpenDoc(UrlFromDocID(OptInt(assessmentAppraiseId)));
	var obj = {
		assessment_appraise_id: assessmentAppraiseId,
		workflow_id: OptInt(doc.TopElem.workflow_id),
		steps: {
			first: 'first',
			second: 'second'
		}
	}

	for (el in doc.TopElem.participants) {
		aatElem = ArrayOptFind(el.assessment_appraise_types, 'This.assessment_appraise_type_id == "competence_appraisal"');
		if (aatElem != undefined) {
			obj.SetProperty((String(el.participant_id) + '_competence_profile_id'), OptInt(aatElem.competence_profile_id));
		}
	}

	return obj;
}