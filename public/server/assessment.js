
function _setComputedFields(curUserID, userId, bossId, step) {
	var User = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/user.js');

	var actions = User.getActions(curUserID, 'pa');
	var updateAction = (ArrayOptFind(actions, "This == 'update'") != undefined;

	return {
		curUserID: curUserID,
		canEditSelf: ((curUserID == userId && String(step) == '1') || updateAction != undefined),
		canEditBoss: ((curUserID == bossId && String(step) == '2') || updateAction != undefined)
	}
}


function create(userId, assessmentAppraiseId) {
	var Settings = OpenCodeLib('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	DropFormsCache('x-local://wt/web/vsk/portal/assessment_by_quarter/server/settings.js');
	var bsettings = Settings.baseSettings(assessmentAppraiseId);


	var isBoss = User.isBoss(userId);
	//alert('createInitialProfile_2');

	var profileId = isBoss ? bsettings.GetOptProperty('manager_competence_profile_id') : bsettings.GetOptProperty('self_competence_profile_id');
	//alert('createInitialProfile_3');
	//alert('bsettings:' + tools.object_to_text(bsettings, 'json'));
	//alert('createInitialProfile_profileId: ' + profileId);
	if (profileId == undefined) {
		//alert('createInitialProfile_4');
		throw 'Не найден профиль вашей оценки.';
	}

	var profileCompetences = OpenDoc(UrlFromDocID(profileId)).TopElem.competences;
	//alert('createInitialProfile_5');
	var userBoss = User.getBoss(userId);
	//alert('createInitialProfile_6');
	var userBossId = userBoss != undefined ? userBoss.person_id : null;
	//alert('createInitialProfile_7');

	//план оценки
	var docPlan = tools.new_doc_by_name('assessment_plan');
	docPlan.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
	docPlan.TopElem.boss_id = userBossId;
	docPlan.TopElem.workflow_id = bsettings.workflow_id;
	docPlan.TopElem.workflow_state = 1;
	docPlan.TopElem.person_id = userId;
	docPlan.BindToDb(DefaultDb);
	docPlan.Save();

	//alert('createInitialProfile_8');

	//самооценка
	var docSelf = tools.new_doc_by_name('pa');
	docSelf.TopElem.assessment_appraise_type = 'competence_appraisal';
	docSelf.TopElem.competence_profile_id = profileId;
	docSelf.TopElem.status = 'self';
	docSelf.TopElem.assessment_appraise_id = bsettings.assessment_appraise_id;
	docSelf.TopElem.workflow_id = bsettings.workflow_id;
	docSelf.TopElem.workflow_state = 1;
	docSelf.TopElem.person_id = userId;
	docSelf.TopElem.expert_person_id = userId;
	docSelf.TopElem.competences.AssignElem(profileCompetences);
	docSelf.TopElem.assessment_plan_id = docPlan.DocID;
	docSelf.BindToDb(DefaultDb);
	docSelf.Save();
	//alert('createInitialProfile_8');

	return docSelf;
}

function complete(userId, assessmentAppraiseId) {
	var q = ArrayOptFirstElem(XQuery("sql: \n\
		select pas.id \n\
		from \n\
			pas \n\
		where \n\
			pas.assessment_appraise_id = " + assessmentAppraiseId + " \n\
			and pas.person_id = " + userId + " \n\
			and pas.expert_person_id = " + userId
	));

	if (q != undefined){
		var paCard = OpenDoc(UrlFromDocID(Int(q.id)));
		paCard.TopElem.is_done = true;

		var wDoc = OpenDoc(UrlFromDocID(Int(paCard.TopElem.workflow_id)));
		var wstateElem = ArrayOptFind(wDoc.TopElem.states, 'This.code == ' + 4);

		//paCard.TopElem.comment = comment;
		paCard.TopElem.workflow_state = 4;
		paCard.TopElem.workflow_state_name = (wstateElem != undefined ? wstateElem.name : '');
		paCard.Save();

		var docPlan = OpenDoc(UrlFromDocID(paCard.TopElem.assessment_plan_id));
		docPlan.TopElem.workflow_state = 4;
		docPlan.TopElem.is_done = true;
		docPlan.Save();
	}
}

function update(paId, _competences, overall, wstate) {
	var curPaCard = OpenDoc(UrlFromDocID(Int(paId)));
	for (elem in _competences) {
		comp = ArrayOptFind(curPaCard.TopElem.competences, 'This.competence_id == ' + elem.competence_id);
		if (comp != undefined) {
			comp.mark_value = elem.mark_value;
			comp.mark_text = elem.mark_text;
			comp.comment = elem.comment;
			for (indicator in elem.indicators) {
				ind = ArrayOptFind(comp.indicators, 'This.indicator_id == ' + indicator.indicator_id);
				if (ind != undefined) {
					ind.mark_value = indicator.mark_value;
					ind.mark_text = indicator.mark_text;
					ind.comment = indicator.comment;
				}
			}
		}
	}

	curPaCard.TopElem.overall = overall;
	curPaCard.TopElem.workflow_state = wstate;

	var wDoc = OpenDoc(UrlFromDocID(Int(curPaCard.TopElem.workflow_id)));
	var wstateElem = ArrayOptFind(wDoc.TopElem.states, 'This.code == ' + wstate);

	curPaCard.TopElem.workflow_state_name = (wstateElem != undefined ? wstateElem.name : '');;
	curPaCard.Save();

	var docPlan = OpenDoc(UrlFromDocID(curPaCard.TopElem.assessment_plan_id));
	docPlan.TopElem.workflow_state = wstate;
	docPlan.Save();

	return curPaCard;
}
